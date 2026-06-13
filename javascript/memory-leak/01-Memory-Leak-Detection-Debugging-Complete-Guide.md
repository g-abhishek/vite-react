# Memory Leak Detection & Debugging — Complete Guide (Basics to Advanced)

> A hands-on learning guide: every concept comes with a worked example, a runnable demo, and a **Your Turn** exercise so you build real intuition — not just read theory.

**Companion docs:** `[01-Event-Loop.md](../01-Event-Loop.md)`, `[05-NodeJS-Internals.md](../05-NodeJS-Internals.md)`, `[04-React-Internals.md](../04-React-Internals.md)`, `[11-Frontend-Performance-Engineering-Complete-Guide.md](../11-Frontend-Performance-Engineering-Complete-Guide.md)`

**Runnable labs:** All Node.js demos live in `[labs/](./labs/)`. React exercises use your `vite-react` app.

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
3. Do **Your Turn** first — then scroll down to **Solution** on the same exercise (don't peek early).
4. Check **Expected result** — if yours differs from **Solution**, that's where real learning happens.

**Suggested path:**


| Week | Sections | Focus                                  |
| ---- | -------- | -------------------------------------- |
| 1    | 1–6      | Memory model, GC, what leaks are       |
| 2    | 7–9      | Detection mindset + Chrome DevTools    |
| 3    | 10–11    | Node.js leaks + profiling              |
| 4    | 12–14    | Advanced patterns, decisions, pitfalls |


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

---

## Summary Cheatsheet


| Pattern             | Symptom                                | Detect with                                | Fix                        |
| ------------------- | -------------------------------------- | ------------------------------------------ | -------------------------- |
| Missing cleanup     | Listeners/timers climb on route change | Performance monitor, snapshot `# Listener` | `useEffect` return cleanup |
| Unbounded cache     | Map/Set size grows forever             | `cache.size`, heap snapshot `(Map)`        | LRU + TTL                  |
| Global retention    | RSS stair-step at flat traffic         | heapdump → `global` retainer               | Remove global, bound array |
| Detached DOM        | Tab memory huge, JS heap flat          | Snapshot filter `Detached`                 | Delete refs on unmount     |
| Closure capture     | `(closure)` delta in snapshot          | Retainers panel                            | Keep only needed fields    |
| Fetch after unmount | State updates after navigate away      | Network throttle + navigate                | `AbortController`          |
| EventEmitter        | `MaxListenersExceededWarning`          | `listenerCount()`                          | Return `off()` unsubscribe |
| Node streams        | `external` climbs, `EMFILE`            | `lsof`, `process.memoryUsage()`            | `pipeline()`, `close()`    |


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

1. Watch output for 30 seconds. Note the numbers.

**Expected result:** `rss` and `heapUsed` print every 3 seconds with stable values (small jitter is normal).

**Solution:** You should see repeating lines like `{"rss":"45MB","heapUsed":"4MB"}` with small fluctuations (±1–2 MB). No steady climb — that would suggest a leak in the script itself (there isn't one).

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

1. Note the MB allocated.
2. Kill the process (`Ctrl+C`).

**Expected result:** Roughly 80–150 MB jump depending on Node version (strings are not free).

**Solution:** After `Allocated ~` prints, `heapUsed` jumps sharply. The process keeps running (`setInterval` at the end) so memory stays allocated until you `Ctrl+C`. This shows how fast large arrays add pressure — imagine one per leaked component.

**Think about:** What if your app created one such array per user session and never released it?

---

## 3. Core Concepts & Mental Models

### Terminology you will use constantly


| Term              | Plain English                                   | Example                                  |
| ----------------- | ----------------------------------------------- | ---------------------------------------- |
| **Heap**          | Storage for objects, arrays, closures           | `{ users: [...] }`                       |
| **Stack**         | Storage for function frames and primitives      | `const count = 5`                        |
| **Reference**     | Pointer from one variable to a heap object      | `const a = obj`                          |
| **GC root**       | Starting point GC uses to find live objects     | `window`, `globalThis`, active stack     |
| **Reachable**     | Object has a path from a root                   | Listener closure → component state       |
| **Retained**      | Kept alive because something still points to it | Global Map holding old sessions          |
| **Retainer**      | The object holding the reference                | `window` → `scroll listener` → `closure` |
| **Shallow size**  | Size of object itself                           | One object, no children                  |
| **Retained size** | Object + everything only it keeps alive         | Parent + entire subtree                  |
| **Detached DOM**  | Removed from page but still referenced in JS    | Modal div kept in a Map                  |
| **RSS**           | Total RAM used by the process                   | What `kubectl top pod` shows             |


### How terms connect (overview)

This is the chain you will see in almost every React/browser leak:

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

Each arrow means **"still holds a reference to"**. If any path exists from a root to your data, GC **will not** delete it — even if your UI already unmounted.

The subsections below explain **why** each link exists and **what breaks** when you remove the chain.

---

### Deep dive: What is a GC root?

A **GC root** is where the garbage collector **starts** its search. Think of roots as **anchors**: anything connected to an anchor (by following references) is considered **alive** and is kept in memory.


| Root (browser)                         | Why it is always "alive"                 |
| -------------------------------------- | ---------------------------------------- |
| `window` / `globalThis`                | Global object for the tab/process        |
| Currently executing stack              | Local variables in active function calls |
| Live DOM tree                          | Elements still attached to the document  |
| Debugger / DevTools (while inspecting) | Tools can temporarily retain objects     |


The GC algorithm (simplified) asks one question:

> **"Starting from all roots, what objects can I reach by following every reference?"**


| Answer                          | What happens                |
| ------------------------------- | --------------------------- |
| **Reachable** from a root       | Kept in memory              |
| **Not reachable** from any root | Deleted (garbage collected) |


**Key insight:** GC does not know your *intent* ("I unmounted this component, I don't need it anymore"). It only knows *reachability*.

---

### Deep dive: What is a retainer?

A **retainer** is any object that **holds a reference** to another object.

```
Object A ──references──► Object B
```

Here **A retains B**. If A is reachable from a root, **B is also reachable** — even when B is useless to your application logic.

In a leak chain:

```
window  ──►  listener  ──►  closure  ──►  [10 MB array]
 root        retainer       retainer       leaked data
```

Fixing a leak almost always means **breaking one link in this chain** — usually the first incorrect edge (listener on `window`, entry in a global `Map`, etc.), not deleting the leaf object alone.

---

### Deep dive: The listener → closure → state chain (step by step)

This is the most common React leak pattern. Walk through it once and the rest of the guide will click.

#### Step 1 — Component mounts and registers a listener

```javascript
function Feed() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const bigData = new Array(1_000_000).fill('x'); // ~10 MB on heap

    window.addEventListener('scroll', () => {
      setItems(prev => [...prev, 'more']);
      void bigData.length;
    });
    // BUG: no cleanup — listener never removed
  }, []);

  return <div>{items.length}</div>;
}
```

When this runs, memory looks like this:

```
window (ROOT — alive for entire tab lifetime)
  │
  └── scroll listener (function object on heap)
         │
         └── closure ("backpack" of captured variables)
                ├── setItems      ← ties back to React for this component
                ├── items           ← from the render when effect ran
                └── bigData         ← the 10 MB array
```

#### Step 2 — Why does the listener matter?

`window.addEventListener('scroll', callback)` stores `callback` inside the browser's internal listener registry attached to `window`.

So you now have a **complete path from a root to your data**:

```
window  ──►  scroll callback  ──►  closure  ──►  bigData
```

As long as that path exists, GC treats `bigData` (and everything in the closure) as **in use**.

#### Step 3 — What is the closure doing here?

The scroll handler is not "just a function". It was **created inside** `useEffect`, so it **captures** (closes over) every variable from that scope that it might use:

- `setItems`
- `bigData`
- potentially other values from that render

That captured bundle is called a **closure**. It stays attached to the function **for as long as the function object exists**.

**Important:** The closure often retains **more than you expect** — sometimes the whole lexical environment, not only the one field you read inside the callback.

#### Step 4 — User navigates away (component unmounts)

You might expect:

```
Component unmounted  →  state freed  →  bigData freed  ✓
```

What **actually** happens:

1. React removes the component from the UI tree and drops **its** references to that fiber/state.
2. **But** `window` still holds the scroll listener.
3. The listener's closure still holds `setItems`, state machinery, and `bigData`.

```
React tree          window (ROOT)
   │                    │
   ✗ (no ref)           └──► listener ──► closure ──► bigData
```

GC question: *"Can I reach `bigData` from a root?"*  
Answer: **Yes** — via `window → listener → closure`.  
Result: **Do not delete.** That is the leak.

#### Step 5 — What "reachable but unused" means


| Term          | Meaning in a leak                                                                 |
| ------------- | --------------------------------------------------------------------------------- |
| **Reachable** | GC can still find the object by walking references from a root                    |
| **Unused**    | Your app logic no longer needs it (component gone, modal closed, user logged out) |


In languages like C you would call `free()`. In JavaScript, **if any reference path exists — even a bug — GC will not collect it.**

This is why saying *"GC will clean it up eventually"* is wrong for leaks: **the object is still reachable, so it is not garbage.**

---

### Mental model: The reference graph

Think of memory as **dots** (objects) and **arrows** (references):

```
     [window]              ← ROOT
        │
        ▼
   [listener fn]
        │
        ▼
    [closure]
       /    \
      ▼      ▼
 [setItems] [bigData 10MB]   ← all kept alive together
```

**Mark phase (what GC does):**

```
1. Start at every root (window, stack, live DOM, …)
2. Follow every arrow; mark each visited node
3. Anything NEVER visited     → delete
4. Anything visited           → keep
```

Your leaked array is **visited** because there is a path from `window`.

**After fix (`removeEventListener`):**

```
Before cleanup:
  window ──► listener ──► closure ──► bigData     (KEEP)

After cleanup:
  window ✗ listener
  closure ──► bigData   (no path from any root)
  → next GC cycle deletes closure + bigData
```

---

### Analogy: Hotel checkout


| Concept                | Real-world equivalent                      |
| ---------------------- | ------------------------------------------ |
| **GC root (`window`)** | Hotel front desk guest log                 |
| **Event listener**     | Your name still listed as "checked in"     |
| **Closure**            | Your room key + everything inside the room |
| **10 MB array**        | Your luggage in the room                   |


You **left the building** (component unmounted), but your name is **still on the log** (listener not removed). The hotel keeps the room reserved forever — even though you are not using it.

**Fix:** Check out properly — `removeEventListener` in `useEffect` cleanup.

---

### Why `leaked = null` is not enough

Developers sometimes think dropping their variable frees memory:

```javascript
let leaked = new Array(1_000_000).fill('leak');

window.addEventListener('scroll', () => {
  void leaked.length; // closure captures `leaked`
});

leaked = null; // YOU removed YOUR reference…
// …but the listener's closure STILL references the array
// → memory NOT freed
```

You removed **one** reference. The listener's closure is **another** reference. GC only collects when **no path from any root** exists.

**Fix:** Remove the listener (or whatever holds the closure), not just null out your local variable.

```javascript
const onScroll = () => void leaked.length;
window.addEventListener('scroll', onScroll);

// later, on unmount:
window.removeEventListener('scroll', onScroll); // cuts root → listener link
leaked = null; // now nothing points to the array
```

---

### The fix — and why it works

```javascript
useEffect(() => {
  const bigData = new Array(1_000_000).fill('x');

  const onScroll = () => {
    setItems(prev => [...prev, 'more']);
    void bigData.length;
  };

  window.addEventListener('scroll', onScroll, { passive: true });

  return () => {
    window.removeEventListener('scroll', onScroll); // breaks window → listener
  };
}, []);
```

On unmount:

1. React runs the cleanup function.
2. Browser removes `onScroll` from `window`'s listener list.
3. No path remains: `window → … → bigData`.
4. Next GC cycle collects the closure and the 10 MB array.

**Critical detail:** You must pass the **same function reference** to `removeEventListener`. Creating a new arrow function in cleanup does nothing:

```javascript
// BAD — different function reference, listener NOT removed
window.addEventListener('scroll', () => setY(window.scrollY));
return () => window.removeEventListener('scroll', () => setY(window.scrollY));

// GOOD — same reference
const onScroll = () => setY(window.scrollY);
window.addEventListener('scroll', onScroll);
return () => window.removeEventListener('scroll', onScroll);
```

---

### Self-check (before moving on)

You should be able to answer:

1. **Why doesn't unmounting a component free its memory?**
  Because something outside React (usually `window`, a timer, socket, or module-level `Map`) still holds a reference.
2. **Why does the event listener matter more than the component?**
  The listener is reachable from `window` (a root). That keeps the closure — and everything it captured — alive.
3. **What is a retainer chain?**
  The path of references from a root to the leaked object: `window → listener → closure → data`.
4. **What is the fix?**
  Remove the retaining edge in cleanup (`removeEventListener`, `clearInterval`, `abort()`, `map.delete()`), then verify with DevTools.

---

### Your Turn — Exercise 3.1: Draw the Graph

**Goal:** Practice reading reference chains before touching DevTools.

**Given this code, draw stack vs heap and mark what is collectible:**

```javascript
const users = [{ id: 1 }, { id: 2 }];
const first = users[0];
users.length = 0;
```

**Expected answer:** `{ id: 1 }` is **NOT** collectible — `first` still references it. `{ id: 2 }` **IS** collectible (no references).

**Solution:**

```
Stack                         Heap
─────────────────────────────────────────
users ──► (empty array)       { id: 1 } ◄── first  (NOT collectible)
                              { id: 2 }            (collectible)
```

`users.length = 0` clears the array's contents but does not affect `first` — it still points at `{ id: 1 }`. Only `{ id: 2 }` has no remaining references and can be collected.

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


|              | Stack                | Heap                |
| ------------ | -------------------- | ------------------- |
| **Speed**    | Very fast alloc/free | Slower (GC managed) |
| **Lifetime** | Function scope       | Until unreachable   |
| **Contents** | Primitives, refs     | Objects, closures   |
| **Cleanup**  | Automatic on return  | GC only             |


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

**Expected result (challenge):**


| Run                                | `After gc() — leaked handler still on globalThis:`      |
| ---------------------------------- | ------------------------------------------------------- |
| **Default** (line present)         | `true` — handler reachable from `globalThis` root       |
| **After your edit** (line removed) | `false` — handler + `bigPayload` collected after `gc()` |


**✓ You got it right if:** Removing the global assignment flips the last line from `true` to `false`. That proves the leak was the **root reference**, not the GC "failing."

**Solution:**

**Default run** (`globalThis.__leakedHandler = handler` present):

```bash
node --expose-gc javascript/memory-leak/labs/01-reachability.mjs
```

```
Before clear — first.name: Alice
After users.length = 0 — first.name: Alice
Is Alice collectible? NO — `first` still references her object.

After gc() — leaked handler still on globalThis: true
```

**After challenge** (remove `globalThis.__leakedHandler = handler`):

```
After gc() — leaked handler still on globalThis: false
```

| State | Retainer chain | After `gc()` |
|-------|----------------|--------------|
| Global line **present** | `globalThis` → `handler` → `bigPayload` | Handler survives |
| Global line **removed** | No path from root | Handler + `bigPayload` collected |

**Note:** Alice's object stays alive in both runs because `first` still references it. The challenge only fixes the global handler leak.

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

### Generational hypothesis — why V8 splits the heap

#### The observation

In real applications, most objects are **temporary**:

```javascript
function handleRequest(req) {
  const temp = { body: req.body, parsed: JSON.parse(req.body) }; // created
  return process(temp);                                           // used once
} // temp becomes unreachable — function ends
```

Thousands of objects like `temp` are created and discarded every second. Only a **small fraction** (caches, DOM wrappers, long-lived app state) survive more than a few seconds.

This is the **generational hypothesis**: *young objects usually die young; old objects usually stay alive a long time.*

V8 exploits this by splitting memory into **two generations** and using **different GC strategies** for each — cheap collections for short-lived garbage, expensive collections only when necessary.

#### Young vs Old space — what goes where

```
┌─────────────────────────────────────────────────────────────────┐
│                         V8 Heap                                  │
├──────────────────────────────┬──────────────────────────────────┤
│  NEW SPACE (Young Generation)│  OLD SPACE (Old Generation)       │
│  ┌──────────┬──────────┐     │                                   │
│  │ From     │  To      │     │  Long-lived objects:              │
│  │ (semispaces)         │     │  • App caches (Map, arrays)       │
│  └──────────┴──────────┘     │  • Closures on global listeners   │
│                              │  • React fiber trees (mounted)    │
│  Fresh allocations land here │  • Promoted survivors             │
└──────────────────────────────┴──────────────────────────────────┘
```


| Generation            | What goes here                     | Collection                  | Speed       | Frequency  |
| --------------------- | ---------------------------------- | --------------------------- | ----------- | ---------- |
| **Young (New Space)** | Every new object at birth          | **Minor GC** (Scavenge)     | ~1–5 ms     | Very often |
| **Old (Old Space)**   | Objects that survived 2+ Minor GCs | **Major GC** (Mark-Compact) | ~50–200+ ms | Less often |


**Promotion:** When an object survives a Minor GC cycle, V8 copies it to the other semispace. After surviving **typically 2 Scavenge cycles**, it gets **promoted** to Old Space. Promotion means: *"this object might live a while — treat it as long-lived."*

#### Minor GC (Scavenge) — how young collection works

New Space uses **two halves** (From-space and To-space):

```
Before Minor GC:
  From-space: [obj1 dead] [obj2 alive] [obj3 dead] [obj4 alive]
  To-space:   [ empty ]

Step 1: Copy ONLY reachable objects from From → To
  To-space:   [obj2] [obj4]

Step 2: Swap roles — old From becomes empty To
  From-space: [ empty ]        ← next allocations go here
  To-space:   [obj2] [obj4]    ← survivors
```

**Why it's fast:** New Space is small (typically 1–8 MB). Most objects in it are already dead. V8 copies survivors instead of scanning the entire heap.

**Analogy:** Cleaning a small dorm room where most students already left for break — you only pack what's still needed, not search the whole campus.

#### Major GC (Mark-Compact) — how old collection works

When Old Space fills up (or crosses a threshold), V8 runs **Major GC**:

1. **Mark** — traverse from all roots through **entire Old Space** (and often young gen too)
2. **Sweep/Compact** — free dead objects; optionally move live objects to reduce fragmentation

**Why it's slow:** Old Space can be **hundreds of MB to GB**. Cost scales with **live data**, not just garbage.

**Analogy:** Inventorying an entire warehouse — every aisle, every shelf — even if most boxes are empty.

#### Walkthrough — request handler timeline (concrete)

Follow one HTTP request through the generations:

```
t=0ms   Request arrives
        │
        ▼
        handleRequest() allocates ~10,000 temp objects in New Space
        (parsed JSON, intermediate arrays, string copies)
        │
t=2ms   Response sent, function returns
        │
        ▼
        All 10,000 temps are UNREACHABLE (no variables point to them)
        │
t=5ms   Minor GC triggered (New Space nearly full)
        │
        ▼
        Scavenge runs — copies zero survivors (all temps dead)
        New Space cleared in ~1–3 ms
        │
        ✓ Healthy path — no leak, no promotion, fast cleanup
```

**Now the leak path — one accidental reference:**

```
t=0ms   Request creates 10,000 temps + 1 closure stored on global listener
        │
t=2ms   Request ends — 9,999 temps unreachable
        BUT closure retains 1 temp object (or entire request body)
        │
t=5ms   Minor GC — closure survives (reachable from window listener)
        │
        ▼
        Object PROMOTED to Old Space after 2nd survival
        │
t=1hr   10,000 requests later — 10,000 promoted objects in Old Space
        │
        ▼
        Major GC runs — must mark ALL old gen objects
        Pause: 80–200 ms  ← user feels jank / API latency spike
        │
        ✗ Leak path — objects wrongly promoted, expensive GC, growing pauses
```

**Senior insight:** Leaks don't just waste RAM. They **promote garbage to Old Space**, which makes **Major GC slower and more frequent** — that's the scroll jank and Node event-loop lag you see before OOM.

#### How leaks interact with generations


| Leak stage            | Where leaked objects live | What you feel                              |
| --------------------- | ------------------------- | ------------------------------------------ |
| **Early**             | Still in New Space        | Minor GC pressure, slight CPU bump         |
| **After promotion**   | Old Space                 | Longer Major GC pauses, P99 latency spikes |
| **Late / large leak** | Old Space full            | GC thrashing, OOM, tab crash               |


**GC thrashing:** Heap is almost full of live (leaked) objects. GC runs constantly trying to free space, finds almost nothing, pauses repeatedly — CPU spikes, app freezes, then OOM.

---

### Circular references — do they leak?

#### What a cycle looks like in memory

```javascript
const parent = { name: 'root' };
const child = { name: 'leaf' };
parent.child = child;
child.parent = parent; // cycle: parent ◄──► child
```

```
Heap graph (cycle):

  ┌─────────┐      child       ┌─────────┐
  │ parent  │ ───────────────► │  child  │
  │         │ ◄─────────────── │         │
  └─────────┘      parent      └─────────┘
       ▲                              │
       └──────── mutual refs ─────────┘
```

**Old myth (pre-2012 IE):** "Circular references always leak."  
**Modern V8/Chrome:** Cycles are **fine** — GC handles them.

#### Why modern GC handles cycles

Mark-and-sweep does not follow references **into** objects and stop at cycles. It asks: *"Is there ANY path from a root to this object?"*

```
Case 1 — cycle with NO external reference:

  (no root)     parent ◄──► child

  GC: Start at roots → cannot reach parent or child → BOTH deleted ✓
  Cycle does not matter — whole component is unreachable.
```

```
Case 2 — cycle WITH one external reference:

  global.cache ──► parent ◄──► child

  GC: root → global.cache → parent → child → back to parent
  Entire cycle is reachable → ALL kept alive ✗ LEAK
```

```javascript
// Case 1 — NO leak (cycle orphaned)
function createOrphanCycle() {
  const parent = { name: 'root' };
  const child = { name: 'leaf' };
  parent.child = child;
  child.parent = parent;
  // function ends — no variable or root points to parent
}
createOrphanCycle();
// parent + child cycle is unreachable → collected on next GC

// Case 2 — LEAK (cycle anchored to root)
const cache = new Map();
function createLeakedCycle(id) {
  const parent = { name: 'root' };
  const child = { name: 'leaf' };
  parent.child = child;
  child.parent = parent;
  cache.set(id, parent); // ONE external ref keeps ENTIRE cycle alive
}
```

**Rule of thumb:** Cycles leak when **any node in the cycle** is reachable from a root — listener, global, module-level Map, React ref cache, etc.

#### React example — cycle inside a leaked closure

```javascript
const nodeMap = new Map(); // module-level root

function TreeNode({ id }) {
  useEffect(() => {
    const node = { id, children: [] };
    node.parent = node; // self-cycle (toy example)
    nodeMap.set(id, node);
    // missing: return () => nodeMap.delete(id);
  }, [id]);
}
```

The cycle (`node.parent = node`) is not the problem. `**nodeMap.set(id, node)**` is — it anchors the object to a root that outlives the component.

---

### The critical rule

> **GC only collects UNREACHABLE memory.**  
> If anything still references it — even accidentally — it stays.

This is the **single most important rule** for memory leak debugging. Everything else in this guide is an application of it.

#### What GC can and cannot do


| GC can ✓                                             | GC cannot ✗                                                            |
| ---------------------------------------------------- | ---------------------------------------------------------------------- |
| Delete objects with **zero paths** from any root     | Delete objects you "don't need anymore" but something still references |
| Break cycles when the **whole cycle** is unreachable | Guess that a reachable listener was "forgotten"                        |
| Run automatically when heap pressure rises           | Free detached DOM if JS still holds a ref                              |
| Promote survivors to Old Space                       | Shrink Old Space if live set keeps growing                             |


#### Three scenarios — same object, different outcomes

**Scenario A — collectible (healthy):**

```javascript
function process() {
  const data = loadHugeArray();
  return data.length;
} // `data` unreachable when function returns → collected
```

**Scenario B — leak (reachable but unused):**

```javascript
const leaked = [];
function process() {
  const data = loadHugeArray();
  leaked.push(data); // reachable from module-level `leaked` forever
  return data.length;
}
```

**Scenario C — looks like B but intentional (cache, not leak):**

```javascript
const cache = new LRU({ max: 100, ttl: 60000 });
function process(key) {
  const data = loadHugeArray();
  cache.set(key, data); // reachable — but bounded + TTL eviction
  return data.length;
}
```


| Scenario | Reachable? | Unused?       | Leak?                                  |
| -------- | ---------- | ------------- | -------------------------------------- |
| A        | No         | —             | No — GC collects                       |
| B        | Yes        | Yes           | **Yes — bug**                          |
| C        | Yes        | Until evicted | No — intentional retention with policy |


**Debugging shortcut:** When you find leaked memory in DevTools, ask: *"Who is the nearest retainer to a root?"* Fix **that edge**, not the leaf object.

---

### Stop-the-world pauses — why GC affects performance

During parts of GC, JavaScript **pauses** so the memory graph stays consistent while marking.


| GC type                      | Typical pause | When you notice                                  |
| ---------------------------- | ------------- | ------------------------------------------------ |
| Minor GC                     | 1–5 ms        | Rarely visible                                   |
| Major GC (small heap)        | 10–50 ms      | Occasional frame drop                            |
| Major GC (large heap + leak) | 50–200+ ms    | Scroll jank, INP regression, Node event loop lag |


**In Node.js:** A 100 ms Major GC pause = 100 ms where **no callbacks, no I/O handlers, no timers** run on the main thread.

**In React:** Same pause during scroll = dropped frames = "app feels sluggish."

Leaks make this worse because **more live objects in Old Space = longer Major GC**.

---

### Pros & cons — relying on GC alone


| Pros                                           | Cons                                                                         |
| ---------------------------------------------- | ---------------------------------------------------------------------------- |
| No manual `free()` — fewer use-after-free bugs | Cannot collect **reachable-but-unused** memory (all JS leaks)                |
| Handles cycles automatically                   | GC pauses grow with **live set size** (leaks → jank)                         |
| Decades of engine tuning                       | **Native/DOM memory** (detached nodes, Buffers) invisible to JS heap metrics |
| Works well for short-lived allocations         | **No eviction policy** — you must bound caches yourself                      |
| Safe for most app code                         | `performance.memory` / `heapUsed` can look stable while **RSS climbs**       |


#### What "native/DOM memory invisible to JS heap" means

```javascript
const div = document.createElement('div');
document.body.appendChild(div);
document.body.removeChild(div);
window.__cache = div; // detached DOM — still in memory
```

- **`performance.memory.usedJSHeapSize`** — may barely change
- **Chrome Task Manager "Memory footprint"** — climbs (layout, paint, GPU buffers)

Always check **DOM node count** and **RSS**, not JS heap alone.

---

### Worked examples — concrete code for each concept

Each example maps to one idea from this section. Run the Node labs yourself; use the browser snippet in DevTools console for DOM.

---

#### Example 1: Generational hypothesis — "most objects die young"

**Story:** A coffee shop makes 10,000 paper cups per day (temp objects). Almost all are thrown away same day (Minor GC). Only the reusable thermos (long-lived cache) stays on the shelf (Old Space).

**Healthy code — 10,000 temps per request, all die young:**

```javascript
// Simulates: parse JSON, build arrays, format response — then discard
function handleRequest() {
  const temps = [];
  for (let i = 0; i < 10_000; i++) {
    temps.push({ id: i, row: `user-${i}`, payload: 'x'.repeat(50) });
  }
  return { count: temps.length, total: temps.reduce((s, t) => s + t.id, 0) };
}

// Run 200 "requests"
for (let i = 0; i < 200; i++) handleRequest();
// Each call ends → `temps` unreachable → Minor GC collects ~10k objects per request
// heapUsed stays flat (sawtooth up/down, no stair-step)
```

**What happens in V8:**

```
Request 1: allocate 10,000 objects in New Space
Request 1 ends: all 10,000 unreachable
Minor GC: copy 0 survivors → New Space empty (~1–3 ms)

Request 2: allocate 10,000 NEW objects in same New Space slots
... repeat 200× — no leak, no promotion
```

**Run the lab:**

```bash
node --expose-gc javascript/memory-leak/labs/07-generational-gc-demo.mjs
```

**Expected output (Part A):** `heapUsed` after 200 requests + gc stays near baseline (~3–5 MB). Part B shows `survivors.length=200` when one object per request is kept globally.

---

#### Example 2: Accidental ref → promotion → Major GC pain

**Same request handler, but ONE object survives each request:**

```javascript
const requestLog = []; // module-level — reachable from root forever

function leakyHandleRequest(reqId) {
  const temps = [];
  for (let i = 0; i < 10_000; i++) {
    temps.push({ id: i, reqId, body: 'x'.repeat(100) });
  }

  // LEAK: keep one object per request (simulates closure on window listener)
  requestLog.push(temps[0]);

  return temps.length;
}

for (let i = 0; i < 1_000; i++) leakyHandleRequest(i);
// 9,999 objects per request collected (die young)
// 1 object per request PROMOTED to Old Space → 1,000 live objects in Old gen
// Major GC now scans 1,000+ long-lived objects → 50–200 ms pauses
```

**Side-by-side:**

| | Healthy handler | Leaky handler |
|---|----------------|---------------|
| Temps per request | 10,000 | 10,000 |
| Survive after request | 0 | 1 (in `requestLog`) |
| After 1,000 requests | ~0 extra live objects | 1,000 in Old Space |
| GC cost | Minor GC only (fast) | Major GC scans growing Old Space (slow) |

**React version of the same mistake:**

```javascript
useEffect(() => {
  const requestBody = fetchHugePayload(); // 10,000 parsed rows

  window.addEventListener('scroll', () => {
    void requestBody.length; // closure captures entire payload
  });
  // missing cleanup → payload promoted to Old Space, never collected
}, []);
```

---

#### Example 3: Circular references — when they leak vs when they don't

**Case A — NO leak (orphan cycle):**

```javascript
function buildTree() {
  const parent = { name: 'root' };
  const child = { name: 'leaf' };
  parent.child = child;
  child.parent = parent; // cycle inside function
  return parent.id; // (undefined — toy example)
}
buildTree();
// No variable outside function points to `parent`
// GC: roots ✗→ parent ✗→ child → entire cycle deleted ✓
```

**Case B — LEAK (cycle anchored to root):**

```javascript
const cache = new Map();

function buildTree(id) {
  const parent = { name: 'root', id };
  const child = { name: 'leaf' };
  parent.child = child;
  child.parent = parent;

  cache.set(id, parent); // ONE external ref → whole cycle reachable
  // missing: cache.delete(id) on cleanup
}

buildTree(1);
buildTree(2);
buildTree(3);
// cache holds 3 cycles forever — parent ↔ child doesn't matter; root path exists
```

**Memory picture:**

```
Case A (no leak):                    Case B (leak):

  parent ◄──► child                    cache (ROOT)
  (floating — no root)                      │
                                       parent ◄──► child
                                       parent ◄──► child
                                       parent ◄──► child
```

**Run the lab:**

```bash
node --expose-gc javascript/memory-leak/labs/05-cycle-demo.mjs
# Output: global holder exists: true  (only the rooted cycle survives gc)
```

---

#### Example 4: The critical rule — reachable vs unreachable

**Scenario A — UNREACHABLE → GC collects ✓**

```javascript
function processOrder() {
  const lineItems = new Array(100_000).fill({ sku: 'ABC', qty: 1 });
  return lineItems.length;
}
processOrder();
// `lineItems` dead when function returns — no root path → collected
```

**Scenario B — REACHABLE but UNUSED → leak ✗**

```javascript
const debugLog = [];

function processOrder(orderId) {
  const lineItems = new Array(100_000).fill({ sku: 'ABC', qty: 1 });
  debugLog.push(lineItems); // you "forgot" this array — but GC sees a root path
  return lineItems.length;
}
// App never reads debugLog again — UNUSED to you, REACHABLE to GC → LEAK
```

**Scenario C — REACHABLE by design → NOT a leak ✓**

```javascript
const MAX = 50;
const cache = new Map();

function processOrder(orderId) {
  const lineItems = new Array(100_000).fill({ sku: 'ABC', qty: 1 });
  cache.set(orderId, lineItems);
  if (cache.size > MAX) cache.delete(cache.keys().next().value); // bounded
  return lineItems.length;
}
// Reachable on purpose — eviction policy makes it intentional, not a bug
```

| Scenario | Reachable? | You still need it? | Verdict |
|----------|------------|--------------------|---------|
| A | No | — | GC collects |
| B | Yes (`debugLog`) | No | **Leak** |
| C | Yes (`cache`) | Yes, with limit | **Not a leak** |

**Run the lab:**

```bash
node --expose-gc javascript/memory-leak/labs/08-critical-rule-demo.mjs
```

**Expected output:**

```
Scenario B — leakedStore.length = 1 → KEPT (leak)
Scenario C — boundedCache.length = 2 → KEPT by design (max 2)
```

---

#### Example 5: Pros & cons — one concrete example each

| Pro/Con | What it means | Concrete example |
|---------|---------------|------------------|
| **Pro: No manual free()** | You don't call `delete` on objects | `const x = { a: 1 }; x = null;` — engine handles cleanup when unreachable |
| **Pro: Handles cycles** | Orphan cycles are collected | Example 3 Case A — `parent ↔ child` with no external ref → both gone |
| **Con: Can't collect reachable-but-unused** | GC keeps anything with a root path | Example 4 Scenario B — `debugLog` never read again but memory stays |
| **Con: Pauses grow with live set** | More Old Space objects = longer Major GC | Example 2 — 1,000 leaked refs → scroll/API jank before OOM |
| **Con: Native/DOM invisible to JS heap** | Detached DOM uses RAM not shown in `heapUsed` | Browser snippet below |

**Browser — detached DOM (paste in DevTools console):**

```javascript
const div = document.createElement('div');
div.innerHTML = '<p>'.repeat(5000); // heavy subtree
document.body.appendChild(div);
document.body.removeChild(div);

window.__leakedDom = div; // detached but referenced — LEAK

// Check: Chrome Task Manager → Memory footprint climbs
// performance.memory.usedJSHeapSize may barely move
```

**Fix:** `delete window.__leakedDom` or `window.__leakedDom = null` — then GC can collect (after forced GC in heap snapshot).

---

### Self-check (before Exercise 5.1)

1. **Why does V8 use two generations?**
  Most objects die young — cheap Minor GC for temps, expensive Major GC only for survivors.
2. **What is promotion?**
  Object survives 2+ Minor GCs → moved to Old Space → future cleanup requires Major GC.
3. **Do circular references always leak?**
  No — only when the cycle is reachable from a root.
4. **Why do leaks cause jank before OOM?**
  Leaked objects fill Old Space → Major GC runs longer and more often → stop-the-world pauses.
5. **What is the critical rule?**
  GC collects unreachable memory only. Reachable = kept, even if unused.

---

### Your Turn — Exercise 5.1: Cycle vs Root

**Goal:** Understand when cycles leak and when they don't.

**Steps:** Run the existing lab:

```bash
node --expose-gc javascript/memory-leak/labs/05-cycle-demo.mjs
```

**Expected result:** `global holder exists: true` — only the cycle attached to `globalThis.holder` survives. The orphan cycle is collected.

**Solution:**

```
After gc(): global holder exists: true
```

Only the cycle on `globalThis.holder` survives. The orphan cycle (`a.ref ↔ b.ref` with no root) is collected — cycles alone do not leak.

### Your Turn — Exercise 5.2: Young temps vs promotion

**Goal:** See generational behavior with your own eyes.

**Steps:**

```bash
node --expose-gc javascript/memory-leak/labs/07-generational-gc-demo.mjs
```

**Expected result:**

| Part | What to observe |
|------|-----------------|
| **A** | `heapUsed` flat after 200 requests + gc |
| **B** | `survivors.length=200` — one object per request kept alive |

**✓ You got it right if:** Part A heap stays low; Part B reports 200 survivors.

**Solution:**

```
[A after 200 requests + gc] heapUsed=3.4MB ...
→ Temps were unreachable when each request ended.

[B after 200 requests + gc] heapUsed=3.4MB ...
→ survivors.length=200 (200 objects still reachable from root)
```

Part A: 10,000 temps × 200 requests — all die young (Minor GC). Part B: same temps collected, but **one survivor per request** in `survivors[]` stays reachable from a root.

### Your Turn — Exercise 5.3: Critical rule (three scenarios)

**Goal:** Distinguish leak vs intentional cache vs healthy cleanup.

**Steps:**

```bash
node --expose-gc javascript/memory-leak/labs/08-critical-rule-demo.mjs
```

**Expected result:**

```
Scenario B — leakedStore.length = 1 → KEPT (leak)
Scenario C — boundedCache.length = 2 → KEPT by design (max 2)
```

**✓ You got it right if:** B keeps 1 array; C keeps exactly 2 entries after third `scenarioC()` call.

**Solution:**

```
Scenario B — leakedStore.length = 1 → KEPT (leak)
Scenario C — boundedCache.length = 2 → KEPT by design (max 2)
heapUsed: ~9MB
```

- **A:** No root path → large array collected after `gc()`.
- **B:** `leakedStore` holds a reference → leak (reachable but unused).
- **C:** Bounded to 2 entries → intentional retention, not a bug.

---

## 6. What Is a Memory Leak? — Patterns You Will See Everywhere

### Definition

A **memory leak** in JavaScript is memory that remains **reachable** (GC cannot collect it) but is **no longer needed** by your program logic.

This is NOT forgetting to call `free()`. It is an **unintentional reference** you did not know still existed.

### Leak vs cache vs legitimate growth


| Type           | Behavior                        | Example                                     |
| -------------- | ------------------------------- | ------------------------------------------- |
| **Leak**       | Grows under fixed workload      | Listener added every mount, never removed   |
| **Cache**      | Grows then plateaus (or should) | LRU with max 500 entries                    |
| **Legitimate** | Grows with users/data           | More logged-in users → more session objects |


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

**Expected result (challenge):**


| Metric                          | Leaky (before fix)         | Your fix (correct)              |
| ------------------------------- | -------------------------- | ------------------------------- |
| `log.length` after 50k requests | `50000`                    | `500` (capped)                  |
| `heapUsed`                      | ~20–80 MB (varies by Node) | noticeably lower than leaky run |


**✓ You got it right if:** `log.length` stops at 500 no matter how many requests you simulate.

**Solution:**

```javascript
const MAX = 500;
function handleRequest(body) {
  requestLog.push({ body, at: Date.now() });
  if (requestLog.length > MAX) requestLog.shift();
}
```

Re-run after applying — `log.length=500`, `heapUsed` lower than the leaky run (`50000` entries).

### Your Turn — Exercise 6.2: Unbounded Cache Server

**Steps:**

1. Start the leaky server:

```bash
node javascript/memory-leak/labs/03-leaky-cache-server.mjs
```

1. In another terminal, hammer it:

```bash
for i in $(seq 1 3000); do curl -s http://localhost:3456/ > /dev/null; done
```

1. Watch `cache.size` and `rss` climb in the server terminal.

**Expected result:** `cache.size` approaches 3000; RSS keeps rising.

**Your challenge:** Create `03-leaky-cache-server-FIXED.mjs` that caps cache at 100 entries (use `Map` + delete oldest, or install `lru-cache`).

**Expected result (challenge):**


| Metric                        | Leaky server   | Your fix (correct)         |
| ----------------------------- | -------------- | -------------------------- |
| `cache.size` after 3000 curls | ~3000          | ≤ 100                      |
| `rss` over time               | keeps climbing | plateaus after cache fills |


**✓ You got it right if:** `cache.size` never exceeds 100 and RSS stops growing linearly under steady load.

**Solution:**

Create `javascript/memory-leak/labs/03-leaky-cache-server-FIXED.mjs`:

```javascript
import http from 'http';

const MAX = 100;
const cache = new Map();

function setCache(key, value) {
  if (cache.size >= MAX) {
    cache.delete(cache.keys().next().value);
  }
  cache.set(key, value);
}

const server = http.createServer((req, res) => {
  setCache(`${req.url}-${Date.now()}`, new Array(5_000).fill(req.url));
  res.end(`ok cache.size=${cache.size}\n`);
});

server.listen(3456, () => {
  setInterval(() => {
    const m = process.memoryUsage();
    console.log(`cache.size=${cache.size} rss=${(m.rss / 1e6).toFixed(1)}MB`);
  }, 3000);
});
```

After 3000 curls: `cache.size` stays at `100`, RSS plateaus.

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


| Step      | What you do                             | What you find                     |
| --------- | --------------------------------------- | --------------------------------- |
| Observe   | User reports scroll jank after 30 min   | —                                 |
| Measure   | Performance monitor: JS heap stair-step | Heap floor rises                  |
| Confirm   | Navigate away and back 10×              | +5 MB per cycle                   |
| Capture   | Heap snapshot before/after              | `(closure)` +40, `# Listener` +10 |
| Retainers | `Window` → `scroll` → `Feed.useEffect`  | Missing cleanup                   |
| Fix       | Add `removeEventListener` in return     | —                                 |
| Verify    | Repeat 10× — delta ≈ 0                  | Fixed                             |


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

**Solution:**

Your template should include at minimum:

1. **Symptom** — e.g. "Tab memory +400 MB after 20 modal opens"
2. **Repro steps** — numbered clicks/routes/API calls
3. **Baseline metrics** — heap, listeners, DOM nodes before repro
4. **After repro metrics** — same metrics after 10× repro
5. **Snapshot delta** — top 3 constructors by Size Delta
6. **Retainer chain** — e.g. `Window → scroll → Feed.useEffect → closure`
7. **Fix** — one sentence
8. **Verification** — metrics after fix match baseline

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

**Detect:** Heap snapshot → filter `**Detached`** → walk retainers.

### 8.6 React Query / Apollo / Redux


| Library     | Leak pattern               | Fix                                       |
| ----------- | -------------------------- | ----------------------------------------- |
| React Query | Infinite inactive queries  | `gcTime`, `queryClient.clear()` on logout |
| Apollo      | Unbounded normalized cache | `cache.evict()`, `cache.gc()`             |
| Redux       | Entity map grows forever   | Eviction middleware, pagination           |


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


| Approach                         | Pros                              | Cons                   |
| -------------------------------- | --------------------------------- | ---------------------- |
| `useEffect` cleanup              | Standard, explicit                | Easy to forget         |
| Custom hook (`useEventListener`) | Reusable, tested once             | Abstraction overhead   |
| Event delegation                 | One listener for many children    | Harder to reason about |
| AbortController                  | Cancels network + avoids setState | Requires API support   |


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

1. Add a route or toggle to mount/unmount it 10 times.
2. Do NOT fix it yet — you will detect it in Exercise 9.1.

**Expected result:** Component works; each unmount leaves a scroll listener behind.

**Solution:** After 10 mount/unmount cycles, Chrome Performance monitor → **JS event listeners** should increase (~+1 per cycle) and not return to baseline. You have intentionally created the leak for Section 9 — do not fix yet.

### Your Turn — Exercise 8.2: Fix the Timer Leak

**Goal:** Practice cleanup pattern.

**Given:**

```javascript
useEffect(() => {
  const id = setInterval(() => console.log('tick'), 500);
}, []);
```

**Your task:** Add cleanup. Mount/unmount 5 times — confirm only one interval runs at a time (or zero after unmount).

**Expected result:**

- **Before fix:** Console logs `tick` forever after unmount; multiple intervals stack if you mount 5× (5× log rate).
- **After fix:** Logs stop within ~500 ms of unmount; at most **one** `tick` per 500 ms while mounted, **zero** after unmount.

**✓ You got it right if:** Unmounting silences the console completely.

**Solution:**

```javascript
useEffect(() => {
  const id = setInterval(() => console.log('tick'), 500);
  return () => clearInterval(id);
}, []);
```

Mount → `tick` every 500ms. Unmount → console silent within one interval.

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


| Metric             | Leak signal                   |
| ------------------ | ----------------------------- |
| JS heap            | Floor rises each cycle        |
| DOM Nodes          | Never drops after close modal |
| JS event listeners | Stair-step on route change    |


### 9.4 Heap Snapshot workflow

```
Step 1: DevTools → Memory → Heap snapshot → Take snapshot (T0)
Step 2: Click trash icon (Collect garbage)
Step 3: Perform repro (mount/unmount LeakyScroll 10×)
Step 4: Collect garbage again
Step 5: Take snapshot (T1)
Step 6: Select T1 → Summary dropdown → "Comparison" vs T0
Step 7: Sort by "Size Delta"
Step 8: Click suspect → Retainers tab → walk to root
```

### Reading comparison columns


| Column         | Meaning                           |
| -------------- | --------------------------------- |
| **# New**      | Objects created since T0          |
| **# Deleted**  | Objects collected                 |
| **# Delta**    | Net growth — hunt large positives |
| **Size Delta** | Bytes retained                    |


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


| Mistake               | Why it fails                        |
| --------------------- | ----------------------------------- |
| Single snapshot only  | Cannot see delta                    |
| No forced GC          | Noise from almost-dead objects      |
| Debugger paused       | DevTools itself retains objects     |
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

**Expected result (after fix):**


| Metric                          | Before fix (10 mount/unmount) | After fix (correct)        |
| ------------------------------- | ----------------------------- | -------------------------- |
| JS event listeners              | +10 (or +1 per cycle)         | Returns to baseline (±0–1) |
| Snapshot `(closure)` Size Delta | Large positive (MB-scale)     | Near 0 after forced GC     |
| Retainer chain to `Window`      | Present for scroll handler    | Gone                       |


**✓ You got it right if:** Listener count flat and snapshot comparison delta ≈ 0.

**Solution (LeakyScroll fix):**

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

**Solution (DevTools verification table):**

| Check | Leaky (before fix) | Fixed (correct) |
|-------|-------------------|-----------------|
| JS event listeners | +1 per mount/unmount cycle | Flat after cycles |
| Snapshot `(closure)` Size Delta | Large positive | ≈ 0 |
| Snapshot `# Listener` Delta | Positive | ≈ 0 |
| Retainers panel | Path to `Window` / scroll | No scroll listener retaining component |

### Your Turn — Exercise 9.2: Allocation Timeline

**Goal:** See allocations live.

**Steps:**

1. Memory → **Allocation instrumentation on timeline** → Start.
2. Mount `LeakyScroll` once → unmount once.
3. Stop recording.
4. Look for blue bars that **stay blue** after unmount (not freed).

**Expected result:** Persistent blue blocks = leaked allocations. After fix, bars turn gray (freed).

**Solution:** Before fix — blue allocation bars remain after unmount (closure + `bigData` still live). After adding `removeEventListener` cleanup — bars turn gray within seconds of unmount, meaning memory was freed.

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


| Category     | Detect              | Fix                        |
| ------------ | ------------------- | -------------------------- |
| Global       | heapdump → `global` | Bound or remove            |
| Cache        | `Map.size` metric   | LRU + TTL                  |
| EventEmitter | `listenerCount()`   | Return unsubscribe         |
| Streams      | `external`, lsof    | `pipeline`, `destroy`      |
| Timers       | active handles      | `clearInterval` on SIGTERM |


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

**Expected result (challenge):**


| Run      | `listenerCount('tick')` after 15 subscribes |
| -------- | ------------------------------------------- |
| Leaky    | `15` (+ `MaxListenersExceededWarning`)      |
| Your fix | `0` after calling all unsubscribe functions |


**✓ You got it right if:** After cleanup, `bus.listenerCount('tick')` is `0`.

**Solution:**

```javascript
import { EventEmitter } from 'events';

const bus = new EventEmitter();

function subscribe(userId, handler) {
  bus.on('tick', handler);
  return () => bus.off('tick', handler);
}

const unsubscribers = [];
for (let i = 0; i < 15; i++) {
  unsubscribers.push(subscribe(i, () => void i));
}

unsubscribers.forEach((off) => off());
console.log('After cleanup:', bus.listenerCount('tick')); // 0
```

Or compare with `labs/04-event-emitter-FIXED.mjs`.

### Your Turn — Exercise 10.2: Monitor RSS Under Load

**Steps:**

1. Start leaky cache server (Exercise 6.2).
2. Run load:

```bash
# if autocannon installed: npx autocannon -c 5 -d 20 http://localhost:3456/
# otherwise:
for i in $(seq 1 5000); do curl -s http://localhost:3456/ > /dev/null; done
```

1. Record `cache.size` and `rss` every 30 seconds.

**Expected result:** Linear growth of both — classic unbounded cache leak signature.

**Solution:** Server logs should show `cache.size` climbing toward 5000 and `rss` rising every 30s (e.g. 45MB → 80MB → 120MB). This confirms unbounded retention — not normal cache plateau behavior.

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


| Field                          | Leak signal            |
| ------------------------------ | ---------------------- |
| `rss`                          | Stair-step over hours  |
| `heapUsed`                     | Grows without plateau  |
| `external`                     | Buffer/stream leak     |
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


| Tool                  | Use                                |
| --------------------- | ---------------------------------- |
| `clinic doctor`       | Event loop delay, GC, CPU overview |
| `clinic heapprofiler` | Allocation stacks                  |
| `clinic bubbleprof`   | Async delay paths                  |


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

1. `chrome://inspect` → open DevTools for Node.
2. Snapshot before load → run 1000 curls → snapshot after.
3. Compare — find `Map` or `(array)` growth.

**Expected result:** Positive delta on `(array)` entries tied to cache values.

**Solution:** In snapshot comparison, sort by **Size Delta** — you should see `(array)` and `(string)` with large positive deltas. Retainers chain: `global` or `Map` → cache entry → `(array)` payload. Matches the leaky server's `new Array(5_000).fill(req.url)` per request.

### Your Turn — Exercise 11.2: Build a Memory Dashboard Script

**Goal:** Create `javascript/memory-leak/labs/06-memory-dashboard.mjs` that logs all `process.memoryUsage()` fields every 5 seconds with timestamps. Run it alongside the leaky server.

**Expected result:** A line every 5 seconds with `rss`, `heapUsed`, `heapTotal`, `external`, `arrayBuffers`. Values should update live; under load on the leaky server, `rss` trends upward.

**✓ You got it right if:** Output looks like:

```
2026-06-13T10:00:00.000Z | rss=45.2MB | heapUsed=4.1MB | heapTotal=6.5MB | external=1.2MB | arrayBuffers=0.0MB
```

**Solution:**

```javascript
setInterval(() => {
  const m = process.memoryUsage();
  console.log(
    [
      new Date().toISOString(),
      `rss=${(m.rss / 1e6).toFixed(1)}MB`,
      `heapUsed=${(m.heapUsed / 1e6).toFixed(1)}MB`,
      `heapTotal=${(m.heapTotal / 1e6).toFixed(1)}MB`,
      `external=${(m.external / 1e6).toFixed(1)}MB`,
      `arrayBuffers=${(m.arrayBuffers / 1e6).toFixed(1)}MB`,
    ].join(' | ')
  );
}, 5000);
```

Pre-built file: `labs/06-memory-dashboard.mjs`.

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


| Do                       | Don't                         |
| ------------------------ | ----------------------------- |
| Reproduce in staging     | Attach inspector to prod      |
| Sample heapdump off-peak | Snapshot during peak traffic  |
| Redact PII from dumps    | Commit `.heapsnapshot` to git |
| Canary after fix         | Restart pods forever          |


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

**Solution:** Console prints `Strong map size: 1`. The Map still holds the key object internally even after `obj = null`, so the entry survives. WeakMap has no enumerable size — its entry is gone after `gc()` because nothing else references the key. Use WeakMap when metadata should die with the DOM element/key object.

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


| You found…                | Fix                              |
| ------------------------- | -------------------------------- |
| `# Listener` delta        | `removeEventListener` in cleanup |
| `Detached HTMLDivElement` | Remove JS ref / Map entry        |
| `(closure)` on Window     | Find listener/timer/socket       |
| `Map` growth in Node      | LRU + TTL + delete on logout     |
| `external` growth         | Streams, Buffers — use pipeline  |
| Fetch after unmount       | AbortController                  |
| React Query count         | Lower `gcTime`, clear on logout  |


### By experience level


| Level               | Start with                          | Escalate to         |
| ------------------- | ----------------------------------- | ------------------- |
| First leak          | Performance monitor + cleanup audit | Snapshot comparison |
| Recurring leak      | memlab / CI heap budget             | Allocation timeline |
| Production incident | RSS metrics + staging repro         | heapdump + clinic   |


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

**Expected answer:** A leaks (no cleanup). B and C are correct.

**Solution:**

- **A — LEAKS:** `keydown` listener added with no cleanup — `document` retains `fn` after unmount.
- **B — OK:** `cache.delete(id)` on unmount/id change removes the retaining edge.
- **C — OK:** `clearTimeout(t)` in cleanup cancels the timer and releases the closure.


## Quick Reference — Lab Files


| File                             | Command                                                           | What you learn         |
| -------------------------------- | ----------------------------------------------------------------- | ---------------------- |
| `01-reachability.mjs`            | `node javascript/memory-leak/labs/01-reachability.mjs`            | References prevent GC  |
| `02-global-array-leak.mjs`       | `node javascript/memory-leak/labs/02-global-array-leak.mjs`       | Unbounded global array |
| `02-global-array-leak-FIXED.mjs` | `node javascript/memory-leak/labs/02-global-array-leak-FIXED.mjs` | Bounded ring buffer    |
| `03-leaky-cache-server.mjs`      | `node javascript/memory-leak/labs/03-leaky-cache-server.mjs`      | Map cache under load   |
| `04-event-emitter-leak.mjs`      | `node javascript/memory-leak/labs/04-event-emitter-leak.mjs`      | Listener accumulation  |
| `04-event-emitter-FIXED.mjs`     | `node javascript/memory-leak/labs/04-event-emitter-FIXED.mjs`     | Unsubscribe pattern    |
| `05-cycle-demo.mjs`              | `node --expose-gc javascript/memory-leak/labs/05-cycle-demo.mjs`  | Cycles vs global roots |
| `06-memory-dashboard.mjs`        | `node javascript/memory-leak/labs/06-memory-dashboard.mjs`        | Live memory metrics    |
| `07-generational-gc-demo.mjs`    | `node --expose-gc javascript/memory-leak/labs/07-generational-gc-demo.mjs` | Young temps vs survivors |
| `08-critical-rule-demo.mjs`      | `node --expose-gc javascript/memory-leak/labs/08-critical-rule-demo.mjs`   | Reachable vs unreachable |


---

## Final Challenge — End-to-End

When you have completed all sections, try this end-to-end challenge first, then check **Solution** below.

1. Create a React component that leaks a `setInterval` **and** a `fetch` on mount.
2. Detect both using Performance monitor + heap snapshot.
3. Fix both with cleanup + AbortController.
4. Create a Node script with an unbounded `Map` cache.
5. Detect with `process.memoryUsage()` under curl load.
6. Fix with max size 50.
7. Verify memory plateaus in both browser and Node.

**✓ You got it right if:** Browser listeners/heap delta stay flat after mount/unmount cycles **and** Node `cache.size` ≤ 50 with stable RSS under load.

**Solution:**

**Browser (React) — verify:**

| Check | Before fix | After fix |
|-------|-----------|-----------|
| JS event listeners | Climbs each mount | Flat |
| Pending fetch after navigate | Network completes + state update warning | Request aborted (`AbortError`) |
| Snapshot Size Delta | Positive `(closure)` | ≈ 0 |

**Node (Map cache) — verify:**

| Check | Before fix | After fix |
|-------|-----------|-----------|
| `cache.size` after 5000 requests | 5000 | ≤ 50 |
| `rss` under steady curl load | Linear climb | Plateaus |

**Minimal React fix:**

```javascript
useEffect(() => {
  const controller = new AbortController();
  const id = setInterval(() => {}, 1000);
  fetch(url, { signal: controller.signal }).then(setData);
  return () => {
    clearInterval(id);
    controller.abort();
  };
}, []);
```

**Minimal Node fix:**

```javascript
const MAX = 50;
const cache = new Map();
// on set: if cache.size >= MAX, delete oldest key first
```

If you can complete the Final Challenge, you have practical leak detection skills — not just theory.

---

*Companion performance topics: `[11-Frontend-Performance-Engineering-Complete-Guide.md](../11-Frontend-Performance-Engineering-Complete-Guide.md)` Sections 7–9.*