# CSS Layout - Complete Guide

## Table of Contents
1. [Guide Audit and Improvement Map](#guide-audit-and-improvement-map)
2. [The Big Picture - How CSS Layout Really Works](#the-big-picture---how-css-layout-really-works)
3. [Display Property](#display-property)
4. [Positioning](#positioning)
5. [Z-index & Stacking Context](#z-index--stacking-context)
6. [Float & Clear](#float--clear)
7. [Flexbox](#flexbox)
8. [CSS Grid](#css-grid)
9. [Flexbox vs Grid](#flexbox-vs-grid)
10. [When to Use What - Layout Decision Guide](#when-to-use-what---layout-decision-guide)
11. [Common Pitfalls and How to Avoid Them](#common-pitfalls-and-how-to-avoid-them)
12. [Interview Questions](#interview-questions)
13. [Exercises](#exercises)
14. [Summary Cheatsheet](#summary-cheatsheet)

---

## Guide Audit and Improvement Map

This guide already covered the important CSS layout tools: `display`, positioning,
stacking contexts, floats, Flexbox, Grid, and common interview questions.

The main improvement needed was **conceptual depth**. The original version was
useful for revision, but some sections were close to a syntax checklist. CSS
layout becomes much easier when you understand that every layout tool answers a
different question:

| Tool | Question It Answers |
|------|---------------------|
| Normal flow | How should elements lay out if we do nothing special? |
| `display` | What kind of box should this element create? |
| Positioning | Should this element stay in flow or be visually moved? |
| Stacking context | Which layer should appear in front? |
| Floats | Should inline text wrap around this box? |
| Flexbox | How should items share space along one axis? |
| Grid | How should a two-dimensional structure of rows and columns be built? |

### What Was Improved

| Area | Previous State | Improved Learning Goal |
|------|----------------|------------------------|
| Opening | Started directly with `display` | Add the browser layout pipeline and normal-flow mental model |
| Display | Good list of values | Explain box generation, outer/inner display, and why block/inline behave differently |
| Positioning | Good examples | Add flow vs visual movement, containing blocks, and practical decision logic |
| Z-index | Good stacking-context trap | Add paint-order reasoning and debugging workflow |
| Floats | Correct legacy note | Explain why floats were misused for layout and where they still fit |
| Flexbox | Strong API coverage | Add axis mental model, free-space distribution, and grow/shrink/basis reasoning |
| Grid | Strong syntax coverage | Add track sizing, explicit vs implicit grid, and layout-first thinking |
| Flexbox vs Grid | Useful comparison | Add richer decision flow and combined usage patterns |
| Pitfalls | Missing as a module | Added common production mistakes with bad/good examples |
| Cheatsheet | Syntax-only quick reference | Replaced with concept-focused summary and starter patterns |

### How to Study This Guide

Do not memorize layout properties as isolated commands. Instead, ask:

1. Is the element participating in normal flow?
2. What kind of box does it generate?
3. Is the layout one-dimensional or two-dimensional?
4. Should content decide the layout, or should the layout structure decide content placement?
5. Is the element being moved visually, or removed from flow entirely?
6. Is the issue about geometry, spacing, alignment, or layering?

Those questions tell you which CSS layout tool belongs in your hand.

---

## The Big Picture - How CSS Layout Really Works

CSS layout is the browser's process for turning HTML elements into boxes, placing
those boxes on the page, and deciding which boxes paint in front of others.

Think of the browser like an event organizer arranging people in a hall:

```
HTML elements       CSS rules              Browser layout result
     │                 │                            │
     ▼                 ▼                            ▼
Guests arrive   Seating instructions       People placed in rows,
with names      say table, row, VIP        columns, layers, or overlays
```

The browser does not randomly place elements. It follows layout algorithms.
Different CSS properties choose different algorithms.

### The Browser's Layout Pipeline

```
HTML parsed
 │
 ▼
DOM tree created
 │
 ▼
CSS parsed
 │
 ▼
CSSOM created
 │
 ▼
DOM + CSSOM combine into render tree
 │
 ▼
Layout calculates box sizes and positions
 │
 ▼
Paint draws pixels
 │
 ▼
Composite layers appear on screen
```

Layout is the geometry step. Paint and compositing are visual layering steps.
This matters because some bugs are layout bugs (`width`, `flow`, `alignment`) and
some bugs are painting bugs (`z-index`, stacking contexts, transforms).

### Normal Flow - The Default Layout Algorithm

Before Flexbox, Grid, positioning, or floats, elements live in **normal flow**.
Normal flow is the browser's default way to place boxes.

```
Block formatting:
┌─────────────────────────────┐
│ block takes available width │
└─────────────────────────────┘
┌─────────────────────────────┐
│ next block starts below     │
└─────────────────────────────┘

Inline formatting:
Text and inline boxes flow horizontally, wrap when they run out of space,
and continue on the next line.
```

Most layout bugs are caused by not knowing whether an element is still in normal
flow. Flex and Grid keep children in a managed layout flow. Absolute and fixed
positioning remove elements from normal flow. Relative and sticky keep their
normal-flow space but change visual behavior.

### Layout Tool Mental Model

| Problem Type | Best First Tool |
|--------------|-----------------|
| Text and document content | Normal flow |
| Make an element block-like or inline-like | `display` |
| Align a row of buttons or nav items | Flexbox |
| Build a page shell with rows and columns | Grid |
| Put a badge in the corner of a card | `position: absolute` inside a relative parent |
| Keep a header visible while scrolling | `position: sticky` or `fixed` |
| Make text wrap around an image | Float |
| Fix overlay appearing behind something | Stacking context and `z-index` |

---

## Display Property

The `display` property determines how an element generates boxes and how it flows in the document.

More deeply, `display` answers two questions:

1. How does this element behave **outside** itself among sibling elements?
2. How do this element's children behave **inside** it?

Modern CSS describes this as outer display and inner display:

```css
.example {
  display: block flex;
}
```

That means:

```
Outside: behaves like a block-level element among siblings.
Inside: lays out children using Flexbox.
```

Most developers still write the common shorthand:

```css
.example {
  display: flex;
}
```

The browser treats that as a block-level flex container.

### Block Elements

Block layout is the document's vertical stacking model. A block box behaves like
a paragraph in a book: it starts on a new line, takes the available line width,
and pushes the next block below it.

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

Inline layout is the text-flow model. Inline boxes behave like words inside a
sentence: they sit beside other inline content and wrap when the line runs out of
space.

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
/* This will not work on inline elements */
span {
  width: 200px;       /* Ignored */
  height: 100px;      /* Ignored */
  margin-top: 50px;   /* Does not push content above */
}
```

### Inline-Block

`inline-block` is useful when you want an element to participate in text-like
horizontal flow but still have a controllable box size. Historically it was used
for nav items, badges, and button-like links before Flexbox became common.

```css
.inline-block {
  display: inline-block;
}
```

**Characteristics:**
- Flows **inline** (no new line)
- **Respects** `width`, `height`, `margin`, `padding` (all directions)
- Useful when the element should sit in a line but still behave like a box

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
| New line | Yes | No | No |
| Full width | Default | Content only | Content only |
| Width/Height | Works | Ignored | Works |
| Margin | All directions | Horizontal affects flow; vertical is mostly visual | All directions |
| Padding | All directions | Vertical may overlap nearby lines | All directions |

### Display Value Decision Guide

| Need | Use | Why |
|------|-----|-----|
| A section, article, paragraph, or page region | `block` | It should stack vertically |
| Text inside a sentence | `inline` | It should flow with text |
| Text-like item with width/padding | `inline-block` | It needs inline flow plus box sizing |
| Row or column alignment | `flex` | Children share and align along one axis |
| Rows and columns | `grid` | Children belong in a two-dimensional structure |
| Hide completely from layout | `display: none` | It should not render or reserve space |
| Contain floats or stop margin collapse | `flow-root` | It creates a new block formatting context |

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

Positioning is about the difference between **layout position** and **visual
position**.

```
Layout position:
Where the element belongs in normal flow.

Visual position:
Where the element is painted after offsets like top/left are applied.
```

Some positioning modes keep the layout position. Others remove the element from
normal flow entirely.

### Positioning Decision Tree

```
Do you only need normal document flow?
 │
 ├── YES ──► position: static
 │
 └── NO
      │
      ▼
Need to create a reference for absolute children?
 │
 ├── YES ──► position: relative on parent
 │
 └── NO
      │
      ▼
Should the element be removed from layout flow?
 │
 ├── YES
 │    ├── relative to nearest positioned ancestor ──► absolute
 │    └── relative to viewport ─────────────────────► fixed
 │
 └── NO
      └── should it stick while scrolling? ─────────► sticky
```

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

`position: relative` is often misunderstood. It does not mean "position this
element inside its parent." It means "keep the element's normal-flow slot, but
allow visual offset from that slot."

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

`position: absolute` removes the element from normal flow. The element is no
longer part of the parent's normal height calculation, and siblings behave as if
the absolute element is not there.

The most common safe pattern is:

```
Parent: position: relative
Child:  position: absolute
```

That creates a predictable local coordinate system.

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

`position: fixed` is absolute positioning against the viewport. Use it when the
element belongs to the screen, not to a particular section of content.

Common examples: app headers, floating action buttons, modal backdrops, cookie
banners, and debug panels.

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

`position: sticky` is best understood as "relative until a scroll threshold, then
fixed within the parent boundary."

Sticky is not a replacement for fixed. Fixed ignores the document section and
stays attached to the viewport. Sticky remains connected to its parent and stops
when the parent scrolls away.

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

**Common Sticky Issues:**

```css
/* Problem 1: Parent has overflow */
.parent {
  overflow: hidden;  /* or auto/scroll */
}
/* Solution: Remove overflow or restructure HTML */

/* Problem 2: Missing threshold */
.sticky {
  position: sticky;
  /* Forgot top/bottom. It will not stick. */
}

/* Problem 3: Parent has no scrollable height */
.parent {
  height: auto;  /* No defined height = no scrolling = no sticking */
}
```

### Positioning Pitfall to Remember

If an element should still influence the surrounding layout, do not reach for
`absolute` first. Absolute positioning is powerful, but it can create fragile
layouts because nearby content no longer knows the element exists.

```css
/* Fragile when used for ordinary layout */
.card-title {
  position: absolute;
  top: 20px;
}

/* Better: let normal layout, Flexbox, or Grid place content */
.card {
  display: grid;
  gap: 1rem;
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

Layering bugs are usually not caused by the number being too small. They are
caused by elements being compared inside different stacking contexts.

Think of stacking contexts like folders of layers:

```
Page
 │
 ├── Stacking Context A
 │    ├── child z-index: 1
 │    └── child z-index: 9999
 │
 └── Stacking Context B
      └── child z-index: 2
```

The browser compares the folders first. A child with `9999` cannot jump out of a
lower folder and beat a higher folder.

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

### Paint Order Mental Model

The browser paints like a person drawing on transparent sheets. Things drawn
later appear on top unless a stacking context changes the grouping.

```
Back
 │
 ├── root background
 ├── normal block content
 ├── positioned content
 ├── higher z-index layers
 │
 ▼
Front
```

If two elements have no explicit `z-index`, later HTML often appears above
earlier HTML because it is painted later.

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

### Debugging Z-index Step-by-Step

When `z-index` "does not work," debug in this order:

1. Is the element positioned, or is it a flex/grid item where `z-index` applies?
2. Is an ancestor creating a stacking context with `transform`, `opacity`,
   `filter`, `position + z-index`, or `isolation`?
3. Are you comparing two elements inside the same stacking context?
4. Does a parent have a lower stacking level than the competing element?
5. Would moving the overlay to a higher DOM layer, such as a modal root, solve it?

```
Element needs to appear on top
 │
 ▼
Does z-index apply to it?
 │
 ├── NO ──► position it or make it a flex/grid item
 │
 └── YES
      │
      ▼
Is it trapped in a lower stacking context?
 │
 ├── YES ──► remove context trigger or move element outside
 │
 └── NO  ──► use project z-index scale
```

---

## Float & Clear

> **Note:** Floats are legacy for layouts. Use Flexbox/Grid instead. Still relevant for text wrapping around images.

Floats were created for magazine-style wrapping, not full page layout. The
original goal was simple: place an image to the left or right and let inline text
wrap around it.

```
┌───────┐ Text flows beside the floated image,
│ Image │ then continues under it when the image
└───────┘ no longer occupies horizontal space.
```

Before Flexbox and Grid, developers used floats to fake columns. That worked, but
it created parent-collapse, clearfix hacks, and fragile source-order problems.

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

#### Method 3: Display Flow-Root (Modern)
```css
.parent {
  display: flow-root;  /* Creates BFC, contains floats */
}
```

#### Method 4: Overflow (Works but has side effects)
```css
.parent {
  overflow: hidden;  /* or auto */
  /* May clip content that overflows */
}
```

### When Floats Still Make Sense

| Use Case | Float Still Useful? | Better Alternative |
|----------|---------------------|--------------------|
| Text wrapping around an image | Yes | Float is designed for this |
| Page columns | No | Grid |
| Navbar | No | Flexbox |
| Card grid | No | Grid |
| Sidebar layout | No | Grid or Flexbox |

### Float Concept to Remember

Floats affect inline content around them, but they are taken out of normal block
flow. That is why the parent may collapse even though text appears to wrap
correctly.

---

## Flexbox

Flexbox is a **one-dimensional** layout system (row OR column).

Flexbox solves the problem of distributing space among items along one axis.
Think of a flex container like a row of people on a bench:

```
Bench width = available space
People = flex items
Rules = grow, shrink, wrap, align
```

If the bench has extra room, items may grow. If the bench is too small, items may
shrink or wrap. Flexbox is excellent when content size matters and the layout
should adapt around it.

### The Axis Mental Model

Flexbox always has two axes:

```
flex-direction: row
main axis  ─────────────────►
cross axis │
           ▼

flex-direction: column
main axis  │
           ▼
cross axis ─────────────────►
```

`justify-content` works on the main axis. `align-items` works on the cross axis.
If you change `flex-direction`, the meaning of "main" and "cross" changes too.

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

`flex-grow` answers: "If there is extra space, how much of it should this item
receive?"

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

`flex-shrink` answers: "If there is not enough space, how much should this item
give up compared to the others?"

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

`flex-basis` answers: "What size should the item start from before grow and
shrink are calculated?"

```css
.item {
  flex-basis: auto;   /* Default: use width/height */
  flex-basis: 200px;  /* Start at 200px before grow/shrink */
  flex-basis: 25%;    /* Start at 25% of container */
  flex-basis: 0;      /* Start from 0, distribute all space via grow */
}
```

#### flex Shorthand

The `flex` shorthand is easier when read as a sentence:

```css
.item {
  flex: 1 1 300px;
}
```

Meaning:

```
Start at 300px.
If extra space exists, grow.
If space is tight, shrink.
```

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
/* Does not change tab order or screen reader order */
```

### Flexbox Free-Space Algorithm in Plain English

```
Container has a width
 │
 ▼
Browser adds up flex-basis sizes
 │
 ▼
Is there extra space?
 │
 ├── YES ──► distribute using flex-grow
 │
 └── NO
      │
      ▼
     Is there overflow?
      │
      ├── YES ──► remove space using flex-shrink
      └── NO  ──► keep basis sizes
```

This is why `flex: 1` and `flex: auto` behave differently:

| Value | Expands From | Common Use |
|-------|--------------|------------|
| `flex: 1` | `0` basis | Equal-width columns |
| `flex: auto` | content or width basis | Items keep natural size then share extra |
| `flex: none` | content or width basis | Fixed-size item |

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

Grid solves a different problem from Flexbox. Flexbox asks, "How should these
items share space along one axis?" Grid asks, "What structure of rows and columns
should exist, and where should items go inside that structure?"

Think of Grid like a city map:

```
Rows = streets running horizontally
Columns = streets running vertically
Grid lines = street boundaries
Grid cells = blocks of land
Grid items = buildings placed on those blocks
```

Grid is layout-first. You can define the structure before knowing every item's
final content size.

### Grid Container Setup

```css
.grid-container {
  display: grid;
}
```

### Defining Grid Structure

#### grid-template-columns & grid-template-rows

Tracks are the rows and columns of a grid. `grid-template-columns` defines column
tracks; `grid-template-rows` defines row tracks.

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

`fr` means a fraction of the available leftover space after fixed tracks, gaps,
and intrinsic sizes are accounted for.

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

Both `auto-fit` and `auto-fill` create as many tracks as can fit. The difference
appears when there are fewer items than available tracks.

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

**Use `auto-fit` for most responsive grids.**

Use `auto-fill` when you want the empty tracks to remain as part of the layout
structure, such as a calendar-like grid or a placeholder layout.

### Grid Template Areas

Template areas make page layout readable because they let the CSS look like the
final page structure.

```
"header header header"
"sidebar main   aside"
"footer footer footer"
```

That is not just syntax; it is a visual map.

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

Grid placement is based on grid lines. A 3-column grid has 4 vertical grid lines:

```
line 1   line 2   line 3   line 4
  │        │        │        │
  ▼        ▼        ▼        ▼
┌────────┬────────┬────────┐
│ col 1  │ col 2  │ col 3  │
└────────┴────────┴────────┘
```

So `grid-column: 1 / 3` means "start at line 1 and end at line 3," which covers
columns 1 and 2.

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

Grid has two alignment levels:

| Level | Properties | Meaning |
|-------|------------|---------|
| Item inside its cell | `justify-items`, `align-items`, `place-items` | Align content within each grid area |
| Entire grid inside container | `justify-content`, `align-content`, `place-content` | Align the whole grid when it is smaller than the container |

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

Grid shines when there is a real structure: page shells, galleries, dashboard
cards, magazine layouts, and forms with label/input alignment.

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

This is one of the most important CSS layout decisions.

The simple rule:

```
Flexbox: content first, one axis.
Grid: layout first, two axes.
```

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

### Flexbox vs Grid Decision Flow

```
Need layout?
 │
 ▼
Are you arranging along one main direction?
 │
 ├── YES
 │    │
 │    ▼
 │   Should item sizes depend mostly on content?
 │    │
 │    ├── YES ──► Flexbox
 │    └── NO  ──► Grid may still be clearer
 │
 └── NO
      │
      ▼
     Do you need rows and columns at the same time?
      │
      ├── YES ──► Grid
      └── NO  ──► Normal flow may be enough
```

### Practical Examples

| UI Problem | Prefer | Reason |
|------------|--------|--------|
| Navbar with logo, links, button | Flexbox | One horizontal axis with content-sized items |
| Button group | Flexbox | Items align in one row and may wrap |
| Card internals: title, body, footer | Flexbox | Vertical distribution inside one component |
| Product card gallery | Grid | Repeating columns and rows |
| Whole app shell | Grid | Header/sidebar/main/footer structure |
| Dashboard widgets with spans | Grid | Items need two-dimensional placement |
| Center one item | Grid or Flexbox | `place-items: center` or flex centering both work |
| Text document | Normal flow | Blocks and inline content already solve it |

---

## When to Use What - Layout Decision Guide

CSS layout feels difficult when every property looks like an option. Narrow the
problem first.

### Main Layout Decision Tree

```
What are you trying to fix?
 │
 ├── Element should stack or flow with text
 │    └── Use normal flow and display values
 │
 ├── Items need alignment in one row/column
 │    └── Use Flexbox
 │
 ├── Page or component needs rows and columns
 │    └── Use Grid
 │
 ├── Element should overlay another element
 │    └── Use position relative/absolute
 │
 ├── Element should stay visible while scrolling
 │    └── Use sticky or fixed
 │
 ├── Element appears behind the wrong thing
 │    └── Debug stacking context and z-index
 │
 └── Text should wrap around media
      └── Use float
```

### Layout Tool Lookup

| Goal | First Choice | Avoid Reaching For |
|------|--------------|--------------------|
| Basic article layout | Normal flow | Grid for every paragraph |
| Horizontal nav | Flexbox | Floats |
| Equal-width row items | Flexbox with `flex: 1` | Manual widths |
| Responsive card gallery | Grid with `auto-fit` and `minmax()` | Many hard-coded breakpoints |
| Page shell | Grid template areas | Absolute positioning |
| Badge in card corner | Relative parent + absolute child | Negative margins |
| Modal overlay | Fixed backdrop + z-index scale | Random huge `z-index` values |
| Sticky table header | `position: sticky` | JavaScript scroll listeners |
| Text wrapping around an image | Float | Flexbox/Grid |

### Senior-Level Rule of Thumb

Use the layout model that keeps the most elements in normal, understandable flow.
The more you remove elements from flow with absolute/fixed positioning, the more
you must manually protect spacing, overlap, accessibility, and responsiveness.

---

## Common Pitfalls and How to Avoid Them

### Pitfall 1: Using Absolute Positioning for Normal Layout

Bad:

```css
.sidebar {
  position: absolute;
  left: 0;
  width: 250px;
}

.main {
  margin-left: 250px;
}
```

Why it fails: the sidebar is removed from flow, so the main layout must manually
reserve space. This becomes fragile on responsive screens.

Good:

```css
.layout {
  display: grid;
  grid-template-columns: 250px 1fr;
  gap: 2rem;
}
```

### Pitfall 2: Expecting `z-index` to Escape a Stacking Context

Bad:

```css
.card {
  position: relative;
  z-index: 1;
  transform: translateZ(0);
}

.tooltip {
  position: absolute;
  z-index: 999999;
}
```

Why it fails: the tooltip may still be trapped inside the card's stacking
context.

Good:

```css
.app-layer {
  position: relative;
  isolation: isolate;
}

.tooltip-layer {
  position: fixed;
  z-index: var(--z-tooltip);
}
```

### Pitfall 3: Confusing `align-items` and `justify-content`

Bad:

```css
.row {
  display: flex;
  flex-direction: row;
  align-items: center;
  /* expecting horizontal centering */
}
```

Good:

```css
.row {
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
}
```

Why it matters: in a row, `justify-content` controls the horizontal main axis and
`align-items` controls the vertical cross axis.

### Pitfall 4: Using `order` to Change Meaningful Reading Order

Bad:

```css
.primary-action {
  order: 3;
}
```

Why it fails: CSS `order` changes visual order, not DOM order, keyboard order, or
screen-reader reading order.

Good:

```html
<button class="primary-action">Continue</button>
<button class="secondary-action">Cancel</button>
```

```css
.actions {
  display: flex;
  gap: 1rem;
}
```

### Pitfall 5: Forgetting `min-width: 0` in Flex/Grid Children

Bad:

```css
.layout {
  display: flex;
}

.main {
  flex: 1;
}
```

Why it fails: long content inside `.main` may refuse to shrink and cause
overflow.

Good:

```css
.layout {
  display: flex;
}

.main {
  flex: 1;
  min-width: 0;
}
```

### Pitfall 6: Using Floats for Modern Layout

Bad:

```css
.column {
  float: left;
  width: 33.333%;
}
```

Good:

```css
.columns {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}
```

### Pitfall 7: Adding Random Huge Z-index Values

Bad:

```css
.modal {
  z-index: 999999999;
}
```

Good:

```css
:root {
  --z-dropdown: 100;
  --z-sticky: 200;
  --z-modal: 500;
  --z-tooltip: 700;
}

.modal {
  z-index: var(--z-modal);
}
```

Why the good version works: a scale makes layering intentional and easier to
debug.

### Pitfall 8: Using Grid When Normal Flow Is Enough

Bad:

```css
.article p {
  display: grid;
}
```

Good:

```css
.article {
  max-width: 70ch;
  margin-inline: auto;
}
```

Why it matters: simple document content already has a good layout algorithm.
Adding layout systems unnecessarily increases complexity.

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

## Summary Cheatsheet

CSS layout is about choosing the correct layout algorithm for the problem. Start
with normal flow, then reach for Flexbox, Grid, positioning, or stacking tools
only when the problem requires them.

| Concept | Core Question | Best Tool |
|---------|---------------|-----------|
| Normal flow | Can the browser's default block/inline layout solve it? | `block`, `inline`, document flow |
| Display | What kind of box should this element generate? | `display` |
| One-axis alignment | Do items need to share space in a row or column? | Flexbox |
| Two-axis structure | Do rows and columns matter together? | Grid |
| Local overlay | Should a child sit over part of its parent? | `relative` parent + `absolute` child |
| Viewport overlay | Should an element attach to the screen? | `fixed` |
| Scroll-aware element | Should an element stick while its section scrolls? | `sticky` |
| Layering | Which element should paint in front? | stacking context + z-index scale |
| Text wrap around media | Should text flow around a box? | float |

### Default Layout Starters

```css
/* Page wrapper */
.wrapper {
  width: min(100% - 2rem, 1120px);
  margin-inline: auto;
}

/* Flex row for components */
.cluster {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1rem;
}

/* Equal-width flex children */
.equal-row > * {
  flex: 1 1 0;
  min-width: 0;
}

/* Responsive grid */
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}

/* App shell */
.app-shell {
  display: grid;
  grid-template-areas:
    "header header"
    "sidebar main";
  grid-template-columns: 16rem minmax(0, 1fr);
  grid-template-rows: auto 1fr;
  min-height: 100vh;
}

/* Overlay inside a card */
.card {
  position: relative;
}

.card__badge {
  position: absolute;
  inset-block-start: 1rem;
  inset-inline-end: 1rem;
}

/* Layer scale */
:root {
  --z-dropdown: 100;
  --z-sticky: 200;
  --z-modal: 500;
  --z-tooltip: 700;
}
```

### Default Recommendation

Use **normal flow for documents**, **Flexbox for one-axis component alignment**,
**Grid for two-axis layout structure**, and **positioning only when an element
must intentionally leave or visually offset from normal flow**.

---

**Previous:** [01-CSS-Basics.md](./01-CSS-Basics.md)  
**Next:** [03-CSS-Responsive.md](./03-CSS-Responsive.md) - Media Queries & Responsive Design
