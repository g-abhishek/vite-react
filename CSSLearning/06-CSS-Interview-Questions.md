# CSS Interview Questions - Complete Guide

## Table of Contents
1. [Basic Questions (Fresher)](#basic-questions)
2. [Intermediate Questions (1-3 Years)](#intermediate-questions)
3. [Advanced Questions (3+ Years)](#advanced-questions)
4. [Practical Coding Questions](#practical-coding-questions)
5. [Rapid Fire Questions](#rapid-fire-questions)
6. [Scenario-Based Questions](#scenario-based-questions)

---

## Basic Questions

### Q1: What is CSS and how does it work with HTML?

**Answer:**
CSS (Cascading Style Sheets) is a stylesheet language that describes the visual presentation of HTML documents. It separates content (HTML) from presentation (CSS).

**How it works:**
1. Browser loads HTML and creates DOM (Document Object Model)
2. Browser loads CSS and creates CSSOM (CSS Object Model)
3. Browser combines DOM + CSSOM to create Render Tree
4. Browser paints pixels to screen

**Three ways to include CSS:**
```html
<!-- Inline (highest specificity) -->
<p style="color: red;">Text</p>

<!-- Internal -->
<style>p { color: blue; }</style>

<!-- External (recommended) -->
<link rel="stylesheet" href="styles.css">
```

---

### Q2: Explain the CSS Box Model

**Answer:**
The box model describes how every element is rendered as a rectangular box:

```
┌─────────────────────────────────────────┐
│               MARGIN                    │
│   ┌─────────────────────────────────┐   │
│   │           BORDER                │   │
│   │   ┌─────────────────────────┐   │   │
│   │   │       PADDING           │   │   │
│   │   │   ┌─────────────────┐   │   │   │
│   │   │   │    CONTENT      │   │   │   │
│   │   │   └─────────────────┘   │   │   │
│   │   └─────────────────────────┘   │   │
│   └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

**box-sizing:**
- `content-box` (default): width/height = content only
- `border-box` (recommended): width/height = content + padding + border

```css
/* Always use this reset */
*, *::before, *::after {
  box-sizing: border-box;
}
```

---

### Q3: What is CSS Specificity?

**Answer:**
Specificity determines which CSS rule wins when multiple rules target the same element. Calculated as four parts: **A,B,C,D**

| Type | Value | Example |
|------|-------|---------|
| Inline styles | 1,0,0,0 | `style="..."` |
| IDs | 0,1,0,0 | `#header` |
| Classes, attributes, pseudo-classes | 0,0,1,0 | `.nav`, `[type]`, `:hover` |
| Elements, pseudo-elements | 0,0,0,1 | `div`, `::before` |

**Example calculation:**
```css
#nav .item a:hover { }
/* 0,1,0,0 + 0,0,1,0 + 0,0,0,1 + 0,0,1,0 = 0,1,2,1 = 121 */
```

---

### Q4: What's the difference between `display: none` and `visibility: hidden`?

**Answer:**

| Property | `display: none` | `visibility: hidden` |
|----------|-----------------|----------------------|
| Space | ❌ Removed from flow | ✅ Keeps space |
| Accessibility | ❌ Hidden from screen readers | ⚠️ Still in DOM |
| Children | All hidden | Can show with `visibility: visible` |
| Performance | Triggers reflow | Only triggers repaint |
| Animations | Can't animate | Can animate |

```css
.hidden-display { display: none; }      /* Gone completely */
.hidden-visibility { visibility: hidden; } /* Invisible but space preserved */
```

---

### Q5: Explain the difference between `em` and `rem`

**Answer:**

**em** - Relative to **parent's** font-size
```css
.parent { font-size: 16px; }
.child { font-size: 1.5em; }  /* 24px (16 × 1.5) */
.grandchild { font-size: 1.5em; }  /* 36px - COMPOUNDS! */
```

**rem** - Relative to **root** (html) font-size
```css
html { font-size: 16px; }
.anything { font-size: 1.5rem; }  /* Always 24px */
```

**When to use:**
- `rem` - Consistent sizing, avoids compounding
- `em` - When you want scaling relative to parent (component margins)

---

### Q6: What are pseudo-classes and pseudo-elements?

**Answer:**

**Pseudo-classes (`:`)** - Select based on **state**
```css
a:hover { }        /* Mouse over */
a:focus { }        /* Keyboard focus */
li:first-child { } /* Position */
input:valid { }    /* Form state */
```

**Pseudo-elements (`::`)** - Create **virtual elements**
```css
p::before { content: "→ "; }   /* Insert before content */
p::after { content: "..."; }   /* Insert after content */
p::first-letter { }            /* First letter */
::selection { }                /* Selected text */
```

**Key difference:**
- Pseudo-class: element exists, we select by state
- Pseudo-element: creates a new element that doesn't exist in HTML

---

### Q7: What is margin collapsing?

**Answer:**
When two **vertical** margins touch, they collapse into **one margin** (the larger one).

```css
.box1 { margin-bottom: 30px; }
.box2 { margin-top: 20px; }
/* Gap = 30px (NOT 50px!) */
```

**When it happens:**
- Adjacent siblings
- Parent and first/last child (no padding/border between)
- Empty blocks

**How to prevent:**
1. Add padding or border to parent
2. Use `display: flow-root` on parent
3. Use `display: flex` or `grid`
4. Use `overflow: hidden` (has side effects)

---

### Q8: What is the CSS Cascade?

**Answer:**
The cascade is the algorithm that determines which styles apply when multiple rules match.

**Priority order (highest to lowest):**
1. `!important` declarations
2. Inline styles
3. IDs
4. Classes, attributes, pseudo-classes
5. Elements, pseudo-elements
6. Later rules (if same specificity)

```css
p { color: red; }
p { color: blue; }  /* BLUE wins (later rule) */

.intro { color: green; }  /* GREEN wins (higher specificity) */
```

---

### Q9: What is `box-sizing: border-box`?

**Answer:**
It changes how width/height are calculated.

**content-box (default):**
```css
.box {
  width: 200px;
  padding: 20px;
  border: 5px solid;
}
/* Total width = 200 + 40 + 10 = 250px */
```

**border-box:**
```css
.box {
  box-sizing: border-box;
  width: 200px;
  padding: 20px;
  border: 5px solid;
}
/* Total width = 200px (content shrinks to 150px) */
```

**Always use the reset:**
```css
*, *::before, *::after {
  box-sizing: border-box;
}
```

---

### Q10: What is the difference between `relative`, `absolute`, `fixed`, and `sticky` positioning?

**Answer:**

| Position | Relative To | In Flow? | Use Case |
|----------|-------------|----------|----------|
| `static` | N/A (default) | ✅ Yes | Default |
| `relative` | Its normal position | ✅ Yes (space kept) | Container for absolute |
| `absolute` | Nearest positioned ancestor | ❌ No | Tooltips, dropdowns |
| `fixed` | Viewport | ❌ No | Sticky headers, FABs |
| `sticky` | Scroll container | ✅ Yes (until stuck) | Section headers |

```css
.relative { position: relative; top: 10px; }  /* Offset from self */
.absolute { position: absolute; top: 0; right: 0; }  /* Offset from ancestor */
.fixed { position: fixed; top: 0; }  /* Always at top of viewport */
.sticky { position: sticky; top: 0; }  /* Sticks when scrolled */
```

---

## Intermediate Questions

### Q11: Explain Flexbox and its main properties

**Answer:**
Flexbox is a **one-dimensional** layout system (row OR column).

**Container properties:**
```css
.container {
  display: flex;
  flex-direction: row;           /* row | column */
  justify-content: center;       /* Main axis alignment */
  align-items: center;           /* Cross axis alignment */
  flex-wrap: wrap;               /* Allow wrapping */
  gap: 20px;                     /* Space between items */
}
```

**Item properties:**
```css
.item {
  flex: 1;           /* flex-grow flex-shrink flex-basis */
  flex-grow: 1;      /* How much to grow */
  flex-shrink: 0;    /* How much to shrink */
  flex-basis: 200px; /* Initial size */
  align-self: end;   /* Override align-items */
  order: 2;          /* Visual order */
}
```

---

### Q12: Explain CSS Grid and when to use it over Flexbox

**Answer:**
Grid is a **two-dimensional** layout system (rows AND columns).

```css
.container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: auto 1fr auto;
  gap: 20px;
}

.item {
  grid-column: 1 / 3;  /* Span columns 1-2 */
  grid-row: span 2;    /* Span 2 rows */
}
```

**When to use:**
- **Flexbox**: One dimension, content-driven, components (navbars, cards)
- **Grid**: Two dimensions, layout-driven, page structure

---

### Q13: What is z-index and how does stacking context work?

**Answer:**
`z-index` controls stacking order of positioned elements.

**Important:** z-index only works on positioned elements (`relative`, `absolute`, `fixed`, `sticky`).

**Stacking context:**
A stacking context is a container for z-index values. Children's z-index is relative to their stacking context.

**What creates stacking context:**
- `position` + `z-index` (not auto)
- `opacity` < 1
- `transform`, `filter`
- `isolation: isolate`

```css
.parent { position: relative; z-index: 1; }
.child { position: absolute; z-index: 9999; }
/* Child can't escape parent's z-index: 1 context! */
```

---

### Q14: How do media queries work?

**Answer:**
Media queries apply CSS based on device characteristics.

```css
/* Basic syntax */
@media (max-width: 768px) {
  .container { width: 100%; }
}

/* Combining conditions */
@media screen and (min-width: 768px) and (max-width: 1024px) {
  /* Tablet styles */
}

/* Feature queries */
@media (hover: hover) { }        /* Has hover capability */
@media (prefers-color-scheme: dark) { }  /* Dark mode */
@media (prefers-reduced-motion: reduce) { }  /* Accessibility */
```

**Mobile-first (recommended):**
```css
/* Mobile (base) */
.nav { flex-direction: column; }

/* Tablet and up */
@media (min-width: 768px) {
  .nav { flex-direction: row; }
}
```

---

### Q15: What's the difference between `auto-fit` and `auto-fill` in CSS Grid?

**Answer:**

```css
/* auto-fill: Creates tracks, keeps empty ones */
grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));

/* auto-fit: Creates tracks, collapses empty ones */
grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
```

**With 2 items in 1000px container:**
- `auto-fill`: 5 columns created, items in first 2, 3 empty tracks
- `auto-fit`: Empty tracks collapse, 2 items expand to fill space

**Use `auto-fit` for most responsive grids.**

---

### Q16: Explain CSS transitions vs animations

**Answer:**

| Feature | Transitions | Animations |
|---------|-------------|------------|
| Trigger | Requires state change | Can auto-run |
| States | Only A → B | Multiple keyframes |
| Loop | No | Yes (`infinite`) |
| Control | Limited | `fill-mode`, `direction`, `play-state` |

```css
/* Transition */
.button {
  transition: transform 0.3s ease;
}
.button:hover {
  transform: scale(1.1);
}

/* Animation */
@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}
.button {
  animation: pulse 2s ease infinite;
}
```

---

### Q17: How do you center a div horizontally and vertically?

**Answer:**

```css
/* 1. Flexbox (most common) */
.parent {
  display: flex;
  justify-content: center;
  align-items: center;
}

/* 2. Grid */
.parent {
  display: grid;
  place-items: center;
}

/* 3. Absolute + Transform */
.child {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

/* 4. Absolute + Margin (needs explicit size) */
.child {
  position: absolute;
  inset: 0;
  margin: auto;
  width: 200px;
  height: 200px;
}
```

---

### Q18: What is BEM and why use it?

**Answer:**
BEM = **Block, Element, Modifier** - A CSS naming convention.

```css
.block { }                    /* Standalone component */
.block__element { }           /* Part of block */
.block--modifier { }          /* Variation */
.block__element--modifier { } /* Element variation */
```

**Example:**
```css
.card { }
.card--featured { }
.card__title { }
.card__title--large { }
```

**Benefits:**
- No specificity conflicts
- Self-documenting class names
- Easy to understand structure
- Predictable naming

---

### Q19: What are CSS Custom Properties (Variables)?

**Answer:**
CSS variables are reusable values.

```css
/* Define */
:root {
  --primary-color: #007bff;
  --spacing: 16px;
}

/* Use */
.button {
  background: var(--primary-color);
  padding: var(--spacing);
}

/* With fallback */
color: var(--undefined, #333);

/* Scoped */
.card {
  --card-padding: 20px;
  padding: var(--card-padding);
}

/* Dynamic with JS */
document.documentElement.style.setProperty('--primary-color', 'red');
```

**vs Sass variables:**
- CSS variables: Runtime, can change with JS, cascade
- Sass variables: Compile-time, baked into CSS

---

### Q20: How do you create a responsive image?

**Answer:**

```css
/* Basic responsive image */
img {
  max-width: 100%;
  height: auto;
  display: block;
}
```

```html
<!-- srcset for different resolutions -->
<img 
  src="image-800.jpg"
  srcset="image-400.jpg 400w, image-800.jpg 800w, image-1200.jpg 1200w"
  sizes="(max-width: 600px) 100vw, 50vw"
  alt="..."
>

<!-- picture for art direction -->
<picture>
  <source media="(min-width: 1200px)" srcset="hero-large.jpg">
  <source media="(min-width: 768px)" srcset="hero-medium.jpg">
  <img src="hero-small.jpg" alt="...">
</picture>
```

---

## Advanced Questions

### Q21: What creates a stacking context?

**Answer:**
- Root element (`<html>`)
- `position` (not static) + `z-index` (not auto)
- `position: fixed` or `sticky`
- Flex/Grid child with `z-index`
- `opacity` < 1
- `transform`, `filter`, `perspective`
- `isolation: isolate`
- `mix-blend-mode`
- `will-change`

---

### Q22: Explain the `will-change` property

**Answer:**
`will-change` hints to the browser that an element will change, allowing optimization.

```css
.animated {
  will-change: transform, opacity;
}
```

**Best practices:**
- ✅ Use sparingly
- ✅ Add before animation, remove after
- ❌ Don't apply to everything (`* { will-change: all; }`)
- ❌ Don't use for elements that won't animate

---

### Q23: How do you handle the 100vh problem on mobile?

**Answer:**
On mobile, `100vh` includes space behind the browser UI.

**Solutions:**
```css
/* 1. New viewport units (modern) */
.hero {
  height: 100dvh;  /* Dynamic - recommended */
  /* or */
  height: 100svh;  /* Small - safest */
}

/* 2. JavaScript fallback */
.hero {
  height: calc(var(--vh, 1vh) * 100);
}
```

```javascript
function setVH() {
  document.documentElement.style.setProperty(
    '--vh', 
    `${window.innerHeight * 0.01}px`
  );
}
window.addEventListener('resize', setVH);
setVH();
```

---

### Q24: What are Container Queries?

**Answer:**
Style elements based on **container** size, not viewport.

```css
.card-container {
  container-type: inline-size;
}

@container (min-width: 400px) {
  .card {
    display: flex;
  }
}
```

**Use case:** Same component adapts whether in sidebar (small) or main content (large).

---

### Q25: Explain `animation-fill-mode`

**Answer:**
Controls element state before/after animation.

```css
animation-fill-mode: none;      /* Returns to initial state */
animation-fill-mode: forwards;  /* Keeps final keyframe state */
animation-fill-mode: backwards; /* Applies first keyframe during delay */
animation-fill-mode: both;      /* Forwards + backwards */
```

```css
@keyframes slideIn {
  from { transform: translateX(-100%); }
  to { transform: translateX(0); }
}

.element {
  animation: slideIn 0.5s ease forwards;
  /* Without forwards, element snaps back after animation! */
}
```

---

### Q26: How would you optimize CSS performance?

**Answer:**

1. **Selector performance**
```css
/* ❌ Slow */
body div.container ul li a { }
/* ✅ Fast */
.nav-link { }
```

2. **Avoid expensive properties in animations**
```css
/* ❌ Expensive (reflow) */
transition: width 0.3s, top 0.3s;
/* ✅ Cheap (composite) */
transition: transform 0.3s, opacity 0.3s;
```

3. **Critical CSS** - Inline above-the-fold styles

4. **Remove unused CSS** - PurgeCSS

5. **Use `contain`** - Isolate calculations
```css
.widget { contain: content; }
```

6. **Minify** - Use build tools

---

### Q27: What's the difference between `filter: drop-shadow()` and `box-shadow`?

**Answer:**

```css
/* box-shadow: Rectangular box shadow */
.element {
  box-shadow: 5px 5px 10px rgba(0,0,0,0.5);
}

/* drop-shadow: Follows element shape (including transparent areas) */
.element {
  filter: drop-shadow(5px 5px 10px rgba(0,0,0,0.5));
}
```

Use `drop-shadow` for PNGs with transparency to get shadow that follows the actual shape.

---

### Q28: How do you implement dark mode?

**Answer:**

```css
:root {
  --bg: #ffffff;
  --text: #333333;
}

[data-theme="dark"] {
  --bg: #1a1a2e;
  --text: #eaeaea;
}

/* System preference */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --bg: #1a1a2e;
    --text: #eaeaea;
  }
}

body {
  background: var(--bg);
  color: var(--text);
}
```

```javascript
function toggleTheme() {
  const html = document.documentElement;
  const current = html.getAttribute('data-theme');
  html.setAttribute('data-theme', current === 'dark' ? 'light' : 'dark');
}
```

---

### Q29: What is `clamp()` and how is it used?

**Answer:**
`clamp(min, preferred, max)` - Creates fluid values.

```css
/* Fluid font size */
h1 {
  font-size: clamp(1.5rem, 5vw, 3rem);
  /* Min: 1.5rem, Preferred: 5vw, Max: 3rem */
}

/* Fluid spacing */
.container {
  padding: clamp(1rem, 5vw, 3rem);
}

/* Fluid width */
.card {
  width: clamp(280px, 30vw, 400px);
}
```

---

### Q30: What is CSS containment?

**Answer:**
`contain` limits the scope of browser calculations.

```css
.widget {
  contain: layout;    /* Layout is independent */
  contain: paint;     /* Painting doesn't affect outside */
  contain: size;      /* Size doesn't depend on children */
  contain: style;     /* Counters/quotes don't escape */
  contain: content;   /* layout + paint */
  contain: strict;    /* All containment */
}
```

**Use for:** Independent widgets, infinite scroll items, complex components.

---

## Practical Coding Questions

### Q31: Create a CSS-only tooltip

<details>
<summary>Solution</summary>

```css
.tooltip {
  position: relative;
  cursor: help;
}

.tooltip::after {
  content: attr(data-tip);
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  padding: 8px 12px;
  background: #333;
  color: white;
  border-radius: 4px;
  font-size: 14px;
  white-space: nowrap;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.3s, visibility 0.3s;
}

.tooltip:hover::after {
  opacity: 1;
  visibility: visible;
}
```

```html
<span class="tooltip" data-tip="This is a tooltip!">Hover me</span>
```
</details>

---

### Q32: Create a responsive navigation bar

<details>
<summary>Solution</summary>

```css
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
  display: block;
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
}

.nav__menu.active {
  display: flex;
  flex-direction: column;
}

.nav__link {
  color: white;
  padding: 1rem;
  text-decoration: none;
}

@media (min-width: 768px) {
  .nav__toggle {
    display: none;
  }
  
  .nav__menu {
    display: flex;
    position: static;
    flex-direction: row;
    gap: 2rem;
  }
}
```
</details>

---

### Q33: Create a loading spinner

<details>
<summary>Solution</summary>

```css
.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top-color: #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
```
</details>

---

### Q34: Make equal height cards in a row

<details>
<summary>Solution</summary>

```css
/* Flexbox */
.card-row {
  display: flex;
  gap: 20px;
}

.card {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.card__body {
  flex: 1;  /* Fills remaining space */
}

/* OR Grid (simpler) */
.card-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}
/* Grid children are equal height by default! */
```
</details>

---

### Q35: Create a sticky footer

<details>
<summary>Solution</summary>

```css
/* Flexbox */
body {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

main {
  flex: 1;
}

footer {
  /* Automatically pushed to bottom */
}

/* OR Grid */
body {
  display: grid;
  grid-template-rows: auto 1fr auto;
  min-height: 100vh;
}
```
</details>

---

## Rapid Fire Questions

| Question | Answer |
|----------|--------|
| What is specificity? | Weight system to resolve CSS conflicts (inline > ID > class > element) |
| `inline` vs `inline-block`? | `inline`: no width/height. `inline-block`: accepts width/height |
| `rem` vs `em`? | `rem`: root font-size. `em`: parent font-size |
| How to hide element? | `display: none` (no space) or `visibility: hidden` (keeps space) |
| `position: absolute` relative to? | Nearest positioned ancestor |
| How to clear floats? | `clear: both`, clearfix hack, or `display: flow-root` |
| Center horizontally? | `margin: 0 auto` or Flexbox `justify-content: center` |
| Center vertically? | Flexbox `align-items: center` or Grid `place-items: center` |
| `!important` - good practice? | No, avoid it. Breaks cascade. |
| Mobile-first approach? | Base styles for mobile, `min-width` queries for larger |
| Flexbox main axis? | Direction of `flex-direction` (row = horizontal) |
| `z-index` not working? | Needs `position` other than `static` |
| Grid vs Flexbox? | Grid: 2D layouts. Flexbox: 1D layouts |
| `box-sizing: border-box`? | Width includes padding and border |
| What is margin collapse? | Vertical margins combine, largest wins |
| Pseudo-class vs pseudo-element? | Class = state (`:hover`). Element = new element (`::before`) |
| Animation vs Transition? | Animation: keyframes, auto-run. Transition: needs trigger |
| `100vh` problem on mobile? | Includes browser UI. Use `dvh` or JS |
| What is BEM? | Block__Element--Modifier naming convention |
| Critical CSS? | Inline styles for above-the-fold content |

---

## Scenario-Based Questions

### S1: "The website looks different in Safari vs Chrome. How do you debug?"

**Answer:**
1. Check browser-specific issues on caniuse.com
2. Add vendor prefixes (especially for Safari: `-webkit-`)
3. Check for Flexbox gaps (Safari < 14.1)
4. Test `backdrop-filter` (needs `-webkit-` prefix)
5. Check for `100vh` viewport issues
6. Use CSS feature queries: `@supports`

---

### S2: "The page is loading slowly. How do you optimize CSS?"

**Answer:**
1. Inline critical CSS for above-the-fold
2. Remove unused CSS (PurgeCSS)
3. Minify CSS
4. Avoid `@import` (use `<link>` instead)
5. Use simpler selectors
6. Load non-critical CSS asynchronously
7. Consider CSS-in-JS code splitting

---

### S3: "z-index: 9999 isn't working. Why?"

**Answer:**
1. Check if element has `position` (not `static`)
2. Check for stacking context - parent might have lower z-index
3. Check for `transform`, `opacity`, or `filter` on ancestors (creates stacking context)
4. Use browser DevTools to inspect stacking contexts

---

### S4: "How would you implement a design system?"

**Answer:**
1. Define CSS variables for colors, spacing, typography
2. Create base/reset styles
3. Build reusable components (BEM naming)
4. Document components with usage examples
5. Use consistent spacing scale (4px, 8px, 16px, etc.)
6. Consider using a methodology (BEM, SMACSS)
7. Set up linting (Stylelint)

---

## Quick Reference

```css
/* ===== SPECIFICITY ===== */
inline > #id > .class > element

/* ===== CENTERING ===== */
.flex-center { display: flex; justify-content: center; align-items: center; }
.grid-center { display: grid; place-items: center; }

/* ===== RESPONSIVE ===== */
@media (min-width: 768px) { }  /* Mobile-first */

/* ===== ANIMATIONS ===== */
transition: transform 0.3s ease;
animation: name 1s ease infinite;

/* ===== VARIABLES ===== */
:root { --color: blue; }
color: var(--color, fallback);
```

---

**Previous:** [05-CSS-Architecture.md](./05-CSS-Architecture.md)  
**Next:** [07-Exercises.md](./07-Exercises.md) - Practical Exercises
