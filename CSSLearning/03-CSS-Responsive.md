# CSS Responsive Design - Interview Preparation Guide

## Table of Contents
1. [What is Responsive Design?](#what-is-responsive-design)
2. [Viewport Meta Tag](#viewport-meta-tag)
3. [Media Queries](#media-queries)
4. [Mobile-First vs Desktop-First](#mobile-first-vs-desktop-first)
5. [Responsive Units](#responsive-units)
6. [Responsive Images](#responsive-images)
7. [Responsive Typography](#responsive-typography)
8. [Container Queries](#container-queries)
9. [Responsive Patterns](#responsive-patterns)
10. [Interview Questions](#interview-questions)
11. [Exercises](#exercises)

---

## What is Responsive Design?

Responsive design means creating websites that adapt to any screen size - from mobile phones to desktop monitors.

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

---

## Viewport Meta Tag

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

| Property | Value | Meaning |
|----------|-------|---------|
| `width` | `device-width` | Viewport width = device screen width |
| `initial-scale` | `1.0` | Initial zoom level (1 = 100%) |
| `maximum-scale` | `5.0` | Max zoom allowed |
| `minimum-scale` | `1.0` | Min zoom allowed |
| `user-scalable` | `yes` | Allow pinch-to-zoom |

### ⚠️ Accessibility Warning

```html
<!-- ❌ NEVER DO THIS - Accessibility violation! -->
<meta name="viewport" content="width=device-width, initial-scale=1.0, 
  maximum-scale=1.0, user-scalable=no">

<!-- Why it's bad:
   - Prevents users with visual impairments from zooming
   - Violates WCAG accessibility guidelines
   - May fail accessibility audits
-->

<!-- ✅ Always allow zooming -->
<meta name="viewport" content="width=device-width, initial-scale=1.0">
```

---

## Media Queries

Media queries apply CSS rules based on device characteristics (screen size, orientation, etc.).

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

---

## Mobile-First vs Desktop-First

### Mobile-First Approach (RECOMMENDED ✅)

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

---

## Responsive Units

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
Desktop: 100vh = visible area ✅
┌──────────────────┐
│                  │
│   100vh = this   │
│                  │
└──────────────────┘

Mobile: 100vh = includes space behind browser UI ❌
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

---

## Responsive Typography

### The Problem with Fixed Font Sizes

```css
/* ❌ Fixed sizes don't adapt */
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

---

## Container Queries

Container queries let you style elements based on their **container's** size, not the viewport.

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

---

## Responsive Patterns

### Pattern 1: Responsive Navigation

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

### Pattern 3: Responsive Sidebar Layout

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

## Quick Reference

```css
/* ===== VIEWPORT META ===== */
<meta name="viewport" content="width=device-width, initial-scale=1.0">

/* ===== MOBILE-FIRST MEDIA QUERIES ===== */
/* Base = mobile */
@media (min-width: 576px) { /* Small+ */ }
@media (min-width: 768px) { /* Medium+ */ }
@media (min-width: 992px) { /* Large+ */ }
@media (min-width: 1200px) { /* XL+ */ }

/* ===== RESPONSIVE IMAGE ===== */
img { max-width: 100%; height: auto; display: block; }

/* ===== FLUID TYPOGRAPHY ===== */
font-size: clamp(1rem, 2vw + 0.5rem, 2rem);

/* ===== NEW VIEWPORT UNITS ===== */
height: 100dvh;  /* Dynamic (recommended) */
height: 100svh;  /* Small (safest) */
height: 100lvh;  /* Large */

/* ===== RESPONSIVE GRID ===== */
grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));

/* ===== CONTAINER QUERIES ===== */
.container { container-type: inline-size; }
@container (min-width: 400px) { }

/* ===== ACCESSIBILITY ===== */
@media (prefers-reduced-motion: reduce) { }
@media (prefers-color-scheme: dark) { }
```

---

**Previous:** [02-CSS-Layout.md](./02-CSS-Layout.md)  
**Next:** [04-CSS-Advanced.md](./04-CSS-Advanced.md) - Animations, Transforms & Transitions
