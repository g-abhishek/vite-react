# Frontend Performance Engineering & React Optimization — Complete Handbook (Basics to Advanced)

> A textbook-style handbook for senior frontend engineers (5–10+ years): browser internals, JavaScript runtime, React rendering, memory, Web Vitals, production debugging, and scalability — from first principles to production optimization. Designed as a **30–60 day interview preparation roadmap**.

**Companion docs:** [`01-Event-Loop.md`](./01-Event-Loop.md) (event loop deep dive), [`04-React-Internals.md`](./04-React-Internals.md) (Fiber, reconciliation, hooks), [`09-React-Interview-Complete-Guide.md`](./09-React-Interview-Complete-Guide.md), [`10-Instagram-Comment-Section-Complete-Guide.md`](./10-Instagram-Comment-Section-Complete-Guide.md) (comment list performance patterns).

**How to use this handbook:** Read Sections 1–10 in week 1–2 (browser + runtime). Sections 11–20 in week 3–4 (React). Sections 21–24 in week 5 (production). Sections 25–27 for interview drills and projects. For each topic, complete the **Hands-on exercise** before moving on.

---

## Table of Contents

### Foundations & Browser
1. [Performance Engineering Fundamentals](#1-performance-engineering-fundamentals)
2. [Browser Architecture](#2-browser-architecture)
3. [What Happens When You Enter a URL](#3-what-happens-when-you-enter-a-url)
4. [Browser Rendering Pipeline](#4-browser-rendering-pipeline)
5. [JavaScript Engine Internals (V8)](#5-javascript-engine-internals-v8)
6. [Event Loop Deep Dive](#6-event-loop-deep-dive)
7. [Memory Management](#7-memory-management)
8. [Garbage Collection](#8-garbage-collection)
9. [Memory Leaks](#9-memory-leaks)
10. [Web Vitals Complete Deep Dive](#10-web-vitals-complete-deep-dive)

### React & Optimization
11. [React Architecture](#11-react-architecture)
12. [React Rendering](#12-react-rendering)
13. [React Performance Optimization](#13-react-performance-optimization)
14. [Large List Optimization](#14-large-list-optimization)
15. [Network Optimization](#15-network-optimization)
16. [Bundle Optimization](#16-bundle-optimization)
17. [Image Optimization](#17-image-optimization)
18. [SSR, SSG, ISR, CSR](#18-ssr-ssg-isr-csr)
19. [Hydration](#19-hydration)
20. [Concurrent React](#20-concurrent-react)
21. [Web Workers](#21-web-workers)
22. [Caching](#22-caching)

### Production & Interview
23. [Performance Monitoring](#23-performance-monitoring)
24. [Real-World Performance Case Studies](#24-real-world-performance-case-studies)
25. [Senior Frontend Interview Masterclass](#25-senior-frontend-interview-masterclass)
26. [Practical Projects](#26-practical-projects)
27. [Frontend Performance Mind Map](#27-frontend-performance-mind-map)

---

## Topic Template (Used Throughout)

Every major topic below includes:

| # | Element | Purpose |
|---|---------|---------|
| 1 | What it is | Definition |
| 2 | Why it exists | Historical / technical motivation |
| 3 | Problem it solves | User or system pain |
| 4 | Real-world analogy | Mental model |
| 5 | Browser-level explanation | What the engine does |
| 6 | Internal working | Mechanism |
| 7 | React-specific implications | How it affects React apps |
| 8 | Practical examples | Runnable or realistic code |
| 9 | ASCII diagrams | Visual flow |
| 10 | Common mistakes | BAD vs GOOD |
| 11 | Performance impact | Metrics / cost |
| 12 | Debugging strategies | Tools and workflow |
| 13 | Trade-offs | When not to use |
| 14 | Interview questions | Core Q&A |
| 15 | Senior-level discussion | System design angle |
| 16 | Production use cases | Who does what |
| 17 | Follow-up questions | What interviewers ask next |
| 18 | Hands-on exercises | Practice |

---

# SECTION 1: PERFORMANCE ENGINEERING FUNDAMENTALS

## 1. Performance Engineering Fundamentals

### 1.1 What is frontend performance?

**What it is:** Frontend performance is how quickly and smoothly a web application **delivers, parses, executes, renders, and responds** to user input — measured objectively (metrics) and subjectively (perceived speed).

**Why it exists:** The web started as documents. Applications now ship megabytes of JS, run complex UIs, and compete with native apps. Without a discipline around performance, teams ship features that feel fast on a MacBook on Wi‑Fi and fail on mid-range Android on 4G.

**Problem it solves:** Unpredictable UX, high bounce rates, poor SEO, ad/revenue loss, and operational cost (more CPU, more support tickets).

**Analogy:** A restaurant — **delivery** (network), **kitchen prep** (parse/compile JS), **plating** (render), **service** (interaction). A slow kitchen with a fast waiter still feels bad.

```
WITHOUT performance discipline          WITH performance discipline
┌─────────────────────────┐            ┌─────────────────────────┐
│ Ship features → measure │            │ Budget → build → measure│
│ only when users complain│            │ → regress in CI         │
└─────────────────────────┘            └─────────────────────────┘
```

### 1.2 Why performance matters — business impact

| Company | Pattern | Impact |
|---------|---------|--------|
| **Amazon** | 100ms latency → ~1% sales loss (often cited in industry studies) | Checkout and search are revenue-critical |
| **Netflix** | Adaptive bitrate + fast startup | Retention tied to time-to-first-frame |
| **YouTube** | Thumbnail + lazy load + prefetch | Watch time scales with perceived speed |
| **Instagram** | Feed virtualization, image sizing | Scroll session length |
| **BookMyShow** | Seat map interactivity under load | Conversion on high-traffic release days |

**React implication:** Business metrics map to **LCP** (hero content), **INP** (taps), **CLS** (layout stability). Optimizing React without measuring these is guesswork.

### 1.3 User-perceived vs actual performance

| Type | Definition | Example |
|------|------------|---------|
| **Actual** | Wall-clock, instrumented | LCP = 2.1s |
| **Perceived** | What user *feels* | Skeleton UI makes 2.1s feel acceptable |

**Instagram:** Shows gray placeholders and progressive JPEGs — LCP element may arrive late but **perceived** readiness is earlier.

**YouTube:** Instant search suggestions (cached/prefetched) while full results load.

```javascript
// Perceived performance: optimistic UI
function LikeButton({ postId }) {
  const [liked, setLiked] = useState(false);
  const handleClick = () => {
    setLiked(true); // UI updates immediately
    api.like(postId).catch(() => setLiked(false)); // reconcile later
  };
  return <button onClick={handleClick}>{liked ? '♥' : '♡'}</button>;
}
```

### 1.4 Performance budgets

**What:** Hard limits on metrics or resources (JS KB, LCP ms, image weight).

**Why:** Prevents death by a thousand PRs.

**Example budget (product listing — Amazon-style):**

| Resource | Budget | Rationale |
|----------|--------|-----------|
| JS (gzip) | 150 KB initial | Parse cost on mobile |
| LCP | < 2.5s (p75) | Core Web Vitals "good" |
| Images above fold | WebP, < 100 KB each | LCP often = hero image |
| Third-party | < 50 KB | Analytics tags add up |

### 1.5 RAIL model

Google's **RAIL** (Response, Animation, Idle, Load):

```
User action ──► Response < 100ms (feedback)
Animation ─────► 60fps → 16.7ms per frame
Idle ───────────► chunk work in 50ms slices (main thread)
Load ───────────► meaningful content < 1s (goal; adjust per app)
```

| Phase | Target | React tie-in |
|-------|--------|--------------|
| Response | 100ms | `startTransition` for non-urgent updates |
| Animation | 16ms/frame | Avoid layout in `mousemove`; use `transform` |
| Idle | 50ms chunks | Code-split heavy routes |
| Load | Fast FCP/LCP | SSR/SSG, preload LCP image |

### 1.6 Critical Rendering Path (CRP)

**Path:** HTML → DOM + CSS → CSSOM → Render Tree → Layout → Paint → Composite.

```
HTML bytes ──► Parser ──► DOM
                          │
CSS bytes ───► Parser ──► CSSOM ──┐
                                  ├──► Render Tree ──► Layout ──► Paint ──► Composite
                                  │
Blocking JS ──► can delay HTML parsing (without defer/async)
```

**Netflix landing:** Minimize render-blocking CSS; inline critical CSS for hero; defer non-critical.

### 1.7 Metrics vs user experience

Not every metric equals UX. **Low CLS + slow INP** = stable but frustrating. Use **field data** (RUM) + **lab** (Lighthouse) + **session replay**.

**Debugging:** Chrome UX Report, Search Console, your RUM (Datadog, Sentry, web-vitals).

**Interview Q:** *Why optimize for Web Vitals instead of only Lighthouse score?*  
**Expected:** Lighthouse is lab/synthetic; Vitals reflect real users (devices, networks).  
**Senior:** Discuss p75 vs p95, segment by market (Flipkart India mobile), and guard against optimizing one metric while harming another (e.g. lazy LCP image hurts LCP but helps TTI).

**Hands-on:** Pick one route in your app; list CRP resources in DevTools Network (blocking vs async). Set a one-page budget.

---

# SECTION 2: BROWSER ARCHITECTURE

## 2. Browser Architecture

### 2.1 What it is

Modern browsers (Chromium-based) use a **multi-process architecture**: separate processes for browser UI, each tab/site (renderer), GPU, network, plugins, etc.

### 2.2 Why multi-process?

**Problem:** One tab's infinite loop or memory leak used to crash the entire browser (single process).

**Solution:** **Isolation** — renderer crash ≠ browser chrome crash. **Security** — Site Isolation limits cross-site data leaks (Spectre mitigations).

### 2.3 Process diagram (Chrome-style)

```
┌──────────────────────────────────────────────────────────────────┐
│                     BROWSER PROCESS                               │
│  UI, tabs, bookmarks, extensions coordination                     │
└────────────┬─────────────────────────────────────────────────────┘
             │
    ┌────────┼────────┬─────────────┬──────────────┐
    ▼        ▼        ▼             ▼              ▼
┌────────┐ ┌────────┐ ┌──────────┐ ┌──────────┐ ┌─────────────┐
│Renderer│ │Renderer│ │   GPU    │ │ Network  │ │  Utility    │
│ Tab A  │ │ Tab B  │ │ Process  │ │ Process  │ │  (storage)  │
│site.com│ │other   │ │ compositing│ │ HTTP/S  │ │             │
└────────┘ └────────┘ └──────────┘ └──────────┘ └─────────────┘
```

| Process | Role |
|---------|------|
| **Browser** | Window, navigation, permissions |
| **Renderer** | HTML/CSS/JS, layout, paint (per site/group) |
| **GPU** | Accelerated compositing, WebGL |
| **Network** | HTTP, caching, cookies (centralized) |
| **Site Isolation** | Often one renderer per **site** (origin), not always per tab |

### 2.4 Site Isolation

**What:** `evil.com` and `bank.com` run in different renderer processes with separate memory spaces.

**React implication:** `postMessage` and iframes cross process boundaries — serialization cost. Heavy cross-origin embeds affect performance.

### 2.5 Interview: How does Chrome work internally?

**Expected:** Browser process + renderer per tab/site, GPU for layers, network process for requests.  
**Strong:** Mention site isolation, sandbox, IPC between processes.  
**Senior:** Trade-off — more RAM for stability; on low-memory devices Chrome may merge processes; impact on mobile WebView apps (Razorpay checkout in WebView).

**Follow-up:** *What happens when renderer runs out of memory?* Tab kill, crash bubble, before OOM killer at OS level.

**Hands-on:** Chrome Task Manager (`Shift+Esc`) — observe multiple renderer processes while opening Amazon, YouTube, and your app.

---

# SECTION 3: WHAT HAPPENS WHEN YOU ENTER A URL

## 3. URL to Pixels — Full Lifecycle

### 3.1 Step-by-step

```
User types URL + Enter
        │
        ▼
┌───────────────┐     Cache hit? ──YES──► Use cached IP (skip DNS)
│  1. DNS       │
└───────┬───────┘
        ▼
┌───────────────┐     SYN → SYN-ACK → ACK
│  2. TCP       │     (3-way handshake)
└───────┬───────┘
        ▼
┌───────────────┐     TLS 1.3: ClientHello → ServerHello → keys
│  3. TLS       │     (HTTPS)
└───────┬───────┘
        ▼
┌───────────────┐     GET / HTTP/2 or HTTP/3 (QUIC over UDP)
│  4. HTTP      │     Multiplexed streams (H2/H3)
└───────┬───────┘
        ▼
┌───────────────┐     HTML, CSS, JS, fonts, images
│  5. Response  │
└───────┬───────┘
        ▼
┌───────────────┐     Parse → DOM/CSSOM → Render → JS → React hydrate
│  6. Render    │
└───────────────┘
```

### 3.2 DNS

**What:** Domain → IP. Resolver chain: browser cache → OS → ISP → authoritative.

**Optimization:** `dns-prefetch`, `preconnect` (DNS + TCP + TLS).

**BookMyShow spike:** DNS TTL and anycast CDN edges reduce cold-start latency for `in.bookmyshow.com`.

### 3.3 TCP & TLS

**TCP:** Reliable ordered delivery. Cost = RTT × round trips for handshake.

**TLS 1.3:** Fewer round trips than 1.2. **Session resumption** cuts repeat visit cost.

### 3.4 HTTP/1.1 vs HTTP/2 vs HTTP/3

| Version | Transport | Key trait |
|---------|-----------|-----------|
| HTTP/1.1 | TCP | Head-of-line blocking per connection; 6 conn/domain hack |
| HTTP/2 | TCP | Multiplex streams; binary framing; server push (rare now) |
| HTTP/3 | QUIC (UDP) | Connection migration; less HOL blocking on lossy networks |

**Swiggy on 4G:** HTTP/3 (where supported) helps when packet loss causes TCP stalls.

### 3.5 React implication

First byte → HTML (SSR) → download JS bundle → parse/compile → execute → `ReactDOM.createRoot().render()` or **hydrate**.

**SSR improves LCP** because HTML contains visible content before JS runs.

**Common mistake:** Huge `main.js` before any paint — CSR-only SPAs on slow networks.

**Hands-on:** DevTools Network — throttle "Slow 4G", disable cache, reload. Count RTTs until first contentful paint.

---

# SECTION 4: BROWSER RENDERING PIPELINE

## 4. Browser Rendering Pipeline

### 4.1 Pipeline stages

```
DOM + CSSOM ──► Render Tree (visible nodes + styles)
                      │
                      ▼
                   Layout (geometry)
                      │
                      ▼
                   Paint (pixels into layers)
                      │
                      ▼
                   Composite (GPU layers)
```

### 4.2 Reflow vs Repaint

| Operation | Also called | Triggers | Cost |
|-----------|-------------|----------|------|
| **Reflow** | Layout | width, height, position, DOM insert | High — may affect subtree |
| **Repaint** | Paint | color, visibility, outline (no geometry) | Medium |
| **Composite only** | — | `transform`, `opacity` (often) | Lower |

**Interview:** *Difference between repaint and reflow?*  
Reflow recalculates geometry; repaint redraws pixels without layout. Changing `width` → reflow; changing `color` → often repaint only.

**Why layout is expensive:** Invalidates layout tree; may force synchronous layout if JS reads layout after write (layout thrashing).

### 4.3 Layout thrashing

```javascript
// BAD: read-write-read-write interleaved
for (const el of elements) {
  const h = el.offsetHeight; // READ forces layout
  el.style.height = h + 10 + 'px'; // WRITE invalidates
}

// GOOD: batch reads, then writes
const heights = elements.map(el => el.offsetHeight);
elements.forEach((el, i) => { el.style.height = heights[i] + 10 + 'px'; });
```

**React:** Measuring DOM in `useLayoutEffect` is correct for sync reads; doing it in every child on every render causes thrashing.

### 4.4 Forced synchronous layout

Browser normally batches layout. Reading `offsetTop` after a write forces **sync layout** mid-JS.

**Performance impact:** Can blow 16ms frame budget → jank.

**Debugging:** Performance panel → "Layout" / "Recalculate Style" events; purple triangle warnings in DevTools.

**Hands-on:** Record Performance while resizing a poorly implemented list; find long "Layout" blocks.

---

# SECTION 5: JAVASCRIPT ENGINE INTERNALS (V8)

## 5. JavaScript Engine Internals

### 5.1 V8 architecture (Chrome, Node)

```
Source ──► Parser ──► AST ──► Ignition (bytecode interpreter)
                                  │
                                  ▼
                            TurboFan (optimizing compiler)
                                  │
                            Deopt if assumptions break
```

### 5.2 Hidden classes (Shapes)

Objects with same property order share **hidden class** → fast property access.

```javascript
// BAD for IC: different shapes
function Point(x, y) { this.x = x; this.y = y; }
const a = new Point(1, 2);
const b = { y: 2, x: 1 }; // different order → different hidden class

// GOOD: consistent initialization order
function createPoint(x, y) {
  const p = {};
  p.x = x;
  p.y = y;
  return p;
}
```

### 5.3 Inline caching (IC)

Call sites cache "where to find property/method." Monomorphic = one shape = fast. Megamorphic = many shapes = slow.

**React:** Stable component types and props help V8 in **your** code paths; bigger win is still **fewer renders**.

### 5.4 Interview: How does V8 optimize code?

**Expected:** Hot functions compiled by TurboFan; inline caches; deoptimization on type changes.  
**Senior:** Don't micro-optimize React apps with hidden classes first — measure; V8 matters for hot loops (virtualization, canvas, parsers).

---

# SECTION 6: EVENT LOOP DEEP DIVE

> **Deep reference:** [`01-Event-Loop.md`](./01-Event-Loop.md)

## 6. Event Loop

### 6.1 Why JS is single-threaded

One call stack per renderer main thread simplifies DOM access (no locks on every node). Long tasks block paint and input.

### 6.2 Queues

```
┌─────────────┐
│ Call Stack  │
└──────┬──────┘
       │ empty?
       ▼
┌─────────────────────────────────────┐
│ 1. Drain ALL microtasks             │
│    (promises, queueMicrotask)       │
├─────────────────────────────────────┤
│ 2. One macrotask (setTimeout, I/O)  │
├─────────────────────────────────────┤
│ 3. Rendering (rAF, style, layout)   │  ← browser may render between tasks
└─────────────────────────────────────┘
```

### 6.3 Microtasks vs macrotasks

```javascript
console.log('1');
setTimeout(() => console.log('2'), 0);
Promise.resolve().then(() => console.log('3'));
console.log('4');
// 1, 4, 3, 2
```

**React 18:** State updates and `flushSync` interact with this — automatic batching reduces microtask churn.

### 6.4 requestAnimationFrame vs requestIdleCallback

| API | When | Use |
|-----|------|-----|
| `rAF` | Before next paint | Animations, measure layout before paint |
| `requestIdleCallback` | Idle slices | Low-priority work (unreliable on busy pages) |

**Mistake:** Heavy work in `rAF` callback — still blocks that frame.

**Hands-on:** Predict output of 5 nested `Promise` + `setTimeout` snippets; verify in console.

---

# SECTION 7: MEMORY MANAGEMENT

## 7. Memory Management

### 7.1 Stack vs heap

```
┌────────────────────────────────────────┐
│ STACK (per call frame)                 │
│  primitives, references (pointers)     │
│  fast, fixed size, LIFO                │
├────────────────────────────────────────┤
│ HEAP (shared)                          │
│  objects, arrays, closures             │
│  GC-managed, slower allocation         │
└────────────────────────────────────────┘
```

| Type | Stored | Example |
|------|--------|---------|
| Primitive | Stack (value) | `number`, `boolean`, `null` |
| Reference | Stack holds pointer → heap object | `{}`, `[]`, functions |

### 7.2 Reachability

Object is kept if **reachable** from roots: global, call stack locals, closures, DOM refs from JS.

**React:** Detached DOM still reachable from closure in listener → leak.

---

# SECTION 8: GARBAGE COLLECTION

## 8. Garbage Collection

### 8.1 Mark-and-sweep

Traverse from roots; mark reachable; sweep unmarked heap.

### 8.2 Generational GC (V8)

```
┌──────────────────┐     survive Scavenge      ┌──────────────────┐
│ Young (Nursery)  │ ────────────────────────► │ Old Generation   │
│ short-lived objs │                           │ long-lived objs  │
└──────────────────┘                           └──────────────────┘
        │                                                │
   Scavenge (fast)                              Mark-Sweep-Compact
```

**Stop-the-world:** GC pauses main thread → jank if heap huge or full GC during interaction.

**Memory pressure:** Mobile tab backgrounded → browser may kill renderer; returning tab may cold-reload.

**Interview:** *How does GC work?* Generational hypothesis; most objects die young; full GC is expensive.

---

# SECTION 9: MEMORY LEAKS

## 9. Memory Leaks

### 9.1 What & why

**Leak:** Memory no longer needed but still referenced → heap grows → GC works harder → tab slow/crash.

### 9.2 React leak patterns

| Pattern | BAD | GOOD |
|---------|-----|------|
| Event listener | `window.addEventListener` no cleanup | `useEffect` return removes listener |
| Timer | `setInterval` without clear | clear in cleanup |
| WebSocket | open on mount, never close | close on unmount |
| Observer | `IntersectionObserver` no disconnect | `disconnect()` in cleanup |
| Closure | `useEffect` captures huge data | narrow dependencies |
| Detached DOM | cache `element` in Map | WeakMap or clear on unmount |
| React Query | infinite `cacheTime`, all queries | `gcTime`, query key scope |
| Redux | append-only normalized store | pagination, prune entities |

```javascript
// GOOD: cleanup pattern
useEffect(() => {
  const controller = new AbortController();
  const ws = new WebSocket(url);
  ws.onmessage = handleMessage;
  return () => {
    controller.abort();
    ws.close();
  };
}, [url]);
```

### 9.3 Chrome Memory tools

1. **Heap snapshot** — compare two snapshots; look for Detached DOM tree count.
2. **Allocation instrumentation on timeline** — what allocated during action?
3. **Retainers** — why is this object still alive?

**Interview:** *Memory keeps increasing?* — Not always leak (cache growth); take heap snapshots during repeated navigation; check retainers.

**Hands-on:** Intentionally leak a listener in a demo component; fix with cleanup; verify in Memory tab.

---

# SECTION 10: WEB VITALS COMPLETE DEEP DIVE

## 10. Web Vitals — LCP, INP, CLS

### 10.1 Overview

| Metric | Measures | Good (p75) |
|--------|----------|------------|
| **LCP** | Largest paint in viewport | ≤ 2.5s |
| **INP** | Interaction responsiveness (replaces FID) | ≤ 200ms |
| **CLS** | Unexpected layout shift | ≤ 0.1 |

### 10.2 LCP — Largest Contentful Paint

**What:** Time until largest image/text block visible in viewport.

**Candidates:** `<img>`, `<video poster>`, block with background-image, text nodes in block elements.

**Not LCP:** off-screen, `opacity:0`, tiny icons.

**Root causes (slow LCP):**
- Slow server/TTFB (SSR, CDN)
- Render-blocking JS/CSS
- Slow resource (unoptimized hero image)
- Client-side render delay (CSR hero)

**React fixes:**
```jsx
// Preload LCP image in document head (Next.js: priority on Image)
<link rel="preload" as="image" href="/hero.webp" fetchpriority="high" />

// Next.js App Router
import Image from 'next/image';
<Image src="/hero.webp" priority alt="..." width={1200} height={600} />
```

**Netflix:** Poster frame fast; player upgrades quality — LCP element often poster image.

### 10.3 INP — Interaction to Next Paint

**What:** Latency for all interactions (click, tap, key) during visit; worst percentiles matter.

**Root causes:** Long tasks on main thread (>50ms), heavy React re-renders on click, synchronous layout.

**React fixes:**
- `startTransition` for heavy state updates
- Split components; memo boundaries
- Web Workers for heavy compute
- Avoid 300ms worth of work in event handler

```javascript
import { startTransition } from 'react';

function Search() {
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const onChange = (e) => {
    setQ(e.target.value); // urgent
    startTransition(() => {
      setResults(filterHugeList(e.target.value)); // non-urgent
    });
  };
}
```

### 10.4 CLS — Cumulative Layout Shift

**Formula (simplified):** `impact fraction × distance fraction` for unexpected shifts.

**Root causes:** Images without dimensions, ads, fonts (FOUT), injected banners.

**React fixes:**
```jsx
// Reserve space
<img width={800} height={600} alt="..." />
// or aspect-ratio in CSS
<div style={{ aspectRatio: '16/9' }}>{content}</div>
```

**Amazon:** Product grid cells fixed height — prevents CLS when ratings load.

### 10.5 Measurement

```javascript
import { onLCP, onINP, onCLS } from 'web-vitals';

onLCP(console.log);
onINP(console.log);
onCLS(console.log);
```

**Debugging workflow:** Field RUM → reproduce locally with Performance → find long tasks → React Profiler → fix → verify in lab + field.

**Hands-on:** Run Lighthouse on your app; map each failing audit to LCP/INP/CLS lever.

---

# SECTION 11: REACT ARCHITECTURE

> **Deep reference:** [`04-React-Internals.md`](./04-React-Internals.md)

## 11. React Architecture

### 11.1 Virtual DOM

**What:** JS tree describing UI. **Why:** Declarative updates; diff against previous tree; batch DOM writes.

**Not magic:** Diff + commit still cost CPU; fewer updates wins.

### 11.2 Reconciliation

Compare new element tree with Fiber tree; decide update/insert/delete; **keys** preserve identity in lists.

### 11.3 Fiber

**Why Fiber existed:** Stack reconciler couldn't pause — large updates blocked main thread.

```
Fiber = unit of work (component instance + hooks + child/sibling/return pointers)
Work loop: process fiber → child → sibling → return (depth-first)
Can yield → Scheduler resumes later (Concurrent)
```

### 11.4 Scheduler & priorities

Lanes/priorities: user input > transition > idle. `useTransition` marks updates low priority.

**Senior point:** Fiber enables **interruptible rendering** and **Suspense** — not primarily "make VDOM faster."

---

# SECTION 12: REACT RENDERING

## 12. React Rendering

### 12.1 Render vs commit

| Phase | Work | Interruptible? |
|-------|------|----------------|
| **Render** | Call components, diff, build effect list | Yes (concurrent) |
| **Commit** | DOM mutations, refs, `useLayoutEffect`, paint | No |

### 12.2 What triggers re-render?

- State change in component
- Parent re-render (default: children re-render)
- Context value change (all consumers)
- `forceUpdate` / `useReducer` dispatch
- Store subscription (Redux, Zustand)

```
Parent state changes
        │
        ▼
Parent re-renders
        │
        ├──► Child re-renders (even if props equal, unless memo bailout)
        └──► Context consumers re-render
```

**Interview:** *Why is my component re-rendering?* — React DevTools Profiler "Why did this render?"; check parent, context, unstable props (`{}` inline).

**Hands-on:** Log renders with `useRef` counter or `why-did-you-render` in dev.

---

# SECTION 13: REACT PERFORMANCE OPTIMIZATION

## 13. React Performance Optimization

### 13.1 Decision flowchart

```
Is there a measured problem?
 │
 NO ──► Don't optimize (avoid premature memo)
 │
 YES
 ▼
Is it render-bound or network-bound?
 │
 network ──► CDN, split, cache (Sections 15–22)
 │
 render
 ▼
Too many renders or expensive render?
 │
 too many ──► state colocation, context split, memo boundaries
 │
 expensive ──► virtualization, Web Worker, simplify tree
```

### 13.2 React.memo

**What:** Skip re-render if shallow props equal.

**Cost:** Comparison every parent render.

**When it hurts:** Cheap child + always new props → comparison + render anyway.

```javascript
const Comment = React.memo(function Comment({ text, author }) {
  return <p><b>{author}</b>: {text}</p>;
});
```

### 13.3 useMemo / useCallback

**useMemo:** Cache computed value.  
**useCallback:** Cache function reference (for memo children / deps).

**Anti-pattern:**
```javascript
// BAD: memoizing everything on hot path
const x = useMemo(() => a + b, [a, b]); // addition is cheaper than useMemo
```

**Good:** Expensive filter/sort, stable callback for `memo` child.

### 13.4 useRef

Mutable box; changing `.current` **does not** re-render. Use for DOM refs, timers IDs, previous values.

### 13.5 useTransition / useDeferredValue

Defer non-urgent UI; keep input responsive (helps **INP**).

| Hook | Typical use |
|------|-------------|
| `useTransition` | Wrap `setState` for heavy updates |
| `useDeferredValue` | Defer a value derived from fast-changing input |

### 13.6 Interview: When does memoization hurt?

**Expected:** Overhead of comparison; unstable deps; memo on leaf that always changes.  
**Senior:** Profile first; fix architecture (state at wrong level) before sprinkling `memo`.

| Approach | Pros | Cons |
|----------|------|------|
| `React.memo` | Cuts child renders | Prop compare cost; needs stable props |
| `useMemo` | Saves heavy compute | Memory; stale deps bugs |
| Colocation | Fewer subscribers | Refactor cost |

---

# SECTION 14: LARGE LIST OPTIMIZATION

## 14. Large List Optimization

### 14.1 Virtualization (windowing)

**Idea:** Only mount DOM nodes in viewport + overscan buffer.

**Analogy:** Library shelf — you only read books on the desk, not every book in the building.

```
Full list: 10,000 DOM nodes
Virtualized: ~20 DOM nodes (viewport + buffer)
```

### 14.2 react-window example

```javascript
import { FixedSizeList } from 'react-window';

function Row({ index, style, data }) {
  return <div style={style}>{data[index].title}</div>;
}

function ProductList({ items }) {
  return (
    <FixedSizeList
      height={600}
      itemCount={items.length}
      itemSize={72}
      width="100%"
      itemData={items}
    >
      {Row}
    </FixedSizeList>
  );
}
```

### 14.3 Use cases

| App | Pattern |
|-----|---------|
| **Instagram comments** | Virtualize thread; collapse deep branches |
| **BookMyShow seats** | Canvas or virtualized grid; avoid 500 `<div>` seats |
| **Amazon listing** | Infinite scroll + windowing + skeleton |

**Mistake:** `index` as key when list reorders — breaks state and perf.

**Hands-on:** Render 10k rows without virtualization (freeze tab); add `react-window`; compare Performance recording.

---

# SECTION 15: NETWORK OPTIMIZATION

## 15. Network Optimization

### 15.1 CDN

**What:** Edge caches static assets close to user.

**Why LCP/TTI improve:** Lower RTT for images/JS.

**Interview:** *How does CDN improve performance?* — Geographic proximity, caching, HTTP/2/3 termination, Brotli at edge.

### 15.2 Compression

| Algorithm | Ratio | CPU |
|-----------|-------|-----|
| gzip | Good | Lower |
| Brotli | Better | Higher (precompress at build) |

### 15.3 Resource hints

```html
<link rel="preconnect" href="https://api.example.com" />
<link rel="dns-prefetch" href="https://cdn.example.com" />
<link rel="preload" href="/critical.woff2" as="font" crossorigin />
<link rel="prefetch" href="/next-route-chunk.js" />
```

**Trade-off:** Preload too much → competes with LCP resources.

---

# SECTION 16: BUNDLE OPTIMIZATION

## 16. Bundle Optimization

### 16.1 Tree shaking

ESM static imports allow dead export elimination. **Side-effect:** `package.json` `"sideEffects": false` helps.

### 16.2 Code splitting (Vite)

```javascript
// React.lazy + Suspense
const Dashboard = React.lazy(() => import('./Dashboard'));

function App() {
  return (
    <Suspense fallback={<Spinner />}>
      <Dashboard />
    </Suspense>
  );
}
```

```javascript
// vite.config.js — manual chunks
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
        },
      },
    },
  },
});
```

**Mistake:** Import entire `lodash` — use `lodash-es` per function import.

---

# SECTION 17: IMAGE OPTIMIZATION

## 17. Image Optimization

### 17.1 Formats

| Format | Use |
|--------|-----|
| **WebP** | Broad support, good compression |
| **AVIF** | Better compression; encode cost; check support |
| **JPEG** | Photos fallback |

### 17.2 Responsive images

```html
<img
  src="product-800.webp"
  srcset="product-400.webp 400w, product-800.webp 800w, product-1200.webp 1200w"
  sizes="(max-width: 600px) 100vw, 50vw"
  alt="Product"
  width="800"
  height="600"
  loading="lazy"
  decoding="async"
/>
```

**LCP image:** Do **not** lazy-load; use `fetchpriority="high"` and preload.

**Image CDNs:** Cloudinary, imgix — resize by DPR and width param.

---

# SECTION 18: SSR, SSG, ISR, CSR

## 18. Rendering Strategies

| Strategy | HTML when | JS when | Best for |
|----------|-----------|---------|----------|
| **CSR** | Shell | Client renders all | Dashboards behind auth |
| **SSR** | Full per request | Hydrate | Personalized, SEO |
| **SSG** | Build time | Hydrate | Marketing, docs |
| **ISR** | Static + revalidate | Hydrate | E-commerce catalog |

### 18.1 Why SSR improves LCP

HTML includes visible content in first response — paint before JS bundle executes.

### 18.2 Framework comparison

| | React SPA | Next.js | Remix |
|--|-----------|---------|-------|
| Routing | Client | File-based | Nested routes |
| Data | Client fetch | RSC, SSR, SSG | Loaders + SSR |
| Streaming | Limited | Supported | Supported |

**Interview SSR vs CSR:** Trade server cost, TTFB, complexity vs fast interactions post-hydration.

---

# SECTION 19: HYDRATION

## 19. Hydration

### 19.1 What

Attach event listeners and reconcile client React tree with **existing** SSR HTML.

### 19.2 Mismatches

**Causes:** `Date.now()`, `Math.random()`, browser-only APIs in SSR, invalid HTML nesting.

**Symptom:** Console hydration warnings; full client re-render (bad for perf).

### 19.3 Selective / streaming / partial

**Streaming SSR:** Send HTML in chunks; hydrate as chunks arrive.  
**Selective hydration:** Prioritize interactive regions (React 18 + Suspense).  
**Partial:** Islands architecture (Astro, partial hydration frameworks).

**Bottleneck:** Large tree hydration blocks main thread — split with Suspense boundaries.

---

# SECTION 20: CONCURRENT REACT

## 20. Concurrent React

### 20.1 Features

- **Interruptible rendering** — yield to urgent updates
- **Transitions** — `useTransition`, `startTransition`
- **Suspense** — wait for data/code without blocking whole tree
- **Offscreen** — prepare hidden UI (experimental patterns)

### 20.2 Scheduler (conceptual)

```
Input event (high priority)
        │
        ▼
Interrupt in-progress render of transition update
        │
        ▼
Process urgent update → commit → paint
        │
        ▼
Resume transition work
```

**Senior:** Concurrent mode doesn't make individual components faster — it **prioritizes** user-visible work.

---

# SECTION 21: WEB WORKERS

## 21. Web Workers

### 21.1 What

JS on **background thread** — no DOM access. Message passing via `postMessage`.

### 21.2 When

- CSV/JSON parse of large files
- Image processing
- Cryptography
- Heavy filter/sort (if not on server)

```javascript
// main.js
const worker = new Worker(new URL('./filter.worker.js', import.meta.url));
worker.postMessage({ items, query });
worker.onmessage = (e) => setResults(e.data);

// filter.worker.js
self.onmessage = ({ data }) => {
  const filtered = data.items.filter(/* expensive */);
  self.postMessage(filtered);
};
```

**Trade-off:** Serialization cost; not for tiny tasks.

---

# SECTION 22: CACHING

## 22. Caching

### 22.1 Layers

```
Request
   │
   ▼
Memory cache (same-session, instant)
   │
   ▼
HTTP cache (Cache-Control, ETag)
   │
   ▼
Service Worker (programmatic)
   │
   ▼
CDN edge
   │
   ▼
Origin server
```

### 22.2 Cache-Control

| Directive | Meaning |
|-----------|---------|
| `max-age=31536000` | Fresh for 1 year |
| `no-store` | Never cache (PII) |
| `stale-while-revalidate` | Serve stale while fetching new |

**ETag:** Conditional request — `304 Not Modified` saves bandwidth.

**React Query:** Client cache with `staleTime` / `gcTime` — separate from HTTP cache.

---

# SECTION 23: PERFORMANCE MONITORING

## 23. Performance Monitoring

### 23.1 Tooling matrix

| Tool | Type | Best for |
|------|------|----------|
| Lighthouse | Lab | Audits, CI gates |
| DevTools Performance | Lab | Long tasks, flame charts |
| React Profiler | Lab | Component render time |
| PageSpeed Insights | Lab + field CRUX | Quick field snapshot |
| web-vitals | Field | RUM instrumentation |
| Sentry/Datadog | Field | Regression alerts |

### 23.2 Debugging workflow (production)

```
1. Alert: p75 LCP regression on /checkout
2. Segment: mobile, region IN, browser Chrome
3. RUM: LCP element = hero image; TTFB up
4. Trace: CDN miss? deploy? API slow?
5. Lab reproduce: Slow 4G + CPU 4x throttle
6. Fix: preload image, reduce JS, fix SSR
7. Ship → canary → compare p75 24h later
```

### 23.3 React Profiler steps

1. Record interaction (e.g. open modal).
2. Rank components by render duration.
3. Check "Why did this render?"
4. Fix highest cost + highest frequency first.

**Hands-on:** Baseline Lighthouse score; make one change; re-run; document delta.

---

# SECTION 24: REAL-WORLD PERFORMANCE CASE STUDIES

## 24. Case Studies

### Case Study 1: Instagram Feed

| Aspect | Detail |
|--------|--------|
| **Architecture** | Virtualized list, media prefetch, GraphQL/Relay-style stores |
| **Bottlenecks** | Image decode, layout from variable-height cards, main-thread JSON |
| **Metrics** | LCP (first post), INP (like, comment), CLS (media load) |
| **Investigation** | Film strip in Performance; Network waterfall for images |
| **Strategy** | Fixed aspect ratio placeholders, `react-window`/`RecyclerListView` patterns, priority for visible media, `startTransition` for like counts |

### Case Study 2: BookMyShow Seat Selection

| Aspect | Detail |
|--------|--------|
| **Architecture** | Interactive seat map, real-time availability |
| **Bottlenecks** | Thousands of DOM nodes; websocket updates; repaint on hover |
| **Metrics** | INP on seat tap; CLS on legend load |
| **Investigation** | Profiler + count DOM nodes |
| **Strategy** | Canvas/SVG map OR virtualized grid; debounce hover; optimistic lock with server reconcile |

### Case Study 3: E-commerce Product Listing (Amazon / Flipkart)

| Aspect | Detail |
|--------|--------|
| **Bottlenecks** | Large HTML, third-party tags, filter re-render entire page |
| **Metrics** | LCP = hero banner or first product row |
| **Strategy** | ISR for listing, facet state in URL + colocated state, image CDN, skeleton grid |

### Case Study 4: Analytics Dashboard

| Aspect | Detail |
|--------|--------|
| **Bottlenecks** | Chart libraries, 10k point re-renders, WebSocket ticks |
| **Metrics** | INP on filter; long tasks |
| **Strategy** | Code-split charts, downsample data, Workers for aggregation, `memo` + virtualize tables |

### Case Study 5: Real-Time Chat (Swiggy support / Slack-like)

| Aspect | Detail |
|--------|--------|
| **Bottlenecks** | Append-only message list growth, scroll stick, typing indicators |
| **Strategy** | Virtualize messages, prune old from memory, separate channel subscriptions, cleanup on unmount |

---

# SECTION 25: SENIOR FRONTEND INTERVIEW MASTERCLASS

## 25. Interview Question Banks

### How to use this section

For each question:
- **Expected** — mid-level correct answer
- **Strong** — adds mechanism and metrics
- **Senior** — trade-offs, production war stories, measurement

Full tri-level answers below for **flagship questions**. Additional questions are in **quick banks** (answer in 2–3 sentences in interview).

---

### 25.1 React Performance — Flagship Q&A (25 fully worked)

#### Q1. When does `React.memo` hurt performance?

| Level | Answer |
|-------|--------|
| Expected | When props change every render anyway, comparison is wasted. |
| Strong | Shallow compare on large props objects costs O(n); unstable inline objects defeat memo. |
| Senior | Profile with Profiler first; fix state colocation; memo at list row boundaries; use composition (`children` as slot) to avoid broad re-renders. Follow-up: "How would you detect unstable props in CI?" — eslint-plugin-react-hooks, custom lint, or Storybook interaction tests. |

#### Q2. Explain `useMemo` vs `useCallback`.

| Level | Answer |
|-------|--------|
| Expected | `useMemo` caches values; `useCallback` caches functions. |
| Strong | Both depend on dependency arrays; stale closures if deps wrong. |
| Senior | Only for measured hot paths; `useCallback` exists so child `memo` sees stable reference; alternative is move child or pass event from stable parent. |

#### Q3. Why is my list slow with only 100 items?

| Level | Answer |
|-------|--------|
| Expected | Expensive render per item or parent re-renders all children. |
| Strong | Check keys, context, inline props, no virtualization for heavy rows. |
| Senior | Flame chart + React Profiler; consider row component `memo`, virtualize above ~50 heavy rows, move selection state to row level. |

#### Q4. `useTransition` vs `debounce`?

| Level | Answer |
|-------|--------|
| Expected | Transition keeps UI responsive; debounce delays updates. |
| Strong | Transition is priority-aware in React scheduler; debounce is time-based. |
| Senior | Use debounce for network/API; transition for expensive render from same data already on client. Can combine. |

#### Q5. How does Context affect performance?

| Level | Answer |
|-------|--------|
| Expected | All consumers re-render when value changes. |
| Strong | Split contexts by concern; memoize value; pass dispatch separately from state. |
| Senior | Zustand/Jotai/selectors, or composition; measure before replacing Redux "for perf." |

#### Q6–Q25 (Quick bank — prepare 60s answers)

6. Fiber vs stack reconciler? — Interruptible work units.  
7. Render vs commit phase? — Render computes; commit mutates DOM.  
8. What is bailout? — Same props/state → skip subtree.  
9. Keys in lists? — Identity for reconciliation.  
10. Lifting state up perf cost? — More re-renders; colocate down.  
11. Controlled vs uncontrolled perf? — Controlled re-renders each keystroke.  
12. Strict Mode double render? — Dev-only; exposes side effects.  
13. `flushSync`? — Forces sync render; hurts INP if abused.  
14. Portal performance? — Same reconciler; escape stacking context.  
15. Error boundaries and perf? — Isolate failed subtrees.  
16. RSC and bundle size? — Server components not in client bundle.  
17. Suspense for code splitting? — Better than single blocking spinner.  
18. Why avoid inline functions in lists? — Breaks `memo` on rows.  
19. State in Redux vs local? — Global updates fan out.  
20. React 18 automatic batching? — Fewer commits for multiple setStates.  
21. `useEffect` vs `useLayoutEffect` perf? — Layout blocks paint.  
22. Custom comparison in `memo`? — Deep compare rarely worth it.  
23. Children as props pattern? — Parent re-render doesn't recreate child element.  
24. Selector libraries (reselect)? — Memoized derived data.  
25. When to virtualize? — DOM count × row cost > frame budget.

**React Performance Quick Bank (Q26–150)** — topics to drill: reconciliation O(n), prop drilling vs context, fragment keys, lazy + Suspense boundaries, hydration cost, `useId` stability, form libraries re-render scope, chart library memo, infinite scroll intersection observer cleanup, TanStack Query `select`, stale-while-revalidate UI, `requestAnimationFrame` in animations, CSS-in-JS runtime cost, Emotion vs static extraction, MUI tree-shaking, ant design bundle, module federation performance, micro-frontends shared deps, SSE vs WebSocket for feed, optimistic mutation rollback, service worker caching SPA shells, PR checklist for perf, bundle analyzer reading, source maps in prod profiling, etc. *(Prepare one-page flashcards per topic using Sections 11–14.)*

---

### 25.2 Browser — Flagship Q&A (20 fully worked)

#### Q1. Reflow vs repaint?

| Level | Answer |
|-------|--------|
| Expected | Reflow changes layout; repaint redraws pixels. |
| Strong | Reflow can trigger repaint; composite-only is cheapest. |
| Senior | Layout thrashing from interleaved read/write; use DevTools "Layout" events; fix with batching and CSS `transform`. |

#### Q2. What happens when you type a URL?

| Level | Answer |
|-------|--------|
| Expected | DNS, TCP, TLS, HTTP, parse, render. |
| Strong | Add caching layers, HTTP/2 multiplexing, service worker intercept. |
| Senior | Site isolation picks process; preload scanner fetches critical resources early; discuss QUIC on mobile loss. |

#### Q3. Why is JS single-threaded?

| Level | Answer |
|-------|--------|
| Expected | DOM consistency; one call stack. |
| Strong | Web Workers for parallel compute; not parallel DOM. |
| Senior | Atomics + SharedArrayBuffer rare; main thread = interaction + rendering. |

**Browser Quick Bank (Q4–100):** event loop order, `defer` vs `async`, critical CSS, cookie SameSite impact, CORS preflight cost, TCP slow start, TLS resumption, HTTP caching validators, bfcache, Page Lifecycle API, `visibilitychange` pause timers, `passive: true` listeners, `will-change` memory trade-off, layer explosion, GPU rasterization, subpixel rendering, font-display swap CLS, third-party script impact, iframe process boundaries, COOP/COEP, CSP and perf, etc.

---

### 25.3 Web Vitals — Flagship Q&A (15 fully worked)

#### Q1. What is LCP and how is it calculated?

| Level | Answer |
|-------|--------|
| Expected | Largest visible content paint time. |
| Strong | Only viewport; stops at user interaction in some cases; last candidate wins. |
| Senior | Element types; TTFB vs resource vs render delay breakdown in Lighthouse; field vs lab variance. |

#### Q2. FID vs INP?

| Level | Answer |
|-------|--------|
| Expected | FID was first delay only; INP covers all interactions. |
| Strong | INP is p98-ish worst interaction latency aggregated. |
| Senior | Optimize long tasks; break up JS; use PerformanceObserver `longtask` in RUM. |

**Web Vitals Quick Bank (Q16–100):** CLS session window, expected vs unexpected shift, INP attribution, soft navigations SPA, TTFB vs FCP vs LCP, resource timing API, element timing, LoAF (Long Animation Frames), CrUX vs RUM, scoring changes over time, etc.

---

### 25.4 Memory Leak — Flagship Q&A (10 fully worked)

#### Q1. How do you find a memory leak?

| Level | Answer |
|-------|--------|
| Expected | Heap snapshots, compare retainers. |
| Strong | Reproduce with repeated navigation; allocation timeline. |
| Senior | Production: heap not always available; use detached DOM count, session length vs memory proxies, logging, reproduce in staging with same extensions disabled. |

**Memory Quick Bank (Q11–50):** closure leaks, WeakMap use cases, `console.log` retaining objects, DevTools "Object retained by DevTools", iframe leaks, service worker cache growth, etc.

---

### 25.5 Production Debugging Scenarios (25 scenarios)

| # | Scenario | Senior response outline |
|---|----------|-------------------------|
| 1 | LCP regressed after deploy | Diff assets, TTFB, element change; rollback canary |
| 2 | INP bad only on Android | Long tasks + slow CPU; test 4x throttle |
| 3 | CLS on login page | Font/image dimensions; cookie banner |
| 4 | Memory grows on SPA nav | Snapshot compare; listener cleanup |
| 5 | WebSocket duplicate handlers | Strict Mode + missing cleanup |
| 6 | React Query cache huge | `gcTime`, paginate keys |
| 7 | Redux store 50MB | Normalize + prune + rehydrate scope |
| 8 | Hydration mismatch prod only | timezone/locale; suppress vs fix root |
| 9 | Third-party tag | Delay load, tag manager audit |
| 10 | CDN stale HTML | Cache headers; purge |
| 11 | Infinite scroll jank | Virtualize + intersection rootMargin |
| 12 | Chart filter freezes | Worker or server aggregate |
| 13 | Modal opens slow | Portal + lazy + code split |
| 14 | Tab background battery | Pause polls; `visibilitychange` |
| 15 | SSE reconnect storm | Exponential backoff |
| 16 | Service worker broke updates | `skipWaiting` strategy |
| 17 | Prefetch wasted bandwidth | Match user journey |
| 18 | Image LCP 5MB PNG | WebP + responsive + CDN |
| 19 | Bundle doubled | Import audit; duplicate packages |
| 20 | SSR slower than CSR | Server CPU, data waterfall, edge cache |
| 21 | TTI good LCP bad | Hero not in HTML; client-only hero |
| 22 | Profiler shows context | Split provider |
| 23 | Seat map 2s INP | Canvas hit testing vs DOM |
| 24 | A/B test slowed site | Feature flag perf budget |
| 25 | "Works on my Mac" | Field data segmentation |

---

# SECTION 26: PRACTICAL PROJECTS

## 26. Practical Performance Projects

### Project 1: Instagram Comments (see [`10-Instagram-Comment-Section-Complete-Guide.md`](./10-Instagram-Comment-Section-Complete-Guide.md))

| Step | Action |
|------|--------|
| 1 | Build nested comments without optimization |
| 2 | Profile: record typing in reply box |
| 3 | Fix: `memo` row, colocate reply state, virtualize if >100 |
| 4 | Verify: Profiler render count ↓, INP stable |

### Project 2: BookMyShow Seat Selection

| Step | Action |
|------|--------|
| 1 | 500+ seat divs |
| 2 | Measure INP on seat click |
| 3 | Replace with canvas/SVG or virtual grid |
| 4 | WebSocket updates batched with `requestAnimationFrame` |

### Project 3: Infinite Feed

| Step | Action |
|------|--------|
| 1 | `IntersectionObserver` load more |
| 2 | Add `react-window` |
| 3 | Prefetch next page at 80% scroll |
| 4 | Monitor retained DOM nodes in Memory |

### Project 4: Dashboard

| Step | Action |
|------|--------|
| 1 | Load Chart.js + table together |
| 2 | Split routes; lazy charts |
| 3 | Downsample to 500 points |
| 4 | Lighthouse TBT improvement |

### Project 5: Data Table 100k Rows

| Step | Action |
|------|--------|
| 1 | Naive map → freeze |
| 2 | `@tanstack/react-virtual` |
| 3 | Server-side sort/filter |
| 4 | Export Worker for CSV |

**Verification checklist:** Lighthouse lab score, React Profiler render time, Web Vitals RUM (if deployed), Memory snapshot after 10 navigations.

---

# SECTION 27: FRONTEND PERFORMANCE MIND MAP

## 27. Frontend Performance Mind Map

```
                              ┌─────────────────┐
                              │  USER / BUSINESS │
                              │  bounce, revenue │
                              └────────┬────────┘
                                       │
                    ┌──────────────────┼──────────────────┐
                    ▼                  ▼                  ▼
            ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
            │  PERCEIVED   │   │   METRICS    │   │   BUDGETS    │
            │  skeleton UI │   │ LCP INP CLS  │   │  RAIL        │
            └──────┬───────┘   └──────┬───────┘   └──────┬───────┘
                   │                  │                  │
                   └──────────────────┼──────────────────┘
                                      ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           BROWSER                                        │
│  Processes → Network (DNS/TCP/TLS/HTTP) → CRP → Layout/Paint/Composite  │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      JAVASCRIPT RUNTIME                                    │
│  V8 parse/compile → Event Loop → Memory → GC → Leaks                     │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                            REACT                                         │
│  Fiber → Render/Commit → Concurrent → memo/hooks → Lists → SSR/Hydrate   │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         DELIVERY LAYER                                   │
│  Bundle → Images → CDN → Cache → Workers → Monitoring → Case Studies     │
└─────────────────────────────────────────────────────────────────────────┘
```

### 30–60 Day Roadmap

| Week | Focus | Sections | Deliverable |
|------|-------|----------|-------------|
| 1 | Browser + CRP + URL | 1–4 | CRP audit doc |
| 2 | JS runtime + memory | 5–9 | Fix leak demo |
| 3 | Web Vitals + React core | 10–13 | Vitals on 3 routes |
| 4 | Lists + network + assets | 14–17 | Virtualized list PR |
| 5 | SSR + hydration + concurrent | 18–20 | Next/Remix comparison notes |
| 6 | Workers + cache + monitoring | 21–23 | Runbook template |
| 7 | Case studies + interviews | 24–25 | 50 verbal answers |
| 8 | Projects + synthesis | 26–27 | One optimized feature shipped |

---

## APPENDIX A: Deep-Dive Topic Expansions

### A.1 LCP — Internal calculation (expanded)

**Browser behavior:** PerformanceObserver watches `largest-contentful-paint` entries. Each entry has `renderTime` or `loadTime`, `size`, `element`, `url`.

```
Navigation Start
      │
      ▼
   TTFB ─────────────► server + network wait
      │
      ▼
 Resource load delay ──► queue, download (if LCP is image)
      │
      ▼
 Resource load duration
      │
      ▼
 Element render delay ─► blocking JS/CSS, fonts
      │
      ▼
    LCP timestamp
```

**YouTube homepage:** LCP often = first video thumbnail in viewport — they size thumbnails per DPR, use CDN, and avoid render-blocking scripts on critical path.

**Debugging workflow:**
1. Lighthouse → LCP element selector.
2. Performance → Timings → LCP marker.
3. Check `fetchpriority`, preload, SSR HTML contains element.
4. React: is hero client-only? (`useEffect` mount = late LCP).

**Hands-on:** Add `PerformanceObserver` for LCP; log `entry.element` and `entry.url` to console.

---

### A.2 INP — Event timing (expanded)

INP aggregates **interaction latency** across the page lifetime (field). Lab tools approximate with Total Blocking Time (TBT).

```
click/tap
   │
   ▼
Input delay (main thread busy?)
   │
   ▼
Processing (event handlers + React renders)
   │
   ▼
Presentation delay (next paint)
   │
   ▼
INP for that interaction
```

**BookMyShow:** Seat tap must commit selection paint < 200ms p75 — avoid syncing 500 seats state on each click; update selection model + single region repaint (canvas).

**React anti-pattern:**
```javascript
// BAD: entire seat map state on each click
setSeats(seats.map(s => ({ ...s, selected: s.id === id ? !s.selected : s.selected })));

// GOOD: selection in ref or isolated state
setSelectedId(id);
```

---

### A.3 CLS — Session windows (expanded)

CLS uses **session windows** — gaps without shifts start new windows; max window score reported.

**Unexpected shift:** Element moves without recent user input (within 500ms exception for clicks).

**Flipkart/Amazon product page:** Star ratings loading below title pushes "Add to cart" → reserve `min-height` for rating row.

```css
.rating-row {
  min-height: 1.25rem; /* prevents button jump when stars load */
}
```

---

### A.4 Fiber work loop (expanded diagram)

```
                    beginWork (render phase)
                           │
         ┌─────────────────┼─────────────────┐
         ▼                 ▼                 ▼
    Host Component    Function Component   Class Component
         │                 │                 │
         └─────────────────┼─────────────────┘
                           ▼
              performUnitOfWork (process fiber)
                           │
              shouldYield()? ──YES──► save progress, schedule continue
                           │
                          NO
                           ▼
                    completeWork
                           │
                           ▼
              commitRoot (commit phase — not interruptible)
                           │
         ┌─────────────────┼─────────────────┐
         ▼                 ▼                 ▼
   mutation effects   layout effects    passive effects
   (DOM changes)      (useLayoutEffect)  (useEffect)
```

**Interview follow-up:** *Can React pause during commit?* No — incomplete DOM updates would break consistency.

---

### A.5 React render propagation — worked example

```javascript
function App() {
  const [count, setCount] = useState(0);
  return (
    <>
      <button onClick={() => setCount(c => c + 1)}>+</button>
      <Header />           {/* re-renders — parent re-rendered */}
      <MemoizedSidebar />  {/* skips if props stable */}
      <Main count={count} /> {/* re-renders — prop changed */}
    </>
  );
}

const MemoizedSidebar = React.memo(Sidebar);
```

**Propagation rule:** Default React re-renders **all children** when parent renders. `memo` only helps if props are shallow-equal.

**Context:**
```javascript
const ThemeContext = createContext('light');
const UserContext = createContext(null);

// BAD: single value={{ theme, user }} — any change re-renders all consumers
// GOOD: split providers; consumers subscribe to one context each
```

---

### A.6 Bundle optimization — Webpack vs Vite (expanded)

**Vite dev:** Native ESM, no bundle. **Vite prod:** Rollup.

```javascript
// Dynamic import — route-level split
const Admin = lazy(() => import(/* webpackChunkName: "admin" */ './Admin'));
```

**Tree shaking requirements:**
- ESM `import`/`export` (not `require`)
- Avoid side-effect imports that register globals
- Check `lodash` → `lodash-es` + `import debounce from 'lodash-es/debounce'`

**Analyze:**
```bash
# Vite
npx vite-bundle-visualizer

# webpack
npx webpack-bundle-analyzer stats.json
```

**Production use case (Razorpay checkout):** Minimal initial chunk; load payment SDK on checkout route only.

---

### A.7 SSR hydration timeline

```
Server: renderToPipeableStream / renderToString
        │
        ▼
HTML streamed to browser ──► First paint (fast LCP potential)
        │
        ▼
Browser downloads JS bundle
        │
        ▼
ReactDOM.hydrateRoot(container, <App />)
        │
        ▼
Reconcile Fiber with existing DOM (must match!)
        │
        ▼
Attach listeners → interactive
```

**Hydration mismatch:** Client renders different HTML → React discards and client-renders (expensive, bad CLS/INP).

**Selective hydration:** Suspense boundaries hydrate in priority order (user-visible first).

---

### A.8 Caching — decision table

| Asset type | Cache-Control | Revalidate |
|------------|---------------|------------|
| Hashed JS/CSS | `max-age=31536000, immutable` | Never (new hash = new URL) |
| HTML (SSR) | `max-age=0, must-revalidate` | Every navigation or stale-while-revalidate |
| API GET public | `s-maxage=60, stale-while-revalidate=300` | CDN + origin |
| API user-specific | `private, no-store` | None |

**Service Worker (SPA):** Cache shell (`index.html` + app shell); network-first for API; version cache on deploy.

---

## APPENDIX B: Extended Interview Question Bank

### B.1 React Performance Questions (1–75) — Answer keys

Format: **Q** / **Expected** / **Strong** / **Senior**

**Q1.** Difference between `useMemo` and `React.memo`?  
- **E:** Memo caches values; memo HOC caches component renders.  
- **S:** Different layers — computation vs component bailout.  
- **Sr:** Choose based on Profiler: expensive child vs expensive calculation.

**Q2.** Does React 18 batch `setState` in `setTimeout`?  
- **E:** Yes, automatic batching everywhere.  
- **S:** Except `flushSync`.  
- **Sr:** Batching reduces commits; doesn't reduce render work if state still flows to many children.

**Q3.** How to prevent context re-renders?  
- **E:** Split context, memoize value, use selectors.  
- **S:** `useContext` always re-renders consumer on any value change.  
- **Sr:** Consider state managers with `useSyncExternalStore` and subscriptions.

**Q4.** Virtual DOM faster than real DOM?  
- **E:** Not inherently — batches updates and enables declarative model.  
- **S:** Wrong updates still costly; less DOM work is the win.  
- **Sr:** Fiber + concurrent priorities address scheduling, not raw DOM speed.

**Q5.** When to use `useLayoutEffect` for perf?  
- **E:** Measure/mutate DOM before paint to avoid flicker.  
- **S:** Blocks paint — keep tiny.  
- **Sr:** Prefer CSS; layout effect for tooltips/popovers that need measurements.

**Q6.** `key={uuid()}` on list items?  
- **E:** Bad — remounts every render.  
- **S:** Breaks state and destroys DOM reuse.  
- **Sr:** Stable server IDs; index only if list static and append-only.

**Q7.** Suspense and performance?  
- **E:** Shows fallback while waiting.  
- **S:** Enables streaming SSR and selective hydration.  
- **Sr:** Coordinate with error boundaries; avoid waterfall if every child suspends serially — parallel data fetching at route level (Remix loaders, RSC).

**Q8.** RSC impact on bundle?  
- **E:** Server components don't ship to client.  
- **S:** Client components still bundled; boundary explicit.  
- **Sr:** Colocate data fetch on server; reduce client JSON parsing.

**Q9.** Why `children` prop can help perf?  
- **E:** Parent passes `<Child />` — element created in parent scope.  
- **S:** If parent re-renders but passes same `children` reference, memo child can skip.  
- **Sr:** Composition pattern — `Layout` slot for stable subtree.

**Q10.** Redux vs Context perf?  
- **E:** Redux uses subscriptions; context broadcasts.  
- **S:** `useSelector` with shallow equality limits renders.  
- **Sr:** RTK + entity adapter; avoid storing derived data; reselect memoization.

**Q11–Q75 (topic list — draft verbal answers using handbook sections):**  
Reconciliation O(n) heuristic; double buffering fibers; priority lanes; offscreen rendering; `useDeferredValue` vs debounced state; TanStack Virtual vs react-window; windowing overscan; infinite loader `rootMargin`; `React.unstable_batchedUpdates` legacy; Strict Mode effect double-invoke; ref callback cost; massive prop drilling; element vs component type change remounts; HOC re-render chains; render props inline functions; lazy boundary placement; route-based splitting vs component; dynamic import prefetch; module federation shared react duplicate; import cost of icons; barrel file tree-shake break; sideEffects false; CSS modules vs runtime CSS-in-JS; framer-motion layout animations layout cost; sticky header `position:fixed` compositor; portal modal focus trap perf; autocomplete debounce + transition; controlled input lag; uncontrolled + ref for forms; Web Vitals in SPA soft nav; `useSyncExternalStore` for viewport; subscription leak in custom hooks; `useEffect` missing deps infinite loop CPU; state colocation pattern; derived state anti-pattern; lifting state too high; Zustand selectors; Jotai atoms; Recoil atom families; Apollo cache normalize; Relay store GC; SWR `dedupingInterval`; mutation optimistic rollback perf; list filter on every keystroke; memoized selector wrong deps; `useCallback` with empty deps stale closure; `useMemo` for JSX objects; fragment keys; error boundary retry render storm; concurrent feature detection; `createRoot` vs `hydrateRoot`; legacy `ReactDOM.render` batching; suspense list `use` hook; server actions and revalidation; partial prerendering patterns.

---

### B.2 Browser Questions (1–50) — Answer keys

**Q1.** What is bfcache?  
- **E:** Back-forward cache — instant back navigation.  
- **S:** Page frozen in memory; `pageshow` `persisted` true.  
- **Sr:** `unload` listeners disable bfcache — use `pagehide`; affects SPAs with WebSockets.

**Q2.** `defer` vs `async` scripts?  
- **E:** `defer` runs after parse, order preserved; `async` runs when ready, order not guaranteed.  
- **S:** Neither blocks parse like sync scripts.  
- **Sr:** Module scripts deferred by default; use `type=module` for modern apps.

**Q3.** Why is `will-change` dangerous?  
- **E:** Creates layers — memory cost.  
- **S:** Use sparingly before animation, remove after.  
- **Sr:** Layer explosion hurts mobile GPU memory.

**Q4.** Passive event listeners?  
- **E:** `{ passive: true }` — browser won't wait for `preventDefault`.  
- **S:** Scroll/touch handlers can't block scroll — smoother.  
- **Sr:** Required for touch/wheel perf on document listeners.

**Q5.** CORS preflight impact?  
- **E:** OPTIONS request before POST with custom headers.  
- **S:** Cache preflight with `Access-Control-Max-Age`.  
- **Sr:** Design APIs to minimize custom headers on hot paths.

**Q6–Q50 topics:** DOM depth and selector perf; `getBoundingClientRect` force layout; `contain: strict` CSS; content-visibility auto; intersection observer vs scroll listener; `ResizeObserver` loop limit; shadow DOM perf; custom elements upgrade; parser blocking stylesheet; `@import` CSS delay; font subsetting; WOFF2; variable fonts cost; sprite sheets vs individual icons; HTTP/2 push deprecated why; connection coalescing; TLS 1.3 0-RTT replay risk; HSTS; DNS over HTTPS; IPv6 happy eyeballs; TCP cwnd; packet loss on mobile; QUIC migration; Service worker update race; indexedDB vs localStorage main thread; web assembly startup; shared worker use cases; broadcast channel; storage quota; third-party cookie phaseout impact; privacy sandbox ads perf; iframe lazy loading; `loading=lazy` native; priority hints spec; speculative rules API; prerender controversies; same-site cookies; CSRF vs perf; CSP inline script blocks; nonce hashes; integrity SRI; compression dictionaries; Early Hints 103; navigation timing API; resource timing; long tasks API; LoAF script attribution.

---

### B.3 Web Vitals Questions (1–40) — Answer keys

**Q1.** Good LCP threshold? — ≤2.5s p75 field.  
**Q2.** What replaced FID? — INP (March 2024+ emphasis).  
**Q3.** Does CLS count user-initiated shifts? — No, within grace window for clicks.  
**Q4.** Soft navigation in SPA? — Experimental APIs / frameworks updating vitals without full reload.  
**Q5.** TTFB vs LCP? — TTFB is server/network; LCP includes render.  
**Q6–Q40:** FCP role; SI deprecated; TBT lab proxy; TTI limitations; Speed Index; custom metrics; web-vitals attribution; element timing API; soft nav failures; hero image discovery; client-side nav LCP reset; reportWebVitals Next.js; CrUX monthly; Search Console vitals; field vs lab gap; device segmentation; geo CDN; percentiles p75 vs p95; budget in CI Lighthouse; calibrate throttling; RUM sample rate; privacy sampling; INP input types; keyboard vs pointer INP; SPA long task on route change; skeleton screens vitals impact; font preload CLS; ad slot reservation; carousel CLS; modal focus INP; dropdown search INP; WebView vitals; hybrid app wrappers; AMP comparisons; partial hydration LCP; edge SSR TTFB; ISR stale vitals; CDN cache miss LCP spike.

---

### B.4 Memory & Debugging (1–30) — Answer keys

**Q1.** Detached DOM node? — Removed from tree but referenced from JS.  
**Q2.** Why heap snapshot in prod is hard? — Size, PII, security; use staging.  
**Q3.** `WeakRef` use case? — Cache without preventing GC.  
**Q4.** `FinalizationRegistry`? — Cleanup when object collected (rare, careful).  
**Q5.** React Strict Mode double mount leak test? — Exposes missing effect cleanup.  
**Q6–Q30:** Timeline allocation stack; memory pressure callbacks; performance.memory chrome-only; tab discard; OOM crash; retainers path; dominators; shallow vs retained size; string interning; compiled code retention; source map memory devtools; HMR leak dev; hot reload listeners; webpack dev server growth; Storybook memory; jest jsdom leak; puppeteer detach; electron memory; node heap vs browser; ArrayBuffer transferables; Blob URL revoke; ObjectURL leak; canvas memory; WebGL context loss; AudioContext; MediaStream tracks; Notification permission objects; IndexedDB transaction pending; Cache API quota; SW cache eviction.

---

## APPENDIX C: Per-Section Hands-On Exercise Index

| Section | Exercise | Success criteria |
|---------|----------|------------------|
| 1 | Define perf budget for your app | Written doc with 5 metrics |
| 2 | Chrome Task Manager audit | Identify renderer vs GPU |
| 3 | Network filmstrip on Slow 4G | Document TTFB, FCP, LCP order |
| 4 | Force layout thrash demo + fix | Layout time ↓ 50%+ in trace |
| 5 | Run same function 10k times — observe IC | Understand warmup (optional: d8) |
| 6 | Predict micro/macrotask quiz | 10/10 correct |
| 7 | Draw stack/heap for nested calls | Peer review |
| 8 | Record GC in Performance | Identify major GC spikes |
| 9 | Leak + fix listener | Detached nodes stable after nav |
| 10 | Instrument web-vitals | Dashboard or console logs |
| 11 | Read Fiber section in 04-React-Internals | Explain work loop aloud |
| 12 | Profiler "why did this render" | Fix top re-render cause |
| 13 | One justified memo | Profiler proof |
| 14 | Virtualize 10k list | 60fps scroll |
| 15 | Add preconnect + preload | LCP −200ms lab (goal) |
| 16 | Bundle analyzer — remove one dep | KB reduction measured |
| 17 | Convert hero to WebP + dimensions | CLS = 0 on hero |
| 18 | Compare CSR vs SSR same page | LCP table |
| 19 | Intentional hydration bug + fix | No warning |
| 20 | `useTransition` on heavy filter | INP improves in lab |
| 21 | Move sort to Worker | Main thread long tasks ↓ |
| 22 | Cache-Control on static assets | 304 on repeat visit |
| 23 | Write debugging runbook | 1 page |
| 24 | Present one case study | 5 min verbal |
| 25 | 20 flagship questions aloud | Record yourself |
| 26 | Complete one project | Before/after metrics |
| 27 | Draw mind map from memory | No notes |

---

## Advanced Patterns

### Pattern 1: Performance as a feature flag

Ship optimizations behind flags; measure canary p75 LCP/INP before full rollout (Netflix, Uber style).

### Pattern 2: Long task observer in RUM

```javascript
if ('PerformanceObserver' in window) {
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      // send to analytics: entry.duration, entry.name
    }
  }).observe({ type: 'longtask', buffered: true });
}
```

### Pattern 3: Islands for marketing + app shell

Marketing SSG (fast LCP) + hydrated app island for logged-in experience.

### Pattern 4: Priority hints end-to-end

`fetchpriority` on LCP image + critical CSS inline + defer analytics.

### Pattern 5: Defensive hydration

Client-only components with consistent SSR fallback to avoid mismatch without sacrificing all SSR benefits.

---

## When to Use What — Decision Guide

```
START: What is slow?
 │
 ├─ First load / SEO ──► SSR/SSG/ISR + CDN + image + preload LCP
 │
 ├─ Interaction lag ──► INP: long tasks, React renders, useTransition
 │
 ├─ Layout jumping ──► CLS: dimensions, fonts, reserve ad space
 │
 ├─ Scroll jank ──► virtualization, composite-friendly CSS
 │
 ├─ Memory growth ──► heap snapshots, cleanup, cache limits
 │
 └─ Repeat visit ──► HTTP cache, service worker, React Query gcTime
```

| Symptom | Likely cause | First tool |
|---------|--------------|------------|
| Slow first paint | Blocking JS/CSS, slow TTFB | Network, Lighthouse |
| Tap delay | Long tasks | Performance panel |
| Jumping UI | Images/fonts/ads | Layout Shift regions |
| Tab crash | Memory leak | Memory snapshots |
| Huge bundle | Imports, no split | Coverage / analyzer |

---

## Common Pitfalls & How to Avoid Them

### Pitfall 1: Optimizing without measurement

**BAD:** Add `memo` everywhere on guess.  
**GOOD:** Profiler + Web Vitals field data → top bottleneck → fix → verify.

### Pitfall 2: Lazy-loading LCP image

**BAD:** `<img loading="lazy" />` on hero.  
**GOOD:** `priority` / preload hero; lazy below fold only.

### Pitfall 3: Index keys in dynamic lists

**BAD:** `key={index}` on reorderable list.  
**GOOD:** Stable `id` from server.

### Pitfall 4: Global context for theme + user + cart

**BAD:** One context → any change re-renders app.  
**GOOD:** Split contexts or external store with selectors.

### Pitfall 5: Measuring only Lighthouse desktop

**BAD:** 100 score on M1 Mac Wi‑Fi.  
**GOOD:** Mobile throttling + field CRUX.

### Pitfall 6: Ignoring third-party scripts

**BAD:** 400KB analytics before interactive.  
**GOOD:** Defer, tag manager rules, server-side analytics where possible.

### Pitfall 7: Synchronous heavy work on click

**BAD:** Filter 50k items synchronously in handler.  
**GOOD:** `startTransition`, Worker, or server-side search.

---

## Summary Cheatsheet

| Layer | Key lever | Default choice | Why |
|-------|-----------|----------------|-----|
| Network | CDN + HTTP/2/3 + compression | Brotli at CDN | Bandwidth ↓ |
| CRP | Critical CSS, defer JS | `defer` on non-module scripts | Faster FCP |
| Render | `transform`/`opacity` animations | Composite-only | Avoid layout |
| JS | Code split routes | `React.lazy` + Suspense | Smaller initial JS |
| React | Colocate state | Local state first | Fewer re-renders |
| Lists | Virtualize > ~100 heavy rows | `react-window` | DOM count bounded |
| Images | WebP + dimensions | `srcset` + no lazy LCP | LCP + CLS |
| Data | SSR/SSG for public pages | Next.js SSG + ISR | HTML fast |
| Metrics | RUM Web Vitals | `web-vitals` library | Real users |
| Debug | Profiler + Performance | Reproduce → fix → verify | Scientific method |

**Default senior stance:** Measure field metrics → reproduce under throttle → fix highest impact lever → guard with budget in CI → document in runbook.

---

*End of handbook. Expand interview banks by adding your own verbal answers to quick-bank topics using the 18-element template per topic.*
