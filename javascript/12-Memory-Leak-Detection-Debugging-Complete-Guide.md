# Memory Leak Detection, Debugging & Fixing — Complete Handbook (Basics to Advanced)

> The definitive handbook for Senior React.js and Node.js engineers (5–10+ years): memory fundamentals, V8 garbage collection, leak detection mindset, Chrome DevTools, Node.js profiling, production playbooks, case studies, interview masterclass, and hands-on labs — from first principles to production-scale investigation.

**Companion docs:** [`01-Event-Loop.md`](./01-Event-Loop.md), [`04-React-Internals.md`](./04-React-Internals.md), [`05-NodeJS-Internals.md`](./05-NodeJS-Internals.md), [`11-Frontend-Performance-Engineering-Complete-Guide.md`](./11-Frontend-Performance-Engineering-Complete-Guide.md) (Sections 7–9), [`10-Instagram-Comment-Section-Complete-Guide.md`](./10-Instagram-Comment-Section-Complete-Guide.md).

**How to use this handbook:** Week 1 → Parts 1–5 (fundamentals + mindset). Week 2 → Parts 6–8 (React). Week 3 → Parts 9–11 (Node.js). Week 4 → Parts 12–15 (production + interviews + labs). For every topic, complete the **Hands-on exercise** before advancing.

---

## Table of Contents

### Foundations
1. [Memory Fundamentals](#part-1-memory-fundamentals)
2. [JavaScript Memory Model](#part-2-javascript-memory-model)
3. [Garbage Collection](#part-3-garbage-collection)
4. [What Is a Memory Leak?](#part-4-what-is-a-memory-leak)
5. [Memory Leak Detection Mindset](#part-5-memory-leak-detection-mindset)

### React
6. [React Memory Leaks — Deep Dive](#part-6-react-memory-leaks--deep-dive)
7. [React Memory Leak Detection (Chrome DevTools)](#part-7-react-memory-leak-detection-chrome-devtools)
8. [React Memory Leak Case Studies](#part-8-react-memory-leak-case-studies)

### Node.js
9. [Node.js Memory Leaks — Deep Dive](#part-9-nodejs-memory-leaks--deep-dive)
10. [Node.js Memory Leak Detection](#part-10-nodejs-memory-leak-detection)
11. [Node.js Memory Leak Case Studies](#part-11-nodejs-memory-leak-case-studies)

### Production & Mastery
12. [Production Debugging Playbook](#part-12-production-debugging-playbook)
13. [Interview Masterclass](#part-13-interview-masterclass)
14. [Practical Labs](#part-14-practical-labs)
15. [Universal Memory Leak Investigation Framework](#part-15-universal-memory-leak-investigation-framework)

---

## Topic Template (Used Throughout)

Every major topic includes:

| # | Element |
|---|---------|
| 1 | What it is |
| 2 | Why it happens |
| 3 | Internal working |
| 4 | How it affects performance |
| 5 | How to detect it |
| 6 | How to debug it |
| 7 | How to fix it |
| 8 | How to verify the fix |
| 9 | Prevention strategies |
| 10 | Real-world examples |
| 11 | Interview questions |
| 12 | Senior-level discussion points |
| 13 | Production case studies |
| 14 | Common mistakes |
| 15 | Hands-on exercises |

---

# PART 1: MEMORY FUNDAMENTALS

## 1. What Is Memory? — The Real Explanation

### What it is

**Memory** is addressable storage that holds the **data and instructions** your program needs while it runs. When you create a variable, render a React component, or buffer an HTTP response in Node.js, that data lives in memory until the program releases it or the process exits.

### Why applications consume memory

Every layer of the stack allocates memory:

```
User action (click "Load Feed")
        │
        ▼
┌───────────────────────────────────────────────────────────┐
│ Browser / Node.js process                                  │
│  ├── JS heap (objects, closures, arrays)                  │
│  ├── Stack (call frames, primitives in flight)            │
│  ├── Native heap (DOM nodes, Buffers, TLS, images)        │
│  └── Mapped memory (code, WASM, shared libs)              │
└───────────────────────────────────────────────────────────┘
```

| Allocation source | Example | Why it exists |
|-------------------|---------|---------------|
| **Application data** | Comment list in React state | Business logic needs working set |
| **Runtime overhead** | V8 hidden classes, ICs | Engine optimization structures |
| **I/O buffers** | `Buffer.from(response)` in Node | Network/disk throughput |
| **Caches** | React Query, Redis client-side | Latency reduction |
| **Framework** | Fiber tree, event listener registry | React reconciliation |

**Without memory:** programs cannot hold state between instructions. Every variable would need to re-fetch from disk/network on each line of code.

**With memory:** fast reads/writes at nanosecond–microsecond scale — but **finite**.

### Why memory is limited

```
┌─────────────────────────────────────────────────────────────┐
│  Physical RAM (e.g. 16 GB on laptop, 8 GB container limit) │
├─────────────────────────────────────────────────────────────┤
│  OS + kernel + other apps          │  Your Node/React app  │
│  ████████████████░░░░░░░░░░░░░░░░  │  ████████░░░░░░░░░░   │
└─────────────────────────────────────────────────────────────┘
                              ▲
                    Hard ceiling — OOM killer / tab crash
```

| Constraint | Effect on your app |
|------------|-------------------|
| **Physical RAM** | Machine or pod has fixed bytes |
| **Container limits** | Kubernetes `memory.limit` → SIGKILL at threshold |
| **Browser tab budget** | Chrome may discard background tabs |
| **32-bit address space** | Rare today, but caps ~2–4 GB per process |
| **GC pressure** | More live objects → longer pause times |

**Senior insight:** "Unlimited memory" does not exist in production. Leaks are not academic — they become **OOM kills**, **GC thrashing**, and **P99 latency spikes**.

---

## 2. RAM — Random Access Memory

### What it is

**RAM** is volatile, byte-addressable storage the CPU reads/writes directly. It is **orders of magnitude faster** than SSD but **orders of magnitude smaller** than disk.

### Internal working (simplified)

```
CPU ◄──── L1/L2/L3 cache (KB–MB, nanoseconds)
  │
  ▼
RAM (GB, ~100 ns access)
  │
  ▼
SSD (TB, ~100 µs)
```

When V8 allocates `{ comments: [...1000 items] }`, those object properties ultimately reside in RAM pages mapped to your process.

### How it affects performance

| RAM state | Symptom |
|-----------|---------|
| **Healthy working set** | Stable RSS, predictable GC |
| **Growing working set (leak)** | RSS climbs, Major GC frequency rises |
| **Near limit** | Swap thrashing (if allowed), OOM, tab freeze |
| **Fragmentation** | `heapTotal` grows while `heapUsed` ratio worsens |

### Interview questions

**Q: Is high RAM usage always a leak?**

| Level | Answer |
|-------|--------|
| Basic | No — caches and legitimate growth also increase RAM. |
| Strong | Distinguish **steady-state** vs **monotonic growth** under fixed workload. |
| Senior | Model **working set = f(concurrent users, cache policy, request size)**. A leak is retained memory after references should have been dropped; a cache is intentional retention with eviction policy. |

**Follow-ups:** How do you prove it's a leak in production? What metrics differentiate cache growth from leak?

---

## 3. Process Memory

### What it is

A **process** is an isolated running instance of a program (browser tab, Node.js worker, Electron main process). The OS gives each process a **virtual address space**; the process sees contiguous memory, not necessarily contiguous physical RAM.

### Process memory layout

```
High addresses
┌─────────────────────────┐
│  Stack                  │  ← grows down (function calls, local primitives)
│         │               │
│         ▼               │
│         ▲               │
│         │               │
│  Heap                   │  ← grows up (objects, closures, Buffers)
├─────────────────────────┤
│  BSS / Data / Text      │  ← globals, static data, machine code
└─────────────────────────┘
Low addresses
```

**Node.js `process.memoryUsage()`** reports subsets of this space (see Part 10).

**Browser tab** adds: DOM tree (often counted as native memory), compositor layers, GPU textures — not all visible in JS heap alone.

### Why it matters for leaks

Leaks can live in:

1. **JS heap** — closures, arrays, Maps
2. **Native heap** — detached DOM nodes, `ArrayBuffer`, image decode buffers
3. **External** — C++ bindings (OpenSSL, SQLite, native addons)

A senior engineer checks **all three**, not only `heapUsed`.

---

## 4. Virtual Memory

### What it is

**Virtual memory** is the OS abstraction where each process gets its own address space. Physical RAM pages are mapped on demand; unused pages can be swapped or unmapped.

```
Process A virtual          Process B virtual
┌──────────────┐           ┌──────────────┐
│ 0x0000...    │           │ 0x0000...    │
│   heap       │           │   heap       │
└──────────────┘           └──────────────┘
        │                          │
        └──────────┬───────────────┘
                   ▼
            Physical RAM pages
            (MMU translation)
```

### Why it happens

- **Isolation:** Process A cannot read Process B's memory
- **Overcommit:** Allocate virtual address space cheaply; commit physical pages when touched
- **Shared libraries:** Same `.so` mapped read-only into many processes

### Performance impact

| Phenomenon | Effect |
|------------|--------|
| **Page faults** | First touch or swap-in → latency spike |
| **Memory pressure** | OS reclaims cache; mobile browsers kill tabs |
| **Container cgroup** | Virtual allocation OK until RSS hits limit → kill |

### Hands-on exercise

**Lab 0 — Observe process memory**

```bash
# Node.js — watch RSS over 60 seconds while hitting an endpoint
node -e "
setInterval(() => {
  const m = process.memoryUsage();
  console.log(JSON.stringify({
    rss: Math.round(m.rss/1e6)+'MB',
    heapUsed: Math.round(m.heapUsed/1e6)+'MB',
    external: Math.round(m.external/1e6)+'MB',
  }));
}, 5000);
"
```

Open Chrome Task Manager (`Shift+Esc`) while navigating a SPA — watch **Memory footprint** vs **JavaScript memory** per tab.

---

# PART 2: JAVASCRIPT MEMORY MODEL

## 5. Stack Memory

### What it is

The **stack** stores **execution context**: call frames, return addresses, and **primitive values** (numbers, booleans, null, undefined, symbols, bigints) that fit in fixed slots for the current function scope.

### Why it exists

Stack allocation is **O(1)** push/pop — no GC needed for frame teardown when a function returns.

### Example — variable allocation

```javascript
function calculateTotal(price, qty) {
  // ── Stack frame ──────────────────────────────────────────
  const tax = 0.18;        // primitive → stack slot
  const total = price * qty * (1 + tax);  // computation on stack
  return total;            // frame popped when function returns
}
```

### Internal working

```
call calculateTotal(100, 2)
┌─────────────────────────┐
│ Frame: calculateTotal   │
│  price = 100            │
│  qty = 2                │
│  tax = 0.18             │
│  total = 236            │
└─────────────────────────┘
        │ return
        ▼
   frame destroyed — stack slots freed automatically
```

### Interview question: Stack vs heap?

| Aspect | Stack | Heap |
|--------|-------|------|
| Contents | Primitives, pointers, frames | Objects, arrays, closures |
| Lifetime | Function scope | Until unreachable |
| Allocation speed | Very fast | Slower (GC managed) |
| Size | Limited (~MB) | Large (GB in 64-bit) |
| GC | No | Yes |

---

## 6. Heap Memory

### What it is

The **heap** is where **reference types** live: objects, arrays, functions (as objects), closures capturing outer variables.

### Why objects are stored in heap

Objects have **unknown size at compile time** and **unknown lifetime**. The stack cannot grow unbounded per object; the heap + GC handles dynamic allocation.

```javascript
// ── Primitives: copied by value ─────────────────────────────
let a = 5;
let b = a;   // b gets its own stack slot with value 5
b = 10;      // a still 5

// ── Objects: reference on stack, payload on heap ──────────
let objA = { count: 1 };  // stack: ref ──► heap: { count: 1 }
let objB = objA;          // both refs point to SAME heap object
objB.count = 99;          // objA.count is also 99
```

### Memory diagram — object references

```
Stack                          Heap
┌─────────────┐               ┌──────────────────┐
│ objA ───────┼──────────────►│ { count: 99 }    │
│ objB ───────┼──────────────►│                  │
└─────────────┘               └──────────────────┘
        two references, one object
```

### Circular references

```javascript
const parent = { name: 'root' };
const child = { name: 'leaf' };
parent.child = child;
child.parent = parent;  // cycle: parent ◄──► child
```

```
Heap graph:
  parent ──► child
    ▲          │
    └──────────┘

Modern V8: cycles are OK if the whole component is unreachable from roots.
Leak: if ONE node in cycle is reachable from a global/listener, ALL stay alive.
```

### Function memory

Functions are heap objects. Closures retain **outer lexical environments**:

```javascript
function createHandler(userId) {
  const largeProfile = fetchLargeProfile(userId); // 2 MB object
  return () => console.log(largeProfile.name);      // closure retains 2 MB
}
// Leak if handler stored on window.addEventListener without cleanup
```

### Hands-on exercise

Draw the stack/heap diagram for:

```javascript
const users = [{ id: 1 }, { id: 2 }];
const first = users[0];
users.length = 0;
// Q: Is { id: 1 } collectible? Answer: NO — `first` still references it.
```

---

# PART 3: GARBAGE COLLECTION

## 7. Reachability & Root References

### What it is

JavaScript uses **automatic memory management**. V8 determines liveness via **reachability**: an object is kept if there is a path from a **GC root** to that object through references.

### GC roots (V8 / browser)

| Root type | Example |
|-----------|---------|
| Global object | `window`, `globalThis` |
| Currently executing stack | Local variables in active calls |
| Closures in active calls | Captured environments |
| DOM references | JS wrapper → native node |
| Handles | `FinalizationRegistry`, some native bindings |
| Debugger / DevTools | Retaining paths while inspecting |

### Mark and Sweep — internal working

```
Phase 1: MARK — traverse from roots, color reachable objects
Phase 2: SWEEP — free unmarked objects

Roots: [global, stack, DOM, ...]
         │
         ▼ mark
    ┌─────────┐     ┌─────────┐
    │ Object A│────►│ Object B│  reachable ✓
    └─────────┘     └─────────┘

    ┌─────────┐
    │ Object C│  unreachable ✗ → swept
    └─────────┘
```

### Flow diagram

```
GC triggered (allocation limit / idle / explicit)
        │
        ▼
 Pause mutator threads (stop-the-world for mark phase)
        │
        ▼
 Mark from all roots → transitive closure
        │
        ▼
 Sweep / compact (generation-specific)
        │
        ▼
 Resume JavaScript execution
```

### What is stop-the-world GC?

**Stop-the-world (STW):** JavaScript execution pauses so the GC can mark memory consistently without concurrent mutations confusing the graph.

| Level | Answer |
|-------|--------|
| Basic | GC pauses your JS while it cleans up. |
| Strong | Minor GC is short; Major GC can pause tens–hundreds of ms on large heaps. |
| Senior | V8 uses **incremental** and **concurrent** marking for Major GC, but some STW phases remain. In Node, long pauses show as **event loop lag**; in React, as **jank / INP regression**. |

---

## 8. Generational GC (V8 Internals)

### The idea

**Generational hypothesis:** most objects die young. V8 splits the heap into **generations** to collect short-lived garbage cheaply.

```
┌─────────────────────────────────────────────────────────────┐
│                        V8 Heap                               │
├──────────────────────────┬──────────────────────────────────┤
│  New Space (Young Gen)   │  Old Space (Old Gen)             │
│  ┌────────┬────────┐     │  Long-lived objects              │
│  │ From   │  To    │     │  Promoted after surviving GC     │
│  └────────┴────────┘     │                                  │
└──────────────────────────┴──────────────────────────────────┘
```

### Young Generation

- **Minor GC (Scavenge):** copy live objects from From-space to To-space; survivors **promoted** to Old Space after ~2 collections
- **Fast, frequent** — milliseconds or less on small nurseries

### Old Generation

- **Major GC (Mark-Compact / Mark-Sweep):** full heap or old-space collection
- **Slower, less frequent** — cost scales with **live** data, not just garbage

### Timeline example

```
t=0    allocate 10,000 temp objects in request handler → New Space
t=1    request ends, temps unreachable
t=2    Minor GC — most swept, few promoted
t=3    long-lived cache Map grows for hours
t=4    Major GC — must mark entire old generation; 80ms pause
```

### How leaks affect GC

| Leak pattern | GC behavior |
|--------------|-------------|
| Short-lived leak | Minor GC pressure, promotion of accidental long-lived refs |
| Old-gen leak | Major GC runs longer, more frequent; **GC thrashing** |
| Native leak (DOM) | JS heap stable but RSS climbs |

### Interview questions

**Q: How does JavaScript garbage collection work?**

**Senior answer framework:**
1. Allocation in new space
2. Reachability from roots
3. Minor GC for young gen (Scavenge)
4. Promotion to old gen
5. Major GC with incremental/concurrent marking
6. WeakRef/FinalizationRegistry for advanced patterns (not leak fixes)

**Q: Can circular references leak?**

**Senior:** Not if the cycle is unreachable from roots. They **do** leak if any member is retained (e.g., listener closure holding component state).

### Pros & cons — relying on GC alone

| Pros | Cons |
|------|------|
| No manual free() | Cannot collect **reachable** unused memory |
| Handles cycles | Pauses under pressure |
| Tuned over decades | Native/DOM retention invisible to JS GC timing |

---

# PART 4: WHAT IS A MEMORY LEAK?

## 9. Definition & Mental Model

### What it is

A **memory leak** in managed languages like JavaScript is memory that remains **reachable** (GC cannot collect it) but is **no longer needed** by the program's logic.

This is **not** "forgot to call free()". It is **unintentional retention** — a reference path you did not know still existed.

### Why leaks occur

```
Developer intent: "Component unmounted, data no longer needed"
Runtime reality:  global listener ──► closure ──► component state ──► 10 MB array
                                      ▲
                              still reachable from window
```

| Root cause category | Mechanism |
|---------------------|-----------|
| **Missing cleanup** | Listener/timer/subscription outlives owner |
| **Unbounded collections** | Cache Map grows without eviction |
| **Closures** | Callback captures large scope |
| **Detached DOM** | JS ref to removed DOM subtree |
| **Global assignment** | `window.debug = hugeObject` |
| **Third-party libs** | Internal registries never cleared |

### Bad vs good example

**BAD — reachable but unused:**

```javascript
useEffect(() => {
  const handler = () => setData(fetchHugePayload());
  window.addEventListener('scroll', handler);
  // Missing cleanup — handler retains closure + setState after unmount
}, []);
```

**GOOD — becomes unreachable:**

```javascript
useEffect(() => {
  const handler = () => setData(fetchHugePayload());
  window.addEventListener('scroll', handler);
  return () => window.removeEventListener('scroll', handler);
}, []);
```

### Diagram — leak vs healthy

```
HEALTHY LIFECYCLE                    LEAK LIFECYCLE
┌──────────┐                         ┌──────────┐
│ Mount    │                         │ Mount    │
│ allocate │                         │ allocate │
└────┬─────┘                         └────┬─────┘
     │                                    │
     ▼                                    ▼
┌──────────┐                         ┌──────────┐
│ Unmount  │                         │ Unmount  │
│ refs = 0 │                         │ listener │
└────┬─────┘                         │ still on │
     │                               └────┬─────┘
     ▼                                    │
   GC ✓                                   ▼
                                     retained ✗
```

### How it affects performance

| Stage | User-visible symptom |
|-------|---------------------|
| Early | Slightly higher memory in DevTools |
| Medium | Scroll jank, longer GC pauses |
| Late | Tab crash, mobile reload, Node OOM restart |
| Production | Pod eviction, cascading restarts, SLA breach |

### Common mistakes

| Mistake | Why it fails |
|---------|--------------|
| "GC will fix it" | GC only collects **unreachable** memory |
| Only watching `heapUsed` | Native/DOM leaks hide in RSS/external |
| Fixing symptom (restart pod) | Root cause returns |
| Aggressive `gc()` in prod | Masks leak, causes latency |

---

# PART 5: MEMORY LEAK DETECTION MINDSET

## 10. How Senior Engineers Think

### The repeatable investigation framework

```
┌─────────────────────────────────────────────────────────────────┐
│           UNIVERSAL LEAK INVESTIGATION FRAMEWORK                 │
├─────────────────────────────────────────────────────────────────┤
│  1. Observe symptoms      │ Tab slow? RSS stair-step? OOM?      │
│  2. Measure memory        │ Metrics baseline, not gut feel      │
│  3. Confirm leak          │ Fixed workload → monotonic growth   │
│  4. Capture evidence      │ Heap snapshot / timeline / heapdump │
│  5. Identify retainers    │ Retaining path in DevTools          │
│  6. Find root cause       │ Code path that created retention    │
│  7. Fix                   │ Remove ref / cleanup / bound cache  │
│  8. Verify                │ Re-run scenario, compare snapshots  │
│  9. Monitor               │ Alerts, regression tests, budgets   │
└─────────────────────────────────────────────────────────────────┘
```

### Step-by-step — "Memory keeps rising"

**Step 1 — Observe symptoms**

| Symptom | Likely domain |
|---------|---------------|
| Browser tab memory grows navigating SPA routes | React cleanup, detached DOM |
| Node RSS grows over 24h with flat traffic | Global cache, EventEmitter |
| GC time ↑ in APM | Old-gen leak |
| `EMFILE` errors | File handle leak (not heap) |

**Step 2 — Measure**

- Frontend: Performance → Memory checkbox, `performance.memory` (Chrome)
- Node: `process.memoryUsage()`, Prometheus `process_resident_memory_bytes`

**Step 3 — Confirm leak (critical)**

Run **fixed scenario** 10×:

```
Navigate: Home → Feed → Post → Back → Feed → Back
If heap floor rises each cycle → leak confirmed
If heap rises then plateaus → likely cache (still may need bounds)
```

**Step 4 — Capture evidence**

- Two heap snapshots: before scenario, after 10 iterations
- Diff: "Comparison" view, filter `Detached`, `# Listener`

**Step 5 — Identify retainers**

Click leaked constructor (e.g., `(string)`, `CommentItem`, `Closure`) → **Retainers** panel shows chain to root.

**Step 6 — Root cause**

Map retainer to source: file:line via stack or search codebase for pattern.

**Step 7–9 — Fix, verify, monitor** (detailed in Parts 12 and 15)

### Senior-level discussion points

- **Leak vs cache vs pool:** intentional retention needs **TTL, max size, LRU**
- **Leak vs fragmentation:** `heapTotal` grows but objects dead — different fix
- **Observability cost:** heap snapshots pause production — sample in staging/canary
- **Organizational:** who owns fix — feature team vs platform SRE

### Hands-on exercise

Write a one-page **Leak Investigation Doc** template with sections: Hypothesis, Repro Steps, Snapshots, Retainer Chain, Fix PR, Verification Metrics.

---

# PART 6: REACT MEMORY LEAKS — DEEP DIVE

> React does not leak memory by itself. Leaks are **retained references** created by effects, subscriptions, closures, caches, and DOM bridges that outlive components.

---

## 11. Event Listeners

### What it is

An **event listener** registers a callback on a target (`window`, `document`, DOM node, EventEmitter). The target holds a strong reference to the callback (and its closure).

### Why it happens

Component mounts → adds listener → unmounts without `removeEventListener` → target still holds closure → closure holds component state/props.

### Internal working

```
window.__listeners['scroll'] = [ handlerClosure ]
                                      │
                                      ▼
                              ┌─────────────────┐
                              │ Fiber (unmounted│
                              │  but retained)  │
                              │  + state array  │
                              └─────────────────┘
```

### BAD — window listener leak

```javascript
function Feed() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const onScroll = () => {
      // Closure captures setItems + items from first render
      setItems(prev => [...prev, ...fetchMore()]);
    };
    window.addEventListener('scroll', onScroll);
    // LEAK: no cleanup
  }, []);

  return <div>{items.length} items</div>;
}
```

### GOOD — cleanup pattern

```javascript
useEffect(() => {
  const onScroll = () => { /* ... */ };
  window.addEventListener('scroll', onScroll, { passive: true });
  return () => window.removeEventListener('scroll', onScroll);
}, []);
```

### Detection

- Chrome Memory → Heap snapshot → Filter `Listener`
- Performance monitor: `# JS event listeners` climbing on route change
- React Strict Mode double-mount exposes missing cleanup in dev

### Verification

1. Snapshot before mount
2. Mount/unmount component 20×
3. Snapshot after — listener count returns to baseline

### Prevention

| Strategy | When |
|----------|------|
| `useEffect` cleanup | Every external subscription |
| Event delegation | Many child listeners → one on parent |
| `AbortSignal` for fetch + listener | Combined lifecycle |
| Custom hook `useEventListener` | Standardize cleanup |

### Interview question

**Q: Why does Strict Mode mount twice?**

**Senior:** To surface side effects that assume single mount — missing cleanups, global mutations, listener duplication.

### Hands-on exercise

See [Lab 1](#lab-1--leak-an-event-listener-react).

---

## 12. Timers — setTimeout / setInterval

### Why it happens

Timer IDs keep callbacks scheduled. Callback closures retain component state. `setState` on unmounted component causes warnings and retention.

### BAD

```javascript
useEffect(() => {
  const id = setInterval(() => {
    setCount(c => c + 1);
  }, 1000);
  // missing clearInterval(id)
}, []);
```

### GOOD

```javascript
useEffect(() => {
  const id = setInterval(() => setCount(c => c + 1), 1000);
  return () => clearInterval(id);
}, []);
```

### Detection

- Snapshot filter `(closure)` count grows
- React DevTools: state updates after unmount (console warning in dev)

### Senior discussion

Prefer **`requestAnimationFrame`** for visual updates; **`setTimeout` chaining** over `setInterval` when drift matters; always guard async completion:

```javascript
useEffect(() => {
  let cancelled = false;
  fetchData().then(data => {
    if (!cancelled) setData(data);
  });
  return () => { cancelled = true; };
}, []);
```

---

## 13. WebSockets — Socket.io / Native

### Why it happens

Open socket + message handler holds closure. Reconnect logic duplicates handlers. Socket.io rooms accumulate if not `leave`/`off`.

### BAD

```javascript
useEffect(() => {
  const socket = io(SOCKET_URL);
  socket.on('message', (msg) => setMessages(m => [...m, msg]));
}, [postId]); // new socket each postId change without disconnect
```

### GOOD

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

### Detection

- Network tab: WS connection count rises
- Memory: `(system)` / `Native` retention for socket buffers
- Snapshot: search `Socket`, `WebSocket`

### Production case study snippet

Chat app opened 50 DMs in session — 50 sockets alive because `disconnect` only on full page unload. Fix: single shared socket with room join/leave per view.

---

## 14. API Requests — Fetch / Axios

### Why it happens

Slow response arrives after unmount → `setState` retains fiber work + response payload in closure chain.

### Fix — AbortController

```javascript
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

### Axios (v1+)

```javascript
const controller = new AbortController();
axios.get(url, { signal: controller.signal });
return () => controller.abort();
```

### Verification

Throttle network to Slow 3G, navigate away mid-request — no state update, no retained `ArrayBuffer` growth.

---

## 15. Closures — Large Object Retention

### Internal working

Every function closes over its **lexical environment**. If the environment contains `largeData`, the **entire environment** may be retained even if the callback uses one field.

### BAD — accidental large retention

```javascript
function PostView({ postId }) {
  useEffect(() => {
    const analyticsPayload = buildHugeAnalyticsObject(postId); // 5 MB

    const trackClick = () => {
      sendEvent(analyticsPayload); // uses whole object
    };

    document.addEventListener('click', trackClick);
    return () => document.removeEventListener('click', trackClick);
  }, [postId]);
}
```

### GOOD — retain only what you need

```javascript
const trackClick = () => {
  sendEvent({ postId, event: 'click' }); // minimal closure
};
```

### Interview question

**Q: Do arrow functions in render cause leaks?**

**Strong:** Not inherently — they become collectible when DOM/fiber is released. **Leak** when stored on global/long-lived registry without removal.

---

## 16. useEffect Leaks — Wrong Cleanup & Dependencies

### Common patterns

| Pattern | Problem |
|---------|---------|
| Empty deps with external sub | Runs once, never cleaned on prop change |
| Missing deps | Stale closure + duplicate subs |
| Cleanup clears wrong thing | `off` wrong handler reference |
| Async IIFE without cancel flag | setState after unmount |

### BAD — wrong dependency

```javascript
useEffect(() => {
  subscribe(userId, handleUpdate);
  return () => unsubscribe(userId, handleUpdate);
}, []); // userId changes → old subscription leaked
```

### GOOD

```javascript
useEffect(() => {
  subscribe(userId, handleUpdate);
  return () => unsubscribe(userId, handleUpdate);
}, [userId, handleUpdate]);
```

Use **`useEffectEvent`** (React 19+) or stable callback refs when `handleUpdate` identity churn causes re-subscribe storms.

---

## 17. Observer APIs — Intersection / Resize / Mutation

### Why it happens

Observers hold callbacks and observed nodes until `disconnect()`.

### GOOD pattern

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

### Detection

Snapshot: search `IntersectionObserver`, `ResizeObserver`. Elements panel + Memory: detached nodes still observed.

---

## 18. Detached DOM Nodes

### What it is

A **detached DOM node** is removed from the document tree but still referenced from JavaScript — so the browser cannot reclaim layout/paint memory.

### Why it happens

```javascript
const cache = [];
function mountWidget(el) {
  cache.push(el); // keep ref to removed DOM subtree
}
```

React-specific: refs stored in module-level Map, portal cleanup missed, jQuery plugins.

### Detection in Chrome

Heap snapshot → Filter **`Detached`** → expand retainers → often `HTMLDivElement` chain to `Closure` → `FiberNode`.

### Memory graph

```
Document (live tree)          Detached subtree
     │                              │
  <div#app>                   <div.old-modal>  ← not in document
                                   ▲
                                   │
                            JS ref in Map/cache
```

### Fix strategy

1. Remove JS references (`map.delete`, `ref.current = null`)
2. Ensure React unmount runs (conditional render keys)
3. Third-party: call `.destroy()` on unmount

---

## 19. React Context Leaks

### Why it happens

Provider value recreated each render with huge objects; consumers hold refs; **unbounded** append-only context state (notification list without cap).

### BAD — unbounded global notifications

```javascript
const [notifications, setNotifications] = useState([]);

const add = (n) => setNotifications(prev => [...prev, n]); // never trimmed
```

### GOOD — bounded ring buffer

```javascript
const MAX = 100;
const add = (n) => setNotifications(prev => [...prev, n].slice(-MAX));
```

### Senior discussion

Split contexts: **volatile** vs **stable** to reduce consumer re-renders and accidental retention of large value objects in memoized children.

---

## 20. React Query / Apollo / Redux Leaks

### Cache growth

| Library | Leak pattern | Fix |
|---------|--------------|-----|
| **React Query** | Infinite `queryCache` entries | `gcTime` (formerly `cacheTime`), `queryClient.clear()` |
| **Apollo** | Normalized cache unbounded | `cache.evict`, `typePolicies`, pagination merge limits |
| **Redux** | Entity slice grows forever | Normalized entities + TTL eviction middleware |

### React Query example

```javascript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 5 * 60 * 1000,  // garbage collect inactive queries
      staleTime: 60 * 1000,
    },
  },
});
```

### Apollo example

```javascript
cache.evict({ id: 'Post:123' });
cache.gc();
```

### Detection

Redux DevTools state size; React Query Devtools query count; heap snapshot `(object)` arrays matching cache shape.

---

# PART 7: REACT MEMORY LEAK DETECTION (CHROME DEVTOOLS)

## 21. Memory Tab Overview

### What normal memory looks like

```
Healthy SPA session (30 min, bounded routes)
Memory
  │
  │    ╭────────────────────────────── plateau
  │   ╱
  │  ╱   minor sawtooth (GC)
  │ ╱
  └──────────────────────────────────► time
```

### What leak patterns look like

```
LEAK — stair-step (heap floor rises each navigation cycle)
Memory
  │
  │         ╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱
  │        ╱
  │       ╱
  │      ╱
  └──────────────────────────────────► time
```

---

## 22. Heap Snapshot

### How to use

1. DevTools → Memory → **Heap snapshot** → Take snapshot
2. Perform repro (10 route cycles)
3. Take second snapshot
4. Select Snapshot 2 → **Comparison** vs Snapshot 1

### Reading comparison

| Column | Meaning |
|--------|---------|
| **# New** | Objects created since snapshot 1 |
| **# Deleted** | Objects collected |
| **# Delta** | Net growth — hunt large positive deltas |
| **Size Delta** | Bytes retained |

### Identify retained objects

1. Sort by **Size Delta**
2. Look for `(string)`, `(array)`, `Comment`, `Fiber`, `(closure)`
3. Click object → **Retainers** tab (bottom)
4. Walk chain to root: `Window` / `Detached HTMLDivElement` / `Listener`

### Detached DOM workflow

```
Filter: Detached
  │
  ▼
Pick largest Detached HTMLDivElement
  │
  ▼
Retainers → Closure → React fiber → your component name
  │
  ▼
Search codebase for ref/cache holding node
```

---

## 23. Allocation Timeline (Instrumentation on Timeline)

### What it is

Records allocations over time with stack traces (performance cost: high).

### Workflow

1. Memory → **Allocation instrumentation on timeline**
2. Start recording
3. Perform single leak action (mount/unmount once)
4. Stop — blue bars = allocations; gray = freed
5. If blue bars persist after unmount → leak

### Leak signature

```
Timeline after unmount should show deallocation spike.
If allocation bars remain "live" ──► investigate constructors in summary.
```

---

## 24. Allocation Sampling

Lower overhead than full instrumentation — statistical stack samples. Good for **long sessions** when exact stacks are less critical.

---

## 25. Memory Graphs & Performance Monitor

Enable **Performance monitor** (Cmd+Shift+P → "Show Performance monitor"):

| Metric | Leak signal |
|--------|-------------|
| JS heap size | Monotonic increase |
| DOM Nodes | Doesn't return after navigation |
| JS event listeners | Stair-step |
| Documents | > 1 in SPA |

---

## 26. Real Example — Listener Leak Investigation

```
Symptom: Listeners 12 → 847 after 30 min
Step 1: Snapshot diff — (closure) +835
Step 2: Retainer — Window → scroll → Feed.useEffect
Step 3: Fix — add removeEventListener in cleanup
Step 4: Re-test — listeners flat at 12
```

### Common mistakes in DevTools

| Mistake | Consequence |
|---------|-------------|
| Single snapshot only | Cannot distinguish leak vs working set |
| Snapshot while DevTools open on paused debugger | DevTools retains objects |
| Not forcing GC before snapshot | Noise — use trash icon (collect garbage) |
| Ignoring detached DOM | JS heap flat but tab memory huge |

### Hands-on exercise

Using `vite-react`, intentionally leak a scroll listener in a component, capture two snapshots, document retainer path, fix, verify delta ≈ 0.

---

# PART 8: REACT MEMORY LEAK CASE STUDIES

## Case Study 1: Instagram Comment Section

### Leak introduction

Infinite comment threads with **IntersectionObserver** per `CommentItem`, **scroll listeners** on modal, **optimistic reply cache** in module-level Map keyed by postId.

### Symptoms

- Opening 20 posts in modal → tab memory +400 MB
- Mobile Safari reloads after ~10 posts
- `# DOM Nodes` never drops closing modal

### Investigation

1. Performance monitor: DOM nodes stair-step
2. Snapshot comparison after open/close modal 10×
3. Filter `Detached` — thousands of `HTMLDivElement`
4. Retainers → `commentCache` module Map

### Root cause

```javascript
// module-level — survives hot reload and all routes
const commentCache = new Map();

function CommentModal({ postId }) {
  useEffect(() => {
    commentCache.set(postId, { tree: fullCommentTree, domRef: containerRef });
    // never deleted on unmount
  }, [postId]);
}
```

### Fix

```javascript
useEffect(() => {
  return () => {
    commentCache.delete(postId);
    observer.disconnect();
  };
}, [postId]);
```

Move cache to React Query with `gcTime` or LRU max 20 posts.

### Verification

10 open/close cycles: DOM nodes ±5%, heap delta < 2 MB per cycle after GC.

**Cross-ref:** [`10-Instagram-Comment-Section-Complete-Guide.md`](./10-Instagram-Comment-Section-Complete-Guide.md)

---

## Case Study 2: Chat Application

### Symptoms

WebSocket count matches number of rooms ever visited; message arrays duplicated in closure per `socket.on`.

### Root cause

New `socket.on('message')` each render without `off`; multiple socket instances.

### Fix

Single socket provider; `off` before `on`; normalize messages in reducer with max history 500.

### Verification

Network: 1 WS connection; snapshot: single `Socket` instance retainers.

---

## Case Study 3: Infinite Feed

### Symptoms

Scroll 30 min → heap 800 MB; FPS drops from GC.

### Root cause

Append-only `posts[]` in state without virtualization; images retained in off-screen DOM.

### Fix

`react-window` / `@tanstack/react-virtual`; unload images via `loading="lazy"` + unmount rows; paginate state slice.

### Verification

Heap plateaus after ~2 viewport heights of data in memory.

---

## Case Study 4: Dashboard (Charts + Polling)

### Symptoms

Dashboard left open overnight — 4 GB tab; `setInterval` polling every 5s accumulates chart instances.

### Root cause

Recharts/Chart.js not destroyed; new chart object each poll; interval leak on widget unmount.

### Fix

```javascript
useEffect(() => {
  const chart = createChart(canvasRef.current);
  const id = setInterval(fetchMetrics, 5000);
  return () => {
    clearInterval(id);
    chart.destroy();
  };
}, []);
```

---

## Case Study 5: BookMyShow Seat Selection

### Symptoms

Seat map interaction lag after selecting/deselecting 200 seats; memory grows with each selection wave.

### Root cause

**History stack** of every seat state copy (`[...allSeats]`) stored for undo without limit; **mousemove** listener on `document` for hover tooltip.

### Fix

Immutable undo with max depth 50; delegate hover to seat grid container; `removeEventListener` on unmount.

### Verification

Select 500 seats → heap stable; INP < 200ms.

---

# PART 9: NODE.JS MEMORY LEAKS — DEEP DIVE

> Node.js runs V8 in a single main thread (per isolate) with libuv thread pool. Leaks manifest as climbing **RSS**, **heapUsed**, **external**, or **resource handles** — often over hours/days under steady load.

---

## 27. Global Variables

### Why it happens

Assignment to `global`, module-level `let cache = {}`, or missing `const` creating implicit globals in sloppy mode.

### BAD

```javascript
// leak.js — called per request
function handleRequest(req, res) {
  if (!global.requestLog) global.requestLog = [];
  global.requestLog.push({ body: req.body, headers: req.headers }); // unbounded
  res.json({ ok: true });
}
```

### GOOD

```javascript
const MAX = 1000;
const requestLog = [];

function handleRequest(req, res) {
  requestLog.push({ id: req.id, at: Date.now() });
  if (requestLog.length > MAX) requestLog.shift();
  res.json({ ok: true });
}
```

### Detection

`heapdump` → search `(array)` growth; `global` retainer path.

---

## 28. In-Memory Caches

### Why it happens

Performance optimization without **TTL**, **max size**, or **LRU**.

### Fix — LRU with `lru-cache`

```javascript
import LRU from 'lru-cache';

const cache = new LRU({
  max: 500,
  ttl: 1000 * 60 * 10, // 10 min
});

function getUser(id) {
  if (cache.has(id)) return cache.get(id);
  const user = db.fetch(id);
  cache.set(id, user);
  return user;
}
```

### Senior discussion

In multi-instance deployments, in-memory cache causes **inconsistency** — prefer Redis with TTL; local cache only for derived/compute-heavy idempotent data.

---

## 29–30. Unbounded Maps & Sets

### Pattern

```javascript
const sessions = new Map(); // sessionId → sessionObject

// on login: sessions.set(id, data)
// on logout: MISSING sessions.delete(id)  ← LEAK
```

### Detection

Log `sessions.size` periodically; alert on monotonic growth with flat DAU.

### Fix

Always pair `set` with `delete` on lifecycle end; use `WeakMap` when keys are objects and lifetime matches.

---

## 31. EventEmitter Leaks

### Why it happens

Node's `EventEmitter` warns when **`defaultMaxListeners` (10)** exceeded — symptom of leak. Each `on` without `off` retains listener closure.

### BAD

```javascript
const emitter = new EventEmitter();

function subscribe(userId) {
  emitter.on('update', (data) => {
    processUser(userId, data); // new listener every subscribe call
  });
}
```

### GOOD

```javascript
function subscribe(userId, handler) {
  emitter.on('update', handler);
  return () => emitter.off('update', handler);
}
```

### Detection

```javascript
console.log(emitter.listenerCount('update'));
console.log(emitter.eventNames());
```

Use **`events.setMaxListeners(n)`** only after fixing root cause — raising limit hides leak.

---

## 32. Timers

### Why it happens

`setInterval` in module scope never cleared; `setTimeout` chains referencing large scope.

### Fix

Store timer IDs; `clearInterval` on shutdown hook:

```javascript
const interval = setInterval(flushMetrics, 60_000);

process.on('SIGTERM', () => {
  clearInterval(interval);
  server.close(() => process.exit(0));
});
```

---

## 33. Long-Lived Closures

Same as React — middleware capturing `req`/`res` bodies in closure stored on global queue.

---

## 34. Database Connection Leaks

### Why it happens

Pool connection checked out, error path skips `release()`, pool size exhausted — not always heap leak but **resource leak**.

### BAD

```javascript
const client = await pool.connect();
const result = await client.query(sql);
// missing client.release() in finally
return result;
```

### GOOD

```javascript
const client = await pool.connect();
try {
  return await client.query(sql);
} finally {
  client.release();
}
```

Or use `pool.query()` which auto-releases.

### Detection

Pool metrics: `waitingCount`, `idleCount`; DB `pg_stat_activity` count.

---

## 35. Redis Connection Leaks

Multiple `createClient()` per request instead of singleton; subscribers not unsubscribed.

```javascript
// GOOD — singleton
let redis;
export function getRedis() {
  if (!redis) redis = createClient({ url: REDIS_URL });
  return redis;
}
```

---

## 36. Message Queue Leaks

Consumer acks after processing but **stores message payload** in in-memory array for "debug". Prefetch too high + slow handler → unbounded in-flight messages in RAM.

### Fix

Stream processing; bounded concurrency; persist audit trail to DB with rotation.

---

## 37. File Handle Leaks

### Why it happens

`fs.createReadStream` without `close`; `fs.open` without `fs.close`.

### Detection

`lsof -p <pid> | wc -l` climbing; `EMFILE` errors.

### GOOD

```javascript
import { createReadStream } from 'fs';
import { pipeline } from 'stream/promises';

await pipeline(createReadStream(path), writable);
// pipeline closes streams on completion/error
```

---

## 38. Stream Leaks

Paused streams buffer indefinitely; listeners on `data` without cleanup.

---

## 39. Circular References

Usually collectable in pure JS if unreachable. **Problem** when cycle attached to `global` or `EventEmitter`.

---

## 40. Large Buffers

Reading entire file into Buffer per request:

```javascript
// BAD for 500 MB uploads
const buf = await fs.readFile(hugePath);
```

Use streams; monitor `process.memoryUsage().external`.

---

## 41. Memory Fragmentation

### What it is

Free memory exists but not contiguous — V8 may grow `heapTotal` while `heapUsed/heapTotal` ratio drops.

### Detection

`heapTotal` ↑, `heapUsed` flat after forced GC — clinic.js `/doctor` heap timeline.

### Fix

Reduce long-lived object churn; restart as last resort in containers with rolling deploy; tune `--max-old-space-size` only after fixing retention.

---

### Node.js Leak Summary Table

| Category | Detection | Fix | Prevention |
|----------|-----------|-----|------------|
| Global vars | heapdump diff | Remove global, bound array | ESLint no-global-assign |
| Cache | size metrics | LRU + TTL | Cache policy doc |
| EventEmitter | listenerCount | off/removeListener | Return unsubscribe |
| Timers | active handles count | clearInterval on SIGTERM | Central timer registry |
| DB pool | waiting clients | finally release | Pool wrappers |
| Streams | lsof, external bytes | pipeline, destroy | Stream lint patterns |
| Buffers | external RSS | streaming | Size limits |

---

# PART 10: NODE.JS MEMORY LEAK DETECTION

## 42. process.memoryUsage()

```javascript
const m = process.memoryUsage();
/*
{
  rss: 89341952,        // Resident Set Size — total RAM for process
  heapTotal: 3571712,   // V8 allocated heap
  heapUsed: 2845672,    // V8 used portion
  external: 1234567,    // C++ objects bound to JS (Buffers, etc.)
  arrayBuffers: 12345   // SharedArrayBuffer + ArrayBuffer
}
*/
```

| Field | Meaning | Leak signal |
|-------|---------|-------------|
| **rss** | Total process RAM | Stair-step over days |
| **heapUsed** | Live JS objects | Grows without plateau |
| **heapTotal** | V8 reserved heap | Grows; fragmentation |
| **external** | Native bindings | Buffer/stream leak |
| **arrayBuffers** | Binary data | Large payload retention |

### Example — log every 30s

```javascript
setInterval(() => {
  const m = process.memoryUsage();
  console.log(JSON.stringify({
    ts: Date.now(),
    rss_mb: (m.rss / 1e6).toFixed(1),
    heap_used_mb: (m.heapUsed / 1e6).toFixed(1),
    external_mb: (m.external / 1e6).toFixed(1),
  }));
}, 30_000);
```

---

## 43. Node Inspector & Chrome DevTools

```bash
node --inspect server.js
# Open chrome://inspect → Open dedicated DevTools for Node
# Memory tab — same heap snapshot workflow as browser
```

**Production caution:** `--inspect` opens debug port — never expose publicly without auth.

---

## 44. Clinic.js

```bash
npm install -g clinic
clinic doctor -- node server.js
# Load test, stop → generates HTML report: event loop delay, GC, CPU
clinic heapprofiler -- node server.js
```

| Tool | Use |
|------|-----|
| **doctor** | Overall health — event loop, GC, CPU |
| **bubbleprof** | Async delay paths |
| **heapprofiler** | Allocation stacks |
| **flame** | CPU flamegraphs |

---

## 45. heapdump

```javascript
import heapdump from 'heapdump';

function capture(label) {
  const path = `/tmp/heap-${label}-${Date.now()}.heapsnapshot`;
  heapdump.writeSnapshot(path, (err) => {
    if (err) console.error(err);
    else console.log('written', path);
  });
}

process.on('SIGUSR2', () => capture('manual'));
```

Load `.heapsnapshot` in Chrome DevTools Memory tab.

---

## 46. Memlab (Meta)

Automated browser leak detection — scenario scripts + snapshot diff. Useful for **SPAs** in CI.

---

## 47. 0x — Flamegraphs

```bash
npx 0x server.js
# Generates flamegraph on exit — find hot allocation paths
```

---

## 48. Node Profiler

```bash
node --prof server.js
node --prof-process isolate-*.log > processed.txt
```

---

## 49. Leak Detection Workflow (Node)

```
┌─────────────────────────────────────────────────────────────┐
│ NODE.JS LEAK WORKFLOW                                        │
├─────────────────────────────────────────────────────────────┤
│ 1. Alert: RSS > threshold for 1h (flat QPS)               │
│ 2. Correlate: deploy time, feature flag, traffic pattern    │
│ 3. Reproduce in staging with load test (k6/autocannon)      │
│ 4. Log memoryUsage every 30s + listenerCount + cache.size  │
│ 5. Capture heapdump at T0 and T1 (after 1000 req)           │
│ 6. Compare in Chrome — sort Delta, walk retainers           │
│ 7. Fix + deploy canary                                      │
│ 8. Verify RSS plateau 24h                                   │
│ 9. Add regression: heap budget in load test CI              │
└─────────────────────────────────────────────────────────────┘
```

---

# PART 11: NODE.JS MEMORY LEAK CASE STUDIES

## Case Study 1: API Server

**Symptoms:** RSS 200 MB → 2 GB over 48h; K8s OOM restarts.

**Investigation:** heapdump diff — `(string)` +40 MB from response cache.

**Root cause:** Middleware caches full JSON responses forever in Map.

**Fix:** LRU max 1000, TTL 5 min.

**Verification:** 48h load test — flat RSS ±10%.

---

## Case Study 2: Express App

**Symptoms:** `MaxListenersExceededWarning`; memory with SSE clients.

**Root cause:** Missing `off` on client disconnect.

**Fix:** `req.on('close', () => emitter.off('data', onData))`.

---

## Case Study 3: Socket.io Server

**Symptoms:** 10k users → 8 GB; rooms Map never pruned.

**Fix:** On disconnect, leave rooms and delete empty room metadata.

---

## Case Study 4: Queue Consumer

**Symptoms:** heapUsed tracks queue depth.

**Root cause:** Unbounded `pending[]` before ack.

**Fix:** Prefetch = concurrency; per-message ack.

---

## Case Study 5: Microservice

**Symptoms:** `external` dominates — gRPC Buffer cache in interceptor.

**Fix:** Ring buffer 100; export traces to Jaeger.

---

# PART 12: PRODUCTION DEBUGGING PLAYBOOK

## Scenario: Memory Rises Continuously in Production

### What the engineer should do

```
ALERT: pod memory > 85% for 30 min
        │
        ▼
┌───────────────────┐     NO      ┌────────────────────────┐
│ Traffic spike?    │────────────►│ Likely capacity — scale│
└─────────┬─────────┘             │ horizontally (temp)    │
          │ YES                    └────────────────────────┘
          ▼
┌───────────────────┐     NO      ┌────────────────────────┐
│ New deploy?       │────────────►│ Investigate leak path  │
└─────────┬─────────┘             └────────────────────────┘
          │ YES
          ▼
   Rollback canary / feature flag off
          │
          ▼
   Reproduce in staging with production trace
```

### Step-by-step playbook

| Step | Action | Output |
|------|--------|--------|
| **1. Observe** | Grafana/Datadog RSS, heap, GC pause, restarts | Timeline correlating deploy/traffic |
| **2. Collect metrics** | `process.memoryUsage`, DOM nodes (RUM), listener count | Baseline vs anomaly |
| **3. Capture heap** | Staging repro: heapdump / Chrome snapshot | T0, T1 files |
| **4. Compare snapshots** | Delta sort by size | Suspect constructors |
| **5. Identify retainers** | Walk to root | Module/global/listener |
| **6. Root cause** | Map to PR/commit | Jira with retainer screenshot |
| **7. Fix** | Cleanup, bounds, LRU | PR + unit test |
| **8. Deploy** | Canary 5% → 25% → 100% | Watch RSS 24h |
| **9. Verify** | Load test + snapshot diff | Plateau confirmed |
| **10. Monitor** | Alert on RSS slope; memlab in CI | Regression prevented |

### Production constraints

| Constraint | Mitigation |
|------------|------------|
| Cannot attach debugger in prod | Staging repro with same data volume |
| Snapshot pauses process | Off-peak capture; smaller isolate |
| PII in heap | Redact; capture in sanitized env |
| Multi-pod | Per-pod heap — leak usually in all |

### Senior discussion

- **SRE partnership:** define SLO for memory slope, not just CPU
- **Blast radius:** OOM kill loses in-flight requests — graceful drain before limit
- **Postmortem:** leak fixes need **regression test** or it returns in 6 months

---

# PART 13: INTERVIEW MASTERCLASS

> Structure: each **featured question** has Basic / Strong / Senior answers + follow-ups. Full **question banks** list all 300 questions with topic tags and section pointers.

---

## Featured Answers — React (Questions 1–15)

### Q1: What is a memory leak in JavaScript?

| Level | Answer |
|-------|--------|
| **Basic** | Memory that is no longer needed but still held in memory because something still references it. |
| **Strong** | In GC languages, a leak is **reachable but unused** memory — GC cannot collect because a reference path exists from a root (global, listener, cache). |
| **Senior** | Distinguish leak from **intentional cache**, **memory pressure from legitimate working set**, and **native retention** (detached DOM, Buffers). Confirm with fixed-workload repro and snapshot diff, not single `heapUsed` reading. |

**Follow-ups:** How do you confirm vs cache? Example in React?

---

### Q2: Why do React components leak memory after unmount?

| **Basic** | Side effects (listeners, timers, subscriptions) not cleaned in `useEffect` return. |
| **Strong** | Unmount removes fiber from tree but **external registries** (window, socket, module Map) still hold closures referencing `setState` and captured props/state. |
| **Senior** | Strict Mode double-invocation exposes missing cleanup. Also: **React 18 concurrent** — unmount may be deferred; abort fetches with `AbortController`. Third-party libs may detach DOM but retain refs. |

---

### Q3: How do you fix a memory leak from `useEffect`?

| **Basic** | Return a cleanup function that removes listeners and clears timers. |
| **Strong** | Match effect lifecycle to subscription: `addEventListener` ↔ `removeEventListener`, `socket.on` ↔ `socket.off`, `controller.abort()`. Fix dependency array so old subs are torn down when inputs change. |
| **Senior** | Extract `useEventListener`, `useSocket`, `useAbortableFetch` hooks tested with mount/unmount cycles. Add **memlab** or snapshot test in CI for critical flows. Document ownership: who registers external resource must deregister. |

---

### Q4: What happens if you call `setState` on an unmounted component?

| **Basic** | React warns in dev; may cause memory leak. |
| **Strong** | Update schedules work on fiber that may still exist briefly; closure + pending update retained. Use cancelled flag or AbortController. |
| **Senior** | In React 18+, unmount is async with concurrent features — prefer **aborting cause** not ignoring effect. For libraries, use `isMounted` ref pattern or migrate to `useSyncExternalStore`. |

---

### Q5: Explain detached DOM nodes.

| **Basic** | DOM removed from page but still referenced in JS. |
| **Strong** | Browser cannot free layout/paint memory; visible in heap snapshot as `Detached HTML*Element`. |
| **Senior** | Common in SPAs with modal caches, ref Maps, D3/jQuery. Fix by nulling refs and removing from module caches on unmount. RSS grows while JS heap flat — check Performance monitor DOM count. |

---

### Q6–Q15 (Compact)

| # | Question | Senior one-liner |
|---|----------|------------------|
| 6 | Event listener leak fix? | `useEffect` cleanup + same function reference for remove |
| 7 | `setInterval` leak? | `clearInterval` in cleanup; guard async with cancelled flag |
| 8 | WebSocket leak? | Single instance; `off` + `disconnect` on unmount |
| 9 | Fetch after unmount? | `AbortController.abort()` in cleanup |
| 10 | Closure leak example? | Handler on `window` capturing 5 MB analytics object |
| 11 | React Query cache leak? | Tune `gcTime`; `queryClient.removeQueries` on logout |
| 12 | Redux leak? | Unbounded entity map — eviction middleware |
| 13 | Context leak? | Unbounded array in provider value — cap + split contexts |
| 14 | Strict Mode and leaks? | Double mount proves missing cleanup |
| 15 | Virtualization vs leak? | Off-screen DOM retention — use windowing |

---

## Top 100 React Memory Leak Questions (Full Bank)

> Format: `#. Question → See Part/Section`

### Fundamentals (1–10)
1. What is a memory leak in JS? → Part 4, Q1 above
2. Reachability vs reference counting → Part 3
3. Can GC fix all memory issues? → Part 4
4. Stack vs heap in leak context → Part 2
5. Why closures leak → Part 6 §15
6. Circular references in React? → Part 3
7. Difference leak vs cache → Part 5
8. Symptoms of browser leak → Part 7
9. When is growth not a leak? → Part 5 Step 3
10. WeakMap for metadata? → Part 6 §19

### useEffect & Hooks (11–25)
11. Missing cleanup pattern → Part 6 §16
12. Empty dependency array dangers → Part 6 §16
13. Stale closure in effect → Part 6 §16
14. `useEffect` vs `useLayoutEffect` cleanup → Part 6
15. Custom hook for subscriptions → Part 6 §11
16. `useRef` holding DOM after unmount → Part 6 §18
17. `useCallback` preventing GC? → Part 6 §15
18. `useMemo` large object retention → Part 6 §15
19. React 19 `useEffectEvent` → Part 6 §16
20. Double fetch Strict Mode → Part 6 §11
21. Multiple effects same listener → Part 6 §11
22. Conditional `useEffect` → Part 6
23. Cleanup async operations → Part 6 §14
24. `useSyncExternalStore` cleanup → Part 6
25. Testing cleanup in RTL → Part 14 Lab 1

### Event Listeners (26–35)
26. window scroll listener → Part 6 §11, Lab 1
27. document click delegation → Part 6 §11
28. Passive listeners memory? → Part 6 §11
29. React synthetic events leak? → Part 6 (no — delegated)
30. Third-party analytics listeners → Part 6 §11
31. Identifying listener count → Part 7 §25
32. capture vs bubble cleanup → Part 6 §11
33. MediaQueryList listener → Part 6 §17
34. `beforeunload` listener → Part 6 §11
35. Hot reload retaining listeners → Part 6 §11

### Timers & Async (36–45)
36. setInterval leak → Part 6 §12, Lab 2
37. setTimeout chain → Part 6 §12
38. requestAnimationFrame cleanup → Part 6 §12
39. Promise after unmount → Part 6 §14
40. AbortController pattern → Part 6 §14
41. Axios cancel token → Part 6 §14
42. Race conditions vs leak → Part 6 §14
43. debounce/throttle timers → Part 6 §12
44. Web Worker message handlers → Part 6
45. SharedWorker retention → Part 6

### WebSockets & Real-time (46–55)
46. Native WebSocket cleanup → Part 6 §13, Lab 3
47. Socket.io disconnect → Part 6 §13
48. Reconnection doubling handlers → Part 6 §13
49. SSE EventSource close → Part 6 §13
50. Pusher channel unsubscribe → Part 6 §13
51. GraphQL subscription leak → Part 6 §20
52. STOMP client → Part 6 §13
53. Multiple tabs socket → Part 6 §13
54. Buffering messages in state → Part 8 Case 2
55. Heartbeat interval leak → Part 6 §12

### DOM & Observers (56–70)
56. Detached DOM definition → Part 6 §18, Q5
57. Finding detached nodes → Part 7 §22
58. IntersectionObserver → Part 6 §17
59. ResizeObserver → Part 6 §17
60. MutationObserver → Part 6 §17
61. Portal unmount → Part 6 §18
62. ref callback leak → Part 6 §18
63. jQuery plugin destroy → Part 6 §18
64. Canvas/WebGL context → Part 6 §18
65. iframe not removed → Part 6 §18
66. Shadow DOM retention → Part 6 §18
67. Infinite list DOM → Part 8 Case 3
68. Image decode memory → Part 8 Case 3
69. Video element leak → Part 6 §18
70. Map library (Leaflet) cleanup → Part 6 §18

### State Management & Data (71–85)
71. Context unbounded growth → Part 6 §19
72. Redux entity accumulation → Part 6 §20
73. Zustand store leak → Part 6 §20
74. React Query gcTime → Part 6 §20
75. Apollo cache.evict → Part 6 §20
76. SWR cache size → Part 6 §20
77. Module-level singleton Map → Part 8 Case 1
78. Optimistic update orphans → Part 8 Case 1
79. Form state large drafts → Part 6 §19
80. URL query cache → Part 6 §20
81. IndexedDB vs memory → Part 6
82. localStorage not leak but confusion → Part 4
83. Session storage tab close → Part 4
84. BroadcastChannel → Part 6 §13
85. Service Worker cache vs heap → Part 4

### DevTools & Production (86–100)
86. Heap snapshot comparison → Part 7 §22
87. Allocation timeline → Part 7 §23
88. Performance monitor metrics → Part 7 §25
89. Force GC before snapshot → Part 7 §26
90. memlab in CI → Part 10 §46
91. RUM memory signals → Part 12
92. Tab crash OOM → Part 1
93. Mobile Safari jetsam → Part 8 Case 1
94. Electron renderer leak → Part 6
95. SSR hydration duplicate listeners → Part 6 §11
96. Micro-frontends shared window → Part 6 §11
97. Storybook hot reload leak → Part 6
98. E2E test memory → Part 14
99. Document leak investigation → Part 15
100. Prevent regression → Part 12 Step 10

---

## Featured Answers — Node.js (Questions 1–15)

### Q1: How do you detect a memory leak in Node.js?

| **Basic** | Monitor `process.memoryUsage()` over time; RSS keeps growing. |
| **Strong** | Fixed load test → monotonic `heapUsed`/`rss` without plateau → heapdump diff → retainer chain. |
| **Senior** | Correlate **external** for Buffer leaks, **event loop lag** for GC pressure, **active handles** (`process._getActiveHandles`) for timer/stream leaks. Use clinic.js doctor + load test in CI with memory budget assertion. |

---

### Q2: What is the difference between `rss`, `heapUsed`, and `external`?

| **Basic** | rss = total RAM; heapUsed = JS objects; external = C++ bound objects. |
| **Strong** | RSS includes heap + stack + code + native; external tracks Buffers and native addon memory. |
| **Senior** | RSS can grow while heap flat (native leak). K8s OOM uses cgroup RSS/limit. Tune alerts on multiple signals, not heap alone. |

---

### Q3: What causes EventEmitter memory leaks?

| **Basic** | Adding listeners without removing them. |
| **Strong** | Each `on` retains closure; defaultMaxListeners warning signals duplication. |
| **Senior** | Fix with `once`, returned unsubscribe, WeakRef rarely appropriate. In HTTP/SSE, tie lifecycle to `req.on('close')`. Audit shared singleton emitters in modular monoliths. |

---

### Q4–Q15 (Compact)

| # | Question | Senior one-liner |
|---|----------|------------------|
| 4 | Global variable leak | Module-level unbounded array — Part 9 §27 |
| 5 | LRU cache necessity | Part 9 §28 |
| 6 | Map session leak | delete on logout — Part 9 §29 |
| 7 | setInterval in server | clear on SIGTERM — Part 9 §32 |
| 8 | DB pool leak | finally release — Part 9 §34 |
| 9 | Stream pipeline | use `pipeline()` — Part 9 §37 |
| 10 | heapdump in prod | SIGUSR2 guarded admin — Part 10 §45 |
| 11 | clinic.js when | Staging perf regression — Part 10 §44 |
| 12 | Fragmentation vs leak | heapTotal↑ heapUsed flat — Part 9 §41 |
| 13 | `--expose-gc` | Dev/staging only — Part 10 |
| 14 | Worker threads memory | Separate isolates — Part 9 |
| 15 | PM2 restart masking | Fix root cause — Part 12 |

---

## Top 100 Node.js Memory Leak Questions (Full Bank)

### Runtime & V8 (1–15)
1. How V8 GC works in Node → Part 3
2. `--max-old-space-size` → Part 9 §41
3. `--expose-gc` usage → Part 10
4. Major GC pauses → Part 3
5. event loop lag from GC → Part 10 §44
6. new space vs old space → Part 3
7. Buffer in old gen → Part 9 §40
8. TypedArray retention → Part 9 §40
9. Native addon leak → Part 10 rss vs heap
10. N-API external memory → Part 10
11. WASM memory growth → Part 9
12. Cluster worker memory → Part 11 Case 5
13. PM2 cluster leak → Part 12
14. Container memory limit → Part 1
15. OOM killer behavior → Part 12

### Patterns (16–40)
16. Global leak → Part 9 §27
17. Module scope cache → Part 9 §28
18. Unbounded Map → Part 9 §29
19. Unbounded Set → Part 9 §30
20. Closure in middleware → Part 9 §33
21. Express req reference → Part 11 Case 2
22. Middleware next() leak → Part 9
23. Morgan logging buffer → Part 9 §28
24. JSON.parse huge body → Part 9 §40
25. Multer memory storage → Part 9 §40
26. Sharp image buffer → Part 9 §40
27. Puppeteer page leak → Part 9
28. Prisma connection → Part 9 §34
29. Mongoose connection pool → Part 9 §34
30. ioredis duplicate client → Part 9 §35
31. Kafka consumer prefetch → Part 9 §36, Case 4
32. Bull queue stalled jobs → Part 9 §36
33. Agenda job retention → Part 9 §32
34. node-cron intervals → Part 9 §32
35. DNS lookup cache → Part 9 §28
36. TLS session cache → Part 9
37. HTTP agent sockets → Part 9
38. keep-alive connections → Part 9
39. GraphQL DataLoader cache → Part 9 §28
40. Apollo server cache → Part 9 §28

### Detection Tools (41–60)
41. process.memoryUsage fields → Part 10 §42
42. v8.getHeapStatistics → Part 10
43. node --inspect → Part 10 §43
44. heapdump compare → Part 10 §45
45. clinic doctor → Part 10 §44
46. clinic heapprofiler → Part 10 §44
47. 0x flamegraph → Part 10 §47
48. autocannon + memory → Part 10 §49
49. k6 threshold rss → Part 10 §49
50. Prometheus node_exporter → Part 12
51. Datadog APM heap → Part 12
52. active handles → Part 10
53. active resources → Part 10
54. lsof file handles → Part 9 §37
55. EMFILE → Part 9 §37
56. uv_thread_pool → Part 9
57. strace debugging → Part 12
58. perf Linux → Part 12
59. eBPF memory → Part 12
60. Grafana alerts slope → Part 12

### Architecture & Production (61–100)
61. API response cache leak → Case 1
62. SSE listeners → Case 2
63. Socket.io rooms → Case 3
64. Queue pending array → Case 4
65. gRPC buffer interceptor → Case 5
66. Microservice shared lib global → Part 9 §27
67. Graceful shutdown → Part 9 §32
68. SIGTERM handling → Part 9 §32
69. Kubernetes OOMKilled → Part 12
70. Horizontal scale hides leak → Part 12
71. Canary memory verify → Part 12
72. Blue/green deploy RSS → Part 12
73. Serverless memory limit → Part 1
74. Lambda container reuse → Part 9 §28
75. Cold start vs leak → Part 5
76. Log aggregation memory → Part 9 §28
77. Winston transport buffer → Part 9
78. Pino vs memory → Part 9
79. Source map heap → Part 9
80. ts-node dev leak → Part 9
81. nodemon restart → Part 12
82. Jest open handles → Part 14 Lab 5
83. Supertest server close → Part 14
84. Memory leak test CI → Part 14
85. heap budget assertion → Part 10 §49
86. Staging prod parity → Part 12
87. Feature flag isolate → Part 12
88. Postmortem template → Part 5
89. Runbook memory → Part 12
90. On-call first steps → Part 12
91. When to restart pod → Part 12
92. When NOT restart → Part 12
93. Communication to PM → Part 12
94. SLI memory slope → Part 12
95. Capacity planning → Part 1
96. Node 20 vs 22 GC → Part 3
97. Undici fetch memory → Part 9
98. Fastify vs Express hooks → Part 11
99. NestJS provider scope → Part 9
100. Deno/Bun comparison → Part 3 (conceptual)

---

## Top 50 Heap Snapshot Questions (Full Bank + Featured)

### Featured Q1: How do you compare two heap snapshots?

| **Basic** | Take two snapshots, use Comparison view, look at Delta. |
| **Strong** | Force GC, fixed repro between snapshots, sort `# Delta` and Size Delta, investigate constructors with largest positive delta. |
| **Senior** | Eliminate DevTools noise (close unrelated panels), filter detached DOM and closures, walk retainers to **nearest root**, map to code via allocation stack (timeline) or search codebase. Confirm fix with third snapshot where delta ≈ 0. |

### Featured Q2: What are retainers?

| **Basic** | Objects that hold references preventing GC. |
| **Strong** | Retainer chain from leaked object up to GC root. |
| **Senior** | Distinguish **retaining path** vs **ownership** — fix at earliest incorrect edge (usually listener or global), not leaf object. |

### Questions 3–50 (with section pointers)

3. Shallow size vs retained size → Part 7 §22
4. `(string)` delta spike → Part 8 Case 1
5. `(array)` delta → Part 8 Case 3
6. `(closure)` delta → Part 6 §15
7. `FiberNode` retention → Part 6 §18
8. `Detached HTMLDivElement` → Part 6 §18
9. `Listener` filter → Part 7 §22
10. `system / Context` → Part 2
11. `Object` constructor generic → Part 7 §22
12. `Map` growth → Part 9 §29
13. `Set` growth → Part 9 §30
14. Comparison vs summary view → Part 7 §22
15. Allocation stack trace → Part 7 §23
16. Snapshot size on disk → Part 10 §45
17. Snapshot pauses production → Part 12
18. Chrome vs Node snapshot → Part 10 §43
19. `# new` vs `# deleted` → Part 7 §22
20. Dominator tree → Part 7 (advanced)
21. WeakRef in snapshot → Part 3
22. FinalizationRegistry → Part 3
23. DevTools retains objects → Part 7 §26
24. Console.log retains → Part 7 §26
25. Source map objects → Part 7
26. Prototype chain retention → Part 2
27. Hidden class → Part 3
28. Compiled code retention → Part 3
29. WASM memory in snapshot → Part 7
30. ArrayBuffer detached → Part 9 §40
31. SharedArrayBuffer → Part 9 §40
32. Blob retention → Part 6 §14
33. ImageBitmap → Part 8 Case 3
34. Canvas memory → Part 6 §18
35. GPU texture not in JS heap → Part 7 §21
36. iframe snapshot → Part 6 §18
37. Extension noise → Part 7 §26
38. Incognito repro → Part 7 §26
39. Multiple tabs isolate → Part 7
40. Snapshot during GC → Part 7 §22
41. Manual gc trash icon → Part 7 §26
42. memlab auto diff → Part 10 §46
43. Retainer depth reading → Part 7 §22
44. Circular retainer display → Part 2
45. Global object path → Part 9 §27
46. `Window` root → Part 6 §11
47. `global` in Node → Part 9 §27
48. Module exports retention → Part 9 §27
49. require.cache leak → Part 9
50. Fix verification snapshot → Part 5 Step 8

---

## Top 50 Production Debugging Scenarios (Full Bank + Featured)

### Featured Scenario 1: "Memory keeps increasing. What do you do?"

See **Part 15** universal framework — full senior walkthrough.

### Featured Scenario 2: RSS grows but heapUsed flat

| **Basic** | Probably native memory — Buffers, DOM, leaks outside V8 heap. |
| **Strong** | Check `external`, `arrayBuffers`, detached DOM, stream buffers, lsof handles. |
| **Senior** | Profile with clinic, capture heap + native tools; in browser check DOM node count and GPU; in Node check unclosed streams and gRPC/protobuf. |

### Scenarios 3–50

3. OOMKilled pod every 6h → Part 11 Case 1, Part 12
4. After deploy memory jump → Part 12 rollback
5. Only one pod leaking → Part 12 (local state leak)
6. All pods leak equally → Part 9 global/cache
7. Leak only under load → Part 10 load test
8. Leak overnight idle → Part 6 §12 timers
9. Browser tab crash mobile → Part 8 Case 1
10. Dashboard 8h shift → Part 8 Case 4
11. Chat app 50 rooms → Part 8 Case 2
12. Infinite scroll 30min → Part 8 Case 3
13. Seat map lag → Part 8 Case 5
14. SSE connections climb → Part 11 Case 2
15. WebSocket rooms → Part 11 Case 3
16. Kafka lag + memory → Part 11 Case 4
17. gRPC external bytes → Part 11 Case 5
18. GraphQL cache unbounded → Part 6 §20
19. React Query devtools count → Part 6 §20
20. Redux time-travel memory → Part 6 §20
21. SSR server leak → Part 9 §27
22. Next.js API route → Part 9 §28
23. Serverless timeout memory → Part 1
24. Cron job heap spike → Part 9 §32
25. File upload service → Part 9 §40
26. Image processing service → Part 9 §40
27. PDF generation leak → Part 9 §40
28. Log shipping buffer → Part 9 §36
29. Metrics cardinality map → Part 9 §29
30. Feature flag payload cache → Part 9 §28
31. A/B test config global → Part 9 §27
32. Webhook retry queue RAM → Part 9 §36
33. Rate limiter Map unbounded → Part 9 §29
34. Session store in-memory → Part 9 §29
35. JWT blacklist Set → Part 9 §30
36. Multi-tenant data isolation leak → Part 9 §29
37. Tenant offboarding not deleting → Part 9 §29
38. Staging cannot reproduce → Part 12 parity
39. Production cannot snapshot → Part 12 staging
40. PII in heap dump policy → Part 12
41. Canary passes 1h fails 24h → Part 10 §49
42. GC pause P99 latency → Part 3
43. Event loop blocked vs leak → Part 10 §44
44. CPU normal memory high → Part 5
45. Memory normal handles high → Part 9 §37
46. Intermittent leak → Part 5 repro
47. Leak during batch job → Part 11 Case 4
48. Leak after security incident scan → Part 12
49. Third-party script leak → Part 6 §11
50. Post-fix regression 6 months → Part 12 Step 10

---

# PART 14: PRACTICAL LABS

## Lab 1 — Leak an Event Listener (React)

### Setup

Create `LeakyScroll.jsx` in `vite-react`:

```javascript
import { useEffect, useState } from 'react';

export function LeakyScroll() {
  const [y, setY] = useState(0);
  useEffect(() => {
    const bigData = new Array(100_000).fill('leak');
    window.addEventListener('scroll', () => {
      setY(window.scrollY);
      void bigData.length;
    });
  }, []);
  return <div style={{ height: '200vh' }}>Scroll Y: {y}</div>;
}
```

### Detect

1. Mount/unmount 10× via route toggle
2. Performance monitor → JS event listeners increase
3. Snapshot diff → `(closure)` + `(string)` delta

### Fix

Store handler in const; `removeEventListener` in cleanup; move `bigData` out or shrink.

### Verify

Listeners flat after 10 cycles; snapshot delta < 100 KB.

---

## Lab 2 — Leak a Timer

```javascript
useEffect(() => {
  const id = setInterval(() => setCount(c => c + 1), 100);
  // FIX: return () => clearInterval(id);
}, []);
```

Detect via React warning + interval count in Performance monitor.

---

## Lab 3 — Leak a WebSocket

```javascript
useEffect(() => {
  const ws = new WebSocket('wss://echo.websocket.events');
  ws.onmessage = (e) => setMessages(m => [...m, e.data]);
}, []);
```

Fix: `ws.close()` in cleanup; cap messages array length.

---

## Lab 4 — Leak a Node Cache

```javascript
// leak-server.mjs
import http from 'http';
const cache = new Map();

http.createServer((req, res) => {
  const body = new Array(10_000).fill(req.url);
  cache.set(Date.now(), body);
  res.end('ok');
}).listen(3000);
```

Detect: `autocannon -c 10 -d 30 http://localhost:3000` + log `cache.size` and rss.

Fix: LRU max 100.

---

## Lab 5 — Leak an EventEmitter

```javascript
import { EventEmitter } from 'events';
const bus = new EventEmitter();

export function subscribe() {
  bus.on('tick', () => { /* work */ });
}
// Call subscribe() 100x without off
```

Detect: `MaxListenersExceededWarning`; `bus.listenerCount('tick')`.

Fix: return unsubscribe; call on shutdown.

---

## Lab 6 — Leak a Queue Consumer

Simulate unbounded `pending`:

```javascript
const pending = [];
async function consume(msg) {
  pending.push(msg);
  if (pending.length < 1000) return; // never ack until 1000
}
```

Fix: ack each message; limit prefetch.

---

# PART 15: UNIVERSAL MEMORY LEAK INVESTIGATION FRAMEWORK

## Question: "Memory usage keeps increasing. What will you do?"

### Answer framework (10 steps)

```
STEP 1: CONFIRM THE LEAK
────────────────────────
Fixed workload? Monotonic growth over 30+ min?
  NO → may be traffic/caching — measure per-request memory
  YES → proceed

STEP 2: REPRODUCE
─────────────────
Minimal steps in staging/local
Document: clicks, routes, API calls, duration

STEP 3: MEASURE
───────────────
Browser: Performance monitor, memory timeline
Node: process.memoryUsage every 30s, listenerCount, cache.size

STEP 4: CAPTURE SNAPSHOTS
─────────────────────────
T0 baseline, T1 after N repro cycles
Force GC before capture (dev)

STEP 5: COMPARE
───────────────
Sort delta by retained size
Note constructors: (closure), Detached, Map, (string)

STEP 6: FIND RETAINED OBJECTS
─────────────────────────────
Retainer chain to root

STEP 7: TRACE REFERENCES
────────────────────────
Map to source file: listener, global, cache, effect

STEP 8: FIX ROOT CAUSE
──────────────────────
Not symptom — remove retaining edge, bound cache, cleanup

STEP 9: VERIFY
──────────────
Repeat repro — heap floor stable, RSS plateau 24h load test

STEP 10: MONITOR
────────────────
Alert on memory slope; memlab/heap budget in CI; runbook
```

### React example walkthrough

| Step | Action |
|------|--------|
| Confirm | Open/close comment modal 20× — heap floor +8 MB each cycle |
| Reproduce | Single route `/post/:id` modal |
| Measure | DOM nodes 400 → 12,000 |
| Snapshot | T0, T1 comparison |
| Retainers | `Detached HTMLDivElement` → `commentCache` Map |
| Fix | Delete cache entry on unmount |
| Verify | DOM nodes return to ~400 |

### Node.js example walkthrough

| Step | Action |
|------|--------|
| Confirm | RSS stair-step at flat 100 RPS |
| Reproduce | `autocannon` 10 min |
| Measure | heapUsed + external |
| heapdump | T0, T1 |
| Retainers | `(string)` → `responseCache` |
| Fix | LRU + TTL |
| Verify | 24h k6 test flat RSS |

### Full-stack example

BFF caches full API responses (Node) + frontend stores duplicate in Context (React).

Fix both layers; verify separately then E2E.

---

## Summary Cheatsheet

| Domain | Default detection | Default fix | Default prevention |
|--------|-------------------|-------------|-------------------|
| **React listener** | Snapshot `# Listener` | `useEffect` cleanup | `useEventListener` hook |
| **React async** | Pending fetch after nav | `AbortController` | Abortable fetch hook |
| **React DOM** | Detached filter | Remove module refs | No module-level DOM cache |
| **React data** | Query cache count | `gcTime`, eviction | Bounded caches |
| **Node global** | heapdump → global | Remove/bound | ESLint, code review |
| **Node cache** | Map.size metric | LRU + TTL | Cache policy |
| **Node EventEmitter** | listenerCount | `off` on close | Unsubscribe API |
| **Node I/O** | external, lsof | `pipeline`, `close` | Stream helpers |
| **Production** | RSS slope alert | Canary + heapdump | CI memory budget |

**Default choice:** On "memory keeps growing" — **confirm with fixed repro**, **compare two heap snapshots**, **walk retainers to root**, **fix retaining reference**, **verify with third snapshot and 24h metrics** — not restart pods indefinitely.

---

*End of handbook. Practice Labs 1–6 in `vite-react` and a small Express server; pair with [`11-Frontend-Performance-Engineering-Complete-Guide.md`](./11-Frontend-Performance-Engineering-Complete-Guide.md) Sections 7–9 for overlapping GC fundamentals.*
