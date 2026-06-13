# Memory Leak Detection & Debugging — Complete Guide (Basics to Advanced)

> A hands-on learning guide: every concept comes with a worked example, a runnable demo, and a **Your Turn** exercise so you build real intuition — not just read theory.

**Companion docs:** [`01-Event-Loop.md`](../01-Event-Loop.md), [`05-NodeJS-Internals.md`](../05-NodeJS-Internals.md), [`04-React-Internals.md`](../04-React-Internals.md), [`11-Frontend-Performance-Engineering-Complete-Guide.md`](../11-Frontend-Performance-Engineering-Complete-Guide.md)

**Runnable labs:** All Node.js demos live in [`labs/`](./labs/). React exercises use your `vite-react` app.

---

## How to Use This Guide

Every section follows the same rhythm:

```
┌─────────────┐     ┌─────────────┐     ┌──────────────────┐
│  LEARN      │ ──► │  SEE        │ ──► │  YOUR TURN       │
│  (concept)  │     │  (example)  │     │  (you try it)    │
└─────────────┘     └─────────────┘     └──────────────────┘
```

**Rules for learning:**

1. Read the concept first — understand *why* before *how*.
2. Run the example yourself — don't skip terminal or DevTools steps.
3. Do **Your Turn** before reading the solution at the bottom of the section.
4. Check **Expected result** — if yours differs, that's where real learning happens.

**Suggested path:**

| Week | Sections | Focus |
|------|----------|-------|
| 1 | 1–6 | Memory model, GC, what leaks are |
| 2 | 7–9 | Detection mindset + Chrome DevTools |
| 3 | 10–11 | Node.js leaks + profiling |
| 4 | 12–14 | Advanced patterns, decisions, pitfalls |

---

## Table of Contents

1. [What Is Memory Leak Detection? — The Real Explanation](#1-what-is-memory-leak-detection--the-real-explanation)
2. [Why Memory Leaks Matter — The Problems They Solve](#2-why-memory-leaks-matter--the-problems-they-solve)
3. [Core Concepts & Mental Models](#3-core-concepts--mental-models)
4. [JavaScript Memory Model — Stack, Heap, References](#4-javascript-memory-model--stack-heap-references)
5. [Garbage Collection — How V8 Decides What Lives](#5-garbage-collection--how-v8-decides-what-lives)
6. [What Is a Memory Leak? — Patterns You Will See Everywhere](#6-what-is-a-memory-leak--patterns-you-will-see-everywhere)
7. [The Detection Mindset — How to Investigate Any Leak](#7-the-detection-mindset--how-to-investigate-any-leak)
8. [Browser & React Leak Patterns](#8-browser--react-leak-patterns)
9. [Chrome DevTools — Hands-On Detection](#9-chrome-devtools--hands-on-detection)
10. [Node.js Leak Patterns](#10-nodejs-leak-patterns)
11. [Node.js Detection Tools — Hands-On Profiling](#11-nodejs-detection-tools--hands-on-profiling)
12. [Advanced Patterns](#12-advanced-patterns)
13. [When to Use What — Decision Guide](#13-when-to-use-what--decision-guide)
14. [Common Pitfalls & How to Avoid Them](#14-common-pitfalls--how-to-avoid-them)
15. [Solutions Appendix (All Your Turn Answers)](#15-solutions-appendix-all-your-turn-answers)

---

## Summary Cheatsheet

| Pattern | Symptom | Detect with | Fix |
|---------|---------|-------------|-----|
| Missing cleanup | Listeners/timers climb on route change | Performance monitor, snapshot `# Listener` | `useEffect` return cleanup |
| Unbounded cache | Map/Set size grows forever | `cache.size`, heap snapshot `(Map)` | LRU + TTL |
| Global retention | RSS stair-step at flat traffic | heapdump → `global` retainer | Remove global, bound array |
| Detached DOM | Tab memory huge, JS heap flat | Snapshot filter `Detached` | Delete refs on unmount |
| Closure capture | `(closure)` delta in snapshot | Retainers panel | Keep only needed fields |
| Fetch after unmount | State updates after navigate away | Network throttle + navigate | `AbortController` |
| EventEmitter | `MaxListenersExceededWarning` | `listenerCount()` | Return `off()` unsubscribe |
| Node streams | `external` climbs, `EMFILE` | `lsof`, `process.memoryUsage()` | `pipeline()`, `close()` |

**Default investigation:** Fixed repro → two snapshots → compare delta → walk retainers to root → fix → verify with third snapshot.

---

## 1. What Is Memory Leak Detection? — The Real Explanation

### The idea (real-world analogy)

Imagine a hotel where guests check out but their room keys are never returned to the front desk. The hotel keeps every room "occupied" forever — even though nobody is sleeping there. Eventually, new guests cannot get a room.

**Memory leak detection** is the process of finding those "keys still on the hook" — memory your program no longer needs but still holds a reference to, so the garbage collector cannot reclaim it.

### What the world looks like WITHOUT leak detection

```
Day 1 server start     Day 3 (same traffic)     Day 7
RSS: 200 MB            RSS: 800 MB              RSS: 2 GB → OOM kill
     ▲                      ▲                       ▲
  "looks fine"          "maybe a cache?"         "restart the pod"
```

You restart. Memory drops. It climbs again. You restart again. The **root cause** is never found.

### What it looks like WITH leak detection

```
Symptom spotted → Reproduce → Snapshot diff → Find retainer → Fix code → Verify flat memory
```

### Before / after diagram

```
WITHOUT DETECTION                    WITH DETECTION
┌──────────────────┐                ┌──────────────────┐
│ Memory climbs    │                │ Measure baseline │
│ Restart pod      │                │ Reproduce leak   │
│ Memory climbs    │                │ Compare snapshots│
│ Restart pod ...  │                │ Fix root cause   │
└──────────────────┘                │ Verify plateau   │
                                    └──────────────────┘
```

### Your Turn — Exercise 1.1: Observe Memory in Node.js

**Goal:** See that memory is measurable — not magic.

**Steps:**

1. Open a terminal in this repo.
2. Run:

```bash
node -e "
setInterval(() => {
  const m = process.memoryUsage();
  console.log(JSON.stringify({
    rss: Math.round(m.rss/1e6)+'MB',
    heapUsed: Math.round(m.heapUsed/1e6)+'MB',
  }));
}, 3000);
"
```

3. Watch output for 30 seconds. Note the numbers.

**Expected result:** `rss` and `heapUsed` print every 3 seconds with stable values (small jitter is normal).

**Bonus:** In Chrome, open any tab → `Shift+Esc` (Task Manager) → watch **Memory footprint** while navigating a heavy site like Gmail or Twitter.

---

## 2. Why Memory Leaks Matter — The Problems They Solve

### Problem 1: Tab crashes (browser)

A React SPA that leaks 2 MB per route navigation × 200 navigations = 400 MB of dead component state. Mobile Safari kills the tab.

### Problem 2: OOM kills (Node.js / Kubernetes)

```
Pod memory limit: 512 MB
Leak rate: 5 MB/hour under steady traffic
Time to death: ~4 days → random 502s → on-call page
```

### Problem 3: GC thrashing (performance)

More live objects → longer garbage collection pauses → scroll jank, API latency spikes (P99), event loop lag in Node.

### Problem 4: Hidden native memory

Detached DOM nodes and `Buffer` objects may not show in JS heap metrics but still consume RAM. `heapUsed` flat while `rss` climbs = native leak.

### Problem 5: Restart masking

Restarting pods "fixes" symptoms for hours. Without detection, the same bug ships again in the next feature.

### What breaks without understanding leaks

```javascript
// Looks innocent — runs fine in dev for 5 minutes
useEffect(() => {
  window.addEventListener('scroll', () => setY(window.scrollY));
}, []);
// After 8 hours of user navigation: 400 scroll listeners, 400 dead components retained
```

### Your Turn — Exercise 2.1: Feel the Cost of Retention

**Goal:** Allocate a large array and see memory jump.

**Steps:**

1. Run:

```bash
node -e "
const before = process.memoryUsage().heapUsed;
const big = new Array(10_000_000).fill('x');
const after = process.memoryUsage().heapUsed;
console.log('Allocated ~', ((after - before)/1e6).toFixed(1), 'MB');
setInterval(() => {}, 60000);
"
```

2. Note the MB allocated.
3. Kill the process (`Ctrl+C`).

**Expected result:** Roughly 80–150 MB jump depending on Node version (strings are not free).

**Think about:** What if your app created one such array per user session and never released it?

---

## 3. Core Concepts & Mental Models

### Terminology you will use constantly

| Term | Plain English | Example |
|------|---------------|---------|
| **Heap** | Storage for objects, arrays, closures | `{ users: [...] }` |
| **Stack** | Storage for function frames and primitives | `const count = 5` |
| **Reference** | Pointer from one variable to a heap object | `const a = obj` |
| **GC root** | Starting point GC uses to find live objects | `window`, `globalThis`, active stack |
| **Reachable** | Object has a path from a root | Listener closure → component state |
| **Retained** | Kept alive because something still points to it | Global Map holding old sessions |
| **Retainer** | The object holding the reference | `window` → `scroll listener` → `closure` |
| **Shallow size** | Size of object itself | One object, no children |
| **Retained size** | Object + everything only it keeps alive | Parent + entire subtree |
| **Detached DOM** | Removed from page but still referenced in JS | Modal div kept in a Map |
| **RSS** | Total RAM used by the process | What `kubectl top pod` shows |

### How terms connect

```
GC Root (window)
    │
    ▼
Event Listener (retainer)
    │
    ▼
Closure (retainer)
    │
    ▼
Component state array  ← LEAKED object (reachable but unused)
```

### Mental model: The reference graph

Think of memory as a **directed graph**. Garbage collection asks: "Starting from roots, what nodes can I reach?" Everything unreachable gets deleted.

```
        window
          │
    scroll listener
          │
       closure ──► [10 MB array]  ← reachable = NOT collected
```

Remove the listener → closure becomes unreachable → array collected.

### Your Turn — Exercise 3.1: Draw the Graph

**Goal:** Practice reading reference chains before touching DevTools.

**Given this code, draw stack vs heap and mark what is collectible:**

```javascript
const users = [{ id: 1 }, { id: 2 }];
const first = users[0];
users.length = 0;
```

**Expected answer:** `{ id: 1 }` is **NOT** collectible — `first` still references it. `{ id: 2 }` **IS** collectible (no references). See [Solution 3.1](#solution-31).

---

## 4. JavaScript Memory Model — Stack, Heap, References

### 4.1 Stack — fast, automatic, limited

**The idea:** Like a stack of plates. Each function call adds a plate; when the function returns, the plate is removed. No garbage collector needed.

```javascript
function add(a, b) {
  const sum = a + b;  // primitives live in the stack frame
  return sum;         // frame destroyed on return
}
```

```
call add(2, 3)
┌─────────────────┐
│ Frame: add      │
│  a = 2          │
│  b = 3          │
│  sum = 5        │
└─────────────────┘
        │ return
        ▼
   frame gone — automatic cleanup
```

### 4.2 Heap — objects live here

**The idea:** Objects have unknown size and lifetime. Variables on the stack hold **references** (addresses) pointing to heap objects.

```javascript
let objA = { count: 1 };
let objB = objA;
objB.count = 99;
console.log(objA.count); // 99 — same heap object
```

```
Stack                    Heap
┌─────────┐             ┌──────────────┐
│ objA ───┼────────────►│ { count: 99 }│
│ objB ───┼────────────►│              │
└─────────┘             └──────────────┘
```

### 4.3 Primitives vs references

```javascript
let a = 5;
let b = a;
b = 10;
console.log(a); // 5 — copied by value

let x = { n: 1 };
let y = x;
y.n = 2;
console.log(x.n); // 2 — shared reference
```

### 4.4 Closures retain outer scope

```javascript
function createHandler() {
  const huge = new Array(1_000_000).fill('data'); // lives on heap
  return () => console.log(huge.length);          // closure RETAINS huge
}

const handler = createHandler();
window.addEventListener('click', handler);
// huge stays alive as long as handler is registered
```

### Example walkthrough — closure retention

```
Step 1: createHandler() runs
        huge = [1M items] allocated on heap
        handler closure captures `huge`

Step 2: addEventListener('click', handler)
        window ──► handler ──► huge

Step 3: Component unmounts but forgets removeEventListener
        window STILL ──► handler ──► huge  ← LEAK
```

### Pros & cons — stack vs heap

| | Stack | Heap |
|---|-------|------|
| **Speed** | Very fast alloc/free | Slower (GC managed) |
| **Lifetime** | Function scope | Until unreachable |
| **Contents** | Primitives, refs | Objects, closures |
| **Cleanup** | Automatic on return | GC only |

### Your Turn — Exercise 4.1: Run the Reachability Lab

**Goal:** Prove that clearing an array does not free objects still referenced elsewhere.

**Steps:**

```bash
node javascript/memory-leak/labs/01-reachability.mjs
```

Then with forced GC:

```bash
node --expose-gc javascript/memory-leak/labs/01-reachability.mjs
```

**Expected result:**

- Alice's object still accessible via `first` after `users.length = 0`.
- With `--expose-gc`, the global handler survives `gc()` because `globalThis.__leakedHandler` is a root.

**Your challenge:** Edit the file — remove the line `globalThis.__leakedHandler = handler` and re-run with `--expose-gc`. What changes?

---

## 5. Garbage Collection — How V8 Decides What Lives

### The idea (bouncer with a guest list)

The garbage collector is a bouncer. It starts at **roots** (global object, current stack, DOM wrappers) and marks everyone reachable. Anything not marked gets thrown out.

### Mark-and-sweep (simplified)

```
Phase 1 MARK:  traverse from roots → mark reachable
Phase 2 SWEEP: delete unmarked objects

Roots → Object A → Object B   ✓ kept
        Object C (no path)    ✗ swept
```

### Flow diagram

```
Allocation pressure / idle time
        │
        ▼
Pause JS (stop-the-world phases)
        │
        ▼
Mark from all roots
        │
        ▼
Sweep unreachable objects
        │
        ▼
Resume JS
```

### Generational hypothesis

**Most objects die young.** V8 uses:

| Generation | What goes here | Collection |
|------------|----------------|------------|
| **Young (New Space)** | Fresh allocations | Minor GC (Scavenge) — fast |
| **Old (Old Space)** | Survivors of 2+ GC cycles | Major GC — slower |

```
Request handler creates 10,000 temp objects
        │
        ▼
Request ends → temps unreachable
        │
        ▼
Minor GC frees most in milliseconds
        │
        ▼
Accidental long-lived ref → promoted to Old Space
        │
        ▼
Major GC must scan entire old gen → 50–200ms pause
```

### Circular references — do they leak?

```javascript
const parent = { name: 'root' };
const child = { name: 'leaf' };
parent.child = child;
child.parent = parent; // cycle
```

**No leak** if neither `parent` nor `child` is reachable from roots.

**Leak** if `global.cache = parent` — entire cycle kept alive.

### The critical rule

> **GC only collects UNREACHABLE memory.**
> If anything still references it — even accidentally — it stays.

### Pros & cons — relying on GC alone

| Pros | Cons |
|------|------|
| No manual `free()` | Cannot collect reachable-but-unused memory |
| Handles cycles | GC pauses grow with live set |
| Battle-tested | Native/DOM memory invisible to JS heap timing |

### Your Turn — Exercise 5.1: Cycle vs Root

**Goal:** Understand when cycles leak and when they don't.

**Steps:** Create `javascript/memory-leak/labs/05-cycle-demo.mjs` with:

```javascript
function makeCycle(attachToGlobal) {
  const a = { tag: 'a' };
  const b = { tag: 'b' };
  a.ref = b;
  b.ref = a;
  if (attachToGlobal) globalThis.holder = a;
  return { a, b };
}

makeCycle(false); // cycle 1 — no global
makeCycle(true);  // cycle 2 — attached to global

if (globalThis.gc) globalThis.gc();
console.log('global holder exists:', !!globalThis.holder);
```

Run:

```bash
node --expose-gc javascript/memory-leak/labs/05-cycle-demo.mjs
```

**Expected result:** Cycle without global attachment is collected. Cycle attached to `globalThis.holder` survives.

---

## 6. What Is a Memory Leak? — Patterns You Will See Everywhere

### Definition

A **memory leak** in JavaScript is memory that remains **reachable** (GC cannot collect it) but is **no longer needed** by your program logic.

This is NOT forgetting to call `free()`. It is an **unintentional reference** you did not know still existed.

### Leak vs cache vs legitimate growth

| Type | Behavior | Example |
|------|----------|---------|
| **Leak** | Grows under fixed workload | Listener added every mount, never removed |
| **Cache** | Grows then plateaus (or should) | LRU with max 500 entries |
| **Legitimate** | Grows with users/data | More logged-in users → more session objects |

**How to tell leak from cache:** Run the **same action 20 times**. If memory floor rises each cycle → leak.

### Pattern 1: Missing cleanup (listeners, timers)

```javascript
// BAD
useEffect(() => {
  const id = setInterval(() => setCount(c => c + 1), 1000);
}, []);

// GOOD
useEffect(() => {
  const id = setInterval(() => setCount(c => c + 1), 1000);
  return () => clearInterval(id);
}, []);
```

### Pattern 2: Unbounded collections

```javascript
// BAD — grows forever
const cache = new Map();
app.get('/api', (req, res) => {
  cache.set(Date.now(), heavyCompute(req));
  res.json({ ok: true });
});

// GOOD — bounded
import LRU from 'lru-cache';
const cache = new LRU({ max: 500, ttl: 1000 * 60 * 10 });
```

### Pattern 3: Global assignment

```javascript
// BAD
function handle(req) {
  if (!global.log) global.log = [];
  global.log.push(req.body);
}
```

### Pattern 4: Closure capturing too much

```javascript
// BAD — entire 5 MB object retained for one field
const analytics = buildHugePayload();
btn.addEventListener('click', () => send(analytics));

// GOOD — capture only what you need
btn.addEventListener('click', () => send({ event: 'click', id: postId }));
```

### Healthy vs leaky lifecycle

```
HEALTHY                              LEAKY
Mount → use memory                   Mount → use memory
Unmount → cleanup → GC ✓             Unmount → listener remains → retained ✗
```

### Your Turn — Exercise 6.1: Global Array Leak

**Steps:**

```bash
node javascript/memory-leak/labs/02-global-array-leak.mjs
```

Note `log.length` and `heapUsed`. Then run the fixed version:

```bash
node javascript/memory-leak/labs/02-global-array-leak-FIXED.mjs
```

**Expected result:** Leaky version shows `log.length=50000` and higher heap. Fixed version caps at `1000`.

**Your challenge:** Before opening the FIXED file, try fixing `02-global-array-leak.mjs` yourself — add a max size of 500.

### Your Turn — Exercise 6.2: Unbounded Cache Server

**Steps:**

1. Start the leaky server:

```bash
node javascript/memory-leak/labs/03-leaky-cache-server.mjs
```

2. In another terminal, hammer it:

```bash
for i in $(seq 1 3000); do curl -s http://localhost:3456/ > /dev/null; done
```

3. Watch `cache.size` and `rss` climb in the server terminal.

**Expected result:** `cache.size` approaches 3000; RSS keeps rising.

**Your challenge:** Create `03-leaky-cache-server-FIXED.mjs` that caps cache at 100 entries (use `Map` + delete oldest, or install `lru-cache`).

---

## 7. The Detection Mindset — How to Investigate Any Leak

### The idea (detective, not guesser)

Senior engineers don't restart pods and hope. They follow a repeatable script:

```
1. Observe symptom
2. Measure memory
3. Confirm leak (fixed workload, monotonic growth)
4. Capture evidence (snapshots)
5. Find retainers
6. Trace to code
7. Fix
8. Verify
```

### Investigation flow

```
"Memory keeps rising"
        │
        ▼
Same action 10× — does heap FLOOR rise each time?
        │
   YES ─┴─ NO
   │       └── Maybe cache or traffic — still check bounds
   ▼
Take snapshot T0 → reproduce → snapshot T1 → compare delta
        │
        ▼
Sort by Size Delta — click largest suspects
        │
        ▼
Retainers panel — walk chain to root (Window, global, Map)
        │
        ▼
Fix the retaining edge → verify with T2 snapshot
```

### Step-by-step example — "Feed page gets slower"

| Step | What you do | What you find |
|------|-------------|---------------|
| Observe | User reports scroll jank after 30 min | — |
| Measure | Performance monitor: JS heap stair-step | Heap floor rises |
| Confirm | Navigate away and back 10× | +5 MB per cycle |
| Capture | Heap snapshot before/after | `(closure)` +40, `# Listener` +10 |
| Retainers | `Window` → `scroll` → `Feed.useEffect` | Missing cleanup |
| Fix | Add `removeEventListener` in return | — |
| Verify | Repeat 10× — delta ≈ 0 | Fixed |

### Leak vs not-a-leak checklist

```
□ Fixed workload (same clicks, same API calls)
□ Forced GC before snapshot (DevTools trash icon)
□ Compared TWO snapshots (not one)
□ Checked native memory (DOM nodes, external) not just heapUsed
□ Verified fix with THIRD snapshot
```

### Your Turn — Exercise 7.1: Write Your Investigation Template

**Goal:** Build muscle memory for real incidents.

**Steps:** Create a blank doc (or note) with these sections and fill in hypothetical data:

1. **Symptom:** (what user/metric reported)
2. **Repro steps:** (exact clicks / commands)
3. **Baseline metrics:** (heap, RSS, listeners before)
4. **After repro metrics:** (same metrics after 10×)
5. **Snapshot delta:** (top 3 constructors by size)
6. **Retainer chain:** (root → … → leaked object)
7. **Fix:** (one sentence)
8. **Verification:** (metrics after fix)

**Expected result:** A one-page template you can reuse on any leak.

---

## 8. Browser & React Leak Patterns

> React does not leak by itself. Leaks come from **references that outlive components** — listeners, timers, sockets, caches, detached DOM.

### 8.1 Event listeners

**Why it leaks:** `window.addEventListener` stores your callback. The callback is a closure that captures component state.

```javascript
// BAD — LEAK
function Feed() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    window.addEventListener('scroll', () => {
      setItems(prev => [...prev, ...fetchMore()]);
    });
  }, []);
  return <div>{items.length}</div>;
}

// GOOD
useEffect(() => {
  const onScroll = () => { /* ... */ };
  window.addEventListener('scroll', onScroll, { passive: true });
  return () => window.removeEventListener('scroll', onScroll);
}, []);
```

**Internal graph:**

```
window.__listeners['scroll'] = [ handlerClosure ]
                                      │
                                      ▼
                              component state (dead fiber)
```

### 8.2 Timers — setInterval / setTimeout

```javascript
// BAD
useEffect(() => {
  setInterval(() => setCount(c => c + 1), 1000);
}, []);

// GOOD
useEffect(() => {
  const id = setInterval(() => setCount(c => c + 1), 1000);
  return () => clearInterval(id);
}, []);
```

### 8.3 Fetch / async after unmount

```javascript
// GOOD — AbortController
useEffect(() => {
  const controller = new AbortController();
  fetch(`/api/posts/${id}`, { signal: controller.signal })
    .then(r => r.json())
    .then(setPost)
    .catch(err => {
      if (err.name !== 'AbortError') console.error(err);
    });
  return () => controller.abort();
}, [id]);
```

### 8.4 WebSockets

```javascript
useEffect(() => {
  const socket = io(SOCKET_URL);
  const onMessage = (msg) => setMessages(m => [...m, msg]);
  socket.on('message', onMessage);
  return () => {
    socket.off('message', onMessage);
    socket.disconnect();
  };
}, [postId]);
```

### 8.5 Detached DOM nodes

**What:** DOM removed from document but JS still holds a reference.

```javascript
const cache = [];
function brokenUnmount(el) {
  cache.push(el); // keeps entire subtree alive
  el.remove();
}
```

**Detect:** Heap snapshot → filter **`Detached`** → walk retainers.

### 8.6 React Query / Apollo / Redux

| Library | Leak pattern | Fix |
|---------|--------------|-----|
| React Query | Infinite inactive queries | `gcTime`, `queryClient.clear()` on logout |
| Apollo | Unbounded normalized cache | `cache.evict()`, `cache.gc()` |
| Redux | Entity map grows forever | Eviction middleware, pagination |

### 8.7 Observer APIs

```javascript
useEffect(() => {
  const el = ref.current;
  if (!el) return;
  const observer = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) loadMore();
  });
  observer.observe(el);
  return () => observer.disconnect();
}, []);
```

### Pros & cons — common React fixes

| Approach | Pros | Cons |
|----------|------|------|
| `useEffect` cleanup | Standard, explicit | Easy to forget |
| Custom hook (`useEventListener`) | Reusable, tested once | Abstraction overhead |
| Event delegation | One listener for many children | Harder to reason about |
| AbortController | Cancels network + avoids setState | Requires API support |

### Your Turn — Exercise 8.1: Build a Leaky React Component

**Goal:** Create a leak you will fix in Section 9 with DevTools.

**Steps:**

1. In your Vite app, create `src/components/LeakyScroll.jsx`:

```javascript
import { useEffect, useState } from 'react';

export function LeakyScroll() {
  const [y, setY] = useState(0);

  useEffect(() => {
    const bigData = new Array(100_000).fill('leak-payload');
    window.addEventListener('scroll', () => {
      setY(window.scrollY);
      void bigData.length;
    });
    // Intentionally missing cleanup
  }, []);

  return (
    <div style={{ height: '300vh', padding: 24 }}>
      <h2>Leaky Scroll Demo</h2>
      <p>Scroll Y: {y}</p>
      <p>Mount/unmount this component repeatedly to leak memory.</p>
    </div>
  );
}
```

2. Add a route or toggle to mount/unmount it 10 times.

3. Do NOT fix it yet — you will detect it in Exercise 9.1.

**Expected result:** Component works; each unmount leaves a scroll listener behind.

### Your Turn — Exercise 8.2: Fix the Timer Leak

**Goal:** Practice cleanup pattern.

**Given:**

```javascript
useEffect(() => {
  const id = setInterval(() => console.log('tick'), 500);
}, []);
```

**Your task:** Add cleanup. Mount/unmount 5 times — confirm only one interval runs at a time (or zero after unmount).

---

## 9. Chrome DevTools — Hands-On Detection

### 9.1 What healthy memory looks like

```
Healthy session (30 min)
Memory
  │    ╭──────────────── plateau
  │   ╱
  │  ╱  sawtooth = GC working
  └──────────────────────────► time
```

### 9.2 What a leak looks like

```
LEAK — stair-step (floor rises each navigation)
Memory
  │         ╱╱╱╱╱╱╱
  │        ╱
  │       ╱
  └──────────────────────────► time
```

### 9.3 Performance Monitor (start here)

1. `Cmd+Shift+P` → type **"Show Performance monitor"**
2. Watch:
   - **JS heap size**
   - **DOM Nodes**
   - **JS event listeners**

| Metric | Leak signal |
|--------|-------------|
| JS heap | Floor rises each cycle |
| DOM Nodes | Never drops after close modal |
| JS event listeners | Stair-step on route change |

### 9.4 Heap Snapshot workflow

```
Step 1: DevTools → Memory → Heap snapshot → Take snapshot (T0)
Step 2: Click trash icon (Collect garbage)
Step 3: Perform repro (mount/unmount LeakyScroll 10×)
Step 4: Collect garbage again
Step 5: Take snapshot (T1)
Step 6: Select T1 → Summary dropdown → "Comparison" vs T1
Step 7: Sort by "Size Delta"
Step 8: Click suspect → Retainers tab → walk to root
```

### Reading comparison columns

| Column | Meaning |
|--------|---------|
| **# New** | Objects created since T0 |
| **# Deleted** | Objects collected |
| **# Delta** | Net growth — hunt large positives |
| **Size Delta** | Bytes retained |

### 9.5 Detached DOM workflow

```
Filter: Detached
    │
    ▼
Pick largest Detached HTMLDivElement
    │
    ▼
Retainers → Closure → your variable name
    │
    ▼
Fix: delete from Map / null the ref
```

### Common DevTools mistakes

| Mistake | Why it fails |
|---------|--------------|
| Single snapshot only | Cannot see delta |
| No forced GC | Noise from almost-dead objects |
| Debugger paused | DevTools itself retains objects |
| Only watching JS heap | Detached DOM hides in native memory |

### Your Turn — Exercise 9.1: Detect the LeakyScroll Leak

**Goal:** Complete a full snapshot investigation.

**Prerequisites:** Exercise 8.1 (`LeakyScroll` component).

**Steps:**

1. Open your app in Chrome.
2. Open DevTools → **Performance monitor** — note listener count.
3. Mount/unmount `LeakyScroll` **10 times**.
4. Watch **JS event listeners** — they should climb and not return to baseline.
5. Open **Memory** tab → snapshot T0 → garbage collect.
6. Mount/unmount 10 more times → garbage collect → snapshot T1.
7. Comparison view → sort **Size Delta** → look for `(closure)`, `(string)`.
8. Click largest delta → **Retainers** → find path to `Window`.

**Expected result:**

- Listeners increase ~10 per 10 mount cycles.
- Snapshot shows positive delta for `(closure)` and `(string)`.
- Retainer chain: `Window` → `scroll` listener → your effect closure.

**Your challenge:** Fix `LeakyScroll` (add cleanup). Re-run steps 5–7. Delta should be near zero.

### Your Turn — Exercise 9.2: Allocation Timeline

**Goal:** See allocations live.

**Steps:**

1. Memory → **Allocation instrumentation on timeline** → Start.
2. Mount `LeakyScroll` once → unmount once.
3. Stop recording.
4. Look for blue bars that **stay blue** after unmount (not freed).

**Expected result:** Persistent blue blocks = leaked allocations. After fix, bars turn gray (freed).

---

## 10. Node.js Leak Patterns

### 10.1 Global variables

```javascript
// BAD — called every request
function handle(req, res) {
  if (!global.cache) global.cache = [];
  global.cache.push({ body: req.body, headers: req.headers });
  res.json({ ok: true });
}
```

### 10.2 Unbounded Map / Set

```javascript
const sessions = new Map();
// login: sessions.set(id, data)
// logout: MISSING sessions.delete(id)  ← LEAK
```

**Detect:** Log `sessions.size` every minute. Alert if it grows with flat DAU.

### 10.3 EventEmitter

```javascript
// BAD — new listener every subscribe()
function subscribe(userId) {
  emitter.on('update', () => processUser(userId));
}

// GOOD
function subscribe(userId, handler) {
  emitter.on('update', handler);
  return () => emitter.off('update', handler);
}
```

### 10.4 Timers in module scope

```javascript
const id = setInterval(flushMetrics, 60_000);
// Never cleared — keeps process hot, retains closures

process.on('SIGTERM', () => {
  clearInterval(id);
  server.close(() => process.exit(0));
});
```

### 10.5 Database / Redis connection leaks

```javascript
// BAD
const client = await pool.connect();
const result = await client.query(sql);
// missing release()

// GOOD
const client = await pool.connect();
try {
  return await client.query(sql);
} finally {
  client.release();
}
```

### 10.6 Streams and file handles

```javascript
// GOOD — pipeline auto-closes
import { pipeline } from 'stream/promises';
await pipeline(createReadStream(path), writable);
```

**Detect:** `lsof -p <pid> | wc -l` climbing; `EMFILE` errors.

### 10.7 Large Buffers

```javascript
// BAD for 500 MB file
const buf = await fs.readFile(hugePath);

// GOOD
createReadStream(hugePath).pipe(res);
```

Watch `process.memoryUsage().external` for Buffer leaks.

### Node leak summary

| Category | Detect | Fix |
|----------|--------|-----|
| Global | heapdump → `global` | Bound or remove |
| Cache | `Map.size` metric | LRU + TTL |
| EventEmitter | `listenerCount()` | Return unsubscribe |
| Streams | `external`, lsof | `pipeline`, `destroy` |
| Timers | active handles | `clearInterval` on SIGTERM |

### Your Turn — Exercise 10.1: EventEmitter Leak

**Steps:**

```bash
node javascript/memory-leak/labs/04-event-emitter-leak.mjs
```

Note the warning and `listenerCount`. Then:

```bash
node javascript/memory-leak/labs/04-event-emitter-FIXED.mjs
```

**Expected result:** Leaky = 15 listeners + warning. Fixed = 0 after cleanup.

**Your challenge:** Write `04-event-emitter-leak.mjs` fix yourself before peeking at FIXED.

### Your Turn — Exercise 10.2: Monitor RSS Under Load

**Steps:**

1. Start leaky cache server (Exercise 6.2).
2. Run load:

```bash
# if autocannon installed: npx autocannon -c 5 -d 20 http://localhost:3456/
# otherwise:
for i in $(seq 1 5000); do curl -s http://localhost:3456/ > /dev/null; done
```

3. Record `cache.size` and `rss` every 30 seconds.

**Expected result:** Linear growth of both — classic unbounded cache leak signature.

---

## 11. Node.js Detection Tools — Hands-On Profiling

### 11.1 process.memoryUsage()

```javascript
const m = process.memoryUsage();
/*
  rss          — total RAM for process (what K8s sees)
  heapTotal    — V8 allocated heap
  heapUsed     — live JS objects
  external     — C++ objects (Buffers, native bindings)
  arrayBuffers — ArrayBuffer memory
*/
```

| Field | Leak signal |
|-------|-------------|
| `rss` | Stair-step over hours |
| `heapUsed` | Grows without plateau |
| `external` | Buffer/stream leak |
| `heapTotal` ↑, `heapUsed` flat | Possible fragmentation |

### Example — memory logger

```javascript
setInterval(() => {
  const m = process.memoryUsage();
  console.log(JSON.stringify({
    ts: new Date().toISOString(),
    rss_mb: (m.rss / 1e6).toFixed(1),
    heap_used_mb: (m.heapUsed / 1e6).toFixed(1),
    external_mb: (m.external / 1e6).toFixed(1),
  }));
}, 30_000);
```

### 11.2 Node Inspector (Chrome DevTools for Node)

```bash
node --inspect javascript/memory-leak/labs/03-leaky-cache-server.mjs
```

1. Open `chrome://inspect`
2. Click **inspect** on your Node target
3. Use **Memory** tab — same snapshot workflow as browser

**Never expose `--inspect` publicly in production.**

### 11.3 heapdump

```javascript
import heapdump from 'heapdump';

heapdump.writeSnapshot(`/tmp/heap-${Date.now()}.heapsnapshot`, (err) => {
  if (err) console.error(err);
});
```

Load `.heapsnapshot` in Chrome DevTools → compare T0 vs T1.

### 11.4 Clinic.js (recommended for Node health)

```bash
npx clinic doctor -- node javascript/memory-leak/labs/03-leaky-cache-server.mjs
# Load test in another terminal, stop server, open HTML report
```

| Tool | Use |
|------|-----|
| `clinic doctor` | Event loop delay, GC, CPU overview |
| `clinic heapprofiler` | Allocation stacks |
| `clinic bubbleprof` | Async delay paths |

### Node investigation workflow

```
1. Alert: RSS > threshold for 1h (flat QPS)
2. Reproduce in staging with autocannon/k6
3. Log memoryUsage every 30s + cache.size + listenerCount
4. heapdump at T0 and T1
5. Compare in Chrome — sort Delta, walk retainers
6. Fix → canary deploy
7. Verify RSS plateau 24h
```

### Your Turn — Exercise 11.1: Inspect Node Heap in Chrome

**Steps:**

1. Start leaky server with inspect:

```bash
node --inspect javascript/memory-leak/labs/03-leaky-cache-server.mjs
```

2. `chrome://inspect` → open DevTools for Node.
3. Snapshot before load → run 1000 curls → snapshot after.
4. Compare — find `Map` or `(array)` growth.

**Expected result:** Positive delta on `(array)` entries tied to cache values.

### Your Turn — Exercise 11.2: Build a Memory Dashboard Script

**Goal:** Create `javascript/memory-leak/labs/06-memory-dashboard.mjs` that logs all `process.memoryUsage()` fields every 5 seconds with timestamps. Run it alongside the leaky server.

**Expected result:** CSV-style lines you could grep for trends.

---

## 12. Advanced Patterns

### 12.1 WeakMap / WeakRef — when they help (and when they don't)

**WeakMap:** Keys are objects held weakly — if nothing else references the key, entry disappears.

```javascript
const metadata = new WeakMap();
function attach(el, data) {
  metadata.set(el, data); // when el is GC'd, entry goes away
}
```

**WeakRef:** Not a leak fix — for caches that tolerate missing entries. Do not rely on them for cleanup of listeners/timers.

### 12.2 Module-level caches in SPAs

```javascript
// DANGER — survives hot reload, all routes
const commentCache = new Map();

export function useComments(postId) {
  useEffect(() => {
    commentCache.set(postId, fetchComments(postId));
    // LEAK if never commentCache.delete(postId) on unmount
  }, [postId]);
}
```

**Fix:** React Query with `gcTime` or LRU max 20 posts.

### 12.3 SSR / Next.js server leaks

Server components and API routes share one Node process. Global Maps in module scope leak across **all users**.

```javascript
// pages/api/bad.js — module-level
const cache = new Map(); // shared across ALL requests forever
```

Use Redis or bounded LRU per process with TTL.

### 12.4 Memory fragmentation

**Symptom:** `heapTotal` grows, `heapUsed` flat after forced GC.

**Cause:** Long-lived object churn creates holes in heap.

**Fix:** Reduce long-lived allocations; don't just raise `--max-old-space-size`.

### 12.5 Production-safe capture

| Do | Don't |
|----|-------|
| Reproduce in staging | Attach inspector to prod |
| Sample heapdump off-peak | Snapshot during peak traffic |
| Redact PII from dumps | Commit `.heapsnapshot` to git |
| Canary after fix | Restart pods forever |

### Your Turn — Exercise 12.1: WeakMap vs Map

**Goal:** See WeakMap entries disappear when key object is unreachable.

**Steps:** Write and run:

```javascript
let obj = { id: 1 };
const weak = new WeakMap();
const strong = new Map();

weak.set(obj, 'weak-data');
strong.set(obj, 'strong-data');

obj = null;
if (globalThis.gc) globalThis.gc();

console.log('Strong map size:', strong.size); // still 1
// Weak map: cannot enumerate — but entry is gone when key is GC'd
```

Run with `node --expose-gc`.

**Expected result:** Strong Map retains entry (key object still referenced as Map key). WeakMap entry collectible once `obj` is null and GC runs.

---

## 13. When to Use What — Decision Guide

### Investigation tool picker

```
Where is the leak?
        │
   Browser ──► Performance monitor first
        │       Then heap snapshot comparison
        │       Detached DOM? → filter Detached
        │
   Node.js ──► process.memoryUsage() trend
        │       RSS up, heap flat? → check external/Buffers
        │       heapdump diff in Chrome
        │       clinic doctor for event loop + GC
        │
   Production ──► Staging repro (never guess in prod)
                 Canary deploy after fix
                 Alert on RSS slope, not absolute value
```

### Fix pattern lookup

| You found… | Fix |
|------------|-----|
| `# Listener` delta | `removeEventListener` in cleanup |
| `Detached HTMLDivElement` | Remove JS ref / Map entry |
| `(closure)` on Window | Find listener/timer/socket |
| `Map` growth in Node | LRU + TTL + delete on logout |
| `external` growth | Streams, Buffers — use pipeline |
| Fetch after unmount | AbortController |
| React Query count | Lower `gcTime`, clear on logout |

### By experience level

| Level | Start with | Escalate to |
|-------|------------|-------------|
| First leak | Performance monitor + cleanup audit | Snapshot comparison |
| Recurring leak | memlab / CI heap budget | Allocation timeline |
| Production incident | RSS metrics + staging repro | heapdump + clinic |

---

## 14. Common Pitfalls & How to Avoid Them

### Pitfall 1: "GC will fix it"

**BAD thinking:** Memory high → call `gc()` → problem solved.

**Why it fails:** GC only frees **unreachable** memory. Leaks are **reachable**.

**GOOD:** Find and remove the retaining reference.

### Pitfall 2: Only watching heapUsed

**BAD:**

```javascript
console.log(process.memoryUsage().heapUsed); // looks stable
// Meanwhile RSS climbs from detached DOM or Buffers
```

**GOOD:** Watch `rss`, `external`, DOM node count, and listener count together.

### Pitfall 3: Restart as fix

**BAD:** OOM → restart pod → close ticket.

**GOOD:** Restart buys time; snapshot diff finds root cause.

### Pitfall 4: Raising MaxListeners instead of fixing

**BAD:**

```javascript
emitter.setMaxListeners(1000); // hides leak
```

**GOOD:** Return unsubscribe; call `off()` on lifecycle end.

### Pitfall 5: Wrong removeEventListener reference

**BAD:**

```javascript
window.addEventListener('scroll', () => setY(window.scrollY));
return () => window.removeEventListener('scroll', () => setY(window.scrollY));
// Different function reference — listener NOT removed
```

**GOOD:**

```javascript
const onScroll = () => setY(window.scrollY);
window.addEventListener('scroll', onScroll);
return () => window.removeEventListener('scroll', onScroll);
```

### Pitfall 6: Snapshot without forced GC

**BAD:** Single snapshot after action — includes almost-dead objects.

**GOOD:** Trash icon (Collect garbage) before **and** after repro.

### Pitfall 7: setState after unmount without abort

**BAD:**

```javascript
fetch(url).then(setData); // runs after unmount
```

**GOOD:**

```javascript
const controller = new AbortController();
fetch(url, { signal: controller.signal }).then(setData);
return () => controller.abort();
```

### Your Turn — Exercise 14.1: Spot the Bug

**Goal:** Identify which snippets leak without running them.

**Which leak?**

```javascript
// A
useEffect(() => {
  const fn = () => setOpen(true);
  document.addEventListener('keydown', fn);
}, []);

// B
const cache = new Map();
useEffect(() => {
  cache.set(id, data);
  return () => cache.delete(id);
}, [id]);

// C
useEffect(() => {
  const t = setTimeout(() => setDone(true), 5000);
  return () => clearTimeout(t);
}, []);
```

**Expected answer:** A leaks (no cleanup). B and C are correct. See [Solution 14.1](#solution-141).

---

## 15. Solutions Appendix (All Your Turn Answers)

### Solution 3.1

```
Stack                         Heap
─────────────────────────────────────────
users ──► (empty array)       { id: 1 } ◄── first  (NOT collectible)
                              { id: 2 }            (collectible)
```

### Solution 6.1 (your fix before FIXED file)

```javascript
const MAX = 500;
function handleRequest(body) {
  requestLog.push({ body, at: Date.now() });
  if (requestLog.length > MAX) requestLog.shift();
}
```

### Solution 6.2 (cache cap sketch)

```javascript
const MAX = 100;
const cache = new Map();

function set(key, value) {
  if (cache.size >= MAX) {
    const oldest = cache.keys().next().value;
    cache.delete(oldest);
  }
  cache.set(key, value);
}
```

### Solution 8.1 (LeakyScroll fix)

```javascript
useEffect(() => {
  const bigData = new Array(100_000).fill('leak-payload');
  const onScroll = () => {
    setY(window.scrollY);
    void bigData.length;
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  return () => window.removeEventListener('scroll', onScroll);
}, []);
```

### Solution 11.2 (memory dashboard)

```javascript
setInterval(() => {
  const m = process.memoryUsage();
  console.log(
    [new Date().toISOString(),
     `rss=${(m.rss/1e6).toFixed(1)}`,
     `heap=${(m.heapUsed/1e6).toFixed(1)}`,
     `external=${(m.external/1e6).toFixed(1)}`,
    ].join(' ')
  );
}, 5000);
```

### Solution 14.1

- **A — LEAKS:** No cleanup on `keydown` listener.
- **B — OK:** Deletes cache entry on unmount/id change.
- **C — OK:** Clears timeout on unmount.

---

## Quick Reference — Lab Files

| File | Command | What you learn |
|------|---------|----------------|
| `01-reachability.mjs` | `node javascript/memory-leak/labs/01-reachability.mjs` | References prevent GC |
| `02-global-array-leak.mjs` | `node javascript/memory-leak/labs/02-global-array-leak.mjs` | Unbounded global array |
| `02-global-array-leak-FIXED.mjs` | `node javascript/memory-leak/labs/02-global-array-leak-FIXED.mjs` | Bounded ring buffer |
| `03-leaky-cache-server.mjs` | `node javascript/memory-leak/labs/03-leaky-cache-server.mjs` | Map cache under load |
| `04-event-emitter-leak.mjs` | `node javascript/memory-leak/labs/04-event-emitter-leak.mjs` | Listener accumulation |
| `04-event-emitter-FIXED.mjs` | `node javascript/memory-leak/labs/04-event-emitter-FIXED.mjs` | Unsubscribe pattern |
| `05-cycle-demo.mjs` | `node --expose-gc javascript/memory-leak/labs/05-cycle-demo.mjs` | Cycles vs global roots |
| `06-memory-dashboard.mjs` | `node javascript/memory-leak/labs/06-memory-dashboard.mjs` | Live memory metrics |

---

## Final Challenge — End-to-End

When you have completed all sections, do this **without looking at solutions**:

1. Create a React component that leaks a `setInterval` **and** a `fetch` on mount.
2. Detect both using Performance monitor + heap snapshot.
3. Fix both with cleanup + AbortController.
4. Create a Node script with an unbounded `Map` cache.
5. Detect with `process.memoryUsage()` under curl load.
6. Fix with max size 50.
7. Verify memory plateaus in both browser and Node.

If you can complete the Final Challenge, you have practical leak detection skills — not just theory.

---

*Companion performance topics: [`11-Frontend-Performance-Engineering-Complete-Guide.md`](../11-Frontend-Performance-Engineering-Complete-Guide.md) Sections 7–9.*
