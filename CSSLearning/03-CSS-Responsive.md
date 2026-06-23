# CSS Responsive Design - Complete Guide

## Table of Contents
1. [Guide Audit and Improvement Map](#guide-audit-and-improvement-map)
2. [What is Responsive Design?](#what-is-responsive-design)
3. [Viewport Meta Tag](#viewport-meta-tag)
4. [Media Queries](#media-queries)
5. [Mobile-First vs Desktop-First](#mobile-first-vs-desktop-first)
6. [Responsive Units](#responsive-units)
7. [Responsive Images](#responsive-images)
8. [Responsive Typography](#responsive-typography)
9. [Container Queries](#container-queries)
10. [Responsive Patterns](#responsive-patterns)
11. [When to Use What - Decision Guide](#when-to-use-what---decision-guide)
12. [Common Pitfalls and How to Avoid Them](#common-pitfalls-and-how-to-avoid-them)
13. [Interview Questions](#interview-questions)
14. [Exercises](#exercises)
15. [Summary Cheatsheet](#summary-cheatsheet)

---

## Guide Audit and Improvement Map

This guide already had the correct responsive-design topics: viewport, media
queries, mobile-first CSS, fluid units, responsive images, typography, container
queries, common layout patterns, interview questions, and exercises.

The main improvement needed was **depth**. Many sections explained the syntax, but
not always the reason behind the syntax. Responsive design is easy to memorize
incorrectly if you only remember rules like "use `max-width: 100%`" or "use
`min-width` media queries." The real skill is understanding the layout pressure:
content has a natural size, containers provide available space, devices add
constraints, and CSS decides how to negotiate between all three.

### What Was Improved

| Area | Previous State | Improved Learning Goal |
|------|----------------|------------------------|
| Responsive design definition | Short definition | Explain the content-first mental model |
| Viewport meta tag | Syntax-focused | Explain browser layout viewport vs visual viewport |
| Media queries | API examples | Explain breakpoint reasoning and cascade flow |
| Mobile-first CSS | Good comparison | Add why progressive enhancement works better |
| Units | Strong viewport coverage | Add `%`, `rem`, `em`, `fr`, `min()`, `max()`, `clamp()` reasoning |
| Images | Good examples | Add browser selection algorithm and art-direction thinking |
| Typography | Useful snippets | Add readability, line length, rhythm, and scaling concepts |
| Container queries | Good intro | Add component ownership model and when not to use them |
| Patterns | Useful snippets | Add decision logic for choosing the pattern |
| Pitfalls | Missing as a module | Added production mistakes with bad/good code |
| Cheatsheet | Quick syntax | Expanded into concept-based reference |

### How to Study This Guide

Do not study responsive design as a list of breakpoints. Study it as a series of
questions:

1. What is the content trying to do naturally?
2. How much space does its parent container provide?
3. At what exact width does the design become uncomfortable?
4. Can fluid sizing solve it before adding a breakpoint?
5. If a breakpoint is needed, should it depend on the viewport or the container?
6. Does the solution still work with zoom, larger text, touch input, slow network,
   and different image densities?

That question sequence is the practical responsive-design workflow.

---

## What is Responsive Design?

Responsive design means creating websites that adapt to any screen size - from mobile phones to desktop monitors.

The deeper idea is this: **responsive design is not about designing for devices;
it is about designing for changing available space**. A phone, tablet, laptop,
desktop monitor, split-screen browser window, zoomed page, embedded widget, and
resized desktop browser are all just different space constraints.

Think of responsive design like arranging furniture in different rooms. The sofa,
table, and chair are the same content, but a small room needs a different
arrangement than a large hall. You do not throw away the furniture; you change the
layout so the furniture still works.

### Without Responsive Design vs With Responsive Design

```
WITHOUT RESPONSIVE DESIGN
┌─────────────────────────────────────────────┐
│ Desktop layout is fixed at 1200px            │
└─────────────────────────────────────────────┘
          squeezed into a 375px phone
          │
          ▼
┌─────────────┐
│ tiny text   │
│ horizontal  │
│ scrolling   │
│ broken nav  │
└─────────────┘

WITH RESPONSIVE DESIGN
┌─────────────┐     ┌──────────────────┐     ┌────────────────────────┐
│ phone       │     │ tablet           │     │ desktop                │
│ one column  │     │ two columns      │     │ multi-column layout    │
│ large taps  │     │ wider content    │     │ full navigation        │
└─────────────┘     └──────────────────┘     └────────────────────────┘
```

The same HTML can produce all three experiences. CSS decides how the content
should reflow when the available space changes.

### The Core Mental Model

Responsive CSS is a negotiation between four things:

| Force | What It Means | Example |
|-------|---------------|---------|
| Content | The natural size of text, images, buttons, tables, and forms | A long product title needs wrapping space |
| Container | The parent box that limits available width | A card inside a sidebar has less room than a card in main content |
| Viewport | The browser's visible area | A 390px phone viewport vs a 1440px desktop viewport |
| User settings | Zoom, font size, reduced motion, contrast, input type | A user at 200% zoom needs flexible layout |

When a layout breaks, one of these forces is being ignored.

### The Three Pillars of Responsive Design

```
1. FLEXIBLE GRIDS          2. FLEXIBLE IMAGES       3. MEDIA QUERIES
   Use relative units         Images scale with        Apply styles based
   (%, fr, vw) instead       their containers         on screen size
   of fixed pixels

   ┌─────────────────┐       ┌─────────────────┐     @media (max-width: 768px)
   │  width: 50%     │       │  max-width: 100%│     {
   │  (not 500px)    │       │  height: auto   │       .nav { flex-direction: 
   └─────────────────┘       └─────────────────┘              column; }
                                                      }
```

### Why Responsive Design Matters

```
2024 Web Traffic:
┌────────────────────────────────────────────────────────────┐
│ Mobile: ████████████████████████████████████  ~60%         │
│ Desktop: ██████████████████████  ~35%                      │
│ Tablet: ████  ~5%                                          │
└────────────────────────────────────────────────────────────┘

If your site isn't responsive, you're losing 60%+ of users!
```

That traffic statistic is useful, but the bigger point is that **responsive
design protects the user's ability to complete a task**. A shopping cart, login
form, documentation page, dashboard, and checkout flow should not become harder
just because the viewport changed.

Common real-world problems responsive design solves:

| Problem | Scenario | Responsive Fix |
|---------|----------|----------------|
| Horizontal scrolling | A fixed `1200px` layout appears on a `390px` phone | Use fluid widths and breakpoints |
| Tiny unreadable text | Browser shrinks a desktop page onto mobile | Use viewport meta and scalable typography |
| Broken navigation | Ten links do not fit in one row | Collapse or wrap navigation |
| Huge image downloads | Phone downloads a `3000px` desktop image | Use `srcset`, `sizes`, and lazy loading |
| Bad tap targets | Desktop links are too small for fingers | Use pointer queries and minimum target sizes |
| Overcrowded components | A card layout works in main content but not sidebar | Use container queries |

### Responsive Design Is Not Only Screen Size

A common beginner mistake is thinking:

```css
/* Too narrow as a mental model */
@media (max-width: 768px) {
  /* mobile styles */
}
```

Real responsive design also considers:

| Dimension | Why It Matters |
|-----------|----------------|
| Width | Determines how many columns can fit |
| Height | Affects heroes, modals, sticky areas, and mobile browser UI |
| Input type | Touch needs larger targets than mouse |
| Pixel density | Retina screens need higher-resolution images |
| User preference | Dark mode, reduced motion, and contrast affect usability |
| Container size | Reusable components may appear in many layout contexts |

---

## Viewport Meta Tag

The viewport meta tag is the bridge between the physical device screen and the
CSS layout viewport.

Before responsive design became normal, many websites were built only for desktop
widths. Mobile browsers tried to make those pages usable by pretending the page
was around `980px` wide, laying it out like a desktop page, and then shrinking it
down to the phone screen. That protected old desktop sites, but it breaks modern
responsive CSS unless we explicitly tell the browser: "Use the real device width
as the layout width."

### The Essential Meta Tag

```html
<!-- MUST include this for responsive design -->
<meta name="viewport" content="width=device-width, initial-scale=1.0">
```

### What Happens Without It?

```
WITHOUT viewport meta tag:
┌─────────────────────────────────────────────────────────────────────┐
│ Mobile browser renders page at desktop width (usually 980px)        │
│ Then SHRINKS it to fit screen                                       │
│                                                                     │
│   Phone Screen:              What you see:                          │
│   ┌─────────┐               ┌─────────┐                             │
│   │         │               │ tiny    │  ← Text too small to read   │
│   │         │               │ content │  ← Must pinch-zoom          │
│   │         │               │ here    │  ← Terrible UX              │
│   └─────────┘               └─────────┘                             │
└─────────────────────────────────────────────────────────────────────┘

WITH viewport meta tag:
┌─────────────────────────────────────────────────────────────────────┐
│ Browser uses actual device width                                    │
│                                                                     │
│   Phone Screen:              What you see:                          │
│   ┌─────────┐               ┌─────────┐                             │
│   │         │               │ Normal  │  ← Readable text            │
│   │         │               │ sized   │  ← No zoom needed           │
│   │         │               │ content │  ← Great UX                 │
│   └─────────┘               └─────────┘                             │
└─────────────────────────────────────────────────────────────────────┘
```

### Layout Viewport vs Visual Viewport

This distinction explains why the viewport tag matters so much.

| Viewport | Meaning | Example |
|----------|---------|---------|
| Layout viewport | The width CSS uses to calculate layout | `980px` without the meta tag on many mobile browsers |
| Visual viewport | The part of the page the user can currently see | `390px` on an iPhone-sized screen |

Without the meta tag, CSS may think it has `980px` of layout space even though
the user only sees `390px`. Media queries, widths, and text sizing then make
decisions using the wrong reality.

```
Phone screen: 390px wide

Without meta tag:
CSS layout viewport = 980px
@media (max-width: 600px) does NOT run
Page is scaled down visually

With meta tag:
CSS layout viewport = 390px
@media (max-width: 600px) runs
Page is laid out for the actual phone width
```

### Viewport Properties Explained

```html
<meta name="viewport" content="
  width=device-width,     
  initial-scale=1.0,      
  maximum-scale=5.0,      
  minimum-scale=1.0,      
  user-scalable=yes       
">
```

| Property | Value | Meaning | Practical Advice |
|----------|-------|---------|------------------|
| `width` | `device-width` | Viewport width equals device screen width | Almost always required |
| `initial-scale` | `1.0` | Initial zoom level is 100% | Standard default |
| `maximum-scale` | `5.0` | Maximum zoom allowed | Avoid restricting unless required |
| `minimum-scale` | `1.0` | Minimum zoom allowed | Rarely needed |
| `user-scalable` | `yes` | Allows pinch-to-zoom | Keep zoom enabled for accessibility |

### Accessibility Warning

```html
<!-- NEVER DO THIS - Accessibility violation -->
<meta name="viewport" content="width=device-width, initial-scale=1.0, 
  maximum-scale=1.0, user-scalable=no">

<!-- Why it's bad:
   - Prevents users with visual impairments from zooming
   - Violates WCAG accessibility guidelines
   - May fail accessibility audits
-->

<!-- Always allow zooming -->
<meta name="viewport" content="width=device-width, initial-scale=1.0">
```

### The Concept to Remember

The viewport meta tag does not make your layout responsive by itself. It simply
makes the browser report the correct layout width. After that, your CSS still
needs flexible grids, fluid media, readable typography, and thoughtful breakpoints.

```
Viewport meta tag
 │
 ▼
Browser uses real device width
 │
 ▼
Media queries and fluid units get accurate information
 │
 ▼
Responsive CSS can make correct layout decisions
```

---

## Media Queries

Media queries apply CSS rules based on device characteristics (screen size, orientation, etc.).

Think of a media query as a conditional rule in CSS:

```
IF the environment matches this condition
THEN apply these extra CSS rules
OTHERWISE ignore them
```

The important word is **extra**. A media query does not replace the cascade. It
adds more rules into the normal CSS cascade when its condition is true.

### How the Browser Evaluates Media Queries

```
Browser loads CSS
 │
 ▼
Reads base styles
 │
 ▼
Checks each @media condition
 │
 ├── condition false ──► skip that block
 │
 └── condition true ───► include that block in the cascade
                         │
                         ▼
                 specificity + order still decide winners
```

This is why two media queries can both match at the same time. If the viewport is
`1200px`, then `(min-width: 768px)` and `(min-width: 1024px)` both match. The
later rule wins if specificity is equal.

### Basic Syntax

```css
@media media-type and (condition) {
  /* CSS rules here */
}

/* Examples */
@media screen and (max-width: 768px) {
  .container {
    width: 100%;
  }
}

@media print {
  .no-print {
    display: none;
  }
}
```

### Media Types

```css
@media screen { }  /* Computer screens, tablets, phones */
@media print { }   /* Print preview and printed pages */
@media all { }     /* All devices (default if not specified) */

/* 'screen' is most common */
@media (max-width: 768px) { }  /* Same as @media all and (max-width: 768px) */
```

### Width Conditions

```css
/* MAXIMUM width - applies when viewport is AT MOST this wide */
@media (max-width: 768px) {
  /* Applies when viewport ≤ 768px */
}

/* MINIMUM width - applies when viewport is AT LEAST this wide */
@media (min-width: 769px) {
  /* Applies when viewport ≥ 769px */
}

/* Exact width (rare) */
@media (width: 768px) {
  /* Applies only when viewport = exactly 768px */
}

/* Range (combine min and max) */
@media (min-width: 768px) and (max-width: 1024px) {
  /* Applies when 768px ≤ viewport ≤ 1024px */
}

/* Modern range syntax (CSS Media Queries Level 4) */
@media (768px <= width <= 1024px) {
  /* Same as above, cleaner syntax */
}
```

### How to Think About `min-width` and `max-width`

`min-width` means: "from this size upward." It is additive and fits mobile-first
CSS.

```
Base styles       600px styles       900px styles
mobile first      added on top        added on top
     │                 │                  │
     ▼                 ▼                  ▼
0px ───────────── 600px ───────────── 900px ─────────────►
```

`max-width` means: "up to this size." It is useful when you start from a large
layout or need a small-screen exception.

```
Small override applies here
◄───────────── 767px
0px ──────────┬──────────────────────────────────────────►
              │
              desktop/base layout continues after this
```

Neither one is morally better. The reason mobile-first is preferred is that most
interfaces should start with the simplest, most constrained version and add
complexity only when space allows.

### Logical Operators

```css
/* AND - Both conditions must be true */
@media screen and (min-width: 768px) and (orientation: landscape) {
  /* Screen AND at least 768px AND landscape */
}

/* OR (comma) - Either condition can be true */
@media (max-width: 600px), (orientation: portrait) {
  /* Either small screen OR portrait orientation */
}

/* NOT - Negates the entire query */
@media not print {
  /* Everything except print */
}

/* ONLY - Prevents older browsers from applying styles */
@media only screen and (max-width: 768px) {
  /* Modern browsers only */
}
```

### Common Breakpoints

```css
/* 
Common breakpoints (based on Bootstrap 5):
┌──────────────────────────────────────────────────────────────────┐
│  xs    │   sm    │    md    │    lg     │    xl    │    xxl     │
│ <576px │ ≥576px  │  ≥768px  │  ≥992px   │  ≥1200px │  ≥1400px   │
│ Phone  │ Phone+  │  Tablet  │  Desktop  │ Desktop+ │ Large Desk │
└──────────────────────────────────────────────────────────────────┘
*/

/* Mobile-first breakpoints (recommended) */
/* Base styles for mobile - no media query needed */

@media (min-width: 576px) {
  /* Small devices and up */
}

@media (min-width: 768px) {
  /* Tablets and up */
}

@media (min-width: 992px) {
  /* Desktops and up */
}

@media (min-width: 1200px) {
  /* Large desktops and up */
}

@media (min-width: 1400px) {
  /* Extra large desktops */
}
```

### Breakpoints Should Come From Content

Framework breakpoints are a useful starting point, but the best breakpoint is the
point where your layout actually starts to fail.

Example:

```
Card layout:

At 700px:
┌──────────────┐ ┌──────────────┐
│ Card title   │ │ Card title   │
│ readable     │ │ readable     │
└──────────────┘ └──────────────┘

At 560px:
┌──────────┐ ┌──────────┐
│ Very long│ │ Another  │
│ product  │ │ title    │
│ title... │ │ wraps... │
└──────────┘ └──────────┘

At 520px:
┌────────────────────────┐
│ One column is clearer  │
└────────────────────────┘
```

The breakpoint should be near `520px`, not necessarily `576px`, `768px`, or any
popular framework number.

### Breakpoint Workflow

1. Build the component with flexible CSS first.
2. Slowly resize the browser.
3. Notice where the content becomes cramped, unreadable, or awkward.
4. Add the smallest media query that fixes that specific problem.
5. Repeat for the next real layout failure.

```
Start fluid
 │
 ▼
Resize viewport
 │
 ▼
Does content still read well?
 │
 ├── YES ──► no breakpoint needed
 │
 └── NO ───► add breakpoint at the failure point
```

### Feature Queries

```css
/* Orientation */
@media (orientation: portrait) {
  /* Height > Width */
}

@media (orientation: landscape) {
  /* Width > Height */
}

/* Hover capability */
@media (hover: hover) {
  /* Device has hover (mouse, trackpad) */
  .button:hover {
    background: blue;
  }
}

@media (hover: none) {
  /* No hover (touchscreen) */
  .button:active {
    background: blue;
  }
}

/* Pointer precision */
@media (pointer: fine) {
  /* Precise pointer (mouse) - can have smaller click targets */
}

@media (pointer: coarse) {
  /* Imprecise pointer (finger) - need larger touch targets */
  .button {
    min-height: 44px;  /* Apple's recommended minimum */
    min-width: 44px;
  }
}

/* Prefers color scheme (Dark Mode) */
@media (prefers-color-scheme: dark) {
  :root {
    --bg-color: #1a1a2e;
    --text-color: #eaeaea;
  }
}

@media (prefers-color-scheme: light) {
  :root {
    --bg-color: #ffffff;
    --text-color: #333333;
  }
}

/* Prefers reduced motion (Accessibility) */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* Prefers contrast */
@media (prefers-contrast: high) {
  .button {
    border: 2px solid black;
  }
}

/* Display mode (PWA) */
@media (display-mode: standalone) {
  /* App is installed as PWA */
  .install-prompt {
    display: none;
  }
}
```

### @supports (Feature Detection)

```css
/* Check if browser supports a feature */
@supports (display: grid) {
  .container {
    display: grid;
  }
}

/* Fallback for browsers without support */
.container {
  display: flex;  /* Fallback */
}

@supports (display: grid) {
  .container {
    display: grid;  /* Use grid if supported */
  }
}

/* NOT operator */
@supports not (display: grid) {
  .container {
    display: flex;
  }
}

/* Combine conditions */
@supports (display: grid) and (gap: 20px) {
  .container {
    display: grid;
    gap: 20px;
  }
}
```

### Media Queries vs Feature Queries

Media queries ask about the **environment**:

```css
@media (min-width: 768px) {
  /* Is the viewport wide enough? */
}
```

Feature queries ask about **browser capability**:

```css
@supports (display: grid) {
  /* Does this browser understand CSS Grid? */
}
```

Use media queries to adapt to conditions. Use `@supports` to progressively use
new CSS features while keeping a fallback.

---

## Mobile-First vs Desktop-First

This module is about CSS architecture, not just screen size. The question is:
which version should be the default, and which versions should be layered on top?

### Mobile-First Approach (Recommended)

Start with mobile styles, then ADD styles for larger screens using `min-width`.

```css
/* Base styles = Mobile (no media query) */
.container {
  width: 100%;
  padding: 15px;
}

.nav {
  display: flex;
  flex-direction: column;
}

.sidebar {
  display: none;  /* Hidden on mobile */
}

/* Tablet and up */
@media (min-width: 768px) {
  .container {
    width: 750px;
    padding: 20px;
  }
  
  .nav {
    flex-direction: row;
  }
  
  .sidebar {
    display: block;
    width: 200px;
  }
}

/* Desktop and up */
@media (min-width: 1024px) {
  .container {
    width: 970px;
  }
  
  .sidebar {
    width: 250px;
  }
}

/* Large desktop */
@media (min-width: 1200px) {
  .container {
    width: 1140px;
  }
}
```

**Visual representation:**

```
Mobile (base)    +Tablet           +Desktop          +Large Desktop
min-width: 0     min-width: 768    min-width: 1024   min-width: 1200
     │                │                 │                  │
     ▼                ▼                 ▼                  ▼
┌─────────┐     ┌───────────┐    ┌──────────────┐   ┌────────────────┐
│ ███████ │     │ ████████  │    │ ████████████ │   │ ██████████████ │
│ ███████ │     │ ████████  │    │ █████ █████  │   │ █████ ████████ │
│ ███████ │     │ ██ ██ ██  │    │ ████  ████   │   │ ████  ████████ │
└─────────┘     └───────────┘    └──────────────┘   └────────────────┘
Single column   Content wider    Sidebar appears   Max width reached
```

### Desktop-First Approach

Start with desktop styles, then REMOVE/OVERRIDE for smaller screens using `max-width`.

```css
/* Base styles = Desktop */
.container {
  width: 1140px;
  padding: 20px;
}

.nav {
  display: flex;
  flex-direction: row;
}

.sidebar {
  width: 250px;
}

/* Tablet */
@media (max-width: 1023px) {
  .container {
    width: 750px;
  }
  
  .sidebar {
    width: 200px;
  }
}

/* Mobile */
@media (max-width: 767px) {
  .container {
    width: 100%;
    padding: 15px;
  }
  
  .nav {
    flex-direction: column;
  }
  
  .sidebar {
    display: none;
  }
}
```

### The Real Difference

Mobile-first says:

```
Start with the essential experience.
Add layout complexity only when more space exists.
```

Desktop-first says:

```
Start with the richest layout.
Remove or override pieces when space becomes limited.
```

That difference matters because CSS is cumulative. If you start with a complex
desktop layout, mobile often becomes a pile of overrides:

```css
/* Desktop-first often grows like this */
.sidebar { display: block; width: 280px; }
.promo-banner { display: grid; grid-template-columns: 1fr 1fr; }
.nav { display: flex; gap: 2rem; }

@media (max-width: 767px) {
  .sidebar { display: none; }
  .promo-banner { display: block; }
  .nav { display: none; }
}
```

Mobile-first usually starts with the version that has fewer assumptions:

```css
/* Mobile-first starts simpler */
.sidebar { display: none; }
.promo-banner { display: block; }
.nav { display: none; }

@media (min-width: 768px) {
  .sidebar { display: block; width: 280px; }
  .promo-banner { display: grid; grid-template-columns: 1fr 1fr; }
  .nav { display: flex; gap: 2rem; }
}
```

The second version is easier to reason about because the larger layout is an
enhancement, not something mobile must undo.

### Why Mobile-First is Better

| Mobile-First | Desktop-First |
|--------------|---------------|
| Start with essentials | Start with full features |
| Add complexity for larger screens | Remove complexity for smaller |
| Smaller CSS for mobile (loads faster) | Mobile loads ALL CSS then overrides |
| Progressive enhancement | Graceful degradation |
| Forces content prioritization | May forget mobile experience |
| Uses `min-width` | Uses `max-width` |

**Performance reason:**

```
Mobile-First CSS loading:
Phone loads:     [base] ────────────────────── 10KB
Tablet loads:    [base] + [tablet] ─────────── 15KB
Desktop loads:   [base] + [tablet] + [desktop] 20KB

Desktop-First CSS loading:
Phone loads:     [everything] then [overrides] 25KB ← Wasteful!
Tablet loads:    [everything] then [overrides] 22KB
Desktop loads:   [base] ────────────────────── 20KB
```

### When Desktop-First Is Still Reasonable

Mobile-first is a strong default, but desktop-first can be reasonable when:

| Situation | Why Desktop-First May Fit |
|-----------|---------------------------|
| Existing legacy desktop product | Rewriting everything may be too risky |
| Internal dashboard mainly used on desktop | Desktop is the primary task environment |
| Print-like or canvas-heavy UI | The large layout is the core experience |
| Short-lived prototype | Speed may matter more than long-term CSS architecture |

Even then, individual components can still use mobile-first CSS internally.

---

## Responsive Units

Responsive units are how CSS expresses relationships instead of hard-coded
answers.

Fixed pixels say:

```css
.card {
  width: 400px;
}
```

That means "this card wants to be `400px` no matter what." Sometimes that is
fine, but responsive design often needs a softer statement:

```css
.card {
  width: min(100%, 400px);
}
```

That means "this card can be as wide as `400px`, but it must never overflow its
parent." Responsive units let your CSS describe intent.

### Unit Families

| Unit Family | Examples | Best For | Mental Model |
|-------------|----------|----------|--------------|
| Absolute | `px` | Borders, tiny offsets, fixed icons | Exact measurement |
| Font-relative | `rem`, `em`, `ch` | Typography, spacing tied to text | Scale with text |
| Parent-relative | `%` | Fluid widths inside a container | Share of parent |
| Viewport-relative | `vw`, `vh`, `dvh`, `svh` | Full-screen sections, fluid type | Share of browser viewport |
| Grid-relative | `fr`, `minmax()` | CSS Grid tracks | Share of leftover grid space |
| Container-relative | `cqw`, `cqi` | Component-level fluid sizing | Share of query container |

### `%`, `rem`, `em`, `ch`, and `fr`

```css
.article {
  width: 90%;        /* 90% of parent width */
  max-width: 70ch;   /* about 70 characters wide */
  padding: 1rem;     /* based on root font size */
}

.button {
  font-size: 1rem;
  padding: 0.75em 1em;
  /* em here scales with the button's own font-size */
}

.grid {
  display: grid;
  grid-template-columns: 1fr 2fr;
  /* second column receives twice the leftover space of the first */
}
```

Key distinction:

| Unit | Relative To | Common Use |
|------|-------------|------------|
| `%` | Parent size | Widths and layout regions |
| `rem` | Root font size | Consistent spacing and type scale |
| `em` | Current element font size | Button padding, icon sizing near text |
| `ch` | Width of the `0` character | Readable text measure |
| `fr` | Available grid space | Grid column distribution |

### Viewport Units

```css
.element {
  /* vw - 1% of viewport WIDTH */
  width: 100vw;      /* Full viewport width */
  width: 50vw;       /* Half viewport width */
  font-size: 5vw;    /* Font scales with viewport */
  
  /* vh - 1% of viewport HEIGHT */
  height: 100vh;     /* Full viewport height */
  min-height: 50vh;  /* At least half viewport */
  
  /* vmin - 1% of SMALLER dimension (width or height) */
  width: 50vmin;     /* 50% of smaller dimension */
  
  /* vmax - 1% of LARGER dimension */
  width: 50vmax;     /* 50% of larger dimension */
}
```

**vmin and vmax explained:**

```
Landscape screen (1920 × 1080):
  vmin = 1% of 1080 = 10.8px
  vmax = 1% of 1920 = 19.2px

Portrait phone (375 × 812):
  vmin = 1% of 375 = 3.75px
  vmax = 1% of 812 = 8.12px

Use case: Square that's always visible
.square {
  width: 80vmin;
  height: 80vmin;
  /* Always fits in viewport regardless of orientation */
}
```

### The 100vh Problem on Mobile

```
Desktop: 100vh = visible area
┌──────────────────┐
│                  │
│   100vh = this   │
│                  │
└──────────────────┘

Mobile: 100vh = includes space behind browser UI problem
┌──────────────────┐
│ Address Bar      │ ← Part of 100vh but hidden!
├──────────────────┤
│                  │
│   Visible area   │
│                  │
├──────────────────┤
│ Navigation       │ ← Part of 100vh but hidden!
└──────────────────┘

Problem: Content gets hidden behind mobile browser UI!
```

### New Viewport Units (Solution!)

```css
/* Dynamic Viewport Height - RECOMMENDED */
.hero {
  height: 100dvh;
}
/*
  dvh changes dynamically:
  - When browser UI visible: smaller
  - When browser UI hidden: larger
  - Smooth transition between states
*/

/* Small Viewport Height */
.hero {
  height: 100svh;
}
/*
  svh = height when browser UI is VISIBLE (smallest possible)
  Use when you want guaranteed visibility
*/

/* Large Viewport Height */
.hero {
  height: 100lvh;
}
/*
  lvh = height when browser UI is HIDDEN (largest possible)
  Use for full-screen experiences
*/
```

**Visual comparison:**

```
┌──────────────────┐     ┌──────────────────┐
│ Address Bar      │     │                  │
├──────────────────┤     │                  │
│                  │     │                  │
│    100svh        │     │     100lvh       │
│    (small)       │     │     (large)      │
│                  │     │                  │
├──────────────────┤     │                  │
│ Nav Bar          │     │                  │
└──────────────────┘     └──────────────────┘
  Browser UI visible      Browser UI hidden

100dvh = Transitions between svh and lvh dynamically
```

### JavaScript Fallback for Older Browsers

```css
.hero {
  /* Fallback */
  height: 100vh;
  
  /* Modern browsers */
  height: 100dvh;
  
  /* JavaScript variable fallback */
  height: calc(var(--vh, 1vh) * 100);
}
```

```javascript
function setVH() {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
}

setVH();
window.addEventListener('resize', setVH);
```

### clamp() for Fluid Values

```css
/* clamp(minimum, preferred, maximum) */

/* Fluid font size */
h1 {
  /* Minimum 24px, preferred 5vw, maximum 72px */
  font-size: clamp(1.5rem, 5vw, 4.5rem);
}

/* How it works:
   - If 5vw < 24px: use 24px (minimum)
   - If 5vw > 72px: use 72px (maximum)
   - Otherwise: use 5vw (fluid)
   
   Screen 480px: 5vw = 24px → uses 24px (min)
   Screen 800px: 5vw = 40px → uses 40px (fluid)
   Screen 1600px: 5vw = 80px → uses 72px (max)
*/

/* Fluid padding */
.container {
  padding: clamp(1rem, 5vw, 3rem);
}

/* Fluid gap */
.grid {
  gap: clamp(1rem, 3vw, 2.5rem);
}

/* Fluid width */
.card {
  width: clamp(280px, 30vw, 400px);
}
```

### `min()`, `max()`, and `clamp()` as Design Constraints

These functions are not tricks. They are a way to encode design boundaries.

```css
.wrapper {
  width: min(100% - 2rem, 1120px);
  margin-inline: auto;
}
```

Meaning:

```
Use the smaller value:
- available width minus side spacing
- maximum readable layout width
```

```css
.touch-target {
  min-height: max(44px, 2.75rem);
}
```

Meaning:

```
Use the larger value:
- accessibility minimum target size
- text-relative size
```

```css
.title {
  font-size: clamp(2rem, 5vw, 4rem);
}
```

Meaning:

```
Never smaller than 2rem
Prefer 5vw while it is reasonable
Never larger than 4rem
```

### Unit Decision Guide

| Goal | Use | Why |
|------|-----|-----|
| Text size | `rem` or `clamp()` | Respects user font settings |
| Button padding | `em` | Padding scales with button text |
| Article width | `ch` + `max-width` | Protects readable line length |
| Full viewport hero | `min-height: 100dvh` | Handles mobile browser UI better |
| Fluid section spacing | `clamp()` | Avoids many breakpoint-only spacing rules |
| Grid columns | `fr`, `minmax()`, `auto-fit` | Lets layout adapt to available space |
| Reusable component spacing | Container query units | Scales with component context |

### calc() for Responsive Calculations

```css
.element {
  /* Mix different units */
  width: calc(100% - 200px);
  
  /* Sidebar layout */
  --sidebar-width: 250px;
  .main {
    width: calc(100% - var(--sidebar-width));
  }
  
  /* Responsive with fallback */
  padding: calc(1rem + 2vw);
  
  /* Complex calculations */
  font-size: calc(16px + (24 - 16) * ((100vw - 320px) / (1200 - 320)));
  /* Linear interpolation from 16px at 320px to 24px at 1200px */
}
```

---

## Responsive Images

Images are often the heaviest part of a responsive page. A layout can look
responsive while still being wasteful if a small phone downloads a huge desktop
image.

Responsive images solve two different problems:

| Problem | Tool | Example |
|---------|------|---------|
| Same image, different file sizes | `srcset` + `sizes` | `400w`, `800w`, `1200w` versions |
| Different crop or composition | `<picture>` | Wide desktop hero vs tight mobile crop |

### Basic Responsive Image

```css
img {
  max-width: 100%;   /* Never exceed container width */
  height: auto;      /* Maintain aspect ratio */
  display: block;    /* Remove bottom gap (inline default) */
}
```

### srcset - Different Sizes for Different Screens

```html
<!-- Browser chooses best image based on screen size and DPR -->
<img 
  src="image-800.jpg"
  srcset="
    image-400.jpg 400w,
    image-800.jpg 800w,
    image-1200.jpg 1200w,
    image-1600.jpg 1600w
  "
  sizes="
    (max-width: 600px) 100vw,
    (max-width: 1200px) 50vw,
    33vw
  "
  alt="Responsive image"
>
```

**How it works:**

```
srcset: Available images with their ACTUAL widths
sizes:  How wide the image will DISPLAY at different viewport sizes

Calculation:
1. Browser knows viewport width (e.g., 800px)
2. Browser checks sizes → at 800px, image displays at 50vw = 400px
3. Browser checks device pixel ratio (DPR) → e.g., 2x Retina
4. Browser needs: 400px × 2 = 800px image
5. Browser picks image-800.jpg from srcset

Mobile (320px viewport, 2x DPR):
  sizes → 100vw = 320px display
  Need: 320 × 2 = 640px
  Picks: image-800.jpg (closest larger)

Desktop (1400px viewport, 1x DPR):
  sizes → 33vw ≈ 462px display
  Need: 462 × 1 = 462px
  Picks: image-800.jpg (closest larger)
```

### Browser Selection Algorithm in Plain English

The browser does not blindly pick based on viewport width. It estimates the
rendered image size first.

```
Browser reads <img>
 │
 ▼
Reads sizes attribute
 │
 ▼
Calculates displayed CSS width
 │
 ▼
Multiplies by device pixel ratio
 │
 ▼
Chooses the closest suitable file from srcset
 │
 ▼
Downloads one image candidate
```

This is why `sizes` must be accurate. If the image displays at `50vw` but you say
`100vw`, the browser may download an image that is twice as large as needed.

### `srcset` Descriptors: `w` vs `x`

```html
<!-- Width descriptors: best for responsive layouts -->
<img
  src="card-800.jpg"
  srcset="card-400.jpg 400w, card-800.jpg 800w, card-1200.jpg 1200w"
  sizes="(max-width: 700px) 100vw, 33vw"
  alt="Product card"
>

<!-- Density descriptors: best when displayed CSS size is fixed -->
<img
  src="icon.png"
  srcset="icon.png 1x, icon@2x.png 2x"
  alt="Settings"
>
```

Use `w` descriptors for responsive content images because the layout width
changes. Use `x` descriptors for icons or images with a predictable CSS size.

### `<picture>` Element - Art Direction

Use when you need DIFFERENT images (not just different sizes) for different screens.

```html
<picture>
  <!-- Order matters! First match wins -->
  
  <!-- Dark mode -->
  <source 
    media="(prefers-color-scheme: dark)"
    srcset="hero-dark.jpg"
  >
  
  <!-- Desktop: wide landscape image -->
  <source 
    media="(min-width: 1200px)" 
    srcset="hero-wide.jpg"
  >
  
  <!-- Tablet: medium image -->
  <source 
    media="(min-width: 768px)" 
    srcset="hero-medium.jpg"
  >
  
  <!-- Fallback (also for mobile) -->
  <img 
    src="hero-mobile.jpg" 
    alt="Hero image"
    loading="lazy"
  >
</picture>
```

**Art direction use case:**

```
Desktop (wide):               Mobile (tall):
┌─────────────────────────┐   ┌───────────┐
│  Person    Product      │   │  Product  │
│  ┌────┐    ┌────────┐   │   │ ┌──────┐  │
│  │    │    │        │   │   │ │      │  │
│  └────┘    └────────┘   │   │ │      │  │
└─────────────────────────┘   │ └──────┘  │
Wide shot includes person     │  Person   │
                              │  ┌────┐   │
                              │  │    │   │
                              │  └────┘   │
                              └───────────┘
                              Cropped differently for mobile
```

### When `<picture>` Is Better Than CSS Background Images

Use `<picture>` for meaningful content images because it keeps accessibility,
loading behavior, and image selection in HTML:

| Need | Prefer |
|------|--------|
| Meaningful image with `alt` text | `<img>` or `<picture>` |
| Different crop by breakpoint | `<picture>` |
| Decorative visual only | CSS `background-image` |
| Need lazy loading and priority hints | `<img>` or `<picture>` |
| Need text overlay hero background | CSS background or layered HTML |

### object-fit and object-position

Control how images fill their container (like `background-size` for `<img>`).

```css
.image-container {
  width: 300px;
  height: 200px;
}

.image-container img {
  width: 100%;
  height: 100%;
  
  /* How image fills the space */
  object-fit: cover;      /* Cover container, crop if needed */
  object-fit: contain;    /* Fit entire image, may have gaps */
  object-fit: fill;       /* Stretch to fill (distorts) */
  object-fit: none;       /* Original size, may overflow */
  object-fit: scale-down; /* Smaller of 'none' or 'contain' */
  
  /* Where to position the image */
  object-position: center;     /* Default */
  object-position: top;        /* Focus on top */
  object-position: top right;  /* Focus on top-right */
  object-position: 20% 80%;    /* Custom position */
}
```

**Visual comparison:**

```
Original image: 600×400 (wider than container)
Container: 300×200

cover:              contain:            fill:
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓│    │              │    │▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓│    │▓▓▓▓▓▓▓▓▓▓▓▓▓▓│    │▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓│    │▓▓▓▓▓▓▓▓▓▓▓▓▓▓│    │▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓│    │              │    │▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
└──────────────┘    └──────────────┘    └──────────────┘
Cropped sides       Letterboxed         Stretched/distorted
```

### Aspect Ratio

```css
/* Modern way (CSS aspect-ratio) */
.video-container {
  width: 100%;
  aspect-ratio: 16 / 9;
}

.square {
  aspect-ratio: 1;  /* or 1 / 1 */
}

.portrait {
  aspect-ratio: 3 / 4;
}

/* Old padding hack (for older browsers) */
.video-container-legacy {
  position: relative;
  width: 100%;
  padding-bottom: 56.25%;  /* 9/16 = 0.5625 = 56.25% */
  height: 0;
}

.video-container-legacy iframe,
.video-container-legacy video {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
```

### Lazy Loading

```html
<!-- Native lazy loading -->
<img src="image.jpg" alt="..." loading="lazy">

<!-- loading="eager" for above-the-fold images (default) -->
<img src="hero.jpg" alt="..." loading="eager">

<!-- fetchpriority for critical images -->
<img src="hero.jpg" alt="..." fetchpriority="high">
```

### Responsive Image Pitfall to Understand

This code looks responsive visually:

```css
img {
  max-width: 100%;
  height: auto;
}
```

But it only prevents overflow. It does **not** prevent a phone from downloading a
large image file.

```html
<!-- Visually responsive, but network-heavy on mobile -->
<img src="hero-3000.jpg" alt="Hero">
```

For performance, pair visual responsiveness with source responsiveness:

```html
<img
  src="hero-800.jpg"
  srcset="hero-400.jpg 400w, hero-800.jpg 800w, hero-1600.jpg 1600w"
  sizes="100vw"
  alt="Hero"
>
```

---

## Responsive Typography

Responsive typography is about readability, not just making text scale.

Good typography must balance:

| Concern | What Can Go Wrong |
|---------|-------------------|
| Font size | Text becomes too small on mobile or too huge on desktop |
| Line length | Long lines make it hard to track the next line |
| Line height | Dense text feels cramped; loose text feels disconnected |
| Hierarchy | Headings and body text lose visual relationship |
| User zoom | Fixed layouts break when text becomes larger |

### The Problem with Fixed Font Sizes

```css
/* Fixed sizes do not adapt */
h1 { font-size: 48px; }  /* Too big on mobile! */
p { font-size: 16px; }   /* OK but not optimal */

/* What happens on mobile:
┌─────────────────────────────────────┐
│ This heading is way too            │
│ big and wraps awkwardly            │
│ on mobile screens                  │
└─────────────────────────────────────┘
*/
```

### Fluid Typography with clamp()

```css
/* Responsive headings that scale smoothly */
h1 {
  font-size: clamp(2rem, 5vw + 1rem, 4rem);
  /* Mobile: 2rem (32px)
     Scales: with viewport
     Desktop: 4rem (64px) max */
}

h2 {
  font-size: clamp(1.5rem, 4vw + 0.5rem, 3rem);
}

h3 {
  font-size: clamp(1.25rem, 3vw + 0.5rem, 2rem);
}

p {
  font-size: clamp(1rem, 2vw + 0.5rem, 1.25rem);
}
```

### How to Read a Fluid Type Formula

```css
h1 {
  font-size: clamp(2rem, 5vw + 1rem, 4rem);
}
```

Read it as a sentence:

```
The heading should never be smaller than 2rem.
It should grow with the viewport using 5vw + 1rem.
It should stop growing at 4rem.
```

The `rem` part protects the user's text preference. The `vw` part adds fluid
growth. The max prevents huge desktop headings.

### Type Scale System

```css
:root {
  /* Base size */
  --text-base: clamp(1rem, 0.5vw + 0.875rem, 1.125rem);
  
  /* Scale ratio: 1.25 (Major Third) */
  --text-xs: clamp(0.75rem, 0.5vw + 0.5rem, 0.875rem);
  --text-sm: clamp(0.875rem, 0.5vw + 0.75rem, 1rem);
  --text-lg: clamp(1.125rem, 1vw + 0.875rem, 1.25rem);
  --text-xl: clamp(1.25rem, 1.5vw + 0.875rem, 1.5rem);
  --text-2xl: clamp(1.5rem, 2vw + 1rem, 2rem);
  --text-3xl: clamp(1.875rem, 3vw + 1rem, 2.5rem);
  --text-4xl: clamp(2.25rem, 4vw + 1rem, 3.5rem);
  --text-5xl: clamp(3rem, 5vw + 1rem, 4.5rem);
}

h1 { font-size: var(--text-5xl); }
h2 { font-size: var(--text-4xl); }
h3 { font-size: var(--text-3xl); }
h4 { font-size: var(--text-2xl); }
h5 { font-size: var(--text-xl); }
h6 { font-size: var(--text-lg); }
p { font-size: var(--text-base); }
small { font-size: var(--text-sm); }
```

### Why a Type Scale Helps

A type scale keeps text hierarchy consistent. Without a scale, teams often choose
random font sizes:

```css
h1 { font-size: 43px; }
h2 { font-size: 31px; }
h3 { font-size: 26px; }
.card-title { font-size: 22px; }
.modal-title { font-size: 29px; }
```

Those numbers may work individually, but they do not form a system. A type scale
creates predictable relationships:

```
base text
 │
 ├── small text is slightly smaller
 ├── headings are progressively larger
 └── spacing can follow the same rhythm
```

### Line Length for Readability

```css
/* Optimal line length: 45-75 characters */
p {
  max-width: 65ch;  /* ~65 characters per line */
}

.article-content {
  max-width: 70ch;
  margin: 0 auto;
  padding: 0 1rem;
}
```

Line length matters because reading is a physical scanning task. If a line is too
long, the eye struggles to find the next line. If it is too short, the reader
gets interrupted too often.

```
Too long:
This paragraph keeps going across the entire monitor and the reader has to move
their eyes a long distance before returning to the next line.

Comfortable:
This paragraph has a limited measure.
The reader can scan it without losing place.
```

### Responsive Line Height

```css
/* Larger text needs less line-height */
h1 {
  font-size: clamp(2rem, 5vw, 4rem);
  line-height: 1.1;  /* Tighter for headings */
}

p {
  font-size: clamp(1rem, 2vw + 0.5rem, 1.25rem);
  line-height: 1.6;  /* More space for body text */
}

/* Or use unitless values that scale */
body {
  line-height: 1.5;  /* Inherited by all text */
}
```

### Typography Decision Rules

| Situation | Recommendation | Reason |
|-----------|----------------|--------|
| Body text | Start around `1rem` with `line-height: 1.5` to `1.7` | Comfortable default reading |
| Large headings | Use `clamp()` and tighter line-height | Prevents awkward wrapping |
| Long-form articles | Use `max-width: 65ch` to `75ch` | Protects line length |
| Buttons | Use `em` padding | Padding scales with text |
| Small labels | Avoid going below readable sizes | Tiny text fails on mobile and zoom |
| User zoom support | Avoid fixed-height text containers | Text needs room to grow |

---

## Container Queries

Container queries let you style elements based on their **container's** size, not the viewport.

Media queries ask, "How wide is the browser?" Container queries ask, "How much
space did this component actually receive?"

That difference is huge for reusable components. A card does not really care
whether the browser is `1200px` wide. It cares whether the card itself has enough
room to place an image beside text.

### The Problem Container Queries Solve

```css
/* Media query: Same component, different contexts */

/* Card in main content - has space */
/* Card in sidebar - cramped! */

/* With media queries, you can't differentiate! */
@media (min-width: 768px) {
  .card {
    display: flex;  /* Both cards get this, even sidebar card! */
  }
}
```

```
Main Content (800px):          Sidebar (250px):
┌──────────────────────────┐   ┌──────────────────┐
│ ┌────┐ ┌──────────────┐  │   │ ┌────┐ ┌──────┐  │ ← Same styles!
│ │Img │ │   Content    │  │   │ │Img │ │Cont  │  │   Looks cramped
│ └────┘ └──────────────┘  │   │ └────┘ └──────┘  │
└──────────────────────────┘   └──────────────────┘
         ✓ Looks good                  ✗ Too tight
```

### Component Ownership Mental Model

Without container queries, page layout often controls component layout:

```
Viewport width
 │
 ▼
Page media query
 │
 ▼
Every card changes the same way
```

With container queries, the component can own its own adaptation:

```
Container width
 │
 ▼
Component query
 │
 ▼
Each card adapts to its actual space
```

This is closer to how component-based UI systems work in React, Vue, Angular, and
design systems.

### Container Query Syntax

```css
/* Step 1: Define a containment context */
.card-container {
  container-type: inline-size;  /* Query based on width */
  container-name: card;         /* Optional name */
}

/* Shorthand */
.card-container {
  container: card / inline-size;
}

/* Step 2: Query the container */
@container card (min-width: 400px) {
  .card {
    display: flex;
    gap: 1rem;
  }
  
  .card__image {
    width: 40%;
  }
}

@container card (max-width: 399px) {
  .card {
    display: block;
  }
  
  .card__image {
    width: 100%;
  }
}
```

### Important Constraint

Container queries require a containing ancestor:

```css
.card-wrapper {
  container-type: inline-size;
}

@container (min-width: 400px) {
  .card {
    display: flex;
  }
}
```

The queried styles apply to descendants of the container, not normally to the
container itself. This prevents circular logic where the container changes based
on its own styles and then changes size again.

**Now it works in both contexts:**

```
Main Content (container 800px):     Sidebar (container 250px):
@container (min-width: 400px) ✓     @container (min-width: 400px) ✗
┌──────────────────────────┐        ┌──────────────────┐
│ ┌────┐ ┌──────────────┐  │        │ ┌──────────────┐ │
│ │Img │ │   Content    │  │        │ │     Img      │ │
│ └────┘ └──────────────┘  │        │ └──────────────┘ │
└──────────────────────────┘        │ ┌──────────────┐ │
         Horizontal layout          │ │   Content    │ │
                                    │ └──────────────┘ │
                                    └──────────────────┘
                                          Stacked layout
```

### Container Query Units

```css
.card {
  /* cqw - 1% of container width */
  padding: 5cqw;
  
  /* cqh - 1% of container height */
  height: 50cqh;
  
  /* cqi - 1% of container inline size (width in horizontal writing) */
  font-size: 4cqi;
  
  /* cqb - 1% of container block size (height in horizontal writing) */
  margin-bottom: 2cqb;
  
  /* cqmin - smaller of cqi or cqb */
  /* cqmax - larger of cqi or cqb */
}
```

### Container Queries vs Media Queries

| Media Queries | Container Queries |
|---------------|-------------------|
| Based on **viewport** | Based on **container** |
| Good for page layouts | Good for components |
| All instances styled same | Each instance adapts |
| Older browser support | Modern browsers only |

### When Not to Use Container Queries

| Case | Better Tool |
|------|-------------|
| Whole page layout changes | Media query |
| Theme preference like dark mode | Media query |
| Browser feature support | `@supports` |
| One-off component in one place | Simple CSS may be enough |
| Component changes based on parent width | Container query |

---

## Responsive Patterns

Patterns are reusable answers to recurring responsive problems. The goal is not
to memorize every pattern, but to recognize the layout pressure and choose the
smallest pattern that solves it.

```
Navigation too wide?        Collapse, wrap, or prioritize links.
Cards too cramped?          Use auto-fit grid or stack.
Sidebar stealing space?     Move below content or make it optional.
Table overflowing?          Scroll, stack, or convert to cards.
Hero too tall on mobile?    Use dvh/svh and fluid spacing.
```

### Pattern 1: Responsive Navigation

Navigation is difficult because links compete with brand/logo space and touch
target size. On mobile, the goal is not to squeeze every desktop link into one
row. The goal is to keep primary navigation reachable without making taps tiny.

Decision flow:

```
Do all important links fit with 44px touch targets?
 │
 ├── YES ──► keep visible navigation
 │
 └── NO
      │
      ▼
Can links wrap cleanly?
 │
 ├── YES ──► allow wrapping or use two-row nav
 │
 └── NO ───► use disclosure menu / hamburger / priority nav
```

```css
/* Mobile: Hamburger menu */
.nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
}

.nav__toggle {
  display: block;  /* Show hamburger */
}

.nav__menu {
  position: fixed;
  top: 0;
  right: -100%;
  width: 80%;
  height: 100vh;
  background: white;
  transition: right 0.3s;
  flex-direction: column;
  padding: 2rem;
}

.nav__menu.active {
  right: 0;
}

/* Desktop: Horizontal menu */
@media (min-width: 768px) {
  .nav__toggle {
    display: none;  /* Hide hamburger */
  }
  
  .nav__menu {
    position: static;
    width: auto;
    height: auto;
    flex-direction: row;
    padding: 0;
    gap: 2rem;
  }
}
```

### Pattern 2: Responsive Card Grid

Card grids are perfect for fluid CSS because cards usually have a minimum
comfortable width. Once you know that minimum, CSS Grid can decide how many cards
fit.

```css
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: clamp(1rem, 3vw, 2rem);
  padding: clamp(1rem, 5vw, 3rem);
}

/* Cards automatically:
   - 1 column on small screens
   - 2 columns when space allows
   - 3+ columns on larger screens
   - Never smaller than 280px
*/
```

The key part is:

```css
grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
```

Meaning:

```
Create as many columns as fit.
Each column must be at least 280px.
If extra room exists, share it equally.
If 280px columns no longer fit, reduce the number of columns.
```

### Pattern 3: Responsive Sidebar Layout

A sidebar is useful only when it does not damage the main task. On mobile, the
main content usually deserves priority, so the sidebar commonly moves below the
content or becomes a drawer/filter panel.

```css
.layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
}

.sidebar {
  order: 2;  /* Below content on mobile */
}

@media (min-width: 768px) {
  .layout {
    grid-template-columns: 250px 1fr;
  }
  
  .sidebar {
    order: 0;  /* Left side on desktop */
    position: sticky;
    top: 20px;
    height: fit-content;
  }
}
```

### Pattern 4: Responsive Table

Tables are hard because their meaning depends on row/column relationships. There
is no single best responsive table pattern.

| Pattern | Best For | Tradeoff |
|---------|----------|----------|
| Horizontal scroll | Dense financial/admin tables | Preserves table semantics but requires scrolling |
| Stacked rows | Simple comparison data | Easier mobile reading but repeated labels |
| Cards | User/profile/order summaries | Good scanning but less table-like |
| Hide low-priority columns | Optional metadata | Risk of hiding useful data |

```css
/* Stack table cells on mobile */
@media (max-width: 768px) {
  table, thead, tbody, th, td, tr {
    display: block;
  }
  
  thead {
    display: none;  /* Hide column headers */
  }
  
  tr {
    margin-bottom: 1rem;
    border: 1px solid #ddd;
    border-radius: 8px;
  }
  
  td {
    display: flex;
    justify-content: space-between;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid #eee;
  }
  
  td::before {
    content: attr(data-label);  /* Show label from data attribute */
    font-weight: bold;
  }
  
  td:last-child {
    border-bottom: none;
  }
}
```

```html
<table>
  <thead>
    <tr>
      <th>Name</th>
      <th>Email</th>
      <th>Role</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td data-label="Name">John Doe</td>
      <td data-label="Email">john@example.com</td>
      <td data-label="Role">Admin</td>
    </tr>
  </tbody>
</table>
```

### Pattern 5: Responsive Hero Section

A hero section has three competing constraints: vertical height, readable text,
and image composition. Mobile heroes often fail because desktop spacing and
desktop background crops are reused on a narrow screen.

```css
.hero {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: clamp(2rem, 10vw, 6rem);
  background: linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), 
              url('hero-mobile.jpg') center/cover;
}

.hero__title {
  font-size: clamp(2rem, 8vw, 5rem);
  line-height: 1.1;
  margin-bottom: 1rem;
}

.hero__subtitle {
  font-size: clamp(1rem, 3vw, 1.5rem);
  max-width: 60ch;
  margin-bottom: 2rem;
}

@media (min-width: 768px) {
  .hero {
    background-image: linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)),
                      url('hero-desktop.jpg');
    text-align: left;
    align-items: flex-start;
  }
}
```

### Pattern 6: Intrinsic Layout with Flex Wrap

Sometimes you do not need a breakpoint at all. Flexbox can wrap items when space
runs out.

```css
.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
}

.toolbar > * {
  flex: 0 1 auto;
}

.toolbar__search {
  flex: 1 1 18rem;
}
```

What this means:

```
Buttons keep their natural size.
Search can grow when space exists.
Search can shrink until around 18rem.
Items wrap instead of overflowing.
```

### Pattern 7: Content Wrapper

Most pages need a wrapper that fills small screens but stops growing on large
screens.

```css
.wrapper {
  width: min(100% - 2rem, 1120px);
  margin-inline: auto;
}
```

This one line means:

```
On small screens: leave 1rem breathing room on each side.
On large screens: stop at 1120px and center the content.
```

---

## When to Use What - Decision Guide

Responsive CSS is easier when you choose tools by problem type.

### Main Decision Flow

```
Something looks wrong at a certain size
 │
 ▼
Is the problem inside one reusable component?
 │
 ├── YES
 │    │
 │    ▼
 │   Does it depend on the component's own available width?
 │    │
 │    ├── YES ──► container query
 │    └── NO  ──► normal component CSS
 │
 └── NO
      │
      ▼
     Is it a whole page/layout change?
      │
      ├── YES ──► media query
      └── NO
           │
           ▼
          Can fluid units solve it?
           │
           ├── YES ──► %, fr, minmax(), clamp(), min(), max()
           └── NO  ──► add a targeted breakpoint
```

### Tool Lookup Table

| Problem | Recommended Tool | Reason |
|---------|------------------|--------|
| Page changes from one column to two columns | Media query | The viewport controls the page layout |
| Card changes layout in sidebar vs main area | Container query | The card's own space matters |
| Text should scale smoothly | `clamp()` | Avoids many font-size breakpoints |
| Grid should add columns automatically | `repeat(auto-fit, minmax())` | Uses available space naturally |
| Image should download smaller file on mobile | `srcset` + `sizes` | Browser picks best asset |
| Image needs different crop on mobile | `<picture>` | Art direction needs different sources |
| Full-height mobile section | `100dvh` or `100svh` | Handles browser UI better than old `vh` |
| Touch device needs larger controls | `(pointer: coarse)` | Input precision matters |
| User prefers less motion | `(prefers-reduced-motion)` | Accessibility preference |
| Browser may not support new CSS | `@supports` | Progressive enhancement |

### Breakpoint Selection Rules

| Rule | Explanation |
|------|-------------|
| Start without breakpoints | Let content, grid, flex, and fluid units do the first pass |
| Add breakpoints where content breaks | Do not choose numbers only because a framework uses them |
| Prefer `min-width` for layered enhancements | Easier mobile-first cascade |
| Keep breakpoints sparse | Too many breakpoints make CSS hard to reason about |
| Test zoom and text growth | A layout that works at 100% may fail at 200% zoom |

---

## Common Pitfalls and How to Avoid Them

### Pitfall 1: Fixed Width Containers

Bad:

```css
.page {
  width: 1200px;
}
```

Why it fails: a `1200px` box cannot fit inside a `390px` phone viewport, so the
page overflows horizontally.

Good:

```css
.page {
  width: min(100% - 2rem, 1200px);
  margin-inline: auto;
}
```

### Pitfall 2: Using Breakpoints Before Trying Fluid Layout

Bad:

```css
.cards {
  display: grid;
  grid-template-columns: 1fr;
}

@media (min-width: 600px) {
  .cards {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 900px) {
  .cards {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

Good:

```css
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: clamp(1rem, 3vw, 2rem);
}
```

Why the good version works: the grid responds to actual available space, so fewer
manual breakpoints are needed.

### Pitfall 3: Disabling User Zoom

Bad:

```html
<meta
  name="viewport"
  content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
>
```

Good:

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0">
```

Why the bad version fails: users with low vision may need zoom. Preventing zoom
can create an accessibility failure.

### Pitfall 4: Assuming Hover Exists

Bad:

```css
.menu:hover .submenu {
  display: block;
}
```

Why it fails: touch devices do not have reliable hover. The submenu may become
hard or impossible to open.

Good:

```css
@media (hover: hover) and (pointer: fine) {
  .menu:hover .submenu {
    display: block;
  }
}

.menu[aria-expanded="true"] .submenu {
  display: block;
}
```

### Pitfall 5: Using `100vh` for Mobile Full-Screen Layouts

Bad:

```css
.hero {
  height: 100vh;
}
```

Good:

```css
.hero {
  min-height: 100svh;
  min-height: 100dvh;
}
```

Why the good version works: modern viewport units account for mobile browser UI
more accurately.

### Pitfall 6: Making Images Visually Responsive but Not Network Responsive

Bad:

```html
<img class="hero-image" src="hero-3000.jpg" alt="Mountain landscape">
```

```css
.hero-image {
  max-width: 100%;
  height: auto;
}
```

Good:

```html
<img
  class="hero-image"
  src="hero-800.jpg"
  srcset="hero-400.jpg 400w, hero-800.jpg 800w, hero-1600.jpg 1600w"
  sizes="100vw"
  alt="Mountain landscape"
>
```

### Pitfall 7: Hiding Content Instead of Reflowing It

Bad:

```css
@media (max-width: 600px) {
  .product-description,
  .secondary-actions,
  .details {
    display: none;
  }
}
```

Good:

```css
@media (max-width: 600px) {
  .product-layout {
    display: grid;
    gap: 1rem;
  }

  .secondary-actions {
    order: 3;
  }
}
```

Why the bad version fails: mobile users often need the same information as
desktop users. Responsive design should prioritize and reflow content before
hiding it.

### Pitfall 8: Forgetting Long Words and Real Content

Bad:

```css
.card-title {
  width: 220px;
}
```

Good:

```css
.card-title {
  overflow-wrap: break-word;
  hyphens: auto;
}
```

Why it matters: real content includes long names, URLs, translations, and user
generated text. A layout that only works with short placeholder text is not truly
responsive.

---

## Interview Questions

### Q1: What is the viewport meta tag and why is it important?
**Answer:** The viewport meta tag (`<meta name="viewport" content="width=device-width, initial-scale=1.0">`) tells the browser how to control the page's dimensions and scaling. Without it, mobile browsers render pages at desktop width (usually 980px) and scale down, making text unreadable. It's essential for responsive design.

### Q2: Explain the difference between min-width and max-width in media queries.
**Answer:**
- `min-width`: Styles apply when viewport is **at least** that width → Mobile-first approach
- `max-width`: Styles apply when viewport is **at most** that width → Desktop-first approach

Mobile-first (`min-width`) is recommended because it starts with essential mobile styles and progressively enhances for larger screens.

### Q3: What is mobile-first design and why is it preferred?
**Answer:** Mobile-first means writing base CSS for mobile devices, then adding styles for larger screens with `min-width` media queries.

**Why it's preferred:**
1. Over 60% of web traffic is mobile
2. Forces content prioritization
3. Smaller CSS for mobile = faster loading
4. Progressive enhancement (add features vs remove them)

### Q4: What is the difference between `srcset` and `<picture>`?
**Answer:**
- `srcset`: Same image in different **sizes/resolutions** - browser picks best one based on viewport and DPR
- `<picture>`: Different **images** for different conditions - use for art direction (different crops, orientations)

### Q5: How do you handle the 100vh problem on mobile?
**Answer:** On mobile, `100vh` includes space behind the browser UI (address bar, navigation), causing content to be hidden.

**Solutions:**
1. Use `100dvh` (dynamic viewport height) - adjusts with browser UI
2. Use `100svh` (small viewport height) - always safe
3. JavaScript fallback: Calculate actual viewport height and set CSS variable

### Q6: What is `clamp()` and how is it used for responsive design?
**Answer:** `clamp(min, preferred, max)` creates fluid values that scale between a minimum and maximum.

```css
font-size: clamp(1rem, 5vw, 3rem);
/* 1rem minimum, scales with 5vw, 3rem maximum */
```

Great for responsive typography and spacing without media queries.

### Q7: What are Container Queries and when would you use them?
**Answer:** Container queries style elements based on their **container's** size, not the viewport. Use them for reusable components that need to adapt to their context (e.g., a card in main content vs sidebar).

```css
.container { container-type: inline-size; }
@container (min-width: 400px) { .card { display: flex; } }
```

### Q8: What does `prefers-reduced-motion` do?
**Answer:** It's a media query that detects if the user has requested reduced motion in their OS settings (for vestibular disorders, motion sensitivity).

```css
@media (prefers-reduced-motion: reduce) {
  * { animation: none !important; transition-duration: 0.01ms !important; }
}
```

---

## Exercises

### Exercise 1: Mobile-First Navigation
Create a navigation that shows hamburger on mobile and horizontal links on desktop.

<details>
<summary>Solution</summary>

```css
/* Mobile (base) */
.nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #333;
}

.nav__logo {
  color: white;
  font-size: 1.5rem;
}

.nav__toggle {
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
}

.nav__menu {
  display: none;
  position: absolute;
  top: 60px;
  left: 0;
  right: 0;
  background: #333;
  flex-direction: column;
}

.nav__menu.active {
  display: flex;
}

.nav__link {
  color: white;
  padding: 1rem;
  text-decoration: none;
}

/* Desktop */
@media (min-width: 768px) {
  .nav__toggle {
    display: none;
  }
  
  .nav__menu {
    display: flex;
    position: static;
    flex-direction: row;
    gap: 1rem;
  }
}
```
</details>

### Exercise 2: Fluid Typography System
Create a responsive type scale using clamp().

<details>
<summary>Solution</summary>

```css
:root {
  --text-xs: clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem);
  --text-sm: clamp(0.875rem, 0.8rem + 0.35vw, 1rem);
  --text-base: clamp(1rem, 0.9rem + 0.5vw, 1.125rem);
  --text-lg: clamp(1.125rem, 1rem + 0.75vw, 1.375rem);
  --text-xl: clamp(1.25rem, 1rem + 1.25vw, 1.75rem);
  --text-2xl: clamp(1.5rem, 1.1rem + 2vw, 2.25rem);
  --text-3xl: clamp(1.875rem, 1.2rem + 3vw, 3rem);
  --text-4xl: clamp(2.25rem, 1.3rem + 4.5vw, 4rem);
}

h1 { font-size: var(--text-4xl); line-height: 1.1; }
h2 { font-size: var(--text-3xl); line-height: 1.2; }
h3 { font-size: var(--text-2xl); line-height: 1.3; }
h4 { font-size: var(--text-xl); line-height: 1.4; }
p { font-size: var(--text-base); line-height: 1.6; }
small { font-size: var(--text-sm); }
```
</details>

### Exercise 3: Dark Mode with prefers-color-scheme
Implement automatic dark mode.

<details>
<summary>Solution</summary>

```css
:root {
  /* Light mode (default) */
  --bg-primary: #ffffff;
  --bg-secondary: #f5f5f5;
  --text-primary: #1a1a1a;
  --text-secondary: #666666;
  --accent: #007bff;
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg-primary: #1a1a2e;
    --bg-secondary: #16213e;
    --text-primary: #eaeaea;
    --text-secondary: #b0b0b0;
    --accent: #4dabf7;
  }
}

body {
  background-color: var(--bg-primary);
  color: var(--text-primary);
}

.card {
  background-color: var(--bg-secondary);
}

a {
  color: var(--accent);
}
```
</details>

---

## Summary Cheatsheet

Responsive design is the practice of making content adapt to available space,
input type, user preferences, and device capability. The default strategy is:
build fluid first, add breakpoints only where content starts to fail, and use
container queries when a reusable component must adapt to its own parent.

| Concept | Key Tool | Memory Model | Best Use Case |
|---------|----------|--------------|---------------|
| Viewport setup | `<meta name="viewport">` | Tell mobile browsers to use real device width | Every responsive page |
| Mobile-first CSS | `@media (min-width)` | Start simple, add complexity upward | Most public websites and apps |
| Desktop-first CSS | `@media (max-width)` | Start large, subtract downward | Legacy desktop-heavy products |
| Fluid width | `%`, `min()`, `max-width` | Fill available space but respect a ceiling | Page wrappers and cards |
| Fluid type | `clamp()` | Minimum, preferred fluid value, maximum | Headings, spacing, layout gaps |
| Responsive grid | `repeat(auto-fit, minmax())` | Add columns only when they fit | Card galleries and product grids |
| Responsive image size | `srcset` + `sizes` | Browser chooses the right file | Same image at multiple resolutions |
| Art direction | `<picture>` | Different image source for different contexts | Hero crops and composition changes |
| Container adaptation | `@container` | Component responds to its own space | Cards, widgets, design-system components |
| Accessibility preferences | `prefers-*` media features | Respect user settings | Motion, contrast, color scheme |
| Touch adaptation | `(pointer: coarse)` | Finger input needs larger targets | Buttons, menus, form controls |
| Mobile height | `dvh`, `svh`, `lvh` | Account for browser UI | Heroes, modals, app shells |

### Default Responsive Starter

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0">
```

```css
*,
*::before,
*::after {
  box-sizing: border-box;
}

img,
picture,
svg,
video {
  display: block;
  max-width: 100%;
  height: auto;
}

body {
  margin: 0;
  font-size: 1rem;
  line-height: 1.5;
}

.wrapper {
  width: min(100% - 2rem, 1120px);
  margin-inline: auto;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: clamp(1rem, 3vw, 2rem);
}

.title {
  font-size: clamp(2rem, 5vw + 1rem, 4rem);
  line-height: 1.1;
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    scroll-behavior: auto !important;
    transition-duration: 0.01ms !important;
  }
}
```

### One-Line Default Recommendation

Use **mobile-first CSS plus fluid layout primitives** as the default. Add media
queries for page-level layout changes, container queries for reusable component
changes, and responsive image markup when network performance matters.

---

**Previous:** [02-CSS-Layout.md](./02-CSS-Layout.md)  
**Next:** [04-CSS-Advanced.md](./04-CSS-Advanced.md) - Animations, Transforms & Transitions
