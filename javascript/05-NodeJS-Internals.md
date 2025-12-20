# Node.js Internals: A Deep Dive

## Table of Contents

1. [Introduction](#introduction)
2. [Node.js Architecture](#nodejs-architecture)
   - Core Components
   - Request Processing Flow (Detailed Trace)
   - Multiple Async Operations Example
3. [V8 Engine](#v8-engine)
   - Compilation Pipeline (Ignition & TurboFan)
   - Memory Structure
   - Garbage Collection
4. [libuv - The Heart of Node.js](#libuv---the-heart-of-nodejs)
   - Thread Pool vs Async I/O
   - Event Loop Phases (Detailed)
   - setTimeout vs setImmediate
   - process.nextTick vs setImmediate vs Promise
5. [Thread Pool](#thread-pool)
   - Thread Pool Saturation
   - Visualization Example
6. [Streams](#streams)
   - Stream Types
   - Backpressure
   - Custom Streams
   - Stream Modes (Flowing vs Paused)
   - Practical JSON Processing
7. [Buffers](#buffers)
   - Memory Layout
   - Buffer Pooling
8. [Module System](#module-system)
   - CommonJS vs ES Modules
   - Module Resolution
   - Module Caching
   - Circular Dependencies
   - Module Wrapper Function
9. [Cluster Module](#cluster-module)
   - IPC Communication
   - Production Example
   - Zero-Downtime Deployment
10. [Worker Threads](#worker-threads)
    - Cluster vs Worker Threads
    - SharedArrayBuffer & Atomics
    - Worker Pool Pattern
    - Data Transfer Methods
    - Image Processing Example
11. [Memory Management](#memory-management)
    - Memory Limits
    - Memory Leak Causes
    - Profiling Memory
12. [Performance Optimization](#performance-optimization)
    - Async Best Practices
    - Event Loop Best Practices
13. [Common Issues and Debugging](#common-issues-and-debugging)
    - Event Loop Blocked
    - Memory Leaks
    - Unhandled Rejections
    - Debugging Tools
14. [Interview Questions](#interview-questions)

---

## Introduction

Node.js is a **JavaScript runtime** built on Chrome's V8 engine. Understanding its internals helps you:
- Write more efficient applications
- Debug complex issues
- Make better architectural decisions
- Ace senior-level interviews

```
┌─────────────────────────────────────────────────────────────────────┐
│                    NODE.JS ARCHITECTURE                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   Your JavaScript Code                                               │
│          │                                                           │
│          ▼                                                           │
│   ┌──────────────────────────────────────────────────────────────┐  │
│   │                      NODE.JS BINDINGS                         │  │
│   │   (C++ layer bridging JavaScript and system operations)       │  │
│   └──────────────────────────────────────────────────────────────┘  │
│          │                              │                            │
│          ▼                              ▼                            │
│   ┌──────────────────┐         ┌───────────────────────────────┐   │
│   │      V8          │         │           libuv                │   │
│   │   (JavaScript    │         │   (Async I/O, Event Loop,      │   │
│   │    Engine)       │         │    Thread Pool)                │   │
│   └──────────────────┘         └───────────────────────────────┘   │
│          │                              │                            │
│          ▼                              ▼                            │
│   ┌──────────────────────────────────────────────────────────────┐  │
│   │                   OPERATING SYSTEM                            │  │
│   │   (File System, Network, DNS, Child Processes)                │  │
│   └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Node.js Architecture

### Core Components

Node.js consists of several key components:

```
┌─────────────────────────────────────────────────────────────────────┐
│                    NODE.JS CORE COMPONENTS                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   1. V8 ENGINE                                                       │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │  • Compiles JavaScript to machine code                        │ │
│   │  • Handles memory allocation (heap)                           │ │
│   │  • Garbage collection                                         │ │
│   │  • Executes JavaScript                                        │ │
│   └───────────────────────────────────────────────────────────────┘ │
│                                                                      │
│   2. LIBUV                                                          │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │  • Event loop                                                 │ │
│   │  • Async I/O operations                                       │ │
│   │  • Thread pool (4 threads by default)                         │ │
│   │  • Cross-platform abstraction                                 │ │
│   └───────────────────────────────────────────────────────────────┘ │
│                                                                      │
│   3. C++ BINDINGS                                                    │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │  • Connect V8 to libuv                                        │ │
│   │  • Expose system APIs to JavaScript                           │ │
│   │  • http, fs, crypto, zlib modules                             │ │
│   └───────────────────────────────────────────────────────────────┘ │
│                                                                      │
│   4. CORE JAVASCRIPT MODULES                                         │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │  • Built-in modules (fs, http, path, etc.)                    │ │
│   │  • Written in JavaScript                                      │ │
│   │  • Provide user-friendly APIs                                 │ │
│   └───────────────────────────────────────────────────────────────┘ │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### How a Request is Processed

```javascript
const fs = require('fs');

// When you call this:
fs.readFile('file.txt', 'utf8', (err, data) => {
  console.log(data);
});

console.log('Reading file...');
```

```
┌─────────────────────────────────────────────────────────────────────┐
│                    REQUEST PROCESSING FLOW                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   1. fs.readFile() called                                           │
│      │                                                               │
│      ▼                                                               │
│   2. JavaScript → C++ Binding (node_file.cc)                        │
│      │                                                               │
│      ▼                                                               │
│   3. C++ → libuv (uv_fs_read)                                       │
│      │                                                               │
│      ├─── Is it async I/O? ────┐                                    │
│      │                         │                                     │
│      ▼                         ▼                                     │
│   Uses Thread Pool        Uses OS async APIs                        │
│   (file operations)       (network, pipes)                          │
│      │                         │                                     │
│      └────────┬────────────────┘                                    │
│               │                                                      │
│               ▼                                                      │
│   4. Operation completes                                            │
│      │                                                               │
│      ▼                                                               │
│   5. Callback queued in event loop (Poll phase)                     │
│      │                                                               │
│      ▼                                                               │
│   6. Event loop executes callback                                   │
│      │                                                               │
│      ▼                                                               │
│   7. console.log(data) runs                                         │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Detailed Example: Tracing a File Read Operation

Let's trace exactly what happens when you read a file:

```javascript
const fs = require('fs');
const start = Date.now();

console.log('1. Script starts');

// Synchronous - blocks everything
const data1 = fs.readFileSync('./file.txt', 'utf8');
console.log('2. Sync read complete:', Date.now() - start, 'ms');

// Asynchronous - goes to thread pool
fs.readFile('./file.txt', 'utf8', (err, data2) => {
  console.log('4. Async read complete:', Date.now() - start, 'ms');
});

console.log('3. After fs.readFile call:', Date.now() - start, 'ms');

// Output:
// 1. Script starts
// 2. Sync read complete: 5ms
// 3. After fs.readFile call: 5ms
// 4. Async read complete: 8ms  ← Runs later, in callback
```

```
┌─────────────────────────────────────────────────────────────────────┐
│          DETAILED TRACE: fs.readFile('./file.txt', callback)         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   STEP 1: JavaScript Call                                           │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │  Your code: fs.readFile('./file.txt', 'utf8', callback)       │ │
│   │                                                               │ │
│   │  What happens:                                                │ │
│   │  - fs module (JavaScript) validates arguments                 │ │
│   │  - Calls internal binding: binding.open() + binding.read()    │ │
│   │  - Passes callback reference to be called later               │ │
│   └───────────────────────────────────────────────────────────────┘ │
│                              │                                       │
│                              ▼                                       │
│   STEP 2: C++ Bindings (node_file.cc)                               │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │  - Unwrap JavaScript arguments to C++ types                   │ │
│   │  - Create a FSReqCallback object (holds callback reference)   │ │
│   │  - Call libuv: uv_fs_read()                                   │ │
│   └───────────────────────────────────────────────────────────────┘ │
│                              │                                       │
│                              ▼                                       │
│   STEP 3: libuv Thread Pool                                         │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │  MAIN THREAD (Event Loop)        │  WORKER THREAD             │ │
│   │                                  │                            │ │
│   │  • Continues executing           │  • Picks up fs request     │ │
│   │    your JavaScript               │  • Calls OS read()         │ │
│   │  • Can handle other              │  • Blocks until complete   │ │
│   │    callbacks, I/O                │  • Stores result in        │ │
│   │                                  │    request object          │ │
│   │                                  │  • Signals completion      │ │
│   └──────────────────────────────────┴────────────────────────────┘ │
│                              │                                       │
│                              ▼                                       │
│   STEP 4: Completion (back to Main Thread)                          │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │  - Thread pool signals: "fs operation done"                   │ │
│   │  - Result stored in request object                            │ │
│   │  - Callback added to event loop's Poll queue                  │ │
│   └───────────────────────────────────────────────────────────────┘ │
│                              │                                       │
│                              ▼                                       │
│   STEP 5: Event Loop Executes Callback                              │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │  - Event loop reaches Poll phase                              │ │
│   │  - Sees pending callback                                      │ │
│   │  - V8 executes: callback(null, fileContents)                  │ │
│   │  - Your console.log runs!                                     │ │
│   └───────────────────────────────────────────────────────────────┘ │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Complete Example: Multiple Async Operations

```javascript
const fs = require('fs');
const https = require('https');
const crypto = require('crypto');

const start = Date.now();
const log = (msg) => console.log(`${Date.now() - start}ms: ${msg}`);

log('1. Script start');

// HTTPS request - uses OS async APIs (NOT thread pool)
https.get('https://httpbin.org/get', (res) => {
  res.on('end', () => log('5. HTTPS complete'));
  res.resume();
});

// File read - uses thread pool (thread 1)
fs.readFile('./file1.txt', () => log('3. File 1 read'));

// Crypto - uses thread pool (thread 2)
crypto.pbkdf2('password', 'salt', 100000, 64, 'sha512', () => {
  log('4. Crypto 1 complete');
});

// Another crypto - uses thread pool (thread 3)
crypto.pbkdf2('password', 'salt', 100000, 64, 'sha512', () => {
  log('6. Crypto 2 complete');
});

// File read - uses thread pool (thread 4)
fs.readFile('./file2.txt', () => log('7. File 2 read'));

// 5th crypto - must WAIT for a thread (only 4 in pool!)
crypto.pbkdf2('password', 'salt', 100000, 64, 'sha512', () => {
  log('8. Crypto 3 complete (had to wait for thread!)');
});

log('2. All async operations initiated');

// Typical output:
// 0ms: 1. Script start
// 1ms: 2. All async operations initiated
// 3ms: 3. File 1 read          ← Fast file read (thread pool)
// 50ms: 4. Crypto 1 complete    ← CPU-bound work
// 52ms: 5. HTTPS complete       ← Network (not thread pool)
// 53ms: 6. Crypto 2 complete    ← Parallel with crypto 1
// 55ms: 7. File 2 read          ← Was waiting for crypto
// 105ms: 8. Crypto 3 complete   ← Had to wait for free thread!
```

---

## V8 Engine

### What is V8?

V8 is Google's open-source JavaScript engine, written in C++. It compiles JavaScript directly to native machine code.

```
┌─────────────────────────────────────────────────────────────────────┐
│                    V8 COMPILATION PIPELINE                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   JavaScript Source Code                                             │
│          │                                                           │
│          ▼                                                           │
│   ┌──────────────────────────────────────────┐                      │
│   │           PARSER                          │                      │
│   │   • Lexical analysis (tokenization)       │                      │
│   │   • Syntax analysis                       │                      │
│   │   • Produces AST (Abstract Syntax Tree)   │                      │
│   └──────────────────────────────────────────┘                      │
│          │                                                           │
│          ▼                                                           │
│   ┌──────────────────────────────────────────┐                      │
│   │           IGNITION (Interpreter)          │                      │
│   │   • Converts AST to bytecode              │                      │
│   │   • Executes bytecode quickly             │                      │
│   │   • Collects profiling data               │                      │
│   └──────────────────────────────────────────┘                      │
│          │                                                           │
│          │  Hot code (frequently executed)                           │
│          ▼                                                           │
│   ┌──────────────────────────────────────────┐                      │
│   │           TURBOFAN (Optimizing Compiler)  │                      │
│   │   • JIT compilation to machine code       │                      │
│   │   • Type feedback optimization            │                      │
│   │   • Inlining, dead code elimination       │                      │
│   └──────────────────────────────────────────┘                      │
│          │                                                           │
│          ▼                                                           │
│   Highly Optimized Machine Code                                      │
│                                                                      │
│   ⚠️ Deoptimization: If assumptions are violated,                   │
│      code falls back to Ignition                                    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### V8 Memory Structure

```
┌─────────────────────────────────────────────────────────────────────┐
│                    V8 MEMORY STRUCTURE                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │                        HEAP                                    │ │
│   │                                                                │ │
│   │   ┌─────────────────────────────────────────────────────────┐ │ │
│   │   │              NEW SPACE (Young Generation)                │ │ │
│   │   │                                                          │ │ │
│   │   │   ┌────────────────┐    ┌────────────────┐              │ │ │
│   │   │   │  Semi-space 1  │    │  Semi-space 2  │              │ │ │
│   │   │   │  (From space)  │    │  (To space)    │              │ │ │
│   │   │   │                │    │                │              │ │ │
│   │   │   │  New objects   │◀──▶│  Survivors     │              │ │ │
│   │   │   │  allocated     │    │  copied here   │              │ │ │
│   │   │   └────────────────┘    └────────────────┘              │ │ │
│   │   │                                                          │ │ │
│   │   │   • Small (1-8 MB)                                       │ │ │
│   │   │   • Scavenger GC (fast, frequent)                        │ │ │
│   │   │   • Objects that survive → Old Space                     │ │ │
│   │   └─────────────────────────────────────────────────────────┘ │ │
│   │                                                                │ │
│   │   ┌─────────────────────────────────────────────────────────┐ │ │
│   │   │              OLD SPACE (Old Generation)                  │ │ │
│   │   │                                                          │ │ │
│   │   │   • Long-lived objects                                   │ │ │
│   │   │   • Larger (hundreds of MB)                              │ │ │
│   │   │   • Mark-Sweep-Compact GC                                │ │ │
│   │   │   • Less frequent, more expensive                        │ │ │
│   │   │                                                          │ │ │
│   │   │   ┌────────────────┐    ┌────────────────┐              │ │ │
│   │   │   │  Old Pointer   │    │   Old Data     │              │ │ │
│   │   │   │  Space         │    │   Space        │              │ │ │
│   │   │   │  (objects with │    │  (raw data,    │              │ │ │
│   │   │   │   pointers)    │    │   strings)     │              │ │ │
│   │   │   └────────────────┘    └────────────────┘              │ │ │
│   │   └─────────────────────────────────────────────────────────┘ │ │
│   │                                                                │ │
│   │   ┌─────────────────────────────────────────────────────────┐ │ │
│   │   │              LARGE OBJECT SPACE                          │ │ │
│   │   │   • Objects > 1MB                                        │ │ │
│   │   │   • Not moved by GC                                      │ │ │
│   │   └─────────────────────────────────────────────────────────┘ │ │
│   │                                                                │ │
│   │   ┌─────────────────────────────────────────────────────────┐ │ │
│   │   │              CODE SPACE                                  │ │ │
│   │   │   • JIT compiled code                                    │ │ │
│   │   │   • Executable memory                                    │ │ │
│   │   └─────────────────────────────────────────────────────────┘ │ │
│   │                                                                │ │
│   └───────────────────────────────────────────────────────────────┘ │
│                                                                      │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │                        STACK                                   │ │
│   │   • Function call frames                                       │ │
│   │   • Primitive values                                           │ │
│   │   • References to heap objects                                 │ │
│   │   • Fixed size per process                                     │ │
│   └───────────────────────────────────────────────────────────────┘ │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Garbage Collection

```javascript
// Objects become garbage when unreachable
let user = { name: 'John' };  // Object allocated in heap
user = null;                   // Object now unreachable → garbage

// Circular references are handled
let a = {};
let b = {};
a.ref = b;
b.ref = a;
a = null;
b = null;  // Both are garbage (V8's mark-sweep handles this)
```

```
┌─────────────────────────────────────────────────────────────────────┐
│                    GARBAGE COLLECTION TYPES                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   SCAVENGER (Minor GC) - Young Generation                           │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │  • Very fast (1-2ms)                                          │ │
│   │  • Runs frequently                                            │ │
│   │  • Copying collector (from-space → to-space)                  │ │
│   │  • Promotes survivors to Old Space                            │ │
│   │  • Stop-the-world (brief pause)                               │ │
│   └───────────────────────────────────────────────────────────────┘ │
│                                                                      │
│   MARK-SWEEP-COMPACT (Major GC) - Old Generation                    │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │  Phase 1: MARK                                                │ │
│   │  • Start from roots (global, stack)                           │ │
│   │  • Mark all reachable objects                                 │ │
│   │                                                               │ │
│   │  Phase 2: SWEEP                                               │ │
│   │  • Free unmarked objects                                      │ │
│   │  • Update free lists                                          │ │
│   │                                                               │ │
│   │  Phase 3: COMPACT (optional)                                  │ │
│   │  • Move objects to reduce fragmentation                       │ │
│   │  • Update references                                          │ │
│   │                                                               │ │
│   │  • More expensive (10-100ms+)                                 │ │
│   │  • Runs less frequently                                       │ │
│   │  • Incremental/Concurrent to reduce pauses                    │ │
│   └───────────────────────────────────────────────────────────────┘ │
│                                                                      │
│   INCREMENTAL MARKING                                                │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │  • Breaks marking into small steps                            │ │
│   │  • Interleaved with JavaScript execution                      │ │
│   │  • Reduces pause times                                        │ │
│   └───────────────────────────────────────────────────────────────┘ │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## libuv - The Heart of Node.js

### What is libuv?

**libuv** is a C library that provides:
- Event loop
- Asynchronous I/O
- Thread pool
- Cross-platform abstraction

```
┌─────────────────────────────────────────────────────────────────────┐
│                    LIBUV OVERVIEW                                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │                         LIBUV                                  │ │
│   │                                                                │ │
│   │   ┌─────────────────────────────────────────────────────────┐ │ │
│   │   │                    EVENT LOOP                            │ │ │
│   │   │   • Single-threaded                                      │ │ │
│   │   │   • Handles async callbacks                              │ │ │
│   │   │   • Multiple phases (timers, poll, check, etc.)          │ │ │
│   │   └─────────────────────────────────────────────────────────┘ │ │
│   │                                                                │ │
│   │   ┌─────────────────────────────────────────────────────────┐ │ │
│   │   │                    THREAD POOL                           │ │ │
│   │   │   • 4 threads by default (UV_THREADPOOL_SIZE)           │ │ │
│   │   │   • Used for: fs, dns.lookup, crypto, zlib              │ │ │
│   │   │   • NOT for: network I/O (uses OS async)                │ │ │
│   │   └─────────────────────────────────────────────────────────┘ │ │
│   │                                                                │ │
│   │   ┌─────────────────────────────────────────────────────────┐ │ │
│   │   │                    ASYNC I/O                             │ │ │
│   │   │   • Network: epoll (Linux), kqueue (macOS), IOCP (Win)  │ │ │
│   │   │   • Non-blocking system calls                           │ │ │
│   │   │   • Callbacks when data ready                           │ │ │
│   │   └─────────────────────────────────────────────────────────┘ │ │
│   │                                                                │ │
│   └───────────────────────────────────────────────────────────────┘ │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### What Uses Thread Pool vs Async I/O

```
┌─────────────────────────────────────────────────────────────────────┐
│                    THREAD POOL vs ASYNC I/O                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   THREAD POOL (blocking operations delegated to threads)            │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │  • fs.readFile, fs.writeFile (all fs operations)             │ │
│   │  • dns.lookup (not dns.resolve - that uses DNS servers)      │ │
│   │  • crypto.pbkdf2, crypto.randomBytes                          │ │
│   │  • crypto.scrypt                                              │ │
│   │  • zlib.gzip, zlib.gunzip                                     │ │
│   │  • Some cpu-intensive node core operations                    │ │
│   │                                                               │ │
│   │  Why? These operations don't have async OS APIs               │ │
│   │  or are CPU-bound (crypto hashing)                            │ │
│   └───────────────────────────────────────────────────────────────┘ │
│                                                                      │
│   OS ASYNC APIs (kernel handles async, no threads needed)           │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │  • TCP/UDP sockets (http, https, net)                         │ │
│   │  • Pipes                                                      │ │
│   │  • TTY                                                        │ │
│   │  • DNS resolve (uses network)                                 │ │
│   │                                                               │ │
│   │  Linux: epoll                                                 │ │
│   │  macOS/BSD: kqueue                                            │ │
│   │  Windows: IOCP (I/O Completion Ports)                         │ │
│   │                                                               │ │
│   │  These use OS-level async notification mechanisms             │ │
│   └───────────────────────────────────────────────────────────────┘ │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Example: Thread Pool Saturation

```javascript
const crypto = require('crypto');
const start = Date.now();

// Default thread pool size: 4
// Try 4 operations
for (let i = 0; i < 4; i++) {
  crypto.pbkdf2('password', 'salt', 100000, 512, 'sha512', () => {
    console.log(`${i}: ${Date.now() - start}ms`);
  });
}

// Output (approximately):
// 0: 500ms
// 1: 500ms
// 2: 500ms
// 3: 500ms
// All complete at ~same time (parallel in 4 threads)

// Now try 8 operations (more than thread pool size)
// 0-3: ~500ms (first batch)
// 4-7: ~1000ms (second batch, had to wait for threads)
```

```javascript
// Increase thread pool size
process.env.UV_THREADPOOL_SIZE = 8;  // Must set BEFORE requiring modules

// Or via command line:
// UV_THREADPOOL_SIZE=8 node app.js
```

### Detailed Event Loop Example: Understanding Execution Order

```javascript
const fs = require('fs');

console.log('1. Script start');

// setTimeout - Timers phase
setTimeout(() => {
  console.log('6. setTimeout 0ms');
}, 0);

// setImmediate - Check phase
setImmediate(() => {
  console.log('7. setImmediate');
});

// Promise - Microtask queue
Promise.resolve().then(() => {
  console.log('3. Promise.then');
});

// process.nextTick - nextTick queue (highest priority)
process.nextTick(() => {
  console.log('2. process.nextTick');
});

// I/O operation - Poll phase
fs.readFile(__filename, () => {
  console.log('5. fs.readFile callback');
  
  // Inside I/O callback, setImmediate runs BEFORE setTimeout
  setTimeout(() => console.log('9. setTimeout inside I/O'), 0);
  setImmediate(() => console.log('8. setImmediate inside I/O'));
  
  process.nextTick(() => console.log('5.5 nextTick inside I/O'));
});

console.log('4. Script end');

// Output:
// 1. Script start
// 4. Script end
// 2. process.nextTick
// 3. Promise.then
// 6. setTimeout 0ms (or 7 first - timing dependent)
// 7. setImmediate (or 6 first - timing dependent)
// 5. fs.readFile callback
// 5.5 nextTick inside I/O
// 8. setImmediate inside I/O (ALWAYS before setTimeout in I/O!)
// 9. setTimeout inside I/O
```

```
┌─────────────────────────────────────────────────────────────────────┐
│          EVENT LOOP PHASES - DETAILED BREAKDOWN                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │                     EVENT LOOP                               │   │
│   │                                                              │   │
│   │   ┌─────────────────────────────────────────────────────┐   │   │
│   │   │ 1. TIMERS PHASE                                     │   │   │
│   │   │    • Executes setTimeout() callbacks                │   │   │
│   │   │    • Executes setInterval() callbacks               │   │   │
│   │   │    • Checks if timer threshold has passed           │   │   │
│   │   └───────────────────────────┬─────────────────────────┘   │   │
│   │                               ▼                              │   │
│   │   ┌────────────────────────────────────────────────────┐    │   │
│   │   │  [nextTick queue] → [microtask queue]              │    │   │
│   │   │  (runs between EVERY phase)                        │    │   │
│   │   └────────────────────────────────────────────────────┘    │   │
│   │                               ▼                              │   │
│   │   ┌─────────────────────────────────────────────────────┐   │   │
│   │   │ 2. PENDING CALLBACKS PHASE                          │   │   │
│   │   │    • I/O callbacks deferred from previous loop      │   │   │
│   │   │    • TCP errors, etc.                               │   │   │
│   │   └───────────────────────────┬─────────────────────────┘   │   │
│   │                               ▼                              │   │
│   │   ┌────────────────────────────────────────────────────┐    │   │
│   │   │  [nextTick queue] → [microtask queue]              │    │   │
│   │   └────────────────────────────────────────────────────┘    │   │
│   │                               ▼                              │   │
│   │   ┌─────────────────────────────────────────────────────┐   │   │
│   │   │ 3. IDLE, PREPARE PHASE                              │   │   │
│   │   │    • Internal use only                              │   │   │
│   │   └───────────────────────────┬─────────────────────────┘   │   │
│   │                               ▼                              │   │
│   │   ┌─────────────────────────────────────────────────────┐   │   │
│   │   │ 4. POLL PHASE ← Most time spent here!               │   │   │
│   │   │    • Retrieve new I/O events                        │   │   │
│   │   │    • Execute I/O callbacks (fs, network, etc.)      │   │   │
│   │   │    • Can BLOCK here waiting for I/O                 │   │   │
│   │   │                                                     │   │   │
│   │   │    Behavior:                                        │   │   │
│   │   │    - If poll queue NOT empty → process callbacks    │   │   │
│   │   │    - If poll queue empty:                           │   │   │
│   │   │      • If setImmediate scheduled → go to Check      │   │   │
│   │   │      • If timers ready → go to Timers               │   │   │
│   │   │      • Otherwise → wait for I/O                     │   │   │
│   │   └───────────────────────────┬─────────────────────────┘   │   │
│   │                               ▼                              │   │
│   │   ┌────────────────────────────────────────────────────┐    │   │
│   │   │  [nextTick queue] → [microtask queue]              │    │   │
│   │   └────────────────────────────────────────────────────┘    │   │
│   │                               ▼                              │   │
│   │   ┌─────────────────────────────────────────────────────┐   │   │
│   │   │ 5. CHECK PHASE                                      │   │   │
│   │   │    • Executes setImmediate() callbacks              │   │   │
│   │   │    • Runs IMMEDIATELY after Poll phase              │   │   │
│   │   └───────────────────────────┬─────────────────────────┘   │   │
│   │                               ▼                              │   │
│   │   ┌────────────────────────────────────────────────────┐    │   │
│   │   │  [nextTick queue] → [microtask queue]              │    │   │
│   │   └────────────────────────────────────────────────────┘    │   │
│   │                               ▼                              │   │
│   │   ┌─────────────────────────────────────────────────────┐   │   │
│   │   │ 6. CLOSE CALLBACKS PHASE                            │   │   │
│   │   │    • socket.on('close', ...)                        │   │   │
│   │   │    • Cleanup callbacks                              │   │   │
│   │   └───────────────────────────┬─────────────────────────┘   │   │
│   │                               │                              │   │
│   │                               └────────────────┐            │   │
│   │                                                │            │   │
│   │   ┌────────────────────────────────────────────▼────────┐   │   │
│   │   │  Loop back to TIMERS or exit if nothing pending     │   │   │
│   │   └─────────────────────────────────────────────────────┘   │   │
│   │                                                              │   │
│   └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### setTimeout vs setImmediate: The Tricky Case

```javascript
// OUTSIDE I/O callbacks - Order is UNPREDICTABLE!
setTimeout(() => console.log('timeout'), 0);
setImmediate(() => console.log('immediate'));

// Run multiple times - sometimes timeout first, sometimes immediate
// Why? setTimeout(0) actually means setTimeout(1) minimum
// If event loop starts before 1ms passes → immediate runs first
// If event loop starts after 1ms passes → timeout runs first

// ─────────────────────────────────────────────────────────────────

// INSIDE I/O callbacks - Order is ALWAYS immediate first!
const fs = require('fs');

fs.readFile(__filename, () => {
  setTimeout(() => console.log('timeout'), 0);
  setImmediate(() => console.log('immediate'));
});

// Output is ALWAYS:
// immediate
// timeout

// Why? Inside I/O callback, we're in Poll phase
// Next phase is Check (setImmediate)
// Then loop continues to Timers (setTimeout)
```

```
┌─────────────────────────────────────────────────────────────────────┐
│          setTimeout(0) vs setImmediate                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   SCENARIO 1: Top-level code (main module)                          │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │                                                               │ │
│   │   setTimeout(() => log('A'), 0);                              │ │
│   │   setImmediate(() => log('B'));                               │ │
│   │                                                               │ │
│   │   Event loop hasn't started yet!                              │ │
│   │                                                               │ │
│   │   If script execution < 1ms:                                  │ │
│   │   → Timer not ready → Poll → Check (B) → Timers (A)           │ │
│   │   Output: B, A                                                │ │
│   │                                                               │ │
│   │   If script execution >= 1ms:                                 │ │
│   │   → Timer ready → Timers (A) → ... → Check (B)                │ │
│   │   Output: A, B                                                │ │
│   │                                                               │ │
│   │   UNPREDICTABLE! Depends on system performance.               │ │
│   │                                                               │ │
│   └───────────────────────────────────────────────────────────────┘ │
│                                                                      │
│   SCENARIO 2: Inside I/O callback                                   │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │                                                               │ │
│   │   fs.readFile('file', () => {                                 │ │
│   │     setTimeout(() => log('A'), 0);                            │ │
│   │     setImmediate(() => log('B'));                             │ │
│   │   });                                                         │ │
│   │                                                               │ │
│   │   We're in Poll phase when callback runs!                     │ │
│   │                                                               │ │
│   │   Poll → Check (B) → Close → Timers (A)                       │ │
│   │                                                               │ │
│   │   Output: ALWAYS B, then A                                    │ │
│   │                                                               │ │
│   └───────────────────────────────────────────────────────────────┘ │
│                                                                      │
│   RECOMMENDATION:                                                    │
│   • Use setImmediate for "next tick" behavior in I/O               │
│   • Use process.nextTick for immediate execution before I/O        │
│   • Use setTimeout for actual delays                               │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### process.nextTick vs setImmediate vs Promise

```javascript
console.log('1. Start');

setImmediate(() => console.log('5. setImmediate'));

Promise.resolve().then(() => console.log('3. Promise'));

process.nextTick(() => console.log('2. nextTick'));

setTimeout(() => console.log('4. setTimeout'), 0);

console.log('1.5 End');

// Output:
// 1. Start
// 1.5 End
// 2. nextTick      ← Highest priority after sync code
// 3. Promise       ← Microtask, after nextTick
// 4. setTimeout    ← Timer phase (might swap with 5)
// 5. setImmediate  ← Check phase (might swap with 4)
```

```
┌─────────────────────────────────────────────────────────────────────┐
│          PRIORITY ORDER OF ASYNC CALLBACKS                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   PRIORITY (Highest to Lowest):                                     │
│                                                                      │
│   1. process.nextTick()                                             │
│      ┌─────────────────────────────────────────────────────────┐   │
│      │  • Runs IMMEDIATELY after current operation             │   │
│      │  • Before event loop continues                          │   │
│      │  • Before ANY I/O                                       │   │
│      │  • Can starve I/O if used recursively!                  │   │
│      │                                                         │   │
│      │  Use for: Error-first callbacks, event emission         │   │
│      │           after constructor                             │   │
│      └─────────────────────────────────────────────────────────┘   │
│                                                                      │
│   2. Promise.then() / queueMicrotask()                              │
│      ┌─────────────────────────────────────────────────────────┐   │
│      │  • Runs after nextTick queue is empty                   │   │
│      │  • Before event loop phases                             │   │
│      │  • Part of microtask queue                              │   │
│      │                                                         │   │
│      │  Use for: Promise chains, async/await                   │   │
│      └─────────────────────────────────────────────────────────┘   │
│                                                                      │
│   3. setTimeout(fn, 0)                                              │
│      ┌─────────────────────────────────────────────────────────┐   │
│      │  • Runs in Timers phase                                 │   │
│      │  • Minimum delay is actually 1ms (not 0)                │   │
│      │  • Affected by system load                              │   │
│      │                                                         │   │
│      │  Use for: Actual delays, breaking up CPU work           │   │
│      └─────────────────────────────────────────────────────────┘   │
│                                                                      │
│   4. setImmediate()                                                 │
│      ┌─────────────────────────────────────────────────────────┐   │
│      │  • Runs in Check phase                                  │   │
│      │  • After Poll phase (I/O callbacks)                     │   │
│      │  • Designed for "after I/O" execution                   │   │
│      │                                                         │   │
│      │  Use for: After I/O callbacks, yielding to event loop   │   │
│      └─────────────────────────────────────────────────────────┘   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Thread Pool

### Thread Pool Deep Dive

```
┌─────────────────────────────────────────────────────────────────────┐
│                    THREAD POOL ARCHITECTURE                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   Main Thread (Event Loop)                                          │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │  • Executes JavaScript                                        │ │
│   │  • Handles callbacks                                          │ │
│   │  • Delegates blocking work to thread pool                     │ │
│   └────────────────────────────┬──────────────────────────────────┘ │
│                                │                                     │
│                   Submit work  │  Receive results                    │
│                                ▼                                     │
│   Thread Pool (Work Queue)                                          │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │                                                               │ │
│   │   ┌─────────────────────────────────────────────────────────┐ │ │
│   │   │  Work Queue: [task1, task2, task3, task4, task5, ...]   │ │ │
│   │   └──────────────────────────┬──────────────────────────────┘ │ │
│   │                              │                                 │ │
│   │                              ▼                                 │ │
│   │   ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐        │ │
│   │   │ Thread 1 │ │ Thread 2 │ │ Thread 3 │ │ Thread 4 │        │ │
│   │   │          │ │          │ │          │ │          │        │ │
│   │   │ crypto   │ │  fs.read │ │  zlib    │ │ dns.look │        │ │
│   │   │ .pbkdf2  │ │  File    │ │  .gzip   │ │ up       │        │ │
│   │   └──────────┘ └──────────┘ └──────────┘ └──────────┘        │ │
│   │                                                               │ │
│   └───────────────────────────────────────────────────────────────┘ │
│                                                                      │
│   Thread Pool Size: UV_THREADPOOL_SIZE (default: 4, max: 1024)      │
│                                                                      │
│   ⚠️ If all threads busy, tasks wait in queue!                      │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Thread Pool Visualization Example

```javascript
const fs = require('fs');
const crypto = require('crypto');
const https = require('https');

const start = Date.now();
const log = (label) => console.log(`${label}: ${Date.now() - start}ms`);

// Uses thread pool (fs)
fs.readFile('./file.txt', 'utf8', () => log('fs'));

// Uses thread pool (crypto)
crypto.pbkdf2('a', 'b', 100000, 512, 'sha512', () => log('crypto1'));
crypto.pbkdf2('a', 'b', 100000, 512, 'sha512', () => log('crypto2'));
crypto.pbkdf2('a', 'b', 100000, 512, 'sha512', () => log('crypto3'));
crypto.pbkdf2('a', 'b', 100000, 512, 'sha512', () => log('crypto4'));

// Does NOT use thread pool (OS async)
https.get('https://google.com', (res) => {
  res.on('data', () => {});
  res.on('end', () => log('https'));
});

// Typical output:
// https: 200ms     ← Network, no thread pool
// fs: 400ms        ← Had to wait for thread
// crypto1: 450ms   ← Thread 1
// crypto2: 450ms   ← Thread 2
// crypto3: 450ms   ← Thread 3
// crypto4: 450ms   ← Thread 4
```

---

## Streams

### What are Streams?

Streams are collections of data that might not be available all at once and don't have to fit in memory.

```
┌─────────────────────────────────────────────────────────────────────┐
│                    STREAM TYPES                                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   READABLE STREAMS                                                  │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │  • fs.createReadStream()                                      │ │
│   │  • http.IncomingMessage (request)                             │ │
│   │  • process.stdin                                              │ │
│   │  • Emit: 'data', 'end', 'error', 'close'                      │ │
│   └───────────────────────────────────────────────────────────────┘ │
│                                                                      │
│   WRITABLE STREAMS                                                  │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │  • fs.createWriteStream()                                     │ │
│   │  • http.ServerResponse (response)                             │ │
│   │  • process.stdout                                             │ │
│   │  • Methods: write(), end()                                    │ │
│   │  • Emit: 'drain', 'finish', 'error', 'close'                  │ │
│   └───────────────────────────────────────────────────────────────┘ │
│                                                                      │
│   DUPLEX STREAMS (Both readable and writable)                       │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │  • net.Socket                                                 │ │
│   │  • tls.TLSSocket                                              │ │
│   │  • Can read AND write independently                           │ │
│   └───────────────────────────────────────────────────────────────┘ │
│                                                                      │
│   TRANSFORM STREAMS (Duplex that modifies data)                     │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │  • zlib.createGzip()                                          │ │
│   │  • crypto.createCipheriv()                                    │ │
│   │  • Data in → Transform → Data out                             │ │
│   └───────────────────────────────────────────────────────────────┘ │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Stream Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                    STREAM DATA FLOW                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   Without Streams (Buffer entire file):                             │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │                                                               │ │
│   │   1GB File → [====== 1GB in Memory ======] → Response        │ │
│   │                                                               │ │
│   │   Problem: Uses 1GB+ RAM, client waits for entire file       │ │
│   └───────────────────────────────────────────────────────────────┘ │
│                                                                      │
│   With Streams (Chunk by chunk):                                    │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │                                                               │ │
│   │   1GB File → [64KB] → [64KB] → [64KB] → ... → Response       │ │
│   │              chunk1    chunk2   chunk3                        │ │
│   │                                                               │ │
│   │   Benefits:                                                   │ │
│   │   • Low memory usage (only one chunk at a time)              │ │
│   │   • Time to first byte is fast                               │ │
│   │   • Can handle unlimited file sizes                          │ │
│   └───────────────────────────────────────────────────────────────┘ │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Stream Examples

```javascript
const fs = require('fs');
const http = require('http');
const zlib = require('zlib');

// ❌ Bad: Load entire file into memory
http.createServer((req, res) => {
  fs.readFile('./large-file.txt', (err, data) => {
    res.end(data);  // Entire file in memory!
  });
});

// ✅ Good: Stream the file
http.createServer((req, res) => {
  const stream = fs.createReadStream('./large-file.txt');
  stream.pipe(res);  // Chunks sent as they're read
});

// ✅ Even better: Stream with compression
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Encoding': 'gzip' });
  
  fs.createReadStream('./large-file.txt')
    .pipe(zlib.createGzip())  // Compress on the fly
    .pipe(res);
});
```

### Backpressure

**Backpressure** occurs when the writable stream can't process data as fast as the readable stream produces it.

```javascript
// ❌ Problem: Ignoring backpressure
const readable = fs.createReadStream('large-file.txt');
const writable = fs.createWriteStream('output.txt');

readable.on('data', (chunk) => {
  writable.write(chunk);  // What if writable is slow?
  // Data accumulates in memory! 💥
});

// ✅ Solution 1: Use pipe() - handles backpressure automatically
readable.pipe(writable);

// ✅ Solution 2: Manual backpressure handling
readable.on('data', (chunk) => {
  const canContinue = writable.write(chunk);
  
  if (!canContinue) {
    // Buffer is full, pause reading
    readable.pause();
    
    // Resume when drained
    writable.once('drain', () => {
      readable.resume();
    });
  }
});
```

```
┌─────────────────────────────────────────────────────────────────────┐
│                    BACKPRESSURE                                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   Without backpressure handling:                                    │
│                                                                      │
│   Readable          Internal Buffer            Writable              │
│   (fast)               (grows!)                (slow)                │
│   ┌──────┐         ┌──────────────────┐       ┌──────┐              │
│   │ ▓▓▓▓ │ ──────▶ │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │ ───▶ │ ▓    │              │
│   │ ▓▓▓▓ │         │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │      │      │              │
│   │ ▓▓▓▓ │         │ MEMORY GROWS! 💥 │      │      │              │
│   └──────┘         └──────────────────┘       └──────┘              │
│                                                                      │
│   With backpressure handling (pipe):                                │
│                                                                      │
│   Readable          Internal Buffer            Writable              │
│   (paused)          (small, fixed)             (slow)                │
│   ┌──────┐         ┌──────────────────┐       ┌──────┐              │
│   │ ░░░░ │ ──────▶ │ ▓▓▓▓             │ ───▶ │ ▓▓▓▓ │              │
│   │ ░░░░ │ WAIT    │ (highWaterMark)  │      │ ▓▓▓▓ │              │
│   │ ░░░░ │         │                  │      │      │              │
│   └──────┘         └──────────────────┘       └──────┘              │
│      │                                                               │
│      └─── Resume when drain event ───────────────────┘              │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Stream Pipeline (Modern API)

```javascript
const { pipeline } = require('stream/promises');
const fs = require('fs');
const zlib = require('zlib');

async function compressFile(input, output) {
  await pipeline(
    fs.createReadStream(input),
    zlib.createGzip(),
    fs.createWriteStream(output)
  );
  console.log('Compression complete');
}

// Benefits of pipeline:
// - Automatic error handling
// - Proper cleanup on error
// - Returns promise
```

### Complete Streams Example: Building an HTTP File Server

```javascript
const http = require('http');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const server = http.createServer((req, res) => {
  const filePath = path.join(__dirname, 'large-file.txt');
  
  // Check if client accepts gzip
  const acceptEncoding = req.headers['accept-encoding'] || '';
  const supportsGzip = acceptEncoding.includes('gzip');
  
  // Get file stats for Content-Length (if not compressing)
  fs.stat(filePath, (err, stats) => {
    if (err) {
      res.writeHead(404);
      return res.end('File not found');
    }
    
    // Set headers
    res.setHeader('Content-Type', 'text/plain');
    
    if (supportsGzip) {
      // Streaming with compression
      res.writeHead(200, {
        'Content-Encoding': 'gzip',
        'Transfer-Encoding': 'chunked'  // Don't know final size
      });
      
      fs.createReadStream(filePath)
        .pipe(zlib.createGzip())
        .pipe(res);
        
      console.log('Streaming with gzip compression');
    } else {
      // Streaming without compression
      res.writeHead(200, {
        'Content-Length': stats.size
      });
      
      fs.createReadStream(filePath)
        .pipe(res);
        
      console.log('Streaming without compression');
    }
  });
});

server.listen(3000);
```

### Creating Custom Streams

```javascript
const { Readable, Writable, Transform } = require('stream');

// Custom Readable Stream
class CounterStream extends Readable {
  constructor(max) {
    super();
    this.max = max;
    this.current = 0;
  }
  
  _read() {
    if (this.current <= this.max) {
      this.push(String(this.current++) + '\n');
    } else {
      this.push(null);  // Signal end of stream
    }
  }
}

// Custom Writable Stream
class LoggerStream extends Writable {
  _write(chunk, encoding, callback) {
    console.log('Received:', chunk.toString().trim());
    // Simulate async processing
    setTimeout(callback, 100);
  }
}

// Custom Transform Stream
class UppercaseTransform extends Transform {
  _transform(chunk, encoding, callback) {
    this.push(chunk.toString().toUpperCase());
    callback();
  }
}

// Usage
const counter = new CounterStream(5);
const uppercase = new UppercaseTransform();
const logger = new LoggerStream();

counter
  .pipe(uppercase)
  .pipe(logger);

// Output:
// Received: 0
// Received: 1
// Received: 2
// Received: 3
// Received: 4
// Received: 5
```

```
┌─────────────────────────────────────────────────────────────────────┐
│          STREAM MODES: Flowing vs Paused                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   PAUSED MODE (default)                                             │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │  • Stream doesn't emit data automatically                     │ │
│   │  • Must call stream.read() to get data                        │ │
│   │  • More control but more complex                              │ │
│   │                                                               │ │
│   │  readable.on('readable', () => {                              │ │
│   │    let chunk;                                                 │ │
│   │    while ((chunk = readable.read()) !== null) {               │ │
│   │      console.log(chunk);                                      │ │
│   │    }                                                          │ │
│   │  });                                                          │ │
│   └───────────────────────────────────────────────────────────────┘ │
│                                                                      │
│   FLOWING MODE                                                      │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │  • Data emitted automatically via 'data' event                │ │
│   │  • Enabled by: .pipe(), 'data' listener, or .resume()         │ │
│   │  • Simpler but can lose data if not handled                   │ │
│   │                                                               │ │
│   │  readable.on('data', (chunk) => {                             │ │
│   │    console.log(chunk);  // Called as data available           │ │
│   │  });                                                          │ │
│   │                                                               │ │
│   │  readable.on('end', () => {                                   │ │
│   │    console.log('Done');                                       │ │
│   │  });                                                          │ │
│   └───────────────────────────────────────────────────────────────┘ │
│                                                                      │
│   SWITCHING MODES                                                   │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │  readable.pause();   // Switch to paused mode                 │ │
│   │  readable.resume();  // Switch to flowing mode                │ │
│   │                                                               │ │
│   │  // Check mode                                                │ │
│   │  readable.readableFlowing;  // null | true | false            │ │
│   │  // null = not started                                        │ │
│   │  // true = flowing                                            │ │
│   │  // false = paused                                            │ │
│   └───────────────────────────────────────────────────────────────┘ │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Practical: Stream Processing Large JSON

```javascript
const { Transform } = require('stream');
const fs = require('fs');

// Problem: 10GB JSON file, can't load into memory
// Solution: Stream processing with JSON line format (NDJSON)

// Assume file format (one JSON object per line):
// {"id": 1, "name": "Alice"}
// {"id": 2, "name": "Bob"}
// ...

class JSONParser extends Transform {
  constructor() {
    super({ objectMode: true });  // Output JS objects, not buffers
    this.buffer = '';
  }
  
  _transform(chunk, encoding, callback) {
    this.buffer += chunk.toString();
    
    // Process complete lines
    const lines = this.buffer.split('\n');
    this.buffer = lines.pop();  // Keep incomplete line in buffer
    
    for (const line of lines) {
      if (line.trim()) {
        try {
          const obj = JSON.parse(line);
          this.push(obj);
        } catch (e) {
          this.emit('error', new Error(`Invalid JSON: ${line}`));
        }
      }
    }
    
    callback();
  }
  
  _flush(callback) {
    // Process any remaining data
    if (this.buffer.trim()) {
      try {
        this.push(JSON.parse(this.buffer));
      } catch (e) {
        this.emit('error', new Error(`Invalid JSON: ${this.buffer}`));
      }
    }
    callback();
  }
}

class FilterTransform extends Transform {
  constructor(predicate) {
    super({ objectMode: true });
    this.predicate = predicate;
  }
  
  _transform(obj, encoding, callback) {
    if (this.predicate(obj)) {
      this.push(obj);
    }
    callback();
  }
}

// Usage: Process 10GB file with minimal memory
fs.createReadStream('huge-data.ndjson')
  .pipe(new JSONParser())
  .pipe(new FilterTransform(obj => obj.age > 21))
  .on('data', (user) => {
    console.log('Adult user:', user.name);
  })
  .on('end', () => {
    console.log('Processing complete');
  });

// Memory usage: Only ~64KB at a time (default highWaterMark)
```

---

## Buffers

### What are Buffers?

**Buffers** are fixed-length sequences of bytes. They represent binary data in memory.

```javascript
// Creating buffers
const buf1 = Buffer.alloc(10);              // 10 bytes, filled with zeros
const buf2 = Buffer.allocUnsafe(10);        // 10 bytes, uninitialized (faster)
const buf3 = Buffer.from('Hello');          // From string
const buf4 = Buffer.from([1, 2, 3]);        // From array
const buf5 = Buffer.from('Hello', 'utf8');  // With encoding

// Buffer operations
console.log(buf3.toString());         // 'Hello'
console.log(buf3.toString('hex'));    // '48656c6c6f'
console.log(buf3.toString('base64')); // 'SGVsbG8='

console.log(buf3.length);             // 5 (bytes, not characters!)
console.log(buf3[0]);                 // 72 (ASCII code for 'H')

// Buffer is a view into memory
buf3[0] = 74;  // Change 'H' to 'J'
console.log(buf3.toString());  // 'Jello'
```

```
┌─────────────────────────────────────────────────────────────────────┐
│                    BUFFER MEMORY LAYOUT                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   const buf = Buffer.from('Hello');                                 │
│                                                                      │
│   Memory:                                                            │
│   ┌─────┬─────┬─────┬─────┬─────┐                                   │
│   │  72 │ 101 │ 108 │ 108 │ 111 │                                   │
│   │ 'H' │ 'e' │ 'l' │ 'l' │ 'o' │                                   │
│   └──┬──┴──┬──┴──┬──┴──┬──┴──┬──┘                                   │
│      0     1     2     3     4    ← Index                           │
│                                                                      │
│   buf.length = 5 bytes                                              │
│   buf[0] = 72                                                       │
│   buf.toString() = 'Hello'                                          │
│                                                                      │
│   ─────────────────────────────────────────────────────────────────  │
│                                                                      │
│   Unicode example:                                                   │
│   const buf = Buffer.from('你好');                                   │
│                                                                      │
│   Memory (UTF-8 encoding):                                          │
│   ┌─────┬─────┬─────┬─────┬─────┬─────┐                             │
│   │ 228 │ 189 │ 160 │ 229 │ 165 │ 189 │                             │
│   │     '你'        │     '好'        │                             │
│   └─────┴─────┴─────┴─────┴─────┴─────┘                             │
│                                                                      │
│   buf.length = 6 (bytes, not characters!)                           │
│   '你好'.length = 2 (characters)                                     │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Buffer Pooling

```javascript
// Node.js maintains a pool of pre-allocated memory for small buffers
// This is for performance - avoids many small allocations

// Buffer.allocUnsafe uses pooling for buffers < 4KB
const poolSize = Buffer.poolSize;  // 8192 bytes (8KB)

// These share pool memory:
const buf1 = Buffer.allocUnsafe(100);  // From pool
const buf2 = Buffer.allocUnsafe(100);  // From pool

// This gets its own allocation:
const buf3 = Buffer.allocUnsafe(10000);  // Too big for pool
```

---

## Module System

### CommonJS vs ES Modules

```
┌─────────────────────────────────────────────────────────────────────┐
│                    MODULE SYSTEMS                                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   COMMONJS (require/module.exports)                                 │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │  • Default in Node.js                                         │ │
│   │  • Synchronous loading                                        │ │
│   │  • Dynamic imports possible                                   │ │
│   │  • Modules are cached after first load                        │ │
│   │                                                               │ │
│   │  // export                                                    │ │
│   │  module.exports = { foo: 'bar' };                             │ │
│   │  module.exports.foo = 'bar';                                  │ │
│   │  exports.foo = 'bar';  // shorthand                           │ │
│   │                                                               │ │
│   │  // import                                                    │ │
│   │  const mod = require('./module');                             │ │
│   │  const { foo } = require('./module');                         │ │
│   └───────────────────────────────────────────────────────────────┘ │
│                                                                      │
│   ES MODULES (import/export)                                        │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │  • Standard JavaScript modules                                │ │
│   │  • Static analysis possible (tree-shaking)                    │ │
│   │  • Asynchronous loading                                       │ │
│   │  • Use .mjs extension or "type": "module" in package.json     │ │
│   │                                                               │ │
│   │  // export                                                    │ │
│   │  export const foo = 'bar';                                    │ │
│   │  export default function() {}                                 │ │
│   │                                                               │ │
│   │  // import                                                    │ │
│   │  import { foo } from './module.js';                           │ │
│   │  import mod from './module.js';                               │ │
│   │  import * as mod from './module.js';                          │ │
│   └───────────────────────────────────────────────────────────────┘ │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Module Resolution

```
┌─────────────────────────────────────────────────────────────────────┐
│                    MODULE RESOLUTION                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   require('./module')                                               │
│      │                                                               │
│      ▼                                                               │
│   1. Check exact path                                               │
│      ./module                                                       │
│      ./module.js                                                    │
│      ./module.json                                                  │
│      ./module.node                                                  │
│      │                                                               │
│      ▼                                                               │
│   2. Check as directory                                             │
│      ./module/package.json → main field                             │
│      ./module/index.js                                              │
│      ./module/index.json                                            │
│      ./module/index.node                                            │
│      │                                                               │
│      ▼                                                               │
│   3. Not found? Error!                                              │
│                                                                      │
│   ─────────────────────────────────────────────────────────────────  │
│                                                                      │
│   require('express')  // No path prefix                             │
│      │                                                               │
│      ▼                                                               │
│   1. Check core modules (fs, http, etc.)                            │
│      │                                                               │
│      ▼                                                               │
│   2. Check node_modules (walk up directory tree)                    │
│      ./node_modules/express                                         │
│      ../node_modules/express                                        │
│      ../../node_modules/express                                     │
│      ... until root                                                 │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Module Caching

```javascript
// Module wrapper function (what Node.js wraps your code in)
(function(exports, require, module, __filename, __dirname) {
  // Your module code here
  module.exports = { foo: 'bar' };
});

// Modules are cached by absolute path
const mod1 = require('./myModule');
const mod2 = require('./myModule');
console.log(mod1 === mod2);  // true (same object from cache)

// Check cache
console.log(require.cache);

// Clear cache (useful for hot reloading)
delete require.cache[require.resolve('./myModule')];
```

### Circular Dependencies

```javascript
// a.js
console.log('Loading a.js');
exports.loaded = false;
const b = require('./b');  // At this point, b.js runs
console.log('In a.js, b.loaded =', b.loaded);
exports.loaded = true;

// b.js
console.log('Loading b.js');
exports.loaded = false;
const a = require('./a');  // Gets INCOMPLETE a.exports!
console.log('In b.js, a.loaded =', a.loaded);  // false (not true!)
exports.loaded = true;

// Running require('./a'):
// Loading a.js
// Loading b.js
// In b.js, a.loaded = false  ← Incomplete a!
// In a.js, b.loaded = true

// Circular dependencies get incomplete exports!
```

### Detailed Module Loading Example

```javascript
// Let's trace exactly what happens when you require a module

// math.js
console.log('math.js: Starting execution');

const PI = 3.14159;
let callCount = 0;

function add(a, b) {
  callCount++;
  return a + b;
}

function getCallCount() {
  return callCount;
}

console.log('math.js: About to export');

module.exports = { PI, add, getCallCount };

console.log('math.js: Finished');

// ─────────────────────────────────────────────────────────────────

// main.js
console.log('main.js: Starting');

const math1 = require('./math');  // First require
console.log('main.js: After first require');

const math2 = require('./math');  // Second require - from cache!
console.log('main.js: After second require');

console.log('Same object?', math1 === math2);  // true!

math1.add(1, 2);
math1.add(3, 4);
console.log('Call count via math2:', math2.getCallCount());  // 2!

// Output:
// main.js: Starting
// math.js: Starting execution
// math.js: About to export
// math.js: Finished
// main.js: After first require
// main.js: After second require  ← No math.js logs! Cached!
// Same object? true
// Call count via math2: 2
```

```
┌─────────────────────────────────────────────────────────────────────┐
│          MODULE WRAPPER FUNCTION                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   When Node loads your module, it wraps it:                         │
│                                                                      │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │  // Your file: math.js                                        │ │
│   │  const PI = 3.14;                                             │ │
│   │  module.exports = { PI };                                     │ │
│   └───────────────────────────────────────────────────────────────┘ │
│                                                                      │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │  // Becomes:                                                  │ │
│   │  (function(exports, require, module, __filename, __dirname) { │ │
│   │    const PI = 3.14;                                           │ │
│   │    module.exports = { PI };                                   │ │
│   │  });                                                          │ │
│   └───────────────────────────────────────────────────────────────┘ │
│                                                                      │
│   This gives you:                                                   │
│   • exports     - Shorthand for module.exports                      │
│   • require     - Function to load other modules                    │
│   • module      - Object representing this module                   │
│   • __filename  - Full path to this file                            │
│   • __dirname   - Directory containing this file                    │
│                                                                      │
│   Your variables are PRIVATE (not global)!                          │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### CommonJS vs ES Modules: Detailed Comparison

```javascript
// ════════════════════════════════════════════════════════════════════
// COMMONJS (require/module.exports)
// ════════════════════════════════════════════════════════════════════

// Synchronous loading
const fs = require('fs');  // Blocks until loaded

// Dynamic imports work
const moduleName = 'fs';
const dynamicModule = require(moduleName);

// Conditional imports work
if (process.env.NODE_ENV === 'production') {
  require('./production-logger');
}

// Can modify exports after assignment
module.exports.foo = 'bar';
module.exports.baz = 'qux';

// exports is a shorthand
exports.foo = 'bar';  // Same as module.exports.foo = 'bar'

// BUT: Don't reassign exports!
exports = { foo: 'bar' };  // ❌ This breaks the reference!
module.exports = { foo: 'bar' };  // ✅ This works

// ════════════════════════════════════════════════════════════════════
// ES MODULES (import/export)
// ════════════════════════════════════════════════════════════════════

// Static analysis - imports must be top-level
import fs from 'fs';

// Named exports
export const PI = 3.14;
export function add(a, b) { return a + b; }

// Default export
export default class Calculator {}

// Named imports
import { PI, add } from './math.js';

// Default import
import Calculator from './math.js';

// Namespace import
import * as math from './math.js';

// Dynamic import (returns Promise)
const module = await import('./math.js');

// ════════════════════════════════════════════════════════════════════
// KEY DIFFERENCES
// ════════════════════════════════════════════════════════════════════
```

```
┌─────────────────────────────────────────────────────────────────────┐
│          COMMONJS vs ES MODULES                                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   Feature              │ CommonJS           │ ES Modules            │
│   ─────────────────────┼────────────────────┼───────────────────    │
│   Loading              │ Synchronous        │ Asynchronous          │
│   Parse time           │ Runtime            │ Compile time          │
│   Dynamic imports      │ ✅ require(var)    │ ✅ import()           │
│   Top-level await      │ ❌                 │ ✅                    │
│   Tree shaking         │ ❌                 │ ✅ (static analysis)  │
│   File extension       │ .js, .cjs          │ .mjs or type:module   │
│   this in module       │ exports            │ undefined             │
│   __filename           │ ✅                 │ ❌ (use import.meta)  │
│   JSON import          │ ✅ require()       │ ⚠️ experimental       │
│                                                                      │
│   INTEROPERABILITY:                                                 │
│   • CJS can require() ESM: ❌ (use dynamic import())                │
│   • ESM can import CJS: ✅ (default export only)                    │
│                                                                      │
│   // ESM importing CJS                                              │
│   import pkg from './cjs-module.cjs';  // Gets module.exports       │
│                                                                      │
│   // CJS importing ESM (must be async)                              │
│   async function loadESM() {                                        │
│     const { foo } = await import('./esm-module.mjs');               │
│   }                                                                 │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Cluster Module

### What is Clustering?

The **cluster module** allows you to create child processes that share server ports.

```
┌─────────────────────────────────────────────────────────────────────┐
│                    CLUSTER ARCHITECTURE                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │                     MASTER PROCESS                             │ │
│   │                                                                │ │
│   │   • Spawns worker processes                                   │ │
│   │   • Distributes connections to workers                        │ │
│   │   • Can restart crashed workers                               │ │
│   │   • No application code runs here                             │ │
│   │                                                                │ │
│   └──────────────────────────┬────────────────────────────────────┘ │
│                              │                                       │
│             ┌────────────────┼────────────────┐                     │
│             │                │                │                     │
│             ▼                ▼                ▼                     │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│   │   Worker 1   │  │   Worker 2   │  │   Worker 3   │             │
│   │              │  │              │  │              │             │
│   │  Port 3000   │  │  Port 3000   │  │  Port 3000   │             │
│   │  (shared!)   │  │  (shared!)   │  │  (shared!)   │             │
│   │              │  │              │  │              │             │
│   │  Own V8      │  │  Own V8      │  │  Own V8      │             │
│   │  Own Memory  │  │  Own Memory  │  │  Own Memory  │             │
│   └──────────────┘  └──────────────┘  └──────────────┘             │
│                                                                      │
│   Load Balancing: Round-robin (Linux) or OS-dependent              │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Cluster Example

```javascript
const cluster = require('cluster');
const http = require('http');
const numCPUs = require('os').cpus().length;

if (cluster.isPrimary) {
  console.log(`Primary ${process.pid} is running`);
  
  // Fork workers for each CPU
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
  
  // Handle worker death
  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died`);
    // Restart worker
    cluster.fork();
  });
  
} else {
  // Workers share the same TCP connection
  http.createServer((req, res) => {
    res.writeHead(200);
    res.end(`Hello from worker ${process.pid}\n`);
  }).listen(8000);
  
  console.log(`Worker ${process.pid} started`);
}
```

### IPC (Inter-Process Communication)

```javascript
// Primary process
if (cluster.isPrimary) {
  const worker = cluster.fork();
  
  // Send message to worker
  worker.send({ type: 'config', data: { port: 3000 } });
  
  // Receive message from worker
  worker.on('message', (msg) => {
    console.log('From worker:', msg);
  });
}

// Worker process
if (cluster.isWorker) {
  // Receive message from primary
  process.on('message', (msg) => {
    console.log('From primary:', msg);
    
    // Send response
    process.send({ type: 'ready', pid: process.pid });
  });
}
```

### Complete Production Cluster Example

```javascript
const cluster = require('cluster');
const http = require('http');
const os = require('os');

if (cluster.isPrimary) {
  const numCPUs = os.cpus().length;
  console.log(`Primary ${process.pid} starting ${numCPUs} workers...`);
  
  // Track worker status
  const workers = new Map();
  
  // Fork workers
  for (let i = 0; i < numCPUs; i++) {
    const worker = cluster.fork();
    workers.set(worker.id, {
      pid: worker.process.pid,
      requests: 0,
      startTime: Date.now()
    });
  }
  
  // Handle worker messages
  cluster.on('message', (worker, message) => {
    if (message.type === 'request_handled') {
      const stats = workers.get(worker.id);
      stats.requests++;
    }
  });
  
  // Handle worker death
  cluster.on('exit', (worker, code, signal) => {
    const stats = workers.get(worker.id);
    console.log(`Worker ${worker.process.pid} died after ${stats.requests} requests`);
    console.log(`  Exit code: ${code}, Signal: ${signal}`);
    
    workers.delete(worker.id);
    
    // Restart worker
    console.log('Starting new worker...');
    const newWorker = cluster.fork();
    workers.set(newWorker.id, {
      pid: newWorker.process.pid,
      requests: 0,
      startTime: Date.now()
    });
  });
  
  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully...');
    
    for (const [id, worker] of Object.entries(cluster.workers)) {
      worker.send('shutdown');
    }
    
    setTimeout(() => {
      console.log('Force killing remaining workers...');
      for (const worker of Object.values(cluster.workers)) {
        worker.kill();
      }
      process.exit(0);
    }, 10000);
  });
  
  // Print stats every 10 seconds
  setInterval(() => {
    console.log('\n--- Worker Stats ---');
    for (const [id, stats] of workers) {
      const uptime = Math.round((Date.now() - stats.startTime) / 1000);
      console.log(`Worker ${stats.pid}: ${stats.requests} requests, ${uptime}s uptime`);
    }
  }, 10000);
  
} else {
  // Worker process
  let requestCount = 0;
  
  const server = http.createServer((req, res) => {
    requestCount++;
    
    // Simulate some work
    let result = 0;
    for (let i = 0; i < 100000; i++) {
      result += Math.random();
    }
    
    res.writeHead(200);
    res.end(`Worker ${process.pid} handled request #${requestCount}\n`);
    
    // Notify primary
    process.send({ type: 'request_handled' });
  });
  
  server.listen(8000, () => {
    console.log(`Worker ${process.pid} listening on port 8000`);
  });
  
  // Graceful shutdown
  process.on('message', (msg) => {
    if (msg === 'shutdown') {
      console.log(`Worker ${process.pid} shutting down...`);
      server.close(() => {
        process.exit(0);
      });
    }
  });
  
  // Handle uncaught exceptions
  process.on('uncaughtException', (err) => {
    console.error(`Worker ${process.pid} uncaught exception:`, err);
    // Let it crash - primary will restart
    process.exit(1);
  });
}
```

```
┌─────────────────────────────────────────────────────────────────────┐
│          CLUSTER LOAD BALANCING                                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   Incoming request to port 8000                                     │
│                    │                                                 │
│                    ▼                                                 │
│   ┌────────────────────────────────────────────────────────────┐    │
│   │                     PRIMARY PROCESS                         │    │
│   │                                                             │    │
│   │   Load Balancing Strategy (OS-dependent):                   │    │
│   │                                                             │    │
│   │   Linux: Round-robin (default in Node.js)                   │    │
│   │   ┌─────────────────────────────────────────────────────┐  │    │
│   │   │  Request 1 → Worker 1                               │  │    │
│   │   │  Request 2 → Worker 2                               │  │    │
│   │   │  Request 3 → Worker 3                               │  │    │
│   │   │  Request 4 → Worker 4                               │  │    │
│   │   │  Request 5 → Worker 1 (cycle)                       │  │    │
│   │   └─────────────────────────────────────────────────────┘  │    │
│   │                                                             │    │
│   │   Windows/Other: OS distributes (may not be fair)           │    │
│   │                                                             │    │
│   └────────────────────────────────────────────────────────────┘    │
│                    │                                                 │
│        ┌──────────┼──────────┬──────────┐                          │
│        ▼          ▼          ▼          ▼                          │
│   ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐                      │
│   │Worker 1│ │Worker 2│ │Worker 3│ │Worker 4│                      │
│   │ PID:   │ │ PID:   │ │ PID:   │ │ PID:   │                      │
│   │ 1234   │ │ 1235   │ │ 1236   │ │ 1237   │                      │
│   │        │ │        │ │        │ │        │                      │
│   │ Own V8 │ │ Own V8 │ │ Own V8 │ │ Own V8 │                      │
│   │ Own    │ │ Own    │ │ Own    │ │ Own    │                      │
│   │ Memory │ │ Memory │ │ Memory │ │ Memory │                      │
│   └────────┘ └────────┘ └────────┘ └────────┘                      │
│                                                                      │
│   Shared: Network port (8000)                                       │
│   Isolated: Memory, V8, Event Loop                                  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Zero-Downtime Deployment with Cluster

```javascript
const cluster = require('cluster');
const http = require('http');
const os = require('os');

if (cluster.isPrimary) {
  const workers = [];
  const numCPUs = os.cpus().length;
  
  // Fork initial workers
  for (let i = 0; i < numCPUs; i++) {
    workers.push(cluster.fork());
  }
  
  // Rolling restart for zero-downtime deployments
  function rollingRestart() {
    console.log('Starting rolling restart...');
    
    const restartWorker = (index) => {
      if (index >= workers.length) {
        console.log('Rolling restart complete!');
        return;
      }
      
      const oldWorker = workers[index];
      console.log(`Restarting worker ${oldWorker.process.pid}...`);
      
      // Fork new worker BEFORE killing old one
      const newWorker = cluster.fork();
      
      newWorker.on('listening', () => {
        console.log(`New worker ${newWorker.process.pid} is ready`);
        
        // Now safe to disconnect old worker
        oldWorker.disconnect();
        
        oldWorker.on('disconnect', () => {
          console.log(`Old worker ${oldWorker.process.pid} disconnected`);
          workers[index] = newWorker;
          
          // Small delay before restarting next worker
          setTimeout(() => restartWorker(index + 1), 1000);
        });
        
        // Force kill if takes too long
        setTimeout(() => {
          if (!oldWorker.isDead()) {
            oldWorker.kill();
          }
        }, 5000);
      });
    };
    
    restartWorker(0);
  }
  
  // Trigger rolling restart with SIGUSR2
  process.on('SIGUSR2', rollingRestart);
  
  console.log(`Primary ready. Send SIGUSR2 to PID ${process.pid} for rolling restart`);
  
} else {
  http.createServer((req, res) => {
    res.end(`Worker ${process.pid}\n`);
  }).listen(8000);
}

// Usage:
// 1. Start: node cluster.js
// 2. Deploy new code
// 3. Trigger restart: kill -SIGUSR2 <primary_pid>
// Result: Zero dropped connections during restart!
```

---

## Worker Threads

### What are Worker Threads?

**Worker Threads** allow running JavaScript in parallel threads, sharing memory.

```
┌─────────────────────────────────────────────────────────────────────┐
│                    CLUSTER vs WORKER THREADS                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   CLUSTER (Multi-Process)                                           │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │  • Separate processes                                         │ │
│   │  • Separate memory (no sharing)                               │ │
│   │  • Higher overhead                                            │ │
│   │  • Better for I/O-bound, scaling HTTP servers                 │ │
│   │  • Communicate via IPC (serialization required)               │ │
│   └───────────────────────────────────────────────────────────────┘ │
│                                                                      │
│   WORKER THREADS (Multi-Thread)                                     │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │  • Same process, different threads                            │ │
│   │  • Can share memory (SharedArrayBuffer, Atomics)              │ │
│   │  • Lower overhead                                             │ │
│   │  • Better for CPU-intensive tasks                             │ │
│   │  • Can transfer objects (zero-copy with transferList)         │ │
│   └───────────────────────────────────────────────────────────────┘ │
│                                                                      │
│   ─────────────────────────────────────────────────────────────────  │
│                                                                      │
│   When to use what:                                                 │
│                                                                      │
│   HTTP Server scaling → Cluster                                     │
│   CPU-intensive computation → Worker Threads                        │
│   Parse large JSON → Worker Threads                                 │
│   Image processing → Worker Threads                                 │
│   Video encoding → Worker Threads                                   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Worker Threads Example

```javascript
// main.js
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');

if (isMainThread) {
  // Main thread
  const worker = new Worker(__filename, {
    workerData: { num: 5 }
  });
  
  worker.on('message', (result) => {
    console.log('Factorial:', result);  // 120
  });
  
  worker.on('error', (err) => {
    console.error(err);
  });
  
  worker.on('exit', (code) => {
    console.log(`Worker exited with code ${code}`);
  });
  
} else {
  // Worker thread
  function factorial(n) {
    if (n <= 1) return 1;
    return n * factorial(n - 1);
  }
  
  const result = factorial(workerData.num);
  parentPort.postMessage(result);
}
```

### Shared Memory with SharedArrayBuffer

```javascript
const { Worker, isMainThread } = require('worker_threads');

if (isMainThread) {
  // Create shared memory
  const sharedBuffer = new SharedArrayBuffer(4);  // 4 bytes
  const sharedArray = new Int32Array(sharedBuffer);
  
  sharedArray[0] = 0;  // Initialize counter
  
  // Create workers that share memory
  const workers = [];
  for (let i = 0; i < 4; i++) {
    workers.push(new Worker('./worker.js', {
      workerData: { sharedBuffer }
    }));
  }
  
  // Wait for all workers
  Promise.all(workers.map(w => 
    new Promise(resolve => w.on('exit', resolve))
  )).then(() => {
    console.log('Final count:', sharedArray[0]);
  });
  
} 

// worker.js
const { workerData } = require('worker_threads');
const sharedArray = new Int32Array(workerData.sharedBuffer);

// Atomic operations for thread safety
for (let i = 0; i < 1000; i++) {
  Atomics.add(sharedArray, 0, 1);  // Thread-safe increment
}
```

### Worker Pool Pattern

```javascript
const { Worker } = require('worker_threads');
const os = require('os');

class WorkerPool {
  constructor(workerPath, poolSize = os.cpus().length) {
    this.workerPath = workerPath;
    this.poolSize = poolSize;
    this.workers = [];
    this.queue = [];
    
    // Initialize workers
    for (let i = 0; i < poolSize; i++) {
      this.addWorker();
    }
  }
  
  addWorker() {
    const worker = new Worker(this.workerPath);
    
    worker.on('message', (result) => {
      worker.currentTask.resolve(result);
      worker.currentTask = null;
      this.processQueue();
    });
    
    worker.on('error', (err) => {
      worker.currentTask?.reject(err);
      worker.currentTask = null;
    });
    
    this.workers.push(worker);
  }
  
  run(data) {
    return new Promise((resolve, reject) => {
      this.queue.push({ data, resolve, reject });
      this.processQueue();
    });
  }
  
  processQueue() {
    if (this.queue.length === 0) return;
    
    const availableWorker = this.workers.find(w => !w.currentTask);
    if (!availableWorker) return;
    
    const task = this.queue.shift();
    availableWorker.currentTask = task;
    availableWorker.postMessage(task.data);
  }
}

// Usage
const pool = new WorkerPool('./heavy-computation.js');

// All tasks run in parallel (up to pool size)
const results = await Promise.all([
  pool.run({ task: 'compute1' }),
  pool.run({ task: 'compute2' }),
  pool.run({ task: 'compute3' }),
]);
```

### Complete CPU-Intensive Task Example: Image Processing

```javascript
// main.js - Main thread
const { Worker } = require('worker_threads');
const path = require('path');

function processImage(imagePath, operations) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(path.join(__dirname, 'image-worker.js'), {
      workerData: { imagePath, operations }
    });
    
    worker.on('message', (result) => {
      if (result.type === 'progress') {
        console.log(`Progress: ${result.percent}%`);
      } else if (result.type === 'complete') {
        resolve(result.data);
      }
    });
    
    worker.on('error', reject);
    worker.on('exit', (code) => {
      if (code !== 0) {
        reject(new Error(`Worker stopped with exit code ${code}`));
      }
    });
  });
}

// Process multiple images in parallel
async function processAllImages(images) {
  const results = await Promise.all(
    images.map(img => processImage(img.path, img.operations))
  );
  return results;
}

// Usage
const images = [
  { path: 'img1.jpg', operations: ['resize', 'grayscale'] },
  { path: 'img2.jpg', operations: ['resize', 'blur'] },
  { path: 'img3.jpg', operations: ['resize', 'sharpen'] },
];

processAllImages(images).then(results => {
  console.log('All images processed:', results);
});
```

```javascript
// image-worker.js - Worker thread
const { parentPort, workerData } = require('worker_threads');
const sharp = require('sharp');  // Popular image processing library

async function processImage() {
  const { imagePath, operations } = workerData;
  
  let image = sharp(imagePath);
  
  for (let i = 0; i < operations.length; i++) {
    const op = operations[i];
    
    // Report progress
    parentPort.postMessage({
      type: 'progress',
      percent: Math.round((i / operations.length) * 100)
    });
    
    // Apply operation
    switch (op) {
      case 'resize':
        image = image.resize(800, 600);
        break;
      case 'grayscale':
        image = image.grayscale();
        break;
      case 'blur':
        image = image.blur(5);
        break;
      case 'sharpen':
        image = image.sharpen();
        break;
    }
  }
  
  const buffer = await image.toBuffer();
  
  // Send result with transferable (zero-copy)
  parentPort.postMessage({
    type: 'complete',
    data: buffer
  }, [buffer.buffer]);  // Transfer the ArrayBuffer
}

processImage().catch(err => {
  parentPort.postMessage({ type: 'error', message: err.message });
});
```

```
┌─────────────────────────────────────────────────────────────────────┐
│          WORKER THREADS DATA TRANSFER                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   METHOD 1: Structured Clone (default)                              │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │  worker.postMessage({ data: largeArray });                    │ │
│   │                                                               │ │
│   │  • Data is COPIED (serialized + deserialized)                 │ │
│   │  • Safe: original data unchanged                              │ │
│   │  • Slow for large data                                        │ │
│   │  • Works with most JS types                                   │ │
│   │  • NOT: Functions, Errors, DOM nodes                          │ │
│   └───────────────────────────────────────────────────────────────┘ │
│                                                                      │
│   METHOD 2: Transferable Objects (zero-copy)                        │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │  const buffer = new ArrayBuffer(1024);                        │ │
│   │  worker.postMessage({ data: buffer }, [buffer]);              │ │
│   │                       ▲                ▲                      │ │
│   │                    message      transferList                  │ │
│   │                                                               │ │
│   │  • Data is MOVED (ownership transferred)                      │ │
│   │  • Original buffer becomes unusable (detached)!               │ │
│   │  • Very fast for large binary data                            │ │
│   │  • Works with: ArrayBuffer, MessagePort                       │ │
│   └───────────────────────────────────────────────────────────────┘ │
│                                                                      │
│   METHOD 3: SharedArrayBuffer (shared memory)                       │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │  const shared = new SharedArrayBuffer(1024);                  │ │
│   │  worker.postMessage({ data: shared });                        │ │
│   │                                                               │ │
│   │  • Same memory readable/writable by both threads              │ │
│   │  • MUST use Atomics for thread safety!                        │ │
│   │  • Complex but most efficient for frequent updates            │ │
│   └───────────────────────────────────────────────────────────────┘ │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Practical Example: Parallel JSON Parsing

```javascript
// When parsing huge JSON blocks the event loop
// Solution: Parse in worker threads

const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');

if (isMainThread) {
  // Main thread
  
  function parseJSONInWorker(jsonString) {
    return new Promise((resolve, reject) => {
      const worker = new Worker(__filename, {
        workerData: jsonString
      });
      
      worker.on('message', resolve);
      worker.on('error', reject);
    });
  }
  
  // Usage
  const hugeJSONString = '{"data": [' + Array(1000000).fill('{"id":1}').join(',') + ']}';
  
  console.log('Main thread: Starting parse');
  console.log('JSON string length:', hugeJSONString.length);
  
  const start = Date.now();
  parseJSONInWorker(hugeJSONString).then(result => {
    console.log(`Parsed ${result.data.length} items in ${Date.now() - start}ms`);
  });
  
  // Main thread can still handle other requests!
  setInterval(() => {
    console.log('Main thread: Still responsive! ' + Date.now());
  }, 100);
  
} else {
  // Worker thread
  const parsed = JSON.parse(workerData);
  parentPort.postMessage(parsed);
}
```

---

## Memory Management

### Node.js Memory Limits

```javascript
// Default heap limit: ~1.4GB on 64-bit systems

// Check current memory usage
console.log(process.memoryUsage());
// {
//   rss: 30000000,        // Resident Set Size (total memory)
//   heapTotal: 10000000,  // V8 heap allocated
//   heapUsed: 5000000,    // V8 heap used
//   external: 1000000,    // C++ objects bound to JS
//   arrayBuffers: 500000  // ArrayBuffers, SharedArrayBuffers
// }

// Increase memory limit (command line)
// node --max-old-space-size=4096 app.js  // 4GB

// V8 flags
// node --v8-options | grep memory
```

### Memory Leaks Common Causes

```javascript
// 1. Global variables
global.cache = {};  // Never garbage collected!

// 2. Closures holding references
function createLeak() {
  const largeData = new Array(1000000).fill('x');
  
  return function() {
    // This closure holds reference to largeData forever
    console.log(largeData.length);
  };
}
const leakyFn = createLeak();  // largeData stuck in memory

// 3. Event listeners not removed
const EventEmitter = require('events');
const emitter = new EventEmitter();

function handler() { /* ... */ }
emitter.on('event', handler);
// If you never call: emitter.off('event', handler)
// And you keep adding handlers, memory grows!

// 4. Timers not cleared
const interval = setInterval(() => {
  // References kept alive
}, 1000);
// Must call: clearInterval(interval)

// 5. Caching without limits
const cache = new Map();
function fetchData(id) {
  if (!cache.has(id)) {
    cache.set(id, expensiveOperation(id));
  }
  return cache.get(id);
}
// Cache grows unbounded!

// Fix: Use LRU cache with limit
const LRU = require('lru-cache');
const cache = new LRU({ max: 500 });  // Max 500 items
```

### Profiling Memory

```javascript
// Force garbage collection (for testing only)
// Run with: node --expose-gc app.js
if (global.gc) {
  global.gc();
}

// Heap snapshot
const v8 = require('v8');
const fs = require('fs');

// Write heap snapshot
const snapshotFile = `heap-${Date.now()}.heapsnapshot`;
fs.writeFileSync(snapshotFile, v8.serialize(v8.getHeapSnapshot()));
// Analyze with Chrome DevTools → Memory tab

// Get heap statistics
console.log(v8.getHeapStatistics());
// {
//   total_heap_size: 10000000,
//   total_heap_size_executable: 500000,
//   total_physical_size: 9000000,
//   total_available_size: 1500000000,
//   used_heap_size: 5000000,
//   heap_size_limit: 1500000000,
//   ...
// }
```

---

## Performance Optimization

### Async Best Practices

```javascript
// ❌ Bad: Sequential async operations
async function fetchAllSequential(ids) {
  const results = [];
  for (const id of ids) {
    results.push(await fetchData(id));  // Waits for each!
  }
  return results;
}
// Time: N * fetchTime

// ✅ Good: Parallel async operations
async function fetchAllParallel(ids) {
  return Promise.all(ids.map(id => fetchData(id)));
}
// Time: max(fetchTime) - much faster!

// ✅ Better: Parallel with concurrency limit
async function fetchAllLimited(ids, limit = 5) {
  const results = [];
  for (let i = 0; i < ids.length; i += limit) {
    const chunk = ids.slice(i, i + limit);
    const chunkResults = await Promise.all(
      chunk.map(id => fetchData(id))
    );
    results.push(...chunkResults);
  }
  return results;
}
```

### Event Loop Best Practices

```javascript
// ❌ Bad: Blocking the event loop
function processData(data) {
  // CPU-intensive synchronous operation
  for (let i = 0; i < 1000000000; i++) {
    // Heavy computation
  }
  return result;
}

// ✅ Good: Break up work
function processDataAsync(data, callback) {
  const chunkSize = 1000;
  let index = 0;
  
  function processChunk() {
    const end = Math.min(index + chunkSize, data.length);
    
    for (; index < end; index++) {
      // Process item
    }
    
    if (index < data.length) {
      // Schedule next chunk, allow I/O
      setImmediate(processChunk);
    } else {
      callback(result);
    }
  }
  
  processChunk();
}

// ✅ Better: Use worker threads for CPU-intensive tasks
const { Worker } = require('worker_threads');

function processDataWorker(data) {
  return new Promise((resolve, reject) => {
    const worker = new Worker('./processor.js', { workerData: data });
    worker.on('message', resolve);
    worker.on('error', reject);
  });
}
```

### Optimization Tips

```
┌─────────────────────────────────────────────────────────────────────┐
│                    PERFORMANCE TIPS                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   1. USE STREAMS FOR LARGE DATA                                      │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │  ❌ fs.readFile('large.txt')     // Loads entire file         │ │
│   │  ✅ fs.createReadStream('large.txt')  // Streams chunks       │ │
│   └───────────────────────────────────────────────────────────────┘ │
│                                                                      │
│   2. AVOID BLOCKING OPERATIONS                                       │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │  ❌ fs.readFileSync()            // Blocks event loop         │ │
│   │  ❌ JSON.parse(hugeString)       // Blocks event loop         │ │
│   │  ✅ Use async versions                                        │ │
│   │  ✅ Use worker threads for CPU work                           │ │
│   └───────────────────────────────────────────────────────────────┘ │
│                                                                      │
│   3. INCREASE THREAD POOL FOR I/O-HEAVY APPS                        │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │  UV_THREADPOOL_SIZE=16 node app.js                            │ │
│   │  (Especially for many fs or crypto operations)                │ │
│   └───────────────────────────────────────────────────────────────┘ │
│                                                                      │
│   4. USE CACHING WISELY                                             │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │  • Use LRU cache with size limits                             │ │
│   │  • Cache expensive computations                               │ │
│   │  • Cache database queries                                     │ │
│   │  • Use Redis for distributed caching                          │ │
│   └───────────────────────────────────────────────────────────────┘ │
│                                                                      │
│   5. MONITOR AND PROFILE                                            │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │  • node --prof app.js (CPU profiling)                         │ │
│   │  • node --inspect app.js (Chrome DevTools)                    │ │
│   │  • clinic.js for diagnostics                                  │ │
│   │  • 0x for flamegraphs                                         │ │
│   └───────────────────────────────────────────────────────────────┘ │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Common Issues and Debugging

### Issue 1: Event Loop Blocked

```javascript
// ❌ Problem: Synchronous operation blocks event loop
const crypto = require('crypto');
const http = require('http');

http.createServer((req, res) => {
  // This blocks for ~500ms - ALL other requests wait!
  const hash = crypto.pbkdf2Sync('password', 'salt', 100000, 64, 'sha512');
  res.end('Done');
}).listen(3000);

// ✅ Solution 1: Use async version
http.createServer((req, res) => {
  crypto.pbkdf2('password', 'salt', 100000, 64, 'sha512', (err, hash) => {
    res.end('Done');
  });
}).listen(3000);

// ✅ Solution 2: Use worker threads for CPU-intensive tasks
const { Worker } = require('worker_threads');

http.createServer((req, res) => {
  const worker = new Worker('./hash-worker.js');
  worker.on('message', (hash) => {
    res.end('Done');
  });
}).listen(3000);
```

### Issue 2: Memory Leak from Event Listeners

```javascript
const EventEmitter = require('events');
const emitter = new EventEmitter();

// ❌ Problem: Adding listeners in a loop without removing
function handleConnection(socket) {
  // Every connection adds a listener that's never removed!
  emitter.on('broadcast', (msg) => {
    socket.write(msg);
  });
}

// Warning appears after 10 listeners:
// MaxListenersExceededWarning: Possible EventEmitter memory leak detected

// ✅ Solution 1: Remove listener when done
function handleConnection(socket) {
  const listener = (msg) => socket.write(msg);
  emitter.on('broadcast', listener);
  
  socket.on('close', () => {
    emitter.removeListener('broadcast', listener);
  });
}

// ✅ Solution 2: Use once() for one-time listeners
emitter.once('ready', () => {
  console.log('Only runs once, auto-removed');
});
```

### Issue 3: Unhandled Promise Rejections

```javascript
// ❌ Problem: Unhandled promise rejection crashes in Node 15+
async function fetchData() {
  const response = await fetch('https://invalid-url');
  return response.json();
}

fetchData();  // No .catch()! Will crash!

// ✅ Solution 1: Always handle errors
fetchData()
  .then(data => console.log(data))
  .catch(err => console.error('Fetch failed:', err));

// ✅ Solution 2: Global handler (for monitoring)
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
  // Log to monitoring service
  // In production, consider graceful shutdown
});

// ✅ Solution 3: Use try/catch with async/await
async function main() {
  try {
    const data = await fetchData();
    console.log(data);
  } catch (err) {
    console.error('Error:', err);
  }
}
```

### Issue 4: Memory Leaks from Closures

```javascript
// ❌ Problem: Closure holds reference to large data
function processFile(filename) {
  const largeData = fs.readFileSync(filename);  // 100MB file
  
  return function query(key) {
    // This closure holds reference to largeData FOREVER
    // Even if we only use a small part
    return largeData.includes(key);
  };
}

const search = processFile('huge-file.txt');
// largeData (100MB) stuck in memory even if we never call search again!

// ✅ Solution: Only keep what you need
function processFile(filename) {
  const largeData = fs.readFileSync(filename);
  const index = buildIndex(largeData);  // Extract what we need
  // largeData can now be garbage collected
  
  return function query(key) {
    return index.has(key);  // Only holds index, not original data
  };
}
```

### Debugging Tools and Techniques

```javascript
// 1. Heap Snapshot (find memory leaks)
const v8 = require('v8');
const fs = require('fs');

// Take snapshot
const snapshotFile = `heap-${Date.now()}.heapsnapshot`;
const stream = v8.writeHeapSnapshot(snapshotFile);
console.log(`Heap snapshot written to ${snapshotFile}`);
// Open in Chrome DevTools → Memory tab

// 2. CPU Profiling
// node --prof app.js
// node --prof-process isolate-0x....log > profile.txt

// 3. Async Stack Traces (Node 12+)
// node --async-stack-traces app.js

// 4. Inspect Mode
// node --inspect app.js
// node --inspect-brk app.js  // Break on first line

// 5. Monitor event loop lag
const start = process.hrtime();

setImmediate(() => {
  const lag = process.hrtime(start);
  const lagMs = lag[0] * 1000 + lag[1] / 1000000;
  console.log(`Event loop lag: ${lagMs.toFixed(2)}ms`);
});

// 6. Track active handles and requests
console.log('Active handles:', process._getActiveHandles().length);
console.log('Active requests:', process._getActiveRequests().length);
```

```
┌─────────────────────────────────────────────────────────────────────┐
│          DEBUGGING CHECKLIST                                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   🐢 APP SLOW / UNRESPONSIVE?                                       │
│   □ Check for sync operations in request path                        │
│   □ Check for CPU-intensive operations blocking event loop           │
│   □ Check thread pool size vs I/O-heavy operations                   │
│   □ Profile with --prof or clinic.js                                 │
│                                                                      │
│   💾 MEMORY KEEPS GROWING?                                          │
│   □ Take heap snapshots, compare over time                           │
│   □ Check for global variables / caches without limits               │
│   □ Check for event listeners not being removed                      │
│   □ Check for closures holding large objects                         │
│   □ Check for unclosed streams/connections                           │
│                                                                      │
│   💥 CRASHES / EXCEPTIONS?                                          │
│   □ Add process.on('uncaughtException')                              │
│   □ Add process.on('unhandledRejection')                             │
│   □ Check for missing error handling in callbacks                    │
│   □ Check for missing .catch() on promises                           │
│                                                                      │
│   🔌 CONNECTIONS ISSUES?                                            │
│   □ Check for connection pool exhaustion                             │
│   □ Check for socket/file descriptor leaks                           │
│   □ Check timeout settings                                           │
│   □ Use process._getActiveHandles()                                  │
│                                                                      │
│   🛠️ USEFUL COMMANDS:                                               │
│   □ node --inspect app.js (Chrome DevTools)                          │
│   □ node --prof app.js (CPU profile)                                 │
│   □ node --trace-warnings app.js                                     │
│   □ NODE_DEBUG=* node app.js (verbose logging)                       │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Interview Questions

### Q1: Explain the Node.js architecture

<details>
<summary>Answer</summary>

Node.js consists of several core components:

1. **V8 Engine**: Executes JavaScript, handles memory, garbage collection
2. **libuv**: Provides event loop, async I/O, thread pool
3. **C++ Bindings**: Bridge between JavaScript and system operations
4. **Core Modules**: Built-in JavaScript modules (fs, http, etc.)

**Flow:**
1. JavaScript calls Node.js API
2. C++ bindings translate call
3. libuv handles async operation
4. Result returned via callback/promise

</details>

### Q2: What is the difference between the thread pool and async I/O?

<details>
<summary>Answer</summary>

**Thread Pool (libuv):**
- Used for operations without async OS API
- File system operations (fs module)
- DNS lookup (dns.lookup)
- Crypto operations
- Default 4 threads, configurable with UV_THREADPOOL_SIZE

**Async I/O (OS level):**
- Network operations (http, net, etc.)
- DNS resolve (uses network)
- Uses OS mechanisms: epoll (Linux), kqueue (macOS), IOCP (Windows)
- No thread pool needed

**Key difference**: Thread pool is a workaround for blocking operations; async I/O uses native OS async capabilities.

</details>

### Q3: Explain streams and backpressure

<details>
<summary>Answer</summary>

**Streams** are collections of data processed in chunks:
- Readable: fs.createReadStream, http.IncomingMessage
- Writable: fs.createWriteStream, http.ServerResponse
- Duplex: Both (net.Socket)
- Transform: Modifies data (zlib.createGzip)

**Backpressure** occurs when writable can't keep up with readable:

```javascript
// Without handling: memory grows!
readable.on('data', chunk => writable.write(chunk));

// With handling:
readable.pipe(writable);  // Automatic backpressure
// Or manually pause/resume based on writable.write() return value
```

Benefits of streams:
- Low memory usage
- Fast time-to-first-byte
- Can process unlimited data

</details>

### Q4: What's the difference between cluster and worker_threads?

<details>
<summary>Answer</summary>

**Cluster Module:**
- Creates separate processes
- No shared memory
- Higher overhead
- Best for: HTTP server scaling
- IPC requires serialization

**Worker Threads:**
- Creates threads in same process
- Can share memory (SharedArrayBuffer)
- Lower overhead
- Best for: CPU-intensive tasks
- Can transfer objects without copying

**When to use:**
- Scaling web servers → Cluster
- CPU-heavy computation → Worker Threads
- Image/video processing → Worker Threads
- Multiple isolated Node instances → Cluster

</details>

### Q5: How does require() work?

<details>
<summary>Answer</summary>

**Resolution:**
1. Core module? Use built-in
2. Starts with `./` or `/`? Resolve as file/directory
3. Search node_modules (walk up directory tree)

**Loading:**
1. Check cache (require.cache)
2. Wrap in module wrapper function
3. Execute code
4. Return module.exports
5. Cache module

**Module wrapper:**
```javascript
(function(exports, require, module, __filename, __dirname) {
  // Your code
});
```

**Caching:**
- Modules cached by absolute path
- Same object returned on subsequent requires
- Clear with: delete require.cache[require.resolve('./mod')]

</details>

### Q6: How do you handle memory leaks in Node.js?

<details>
<summary>Answer</summary>

**Common causes:**
1. Global variables
2. Closures holding references
3. Event listeners not removed
4. Unclosed timers
5. Unbounded caches

**Detection:**
```javascript
// Monitor memory
process.memoryUsage();

// Heap snapshot
const v8 = require('v8');
v8.getHeapSnapshot();

// Use tools
// node --inspect app.js
// clinic.js, memwatch-next
```

**Prevention:**
- Use WeakMap/WeakSet for caches
- Remove event listeners (removeListener)
- Clear timers (clearInterval/clearTimeout)
- Use LRU caches with limits
- Avoid global variables

</details>

### Q7: Explain the V8 garbage collection

<details>
<summary>Answer</summary>

**Memory structure:**
- **New Space**: Small, for new objects, Scavenger GC
- **Old Space**: Large, for survivors, Mark-Sweep-Compact GC

**GC types:**

1. **Scavenger (Minor GC)**:
   - Young generation
   - Very fast (1-2ms)
   - Copying collector
   - Runs frequently

2. **Mark-Sweep-Compact (Major GC)**:
   - Old generation
   - Mark reachable objects
   - Sweep unmarked
   - Compact to reduce fragmentation
   - Slower (10-100ms+)

**Optimization:**
- Incremental marking (break work into steps)
- Concurrent marking (parallel to JS)
- Idle-time GC

</details>

### Q8: What is the purpose of process.nextTick?

<details>
<summary>Answer</summary>

`process.nextTick()` adds callback to the nextTick queue, which runs:
- After current operation completes
- Before event loop continues
- Before any I/O, timers, or other callbacks

**Use cases:**
1. Emit events after constructor
2. Allow users to add handlers before async operation
3. Ensure consistent async behavior

```javascript
class MyEmitter extends EventEmitter {
  constructor() {
    super();
    // Emit AFTER constructor so users can add listeners
    process.nextTick(() => this.emit('ready'));
  }
}
```

**Danger**: Recursive nextTick starves I/O!

```javascript
// ❌ Starves event loop
function recursive() {
  process.nextTick(recursive);
}
```

</details>

### Q9: How do you debug performance issues in Node.js?

<details>
<summary>Answer</summary>

**1. CPU Profiling:**
```bash
node --prof app.js
node --prof-process isolate-*.log > profile.txt
```

**2. Chrome DevTools:**
```bash
node --inspect app.js
# Open chrome://inspect
```

**3. Event Loop Monitoring:**
```javascript
// Check event loop lag
const start = process.hrtime();
setImmediate(() => {
  const lag = process.hrtime(start);
  console.log('Lag:', lag[1] / 1000000, 'ms');
});
```

**4. Memory Analysis:**
```javascript
// Heap snapshot
const v8 = require('v8');
v8.writeHeapSnapshot();

// Memory usage
console.log(process.memoryUsage());
```

**Tools:**
- clinic.js (flamegraphs, bubbleprof)
- 0x (flamegraphs)
- node-inspect
- trace_events module

</details>

### Q10: Explain the difference between process.nextTick, Promise.then, setTimeout, and setImmediate

<details>
<summary>Answer</summary>

**Execution Order (after sync code):**

1. **process.nextTick** - Highest priority
   - Runs immediately after current operation
   - Before event loop continues
   - Can starve I/O if recursive

2. **Promise.then** - Microtasks
   - Runs after nextTick queue empties
   - Before event loop phases

3. **setTimeout(fn, 0)** - Timers phase
   - Actually minimum ~1ms delay
   - Runs in Timers phase
   - Order with setImmediate is undefined at top level

4. **setImmediate** - Check phase
   - Runs in Check phase (after Poll)
   - Inside I/O callbacks, always runs BEFORE setTimeout

```javascript
console.log('1. sync');
process.nextTick(() => console.log('2. nextTick'));
Promise.resolve().then(() => console.log('3. promise'));
setTimeout(() => console.log('4 or 5. setTimeout'), 0);
setImmediate(() => console.log('4 or 5. setImmediate'));
// Output: 1, 2, 3, (4/5 or 5/4)
```

</details>

### Q11: How would you handle a CPU-intensive task in Node.js?

<details>
<summary>Answer</summary>

**Options:**

1. **Worker Threads** (recommended for CPU tasks)
```javascript
const { Worker } = require('worker_threads');

const worker = new Worker('./cpu-task.js', {
  workerData: { input: data }
});
worker.on('message', result => console.log(result));
```

2. **Child Processes**
```javascript
const { fork } = require('child_process');
const child = fork('./cpu-task.js');
child.send({ input: data });
child.on('message', result => console.log(result));
```

3. **Break into chunks with setImmediate**
```javascript
function processChunk(index) {
  // Process part of work
  if (index < total) {
    setImmediate(() => processChunk(index + 1));
  }
}
```

4. **External Service** (for very heavy work)
   - Offload to a microservice
   - Use message queue (Redis, RabbitMQ)

**When to use each:**
- Worker Threads: CPU-bound, need shared memory
- Child Processes/Fork: Isolation needed, separate Node instance
- setImmediate: Light work, want to stay responsive
- External: Very heavy or specialized processing

</details>

### Q12: What happens when you require() a module?

<details>
<summary>Answer</summary>

**Step-by-step:**

1. **Resolve path**
   - Core module? Use built-in
   - Starts with ./ or /? Resolve as file/directory
   - Otherwise, search node_modules

2. **Check cache**
   ```javascript
   require.cache[absolutePath]  // Return if exists
   ```

3. **Create module object**
   ```javascript
   const module = {
     id: absolutePath,
     exports: {},
     loaded: false,
     ...
   };
   ```

4. **Wrap in function**
   ```javascript
   (function(exports, require, module, __filename, __dirname) {
     // Your code here
   })
   ```

5. **Execute**
   - Run the wrapper function
   - Code can modify module.exports

6. **Cache the module**
   - Store module in cache
   - Mark as loaded

7. **Return module.exports**

**Key points:**
- Modules are singletons (cached)
- Circular deps get incomplete exports
- Execution is synchronous
- Each module has own scope

</details>

---

## Summary

```
┌─────────────────────────────────────────────────────────────────────┐
│                    NODE.JS INTERNALS CHEAT SHEET                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   ARCHITECTURE                                                       │
│   • V8: JavaScript engine, memory management, GC                    │
│   • libuv: Event loop, async I/O, thread pool                       │
│   • C++ bindings: Bridge JS to system calls                         │
│                                                                      │
│   EVENT LOOP (6 Phases)                                             │
│   • Timers → Pending → Poll → Check → Close → [repeat]             │
│   • nextTick & microtasks run between phases                        │
│                                                                      │
│   THREAD POOL                                                       │
│   • 4 threads default (UV_THREADPOOL_SIZE)                          │
│   • Used for: fs, dns.lookup, crypto, zlib                          │
│   • NOT for: network I/O (uses OS async)                            │
│                                                                      │
│   STREAMS                                                           │
│   • Readable, Writable, Duplex, Transform                           │
│   • Low memory, chunked processing                                  │
│   • Backpressure: pause when destination is slow                    │
│                                                                      │
│   MODULES                                                           │
│   • CommonJS: require, module.exports, synchronous                  │
│   • ES Modules: import/export, static, async                        │
│   • Resolution: core → file → node_modules                          │
│                                                                      │
│   SCALING                                                           │
│   • Cluster: Multi-process, shared ports, IPC                       │
│   • Worker Threads: Multi-thread, shared memory                     │
│                                                                      │
│   MEMORY                                                            │
│   • Young generation: Scavenger GC (fast)                           │
│   • Old generation: Mark-Sweep-Compact (slow)                       │
│   • --max-old-space-size to increase heap                           │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Further Reading

- [Node.js Official Docs](https://nodejs.org/en/docs/)
- [libuv Documentation](https://libuv.org/)
- [V8 Blog](https://v8.dev/blog)
- [Node.js Event Loop Explained](https://nodejs.org/en/docs/guides/event-loop-timers-and-nexttick/)
- [Understanding the Node.js Event Loop](https://nodesource.com/blog/understanding-the-nodejs-event-loop/)


