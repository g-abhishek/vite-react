# Web Vitals — Complete Guide (Basics to Advanced)

> A hands-on learning guide: every Core Web Vital comes with a worked example, a runnable demo, and a **Your Turn** exercise so you build real intuition — not just read thresholds.

**Companion docs:** [`11-Frontend-Performance-Engineering-Complete-Guide.md`](../11-Frontend-Performance-Engineering-Complete-Guide.md), [`01-Event-Loop.md`](../01-Event-Loop.md), [`04-React-Internals.md`](../04-React-Internals.md), [`memory-leak/01-Memory-Leak-Detection-Debugging-Complete-Guide.md`](../memory-leak/01-Memory-Leak-Detection-Debugging-Complete-Guide.md)

**Runnable labs:** All HTML demos live in [`labs/`](./labs/). React exercises use your `vite-react` app at `/web-vitals`.

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
2. Run the example yourself — don't skip Lighthouse or DevTools steps.
3. Do **Your Turn** before scrolling to the **Solution** directly below each exercise.
4. Check **Expected result** — if yours differs, that's where real learning happens.
5. Compare **bad vs FIXED** lab pairs side by side.

**Suggested path:**

| Week | Sections | Focus |
| ---- | -------- | ----- |
| 1    | 1–4      | What Vitals are, LCP deep dive |
| 2    | 5–6      | INP + CLS deep dive |
| 3    | 7–9      | Measurement, DevTools, field data |
| 4    | 10–14    | React patterns, RUM, advanced, pitfalls |

---

## Table of Contents

1. [What Is Web Vitals? — The Real Explanation](#1-what-is-web-vitals--the-real-explanation)
2. [Why Web Vitals Matter — The Problems They Solve](#2-why-web-vitals-matter--the-problems-they-solve)
3. [Core Concepts & Mental Models](#3-core-concepts--mental-models)
4. [LCP — Largest Contentful Paint (Complete Deep Dive)](#4-lcp--largest-contentful-paint-complete-deep-dive)
5. [INP — Interaction to Next Paint (Complete Deep Dive)](#5-inp--interaction-to-next-paint-complete-deep-dive)
6. [CLS — Cumulative Layout Shift (Complete Deep Dive)](#6-cls--cumulative-layout-shift-complete-deep-dive)
7. [Supporting Metrics — TTFB, FCP, and the Loading Story](#7-supporting-metrics--ttfb-fcp-and-the-loading-story)
8. [Measurement Architecture — Field vs Lab, RUM, CrUX](#8-measurement-architecture--field-vs-lab-rum-crux)
9. [Chrome DevTools — Hands-On Debugging](#9-chrome-devtools--hands-on-debugging)
10. [React Patterns for Web Vitals](#10-react-patterns-for-web-vitals)
11. [Production RUM & Alerting](#11-production-rum--alerting)
12. [Advanced Patterns](#12-advanced-patterns)
13. [When to Use What — Decision Guide](#13-when-to-use-what--decision-guide)
14. [Common Pitfalls & How to Avoid Them](#14-common-pitfalls--how-to-avoid-them)

---

## Summary Cheatsheet

| Metric | Measures | Good (p75) | Needs Improvement | Poor | Primary lever |
| ------ | -------- | ---------- | ----------------- | ---- | ------------- |
| **LCP** | Largest visible content paint time | ≤ 2.5s | ≤ 4.0s | > 4.0s | Hero image, TTFB, render-blocking |
| **INP** | Worst interaction latency in visit | ≤ 200ms | ≤ 500ms | > 500ms | Long tasks, main-thread JS |
| **CLS** | Unexpected layout movement | ≤ 0.1 | ≤ 0.25 | > 0.25 | Dimensions, font swap, late injects |
| **TTFB** | Server response start | ≤ 800ms | ≤ 1.8s | > 1.8s | CDN, SSR cache, API latency |
| **FCP** | First any-content paint | ≤ 1.8s | ≤ 3.0s | > 3.0s | Critical CSS, blocking resources |

**Default investigation:** Field RUM alert → segment (device, route, region) → reproduce in lab (Slow 4G + 4× CPU) → find LCP element / long task / shift source → fix → verify in Lighthouse + field.

---

## 1. What Is Web Vitals? — The Real Explanation

### The idea (real-world analogy)

Imagine a restaurant review that scores only three things diners actually care about:

1. **How long until your main dish arrives** (LCP — the "hero" of the meal)
2. **How fast the waiter responds when you wave** (INP — every interaction, not just the first)
3. **Whether your table jumps around while you're eating** (CLS — plates sliding, chairs moving)

Web Vitals are Google's standardized way to score those three experiences on the web — objectively, on real users' devices.

### What the world looks like WITHOUT Web Vitals

```
Team ships feature → "Feels fast on my MacBook" → Users on 4G Android bounce
PM asks "is it slow?" → Engineer runs Lighthouse once → Score 92 → Ship anyway
SEO team wonders why rankings dropped → No shared metric language
```

Everyone measures something different. Nobody agrees what "slow" means.

### What it looks like WITH Web Vitals

```
Define budgets (LCP < 2.5s p75) → Build → Measure field + lab → Alert on regression
SEO uses same metrics as engineering → Fix hero image → LCP p75 drops 1.2s → Conversion up
```

### Before / after diagram

```
WITHOUT WEB VITALS                    WITH WEB VITALS
┌──────────────────┐                ┌──────────────────┐
│ Subjective "fast"│                │ LCP / INP / CLS  │
│ Lighthouse only  │                │ Field p75 + lab  │
│ Per-engineer gut │                │ Budgets in CI    │
└──────────────────┘                │ CrUX + RUM align │
                                    └──────────────────┘
```

### Core Web Vitals vs other Web Vitals

| Category | Metrics | Used for |
| -------- | ------- | -------- |
| **Core Web Vitals** | LCP, INP, CLS | Google Search ranking signal, business KPIs |
| **Other Web Vitals** | TTFB, FCP, FID (legacy) | Diagnostic — explain *why* Core Vitals fail |
| **Custom metrics** | Time-to-interactive for checkout, etc. | Product-specific goals |

**FID → INP:** First Input Delay measured only the *first* interaction delay. INP measures *all* interactions during the page visit and reports a high percentile (roughly the slowest meaningful interaction). INP replaced FID as a Core Web Vital in March 2024.

### Your Turn — Exercise 1.1: See Vitals in the Wild

**Goal:** Open a real page and watch metrics accumulate.

**Steps:**

1. Serve the lab file (from repo root):

```bash
npx --yes serve javascript/web-vitals/labs -p 5500
```

2. Open `http://localhost:5500/01-measure-vitals.html` in Chrome.
3. Open DevTools → Console.
4. Click the button, scroll the page, wait 5 seconds.

**Expected result:** Console logs LCP (ms), CLS (decimal), and possibly long-task entries. LCP rating turns green if hero painted under ~2.5s on fast connection.

**Bonus:** Open PageSpeed Insights for any public URL and note how field (CrUX) vs lab (Lighthouse) scores differ.

**Solution:** Open `01-measure-vitals.html`, interact, confirm console shows LCP/CLS. If LCP is missing, click the button and switch tabs — the metric finalizes on `visibilitychange` (page hide).

---

## 2. Why Web Vitals Matter — The Problems They Solve

### Problem 1: Bounce rate and revenue (speed = money)

Industry studies consistently show conversion drops as load time increases. A 3-second LCP on mobile vs 1.5-second LCP is not a "nice to have" — it is measurable revenue loss on checkout and landing pages.

### Problem 2: SEO and discoverability

Google uses Core Web Vitals as a page experience signal. Slow LCP and poor CLS can suppress rankings even when content quality is high.

### Problem 3: Invisible slowness on developer machines

```
Developer: M3 MacBook, fiber Wi‑Fi, LCP 0.8s  → "Ship it"
User:      ₹12k Android, 4G, CPU throttle 4×, LCP 5.2s → bounce
```

Without **field data** segmented by device and network, you optimize for the wrong audience.

### Problem 4: Interaction jank kills engagement (INP)

A feed that paints fast (good LCP) but freezes for 400ms on every "Like" tap (bad INP) feels broken. Users blame the app, not your CDN.

### Problem 5: Layout shift destroys trust (CLS)

```
User taps "Checkout" → ad banner loads above button → finger hits "Subscribe" instead
```

CLS is not cosmetic — mis-taps cause support tickets and abandoned carts.

### Problem 6: No shared language across teams

| Team | Without Vitals | With Vitals |
| ---- | -------------- | ----------- |
| Engineering | "TTI improved" | "LCP p75 regressed 400ms on /product" |
| Product | "Users complain" | "INP poor on mobile India segment" |
| SEO | "PageSpeed 70?" | "CLS 0.3 on blog templates" |

### What breaks without measuring Vitals

```jsx
// Looks fine in dev — kills mobile LCP
<img src="/hero-4mb.png" loading="lazy" />  // lazy ABOVE the fold = delayed LCP
```

### Your Turn — Exercise 2.1: Business Impact Math

**Goal:** Connect milliseconds to outcomes.

**Steps:**

1. Assume 100,000 monthly visitors on a product page.
2. Baseline conversion: 2%. LCP poor (>4s) causes 20% extra bounce (documented pattern in e-commerce studies).
3. Calculate: how many lost conversions if 40% of users see poor LCP?

**Expected result:** Roughly 100,000 × 0.40 × 0.20 × 0.02 ≈ **160 lost conversions/month** from LCP alone — before counting INP/CLS.

**Think about:** What is your average order value? That is the dollar cost of ignoring LCP.

**Solution:**

```
Visitors affected by poor LCP:  100,000 × 0.40 = 40,000
Extra bounces from poor LCP:    40,000 × 0.20 = 8,000
Lost conversions:               8,000 × 0.02  = 160/month
```

Scale by your average order value for revenue impact. At ₹500 AOV, that is ₹80,000/month left on the table from LCP alone.

---

## 3. Core Concepts & Mental Models

### Terminology you will use constantly

| Term | Plain English | Example |
| ---- | ------------- | ------- |
| **LCP** | Time until largest visible content element is painted | Hero image at 2.1s |
| **INP** | Latency from user input to next frame paint | Click → 280ms → visual update |
| **CLS** | Sum of unexpected layout shift scores in session | 0.05 = good, 0.3 = poor |
| **p75** | 75th percentile — 75% of users experience this or better | Google's default threshold basis |
| **Field data** | Real user measurements (RUM, CrUX) | "Mobile India Chrome p75 LCP" |
| **Lab data** | Synthetic test (Lighthouse, WebPageTest) | Controlled network + CPU |
| **Attribution** | Which element/script caused the metric | LCP element = `img#hero` |
| **Long task** | Main thread blocked ≥ 50ms | Blocks paint and input |
| **Session window** | Time span CLS/INP aggregate over | CLS uses 5s windows, max 1s gaps |

### Field vs lab — the most important mental model

```
                    FIELD (RUM / CrUX)              LAB (Lighthouse)
                    ─────────────────              ────────────────
Who                 Real users, all devices        Simulated Moto G + Slow 4G
When                Last 28 days (CrUX)            Right now, one run
Variance            High (network, cache, CPU)     Low (controlled)
Use for             SEO, SLOs, regressions         Debugging, CI gates
Misleading if       Only field, no reproduction    Only lab, no segmentation
```

**Rule:** Field tells you *if* and *who*; lab tells you *why*.

### How the three Core Vitals relate to the browser pipeline

```
Navigation start
      │
      ▼
   TTFB ─────────────► server/CDN speed
      │
      ▼
   FCP ─────────────► first paint (any content)
      │
      ▼
   LCP ─────────────► largest content painted
      │
      ▼
User interacts ──────► INP (input → processing → paint)
      │
      ▼
Late resources ──────► CLS (layout shifts if space not reserved)
```

### p75 vs p95 — which to optimize?

| Percentile | When to use |
| ---------- | ----------- |
| **p75** | Google CrUX thresholds, SEO, default SLO |
| **p95** | Worst-case UX for high-value flows (checkout) |
| **mean** | Avoid — one outlier skews; not used for Vitals |

### Your Turn — Exercise 3.1: Read a Metric Object

**Goal:** Understand the shape of data the `web-vitals` library reports.

**Steps:**

1. Open `javascript/web-vitals/labs/02-lcp-fast-FIXED.html` in Chrome.
2. Open Console after load.
3. Find the logged LCP object.

**Expected result:** Object with fields like `name: "LCP"`, `value` (ms), `rating` (`good` / `needs-improvement` / `poor`), `entries` (PerformanceEntry array), `id`, `navigationType`.

**Key fields to memorize:**

```javascript
{
  name: 'LCP',
  value: 1842,           // milliseconds
  rating: 'good',        // based on thresholds
  entries: [...],        // raw PerformanceObserver entries
  attribution: { ... }  // in attribution build — element, url, timing breakdown
}
```

**Solution:** In the console you should see an object similar to the one above. With the attribution build (`web-vitals.attribution.js`), also check `metric.attribution.element` (the DOM node) and `metric.attribution.url` (image src if LCP is an image). If `rating` is `good`, `value` will be ≤ 2500.

---

## 4. LCP — Largest Contentful Paint (Complete Deep Dive)

### 4.1 The idea

**LCP** answers: *"When did the main thing I came to see actually appear?"*

Not when HTML arrived. Not when JS finished. When the **largest meaningful content** in the viewport was **painted**.

**Analogy:** You ordered a pizza. LCP is when the pizza box opens — not when the delivery app says "driver assigned."

### 4.2 Key parameters & thresholds

| Rating | LCP time |
| ------ | -------- |
| Good | ≤ 2.5s |
| Needs improvement | ≤ 4.0s |
| Poor | > 4.0s |

Measured at **p75** across page loads (field data).

### 4.3 What can be the LCP element?

| Candidate | Qualifies? |
| --------- | ---------- |
| `<img>` in viewport | Yes — very common |
| `<video poster="...">` | Yes |
| Block with `background-image` | Yes |
| Large text block (`<h1>`, `<p>`) | Yes — if no larger image |
| `<svg>`, icon fonts | Rarely — usually too small |
| Off-screen content | No |
| `opacity: 0` content | No |

The browser emits multiple `largest-contentful-paint` entries; **the last one before user interaction or page hide wins**.

### 4.4 Step-by-step walkthrough

```
t=0ms     Navigation starts
t=200ms   TTFB — HTML chunk arrives (SSR or CDN)
t=350ms   Parser hits render-blocking CSS
t=800ms   FCP — skeleton/header paints (NOT LCP yet)
t=1200ms  Hero <img> download starts (no preload — late discovery)
t=2800ms  Hero image decoded and painted → LCP = 2800ms (needs improvement)
```

**If we preload the hero:**

```
t=0ms     Navigation + preload hint → image download starts immediately
t=200ms   TTFB
t=900ms   Hero painted → LCP = 900ms (good)
```

### 4.5 Flow diagram — LCP decision path

```
Page load starts
      │
      ▼
 Resources discovered ──► render-blocking? ──YES──► delay paint
      │                        │
      NO                       ▼
      ▼                   defer / inline critical CSS
 LCP candidate found
      │
      ▼
 Image? ──YES──► download + decode time
      │
      NO (text block)
      ▼
 Text render time
      │
      ▼
 Larger candidate appears? ──YES──► update LCP entry
      │
      NO (user input or timeout)
      ▼
 Final LCP recorded
```

### 4.6 LCP timing breakdown (Lighthouse / attribution)

```
        ┌─────────┬──────────────┬─────────────┬──────────────┐
        │  TTFB   │ Resource     │ Resource    │ Element      │
        │         │ load delay   │ load time   │ render delay │
        └─────────┴──────────────┴─────────────┴──────────────┘
                              = LCP
```

| Phase | What it means | Typical fix |
| ----- | ------------- | ----------- |
| TTFB | Server slow | CDN, cache, edge SSR |
| Resource load delay | Found late | `<link rel="preload">`, early in HTML |
| Resource load time | Bytes too big | WebP/AVIF, responsive `srcset`, CDN |
| Element render delay | JS/CSS blocking | Remove blocking scripts, `fetchpriority` |

### 4.7 Full implementation — measure + optimize LCP

```html
<!-- ── Document head: LCP optimizations ── -->
<head>
  <!-- Why: browser fetches hero before parser reaches <body> -->
  <link rel="preload" as="image" href="/hero-800.webp" fetchpriority="high" />

  <!-- Why: critical CSS inlined or non-blocking -->
  <link rel="stylesheet" href="/styles.css" media="print" onload="this.media='all'" />
</head>

<body>
  <!-- Why: explicit dimensions prevent CLS AND help layout before decode -->
  <img
    src="/hero-800.webp"
    width="800"
    height="450"
    fetchpriority="high"
    decoding="async"
    alt="Product hero"
  />
</body>
```

```javascript
// ── Measure LCP with attribution ─────────────────────────────
import { onLCP } from 'web-vitals/attribution';

onLCP((metric) => {
  const { element, url, timeToFirstByte, resourceLoadDelay, resourceLoadTime, elementRenderDelay } =
    metric.attribution;

  console.log({
    lcpMs: metric.value,
    rating: metric.rating,
    element: element?.tagName,
    url,
    breakdown: { timeToFirstByte, resourceLoadDelay, resourceLoadTime, elementRenderDelay },
  });

  // Send to RUM
  navigator.sendBeacon('/vitals', JSON.stringify(metric));
});
```

### 4.8 The flaw / edge case — SPA client-only hero

```
SSR HTML:  <div id="root"></div>     ← empty shell, tiny LCP (spinner?)
Hydration: Hero renders at 3.5s      ← real LCP is terrible
Lighthouse lab: May report misleading element on soft navigations
```

**Soft navigations** in SPAs (client-side route changes) are an evolving measurement area. For MPAs and SSR, LCP is well-defined. For CSR-only SPAs, first route LCP often equals "time until React paints hero."

### 4.9 Pros & cons — common LCP strategies

| Strategy | Pros | Cons |
| -------- | ---- | ---- |
| SSR / SSG hero HTML | LCP in first byte stream | Server cost, cache invalidation |
| Preload LCP image | Big win, low effort | Wrong preload competes with other resources |
| `fetchpriority="high"` | Browser prioritizes correctly | Only one or two elements should have it |
| Lazy-load below fold | Saves bandwidth | **Never** lazy-load LCP candidate |
| Responsive images (`srcset`) | Right bytes for viewport | Requires build pipeline |

### 4.10 React-specific LCP patterns

```jsx
// BAD — lazy hero above the fold
<img loading="lazy" src={heroUrl} />

// GOOD — priority + dimensions (Next.js: <Image priority />)
<img fetchPriority="high" width={800} height={450} src={heroUrl} alt="Hero" />

// GOOD — SSR: hero in server HTML, not behind useEffect
export function ProductPage({ product }) {
  return (
    <main>
      <img fetchPriority="high" width={800} height={450} src={product.heroUrl} alt={product.name} />
    </main>
  );
}
```

### Your Turn — Exercise 4.1: Compare LCP Labs

**Goal:** See preload + sizing impact on a real measurement.

**Steps:**

1. `npx serve javascript/web-vitals/labs -p 5500`
2. Run Lighthouse (Mobile, Slow 4G) on `02-lcp-slow.html` — note LCP.
3. Run Lighthouse on `02-lcp-fast-FIXED.html` — note LCP.
4. In DevTools Performance → Timings, find LCP marker on each.

**Expected result:** Fast page LCP at least 30–50% lower than slow page. LCP element should be the hero `<img>`.

**React:** Visit `http://localhost:5173/web-vitals/lcp` — toggle Slow vs Fixed, watch Vitals overlay.

**Solution:**

| Page | Typical mobile LCP (Slow 4G) |
| ---- | ---------------------------- |
| `02-lcp-slow.html` | 3.5–6s (poor) |
| `02-lcp-fast-FIXED.html` | 1.5–2.5s (good) |

In Performance → Timings, the slow page shows a late LCP marker aligned with the large image download. The fast page shows LCP shortly after TTFB because preload started the download early.

---

## 5. INP — Interaction to Next Paint (Complete Deep Dive)

### 5.1 The idea

**INP** answers: *"When I tap, click, or type — how long until the screen responds?"*

It captures the full interaction pipeline:

```
Input event → event handlers → JS framework update → style/layout/paint → frame on screen
```

**Analogy:** You ring a doorbell (click). INP is the time until the door actually opens (next paint) — not when the bell sound started.

### 5.2 Key parameters & thresholds

| Rating | INP |
| ------ | --- |
| Good | ≤ 200ms |
| Needs improvement | ≤ 500ms |
| Poor | > 500ms |

INP is derived from all **click, tap, and key press** interactions during the page lifecycle. The reported value is typically the **98th percentile** of interaction latencies (worst interactions dominate).

### 5.3 Step-by-step walkthrough

```
User clicks "Add to cart"
t=0ms     pointerdown
t=5ms     click event queued
t=8ms     React onClick starts
t=280ms   Heavy sync filter / re-render entire tree (LONG TASK)
t=320ms   Browser paints button state + cart count → INP ≈ 320ms (poor)
```

**After fix (useTransition + memoized rows):**

```
t=0ms     click
t=12ms    urgent: button pressed state painted
t=180ms   deferred: cart list updates → INP ≈ 12ms for that interaction (good)
```

### 5.4 Flow diagram

```
User input (click/tap/key)
      │
      ▼
 Main thread busy? ──YES──► input queued (delay grows)
      │
      NO
      ▼
 Event handlers run
      │
      ▼
 Duration ≥ 50ms? ──YES──► LONG TASK — blocks next paint
      │
      NO
      ▼
 requestAnimationFrame / React commit
      │
      ▼
 Paint next frame ──► INP for this interaction recorded
```

### 5.5 Full implementation — detect and fix long tasks

```javascript
// ── RUM: log long tasks alongside INP ──────────────────────────
import { onINP } from 'web-vitals/attribution';

onINP((metric) => {
  console.log('INP', metric.value, metric.attribution?.interactionTarget);
});

new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (entry.duration > 50) {
      console.warn('Long task', entry.duration, 'ms', entry);
    }
  }
}).observe({ type: 'longtask', buffered: true });
```

```javascript
// ── BAD: sync work on every keystroke ─────────────────────────
searchInput.addEventListener('input', (e) => {
  const results = heavyFilter(e.target.value, 50_000_items);
  renderList(results); // blocks main thread
});

// ── GOOD: chunk + defer with scheduler ────────────────────────
searchInput.addEventListener('input', (e) => {
  const q = e.target.value;
  requestAnimationFrame(() => {
    startTransition(() => renderList(filter(q))); // React 18+
  });
});
```

### 5.6 The flaw / edge case — optimistic UI hides bad INP

```javascript
setLiked(true);        // paints instantly — feels good
await api.like();      // network slow — not counted in INP
heavyAnalytics();      // 400ms sync work AFTER paint — still hurts next interaction
```

INP measures interaction-to-**next paint**. Optimistic updates help, but long tasks immediately after can poison the *next* tap.

### 5.7 Pros & cons — INP optimization strategies

| Strategy | Pros | Cons |
| -------- | ---- | ---- |
| `useTransition` | Keeps input urgent, defer list updates | Slightly stale UI for one frame |
| Web Workers | Offload heavy compute | Serialization cost, complexity |
| Virtualize lists | Fewer DOM nodes per interaction | Implementation overhead |
| Code splitting | Less JS to parse on interaction | Does not fix per-keystroke work |
| `passive: true` listeners | Scroll not blocked | Cannot `preventDefault` |

### 5.8 FID vs INP — interview clarity

| | FID (legacy) | INP (current) |
| - | ------------ | ------------- |
| Measures | Delay before first handler runs | Full input → paint for all interactions |
| Scope | First interaction only | Entire page visit |
| Blind spot | First tap fast, rest terrible | Captures sustained jank |

### Your Turn — Exercise 5.1: Feel Long Tasks

**Goal:** Block the main thread and watch INP suffer.

**Steps:**

1. Open `javascript/web-vitals/labs/04-inp-long-task.html`
2. Click "Bad click" — notice UI freeze.
3. Click "Good click" — notice responsiveness between chunks.
4. Open Performance → record → click both buttons.

**Expected result:** Bad click produces ~300ms long task. Good click shows multiple shorter tasks with gaps. INP rating worse after bad clicks.

**React:** `/web-vitals/inp` — type quickly in Bad vs Fixed search boxes.

**Solution:** Bad button produces one ~300ms long task — the UI freezes until it completes. Good button produces six ~50ms tasks with `setTimeout(0)` gaps between them, so the browser can paint between chunks. INP after bad clicks is often > 200ms (poor); after good clicks it stays under 200ms.

---

## 6. CLS — Cumulative Layout Shift (Complete Deep Dive)

### 6.1 The idea

**CLS** answers: *"Did the page jump around while I was trying to read or tap?"*

Only **unexpected** shifts count. If a user clicks "Load more" and content expands — that is expected. If an ad injects and pushes a button down — unexpected.

**Analogy:** You're reading a newspaper and someone keeps pulling the paper downward while your finger is mid-sentence.

### 6.2 Key parameters & formula

**Layout shift score** = `impact fraction × distance fraction`

```
impact fraction  = % of viewport affected by shift
distance fraction = how far elements moved (as % of viewport)
```

**CLS** = sum of scores from unexpected shifts in **session windows** (max 5s gap, windows max 1s without shift).

| Rating | CLS |
| ------ | --- |
| Good | ≤ 0.1 |
| Needs improvement | ≤ 0.25 |
| Poor | > 0.25 |

### 6.3 Step-by-step walkthrough

```
t=0s    User sees paragraph + CTA button at y=400px
t=1.5s  Ad banner (250px) injects ABOVE button without reserved space
        Viewport shift: button moves 400→650px
        impact = 0.6, distance = 0.25 → score = 0.15 (this shift alone)
t=2.0s  Web font swaps — headline grows 20px taller
        Another shift score = 0.04
Total CLS ≈ 0.19 (needs improvement)
```

**With reserved ad slot + font fallback:**

```
t=1.5s  Ad fills pre-sized slot — no movement → shift score = 0
t=2.0s  Font swap with matched metrics → shift score ≈ 0
Total CLS ≈ 0.02 (good)
```

### 6.4 Flow diagram

```
Layout change detected
      │
      ▼
 hadRecentInput? ──YES──► user caused it → may be excluded
      │
      NO
      ▼
 Expected? (skeleton → content same box) ──YES──► low/zero score
      │
      NO
      ▼
 Compute impact × distance
      │
      ▼
 Add to current session window
      │
      ▼
 Report cumulative CLS
```

### 6.5 Full implementation — prevent CLS

```html
<!-- BAD -->
<img src="product.jpg" />
<div id="ad"></div>

<!-- GOOD -->
<img src="product.jpg" width="400" height="300" alt="Product" />
<div id="ad" style="min-height: 250px; aspect-ratio: 16/9;"></div>
```

```css
/* GOOD: reserve space for dynamic embed */
.embed-slot {
  min-height: 315px; /* matches iframe height */
  background: #f0f0f0;
}

/* GOOD: reduce font swap shift */
@font-face {
  font-family: 'Brand';
  src: url('/brand.woff2') format('woff2');
  font-display: swap;
  size-adjust: 105%; /* tune to match fallback */
}
```

```javascript
import { onCLS } from 'web-vitals/attribution';

onCLS((metric) => {
  for (const entry of metric.entries) {
    if (!entry.hadRecentInput) {
      console.log('Shift', entry.value, entry.sources); // which elements moved
    }
  }
});
```

### 6.6 The flaw / edge case — cookie banners and modals

```
CLS looks good on load → user scrolls → GDPR banner slides in → CLS spikes
```

Measure CLS across the **full session**, not only first 3 seconds. Late injects are a top production CLS cause.

### 6.7 Pros & cons — CLS strategies

| Strategy | Pros | Cons |
| -------- | ---- | ---- |
| width/height on images | Simple, huge win | Must keep aspect ratio on responsive |
| `aspect-ratio` CSS | Modern, flexible | Old browser fallbacks |
| Skeleton placeholders | Good perceived perf | Wrong size skeleton = shift anyway |
| `font-display: optional` | Zero font shift | May show fallback entire visit |
| Transform animations | Move without layout | `top/left` animations still shift |

### 6.8 Top CLS culprits in React SPAs

| Culprit | Fix |
| ------- | --- |
| Late-loaded ads / embeds | `min-height` container |
| Images without dimensions | `width`/`height` or `aspect-ratio` |
| Font swap | `size-adjust`, preload fonts, fallback metrics |
| Client-only injected UI | Reserve space in SSR HTML |
| Infinite scroll append | Skeleton row height matches real rows |

### Your Turn — Exercise 6.1: CLS Bad vs Fixed

**Steps:**

1. Open `03-cls-bad.html` — watch content jump at ~1.5s.
2. Open `03-cls-good-FIXED.html` — no jump.
3. Compare CLS in console from `web-vitals` logger.

**Expected result:** Bad page CLS > 0.1; fixed page CLS < 0.05.

**React:** `/web-vitals/cls` — toggle modes, wait for ad.

**Solution:**

| Page | Typical CLS |
| ---- | ----------- |
| `03-cls-bad.html` | 0.15–0.35 (poor) |
| `03-cls-good-FIXED.html` | 0–0.05 (good) |

On the bad page, the ad inject at ~1.5s pushes the CTA button down — that single shift often exceeds 0.1 by itself. The fixed page reserves 250px, so the ad fills existing space with zero movement.

---

## 7. Supporting Metrics — TTFB, FCP, and the Loading Story

### 7.1 TTFB (Time to First Byte)

**What:** Time from navigation start until first HTML byte arrives.

**Why it matters:** You cannot paint hero before HTML exists (CSR) or SSR stream starts.

| Rating | TTFB |
| ------ | ---- |
| Good | ≤ 800ms |
| Needs improvement | ≤ 1800ms |
| Poor | > 1800ms |

**Fixes:** CDN edge cache, stale-while-revalidate, reduce SSR data waterfalls, connection reuse (HTTP/2/3).

### 7.2 FCP (First Contentful Paint)

**What:** First text or image painted — anything visible.

**Difference from LCP:** FCP is *any* content; LCP is the *largest* meaningful content. FCP ≤ LCP always.

### 7.3 Diagnostic chain

```
TTFB high     → backend / CDN problem
FCP high, TTFB ok → render-blocking CSS/JS
LCP >> FCP    → hero resource slow (image, font, client render)
INP poor, LCP good → main-thread JS on interaction
CLS high      → layout reservation problem (often independent of LCP)
```

### Your Turn — Exercise 7.1: TTFB vs LCP

**Steps:**

1. In Chrome DevTools → Network, throttle Slow 3G.
2. Reload `02-lcp-fast-FIXED.html`.
3. Note `Waiting (TTFB)` on document vs hero image `Content Download`.

**Expected result:** If TTFB > 600ms on document, LCP cannot be good no matter how small the image.

**Solution:** On Slow 3G the document row shows a long `Waiting (TTFB)` bar — that is time before the first HTML byte. LCP cannot happen before HTML exists and the parser discovers the hero `<img>`. Even with preload, LCP ≥ TTFB + resource load. If TTFB alone is 800ms, your LCP floor is already near the "needs improvement" threshold before the image downloads.

---

## 8. Measurement Architecture — Field vs Lab, RUM, CrUX

### 8.1 The idea

You need **two measurement systems**:

1. **Lab** — reproducible debugging (Lighthouse CI, local throttling)
2. **Field** — truth about real users (RUM beacon, Google CrUX)

```
┌─────────────┐     beacon      ┌─────────────┐
│ User browser│ ──────────────► │ RUM backend │
│ web-vitals  │                 │ (Datadog,   │
└─────────────┘                 │  custom)    │
                                └──────┬──────┘
                                       │
┌─────────────┐     aggregate        ▼
│ CrUX (Google)│ ◄─── p75 LCP/INP/CLS dashboards
└─────────────┘
```

### 8.2 web-vitals library — production pattern

```javascript
import { onCLS, onINP, onLCP, onTTFB, onFCP } from 'web-vitals';

function sendToAnalytics(metric) {
  const body = JSON.stringify({
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    id: metric.id,
    page: location.pathname,
    device: navigator.userAgent,
  });

  // Why: sendBeacon survives page unload (metric fires on hide)
  (navigator.sendBeacon && navigator.sendBeacon('/vitals', body)) ||
    fetch('/vitals', { body, method: 'POST', keepalive: true });
}

onCLS(sendToAnalytics);
onINP(sendToAnalytics);
onLCP(sendToAnalytics);
onTTFB(sendToAnalytics);
onFCP(sendToAnalytics);
```

### 8.3 CrUX vs your RUM

| | CrUX | Your RUM |
| - | ---- | -------- |
| Source | Chrome users only | All browsers you instrument |
| History | 28-day rolling | Real-time |
| Granularity | Origin or URL level | Custom dimensions (user id, A/B) |
| Cost | Free (PSI, Search Console) | Infrastructure |

### 8.4 Lab tools comparison

| Tool | Best for |
| ---- | -------- |
| Lighthouse (DevTools) | Quick audit, single URL |
| Lighthouse CI | PR regressions |
| WebPageTest | Film strip, connection waterfall |
| Chrome Trace | Long tasks, scripting flame chart |

### Your Turn — Exercise 8.1: Wire RUM Collector

**Steps:**

1. Terminal A:

```bash
node javascript/web-vitals/labs/05-rum-collector.mjs
```

2. Terminal B: start vite-react (`npm run dev` in `vite-react/`).
3. Visit `/web-vitals/lcp`, interact, then:

```bash
curl http://localhost:3460/vitals
```

**Expected result:** JSON array with LCP/INP/CLS entries and timestamps.

**Solution:** After visiting `/web-vitals/lcp` and interacting with the page, `curl http://localhost:3460/vitals` returns a JSON array like:

```json
[
  {
    "receivedAt": "2026-06-13T10:00:00.000Z",
    "name": "LCP",
    "value": 1842,
    "rating": "good",
    "path": "/web-vitals/lcp"
  }
]
```

If the array is empty, confirm the RUM collector is running on port 3460 and that `VitalsDashboard` is posting to `http://localhost:3460/vitals`.

---

## 9. Chrome DevTools — Hands-On Debugging

### 9.1 Lighthouse workflow

```
1. Incognito window (extensions off)
2. DevTools → Lighthouse → Mobile + Slow 4G
3. Note Performance score AND "Diagnostics" → LCP element, CLS culprits
4. Map each audit failure to a lever (Section 13 table)
```

### 9.2 Performance panel workflow

```
1. Performance → ⚙ → CPU: 4× slowdown, Network: Slow 4G
2. Record → reload page → stop
3. Timings row: FCP, LCP markers
4. Main thread: long yellow blocks = long tasks
5. Bottom-up: sort by Self time — find hot functions
```

### 9.3 Layout Shift regions

```
1. Performance recording → enable "Screenshots" and "Layout Shift Regions"
2. Reload — purple overlays show what moved
3. Match overlay timing to Network (late image? font?)
```

### 9.4 Web Vitals extension

Install [Web Vitals Chrome extension](https://chrome.google.com/webstore/detail/web-vitals/ahfhijdlegdabablpippeagkligmfola) for live overlay on any site.

### Your Turn — Exercise 9.1: Full Debug Session

**Goal:** Debug slow LCP on `02-lcp-slow.html` end-to-end.

**Steps:**

1. Lighthouse → copy LCP element selector.
2. Performance trace → measure resource load delay.
3. List top 3 fixes in priority order.

**Expected result:** (1) preload + resize image, (2) remove blocking script, (3) add explicit dimensions.

**Solution:**

| Priority | Fix | Why |
| -------- | --- | --- |
| 1 | Preload + resize hero to 800px WebP | Cuts resource load delay and load time — usually the biggest LCP win |
| 2 | Remove the 200ms blocking `<script>` | Reduces element render delay |
| 3 | Add explicit `width`/`height` on hero | Prevents layout recalc delay; also helps CLS |

In Lighthouse Diagnostics, the LCP element should be `img#hero-img`. In the Performance trace, look for a long gap between FCP and LCP — that gap is your image download + decode.

---

## 10. React Patterns for Web Vitals

### 10.1 LCP in React

| Pattern | Impact |
| ------- | ------ |
| SSR/SSG hero markup | Best LCP — HTML includes hero |
| `fetchPriority="high"` on hero | Browser priority hint |
| Avoid `loading="lazy"` on LCP | Critical mistake |
| Don't gate hero behind `useEffect` fetch | Adds element render delay |

```jsx
// BAD — hero only after client fetch
function Page() {
  const [data, setData] = useState(null);
  useEffect(() => { fetch('/api').then(r => r.json()).then(setData); }, []);
  if (!data) return <Spinner />;
  return <img src={data.hero} />;
}

// GOOD — hero from SSR loader / RSC / initial props
function Page({ product }) {
  return <img fetchPriority="high" width={800} height={450} src={product.hero} alt="" />;
}
```

### 10.2 INP in React

```jsx
import { useTransition, useMemo, memo } from 'react';

const Row = memo(function Row({ item }) {
  return <li>{item}</li>;
});

function SearchList({ items }) {
  const [query, setQuery] = useState('');
  const [filtered, setFiltered] = useState(items);
  const [isPending, startTransition] = useTransition();

  const onChange = (e) => {
    const q = e.target.value;
    setQuery(q);
    startTransition(() => {
      setFiltered(items.filter((i) => i.includes(q)));
    });
  };

  return (
    <>
      <input value={query} onChange={onChange} />
      {isPending && <span aria-busy>…</span>}
      <ul>{filtered.map((i) => <Row key={i} item={i} />)}</ul>
    </>
  );
}
```

**Avoid:** `flushSync` except when necessary — forces synchronous paint, hurts INP.

### 10.3 CLS in React

```jsx
// GOOD — aspect-ratio wrapper for dynamic images
function ProductCard({ src, w, h }) {
  return (
    <div style={{ aspectRatio: `${w}/${h}` }}>
      <img src={src} width={w} height={h} alt="" style={{ width: '100%', height: 'auto' }} />
    </div>
  );
}

// GOOD — ad slot with fixed min-height
function AdSlot({ children }) {
  return <aside style={{ minHeight: 250 }}>{children ?? ' '}</aside>;
}
```

### 10.4 Vitals in vite-react app

| Route | Exercise |
| ----- | -------- |
| `/web-vitals` | Overview + live dashboard |
| `/web-vitals/lcp` | Slow vs Fixed hero |
| `/web-vitals/cls` | Ad inject shift |
| `/web-vitals/inp` | Search responsiveness |

Files: `vite-react/src/components/WebVitals/`

### Your Turn — Exercise 10.1: Fix Slow LCP Component

**Goal:** Edit `SlowLcpHero` in `LcpDemo.jsx` to achieve "good" LCP.

**Hints:** Remove artificial delay, add dimensions, use smaller image, `fetchPriority`.

**Solution:** Replace `SlowLcpHero` with this — remove the `useState`/`useEffect` delay entirely:

```jsx
export function SlowLcpHero() {
  return (
    <img
      alt="Fast hero"
      width={800}
      height={450}
      fetchPriority="high"
      decoding="async"
      src="https://picsum.photos/seed/reactfast/800/450"
      style={{ width: '100%', maxWidth: 800, height: 'auto', display: 'block' }}
    />
  );
}
```

Reload `/web-vitals/lcp` — the Vitals overlay should show LCP in the **good** range. This matches `FixedLcpHero` in `LcpDemo.jsx`.

---

## 11. Production RUM & Alerting

### 11.1 What to ship

| Signal | Alert when |
| ------ | ---------- |
| LCP p75 by route | > 2.5s for 24h |
| INP p75 by route | > 200ms |
| CLS p75 | > 0.1 |
| Sample rate | 10–100% depending on traffic |

### 11.2 Segmentation dimensions

Always break down by:

- `device` (mobile vs desktop)
- `connection` (if available via Network Information API)
- `country` / `region`
- `route` / `page template`
- `release` / `commit sha`

### 11.3 Regression investigation playbook

```
Alert: LCP p75 +600ms on /products
  │
  ├─► Deploy correlate? → rollback canary if yes
  ├─► LCP element changed? → attribution in RUM
  ├─► TTFB up? → API/CDN
  ├─► Resource load up? → new image size?
  └─► Lab reproduce → Performance trace → fix → verify 48h field
```

### 11.4 CI integration (Lighthouse CI)

```bash
# Example: fail PR if LCP > 3s in lab
npx @lhci/cli autorun --config=lighthouserc.json
```

```json
{
  "ci": {
    "assert": {
      "assertions": {
        "largest-contentful-paint": ["error", { "maxNumericValue": 3000 }],
        "cumulative-layout-shift": ["error", { "maxNumericValue": 0.1 }]
      }
    }
  }
}
```

---

## 12. Advanced Patterns

### 12.1 Soft navigations in SPAs

Client-side route changes do not trigger full navigation. The Chrome team is evolving **soft navigation** LCP/INP attribution. Today:

- Use RUM with `route` dimension on each `history.pushState`
- Consider **PerformanceObserver** `navigation` entries where supported
- MPA or SSR per critical landing routes if LCP SLO strict

### 12.2 INP + Long Animation Frames (LoAF)

**LoAF** API attributes long frames to scripts — finer than `longtask` for finding which callback blocked paint.

```javascript
new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    console.log('LoAF', entry.duration, entry.scripts);
  }
}).observe({ type: 'long-animation-frame', buffered: true });
```

### 12.3 Speculation Rules API (prefetch/prerender)

```html
<script type="speculationrules">
{
  "prefetch": [{ "where": { "href_matches": "/product/*" }, "eagerness": "moderate" }]
}
</script>
```

**Trade-off:** Prerender improves LCP on *next* navigation but costs bandwidth if users do not navigate.

### 12.4 Priority Hints across resource types

```html
<link rel="preload" href="/critical.woff2" as="font" crossorigin fetchpriority="high" />
<link rel="preload" href="/below-fold.js" as="script" fetchpriority="low" />
```

### 12.5 Third-party script containment

```html
<!-- Load analytics after idle -->
<script>
  requestIdleCallback(() => {
    const s = document.createElement('script');
    s.src = 'https://analytics.example.com/tag.js';
    document.head.appendChild(s);
  });
</script>
```

Facades (lite-youtube-embed pattern) defer heavy embeds until user interaction — huge INP and LCP win.

---

## 13. When to Use What — Decision Guide

### 13.1 Decision flowchart

```
Metric failing?
      │
      ├─ LCP ──► TTFB high? ──YES──► CDN / SSR cache / API
      │              │
      │              NO
      │              ▼
      │         LCP element image? ──YES──► preload, resize, fetchpriority
      │              │
      │              NO (text)
      │              ▼
      │         Render delay? ──YES──► reduce blocking JS/CSS, SSR content
      │
      ├─ INP ──► Long tasks in trace? ──YES──► split work, Worker, useTransition
      │              │
      │              NO
      │              ▼
      │         Huge DOM? ──YES──► virtualize list
      │
      └─ CLS ──► Images/fonts? ──YES──► dimensions, font-display, size-adjust
                   │
                   NO
                   ▼
              Late injects? ──YES──► reserve min-height slots
```

### 13.2 Lookup table

| Symptom | First check | Fix |
| ------- | ----------- | --- |
| LCP 4s mobile | Hero image size | WebP + srcset + preload |
| LCP good desktop, poor mobile | CPU + network | Test 4× throttle |
| INP bad on search | Input handler | Debounce + useTransition |
| INP bad on route change | Main bundle size | Code split |
| CLS on load | Images | width/height |
| CLS after 3s | Ads / cookie banner | Reserved slot, bottom sheet |
| Lab good, field bad | Cache hit in lab | Field-only CDN miss |

### 13.3 By team size

| Team | Minimum viable |
| ---- | -------------- |
| Solo | Lighthouse on deploy + web-vitals console |
| Small | RUM collector + LHCI on PR |
| Large | CrUX dashboards + SLO alerts + perf on-call |

---

## 14. Common Pitfalls & How to Avoid Them

### Pitfall 1: Lazy-loading the LCP image

```html
<!-- BAD -->
<img loading="lazy" src="/hero.webp" />

<!-- GOOD -->
<img fetchpriority="high" src="/hero.webp" width="800" height="450" />
```

**Why BAD fails:** Browser defers lazy images until near viewport — LCP waits for intersection logic.

### Pitfall 2: Measuring only Lighthouse

**BAD:** Ship when Lighthouse Performance = 95.

**GOOD:** Lighthouse in CI **plus** field p75 on top 10 routes.

**Why:** Lab uses fresh cache profile; returning users with cold CDN miss look nothing like Lighthouse.

### Pitfall 3: Optimizing FCP instead of LCP

**BAD:** Celebrate fast spinner paint.

**GOOD:** LCP element is hero content, not skeleton.

### Pitfall 4: useEffect-gated above-the-fold content

```jsx
// BAD
useEffect(() => { fetchHero().then(setHero); }, []);

// GOOD — data from loader/SSR
function Page({ hero }) { return <img fetchPriority="high" src={hero} />; }
```

### Pitfall 5: Ignoring CLS from third parties

**BAD:** Drop ad script in `<head>` with no slot.

**GOOD:** `min-height` container + load ad into slot.

### Pitfall 6: flushSync for "instant" updates

```javascript
// BAD — blocks until paint completes synchronously
import { flushSync } from 'react-dom';
flushSync(() => setState(x));

// GOOD
startTransition(() => setState(x));
```

### Pitfall 7: Wrong preload target

```html
<!-- BAD — preloading image that is NOT LCP -->
<link rel="preload" as="image" href="/logo-32.png" />

<!-- GOOD — match actual LCP element URL -->
<link rel="preload" as="image" href="/hero-800.webp" fetchpriority="high" />
```

### Your Turn — Exercise 14.1: Spot the Pitfalls

Which code samples are BAD?

```jsx
// A
<img loading="lazy" src={banner} style={{ width: '100%' }} />

// B
<img width={600} height={400} src={banner} fetchPriority="high" />

// C
useEffect(() => { import('./heavy-chart'); }, []);
// chart below fold — OK

// D
document.body.appendChild(adScript); // no reserved space
```

**Expected result:** A and D are BAD. B is GOOD. C is OK if chart is below fold.

**Solution:**

| Sample | Verdict | Reason |
| ------ | ------- | ------ |
| A | BAD | `loading="lazy"` on likely LCP element + no explicit dimensions |
| B | GOOD | `width`/`height` + `fetchPriority="high"` — correct LCP pattern |
| C | OK | Below-fold code split does not block LCP or INP on load |
| D | BAD | Late DOM inject without reserved `min-height` slot → CLS spike |

---

## Quick Reference — Lab Files

| File | How to run | What you learn |
| ---- | ---------- | -------------- |
| `01-measure-vitals.html` | `npx serve javascript/web-vitals/labs` | PerformanceObserver basics |
| `02-lcp-slow.html` | Lighthouse mobile | Bad LCP patterns |
| `02-lcp-fast-FIXED.html` | Compare to slow | Preload + priority |
| `03-cls-bad.html` | Watch ad inject | Unexpected shift |
| `03-cls-good-FIXED.html` | Compare to bad | Reserved slots |
| `04-inp-long-task.html` | Click both buttons | Long tasks vs chunking |
| `05-rum-collector.mjs` | `node javascript/web-vitals/labs/05-rum-collector.mjs` | RUM ingestion |

## Quick Reference — React Routes

| Route | Component | Metric |
| ----- | --------- | ------ |
| `/web-vitals` | Overview | All |
| `/web-vitals/lcp` | `LcpDemo` | LCP |
| `/web-vitals/cls` | `ClsDemo` | CLS |
| `/web-vitals/inp` | `InpDemo` | INP |

---

## Interview Quick Bank

| Question | Core answer |
| -------- | ----------- |
| What are Core Web Vitals? | LCP, INP, CLS — loading, interactivity, stability |
| Why INP over FID? | All interactions, not just first; captures sustained jank |
| What is p75? | 75% of experiences at or below this value |
| LCP vs FCP? | FCP = first any paint; LCP = largest meaningful content |
| How is CLS calculated? | Sum of impact×distance for unexpected shifts in session windows |
| Field vs lab? | Field = real users; lab = reproducible debug |
| How to fix poor LCP? | TTFB, preload hero, remove blocking, right-size image |
| How to fix poor INP? | Break long tasks, useTransition, virtualize, Workers |
| How to fix poor CLS? | width/height, aspect-ratio, reserve ad slots, font metrics |
| Does lazy loading help LCP? | **No** — hurts LCP if applied to hero |

**Default recommendation:** Instrument `web-vitals` in production RUM, set p75 SLOs on top templates, run Lighthouse CI on PRs, debug regressions with Performance trace + attribution breakdown — same workflow as the memory leak guide's snapshot diff, but for user-facing latency.
