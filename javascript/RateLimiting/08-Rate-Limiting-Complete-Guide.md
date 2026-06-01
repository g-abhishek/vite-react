# Rate Limiting — Complete Guide (Basics to Advanced)

> Teaching rate limiting from first principles — what it is, why it exists, how every algorithm works internally, when to choose each one, and how to build production-grade systems in JavaScript/Node.js.

---

## Table of Contents

1. [What is Rate Limiting? — The Real Explanation](#1-what-is-rate-limiting--the-real-explanation)
2. [Why Rate Limiting Matters — The Problems It Solves](#2-why-rate-limiting-matters--the-problems-it-solves)
3. [Core Concepts & Mental Models](#3-core-concepts--mental-models)
4. [Algorithm 1 — Fixed Window Counter](#4-algorithm-1--fixed-window-counter)
5. [Algorithm 2 — Sliding Window Log](#5-algorithm-2--sliding-window-log)
6. [Algorithm 3 — Sliding Window Counter](#6-algorithm-3--sliding-window-counter)
7. [Algorithm 4 — Token Bucket](#7-algorithm-4--token-bucket)
8. [Algorithm 5 — Leaky Bucket](#8-algorithm-5--leaky-bucket)
9. [Token Bucket vs Leaky Bucket — The Deep Difference](#9-token-bucket-vs-leaky-bucket--the-deep-difference)
10. [Algorithm Comparison — Full Matrix](#10-algorithm-comparison--full-matrix)
11. [Where to Apply Rate Limiting in Architecture](#11-where-to-apply-rate-limiting-in-architecture)
12. [Rate Limit Keys — Identifying Who to Limit](#12-rate-limit-keys--identifying-who-to-limit)
13. [Distributed Rate Limiting with Redis](#13-distributed-rate-limiting-with-redis)
14. [HTTP Headers & Client Communication](#14-http-headers--client-communication)
15. [Rate Limiting in Express.js](#15-rate-limiting-in-expressjs)
16. [Rate Limiting on the Client Side](#16-rate-limiting-on-the-client-side)
17. [Advanced Patterns](#17-advanced-patterns)
18. [When to Use Which Algorithm — Decision Guide](#18-when-to-use-which-algorithm--decision-guide)
19. [Common Pitfalls & How to Avoid Them](#19-common-pitfalls--how-to-avoid-them)

---

## 1. What is Rate Limiting? — The Real Explanation

### Start from scratch: what problem are we solving?

Imagine you run a coffee shop. One customer walks in and orders 500 coffees at once — your machine breaks, your staff is overwhelmed, and every other customer gets nothing. That is exactly what can happen to a server without rate limiting.

In software, **rate limiting is a policy that controls how many requests a client can make within a given time period**. When they exceed that limit, their subsequent requests are rejected (usually with HTTP 429 Too Many Requests) until the window resets.

But rate limiting is not just about rejecting bad actors. It's about **protecting a shared resource** so that every legitimate client gets fair, reliable access.

### The fundamental contract

Rate limiting defines a contract:

```
"Client X can make at most N requests in every T seconds."
```

Every algorithm is just a different way to enforce and measure this contract. They differ in:
- How they track time (fixed window vs sliding)
- How they track count (counter vs log vs tokens)
- How they handle bursts (allow vs queue vs reject)
- What they cost (memory, CPU, network)

### What rate limiting is NOT

It is important to understand the boundaries:

```
Rate Limiting   → Reject requests that exceed a count threshold
Throttling      → Slow down responses (add artificial delay, still respond)
Load Balancing  → Distribute traffic across multiple servers
Circuit Breaking → Stop calling a downstream service when it is unhealthy
Quotas          → Hard daily/monthly caps (usually business-level, not real-time)
```

These are related but distinct. You can and often should use multiple techniques together. For example: rate limit at the edge to stop DDoS, circuit break at the service layer to stop cascades.

---

## 2. Why Rate Limiting Matters — The Problems It Solves

### Problem 1: Server Overload (The Thundering Herd)

Every server has a finite capacity — CPU, memory, database connections, bandwidth. If 10,000 clients all send requests at once:

```
Normal load:
  100 clients × 1 req/sec = 100 req/sec → Server handles fine

Thundering herd:
  100 clients × 100 req/sec = 10,000 req/sec → Server crashes
                                              → Memory exhausted
                                              → Database connection pool full
                                              → ALL clients get 503 errors
```

Rate limiting prevents this by capping each client's contribution to total load.

### Problem 2: Brute Force Attacks

Without rate limiting on authentication endpoints, an attacker can try millions of passwords:

```
// Attacker's script — no rate limiting = easy to run
for (let password of passwordList) {         // 10 million passwords
  await fetch('/api/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'victim@example.com', password })
  });
}
// Takes minutes with fast internet. Zero cost to attacker.
```

With rate limiting (5 attempts per minute per IP):

```
10,000,000 passwords ÷ 5 per minute = 2,000,000 minutes = ~3.8 years
```

The attack becomes computationally infeasible.

### Problem 3: API Abuse & Scraping

SaaS companies charge based on usage. Without rate limits, a free-tier user could:
- Scrape your entire database in minutes
- Consume $10,000 worth of compute on a free plan
- Extract all your data and take it to a competitor

### Problem 4: Unintentional Self-DoS

This is often overlooked. A bug in your own frontend code can cause a denial-of-service against your own backend:

```javascript
// Bug: retry loop with no backoff — hammers the server
async function fetchUser(id) {
  while (true) {
    try {
      return await fetch(`/api/users/${id}`);
    } catch (e) {
      // No delay! Retries instantly, forever.
      continue;
    }
  }
}
```

Rate limiting protects against this too — your own broken client gets rate limited, not the entire server.

### Problem 5: Cost Control for Paid Services

If your app calls GPT-4, sends SMS, or queries a paid data provider, an infinite loop or a misbehaving client can generate enormous costs in seconds. Rate limiting is your circuit breaker.

---

## 3. Core Concepts & Mental Models

### The fundamental variables

Before we look at algorithms, understand the three variables every rate limiter manages:

```
Rate (N)     — How many requests are allowed
Window (T)   — In what time period (per second, per minute, per hour)
Identity (K) — Who is being limited (an IP, a user, an API key)
```

Every rate limit rule is expressed as: **"Identity K can make N requests per T"**

Examples:
- `IP 1.2.3.4 can make 100 requests per minute`
- `User #42 can make 1000 requests per hour`
- `API key abc123 can make 10 requests per second`

### What the rate limiter must answer

For every incoming request, the rate limiter must answer one binary question:

```
"Given identity K at time T — should this request be allowed or rejected?"
```

That's it. All the complexity of every algorithm is just different ways of answering this question accurately, efficiently, and fairly.

### The state problem

To answer that question, the rate limiter needs **memory** — it must remember past requests. This is where things get interesting and where algorithms diverge.

```
What state do we need to keep?

Fixed Window Counter  → one integer per (identity, window)
Sliding Window Log    → list of timestamps per identity (up to N entries)
Sliding Window Counter→ two integers per identity (current + previous window)
Token Bucket          → two numbers per identity (current tokens, last refill time)
Leaky Bucket          → one number per identity (current queue size) + actual queue
```

Less state = faster and cheaper to run. But sometimes accuracy requires more state.

### The time dimension — the hardest part

The trickiest part of rate limiting is tracking time correctly. Time is continuous, but computers work in discrete steps. Every algorithm makes a different tradeoff about how it maps continuous time into a data structure.

```
Continuous time:  ──────────────────────────────────────────────►
                    req  req      req req req        req

Fixed Window:     [─────── window 1 ──────][─── window 2 ───────]
                   count=1  count=2  count=3,4,5     count=1

Sliding Window:   ← always look back exactly T seconds from NOW →
                  |←──────── T ────────────|
                                            NOW

Token Bucket:     Tokens accumulate at a steady rate, consumed on use
                  [████████░░░]  [██████████]  [████░░░░░░]
                   8 tokens      full (10)      4 tokens
```

Each model has implications for accuracy, fairness, and complexity.

---

## 4. Algorithm 1 — Fixed Window Counter

### The idea — start here, it's the simplest

The Fixed Window Counter is the simplest possible rate limiting algorithm. Here's the mental model:

**Imagine a wall clock. Every minute, a counter resets to zero. Each request increments the counter. If the counter reaches the limit, reject requests until the clock ticks to the next minute.**

That's it. No fancy math. Just a counter that resets on a schedule.

### How the window is calculated

The key insight is how we assign requests to windows. We use integer division:

```javascript
// Which minute does this request belong to?
//
// Date.now() returns milliseconds since epoch — a continuous ever-growing number.
// We need to collapse all timestamps in the same minute into ONE number (the bucket).
//
// Math.floor(ms / 60_000) does exactly that:
//   60_000 = 60 seconds × 1000ms = milliseconds in one minute
//   Dividing converts ms → minutes, floor() drops the fractional part (position within the minute)
//   Result: every timestamp in the same minute produces the same integer → same bucket key.
//
// Change the divisor to change the window size:
//   1 second  → Date.now() / 1_000
//   1 minute  → Date.now() / 60_000
//   15 minutes→ Date.now() / 900_000
//   1 hour    → Date.now() / 3_600_000
const windowIndex = Math.floor(Date.now() / 60_000);
// At 14:03:27 → Math.floor(1710533007000 / 60000) → 28508883
// At 14:03:59 → Math.floor(1710533039000 / 60000) → 28508883  (same window!)
// At 14:04:00 → Math.floor(1710533040000 / 60000) → 28508884  (new window!)
```

All requests within the same minute map to the same window index. That index becomes part of the key in our counter store.

### Step-by-step flow

```
1. Request arrives for user "alice" at time 14:03:27
2. Compute window key:
     windowIdx = floor(1710533007000 / 60000) = 28508883
     storeKey  = "rl:alice:28508883"
3. Get current count from store → e.g., 42
4. Is 42 >= 100 (limit)? → NO
5. Increment counter in store → 43
6. If this was the FIRST request (count was 0), set TTL = 60 seconds
7. Allow the request

--- Later ---

8. Counter reaches 100
9. Request 101 arrives
10. Get count → 100
11. Is 100 >= 100? → YES
12. Return 429 with reset time = start of next window
```

### Detailed Flow Diagram

```
                    Request arrives
                          │
                          ▼
             ┌────────────────────────┐
             │  windowIdx =           │
             │  floor(now / windowMs) │
             └────────────┬───────────┘
                          │
                          ▼
             ┌────────────────────────┐
             │  key = userId:windowIdx│
             └────────────┬───────────┘
                          │
                          ▼
             ┌────────────────────────┐
             │  count = store.get(key)│
             │  (0 if not exists)     │
             └────────────┬───────────┘
                          │
                   ┌──────┴──────┐
                   │             │
              count >= limit?    │
                   │             │
                  YES            NO
                   │             │
                   ▼             ▼
            Return 429     Increment count
            Remaining: 0   Set TTL if new
            Reset: next    Allow request
            window start   Return remaining
```

### Full Implementation

```javascript
class FixedWindowRateLimiter {
  /**
   * @param {number} limit    - Max requests allowed per window
   * @param {number} windowMs - Window size in milliseconds
   */
  constructor({ limit, windowMs }) {
    this.limit = limit;
    this.windowMs = windowMs;
    // key → { count, windowStart }
    // In production, this is Redis. Here, in-memory Map for learning.
    this.store = new Map();
  }

  check(key) {
    const now = Date.now();

    // Step 1: Compute which window this request belongs to
    // e.g., windowMs=60000 → every minute gets a unique integer
    const windowIndex = Math.floor(now / this.windowMs);
    const storeKey = `${key}:${windowIndex}`;

    // Step 2: Compute when this window started and when it ends
    const windowStart = windowIndex * this.windowMs;
    const windowEnd = windowStart + this.windowMs;
    const resetAt = new Date(windowEnd);

    // Step 3: Read current count
    const entry = this.store.get(storeKey);

    if (!entry) {
      // First request in this window — create the entry
      this.store.set(storeKey, { count: 1 });

      // Schedule cleanup after window expires (prevents memory leak)
      setTimeout(() => this.store.delete(storeKey), this.windowMs);

      return {
        allowed: true,
        count: 1,
        remaining: this.limit - 1,
        limit: this.limit,
        resetAt,
      };
    }

    // Step 4: Check if limit exceeded
    if (entry.count >= this.limit) {
      return {
        allowed: false,
        count: entry.count,
        remaining: 0,
        limit: this.limit,
        resetAt, // Tell client exactly when they can retry
      };
    }

    // Step 5: Increment and allow
    entry.count++;
    return {
      allowed: true,
      count: entry.count,
      remaining: this.limit - entry.count,
      limit: this.limit,
      resetAt,
    };
  }
}

// ─── Demo ──────────────────────────────────────────────────────────────────

const limiter = new FixedWindowRateLimiter({ limit: 3, windowMs: 5000 });

// Simulate 5 rapid requests
for (let i = 1; i <= 5; i++) {
  const result = limiter.check('user:alice');
  console.log(
    `Request ${i}: ${result.allowed ? '✅ ALLOWED' : '❌ BLOCKED'} | ` +
    `count=${result.count} | remaining=${result.remaining}`
  );
}

// Output:
// Request 1: ✅ ALLOWED | count=1 | remaining=2
// Request 2: ✅ ALLOWED | count=2 | remaining=1
// Request 3: ✅ ALLOWED | count=3 | remaining=0
// Request 4: ❌ BLOCKED | count=3 | remaining=0
// Request 5: ❌ BLOCKED | count=3 | remaining=0
```

### The Critical Flaw — The Boundary Attack

This is the most important thing to understand about Fixed Window. There is a fundamental vulnerability at window boundaries.

```
Scenario: limit = 100 requests per minute
Windows:  [──────── :00 to :59 ────────][──────── :00 to :59 ────────]

A clever attacker sends:
  - 100 requests at :59 (last second of window 1)
  - 100 requests at :01 (first second of window 2)

From window 1's perspective: 100 requests → at limit, allowed
From window 2's perspective: 100 requests → at limit, allowed

But from a 2-second perspective: 200 requests went through!
That's 2× the intended rate limit.
```

Visually:

```
Time:       :55  :56  :57  :58  :59|:00  :01  :02  :03
                                   │ Window resets here
Requests:                   [100 req]│[100 req]
                                   │
                            ← 2 sec span: 200 requests →
```

This is not theoretical. It is a real attack vector. The Sliding Window algorithms exist precisely to fix this.

### When Fixed Window is still fine

Despite this flaw, Fixed Window is often the right choice when:
- The window is small (1 second) — the maximum burst is only 2× limit
- You're at the edge/CDN layer where speed matters more than precision
- The resource is cheap and a 2× burst is acceptable
- You want the simplest possible implementation

### Pros and Cons

**Pros:**
- Extremely simple to understand and implement
- O(1) memory per client per window — just one integer
- O(1) time — single read and single write
- Perfect for edge/CDN layer rate limiting where speed is critical
- Easy to reason about for ops teams — "reset at the top of every minute"

**Cons:**
- Boundary attack: allows up to 2× the limit in any rolling window
- Bursty behavior — all requests can happen at the start of a window
- Hard reset at window boundary feels harsh to legitimate users
- Not suitable where accuracy is critical (payments, auth, billing)

---

## 5. Algorithm 2 — Sliding Window Log

### The idea — exact accuracy through full history

The Sliding Window Log solves the boundary problem completely by **never using fixed windows at all**. Instead of counting requests in discrete time buckets, it keeps an **exact log of the timestamp of every request** for each client.

**Mental model:** Imagine you're a bouncer at a club. The rule is "max 5 people per hour." You keep a logbook of entry times. Every time someone wants to enter, you check the logbook: "In the last 60 minutes, how many entries are there?" You count them, and if it's already 5, you turn them away.

The key difference from Fixed Window: **the window slides with time**. The window is always "the last T seconds from RIGHT NOW" — not "since the last clock tick."

### Why the boundary problem disappears

```
Fixed Window (problem):
  Window boundary is FIXED at :00, :30, etc.
  Client exploits the reset by cramming requests around the boundary.

Sliding Window Log (no problem):
  At any point in time T, we look back exactly T seconds.
  There is NO boundary — the window moves continuously with the clock.
  There is no "just before reset" trick because there is no reset.
```

### How it works, step by step

```
Setup: limit=3, window=10 seconds

Timeline:
  t=1  → Request arrives
         Log: [1]
         Count in last 10s: 1 → ALLOW

  t=4  → Request arrives
         Log: [1, 4]
         Count in last 10s: 2 → ALLOW

  t=7  → Request arrives
         Log: [1, 4, 7]
         Count in last 10s: 3 → ALLOW

  t=9  → Request arrives
         Remove timestamps < (9-10)= -1 → nothing removed
         Log: [1, 4, 7]  (still 3 entries)
         Count in last 10s: 3 → BLOCK (3 >= limit of 3)

  t=12 → Request arrives
         Remove timestamps < (12-10)= 2 → removes t=1
         Log: [4, 7]  (now 2 entries)
         Count in last 10s: 2 → ALLOW
         Log: [4, 7, 12]

  t=18 → Request arrives
         Remove timestamps < (18-10)= 8 → removes t=4 and t=7
         Log: [12]  (now 1 entry)
         Count in last 10s: 1 → ALLOW
```

The window literally slides forward with time. There is no sudden reset.

### Detailed Flow Diagram

```
                    Request arrives at time T
                             │
                             ▼
              ┌──────────────────────────────┐
              │  windowStart = T - windowMs  │
              └──────────────┬───────────────┘
                             │
                             ▼
              ┌──────────────────────────────┐
              │  Get timestamp log for key   │
              │  (sorted array of timestamps)│
              └──────────────┬───────────────┘
                             │
                             ▼
              ┌──────────────────────────────┐
              │  Prune: remove all entries   │
              │  where timestamp < windowStart│
              │  (they are outside the window)│
              └──────────────┬───────────────┘
                             │
                             ▼
              ┌──────────────────────────────┐
              │  count = log.length          │
              └──────────────┬───────────────┘
                             │
                      ┌──────┴──────┐
                      │             │
                 count >= limit?    │
                      │             │
                     YES            NO
                      │             │
                      ▼             ▼
               Return 429     Add T to log
               retryAfter=    (append current
               log[0]+window  timestamp)
                              Allow request
```

### Implementation with Binary Search Optimization

```javascript
class SlidingWindowLogRateLimiter {
  /**
   * @param {number} limit    - Max requests allowed in any rolling window
   * @param {number} windowMs - Rolling window size in milliseconds
   */
  constructor({ limit, windowMs }) {
    this.limit = limit;
    this.windowMs = windowMs;
    // key → sorted array of timestamps (milliseconds)
    // Sorted because we always append new timestamps (which are always largest)
    this.logs = new Map();
  }

  check(key) {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    // Initialize log for this key if it doesn't exist
    if (!this.logs.has(key)) {
      this.logs.set(key, []);
    }

    const log = this.logs.get(key);

    // ── Pruning Step ──────────────────────────────────────────────────────
    // Remove all timestamps that are older than our window.
    // Since the log is sorted (oldest first), all expired entries
    // are at the front of the array.
    //
    // We use binary search (O(log n)) instead of a linear scan (O(n))
    // to find the cutoff index. For high-traffic clients, this matters.
    const cutoffIndex = this._lowerBound(log, windowStart);

    // splice(0, cutoffIndex) removes the first `cutoffIndex` elements
    // This is O(n) in the worst case for the splice itself, but
    // in practice, expired entries are removed each request so the
    // log stays bounded to `limit` entries maximum.
    if (cutoffIndex > 0) {
      log.splice(0, cutoffIndex);
    }

    const count = log.length;

    // ── Rate Check ────────────────────────────────────────────────────────
    if (count >= this.limit) {
      // Tell the client exactly when they can retry.
      // The oldest entry in the log will expire first.
      // When it expires, they'll have (limit-1) entries, freeing a slot.
      const oldestTimestamp = log[0];
      const retryAfterMs = oldestTimestamp + this.windowMs - now;
      const retryAfter = new Date(now + retryAfterMs);

      return {
        allowed: false,
        count,
        remaining: 0,
        limit: this.limit,
        retryAfter,
        retryAfterMs,
      };
    }

    // ── Allow & Record ────────────────────────────────────────────────────
    // Push current timestamp (always goes to end since time moves forward)
    log.push(now);

    return {
      allowed: true,
      count: log.length,
      remaining: this.limit - log.length,
      limit: this.limit,
      retryAfter: null,
    };
  }

  /**
   * Binary search: find the index of the first element > threshold.
   * All elements before this index are <= threshold (expired).
   * Time: O(log n)  Space: O(1)
   */
  _lowerBound(arr, threshold) {
    let lo = 0;
    let hi = arr.length;
    while (lo < hi) {
      const mid = (lo + hi) >>> 1; // Unsigned right shift = fast floor(avg)
      if (arr[mid] <= threshold) {
        lo = mid + 1;
      } else {
        hi = mid;
      }
    }
    return lo; // First index where arr[index] > threshold
  }
}

// ─── Demo ──────────────────────────────────────────────────────────────────

const limiter = new SlidingWindowLogRateLimiter({ limit: 3, windowMs: 5000 });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function demo() {
  console.log('--- Requests at t=0s ---');
  console.log(limiter.check('user:bob')); // ✅ remaining: 2
  console.log(limiter.check('user:bob')); // ✅ remaining: 1
  console.log(limiter.check('user:bob')); // ✅ remaining: 0

  console.log('\n--- Request at t=0s (should block) ---');
  const blocked = limiter.check('user:bob');
  console.log('Blocked:', !blocked.allowed);
  console.log('Retry after (ms):', blocked.retryAfterMs); // ~5000ms

  console.log('\n--- Wait 3 seconds (t=3s) ---');
  await sleep(3000);
  // The 3 timestamps from t=0 are now 3 seconds old.
  // Window is 5 seconds. They're still in window. Still blocked.
  const stillBlocked = limiter.check('user:bob');
  console.log('Still blocked:', !stillBlocked.allowed);

  console.log('\n--- Wait 2 more seconds (t=5s) ---');
  await sleep(2000);
  // Now t=5s. The oldest timestamp (from t=0) is exactly 5s old.
  // It gets pruned. Two remain (from t≈0, they're still < 5s old).
  // Actually all 3 were at ~t=0, so all 3 might expire. Let's see.
  const nowAllowed = limiter.check('user:bob');
  console.log('Now allowed:', nowAllowed.allowed); // ✅
}

demo();
```

### The memory cost — the main drawback

This is the critical downside of Sliding Window Log. The memory usage is **O(limit) per active client**:

```
limit = 10          → store up to 10 timestamps per client → tiny
limit = 1,000       → store up to 1,000 timestamps per client → manageable
limit = 1,000,000   → store up to 1M timestamps per client → 8MB per client!

With 10,000 active clients at limit=1000:
  10,000 × 1,000 × 8 bytes = 80 MB — this is the ceiling
  (In practice, far less since most clients don't hit the limit)
```

This is why Sliding Window Log is **not suitable for very high limits**. It's perfect for `login: max 10/min` but terrible for `API: max 100,000/hour`.

### Pros and Cons

**Pros:**
- **Perfect accuracy** — no boundary attack possible, ever
- **Exact retry time** — can tell client precisely when their oldest request expires
- **Strict enforcement** — no over-counting, no under-counting
- Great for security-critical endpoints (login, password reset, payments)

**Cons:**
- **Memory-intensive** — O(limit) timestamps per client
- **Slower pruning** — must scan/prune on every request (though binary search helps)
- Not suitable for high limits (>10,000/window) or many concurrent clients
- In Redis: requires ZADD + ZRANGEBYSCORE operations (2+ round trips)

---

## 6. Algorithm 3 — Sliding Window Counter

### The idea — combine the best of both worlds

The Sliding Window Counter is a practical compromise. It aims to eliminate the boundary attack problem of Fixed Window while keeping the O(1) memory of the counter approach.

**The insight:** instead of tracking exact timestamps (expensive), we track two adjacent fixed-window counters and use **interpolation** to estimate the count in any rolling window.

### The math behind it

At any point in time, our rolling window spans from `(now - windowSize)` to `now`. This window overlaps with:
- The **current** fixed window (partially or fully)
- The **previous** fixed window (partially)

```
Previous Window         Current Window
[────────────────────][────────────────────]
                      │
            ◄─── elapsed ───►
                      │
◄──── window overlap ─┤
  = 1 - elapsed/total │
                     now
```

The overlap into the previous window is `(1 - elapsedFraction)`.

So the estimated request count in the rolling window is:

```
estimate = currentWindowCount + previousWindowCount × (1 - elapsedFraction)

Where:
  elapsedFraction = (now % windowMs) / windowMs
                  = how far through the current window we are (0.0 to 1.0)
  (1 - elapsedFraction) = how much of the previous window overlaps
```

### Concrete example

```
window = 60 seconds, limit = 100

At 14:03:45 (45 seconds into the current minute):
  currentWindowCount  = 30 (requests this minute so far)
  previousWindowCount = 80 (requests last minute)
  elapsedFraction     = 45/60 = 0.75

  estimate = 30 + 80 × (1 - 0.75)
           = 30 + 80 × 0.25
           = 30 + 20
           = 50 requests

  50 < 100 → ALLOW
```

The estimate says: "roughly 50 of those 80 previous requests are still 'in the window'", because only 25% of the previous window overlaps with our current rolling window.

### Why this is an approximation, not exact

This assumes requests were **evenly distributed** throughout the previous window. In reality, they might have all happened at the end of that window — in which case our estimate is too low (too lenient). The maximum error rate is typically **~0.1% to 1%** at window boundaries, which is acceptable for most use cases.

This is the tradeoff: perfect accuracy requires storing timestamps (Sliding Window Log). The Counter gives ~99% accuracy with O(1) memory.

### Detailed Flow Diagram

```
                  Request arrives at time T
                           │
                           ▼
          ┌─────────────────────────────────────┐
          │  currentWindowIdx = floor(T / winMs)│
          │  prevWindowIdx = currentWindowIdx-1 │
          └─────────────────┬───────────────────┘
                            │
                            ▼
          ┌─────────────────────────────────────┐
          │  currentKey = key:currentWindowIdx  │
          │  prevKey    = key:prevWindowIdx      │
          │  Fetch both counts from store        │
          └─────────────────┬───────────────────┘
                            │
                            ▼
          ┌─────────────────────────────────────┐
          │  elapsedFraction = (T % winMs)/winMs│
          │  prevWeight = 1 - elapsedFraction   │
          │  estimate = curr + prev × prevWeight│
          └─────────────────┬───────────────────┘
                            │
                     ┌──────┴──────┐
                     │             │
               estimate >= limit?  │
                     │             │
                    YES            NO
                     │             │
                     ▼             ▼
              Return 429     currentCount++
                             (set TTL if new)
                             Allow request
```

### Implementation

```javascript
class SlidingWindowCounterRateLimiter {
  /**
   * @param {number} limit    - Max requests in any rolling window
   * @param {number} windowMs - Window size in milliseconds
   */
  constructor({ limit, windowMs }) {
    this.limit = limit;
    this.windowMs = windowMs;
    // storeKey → count (integer)
    this.store = new Map();
  }

  check(key) {
    const now = Date.now();

    // ── Identify the two relevant windows ────────────────────────────────
    const currentWindowIdx = Math.floor(now / this.windowMs);
    const prevWindowIdx = currentWindowIdx - 1;

    const currentKey = `${key}:${currentWindowIdx}`;
    const prevKey = `${key}:${prevWindowIdx}`;

    // ── Fetch both counters ───────────────────────────────────────────────
    const currentCount = this.store.get(currentKey) ?? 0;
    const prevCount = this.store.get(prevKey) ?? 0;

    // ── Interpolation ─────────────────────────────────────────────────────
    // How far through the current window are we? (0.0 at start, 1.0 at end)
    const elapsedFraction = (now % this.windowMs) / this.windowMs;

    // How much of the previous window is still inside our rolling window?
    const prevWindowWeight = 1 - elapsedFraction;

    // Estimate: current requests + weighted previous requests
    const estimate = currentCount + prevCount * prevWindowWeight;

    // ── Check Limit ───────────────────────────────────────────────────────
    if (estimate >= this.limit) {
      return {
        allowed: false,
        estimate: Math.ceil(estimate),
        remaining: 0,
        limit: this.limit,
      };
    }

    // ── Allow & Increment ─────────────────────────────────────────────────
    const newCount = currentCount + 1;
    this.store.set(currentKey, newCount);

    // Set TTL on new counter keys to prevent memory leak
    if (currentCount === 0) {
      setTimeout(() => this.store.delete(currentKey), this.windowMs * 2);
    }

    return {
      allowed: true,
      estimate: Math.ceil(estimate + 1),
      remaining: Math.max(0, Math.floor(this.limit - estimate - 1)),
      limit: this.limit,
    };
  }
}

// ─── Demo showing the interpolation ──────────────────────────────────────

const limiter = new SlidingWindowCounterRateLimiter({ limit: 10, windowMs: 1000 });

// Simulate 8 requests happening in the "previous" window
// (we'll manipulate time conceptually here — in a real test you'd mock Date.now)
for (let i = 0; i < 8; i++) {
  limiter.store.set(`user:carol:${Math.floor(Date.now() / 1000) - 1}`,
    i + 1); // Manually seed previous window count = 8
}

// Now at the start of current window (0% elapsed), check:
// estimate = 0 + 8 × (1 - 0) = 8 → under limit of 10
const r1 = limiter.check('user:carol');
console.log('Allow (estimate ~8):', r1.allowed); // true, estimate ≈ 8

const r2 = limiter.check('user:carol');
console.log('Allow (estimate ~9):', r2.allowed); // true, estimate ≈ 9

const r3 = limiter.check('user:carol');
console.log('Block (estimate ~10):', !r3.allowed); // blocked, estimate ≈ 10
```

### Why ~0.1% error rate at boundaries?

The error only occurs when we assume uniform distribution but the actual distribution is skewed:

```
Worst case: all previous window's requests happened at its very END

  prev window:  ───────────────────────[100 requests at :59]
  curr window:  [:01─────────────────────────────────────────]
                    ↑ now (1 second into current window)

  elapsedFraction = 1/60 = 0.0167
  prevWeight = 1 - 0.0167 = 0.9833

  Our estimate: 0 + 100 × 0.9833 = 98.33

  Reality: all 100 requests happened 1 second ago — ALL are in window.
  We estimated 98.33 but truth is 100.

  We would allow 2 more requests we shouldn't. That's the ~2% worst case.
  In practice, traffic is rarely this skewed, so it's closer to 0.1%.
```

### Pros and Cons

**Pros:**
- O(1) memory — just two counters per client
- Very fast — simple arithmetic, two store reads
- Good accuracy (~99%+) — no boundary attack in practice
- Scales to millions of clients easily
- Used by Cloudflare, Redis rate limiters, and most production systems

**Cons:**
- Approximate, not exact (0.1–2% error at window boundaries)
- Slightly harder to explain to non-engineers
- Cannot give exact retry time (only approximate)

---

## 7. Algorithm 4 — Token Bucket

### The idea — start with the metaphor

**Imagine a bucket filled with tokens.** Each request consumes one token from the bucket. Tokens are added back at a constant rate (like water dripping into a bucket). If you reach in and there are no tokens, your request is rejected. If the bucket is full and tokens keep dripping in, the excess tokens overflow (they're lost — the bucket can't hold more than its capacity).

This is fundamentally different from window-based algorithms. There are **no windows**. Instead, there's a **continuous token balance**.

### Key parameters

```
capacity    = Maximum tokens the bucket can hold = maximum burst size
refillRate  = Tokens added per second = steady-state allowed rate

Examples:
  capacity=10, refillRate=1/sec
    → Burst of up to 10 at once, then 1 per second sustained

  capacity=100, refillRate=10/sec
    → Burst of 100 at once, then 10 per second sustained

  capacity=1, refillRate=1/sec
    → No burst allowed, exactly 1 per second
```

### The crucial concept: lazy refill

In a real physical bucket, tokens drip in continuously. In software, we don't have a background timer running for every client — that would be wasteful (millions of timers for millions of users).

Instead, we use **lazy evaluation**: we only compute the refill at the moment a request arrives. We calculate how much time has passed since the last request and add the appropriate number of tokens:

```javascript
const elapsed = now - lastRefillTime;          // milliseconds since last request
const tokensToAdd = (elapsed / 1000) * refillRate; // tokens earned in that time
const newTokens = Math.min(capacity, currentTokens + tokensToAdd);
```

This is efficient — no background processing, no timers. Just a calculation at request time.

### Step-by-step walkthrough

```
Setup: capacity=5, refillRate=1 token/sec

t=0s  → Request 1 arrives
        Bucket: [5 tokens] (full at start)
        Consume 1 token → [4 tokens] → ALLOW

t=0s  → Request 2 arrives (immediate)
        elapsed=0ms, tokensToAdd=0
        Bucket: [4 tokens]
        Consume 1 → [3 tokens] → ALLOW

t=0s  → Requests 3,4,5 (burst of 5 total at t=0)
        Bucket: [3→2→1→0 tokens] → ALL ALLOWED (burst!)

t=0s  → Request 6 (burst continues)
        Bucket: [0 tokens]
        0 < 1 → BLOCK (429)

t=2s  → Request 7 arrives (2 seconds later)
        elapsed=2000ms, tokensToAdd=2×1=2
        Bucket: [0 + 2 = 2 tokens] → [2 tokens]
        Consume 1 → [1 token] → ALLOW

t=2s  → Request 8 (immediate after request 7)
        elapsed≈0ms, tokensToAdd≈0
        Bucket: [1 token]
        Consume 1 → [0 tokens] → ALLOW

t=2s  → Request 9 (immediate)
        Bucket: [0 tokens] → BLOCK
```

### Detailed Flow Diagram

```
                  Request arrives at time T
                           │
                           ▼
          ┌─────────────────────────────────────┐
          │  Load bucket: { tokens, lastRefill } │
          │  (create full bucket if first time)  │
          └─────────────────┬───────────────────┘
                            │
                            ▼
          ┌─────────────────────────────────────┐
          │  elapsed = T - lastRefill            │
          │  tokensToAdd = elapsed × refillRate  │
          │  tokens = min(capacity,              │
          │               tokens + tokensToAdd)  │
          │  lastRefill = T                      │
          └─────────────────┬───────────────────┘
                            │
                     ┌──────┴──────┐
                     │             │
               tokens < cost?      │  (cost=1 by default)
                     │             │
                    YES            NO
                     │             │
                     ▼             ▼
              Calculate       tokens -= cost
              retryAfterMs    Save bucket state
              Return 429      Allow request
```

### Full Implementation with Weighted Cost

```javascript
class TokenBucketRateLimiter {
  /**
   * @param {number} capacity   - Max tokens (= max burst size)
   * @param {number} refillRate - Tokens added per second (= steady-state rate)
   */
  constructor({ capacity, refillRate }) {
    this.capacity = capacity;
    this.refillRate = refillRate; // tokens per second
    // key → { tokens: number, lastRefill: timestamp }
    this.buckets = new Map();
  }

  /**
   * Consume `cost` tokens for identity `key`.
   * @param {string} key  - Identity (user ID, IP, API key, etc.)
   * @param {number} cost - How many tokens this request costs (default 1)
   */
  consume(key, cost = 1) {
    const now = Date.now();
    const bucket = this._getOrCreateBucket(key, now);

    // ── Lazy Refill ───────────────────────────────────────────────────────
    // Calculate how many tokens have been earned since the last request.
    // This avoids background timers — we compute refill on demand.
    const elapsedSeconds = (now - bucket.lastRefill) / 1000;
    const tokensEarned = elapsedSeconds * this.refillRate;

    // Cap at capacity (tokens don't accumulate beyond the bucket size)
    bucket.tokens = Math.min(this.capacity, bucket.tokens + tokensEarned);
    bucket.lastRefill = now;

    // ── Availability Check ────────────────────────────────────────────────
    if (bucket.tokens < cost) {
      // Calculate exactly how long until enough tokens are available
      const tokensNeeded = cost - bucket.tokens;
      const secondsUntilReady = tokensNeeded / this.refillRate;
      const retryAfterMs = Math.ceil(secondsUntilReady * 1000);

      return {
        allowed: false,
        tokens: Math.floor(bucket.tokens * 100) / 100, // 2 decimal places
        capacity: this.capacity,
        retryAfterMs,
        retryAfter: new Date(now + retryAfterMs),
      };
    }

    // ── Consume ───────────────────────────────────────────────────────────
    bucket.tokens -= cost;

    return {
      allowed: true,
      tokens: Math.floor(bucket.tokens * 100) / 100,
      capacity: this.capacity,
      retryAfterMs: 0,
    };
  }

  // Convenience alias
  check(key) {
    return this.consume(key, 1);
  }

  _getOrCreateBucket(key, now) {
    if (!this.buckets.has(key)) {
      // New clients start with a full bucket
      this.buckets.set(key, { tokens: this.capacity, lastRefill: now });
    }
    return this.buckets.get(key);
  }
}

// ─── Demo ──────────────────────────────────────────────────────────────────

const limiter = new TokenBucketRateLimiter({ capacity: 5, refillRate: 1 });

// Phase 1: Initial burst (5 tokens available)
console.log('=== Initial Burst ===');
for (let i = 1; i <= 6; i++) {
  const r = limiter.consume('user:dave');
  console.log(
    `Request ${i}: ${r.allowed ? '✅' : '❌'} | ` +
    `tokens=${r.tokens} | ` +
    (r.retryAfterMs ? `retry in ${r.retryAfterMs}ms` : '')
  );
}
// Request 1: ✅ | tokens=4
// Request 2: ✅ | tokens=3
// Request 3: ✅ | tokens=2
// Request 4: ✅ | tokens=1
// Request 5: ✅ | tokens=0
// Request 6: ❌ | tokens=0 | retry in 1000ms

// Phase 2: Weighted costs (different endpoints cost different amounts)
console.log('\n=== Weighted Costs ===');
const apiLimiter = new TokenBucketRateLimiter({ capacity: 100, refillRate: 10 });
apiLimiter.buckets.set('user:eve', { tokens: 100, lastRefill: Date.now() });

console.log(apiLimiter.consume('user:eve', 1));   // Cheap: GET /data
console.log(apiLimiter.consume('user:eve', 10));  // Medium: POST /process
console.log(apiLimiter.consume('user:eve', 50));  // Expensive: POST /export
console.log(apiLimiter.consume('user:eve', 50));  // Only 39 left → ❌ BLOCK
```

### The Token Bucket's key advantage — controlled bursts

This is what makes Token Bucket ideal for real-world traffic. Legitimate users often have **bursty patterns**:

```
Mobile app user opens the app:
  → App loads feed (3 requests)
  → App syncs notifications (2 requests)
  → App prefetches data (5 requests)
  Total: 10 requests in 2 seconds

This is legitimate. A window-based limiter with limit=10/min might block this.
A Token Bucket with capacity=10, refillRate=2/sec allows this burst,
then enforces 2 req/sec for sustained usage.
```

### Pros and Cons

**Pros:**
- Allows controlled bursts — better user experience for legitimate bursty traffic
- Continuous rate enforcement — smoother than fixed windows
- Supports weighted costs — complex API pricing models
- O(1) memory per client
- Precise retry time calculation
- Industry standard: used by AWS, GitHub, Stripe, Google APIs

**Cons:**
- Does not guarantee smooth output rate (bursts can overwhelm downstream)
- Clock skew in distributed systems requires careful handling
- Starvation: high-volume clients can starve before tokens refill
- More complex than Fixed Window

---

## 8. Algorithm 5 — Leaky Bucket

### The idea — the output, not the input

All previous algorithms control the **input rate** — they decide whether to accept a request. The Leaky Bucket is fundamentally different: it controls the **output rate**.

**Mental model:** Imagine a bucket with a small hole at the bottom. Water (requests) pours in from the top at any rate. It leaks out the bottom at a constant, fixed rate. If the bucket overflows (is full when more water pours in), the excess is lost (request rejected).

The key insight: **the server always sees requests at a constant, predictable rate** — regardless of how bursty the incoming traffic is.

```
Incoming traffic (bursty):
  |  |||||||  |  ||||||||||||||  |  |||

Leaky bucket output (smooth):
  | | | | | | | | | | | | | | | | | |
```

### Two interpretations of Leaky Bucket

There are two ways to implement this, and they serve different purposes:

**Interpretation 1: As a rate limiter (reject overflow)**
- If queue is full → reject (429)
- Used to protect your server from receiving too many requests

**Interpretation 2: As a queue processor (smooth output)**
- Queue all incoming requests
- Process them at a constant rate
- Used to protect a downstream service from receiving too many requests

Both use the same principle but for different scenarios.

### How the "virtual queue" works

Like Token Bucket, we use lazy evaluation — no real background timer per client:

```javascript
// When a request arrives:
const now = Date.now();
const elapsed = now - lastLeak;
const leaked = (elapsed / 1000) * leakRate; // How many items "drained" since last check
const currentQueueSize = Math.max(0, queueSize - leaked);

// Is there room for one more?
if (currentQueueSize + 1 > capacity) → REJECT
else → queueSize = currentQueueSize + 1 → ALLOW
```

### Leaky Bucket vs Token Bucket — the input/output difference

```
Token Bucket:                    Leaky Bucket:
Input:  bursty OK                Input:  bursty OK (up to capacity)
Output: can also be bursty       Output: ALWAYS constant rate

  Server sees:                     Server sees:
  ████░░████░░░░░░████             ─────────────────────────────
  (bursty)                         (constant, smooth)
```

### Detailed Flow Diagram

```
                  Request arrives at time T
                           │
                           ▼
          ┌─────────────────────────────────────┐
          │  Load: { queueSize, lastLeak }       │
          └─────────────────┬───────────────────┘
                            │
                            ▼
          ┌─────────────────────────────────────┐
          │  elapsed = T - lastLeak              │
          │  leaked  = elapsed × (leakRate/1000) │
          │  queueSize = max(0, queueSize-leaked)│
          │  lastLeak = T                        │
          └─────────────────┬───────────────────┘
                            │
                     ┌──────┴──────┐
                     │             │
             queueSize+1 >         │
               capacity?           │
                     │             │
                    YES            NO
                     │             │
                     ▼             ▼
              Return 429       queueSize += 1
              (overflow)       Save state
                               Allow / Queue
                               request
```

### Implementation — Both Interpretations

```javascript
// ─── Interpretation 1: Leaky Bucket as Rate Limiter ───────────────────────
//
// Use this to PROTECT YOUR SERVER from bursty incoming traffic.
// Requests above the steady-state rate are rejected.

class LeakyBucketRateLimiter {
  /**
   * @param {number} capacity  - Max queue depth (burst tolerance)
   * @param {number} leakRate  - Requests processed per second (steady-state rate)
   */
  constructor({ capacity, leakRate }) {
    this.capacity = capacity;
    this.leakRate = leakRate; // requests/second
    // key → { queueSize: number, lastLeak: timestamp }
    this.state = new Map();
  }

  check(key) {
    const now = Date.now();
    const s = this._getOrCreate(key, now);

    // ── Drain the virtual queue ───────────────────────────────────────────
    // Compute how many items have "leaked out" since last check.
    // This simulates the constant-rate drain without a real timer.
    const elapsed = now - s.lastLeak;
    const leaked = (elapsed / 1000) * this.leakRate;
    s.queueSize = Math.max(0, s.queueSize - leaked);
    s.lastLeak = now;

    // ── Overflow check ────────────────────────────────────────────────────
    if (s.queueSize + 1 > this.capacity) {
      // Queue is full — this request overflows and is rejected.
      // Tell client how long until a slot opens up.
      const excessItems = s.queueSize + 1 - this.capacity;
      const retryAfterMs = Math.ceil((excessItems / this.leakRate) * 1000);
      return {
        allowed: false,
        queueSize: s.queueSize,
        capacity: this.capacity,
        retryAfterMs,
      };
    }

    // ── Enqueue ───────────────────────────────────────────────────────────
    s.queueSize += 1;
    return {
      allowed: true,
      queueSize: Math.ceil(s.queueSize),
      capacity: this.capacity,
    };
  }

  _getOrCreate(key, now) {
    if (!this.state.has(key)) {
      this.state.set(key, { queueSize: 0, lastLeak: now });
    }
    return this.state.get(key);
  }
}


// ─── Interpretation 2: Leaky Bucket as Queue Processor ───────────────────
//
// Use this to PROTECT A DOWNSTREAM SERVICE by smoothing your outgoing rate.
// Classic use case: you're calling a third-party API with a rate limit.

class LeakyBucketQueue {
  /**
   * @param {number} capacity        - Max pending requests before rejection
   * @param {number} requestsPerSec  - How fast to drain the queue (output rate)
   */
  constructor({ capacity, requestsPerSec }) {
    this.capacity = capacity;
    this.intervalMs = 1000 / requestsPerSec; // Time between processing each item
    this.queue = []; // { fn, resolve, reject, enqueuedAt }
    this.processing = false;
  }

  /**
   * Enqueue an async function to run at the controlled output rate.
   * Returns a Promise that resolves/rejects with the function's result.
   */
  add(fn) {
    return new Promise((resolve, reject) => {
      if (this.queue.length >= this.capacity) {
        // Queue is full — overflow (same as 429)
        return reject(
          Object.assign(new Error('Rate limit exceeded: queue full'), {
            code: 'RATE_LIMIT_EXCEEDED',
            queueSize: this.queue.length,
          })
        );
      }

      this.queue.push({ fn, resolve, reject, enqueuedAt: Date.now() });

      // Start processing if not already running
      if (!this.processing) {
        this._drain();
      }
    });
  }

  async _drain() {
    this.processing = true;

    while (this.queue.length > 0) {
      const item = this.queue.shift();

      // Track queue wait time (useful for monitoring)
      const waitTime = Date.now() - item.enqueuedAt;

      try {
        const result = await item.fn();
        item.resolve(result);
      } catch (err) {
        item.reject(err);
      }

      // Wait before processing the next item to enforce output rate
      // This is the "leak" — constant time between outputs
      if (this.queue.length > 0) {
        await new Promise((r) => setTimeout(r, this.intervalMs));
      }
    }

    this.processing = false;
  }

  get size() {
    return this.queue.length;
  }
}


// ─── Demo: protecting a third-party API ──────────────────────────────────

// Third-party API allows max 5 requests/sec
const apiQueue = new LeakyBucketQueue({ capacity: 50, requestsPerSec: 5 });

// Your code fires 20 requests all at once
// The queue ensures they go out at max 5/sec — the third party never sees a burst
async function processUsers(userIds) {
  const results = await Promise.allSettled(
    userIds.map((id) =>
      apiQueue.add(() => fetch(`https://external-api.com/users/${id}`))
    )
  );
  return results;
}

// All 20 requests are automatically spread over 4 seconds
await processUsers(Array.from({ length: 20 }, (_, i) => i + 1));
```

### Pros and Cons

**Pros:**
- **Perfectly smooth output** — downstream services always see a constant rate
- Protects against cascading failures (if downstream is slow, you absorb the burst)
- Queue-based version is great for outgoing request management
- No burst possible at output — zero thundering herd at downstream

**Cons:**
- **No burst allowed** — legitimate bursty clients are penalized
- Queue adds **latency** — requests wait in line even when downstream has capacity
- More complex to implement correctly
- Dropped requests (overflow) are lost, not automatically retried
- Two different interpretations cause confusion

---

## 9. Token Bucket vs Leaky Bucket — The Deep Difference

These two algorithms are often confused. Here is a clear comparison:

### The Fundamental Difference

```
Token Bucket controls the INPUT rate with burst allowance.
Leaky Bucket controls the OUTPUT rate — always smooth.

                 INPUT              OUTPUT
                 ─────────────────  ─────────────────
Token Bucket:    rate-limited       CAN BE BURSTY
Leaky Bucket:    accept-or-reject   ALWAYS CONSTANT
```

### When this difference matters

**You're building an API server (receive requests):**
- Token Bucket: Good. Allows users to burst, then throttles to steady state. Better UX.
- Leaky Bucket: Works but punishes all bursty clients even if you have capacity.

**You're calling an external API (send requests):**
- Token Bucket: Bad. You might burst and hit their rate limit.
- Leaky Bucket: Perfect. You'll never exceed their rate limit regardless of your load.

```
                              YOU ──→ EXTERNAL SERVICE

You have 100 pending calls to make to an API that allows 10/sec.

Token Bucket (your side):
  You burst 10, wait, burst 10 again...
  External API sees: ████░░████░░████░░  (bursty, might hit their limit)

Leaky Bucket (your side):
  You emit exactly 1 every 100ms (10/sec).
  External API sees: ─────────────────── (smooth, never hits their limit)
```

---

## 10. Algorithm Comparison — Full Matrix

### At a glance

```
                 Fixed   Sliding  Sliding  Token    Leaky
                 Window  Log      Counter  Bucket   Bucket
─────────────────────────────────────────────────────────────────
Memory per key   O(1)    O(limit) O(1)     O(1)     O(capacity)
Accuracy         ~85%    100%     ~99%     ~99%     100%
Boundary attack  YES     NO       NO       NO       NO
Allows burst     YES     NO       NO       YES      NO
Smooth output    NO      YES      YES      NO       YES
Implementation   Easy    Medium   Easy     Easy     Hard
Distributed      Easy    Hard     Easy     Med      Hard
Weighted cost    NO      NO       NO       YES      NO
─────────────────────────────────────────────────────────────────
```

### Decision Flowchart

```
Do you need guaranteed smooth OUTPUT rate (e.g., calling downstream)?
  │
  YES → Leaky Bucket (queue-based)
  │
  NO
  │
  Do you need to allow short BURSTS for better UX?
  │
  YES → Token Bucket
  │       (capacity = burst size, refillRate = steady rate)
  NO
  │
  Do you need 100% accuracy (payments, auth, billing)?
  │
  YES → Is the limit small (< 1000/window)?
  │       YES → Sliding Window Log
  │       NO  → Sliding Window Counter
  NO
  │
  Is implementation simplicity the priority?
  │
  YES → Fixed Window Counter
  │       (acceptable if window is small and 2x burst is tolerable)
  NO
  │
  → Sliding Window Counter (best general-purpose choice)
```

---

## 11. Where to Apply Rate Limiting in Architecture

### The layered defense model

Rate limiting is not a single layer — it's a multi-layer defense strategy. Different layers protect different things.

```
Internet
    │
    ▼
┌──────────────────────────────────────────────────────────┐
│  CDN / Edge (Cloudflare, Fastly, CloudFront)             │
│  Layer 1: IP-based rate limiting                         │
│  Goal: Stop DDoS before it reaches your servers          │
│  Algorithm: Fixed Window (fastest, low overhead at scale) │
│  Example: Max 1000 req/min per IP globally               │
└─────────────────────────┬────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────┐
│  Load Balancer / Reverse Proxy (Nginx, HAProxy)          │
│  Layer 2: Connection and request rate limits             │
│  Goal: Prevent individual backends from being overwhelmed│
│  Algorithm: Token Bucket or Fixed Window                 │
│  Example: Max 100 concurrent connections per IP          │
└─────────────────────────┬────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────┐
│  API Gateway (Kong, AWS API GW, custom middleware)       │
│  Layer 3: API key / user / tenant rate limits            │
│  Goal: Enforce business quotas, prevent abuse            │
│  Algorithm: Sliding Window Counter (accurate + fast)     │
│  Example: API key: 100 req/min; tenant: 10,000 req/day  │
└─────────────────────────┬────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────┐
│  Application Server                                      │
│  Layer 4: Endpoint-specific fine-grained limits          │
│  Goal: Protect specific expensive endpoints              │
│  Algorithm: Sliding Window Log (strict) or Token Bucket  │
│  Example: POST /login: 5/min; POST /checkout: 10/min     │
└─────────────────────────┬────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────┐
│  Service Layer (microservices calling each other)        │
│  Layer 5: Service-to-service call limits                 │
│  Goal: Prevent one service from overwhelming another     │
│  Algorithm: Token Bucket or Leaky Bucket                 │
│  Example: Order service: max 50 req/sec to Payment svc   │
└─────────────────────────┬────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────┐
│  Database / Cache / External APIs                        │
│  Layer 6: Connection pool and query rate limits          │
│  Goal: Protect DB from too many concurrent queries       │
│  Tool: Connection pooling (pg-pool, knex, etc.)          │
│  Example: Max 20 concurrent DB connections               │
└──────────────────────────────────────────────────────────┘
```

### What breaks if you skip a layer

```
Skip Layer 1 (CDN):
  DDoS hits your load balancers directly.
  Cost: Paying for bandwidth to serve attacker traffic.
  Risk: Load balancers get overwhelmed before real users get through.

Skip Layer 3 (API Gateway):
  Paying customers can run unlimited requests.
  Free users can consume enterprise-level resources.
  Competitor can scrape your entire API for free.

Skip Layer 4 (Application):
  Any authenticated user can brute-force passwords.
  A slow endpoint (report generation) can be called 1000x/sec.
  Database gets hammered from a single user.
```

---

## 12. Rate Limit Keys — Identifying Who to Limit

### The key is everything

The rate limit key determines "who shares a rate limit." Getting this wrong is the #1 source of rate limiting bugs.

**Too broad:** All users share the same limit → One abuser blocks everyone
**Too narrow:** Each endpoint has its own limit per user → No protection against cross-endpoint abuse

### Common key strategies

```javascript
// ─── Strategy 1: IP-based ─────────────────────────────────────────────────
// Pros: Works without auth, good for public endpoints, anti-DDoS
// Cons: NAT means many users behind one IP; VPNs let attackers rotate IPs
const key = `rl:ip:${req.ip}`;

// ─── Strategy 2: User ID-based ───────────────────────────────────────────
// Pros: Fair per-user limits, survives IP changes
// Cons: Requires authentication; unauthenticated endpoints can't use this
const key = `rl:user:${req.user.id}`;

// ─── Strategy 3: API Key-based ───────────────────────────────────────────
// Pros: Perfect for B2B APIs; easy to revoke; supports tiered limits
// Cons: Shared API keys (teams) might hit limits unexpectedly
const key = `rl:apikey:${req.headers['x-api-key']}`;

// ─── Strategy 4: Endpoint-specific ──────────────────────────────────────
// Pros: Different limits per route (login vs search vs data)
// Cons: Client may have low budget on expensive route but unlimited on cheap
const key = `rl:user:${req.user.id}:${req.method}:${req.path}`;

// ─── Strategy 5: Tenant-based (multi-tenancy SaaS) ───────────────────────
// Pros: Org-level quotas; all members of an org share the limit
// Cons: Individual power users can exhaust team quota
const key = `rl:tenant:${req.user.tenantId}`;

// ─── Strategy 6: Fallback chain (smart key selection) ────────────────────
// Use the most specific key available; fall back gracefully
function getRateLimitKey(req) {
  if (req.user?.id) {
    return `rl:user:${req.user.id}`;           // Authenticated user
  }
  if (req.headers['x-api-key']) {
    return `rl:api:${req.headers['x-api-key']}`; // API key
  }
  return `rl:ip:${req.ip}`;                    // Fall back to IP
}
```

### Layered keys — multiple limits simultaneously

Real systems apply multiple rate limits at once. For example:
- Per-user: 100 req/min
- Per-IP: 500 req/min (shared by all users behind that IP)
- Per-endpoint for user: 10 req/min on POST /login
- Global endpoint: 10,000 req/min on GET /search (protects DB regardless of user)

```javascript
async function checkAllLimits(req) {
  const checks = [
    // Global IP protection (anti-DDoS)
    { key: `rl:ip:${req.ip}`,         limit: 500,  windowMs: 60_000 },
    // Per-user general limit
    { key: `rl:user:${req.user?.id}`, limit: 100,  windowMs: 60_000 },
    // Endpoint-specific strict limit
    { key: `rl:endpoint:${req.user?.id}:${req.path}`, limit: 10, windowMs: 60_000 },
  ].filter(c => c.key && !c.key.includes('undefined'));

  const results = await Promise.all(
    checks.map(c => limiter.check(c.key, c.limit, c.windowMs))
  );

  // All checks must pass
  const blocked = results.find(r => !r.allowed);
  return blocked ?? { allowed: true };
}
```

---

## 13. Distributed Rate Limiting with Redis

### The problem with in-memory rate limiters at scale

In-memory rate limiters (using a JavaScript `Map`) only work on a single server process. Modern apps run on multiple servers (horizontal scaling). When you have 3 servers:

```
User "alice" sends 100 requests, load-balanced across 3 servers:

  Server A sees: 34 requests → counter = 34 (below limit of 100)
  Server B sees: 33 requests → counter = 33 (below limit of 100)
  Server C sees: 33 requests → counter = 33 (below limit of 100)

But alice actually made 100 requests! Each server thinks she's fine.
```

The solution: **move the counter to a shared external store** — Redis.

```
               Request from alice
                     │
         ┌──────────┼───────────┐
         ▼          ▼           ▼
      Server A   Server B   Server C
         │          │           │
         └──────────┼───────────┘
                    │
                    ▼
              Redis (single source of truth)
              key: "rl:user:alice:28508883"
              value: 100  ← shared counter
```

### The race condition problem

Naive Redis usage has a race condition:

```
BAD: Non-atomic read-modify-write
  Server A: GET "rl:alice" → 99
  Server B: GET "rl:alice" → 99   ← reads before A increments!
  Server A: SET "rl:alice" 100    → allowed (100 = limit)
  Server B: SET "rl:alice" 100    → allowed (100 = limit) ← BOTH GOT THROUGH!

Result: 101 requests allowed when limit was 100
```

The fix is **atomic operations**. Redis provides:
1. `INCR` — atomic increment (returns new value in one step)
2. **Lua scripts** — execute multiple commands as one atomic unit

### Fixed Window with Atomic Redis INCR

```javascript
import { createClient } from 'redis';

const redis = createClient({ url: process.env.REDIS_URL ?? 'redis://localhost:6379' });
await redis.connect();

/**
 * Fixed Window with atomic INCR.
 * The Lua script ensures INCR and EXPIRE happen atomically.
 * No race condition possible.
 */
async function fixedWindowCheck(key, limit, windowMs) {
  const windowIdx = Math.floor(Date.now() / windowMs);
  const redisKey = `rl:fw:${key}:${windowIdx}`;

  // Lua script runs atomically on Redis server — no round trips
  const luaScript = `
    local count = redis.call('INCR', KEYS[1])
    if count == 1 then
      -- First request in this window: set expiry
      redis.call('PEXPIRE', KEYS[1], ARGV[1])
    end
    return count
  `;

  const count = await redis.eval(luaScript, {
    keys: [redisKey],
    arguments: [String(windowMs)],
  });

  const allowed = count <= limit;

  return {
    allowed,
    count,
    remaining: Math.max(0, limit - count),
    limit,
    resetAt: new Date((windowIdx + 1) * windowMs),
  };
}

// Usage
const result = await fixedWindowCheck('user:alice', 100, 60_000);
console.log(result); // { allowed: true, count: 1, remaining: 99, ... }
```

### Sliding Window Counter with Redis Pipeline

```javascript
async function slidingWindowCheck(key, limit, windowMs) {
  const now = Date.now();
  const currentWindowIdx = Math.floor(now / windowMs);
  const prevWindowIdx = currentWindowIdx - 1;
  const elapsedFraction = (now % windowMs) / windowMs;

  const currentKey = `rl:sw:${key}:${currentWindowIdx}`;
  const prevKey    = `rl:sw:${key}:${prevWindowIdx}`;

  // Use a pipeline to send multiple commands in one round trip
  const pipeline = redis.multi();
  pipeline.get(prevKey);    // Get previous window count
  pipeline.incr(currentKey); // Atomically increment current window
  pipeline.pExpire(currentKey, windowMs * 2); // Set TTL (if not already)

  const [prevCountStr, currentCount] = await pipeline.exec();
  const prevCount = parseInt(prevCountStr ?? '0', 10);

  // Interpolate
  const prevWeight = 1 - elapsedFraction;
  const estimate = currentCount + prevCount * prevWeight;

  if (estimate > limit) {
    // Rolled over the limit — rollback the increment
    await redis.decr(currentKey);
    return { allowed: false, estimate: Math.ceil(estimate), limit };
  }

  return {
    allowed: true,
    estimate: Math.ceil(estimate),
    remaining: Math.max(0, Math.floor(limit - estimate)),
    limit,
  };
}
```

### Token Bucket with Redis Lua (Production-Grade)

This is the implementation used by production systems at scale. The entire token bucket logic runs inside Redis as a Lua script, making it perfectly atomic.

```javascript
const TOKEN_BUCKET_LUA = `
  -- KEYS[1] = bucket key (stores hash: tokens, last_refill)
  -- ARGV[1] = capacity
  -- ARGV[2] = refill_rate (tokens per second)
  -- ARGV[3] = current time (milliseconds)
  -- ARGV[4] = cost (tokens to consume)

  local capacity    = tonumber(ARGV[1])
  local refill_rate = tonumber(ARGV[2])  -- tokens/sec
  local now         = tonumber(ARGV[3])  -- milliseconds
  local cost        = tonumber(ARGV[4])

  -- Load bucket state (returns array of field values)
  local bucket = redis.call('HMGET', KEYS[1], 'tokens', 'last_refill')
  local tokens      = tonumber(bucket[1]) or capacity  -- start full
  local last_refill = tonumber(bucket[2]) or now

  -- Calculate how many tokens to add (lazy refill)
  local elapsed_seconds = (now - last_refill) / 1000.0
  local tokens_to_add   = elapsed_seconds * refill_rate
  tokens = math.min(capacity, tokens + tokens_to_add)

  -- Try to consume
  if tokens < cost then
    -- Not enough tokens — update bucket state (refill only, don't consume)
    redis.call('HMSET', KEYS[1], 'tokens', tokens, 'last_refill', now)
    -- TTL: time until bucket could refill from empty
    local ttl_ms = math.ceil((capacity / refill_rate) * 1000) * 2
    redis.call('PEXPIRE', KEYS[1], ttl_ms)
    return {0, tokens, 0}  -- {allowed, tokens, tokens_consumed}
  end

  -- Consume tokens
  tokens = tokens - cost
  redis.call('HMSET', KEYS[1], 'tokens', tokens, 'last_refill', now)
  local ttl_ms = math.ceil((capacity / refill_rate) * 1000) * 2
  redis.call('PEXPIRE', KEYS[1], ttl_ms)
  return {1, tokens, cost}  -- {allowed, remaining_tokens, tokens_consumed}
`;

class RedisTokenBucket {
  constructor(redisClient, { capacity, refillRatePerSec }) {
    this.redis = redisClient;
    this.capacity = capacity;
    this.refillRate = refillRatePerSec;
  }

  async consume(key, cost = 1) {
    const now = Date.now();
    const bucketKey = `tb:${key}`;

    const result = await this.redis.eval(TOKEN_BUCKET_LUA, {
      keys: [bucketKey],
      arguments: [
        String(this.capacity),
        String(this.refillRate),
        String(now),
        String(cost),
      ],
    });

    const [allowed, tokens] = result;
    const isAllowed = allowed === 1;

    const retryAfterMs = isAllowed
      ? 0
      : Math.ceil(((cost - tokens) / this.refillRate) * 1000);

    return {
      allowed: isAllowed,
      tokens: Math.floor(tokens * 100) / 100,
      capacity: this.capacity,
      retryAfterMs,
    };
  }
}

// Usage in Express middleware
const tokenBucket = new RedisTokenBucket(redis, { capacity: 10, refillRatePerSec: 2 });

app.use(async (req, res, next) => {
  const key = req.user?.id ?? req.ip;
  const result = await tokenBucket.consume(key);

  res.set('X-RateLimit-Remaining', result.tokens);
  res.set('X-RateLimit-Capacity', result.capacity);

  if (!result.allowed) {
    res.set('Retry-After', Math.ceil(result.retryAfterMs / 1000));
    return res.status(429).json({ error: 'Rate limit exceeded' });
  }

  next();
});
```

### Redis data structure choices

```
Algorithm              Redis Data Structure     Operations Used
─────────────────────────────────────────────────────────────────
Fixed Window           String (integer)         INCR, EXPIRE
Sliding Window Log     Sorted Set (ZSET)        ZADD, ZRANGEBYSCORE, ZREMRANGEBYSCORE
Sliding Window Counter String (integer) × 2    GET, INCR, PEXPIRE
Token Bucket           Hash (HMGET/HMSET)       HMGET, HMSET, PEXPIRE
─────────────────────────────────────────────────────────────────
```

### Redis Sorted Set for Sliding Window Log

```javascript
// Sliding Window Log with Redis Sorted Set
// Score = timestamp, Member = unique request ID (or timestamp as string)

async function slidingWindowLogCheck(key, limit, windowMs) {
  const now = Date.now();
  const windowStart = now - windowMs;
  const redisKey = `rl:log:${key}`;

  const luaScript = `
    local key        = KEYS[1]
    local now        = tonumber(ARGV[1])
    local window_start = tonumber(ARGV[2])
    local limit      = tonumber(ARGV[3])
    local ttl        = tonumber(ARGV[4])

    -- Remove entries outside the window (older than windowStart)
    redis.call('ZREMRANGEBYSCORE', key, '-inf', window_start)

    -- Count remaining entries in window
    local count = redis.call('ZCARD', key)

    if count >= limit then
      -- Get oldest entry to compute retry time
      local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
      return {0, count, tonumber(oldest[2] or 0)}
    end

    -- Add current request (score=timestamp, member=unique ID)
    redis.call('ZADD', key, now, now .. '-' .. math.random(1000000))
    redis.call('PEXPIRE', key, ttl)

    return {1, count + 1, 0}
  `;

  const [allowed, count, oldestTimestamp] = await redis.eval(luaScript, {
    keys: [redisKey],
    arguments: [
      String(now),
      String(windowStart),
      String(limit),
      String(windowMs * 2), // TTL
    ],
  });

  const isAllowed = allowed === 1;
  const retryAfterMs = isAllowed
    ? 0
    : Math.max(0, oldestTimestamp + windowMs - now);

  return {
    allowed: isAllowed,
    count,
    remaining: Math.max(0, limit - count),
    limit,
    retryAfterMs,
  };
}
```

---

## 14. HTTP Headers & Client Communication

### Why headers matter

When a request is rate limited, the client needs to know:
1. What the limit is (so they can plan)
2. How many requests they have left (so they can pace themselves)
3. When the limit resets (so they know when to retry)
4. How long to wait before retrying (for 429 responses)

Without this information, clients either retry immediately (making the problem worse) or give up entirely. Good headers enable **smart, cooperative backoff**.

### Standard headers

```
X-RateLimit-Limit: 100
  → The maximum number of requests allowed in the window.
  → Clients use this to understand their quota.

X-RateLimit-Remaining: 42
  → How many requests the client can still make in the current window.
  → Clients use this to self-throttle before hitting 0.

X-RateLimit-Reset: 1710533040
  → Unix timestamp (seconds) when the counter resets.
  → For Fixed Window and Sliding Window algorithms.

Retry-After: 47
  → Seconds until the client can retry (sent only on 429 responses).
  → Clients MUST respect this and not retry sooner.

RateLimit-Policy: 100;w=60
  → IETF draft standard (RFC 6585 extension).
  → Machine-readable: "100 requests per 60-second window".
```

### Full implementation

```javascript
/**
 * Middleware factory that wraps any rate limiter and adds proper HTTP headers.
 *
 * @param {Function} checkFn  - async (key) => { allowed, remaining, resetAt, retryAfterMs }
 * @param {Function} keyFn    - (req) => string  key extractor
 * @param {number}   limit    - The limit value (for X-RateLimit-Limit header)
 */
function withRateLimitHeaders(checkFn, keyFn, limit) {
  return async (req, res, next) => {
    const key = keyFn(req);
    let result;

    try {
      result = await checkFn(key);
    } catch (err) {
      // If rate limiter fails (e.g., Redis down), fail open (allow request)
      // This is a deliberate choice: availability over rate limiting
      console.error('Rate limiter error:', err);
      return next();
    }

    // ── Always send informational headers ──────────────────────────────────
    // These help clients understand their current standing
    const headers = {
      'X-RateLimit-Limit': limit,
      'X-RateLimit-Remaining': result.remaining ?? 0,
    };

    if (result.resetAt instanceof Date) {
      headers['X-RateLimit-Reset'] = Math.floor(result.resetAt.getTime() / 1000);
    }

    // IETF draft format: "N;w=T" where N=limit, T=window in seconds
    // headers['RateLimit-Policy'] = `${limit};w=${windowMs / 1000}`;

    res.set(headers);

    if (!result.allowed) {
      // ── 429 response headers ─────────────────────────────────────────────
      const retrySeconds = result.retryAfterMs
        ? Math.ceil(result.retryAfterMs / 1000)
        : result.resetAt
          ? Math.ceil((result.resetAt.getTime() - Date.now()) / 1000)
          : 60; // Default: tell client to wait 60 seconds

      res.set('Retry-After', retrySeconds);

      return res.status(429).json({
        error: 'Too Many Requests',
        message: `Rate limit exceeded. You can retry in ${retrySeconds} seconds.`,
        limit,
        remaining: 0,
        retryAfter: retrySeconds,
        resetAt: result.resetAt ?? null,
      });
    }

    next();
  };
}
```

### Client-side header reading

```javascript
async function makeRequest(url) {
  const response = await fetch(url);

  // Read rate limit state from response headers
  const limit     = parseInt(response.headers.get('X-RateLimit-Limit') ?? '0');
  const remaining = parseInt(response.headers.get('X-RateLimit-Remaining') ?? '0');
  const reset     = parseInt(response.headers.get('X-RateLimit-Reset') ?? '0');

  console.log(`Rate limit: ${remaining}/${limit} remaining, resets at ${new Date(reset * 1000)}`);

  if (response.status === 429) {
    const retryAfter = parseInt(response.headers.get('Retry-After') ?? '60');
    console.log(`Rate limited. Waiting ${retryAfter}s before retry...`);
    await new Promise(r => setTimeout(r, retryAfter * 1000));
    return makeRequest(url); // Retry after waiting
  }

  // Proactive self-throttling: slow down before hitting the limit
  if (remaining < 5) {
    const msUntilReset = reset * 1000 - Date.now();
    const delayPerRequest = msUntilReset / remaining;
    console.log(`Getting close to limit. Spacing requests by ${delayPerRequest}ms`);
    await new Promise(r => setTimeout(r, delayPerRequest));
  }

  return response;
}
```

---

## 15. Rate Limiting in Express.js

### Setup with express-rate-limit

```javascript
import express from 'express';
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { createClient } from 'redis';

const app = express();
const redis = createClient({ url: process.env.REDIS_URL });
await redis.connect();

// ─── 1. Global "safety net" limit ────────────────────────────────────────
// Protects against obvious abuse across all routes.
// Should be generous enough not to affect legitimate users.
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 300,                 // 300 requests per 15 min per IP
  standardHeaders: 'draft-7', // Use standard RateLimit-* headers
  legacyHeaders: false,       // Disable X-RateLimit-* legacy headers
  store: new RedisStore({
    sendCommand: (...args) => redis.sendCommand(args),
    prefix: 'rl:global:',
  }),
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many requests from this IP. Please try again later.',
    });
  },
});

// ─── 2. Auth endpoints — strict, security-critical ───────────────────────
// Prevents brute force. Uses Sliding Window Log semantics via redis store.
const authLimiter = rateLimit({
  windowMs: 60 * 1000,        // 1 minute window
  limit: 5,                    // Only 5 attempts per minute per IP
  skipSuccessfulRequests: true, // Don't count successful logins against limit
  keyGenerator: (req) => {
    // Rate limit by IP + email combination for smarter protection
    // This prevents one IP from trying the same email repeatedly,
    // AND prevents one email from being targeted from many IPs
    const email = req.body?.email?.toLowerCase() ?? '';
    return `${req.ip}:${email}`;
  },
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many login attempts',
      message: 'Your account has been temporarily locked. Try again in 1 minute.',
    });
  },
});

// ─── 3. Dynamic tier-based limits ────────────────────────────────────────
// Different users get different limits based on their subscription.
const tieredLimiter = rateLimit({
  windowMs: 60 * 1000,
  // Dynamic limit: function is called per request
  limit: async (req) => {
    if (!req.user) return 10; // Unauthenticated
    const tier = await getUserTier(req.user.id);
    const TIER_LIMITS = { free: 20, starter: 100, pro: 500, enterprise: 5000 };
    return TIER_LIMITS[tier] ?? 20;
  },
  keyGenerator: (req) => req.user?.id ?? req.ip,
  standardHeaders: 'draft-7',
});

// ─── Apply limiters ───────────────────────────────────────────────────────
app.use(globalLimiter);                        // All routes
app.use('/api/auth', authLimiter);             // Auth routes
app.use('/api', tieredLimiter);                // Authenticated API routes

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  // ... login logic
  res.json({ token: 'jwt...' });
});

app.get('/api/data', (req, res) => {
  res.json({ data: [] });
});
```

### Building a full custom rate limit manager

```javascript
/**
 * RateLimitManager — a flexible, multi-rule rate limiter for Express.
 *
 * Supports:
 *  - Multiple rules with different limits per route
 *  - Dynamic key extraction (IP, user, API key, etc.)
 *  - Custom block handlers
 *  - Bypass for internal/trusted sources
 */
class RateLimitManager {
  constructor(redisClient) {
    this.redis = redisClient;
    this.rules = [];
    this.trustedTokens = new Set(
      (process.env.INTERNAL_TOKENS ?? '').split(',').filter(Boolean)
    );
  }

  /**
   * Register a rate limit rule for a path prefix.
   * Rules are checked in registration order — first match wins.
   */
  rule(pathPrefix, options) {
    this.rules.push({
      pathPrefix,
      limit:      options.limit,
      windowMs:   options.windowMs,
      algorithm:  options.algorithm ?? 'sliding-window-counter',
      keyFn:      options.keyFn ?? ((req) => req.ip),
      skipFn:     options.skipFn ?? (() => false), // Skip rate limiting for some requests
      onBlock:    options.onBlock ?? this._defaultBlockHandler,
    });
    return this;
  }

  /**
   * Returns Express middleware that enforces all registered rules.
   */
  middleware() {
    return async (req, res, next) => {
      // ── Bypass for internal/trusted services ───────────────────────────
      const internalToken = req.headers['x-internal-token'];
      if (internalToken && this.trustedTokens.has(internalToken)) {
        return next(); // No rate limiting for trusted internal calls
      }

      // ── Find matching rule ─────────────────────────────────────────────
      const rule = this.rules.find(r => req.path.startsWith(r.pathPrefix));
      if (!rule) return next(); // No rule = no limiting

      // ── Check if this request should be skipped ────────────────────────
      if (rule.skipFn(req)) return next();

      // ── Build the key ──────────────────────────────────────────────────
      const key = rule.keyFn(req);
      if (!key) return next(); // No key = can't limit (e.g., missing auth)

      // ── Check the rate limit ───────────────────────────────────────────
      const result = await this._check(key, rule);

      // ── Set response headers ───────────────────────────────────────────
      res.set('X-RateLimit-Limit', rule.limit);
      res.set('X-RateLimit-Remaining', result.remaining ?? 0);
      if (result.resetAt) {
        res.set('X-RateLimit-Reset', Math.floor(result.resetAt.getTime() / 1000));
      }

      if (!result.allowed) {
        return rule.onBlock(req, res, result);
      }

      next();
    };
  }

  async _check(key, rule) {
    // Route to appropriate algorithm implementation
    switch (rule.algorithm) {
      case 'fixed-window':
        return fixedWindowCheck(this.redis, key, rule.limit, rule.windowMs);
      case 'sliding-window-counter':
        return slidingWindowCheck(this.redis, key, rule.limit, rule.windowMs);
      case 'token-bucket':
        return tokenBucketCheck(this.redis, key, rule.limit, rule.windowMs);
      default:
        return slidingWindowCheck(this.redis, key, rule.limit, rule.windowMs);
    }
  }

  _defaultBlockHandler(req, res, result) {
    const retryAfter = result.retryAfterMs
      ? Math.ceil(result.retryAfterMs / 1000)
      : 60;
    res.set('Retry-After', retryAfter);
    res.status(429).json({
      error: 'Too Many Requests',
      retryAfter,
    });
  }
}

// ─── Usage ────────────────────────────────────────────────────────────────

const manager = new RateLimitManager(redis);

manager
  // Strict: login brute-force protection
  .rule('/api/auth/login', {
    limit: 5,
    windowMs: 60_000,
    algorithm: 'sliding-window-counter',
    keyFn: (req) => `login:${req.ip}:${req.body?.email ?? ''}`,
    onBlock: (req, res) => {
      res.status(429).json({
        error: 'Too many login attempts. Account temporarily locked.',
      });
    },
  })

  // Moderate: general API usage per user
  .rule('/api', {
    limit: 100,
    windowMs: 60_000,
    algorithm: 'token-bucket',
    keyFn: (req) => req.user ? `user:${req.user.id}` : `ip:${req.ip}`,
    skipFn: (req) => req.user?.role === 'admin', // Admins bypass limits
  });

app.use(manager.middleware());
```

---

## 16. Rate Limiting on the Client Side

### Why clients need rate limiting too

The server protects itself, but the client also benefits from rate limiting:

1. **Preventing unnecessary 429s** — if you know you'll be rate limited, slow down before being rejected
2. **Respecting third-party limits** — when calling external APIs, you must honor their limits
3. **Avoiding thundering herd** — when your app restarts or wakes up, don't fire all pending requests at once
4. **Better UX** — queue requests instead of failing them; user sees completion, not errors

### Exponential backoff with jitter

When you get a 429, simply waiting `Retry-After` seconds and retrying is not enough. If many clients get rate limited at the same time and all retry at the same moment, you get a **synchronized thundering herd** — they'll all get rate limited again.

The solution is **jitter** — random variance in the wait time so clients desynchronize.

```javascript
/**
 * Exponential backoff with full jitter.
 *
 * Wait time formula:
 *   base delay × 2^attempt + random(0, base delay × 2^attempt)
 *
 * This spreads retries over a wide time range, preventing synchronized storms.
 */
async function fetchWithRetry(url, options = {}, config = {}) {
  const {
    maxRetries = 3,
    baseDelayMs = 1000,    // Start with 1 second
    maxDelayMs = 30_000,   // Never wait more than 30 seconds
    retryOn = [429, 503],  // Status codes that trigger retry
  } = config;

  let attempt = 0;

  while (attempt <= maxRetries) {
    let response;

    try {
      response = await fetch(url, options);
    } catch (networkError) {
      // Network error (not HTTP error) — always retry with backoff
      if (attempt >= maxRetries) throw networkError;
    }

    // Success or non-retriable error
    if (response && !retryOn.includes(response.status)) {
      return response;
    }

    if (attempt >= maxRetries) {
      return response; // Return the last failed response
    }

    // ── Calculate wait time ───────────────────────────────────────────────

    let waitMs;

    if (response?.status === 429) {
      // Server told us exactly how long to wait — respect it
      const retryAfter = response.headers.get('Retry-After');
      if (retryAfter) {
        waitMs = parseInt(retryAfter, 10) * 1000;
        // Add small jitter even to server-specified delays
        waitMs += Math.random() * 1000;
      }
    }

    if (!waitMs) {
      // Exponential backoff with full jitter:
      // cap = min(maxDelay, base × 2^attempt)
      // wait = random(0, cap)
      const cap = Math.min(maxDelayMs, baseDelayMs * Math.pow(2, attempt));
      waitMs = Math.random() * cap; // Full jitter: anywhere from 0 to cap
    }

    console.log(`Attempt ${attempt + 1} failed. Retrying in ${Math.round(waitMs)}ms`);
    await new Promise(r => setTimeout(r, waitMs));
    attempt++;
  }
}
```

### Client-side request queue (outgoing rate control)

```javascript
/**
 * APIClient — wraps fetch with built-in rate limiting.
 *
 * Uses the Leaky Bucket algorithm to ensure outgoing requests
 * never exceed the specified rate, protecting external APIs.
 */
class APIClient {
  constructor({ baseURL, requestsPerSecond = 10, maxQueueSize = 100 }) {
    this.baseURL = baseURL;
    this.intervalMs = 1000 / requestsPerSecond; // ms between requests
    this.maxQueueSize = maxQueueSize;
    this.queue = [];
    this.processing = false;
    this.stats = { sent: 0, rejected: 0, totalWaitMs: 0 };
  }

  async get(path, options = {}) {
    return this._enqueue('GET', path, null, options);
  }

  async post(path, body, options = {}) {
    return this._enqueue('POST', path, body, options);
  }

  async delete(path, options = {}) {
    return this._enqueue('DELETE', path, null, options);
  }

  _enqueue(method, path, body, options) {
    if (this.queue.length >= this.maxQueueSize) {
      this.stats.rejected++;
      return Promise.reject(
        new Error(`APIClient queue full (${this.maxQueueSize} items). Too many pending requests.`)
      );
    }

    return new Promise((resolve, reject) => {
      const item = {
        method,
        path,
        body,
        options,
        resolve,
        reject,
        enqueuedAt: Date.now(),
      };

      this.queue.push(item);

      if (!this.processing) {
        this._process();
      }
    });
  }

  async _process() {
    this.processing = true;

    while (this.queue.length > 0) {
      const item = this.queue.shift();
      const waitTime = Date.now() - item.enqueuedAt;
      this.stats.totalWaitMs += waitTime;

      try {
        const fetchOptions = {
          method: item.method,
          ...item.options,
          headers: {
            'Content-Type': 'application/json',
            ...item.options.headers,
          },
        };

        if (item.body) {
          fetchOptions.body = JSON.stringify(item.body);
        }

        const response = await fetch(`${this.baseURL}${item.path}`, fetchOptions);
        this.stats.sent++;
        item.resolve(response);
      } catch (err) {
        item.reject(err);
      }

      // Rate control: wait before next request
      if (this.queue.length > 0) {
        await new Promise(r => setTimeout(r, this.intervalMs));
      }
    }

    this.processing = false;
  }

  getStats() {
    return {
      ...this.stats,
      queueSize: this.queue.length,
      avgWaitMs: this.stats.sent > 0
        ? Math.round(this.stats.totalWaitMs / this.stats.sent)
        : 0,
    };
  }
}

// ─── Usage ────────────────────────────────────────────────────────────────

const githubAPI = new APIClient({
  baseURL: 'https://api.github.com',
  requestsPerSecond: 5,   // GitHub allows 5000/hr for authenticated = ~1.4/sec
  maxQueueSize: 50,
});

// Fire 20 requests all at once — they'll be automatically spaced
const repos = await Promise.all(
  ['react', 'vue', 'angular', 'svelte', 'solid'].map(name =>
    githubAPI.get(`/repos/facebook/${name}`)
      .then(r => r.json())
  )
);

console.log('API stats:', githubAPI.getStats());
// { sent: 5, rejected: 0, avgWaitMs: 200, queueSize: 0 }
```

---

## 17. Advanced Patterns

### Pattern 1: Tiered Rate Limits (Free vs Pro vs Enterprise)

The most common real-world pattern. Different user tiers get different limits.

```javascript
// Define tiers with all rate limit parameters
const RATE_LIMIT_TIERS = {
  anonymous: {
    requestsPerMin: 10,
    burstCapacity: 5,
    dailyLimit: 100,
  },
  free: {
    requestsPerMin: 30,
    burstCapacity: 10,
    dailyLimit: 1000,
  },
  pro: {
    requestsPerMin: 200,
    burstCapacity: 50,
    dailyLimit: 50_000,
  },
  enterprise: {
    requestsPerMin: 1000,
    burstCapacity: 200,
    dailyLimit: 1_000_000,
  },
};

// Middleware that enforces both per-minute AND daily limits
async function tieredRateLimitMiddleware(req, res, next) {
  // Get tier from user (fetched during auth middleware)
  const tierName = req.user?.plan ?? 'anonymous';
  const tier = RATE_LIMIT_TIERS[tierName];
  const userId = req.user?.id ?? req.ip;

  // Check 1: Per-minute limit (Token Bucket for burst support)
  const minuteResult = await tokenBucket.consume(
    `tier:minute:${userId}`,
    1,
    { capacity: tier.burstCapacity, refillRate: tier.requestsPerMin / 60 }
  );

  // Check 2: Daily limit (Fixed Window, resets at midnight)
  const today = new Date().toISOString().split('T')[0]; // "2024-03-15"
  const dailyResult = await fixedWindowCheck(
    `tier:daily:${userId}:${today}`,
    tier.dailyLimit,
    24 * 60 * 60 * 1000
  );

  // Both must pass
  if (!minuteResult.allowed || !dailyResult.allowed) {
    const blocked = !minuteResult.allowed ? minuteResult : dailyResult;
    res.set('X-RateLimit-Tier', tierName);
    res.set('Retry-After', Math.ceil((blocked.retryAfterMs ?? 60_000) / 1000));
    return res.status(429).json({
      error: 'Rate limit exceeded',
      tier: tierName,
      upgradeUrl: '/pricing',
    });
  }

  res.set('X-RateLimit-Tier', tierName);
  res.set('X-RateLimit-Daily-Remaining', dailyResult.remaining);
  next();
}
```

### Pattern 2: Adaptive Rate Limiting

Dynamically tighten limits when the server is under stress, loosen them when healthy.

```javascript
class AdaptiveRateLimiter {
  constructor({ baseLimiter, metricsCollector }) {
    this.limiter = baseLimiter;
    this.metrics = metricsCollector;
    this.scaleFactor = 1.0; // 1.0 = full limits, 0.5 = half limits

    // Update scale factor every 5 seconds based on system health
    setInterval(() => this._updateScaleFactor(), 5000);
  }

  async check(key, baseLimit) {
    // Apply scale factor to the limit
    const adjustedLimit = Math.max(1, Math.floor(baseLimit * this.scaleFactor));
    const result = await this.limiter.check(key, adjustedLimit);

    return {
      ...result,
      originalLimit: baseLimit,
      adjustedLimit,
      scaleFactor: this.scaleFactor,
    };
  }

  async _updateScaleFactor() {
    const health = await this.metrics.getSystemHealth();

    // Scale down when under stress
    if (health.cpuUsage > 0.85 || health.p99LatencyMs > 800 || health.errorRate > 0.05) {
      this.scaleFactor = Math.max(0.1, this.scaleFactor * 0.8); // Reduce by 20%
      console.warn(`System under stress. Rate limits reduced to ${Math.round(this.scaleFactor * 100)}%`);
    }
    // Scale back up when healthy
    else if (health.cpuUsage < 0.6 && health.p99LatencyMs < 200 && health.errorRate < 0.01) {
      this.scaleFactor = Math.min(1.0, this.scaleFactor * 1.05); // Increase by 5%
    }
  }
}
```

### Pattern 3: Weighted Cost Per Operation

Not all requests are equal. A DB write costs more than a cache read. This pattern lets you express that.

```javascript
// Define costs relative to a "unit" of server work
const OPERATION_COSTS = {
  'GET /api/users':            1,   // Simple cache lookup
  'GET /api/reports':          10,  // Expensive DB query
  'POST /api/users':           3,   // DB write
  'POST /api/send-email':      5,   // External service call
  'POST /api/bulk-import':     50,  // Very expensive batch operation
  'GET /api/export-csv':       100, // Extremely expensive — full table scan
};

// Shared token bucket: all operations draw from the same pool
const sharedBucket = new RedisTokenBucket(redis, {
  capacity: 100,      // 100 "units" of work per user at once
  refillRatePerSec: 10, // Earn 10 "units" per second
});

app.use(async (req, res, next) => {
  const routeKey = `${req.method} ${req.route?.path ?? req.path}`;
  const cost = OPERATION_COSTS[routeKey] ?? 1;

  const result = await sharedBucket.consume(`user:${req.user.id}`, cost);

  res.set('X-RateLimit-Cost', cost);
  res.set('X-RateLimit-Remaining-Units', Math.floor(result.tokens));

  if (!result.allowed) {
    return res.status(429).json({
      error: 'Insufficient rate limit credits',
      operationCost: cost,
      availableCredits: Math.floor(result.tokens),
      retryAfterMs: result.retryAfterMs,
      message: `This operation costs ${cost} credits but you only have ${Math.floor(result.tokens)}.`,
    });
  }

  next();
});
```

### Pattern 4: Circuit Breaker + Rate Limiter

Combine rate limiting with circuit breaking for resilient downstream calls.

```javascript
const CircuitState = { CLOSED: 'CLOSED', OPEN: 'OPEN', HALF_OPEN: 'HALF_OPEN' };

class ResilientAPIClient {
  constructor({ ratePerSec, failureThreshold = 5, recoveryMs = 30_000 }) {
    // Rate limiter: Leaky Bucket for outgoing calls
    this.rateLimiter = new LeakyBucketQueue({ capacity: 50, requestsPerSec: ratePerSec });

    // Circuit breaker state
    this.circuitState = CircuitState.CLOSED;
    this.failureCount = 0;
    this.failureThreshold = failureThreshold;
    this.lastFailureTime = null;
    this.recoveryMs = recoveryMs;
  }

  async call(fn) {
    // ── Circuit Breaker Check ─────────────────────────────────────────────
    if (this.circuitState === CircuitState.OPEN) {
      const timeSinceFailure = Date.now() - this.lastFailureTime;
      if (timeSinceFailure < this.recoveryMs) {
        throw new Error(`Circuit OPEN. Downstream unavailable. Retry in ${
          Math.ceil((this.recoveryMs - timeSinceFailure) / 1000)
        }s`);
      }
      // Try recovery
      this.circuitState = CircuitState.HALF_OPEN;
    }

    // ── Rate Limited Execution ────────────────────────────────────────────
    try {
      const result = await this.rateLimiter.add(fn);

      // Success: reset failure count, close circuit
      this.failureCount = 0;
      if (this.circuitState === CircuitState.HALF_OPEN) {
        this.circuitState = CircuitState.CLOSED;
        console.log('Circuit CLOSED — downstream recovered');
      }

      return result;
    } catch (err) {
      this.failureCount++;
      this.lastFailureTime = Date.now();

      if (this.failureCount >= this.failureThreshold) {
        this.circuitState = CircuitState.OPEN;
        console.error(`Circuit OPEN after ${this.failureCount} failures`);
      }

      throw err;
    }
  }
}
```

### Pattern 5: Rate Limit Bypass for Internal Services

Internal microservices often need to bypass user-facing rate limits.

```javascript
// Token-based bypass (safest approach)
const INTERNAL_TOKENS = new Set(
  process.env.INTERNAL_API_TOKENS?.split(',') ?? []
);

// IP-based bypass (simpler but easier to spoof — only use in VPC)
function isInternalIP(ip) {
  return (
    ip.startsWith('10.')   ||   // RFC 1918 private
    ip.startsWith('172.16.') || // RFC 1918 private
    ip.startsWith('192.168.') ||// RFC 1918 private
    ip === '127.0.0.1'         // Localhost
  );
}

function rateLimitWithBypass(limiter) {
  return async (req, res, next) => {
    // Method 1: Internal API token in header
    const internalToken = req.headers['x-internal-token'];
    if (internalToken && INTERNAL_TOKENS.has(internalToken)) {
      res.set('X-RateLimit-Bypass', 'internal-token');
      return next();
    }

    // Method 2: Service account role
    if (req.user?.role === 'service-account') {
      res.set('X-RateLimit-Bypass', 'service-account');
      return next();
    }

    // Method 3: Internal network (only safe in private VPC)
    if (process.env.NODE_ENV === 'production' && isInternalIP(req.ip)) {
      res.set('X-RateLimit-Bypass', 'internal-ip');
      return next();
    }

    // Normal rate limiting for all other requests
    return limiter(req, res, next);
  };
}
```

---

## 18. When to Use Which Algorithm — Decision Guide

### By use case

| Use Case                      | Algorithm                 | Why                                                   |
|-------------------------------|---------------------------|-------------------------------------------------------|
| Login / registration          | Sliding Window Log        | Must be exact; low volume; security-critical          |
| Password reset / OTP          | Sliding Window Log        | Exact, strict, few requests expected                  |
| Payment / checkout            | Sliding Window Log        | No tolerance for boundary attacks on financial ops    |
| General REST API              | Sliding Window Counter    | Balanced: accurate, fast, O(1) memory                 |
| Search / autocomplete         | Token Bucket              | Allow initial burst as user types, then steady        |
| File upload / download        | Token Bucket or Leaky     | Token for burst tolerance; Leaky for bandwidth control|
| WebSocket messages            | Token Bucket              | Real-time needs burst tolerance                       |
| Outgoing HTTP calls (3rd party)| Leaky Bucket (queue)     | Never exceed downstream's rate limit; smooth output  |
| DDoS protection (edge/CDN)    | Fixed Window              | Fastest, lowest overhead at massive scale             |
| SMS / email notifications     | Fixed Window              | Forgiving UX; cost control; simple to explain         |
| B2B API with monthly quotas   | Token Bucket (Redis)      | Burst support, weighted costs, distributed            |
| Internal service-to-service   | Token Bucket              | Allow bursts from batch jobs; simple to implement     |
| Expensive DB queries          | Token Bucket (weighted)   | Assign higher costs to heavy queries                  |
| Image/AI generation           | Token Bucket (weighted)   | Each generation consumes N credits from bucket        |

### By traffic level

```
< 1k req/min:    Any algorithm works well.
                 → Prefer Sliding Window Log for accuracy.

1k–100k req/min: Memory and speed become important.
                 → Use Sliding Window Counter or Token Bucket.

> 100k req/min:  Must be highly optimized.
                 → Fixed Window (fastest) or Token Bucket (Redis + Lua).
                 → Avoid Sliding Window Log (memory-intensive at scale).
```

### By team/context

```
New team, simple service:      Fixed Window Counter
                               Simple to understand, debug, and explain.

Growing product, general API:  Sliding Window Counter (Redis)
                               Good accuracy, fast, distributed-safe.

Security-sensitive endpoint:   Sliding Window Log
                               Don't cut corners on auth/payments.

High-traffic platform:         Token Bucket (Redis + Lua)
                               Industry standard, handles burst, scales.

Calling external APIs:         Leaky Bucket (queue)
                               Never exceed their limits.
```

---

## 19. Common Pitfalls & How to Avoid Them

### Pitfall 1: The Boundary Attack on Fixed Window

**Problem:** A client can burst 2× the limit by sending half at window end and half at window start.

```javascript
// BAD: Fixed Window on security-sensitive endpoint
const loginLimiter = new FixedWindowRateLimiter({ limit: 10, windowMs: 60_000 });
// Attacker sends 10 at :59, then 10 at :01 = 20 attempts in 2 seconds
```

```javascript
// GOOD: Sliding Window for security-sensitive endpoints
const loginLimiter = new SlidingWindowLogRateLimiter({ limit: 10, windowMs: 60_000 });
// No window boundary — always looks back exactly 60 seconds
```

### Pitfall 2: Race Conditions Without Atomic Operations

**Problem:** Non-atomic read-then-write in distributed environments allows multiple requests through simultaneously.

```javascript
// BAD: Two servers read 99 simultaneously, both write 100, both allow
const count = await redis.get(key);          // Server A reads 99
                                             // Server B reads 99 (same time!)
if (count < limit) {
  await redis.set(key, parseInt(count) + 1); // Both write 100
  allowRequest();                            // BOTH allowed! Race condition.
}
```

```javascript
// GOOD: Atomic INCR returns the new value in one uninterruptible step
const count = await redis.incr(key); // Atomic: returns 100 to one, 101 to other
if (count === 1) await redis.expire(key, windowSeconds);
if (count > limit) return reject();  // Only count=101 gets rejected
allowRequest();
```

### Pitfall 3: Missing TTL on Keys (Memory Leak)

**Problem:** If you never expire rate limit keys, Redis slowly fills up with stale keys for IPs and users that haven't been seen in months.

```javascript
// BAD: Key never expires
await redis.incr('rl:user:12345:28508883');  // No TTL!
// After millions of requests, millions of stale keys pile up

// GOOD: Always set TTL
const lua = `
  local c = redis.call('INCR', KEYS[1])
  if c == 1 then
    redis.call('PEXPIRE', KEYS[1], ARGV[1])
  end
  return c
`;
// TTL set atomically with the first increment
```

### Pitfall 4: Using the Wrong Key — Sharing Limits Incorrectly

**Problem:** If you rate limit by IP only, users behind the same corporate NAT (same IP) share a rate limit. One heavy user can block all their colleagues.

```javascript
// BAD for office/corporate users: all employees share one IP limit
const key = `rl:ip:${req.ip}`;

// GOOD: prefer authenticated user ID when available; fall back to IP
const key = req.user
  ? `rl:user:${req.user.id}`
  : `rl:ip:${req.ip}`;

// EVEN BETTER: both limits apply simultaneously
async function check(req) {
  const results = await Promise.all([
    limiter.check(`rl:ip:${req.ip}`,    500, 60_000), // High IP limit
    req.user
      ? limiter.check(`rl:user:${req.user.id}`, 100, 60_000) // Per-user limit
      : Promise.resolve({ allowed: true }),
  ]);
  return results.every(r => r.allowed);
}
```

### Pitfall 5: Failing Closed vs Failing Open

**Problem:** When your Redis is down, what happens? If you fail closed (deny all requests), your app goes down with your rate limiter. If you fail open (allow all requests), you lose protection temporarily — which is usually acceptable.

```javascript
// BAD: Rate limiter failure takes down the whole service
app.use(async (req, res, next) => {
  const result = await redis.check(key); // If Redis is down → throws
  if (!result.allowed) return res.status(429).send();
  next();
});

// GOOD: Fail open — log the error, allow the request
app.use(async (req, res, next) => {
  try {
    const result = await redis.check(key);
    if (!result.allowed) return res.status(429).json({ error: 'Rate limited' });
    next();
  } catch (err) {
    // Redis is unavailable — log for alerting, but don't take down the service
    console.error('Rate limiter unavailable:', err.message);
    // Optional: fall back to a local in-memory limiter
    next(); // Fail open
  }
});
```

### Pitfall 6: Retrying Immediately After 429

**Problem:** If every client immediately retries on 429, the retry wave hits the server at the same time as the rate limit resets — causing another wave of 429s.

```javascript
// BAD: Immediate retry — synchronized retries storm the server
if (response.status === 429) {
  return makeRequest(url); // Retries instantly!
}

// GOOD: Read Retry-After header, add jitter
if (response.status === 429) {
  const retryAfter = parseInt(response.headers.get('Retry-After') ?? '1', 10);
  // Add random jitter (0-25% of wait time) to desynchronize retries
  const jitter = Math.random() * retryAfter * 0.25 * 1000;
  await new Promise(r => setTimeout(r, retryAfter * 1000 + jitter));
  return makeRequest(url);
}
```

### Pitfall 7: Not Accounting for Clock Skew in Distributed Systems

**Problem:** Server clocks in a cluster can differ by 50–500ms. For second-granularity windows, this causes some requests to be counted in the wrong window.

```javascript
// BAD: Using local server time — each server may assign requests to different windows
const windowIdx = Math.floor(Date.now() / windowMs);

// GOOD: Use Redis server time as the authoritative clock
// All servers ask Redis what time it is, so they all agree
const [seconds, microseconds] = await redis.time(); // Redis TIME command
const redisNowMs = seconds * 1000 + Math.floor(microseconds / 1000);
const windowIdx = Math.floor(redisNowMs / windowMs);
```

---

## Summary Cheatsheet

```
Algorithm              Memory   Speed    Burst?  Exact?  Best Use Case
─────────────────────────────────────────────────────────────────────────
Fixed Window           O(1)     ★★★★★    YES     ~85%    CDN/Edge, DDoS
Sliding Window Log     O(limit) ★★★      NO      100%    Login, payments
Sliding Window Counter O(1)     ★★★★★    NO      ~99%    General APIs
Token Bucket           O(1)     ★★★★★    YES     ~99%    Search, real-time
Leaky Bucket           O(cap)   ★★★      NO      100%    Outgoing calls
─────────────────────────────────────────────────────────────────────────

Default choice for most APIs: Token Bucket (Redis + Lua)
  ✓ Allows burst (good UX)
  ✓ Distributed-safe (atomic Lua)
  ✓ Weighted costs supported
  ✓ Used by GitHub, Stripe, AWS, Cloudflare

For security-critical endpoints: Sliding Window Log
  ✓ 100% accurate
  ✓ Exact retry time
  ✓ No boundary attacks possible
```
