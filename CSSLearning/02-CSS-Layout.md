# CSS Layout - Interview Preparation Guide

## Table of Contents
1. [Display Property](#display-property)
2. [Positioning](#positioning)
3. [Z-index & Stacking Context](#z-index--stacking-context)
4. [Float & Clear](#float--clear)
5. [Flexbox](#flexbox)
6. [CSS Grid](#css-grid)
7. [Flexbox vs Grid](#flexbox-vs-grid)
8. [Interview Questions](#interview-questions)
9. [Exercises](#exercises)

---

## Display Property

The `display` property determines how an element generates boxes and how it flows in the document.

### Block Elements

```css
.block {
  display: block;
}
```

**Characteristics:**
- Takes **full width** available (100% of parent)
- Starts on a **new line**
- Respects `width`, `height`, `margin`, `padding` (all directions)
- Examples: `<div>`, `<p>`, `<h1>-<h6>`, `<section>`, `<article>`, `<header>`, `<footer>`

```
┌──────────────────────────────────────────────────┐
│ Block Element (takes full width)                 │
└──────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────┐
│ Another Block Element (new line)                 │
└──────────────────────────────────────────────────┘
```

### Inline Elements

```css
.inline {
  display: inline;
}
```

**Characteristics:**
- Takes only **content width**
- Does **NOT** start on new line (flows with text)
- **Ignores** `width` and `height`
- Vertical `margin`/`padding` **don't push other elements**
- Examples: `<span>`, `<a>`, `<strong>`, `<em>`, `<img>`

```
This is text with [inline] [elements] that flow together.
```

```css
/* This WON'T work on inline elements! */
span {
  width: 200px;   /* ❌ Ignored */
  height: 100px;  /* ❌ Ignored */
  margin-top: 50px;  /* ❌ Doesn't push content above */
}
```

### Inline-Block

```css
.inline-block {
  display: inline-block;
}
```

**Characteristics:**
- Flows **inline** (no new line)
- **Respects** `width`, `height`, `margin`, `padding` (all directions)
- Best of both worlds!

```
Text with [█ inline-block █] [█ elements █] that have size.
```

```css
/* Common use: Navigation items */
.nav-item {
  display: inline-block;
  padding: 10px 20px;
  margin: 0 5px;
}
```

### Comparison Table

| Property | `block` | `inline` | `inline-block` |
|----------|---------|----------|----------------|
| New line | ✅ Yes | ❌ No | ❌ No |
| Full width | ✅ Default | ❌ Content only | ❌ Content only |
| Width/Height | ✅ Works | ❌ Ignored | ✅ Works |
| Margin (all) | ✅ Works | ↔️ Horizontal only | ✅ Works |
| Padding (all) | ✅ Works | ⚠️ Visual only (vertical) | ✅ Works |

### Other Display Values

```css
/* None - Removes element completely */
.hidden {
  display: none;  /* No space taken, not rendered */
}

/* Flex - Flexbox container */
.flex-container {
  display: flex;
}

/* Grid - Grid container */
.grid-container {
  display: grid;
}

/* Inline versions */
.inline-flex {
  display: inline-flex;  /* Inline flexbox */
}

.inline-grid {
  display: inline-grid;  /* Inline grid */
}

/* Contents - Element disappears, children remain */
.wrapper {
  display: contents;  /* Useful for accessibility wrappers */
}

/* Table displays */
.table { display: table; }
.table-row { display: table-row; }
.table-cell { display: table-cell; }

/* Flow-root - Creates new BFC (Block Formatting Context) */
.new-context {
  display: flow-root;  /* Contains floats, prevents margin collapse */
}
```

---

## Positioning

The `position` property controls how an element is positioned in the document.

### Position: Static (Default)

```css
.static {
  position: static;  /* DEFAULT VALUE */
}
```

**Characteristics:**
- Element is in **normal document flow**
- `top`, `right`, `bottom`, `left` have **NO effect**
- `z-index` has **NO effect**

```
Normal flow:
┌─────────┐
│ Element │
└─────────┘
     ↓
┌─────────┐
│ Element │
└─────────┘
```

### Position: Relative

```css
.relative {
  position: relative;
  top: 20px;
  left: 30px;
}
```

**Characteristics:**
- Element is positioned **relative to its normal position**
- **Original space is preserved** (other elements don't move)
- Creates a **positioning context** for absolute children
- `z-index` works

```
Normal position:          With relative:
┌─────────┐               ┌ ─ ─ ─ ─ ┐  ← Original space preserved
│ Element │               
└─────────┘               └ ─ ─ ─ ─ ┘
                              ↘ 20px down, 30px right
                          ┌─────────┐
                          │ Element │  ← Visually moved
                          └─────────┘
```

```css
/* Common use: Container for absolute children */
.card {
  position: relative;  /* Becomes reference for absolute children */
}

.card-badge {
  position: absolute;
  top: 10px;
  right: 10px;
}
```

### Position: Absolute

```css
.absolute {
  position: absolute;
  top: 0;
  right: 0;
}
```

**Characteristics:**
- Element is **removed from normal flow**
- **No space reserved** (other elements fill the gap)
- Positioned relative to **nearest positioned ancestor**
- If no positioned ancestor → positioned relative to **viewport** (or `<html>`)
- `z-index` works

```
Without absolute:              With absolute:
┌─────────────────────┐        ┌─────────────────────┐
│ ┌─────┐             │        │             ┌─────┐ │ ← Positioned top-right
│ │ Abs │             │   →    │             │ Abs │ │
│ └─────┘             │        │             └─────┘ │
│ ┌───────────────┐   │        │ ┌───────────────┐   │
│ │ Other Element │   │        │ │ Other Element │   │ ← Moves up (Abs removed from flow)
│ └───────────────┘   │        │ └───────────────┘   │
└─────────────────────┘        └─────────────────────┘
```

**Finding the Positioned Ancestor:**

```html
<div class="grandparent">                  <!-- position: static (NOT a reference) -->
  <div class="parent" style="position: relative;">  <!-- POSITIONED! (reference) -->
    <div class="child" style="position: absolute; top: 0; left: 0;">
      <!-- Positioned relative to .parent -->
    </div>
  </div>
</div>
```

```css
/* If NO positioned ancestor exists: */
.absolute-to-viewport {
  position: absolute;
  top: 0;
  left: 0;
  /* Positioned relative to viewport/html */
}
```

### Position: Fixed

```css
.fixed {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
}
```

**Characteristics:**
- Element is **removed from normal flow**
- Positioned relative to **viewport** (browser window)
- **Stays in place during scroll**
- `z-index` works

```
Viewport:
┌────────────────────────────────────┐
│ ┌────────────────────────────────┐ │ ← Fixed header (always visible)
│ │         FIXED HEADER           │ │
│ └────────────────────────────────┘ │
│                                    │
│    Page content scrolls here       │
│                                    │
│                    ┌──────┐        │
│                    │Fixed │ ← Fixed button (always visible)
│                    │ Btn  │        │
│                    └──────┘        │
└────────────────────────────────────┘
```

```css
/* Common uses */

/* Sticky header */
.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 60px;
  z-index: 1000;
}

/* Remember to add padding to body! */
body {
  padding-top: 60px;  /* Same as header height */
}

/* Floating action button */
.fab {
  position: fixed;
  bottom: 20px;
  right: 20px;
}

/* Full-screen modal backdrop */
.modal-backdrop {
  position: fixed;
  inset: 0;  /* top: 0; right: 0; bottom: 0; left: 0; */
  background: rgba(0, 0, 0, 0.5);
}
```

### Position: Sticky

```css
.sticky {
  position: sticky;
  top: 0;  /* Required! Defines the "stick" point */
}
```

**Characteristics:**
- **Hybrid** of relative and fixed
- Behaves like **relative** until scroll threshold is crossed
- Then behaves like **fixed** until parent scrolls out
- Must specify at least one of: `top`, `right`, `bottom`, `left`
- Works within its **parent container**

```
Scrolling behavior:
                                      
Before threshold:     At threshold:      Parent scrolls out:
┌──────────────┐      ┌──────────────┐   ┌──────────────┐
│              │      │ ┌──────────┐ │   │              │
│ ┌──────────┐ │      │ │ STICKY   │ │   │ ┌──────────┐ │ ← Sticks to top
│ │ STICKY   │ │  →   │ │ STUCK!   │ │ → │ │ LEAVING..│ │
│ └──────────┘ │      │ └──────────┘ │   │ └──────────┘ │
│    content   │      │              │   │              │
└──────────────┘      └──────────────┘   └──────────────┘
                           ↑ stuck                ↑ scrolls away with parent
```

```css
/* Table header that sticks */
thead th {
  position: sticky;
  top: 0;
  background: white;
}

/* Sidebar that sticks while scrolling */
.sidebar {
  position: sticky;
  top: 80px;  /* 80px from top of viewport */
  height: fit-content;
}

/* Section headers */
.section-header {
  position: sticky;
  top: 0;
  background: #f5f5f5;
  padding: 10px;
}
```

**⚠️ Common Sticky Issues:**

```css
/* Problem 1: Parent has overflow */
.parent {
  overflow: hidden;  /* or auto/scroll */
}
/* Solution: Remove overflow or restructure HTML */

/* Problem 2: Missing threshold */
.sticky {
  position: sticky;
  /* ❌ Forgot top/bottom! Won't stick! */
}

/* Problem 3: Parent has no scrollable height */
.parent {
  height: auto;  /* No defined height = no scrolling = no sticking */
}
```

### Position Comparison Chart

```
┌────────────────────────────────────────────────────────────────────────┐
│                    POSITION PROPERTY COMPARISON                        │
├──────────────┬──────────────┬──────────────┬──────────────┬───────────┤
│    STATIC    │   RELATIVE   │   ABSOLUTE   │    FIXED     │  STICKY   │
├──────────────┼──────────────┼──────────────┼──────────────┼───────────┤
│ Normal flow  │ Normal flow  │ Out of flow  │ Out of flow  │ Hybrid    │
├──────────────┼──────────────┼──────────────┼──────────────┼───────────┤
│ No offset    │ Offset from  │ Offset from  │ Offset from  │ Offset    │
│              │ itself       │ positioned   │ viewport     │ triggers  │
│              │              │ ancestor     │              │ sticky    │
├──────────────┼──────────────┼──────────────┼──────────────┼───────────┤
│ Space kept   │ Space kept   │ No space     │ No space     │ Space kept│
├──────────────┼──────────────┼──────────────┼──────────────┼───────────┤
│ z-index: NO  │ z-index: YES │ z-index: YES │ z-index: YES │ z-index:  │
│              │              │              │              │ YES       │
└──────────────┴──────────────┴──────────────┴──────────────┴───────────┘
```

### Centering with Position

```css
/* Center absolute element */
.centered {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

/* Alternative: Using inset and margin */
.centered-alt {
  position: absolute;
  inset: 0;  /* top:0; right:0; bottom:0; left:0; */
  margin: auto;
  width: 300px;   /* Must have explicit size */
  height: 200px;
}

/* Full-size overlay */
.overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
}
```

---

## Z-index & Stacking Context

### How Z-index Works

```css
.element {
  position: relative;  /* z-index only works on positioned elements! */
  z-index: 10;
}
```

**Z-index creates a stacking order along the Z-axis (towards viewer):**

```
    ↑ z-index: 3 (closest to viewer)
    │  ┌─────────┐
    │  │ Layer 3 │
    │  └─────────┘
    │     ┌─────────┐
    │     │ Layer 2 │  z-index: 2
    │     └─────────┘
    │        ┌─────────┐
    │        │ Layer 1 │  z-index: 1
    │        └─────────┘
    │           ┌─────────┐
    ↓           │ Layer 0 │  z-index: 0 or auto
                └─────────┘
```

### Default Stacking Order (No Z-index)

Without z-index, elements stack in this order (back to front):
1. Background and borders of root element
2. Descendant non-positioned blocks (in HTML order)
3. Descendant positioned elements (in HTML order)

```html
<div class="box-1">First (behind)</div>
<div class="box-2">Second (in front)</div>
<!-- Later elements appear on top -->
```

### Stacking Context

A **stacking context** is a container for z-index values. Z-index values are **only compared within the same stacking context**.

**What Creates a New Stacking Context:**

```css
/* 1. Root element (<html>) */

/* 2. position + z-index (not auto) */
.creates-context {
  position: relative;
  z-index: 1;  /* Any value except 'auto' */
}

/* 3. position: fixed or sticky */
.fixed { position: fixed; }
.sticky { position: sticky; top: 0; }

/* 4. Flex/Grid child with z-index */
.flex-container { display: flex; }
.flex-child { z-index: 1; }  /* Creates stacking context! */

/* 5. opacity less than 1 */
.transparent { opacity: 0.99; }

/* 6. transform (any value except none) */
.transformed { transform: translateZ(0); }

/* 7. filter (any value except none) */
.filtered { filter: blur(0); }

/* 8. Other: perspective, clip-path, mask, isolation, mix-blend-mode, will-change */
.isolated { isolation: isolate; }
```

### The Stacking Context Trap

```css
/* Parent creates stacking context with z-index: 1 */
.parent-a {
  position: relative;
  z-index: 1;
}

.child-a {
  position: absolute;
  z-index: 9999;  /* Very high! */
}

/* Parent B has higher z-index */
.parent-b {
  position: relative;
  z-index: 2;
}

/* Result: child-a (9999) is BEHIND parent-b (2)! */
/* Because child-a's z-index is relative to parent-a's stacking context */
```

```
Visual explanation:
                                    
Stacking Context A (z-index: 1)     Stacking Context B (z-index: 2)
┌───────────────────────────┐       ┌───────────────────────────┐
│  ┌─────────────────────┐  │       │                           │
│  │ Child (z-index:9999)│  │  ←──  │      APPEARS ON TOP       │
│  │  stays inside!      │  │       │  (parent z-index: 2 > 1)  │
│  └─────────────────────┘  │       │                           │
└───────────────────────────┘       └───────────────────────────┘
        z: 1                                z: 2
```

### Best Practices for Z-index

```css
/* Define a z-index scale */
:root {
  --z-dropdown: 100;
  --z-sticky: 200;
  --z-fixed: 300;
  --z-modal-backdrop: 400;
  --z-modal: 500;
  --z-popover: 600;
  --z-tooltip: 700;
}

.dropdown { z-index: var(--z-dropdown); }
.header { z-index: var(--z-sticky); }
.modal-backdrop { z-index: var(--z-modal-backdrop); }
.modal { z-index: var(--z-modal); }
.tooltip { z-index: var(--z-tooltip); }
```

---

## Float & Clear

> **Note:** Floats are legacy for layouts. Use Flexbox/Grid instead. Still relevant for text wrapping around images.

### Float Property

```css
.float-left {
  float: left;
  margin-right: 20px;  /* Space between float and text */
}

.float-right {
  float: right;
  margin-left: 20px;
}
```

```
Float left:                        Float right:
┌───────┐ Text wraps around the    Text wraps around the ┌───────┐
│ Image │ floated image. Lorem     floated image. Lorem  │ Image │
│       │ ipsum dolor sit amet,   ipsum dolor sit amet,  │       │
└───────┘ consectetur adipiscing   consectetur adipiscing └───────┘
elit. More text continues here.    elit. More text continues here.
```

### The Float Problem

Floated elements are removed from normal flow, causing parent collapse:

```css
.parent {
  background: lightblue;
  /* Parent collapses to 0 height! */
}

.child {
  float: left;
  width: 200px;
  height: 200px;
}
```

```
Expected:                    Reality:
┌─────────────────────┐      ─────────────────────  ← Parent has no height!
│ ┌─────────┐         │      ┌─────────┐
│ │ Floated │         │      │ Floated │  (outside parent visually)
│ │  Child  │         │      │  Child  │
│ └─────────┘         │      └─────────┘
└─────────────────────┘
```

### Clearing Floats

#### Method 1: Clear Property
```css
.clear {
  clear: both;  /* Also: left, right */
}
```

```html
<div class="parent">
  <div class="float-left">Floated</div>
  <div class="clear"></div>  <!-- Empty div to clear -->
</div>
```

#### Method 2: Clearfix Hack (Classic)
```css
.clearfix::after {
  content: "";
  display: table;  /* or block */
  clear: both;
}
```

```html
<div class="parent clearfix">
  <div class="float-left">Floated</div>
  <!-- No extra element needed! -->
</div>
```

#### Method 3: Display Flow-Root (Modern ✅)
```css
.parent {
  display: flow-root;  /* Creates BFC, contains floats */
}
```

#### Method 4: Overflow (Works but has side effects)
```css
.parent {
  overflow: hidden;  /* or auto */
  /* ⚠️ May clip content that overflows */
}
```

---

## Flexbox

Flexbox is a **one-dimensional** layout system (row OR column).

### Flex Container Setup

```css
.flex-container {
  display: flex;  /* or inline-flex */
}
```

**Immediate effects when you add `display: flex`:**
1. Children become flex items (even inline elements)
2. Items flow in a row (default)
3. Items stretch to fill container height
4. Items can shrink but won't wrap by default

### Flex Container Properties

#### flex-direction

```css
.container {
  flex-direction: row;           /* Default: left to right → */
  flex-direction: row-reverse;   /* Right to left ← */
  flex-direction: column;        /* Top to bottom ↓ */
  flex-direction: column-reverse; /* Bottom to top ↑ */
}
```

```
row:              row-reverse:       column:         column-reverse:
[1][2][3] →       ← [3][2][1]        [1]             [3]
                                      ↓               ↑
                                     [2]             [2]
                                      ↓               ↑
                                     [3]             [1]
```

#### flex-wrap

```css
.container {
  flex-wrap: nowrap;       /* Default: single line, items shrink */
  flex-wrap: wrap;         /* Multiple lines, top to bottom */
  flex-wrap: wrap-reverse; /* Multiple lines, bottom to top */
}
```

```
nowrap (default):          wrap:                    wrap-reverse:
[1][2][3][4][5][6] →       [1][2][3][4]             [5][6]
(items shrink to fit)      [5][6]                   [1][2][3][4]
                           (items wrap to new row)  (wrap upward)
```

#### justify-content (Main Axis)

```css
.container {
  justify-content: flex-start;    /* Items at start */
  justify-content: flex-end;      /* Items at end */
  justify-content: center;        /* Items centered */
  justify-content: space-between; /* Equal space BETWEEN items */
  justify-content: space-around;  /* Equal space AROUND items */
  justify-content: space-evenly;  /* Equal space everywhere */
}
```

```
Container: [                                                    ]

flex-start:    [1][2][3]                                        
flex-end:                                              [1][2][3]
center:                      [1][2][3]                          
space-between: [1]              [2]              [3]            
space-around:    [1]       [2]       [3]                        
space-evenly:      [1]      [2]      [3]                        
                                                                
Legend:                                                         
space-between: |item|-------|item|-------|item|                 
space-around:  |--item--|--||--item--|--||--item--|             
space-evenly:  |---item---|---item---|---item---|               
```

#### align-items (Cross Axis)

```css
.container {
  align-items: stretch;     /* Default: items stretch to fill */
  align-items: flex-start;  /* Items at start of cross axis */
  align-items: flex-end;    /* Items at end of cross axis */
  align-items: center;      /* Items centered on cross axis */
  align-items: baseline;    /* Items aligned by text baseline */
}
```

```
Container height: |                                  |

stretch:       |████████████████████████████████████| ← Items fill height
               |████████████████████████████████████|

flex-start:    |[1][22][333]                        | ← Items at top
               |                                    |

flex-end:      |                                    |
               |[1][22][333]                        | ← Items at bottom

center:        |                                    |
               |[1][22][333]                        | ← Items in middle
               |                                    |

baseline:      |    [1]                             | ← Text baselines align
               |[22222]                             |
               |      [333]                         |
```

#### align-content (Multiple Lines)

Only works when `flex-wrap: wrap` and there are multiple lines:

```css
.container {
  flex-wrap: wrap;
  align-content: flex-start;    /* Lines at start */
  align-content: flex-end;      /* Lines at end */
  align-content: center;        /* Lines centered */
  align-content: space-between; /* Equal space between lines */
  align-content: space-around;  /* Equal space around lines */
  align-content: stretch;       /* Default: lines stretch */
}
```

#### gap (Modern Spacing)

```css
.container {
  gap: 20px;           /* Both row and column gap */
  row-gap: 20px;       /* Space between rows */
  column-gap: 10px;    /* Space between columns */
}
```

**Why gap is better than margin:**
- No margin collapse issues
- No negative margins needed
- No "extra margin" on first/last items
- Works with wrap

### Flex Item Properties

#### flex-grow

```css
.item {
  flex-grow: 0;  /* Default: don't grow */
  flex-grow: 1;  /* Take equal share of extra space */
  flex-grow: 2;  /* Take 2x share compared to flex-grow: 1 */
}
```

```
Container: [                                        ]
Available: 300px extra space

flex-grow: 0 (all items):
[item][item][item]                      (300px unused)

flex-grow: 1 (all items):
[   item   ][   item   ][   item   ]    (each gets 100px extra)

flex-grow: 1, 2, 1:
[  item  ][    item    ][  item  ]      (75px, 150px, 75px extra)
```

#### flex-shrink

```css
.item {
  flex-shrink: 1;  /* Default: shrink equally */
  flex-shrink: 0;  /* Don't shrink (keep original size) */
  flex-shrink: 2;  /* Shrink 2x more than others */
}
```

```
Container too small - need to remove 200px:

flex-shrink: 1 (all items):
[  item  ][  item  ][  item  ]  (each shrinks ~67px)

flex-shrink: 0, 1, 1:
[   item   ][item][item]        (first doesn't shrink)
```

#### flex-basis

```css
.item {
  flex-basis: auto;   /* Default: use width/height */
  flex-basis: 200px;  /* Start at 200px before grow/shrink */
  flex-basis: 25%;    /* Start at 25% of container */
  flex-basis: 0;      /* Start from 0, distribute all space via grow */
}
```

#### flex Shorthand

```css
.item {
  /* flex: grow shrink basis */
  flex: 0 1 auto;    /* Default */
  flex: 1;           /* Same as flex: 1 1 0 (grow equally) */
  flex: auto;        /* Same as flex: 1 1 auto */
  flex: none;        /* Same as flex: 0 0 auto (rigid) */
  flex: 2;           /* Same as flex: 2 1 0 (grow 2x) */
}
```

**Common patterns:**
```css
/* Equal width columns */
.col { flex: 1; }

/* Fixed sidebar + flexible main */
.sidebar { flex: 0 0 250px; }  /* Don't grow, don't shrink, 250px */
.main { flex: 1; }              /* Take remaining space */

/* Minimum width with flexibility */
.card { flex: 1 1 300px; }     /* Grow/shrink, min 300px */
```

#### align-self

```css
.item {
  align-self: auto;       /* Use container's align-items */
  align-self: flex-start;
  align-self: flex-end;
  align-self: center;
  align-self: stretch;
}
```

#### order

```css
.item-1 { order: 3; }
.item-2 { order: 1; }
.item-3 { order: 2; }

/* Visual order: item-2, item-3, item-1 */
/* ⚠️ Doesn't change tab order or screen reader order */
```

### Common Flexbox Patterns

```css
/* Perfect centering */
.center-everything {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
}

/* Navigation bar */
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* Footer at bottom */
body {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}
main {
  flex: 1;  /* Push footer down */
}

/* Equal height cards */
.card-row {
  display: flex;
  gap: 20px;
}
.card {
  flex: 1;  /* Equal width */
  display: flex;
  flex-direction: column;
}
.card-body {
  flex: 1;  /* Card bodies equal height */
}

/* Last item to the right */
.container {
  display: flex;
}
.push-right {
  margin-left: auto;
}
```

---

## CSS Grid

Grid is a **two-dimensional** layout system (rows AND columns).

### Grid Container Setup

```css
.grid-container {
  display: grid;
}
```

### Defining Grid Structure

#### grid-template-columns & grid-template-rows

```css
.container {
  display: grid;
  
  /* Fixed widths */
  grid-template-columns: 200px 200px 200px;
  
  /* Flexible with fr (fraction) */
  grid-template-columns: 1fr 1fr 1fr;        /* 3 equal columns */
  grid-template-columns: 1fr 2fr 1fr;        /* Middle is 2x wider */
  
  /* Mixed units */
  grid-template-columns: 250px 1fr 250px;    /* Fixed sidebars */
  
  /* repeat() function */
  grid-template-columns: repeat(3, 1fr);     /* 3 equal columns */
  grid-template-columns: repeat(4, 100px);   /* 4 columns of 100px */
  
  /* minmax() function */
  grid-template-columns: repeat(3, minmax(200px, 1fr));
  
  /* auto-fit and auto-fill */
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  
  /* Rows */
  grid-template-rows: 100px auto 100px;      /* Header, content, footer */
}
```

#### Understanding fr (fraction unit)

```css
.container {
  width: 900px;
  grid-template-columns: 1fr 2fr 1fr;
}

/* Calculation:
   Total fractions: 1 + 2 + 1 = 4
   Each fr = 900px / 4 = 225px
   Column 1: 1fr = 225px
   Column 2: 2fr = 450px
   Column 3: 1fr = 225px
*/
```

```
┌─────────────────────────────────────────────────────────────────────────┐
│         1fr          │              2fr              │        1fr        │
│        225px         │             450px             │       225px       │
└─────────────────────────────────────────────────────────────────────────┘
```

#### auto-fit vs auto-fill (IMPORTANT!)

```css
.container {
  width: 1000px;
}

/* auto-fill: Creates columns, keeps empty tracks */
.auto-fill {
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
}
/* With 2 items: Creates 5 columns (5×200=1000), items in first 2 */

/* auto-fit: Creates columns, collapses empty tracks */
.auto-fit {
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
}
/* With 2 items: Creates 5 columns, collapses 3 empty ones, items expand */
```

```
auto-fill with 2 items (1000px container):
┌──────────┬──────────┬──────────┬──────────┬──────────┐
│  Item 1  │  Item 2  │  (empty) │  (empty) │  (empty) │
│  200px   │  200px   │          │          │          │
└──────────┴──────────┴──────────┴──────────┴──────────┘

auto-fit with 2 items (1000px container):
┌─────────────────────────┬─────────────────────────┐
│         Item 1          │         Item 2          │
│          500px          │          500px          │
└─────────────────────────┴─────────────────────────┘
(empty tracks collapsed, items expand to fill space)
```

**Use `auto-fit` for most responsive grids!**

### Grid Template Areas

```css
.container {
  display: grid;
  grid-template-columns: 200px 1fr 200px;
  grid-template-rows: 60px 1fr 60px;
  grid-template-areas:
    "header header header"
    "sidebar main aside"
    "footer footer footer";
  gap: 10px;
  min-height: 100vh;
}

/* Assign elements to areas */
.header  { grid-area: header; }
.sidebar { grid-area: sidebar; }
.main    { grid-area: main; }
.aside   { grid-area: aside; }
.footer  { grid-area: footer; }

/* Empty cells with dots */
grid-template-areas:
  "header header ."
  "sidebar main main"
  "footer footer footer";
```

```
┌─────────────────────────────────────────────────────┐
│                    header                           │
├──────────┬───────────────────────────┬──────────────┤
│          │                           │              │
│ sidebar  │          main             │    aside     │
│          │                           │              │
├──────────┴───────────────────────────┴──────────────┤
│                    footer                           │
└─────────────────────────────────────────────────────┘
```

### Grid Gap

```css
.container {
  gap: 20px;           /* Both row and column */
  row-gap: 20px;       /* Between rows */
  column-gap: 10px;    /* Between columns */
}
```

### Grid Item Placement

#### By Line Numbers

```css
.item {
  /* Start and end lines (1-based) */
  grid-column-start: 1;
  grid-column-end: 3;    /* Spans columns 1-2 */
  grid-row-start: 1;
  grid-row-end: 2;
  
  /* Shorthand */
  grid-column: 1 / 3;    /* Start at 1, end at 3 */
  grid-row: 1 / 2;
  
  /* Span keyword */
  grid-column: span 2;   /* Span 2 columns */
  grid-column: 1 / span 2;  /* Start at 1, span 2 */
  
  /* Negative values (count from end) */
  grid-column: 1 / -1;   /* Full width (first to last) */
}
```

```
Grid lines:
    1     2     3     4
    │     │     │     │
    ▼     ▼     ▼     ▼
  1 ┌─────┬─────┬─────┐
    │     │     │     │
  2 ├─────┼─────┼─────┤
    │     │     │     │
  3 ├─────┼─────┼─────┤
    │     │     │     │
  4 └─────┴─────┴─────┘
```

### Grid Alignment

```css
.container {
  /* Align items within their cells */
  justify-items: start | end | center | stretch;  /* Horizontal */
  align-items: start | end | center | stretch;    /* Vertical */
  place-items: center;  /* Both */
  
  /* Align the grid within the container */
  justify-content: start | end | center | space-between | space-around | space-evenly;
  align-content: start | end | center | space-between | space-around | space-evenly;
  place-content: center;  /* Both */
}

.item {
  /* Individual item alignment */
  justify-self: start | end | center | stretch;
  align-self: start | end | center | stretch;
  place-self: center;  /* Both */
}
```

### Common Grid Patterns

```css
/* Responsive card grid */
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
}

/* Holy grail layout */
.holy-grail {
  display: grid;
  grid-template-areas:
    "header header header"
    "nav main aside"
    "footer footer footer";
  grid-template-columns: 200px 1fr 200px;
  grid-template-rows: auto 1fr auto;
  min-height: 100vh;
}

/* Magazine layout */
.magazine {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-auto-rows: 200px;
  gap: 10px;
}
.featured {
  grid-column: span 2;
  grid-row: span 2;
}

/* Simple centering */
.centered {
  display: grid;
  place-items: center;
  min-height: 100vh;
}

/* 12-column system */
.grid-12 {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 20px;
}
.col-6 { grid-column: span 6; }
.col-4 { grid-column: span 4; }
.col-3 { grid-column: span 3; }
```

---

## Flexbox vs Grid

### When to Use Flexbox

- **One-dimensional** layouts (row OR column)
- **Content-driven** sizing (let content determine size)
- **Small components** (navbars, button groups, cards)
- When items should **wrap naturally**
- When you need **alignment** along one axis

### When to Use Grid

- **Two-dimensional** layouts (rows AND columns)
- **Layout-driven** sizing (define structure first)
- **Page-level layouts** (headers, sidebars, main content)
- **Complex placement** (overlapping, spanning)
- When you need **precise control** over both axes

### Comparison

```css
/* FLEXBOX: Content dictates layout */
.nav {
  display: flex;
  gap: 20px;
}
/* Items take their natural size, flex handles overflow */

/* GRID: Layout dictates content */
.page {
  display: grid;
  grid-template-columns: 200px 1fr 200px;
}
/* You define the structure, content fills it */
```

### They Work Great Together!

```css
/* Grid for page layout */
.page {
  display: grid;
  grid-template-areas:
    "header header"
    "sidebar main"
    "footer footer";
}

/* Flexbox for components inside grid areas */
.header {
  grid-area: header;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
}

.card {
  display: flex;
  flex-direction: column;
}

.card-body {
  flex: 1;  /* Fills remaining space */
}
```

---

## Interview Questions

### Q1: What's the difference between `position: relative` and `position: absolute`?
**Answer:**
- `relative`: Element stays in normal flow, offset is relative to its **original position**, original space is **preserved**
- `absolute`: Element is **removed from flow**, positioned relative to nearest **positioned ancestor**, no space reserved

### Q2: How do you center a div horizontally and vertically?
**Answer:**
```css
/* Method 1: Flexbox */
.parent { display: flex; justify-content: center; align-items: center; }

/* Method 2: Grid */
.parent { display: grid; place-items: center; }

/* Method 3: Absolute + Transform */
.child { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); }

/* Method 4: Absolute + Margin Auto */
.child { position: absolute; inset: 0; margin: auto; width: 200px; height: 200px; }
```

### Q3: Explain `flex-grow`, `flex-shrink`, and `flex-basis`.
**Answer:**
- `flex-grow`: How much an item **grows** to fill extra space (default: 0)
- `flex-shrink`: How much an item **shrinks** when space is limited (default: 1)
- `flex-basis`: The **initial size** before growing/shrinking (default: auto)

### Q4: What's the difference between `auto-fit` and `auto-fill`?
**Answer:**
- `auto-fill`: Creates as many columns as fit, **keeps empty columns**
- `auto-fit`: Creates columns but **collapses empty ones**, items expand

Use `auto-fit` for responsive grids where you want items to expand.

### Q5: When does z-index not work?
**Answer:** z-index doesn't work when:
1. Element has `position: static` (default)
2. Element is in a lower stacking context
3. Parent has lower z-index (can't escape stacking context)

### Q6: What is a stacking context?
**Answer:** A stacking context is a container for z-index. Elements within a stacking context are painted together, and their z-index values are relative to each other. Created by: positioned elements with z-index, opacity < 1, transforms, filters, etc.

### Q7: What's the difference between Flexbox and Grid?
**Answer:**
- **Flexbox**: One-dimensional (row OR column), content-driven, good for components
- **Grid**: Two-dimensional (rows AND columns), layout-driven, good for page layouts

---

## Exercises

### Exercise 1: Navbar with Flexbox
Create a navbar with logo left, links center, and button right.

<details>
<summary>Solution</summary>

```css
.navbar {
  display: flex;
  align-items: center;
  padding: 0 20px;
  height: 60px;
  background: #333;
}

.logo {
  font-size: 1.5rem;
  color: white;
}

.nav-links {
  display: flex;
  gap: 30px;
  margin: 0 auto;  /* Center the links */
}

.nav-links a {
  color: #ccc;
  text-decoration: none;
}

.btn-login {
  padding: 8px 16px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
}
```
</details>

### Exercise 2: Responsive Card Grid
Create a grid that shows 4 columns on desktop, 2 on tablet, 1 on mobile.

<details>
<summary>Solution</summary>

```css
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
  padding: 20px;
}

.card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}
```
</details>

### Exercise 3: Holy Grail Layout
Create header, footer, sidebar, main content, and aside using Grid.

<details>
<summary>Solution</summary>

```css
.holy-grail {
  display: grid;
  grid-template-areas:
    "header header header"
    "nav main aside"
    "footer footer footer";
  grid-template-columns: 200px 1fr 200px;
  grid-template-rows: auto 1fr auto;
  min-height: 100vh;
  gap: 10px;
}

header { grid-area: header; }
nav { grid-area: nav; }
main { grid-area: main; }
aside { grid-area: aside; }
footer { grid-area: footer; }

/* Responsive */
@media (max-width: 768px) {
  .holy-grail {
    grid-template-areas:
      "header"
      "nav"
      "main"
      "aside"
      "footer";
    grid-template-columns: 1fr;
  }
}
```
</details>

---

## Quick Reference

```css
/* ===== DISPLAY ===== */
display: block | inline | inline-block | flex | grid | none;

/* ===== POSITION ===== */
position: static | relative | absolute | fixed | sticky;

/* ===== FLEXBOX CONTAINER ===== */
display: flex;
flex-direction: row | column;
justify-content: flex-start | center | space-between;
align-items: stretch | center | flex-start | flex-end;
gap: 20px;

/* ===== FLEXBOX ITEM ===== */
flex: 1;  /* grow shrink basis */
align-self: center;
order: 1;

/* ===== GRID CONTAINER ===== */
display: grid;
grid-template-columns: repeat(3, 1fr);
grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
gap: 20px;

/* ===== GRID ITEM ===== */
grid-column: 1 / 3;  /* or span 2 */
grid-area: header;

/* ===== CENTERING ===== */
/* Flexbox */
display: flex; justify-content: center; align-items: center;
/* Grid */
display: grid; place-items: center;
```

---

**Previous:** [01-CSS-Basics.md](./01-CSS-Basics.md)  
**Next:** [03-CSS-Responsive.md](./03-CSS-Responsive.md) - Media Queries & Responsive Design
