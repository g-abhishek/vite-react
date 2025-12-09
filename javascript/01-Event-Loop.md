# The Event Loop: A Deep Dive

## Table of Contents

1. [Introduction](#introduction)
2. [Why JavaScript Needs an Event Loop](#why-javascript-needs-an-event-loop)
3. [Core Components](#core-components)
4. [Browser Event Loop](#browser-event-loop)
5. [Node.js Event Loop](#nodejs-event-loop)
6. [Key Differences](#key-differences-browser-vs-nodejs)
7. [Practical Examples](#practical-examples)
8. [Common Pitfalls](#common-pitfalls)
9. [Interview Questions](#interview-questions)

---

## Introduction

The **Event Loop** is the heart of JavaScript's concurrency model. It's the mechanism that allows JavaScript to perform non-blocking, asynchronous operations despite being **single-threaded**.

### The Big Picture

```
┌─────────────────────────────────────────────────────────────────────┐
│                     JavaScript Runtime                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   ┌──────────────┐          ┌────────────────────────────────────┐  │
│   │  Call Stack  │          │          Async Environment          │  │
│   │              │          │  (Web APIs / libuv / Thread Pool)   │  │
│   │  ┌────────┐  │          └────────────────────────────────────┘  │
│   │  │ func() │  │                         │                        │
│   │  ├────────┤  │                         ▼                        │
│   │  │ main() │  │          ┌────────────────────────────────────┐  │
│   │  └────────┘  │          │        Callback Queues             │  │
│   └──────────────┘          │  ┌────────────┐  ┌──────────────┐  │  │
│          ▲                  │  │ Microtasks │  │  Macrotasks  │  │  │
│          │                  │  └────────────┘  └──────────────┘  │  │
│          │                  └────────────────────────────────────┘  │
│          │                               │                          │
│          │         ┌─────────────────────┘                          │
│          │         │                                                │
│          │         ▼                                                │
│   ┌──────┴─────────────────────────────────────────────────────┐   │
│   │                       EVENT LOOP                            │   │
│   │   "Is the call stack empty? → Process next callback"        │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Why JavaScript Needs an Event Loop

### The Problem: Single-Threaded Language

JavaScript runs on a **single thread**, meaning it can only execute one piece of code at a time. Without special handling, any long-running operation would **block** everything else:

```javascript
// Without async handling, this would freeze the browser
const data = fetchFromServer();  // Blocks for 2 seconds
console.log(data);               // Can't run until fetch completes
updateUI();                      // UI is frozen!
```

### The Solution: Non-Blocking I/O + Event Loop

Instead of waiting, JavaScript **delegates** long-running tasks and continues execution:

```javascript
// With the event loop, execution continues immediately
fetchFromServer((data) => {
  console.log(data);  // Runs later when data arrives
});
updateUI();           // Runs immediately - UI stays responsive!
```

---

## Core Components

### 1. Call Stack

The **call stack** is a LIFO (Last In, First Out) data structure that tracks function execution.

```javascript
function multiply(a, b) {
  return a * b;
}

function square(n) {
  return multiply(n, n);
}

function printSquare(n) {
  const result = square(n);
  console.log(result);
}

printSquare(4);
```

**Stack Visualization:**

```
Step 1: printSquare(4)         Step 2: square(4)           Step 3: multiply(4, 4)
┌─────────────────┐            ┌─────────────────┐         ┌─────────────────┐
│                 │            │                 │         │  multiply(4,4)  │
│                 │            │    square(4)    │         │    square(4)    │
│  printSquare(4) │            │  printSquare(4) │         │  printSquare(4) │
└─────────────────┘            └─────────────────┘         └─────────────────┘

Step 4: Return 16              Step 5: Return 16           Step 6: console.log(16)
┌─────────────────┐            ┌─────────────────┐         ┌─────────────────┐
│                 │            │                 │         │ console.log(16) │
│    square(4)    │            │                 │         │                 │
│  printSquare(4) │            │  printSquare(4) │         │  printSquare(4) │
└─────────────────┘            └─────────────────┘         └─────────────────┘
```

### 2. Heap

The **heap** is an unstructured region of memory where objects are allocated.

```javascript
const user = { name: 'John' };  // Stored in heap
const numbers = [1, 2, 3, 4];   // Stored in heap
```

### 3. Web APIs (Browser) / C++ APIs (Node.js)

These are **not part of JavaScript itself** but are provided by the runtime environment:

**Browser Web APIs:**
- `setTimeout`, `setInterval`
- `fetch`, `XMLHttpRequest`
- DOM events (`addEventListener`)
- `requestAnimationFrame`

**Node.js APIs (via libuv):**
- File system operations (`fs`)
- Network operations (`http`, `net`)
- `setTimeout`, `setInterval`, `setImmediate`
- `process.nextTick`

### 4. Callback Queues

#### Microtask Queue (High Priority)
- `Promise.then()`, `Promise.catch()`, `Promise.finally()`
- `queueMicrotask()`
- `MutationObserver` (browser)
- `process.nextTick()` (Node.js - even higher priority!)

#### Macrotask Queue (Lower Priority)
- `setTimeout()`, `setInterval()`
- `setImmediate()` (Node.js)
- I/O operations
- UI rendering events (browser)

---

## Browser Event Loop

### Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                          BROWSER                                    │
├────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   ┌─────────────────┐              ┌─────────────────────────────┐ │
│   │   Call Stack    │              │         Web APIs            │ │
│   │                 │              │                             │ │
│   │  ┌───────────┐  │   Async      │  • setTimeout/setInterval   │ │
│   │  │ function  │  │─────────────▶│  • fetch / XMLHttpRequest   │ │
│   │  └───────────┘  │   Delegate   │  • DOM event listeners      │ │
│   │                 │              │  • requestAnimationFrame    │ │
│   └─────────────────┘              └─────────────┬───────────────┘ │
│           ▲                                      │                  │
│           │                                      │ Callback         │
│           │                                      │ Ready            │
│           │                                      ▼                  │
│   ┌───────┴────────────────────────────────────────────────────┐   │
│   │                        EVENT LOOP                           │   │
│   │                                                             │   │
│   │   1. Is call stack empty?                                   │   │
│   │   2. Process ALL microtasks                                 │   │
│   │   3. Render (if needed)                                     │   │
│   │   4. Process ONE macrotask                                  │   │
│   │   5. Repeat                                                 │   │
│   └───────┬────────────────────────────────────────────────────┘   │
│           │                                                         │
│   ┌───────▼─────────────────────────────────────────────────────┐  │
│   │                      CALLBACK QUEUES                         │  │
│   │                                                              │  │
│   │  ┌─────────────────────────┐  ┌─────────────────────────┐   │  │
│   │  │    Microtask Queue      │  │    Macrotask Queue      │   │  │
│   │  │    (High Priority)      │  │    (Lower Priority)     │   │  │
│   │  │                         │  │                         │   │  │
│   │  │  • Promise callbacks    │  │  • setTimeout           │   │  │
│   │  │  • queueMicrotask       │  │  • setInterval          │   │  │
│   │  │  • MutationObserver     │  │  • I/O callbacks        │   │  │
│   │  │                         │  │  • UI events            │   │  │
│   │  └─────────────────────────┘  └─────────────────────────┘   │  │
│   └──────────────────────────────────────────────────────────────┘ │
│                                                                     │
└────────────────────────────────────────────────────────────────────┘
```

### Execution Order

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Browser Event Loop Cycle                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   ┌──────────────────────────────────────────────────────────────┐  │
│   │ STEP 1: Execute synchronous code until call stack is empty   │  │
│   └──────────────────────────────────────────────────────────────┘  │
│                              │                                       │
│                              ▼                                       │
│   ┌──────────────────────────────────────────────────────────────┐  │
│   │ STEP 2: Process ALL microtasks (drain the microtask queue)   │  │
│   │         • Including microtasks created during this step!     │  │
│   └──────────────────────────────────────────────────────────────┘  │
│                              │                                       │
│                              ▼                                       │
│   ┌──────────────────────────────────────────────────────────────┐  │
│   │ STEP 3: Render (if ~16ms passed since last render)           │  │
│   │         • Style calculations                                 │  │
│   │         • Layout                                             │  │
│   │         • Paint                                              │  │
│   └──────────────────────────────────────────────────────────────┘  │
│                              │                                       │
│                              ▼                                       │
│   ┌──────────────────────────────────────────────────────────────┐  │
│   │ STEP 4: Process ONE macrotask from the queue                 │  │
│   └──────────────────────────────────────────────────────────────┘  │
│                              │                                       │
│                              ▼                                       │
│                       [Go back to STEP 2]                            │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Example 1: Basic Browser Event Loop

```javascript
console.log('1: Script start');

setTimeout(() => {
  console.log('2: setTimeout callback');
}, 0);

Promise.resolve()
  .then(() => console.log('3: Promise 1'))
  .then(() => console.log('4: Promise 2'));

console.log('5: Script end');
```

**Output:**
```
1: Script start
5: Script end
3: Promise 1
4: Promise 2
2: setTimeout callback
```

**Step-by-Step Explanation:**

| Step | Action | Call Stack | Microtask Queue | Macrotask Queue |
|------|--------|------------|-----------------|-----------------|
| 1 | Execute `console.log('1')` | `console.log` | - | - |
| 2 | `setTimeout` → delegate to Web API | - | - | - |
| 3 | Web API timer completes | - | - | `setTimeout cb` |
| 4 | `Promise.resolve().then()` | - | `Promise 1` | `setTimeout cb` |
| 5 | Execute `console.log('5')` | `console.log` | `Promise 1` | `setTimeout cb` |
| 6 | Stack empty → process microtasks | `Promise 1 cb` | `Promise 2` | `setTimeout cb` |
| 7 | Process microtask | `Promise 2 cb` | - | `setTimeout cb` |
| 8 | Microtasks empty → process macrotask | `setTimeout cb` | - | - |

### Example 2: Microtasks Creating More Microtasks

```javascript
console.log('Start');

Promise.resolve().then(() => {
  console.log('Promise 1');
  Promise.resolve().then(() => {
    console.log('Promise 1-1');
  });
});

Promise.resolve().then(() => {
  console.log('Promise 2');
});

setTimeout(() => {
  console.log('setTimeout');
}, 0);

console.log('End');
```

**Output:**
```
Start
End
Promise 1
Promise 2
Promise 1-1
setTimeout
```

**Explanation:**
- Sync code runs first: `Start`, `End`
- Microtask queue processes: `Promise 1`, `Promise 2`
- During `Promise 1`, a new microtask (`Promise 1-1`) is added
- New microtask runs before any macrotask: `Promise 1-1`
- Finally, macrotask runs: `setTimeout`

**Key Insight:** Microtasks created during microtask processing are executed in the same cycle!

---

## Node.js Event Loop

Node.js has a more complex event loop powered by **libuv**, with 6 distinct phases.

### Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           NODE.JS RUNTIME                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   ┌─────────────────┐                    ┌────────────────────────────┐ │
│   │   V8 Engine     │                    │         libuv              │ │
│   │                 │                    │                            │ │
│   │  ┌───────────┐  │    Async Tasks     │  • Thread Pool (4 threads) │ │
│   │  │Call Stack │  │───────────────────▶│  • OS async interfaces     │ │
│   │  └───────────┘  │                    │  • File system ops         │ │
│   │                 │                    │  • DNS lookups             │ │
│   │  ┌───────────┐  │                    │  • Network I/O             │ │
│   │  │   Heap    │  │                    │                            │ │
│   │  └───────────┘  │                    └─────────────┬──────────────┘ │
│   └─────────────────┘                                  │                 │
│           ▲                                            │                 │
│           │                          Callbacks Ready   │                 │
│           │                                            ▼                 │
│   ┌───────┴──────────────────────────────────────────────────────────┐  │
│   │                         EVENT LOOP                                │  │
│   │                     (6 Phases + 2 Special Queues)                 │  │
│   └───────┬──────────────────────────────────────────────────────────┘  │
│           │                                                              │
│           ▼                                                              │
│   ┌──────────────────────────────────────────────────────────────────┐  │
│   │                          THE 6 PHASES                             │  │
│   │                                                                   │  │
│   │   ┌─────────────────────────────────────────────────────────┐    │  │
│   │   │  1. TIMERS: setTimeout, setInterval callbacks           │    │  │
│   │   └─────────────────────────────────────────────────────────┘    │  │
│   │                              │                                    │  │
│   │              [nextTick + microtasks]                              │  │
│   │                              ▼                                    │  │
│   │   ┌─────────────────────────────────────────────────────────┐    │  │
│   │   │  2. PENDING CALLBACKS: Deferred I/O callbacks           │    │  │
│   │   └─────────────────────────────────────────────────────────┘    │  │
│   │                              │                                    │  │
│   │              [nextTick + microtasks]                              │  │
│   │                              ▼                                    │  │
│   │   ┌─────────────────────────────────────────────────────────┐    │  │
│   │   │  3. IDLE, PREPARE: Internal use only                    │    │  │
│   │   └─────────────────────────────────────────────────────────┘    │  │
│   │                              │                                    │  │
│   │              [nextTick + microtasks]                              │  │
│   │                              ▼                                    │  │
│   │   ┌─────────────────────────────────────────────────────────┐    │  │
│   │   │  4. POLL: Retrieve new I/O events, execute I/O callbacks│    │  │
│   │   │         (Node may block here if nothing else to do)     │    │  │
│   │   └─────────────────────────────────────────────────────────┘    │  │
│   │                              │                                    │  │
│   │              [nextTick + microtasks]                              │  │
│   │                              ▼                                    │  │
│   │   ┌─────────────────────────────────────────────────────────┐    │  │
│   │   │  5. CHECK: setImmediate callbacks                       │    │  │
│   │   └─────────────────────────────────────────────────────────┘    │  │
│   │                              │                                    │  │
│   │              [nextTick + microtasks]                              │  │
│   │                              ▼                                    │  │
│   │   ┌─────────────────────────────────────────────────────────┐    │  │
│   │   │  6. CLOSE CALLBACKS: socket.on('close'), etc.           │    │  │
│   │   └─────────────────────────────────────────────────────────┘    │  │
│   │                              │                                    │  │
│   │                     [Loop back to Phase 1]                        │  │
│   │                                                                   │  │
│   └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Phase Details

#### Phase 1: Timers
Executes callbacks scheduled by `setTimeout()` and `setInterval()`.

```javascript
// Timer callbacks execute when their threshold has been reached
setTimeout(() => {
  console.log('Timer 1 - 100ms');
}, 100);

setTimeout(() => {
  console.log('Timer 2 - 50ms');
}, 50);

// Output order: Timer 2, Timer 1 (based on delay, not registration order)
```

**Important:** Timer thresholds are minimum delays, not guaranteed exact times!

#### Phase 2: Pending Callbacks
Executes I/O callbacks deferred to the next loop iteration (system-level callbacks).

```javascript
// Example: TCP errors, some system operations
// These are handled internally by Node.js
```

#### Phase 3: Idle, Prepare
Internal use only. Not directly accessible to developers.

#### Phase 4: Poll
The most important phase! Does two main things:

1. **Calculates how long to block and poll for I/O**
2. **Processes events in the poll queue**

```javascript
const fs = require('fs');

// This callback will be executed in the poll phase
fs.readFile('file.txt', (err, data) => {
  console.log('File read complete');
});
```

**Poll Phase Behavior:**
- If poll queue is NOT empty: iterate through callbacks synchronously
- If poll queue IS empty:
  - If `setImmediate()` is scheduled → move to check phase
  - If timers are scheduled → wrap back to timers phase
  - Otherwise → wait for callbacks to be added

#### Phase 5: Check
Executes `setImmediate()` callbacks.

```javascript
setImmediate(() => {
  console.log('setImmediate callback');
});
```

**Why `setImmediate` exists:**
- Allows executing code immediately after the poll phase completes
- Useful for breaking up long-running operations

#### Phase 6: Close Callbacks
Executes close event callbacks.

```javascript
const net = require('net');
const server = net.createServer();

server.on('close', () => {
  console.log('Server closed');  // Runs in close callbacks phase
});

server.close();
```

### Special Queues: nextTick and Microtasks

These run **between every phase** (and after every phase transition).

```
                    ┌───────────────────────────────────┐
                    │     BETWEEN-PHASE PROCESSING      │
                    │                                   │
                    │  1. Drain process.nextTick queue  │
                    │  2. Drain microtask queue         │
                    │                                   │
                    └───────────────────────────────────┘
                                    │
    ┌───────────────────────────────┼───────────────────────────────┐
    │                               │                               │
    ▼                               ▼                               ▼
┌────────┐                     ┌────────┐                     ┌────────┐
│ Phase  │ ───[between]─────▶  │ Phase  │ ───[between]─────▶  │ Phase  │
│   1    │                     │   2    │                     │   3    │
└────────┘                     └────────┘                     └────────┘
```

### Example 3: Node.js Event Loop Phases

```javascript
const fs = require('fs');

console.log('1: Script start');

// Timers phase
setTimeout(() => {
  console.log('2: setTimeout');
}, 0);

// Check phase
setImmediate(() => {
  console.log('3: setImmediate');
});

// Microtasks (runs between phases)
Promise.resolve().then(() => {
  console.log('4: Promise');
});

// nextTick (highest priority, runs before microtasks)
process.nextTick(() => {
  console.log('5: nextTick');
});

console.log('6: Script end');
```

**Output:**
```
1: Script start
6: Script end
5: nextTick
4: Promise
2: setTimeout
3: setImmediate
```

**Explanation:**
1. Sync code: `1: Script start`, `6: Script end`
2. Before entering event loop phases, process special queues:
   - `nextTick` queue: `5: nextTick`
   - Microtask queue: `4: Promise`
3. Timers phase: `2: setTimeout`
4. Check phase: `3: setImmediate`

### Example 4: setTimeout vs setImmediate - The Tricky Case

#### Case A: In Main Module (Non-deterministic!)

```javascript
// main.js - Order is NOT guaranteed!
setTimeout(() => console.log('setTimeout'), 0);
setImmediate(() => console.log('setImmediate'));

// Run multiple times - you'll see different orders!
// Sometimes: setTimeout, setImmediate
// Sometimes: setImmediate, setTimeout
```

**Why non-deterministic?**
- `setTimeout(fn, 0)` actually schedules with a minimum 1ms delay
- Depending on system load, the timer may or may not be ready when timers phase runs
- If ready → setTimeout runs first
- If not ready → poll phase → check phase → setImmediate runs first

#### Case B: Inside I/O Callback (Always Deterministic!)

```javascript
const fs = require('fs');

fs.readFile(__filename, () => {
  setTimeout(() => console.log('setTimeout'), 0);
  setImmediate(() => console.log('setImmediate'));
});

// Always outputs:
// setImmediate
// setTimeout
```

**Why always setImmediate first?**
```
I/O callback executes in POLL phase
    │
    ├──▶ setTimeout scheduled → goes to TIMERS queue (Phase 1)
    │
    ├──▶ setImmediate scheduled → goes to CHECK queue (Phase 5)
    │
    ▼
After POLL phase completes
    │
    ▼
CHECK phase runs next (Phase 5) → setImmediate executes
    │
    ▼
Loop continues... eventually reaches TIMERS (Phase 1) → setTimeout executes
```

### Example 5: process.nextTick vs Promise

```javascript
console.log('Start');

process.nextTick(() => {
  console.log('nextTick 1');
});

Promise.resolve().then(() => {
  console.log('Promise 1');
});

process.nextTick(() => {
  console.log('nextTick 2');
});

Promise.resolve().then(() => {
  console.log('Promise 2');
});

console.log('End');
```

**Output:**
```
Start
End
nextTick 1
nextTick 2
Promise 1
Promise 2
```

**Key Insight:** `process.nextTick` queue is processed BEFORE the microtask queue!

**Priority Order in Node.js:**
```
1. process.nextTick()     ← Highest priority
2. Microtasks (Promises)  ← High priority  
3. Macrotasks (timers, I/O, setImmediate)  ← Lower priority
```

### Example 6: Nested nextTick and Promises

```javascript
console.log('Start');

process.nextTick(() => {
  console.log('nextTick 1');
  process.nextTick(() => {
    console.log('nextTick 1-nested');
  });
});

Promise.resolve().then(() => {
  console.log('Promise 1');
  process.nextTick(() => {
    console.log('Promise 1-nextTick');
  });
});

setImmediate(() => {
  console.log('setImmediate');
});

console.log('End');
```

**Output:**
```
Start
End
nextTick 1
nextTick 1-nested
Promise 1
Promise 1-nextTick
setImmediate
```

**Explanation:**
1. Sync: `Start`, `End`
2. nextTick queue drains completely (including nested): `nextTick 1`, `nextTick 1-nested`
3. Microtask queue processes: `Promise 1`
4. New nextTick added during Promise → processes immediately: `Promise 1-nextTick`
5. Finally check phase: `setImmediate`

---

## Key Differences: Browser vs Node.js

### Comparison Table

| Feature | Browser | Node.js |
|---------|---------|---------|
| **Engine** | V8/SpiderMonkey/JavaScriptCore | V8 |
| **Async Handler** | Web APIs | libuv + Thread Pool |
| **Event Loop** | Simple (microtasks + macrotasks) | Complex (6 phases) |
| **`process.nextTick`** | ❌ Not available | ✅ Highest priority |
| **`setImmediate`** | ❌ Not available | ✅ Check phase |
| **`queueMicrotask`** | ✅ Available | ✅ Available |
| **Rendering** | Part of event loop cycle | N/A (server-side) |
| **I/O Callbacks** | Via Web APIs | Via libuv poll phase |

### Visual Comparison

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           BROWSER EVENT LOOP                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   ┌──────────────┐     ┌──────────────┐     ┌──────────────┐            │
│   │  Microtasks  │────▶│    Render    │────▶│  Macrotask   │───┐        │
│   │  (all)       │     │  (if needed) │     │  (one)       │   │        │
│   └──────────────┘     └──────────────┘     └──────────────┘   │        │
│         ▲                                                       │        │
│         └───────────────────────────────────────────────────────┘        │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                          NODE.JS EVENT LOOP                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐             │
│   │  Timers  │──▶│ Pending  │──▶│   Poll   │──▶│  Check   │──┐          │
│   └──────────┘   └──────────┘   └──────────┘   └──────────┘  │          │
│        │              │              │              │         │          │
│        ▼              ▼              ▼              ▼         │          │
│   [nextTick]     [nextTick]    [nextTick]    [nextTick]      │          │
│   [microtasks]   [microtasks]  [microtasks]  [microtasks]    │          │
│        │                                                      │          │
│        └──────────────────────────────────────────────────────┘          │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Practical Examples

### Example 7: Real-World Async Flow

```javascript
console.log('1: Starting application');

// Simulating database query
setTimeout(() => {
  console.log('2: Database query complete');
  
  // Process results with microtasks
  Promise.resolve().then(() => {
    console.log('3: Data validation done');
  }).then(() => {
    console.log('4: Data transformation done');
  });
}, 100);

// Simulating API call
setTimeout(() => {
  console.log('5: API response received');
}, 50);

// Immediate initialization tasks
Promise.resolve().then(() => {
  console.log('6: Config loaded');
}).then(() => {
  console.log('7: Services initialized');
});

console.log('8: Setup complete, waiting for async operations');
```

**Output:**
```
1: Starting application
8: Setup complete, waiting for async operations
6: Config loaded
7: Services initialized
5: API response received
2: Database query complete
3: Data validation done
4: Data transformation done
```

### Example 8: Blocking the Event Loop

```javascript
// ❌ BAD: This blocks the event loop!
function blockingOperation() {
  const start = Date.now();
  while (Date.now() - start < 3000) {
    // Blocking for 3 seconds
  }
  console.log('Blocking done');
}

setTimeout(() => console.log('Timer 1'), 0);
setTimeout(() => console.log('Timer 2'), 1000);

blockingOperation();  // Nothing else can run during this!

setTimeout(() => console.log('Timer 3'), 0);
```

**Output:**
```
(3 second delay)
Blocking done
Timer 1
Timer 2       // Both fire immediately after blocking ends
Timer 3
```

**Why this is bad:** All async operations are delayed until the blocking code completes!

### Example 9: Breaking Up Heavy Work

```javascript
// ✅ GOOD: Using setImmediate to not block
function processLargeArray(array, callback) {
  const chunkSize = 1000;
  let index = 0;
  
  function processChunk() {
    const end = Math.min(index + chunkSize, array.length);
    
    for (; index < end; index++) {
      // Process item
      array[index] = array[index] * 2;
    }
    
    if (index < array.length) {
      // Schedule next chunk, allowing other operations to run
      setImmediate(processChunk);
    } else {
      callback(array);
    }
  }
  
  processChunk();
}

const largeArray = new Array(10000).fill(1);

// Other operations won't be blocked
setTimeout(() => console.log('Timer still works!'), 0);

processLargeArray(largeArray, (result) => {
  console.log('Processing complete');
});
```

### Example 10: Promise vs Callback Ordering

```javascript
const fs = require('fs');

// Using callbacks
fs.readFile(__filename, () => {
  console.log('1: Callback - readFile');
});

// Using Promises
fs.promises.readFile(__filename).then(() => {
  console.log('2: Promise - readFile');
});

// Regular Promise
Promise.resolve().then(() => {
  console.log('3: Promise - resolve');
});

// nextTick
process.nextTick(() => {
  console.log('4: nextTick');
});

console.log('5: Sync');
```

**Output:**
```
5: Sync
4: nextTick
3: Promise - resolve
1: Callback - readFile  (or 2 first, depending on file system speed)
2: Promise - readFile
```

---

## Common Pitfalls

### Pitfall 1: Starving the Event Loop with nextTick

```javascript
// ❌ DANGER: This will starve the event loop!
function recursiveNextTick() {
  process.nextTick(() => {
    console.log('nextTick');
    recursiveNextTick();  // Infinite nextTick recursion
  });
}

setTimeout(() => console.log('This will NEVER run!'), 0);
setImmediate(() => console.log('This will NEVER run either!'));

recursiveNextTick();
```

**Why it starves:** `nextTick` queue must completely drain before moving to any phase. Infinite recursion = infinite queue!

**✅ Fix: Use setImmediate for recursion**

```javascript
function recursiveImmediate() {
  setImmediate(() => {
    console.log('setImmediate');
    recursiveImmediate();
  });
}

setTimeout(() => console.log('This WILL run!'), 100);
recursiveImmediate();
```

### Pitfall 2: Assuming setTimeout is Accurate

```javascript
// setTimeout is NOT precise!
const start = Date.now();

setTimeout(() => {
  const elapsed = Date.now() - start;
  console.log(`Actual delay: ${elapsed}ms`);  // Often > 0ms, could be 1-4ms!
}, 0);
```

### Pitfall 3: Microtask Recursion

```javascript
// ❌ This will also block!
function recursivePromise() {
  Promise.resolve().then(() => {
    recursivePromise();
  });
}

setTimeout(() => console.log('Blocked!'), 0);
recursivePromise();
```

### Pitfall 4: Order Assumptions with I/O

```javascript
const fs = require('fs');

// Don't assume order between different I/O operations!
fs.readFile('file1.txt', () => console.log('File 1'));
fs.readFile('file2.txt', () => console.log('File 2'));

// Order is NOT guaranteed - depends on file system
```

---

## Interview Questions

### Q1: What's the output?

```javascript
console.log('1');
setTimeout(() => console.log('2'), 0);
Promise.resolve().then(() => console.log('3'));
console.log('4');
```

<details>
<summary>Answer</summary>

```
1
4
3
2
```

**Explanation:**
1. `1` - Sync
2. `setTimeout` scheduled to macrotask queue
3. `Promise.then` scheduled to microtask queue
4. `4` - Sync
5. `3` - Microtask (runs before macrotasks)
6. `2` - Macrotask

</details>

### Q2: What's the output? (Node.js)

```javascript
setImmediate(() => console.log('1'));
setTimeout(() => console.log('2'), 0);
process.nextTick(() => console.log('3'));
Promise.resolve().then(() => console.log('4'));
```

<details>
<summary>Answer</summary>

```
3
4
2 (or 1, non-deterministic in main module)
1 (or 2)
```

**Explanation:**
1. `3` - nextTick has highest priority
2. `4` - Promise microtask
3. `2` and `1` - Order between setTimeout and setImmediate is non-deterministic in main module

</details>

### Q3: What's the output?

```javascript
async function async1() {
  console.log('1');
  await async2();
  console.log('2');
}

async function async2() {
  console.log('3');
}

console.log('4');
async1();
console.log('5');
```

<details>
<summary>Answer</summary>

```
4
1
3
5
2
```

**Explanation:**
1. `4` - Sync
2. `async1()` called
3. `1` - Sync (before await)
4. `async2()` called, `3` printed
5. `await` pauses async1, schedules continuation as microtask
6. `5` - Sync
7. `2` - Microtask (continuation after await)

</details>

### Q4: Why does this cause issues?

```javascript
app.get('/api/data', (req, res) => {
  process.nextTick(() => {
    // Heavy computation here
    for (let i = 0; i < 1000000000; i++) {}
    res.json({ data: 'result' });
  });
});
```

<details>
<summary>Answer</summary>

**Problem:** `process.nextTick` runs before I/O operations can be processed. If many requests trigger this endpoint, the heavy computation in nextTick callbacks will delay ALL I/O operations, making the server unresponsive.

**Fix:** Use `setImmediate` instead, which allows I/O to be processed between iterations:

```javascript
app.get('/api/data', (req, res) => {
  setImmediate(() => {
    // Heavy computation
    res.json({ data: 'result' });
  });
});
```

</details>

### Q5: What is the output order and why?

```javascript
const fs = require('fs');

fs.readFile(__filename, () => {
  setTimeout(() => console.log('T1'), 0);
  setImmediate(() => console.log('I1'));
  
  process.nextTick(() => {
    console.log('N1');
    setTimeout(() => console.log('T2'), 0);
    setImmediate(() => console.log('I2'));
  });
  
  Promise.resolve().then(() => console.log('P1'));
});
```

<details>
<summary>Answer</summary>

```
N1
P1
I1
I2
T1
T2
```

**Explanation:**
1. File read callback runs in Poll phase
2. After callback, between-phase processing:
   - `N1` - nextTick (highest priority)
   - `P1` - Promise microtask
3. Check phase (setImmediate):
   - `I1` - First setImmediate
   - `I2` - Second setImmediate (added during nextTick, before check phase)
4. Next loop iteration, Timers phase:
   - `T1` - First setTimeout
   - `T2` - Second setTimeout

</details>

---

## Summary: Priority Order

### Browser
```
1. Synchronous code (Call Stack)
2. Microtasks (Promises, queueMicrotask)
3. Render (if needed)
4. Macrotasks (setTimeout, setInterval, events)
```

### Node.js
```
1. Synchronous code (Call Stack)
2. process.nextTick queue (highest async priority)
3. Microtasks (Promises)
4. Timers phase (setTimeout, setInterval)
5. Pending callbacks
6. Poll (I/O)
7. Check (setImmediate)
8. Close callbacks

Note: Steps 2-3 run between EVERY phase!
```

---

## Further Reading

- [Node.js Event Loop Documentation](https://nodejs.org/en/docs/guides/event-loop-timers-and-nexttick)
- [MDN: Event Loop](https://developer.mozilla.org/en-US/docs/Web/JavaScript/EventLoop)
- [Jake Archibald: In The Loop](https://www.youtube.com/watch?v=cCOL7MC4Pl0)
- [Philip Roberts: What the heck is the event loop anyway?](https://www.youtube.com/watch?v=8aGhZQkoFbQ)

