# CSS Basics - Interview Preparation Guide

## Table of Contents
1. [What is CSS?](#what-is-css)
2. [How CSS Works](#how-css-works)
3. [CSS Selectors](#css-selectors)
4. [Specificity](#specificity)
5. [The Cascade](#the-cascade)
6. [Inheritance](#inheritance)
7. [Box Model](#box-model)
8. [Margin Collapsing](#margin-collapsing)
9. [Units in CSS](#units-in-css)
10. [Colors in CSS](#colors-in-css)
11. [Interview Questions](#interview-questions)
12. [Exercises](#exercises)

---

## What is CSS?

**CSS (Cascading Style Sheets)** is a stylesheet language used to describe the presentation of HTML documents.

### Breaking Down the Name:

- **Cascading** → Styles "cascade" down from multiple sources, with rules about which styles win
- **Style** → Visual presentation (colors, fonts, spacing, layout)
- **Sheets** → Separate files that can be reused across pages

### Why CSS Matters:

```
Without CSS:                    With CSS:
┌──────────────────────┐       ┌──────────────────────┐
│ Plain text           │       │ ████████████████████ │
│ No colors            │  →    │ Styled Header        │
│ No layout            │       │ ┌────┐ ┌──────────┐  │
│ Default fonts        │       │ │Nav │ │ Content  │  │
│ Ugly!                │       │ └────┘ └──────────┘  │
└──────────────────────┘       └──────────────────────┘
```

### Three Ways to Include CSS

#### 1. Inline CSS (Highest Specificity)
```html
<p style="color: red; font-size: 20px;">This text is red and 20px</p>
```

**When to use:** Quick testing, dynamic styles via JavaScript, email templates
**Problems:** 
- Can't reuse styles
- Mixes content with presentation
- Hard to maintain
- Highest specificity makes it hard to override

#### 2. Internal CSS (In `<head>`)
```html
<!DOCTYPE html>
<html>
<head>
  <style>
    p {
      color: blue;
      font-size: 18px;
    }
    
    .highlight {
      background-color: yellow;
    }
  </style>
</head>
<body>
  <p>This is blue text</p>
  <p class="highlight">This has yellow background</p>
</body>
</html>
```

**When to use:** Single-page applications, critical CSS, email templates
**Problems:** 
- Can't be cached separately
- Must be repeated on every page

#### 3. External CSS (Recommended ✅)
```html
<!-- In your HTML file -->
<head>
  <link rel="stylesheet" href="styles.css">
</head>
```

```css
/* In styles.css */
p {
  color: green;
  font-size: 16px;
}
```

**Benefits:**
- ✅ Separation of concerns (HTML = structure, CSS = presentation)
- ✅ Browser caching (faster page loads)
- ✅ Easy maintenance (change once, affects all pages)
- ✅ Reusability across multiple pages
- ✅ Smaller HTML files

---

## How CSS Works

### CSS Rule Structure

```css
selector {
  property: value;
  property: value;
}

/* Real example */
.button {
  background-color: blue;    /* property: value */
  color: white;              /* property: value */
  padding: 10px 20px;        /* property: value */
  border-radius: 5px;        /* property: value */
}
```

### How the Browser Processes CSS

```
1. Browser loads HTML
         ↓
2. Browser parses HTML → Creates DOM (Document Object Model)
         ↓
3. Browser loads CSS (from <link>, <style>, inline)
         ↓
4. Browser parses CSS → Creates CSSOM (CSS Object Model)
         ↓
5. Browser combines DOM + CSSOM → Render Tree
         ↓
6. Browser calculates layout (where elements go)
         ↓
7. Browser paints pixels to screen
```

### CSS Loading Order Matters!

```html
<head>
  <!-- These load in order -->
  <link rel="stylesheet" href="reset.css">      <!-- 1st: Reset defaults -->
  <link rel="stylesheet" href="base.css">       <!-- 2nd: Base styles -->
  <link rel="stylesheet" href="components.css"> <!-- 3rd: Component styles -->
  <link rel="stylesheet" href="utilities.css">  <!-- 4th: Utility classes -->
</head>
```

If same specificity, **later rules win**:
```css
p { color: red; }
p { color: blue; }  /* ← This wins! */
```

---

## CSS Selectors

Selectors are patterns that match elements in the DOM.

### 1. Basic Selectors

#### Universal Selector (`*`)
```css
/* Selects EVERY element on the page */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
```
**Use case:** CSS resets, applying box-sizing globally

#### Type/Element Selector
```css
/* Selects all elements of that type */
p {
  line-height: 1.6;
}

h1 {
  font-size: 2.5rem;
}

a {
  color: blue;
  text-decoration: none;
}
```
**Use case:** Base typography, default element styles

#### Class Selector (`.`)
```css
/* Selects elements with that class */
.card {
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.btn-primary {
  background: blue;
  color: white;
}
```
```html
<div class="card">Card content</div>
<button class="btn-primary">Click me</button>

<!-- Multiple classes on one element -->
<button class="btn btn-primary btn-large">Large Primary Button</button>
```
**Use case:** Most common selector, reusable component styles

#### ID Selector (`#`)
```css
/* Selects the ONE element with that ID */
#header {
  position: fixed;
  top: 0;
  width: 100%;
}

#main-content {
  margin-top: 60px;
}
```
```html
<header id="header">Site Header</header>
<main id="main-content">Page content</main>
```
**Use case:** Unique page sections, JavaScript hooks (but prefer classes for styling!)

### 2. Combinator Selectors

These combine selectors based on element relationships.

#### Descendant Selector (space)
```css
/* Selects ALL p elements INSIDE div, at ANY depth */
div p {
  color: red;
}
```
```html
<div>
  <p>This is RED ✅</p>
  <section>
    <p>This is also RED ✅ (nested deeper)</p>
  </section>
</div>
<p>This is NOT red ❌ (not inside div)</p>
```

#### Child Selector (`>`)
```css
/* Selects only DIRECT children */
div > p {
  color: blue;
}
```
```html
<div>
  <p>This is BLUE ✅ (direct child)</p>
  <section>
    <p>This is NOT blue ❌ (not direct child of div)</p>
  </section>
</div>
```

#### Adjacent Sibling Selector (`+`)
```css
/* Selects element IMMEDIATELY after */
h1 + p {
  font-size: 1.25rem;  /* First paragraph after h1 is larger */
  margin-top: 0;
}
```
```html
<h1>Title</h1>
<p>This paragraph is styled ✅ (immediately after h1)</p>
<p>This is NOT styled ❌ (not immediately after h1)</p>
```
**Use case:** Styling first paragraph after heading, label + input pairs

#### General Sibling Selector (`~`)
```css
/* Selects ALL siblings after */
h1 ~ p {
  color: gray;
}
```
```html
<h1>Title</h1>
<p>This is gray ✅</p>
<div>Not a p, doesn't matter</div>
<p>This is also gray ✅ (still a sibling after h1)</p>
```

### Visual Comparison of Combinators

```html
<div class="parent">
  <p>P1 - Direct child</p>
  <section>
    <p>P2 - Nested (grandchild)</p>
  </section>
  <p>P3 - Direct child</p>
</div>
```

| Selector | P1 | P2 | P3 |
|----------|----|----|-----|
| `div p` (descendant) | ✅ | ✅ | ✅ |
| `div > p` (child) | ✅ | ❌ | ✅ |
| `p + p` (adjacent) | ❌ | ❌ | ❌ |
| `section + p` (adjacent) | ❌ | ❌ | ✅ |

### 3. Attribute Selectors

Select elements based on their attributes.

```css
/* Has the attribute (any value) */
[disabled] {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Exact attribute value */
[type="text"] {
  border: 1px solid #ccc;
}

[type="email"] {
  border: 1px solid blue;
}

/* Attribute starts with value (^=) */
[href^="https://"] {
  color: green;  /* External secure links */
}

[href^="#"] {
  color: purple;  /* Anchor links */
}

/* Attribute ends with value ($=) */
[href$=".pdf"] {
  color: red;  /* PDF links */
}

[src$=".png"], [src$=".jpg"], [src$=".gif"] {
  border: 2px solid gray;  /* Images */
}

/* Attribute contains value (*=) */
[class*="btn"] {
  cursor: pointer;  /* Any class containing "btn" */
}

/* Attribute contains word in space-separated list (~=) */
[class~="featured"] {
  border: 2px solid gold;
}

/* Attribute starts with value or value- (|=) */
[lang|="en"] {
  font-family: Arial;  /* Matches "en", "en-US", "en-GB" */
}
```

### Real-World Attribute Selector Examples

```css
/* Style external links differently */
a[target="_blank"]::after {
  content: " ↗";
  font-size: 0.8em;
}

/* Style required form fields */
input[required] {
  border-left: 3px solid red;
}

/* Style specific input types */
input[type="checkbox"],
input[type="radio"] {
  width: 20px;
  height: 20px;
}

/* Style download links */
a[download] {
  background: #f0f0f0;
  padding: 5px 10px;
  border-radius: 4px;
}
```

### 4. Pseudo-classes (`:`)

Pseudo-classes select elements based on **state** or **position**.

#### User Action States
```css
/* When mouse hovers over element */
a:hover {
  color: red;
  text-decoration: underline;
}

/* When element is clicked/activated */
button:active {
  transform: scale(0.98);
  background: darkblue;
}

/* When element has keyboard focus */
input:focus {
  outline: 2px solid blue;
  border-color: blue;
}

/* After link has been visited */
a:visited {
  color: purple;
}
```

#### Structural Pseudo-classes

```css
/* First child of its parent */
li:first-child {
  font-weight: bold;
}

/* Last child of its parent */
li:last-child {
  border-bottom: none;
}

/* Specific position */
li:nth-child(2) {
  background: yellow;  /* Second item */
}

/* Patterns */
tr:nth-child(odd) {
  background: #f9f9f9;  /* 1st, 3rd, 5th... */
}

tr:nth-child(even) {
  background: #fff;  /* 2nd, 4th, 6th... */
}

/* Every 3rd element */
li:nth-child(3n) {
  color: red;  /* 3, 6, 9, 12... */
}

/* Every 3rd element, starting from 1st */
li:nth-child(3n+1) {
  color: blue;  /* 1, 4, 7, 10... */
}
```

#### Understanding nth-child Formula: `an+b`

```
a = step/interval
n = counter (0, 1, 2, 3...)
b = offset/starting point

Examples:
- 2n     → 0, 2, 4, 6, 8...    (even)
- 2n+1   → 1, 3, 5, 7, 9...    (odd)
- 3n     → 0, 3, 6, 9, 12...   (every 3rd)
- 3n+1   → 1, 4, 7, 10...      (every 3rd, starting at 1)
- -n+3   → 3, 2, 1             (first 3 elements)
- n+4    → 4, 5, 6, 7...       (from 4th onwards)
```

#### Form State Pseudo-classes

```css
/* Checked checkboxes/radios */
input:checked {
  accent-color: green;
}

/* Checked + label pattern */
input:checked + label {
  font-weight: bold;
  color: green;
}

/* Disabled elements */
input:disabled,
button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Enabled elements */
input:enabled {
  background: white;
}

/* Required fields */
input:required {
  border-left: 3px solid red;
}

/* Optional fields */
input:optional {
  border-left: 3px solid gray;
}

/* Valid input */
input:valid {
  border-color: green;
}

/* Invalid input */
input:invalid {
  border-color: red;
}

/* Input in range */
input[type="number"]:in-range {
  background: lightgreen;
}

/* Input out of range */
input[type="number"]:out-of-range {
  background: lightcoral;
}

/* Read-only inputs */
input:read-only {
  background: #f5f5f5;
}

/* Placeholder shown */
input:placeholder-shown {
  border-style: dashed;
}
```

#### Negation Pseudo-class

```css
/* Select all p except those with .intro class */
p:not(.intro) {
  font-size: 14px;
}

/* Select all inputs except submit buttons */
input:not([type="submit"]) {
  border: 1px solid #ccc;
}

/* Multiple negations */
button:not(.primary):not(.secondary) {
  background: gray;
}

/* Combine with other selectors */
li:not(:last-child) {
  border-bottom: 1px solid #eee;  /* All items except last get border */
}
```

#### Other Useful Pseudo-classes

```css
/* Empty elements */
p:empty {
  display: none;  /* Hide empty paragraphs */
}

/* Only child */
p:only-child {
  margin: 0;  /* If p is the only child of its parent */
}

/* First/Last of type */
p:first-of-type {
  font-size: 1.2em;  /* First p in parent (ignores other elements) */
}

/* Root element (html) */
:root {
  --primary-color: blue;  /* CSS variables defined here */
}

/* Target (URL hash match) */
section:target {
  background: yellow;  /* When URL is page.html#section-id */
}
```

### 5. Pseudo-elements (`::`)

Pseudo-elements create **virtual elements** that don't exist in the HTML.

#### `::before` and `::after`

```css
/* Insert content BEFORE element's content */
.required-field::before {
  content: "* ";
  color: red;
}

/* Insert content AFTER element's content */
.external-link::after {
  content: " ↗";
  font-size: 0.8em;
}
```

**Important:** `content` property is REQUIRED for `::before` and `::after`!

```css
/* Even if empty, you need content */
.decorative-box::before {
  content: "";  /* Empty string is valid */
  display: block;
  width: 50px;
  height: 2px;
  background: blue;
}
```

#### Common `::before`/`::after` Use Cases

```css
/* 1. Clearfix (legacy but still used) */
.clearfix::after {
  content: "";
  display: table;
  clear: both;
}

/* 2. Decorative elements */
.fancy-title::before,
.fancy-title::after {
  content: "✦";
  margin: 0 10px;
  color: gold;
}

/* 3. Tooltips */
.tooltip {
  position: relative;
}

.tooltip::after {
  content: attr(data-tooltip);  /* Gets value from data-tooltip attribute! */
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  padding: 5px 10px;
  background: black;
  color: white;
  border-radius: 4px;
  opacity: 0;
  transition: opacity 0.3s;
}

.tooltip:hover::after {
  opacity: 1;
}

/* 4. Custom bullet points */
.custom-list li::before {
  content: "→";
  margin-right: 10px;
  color: blue;
}

/* 5. Quote marks */
blockquote::before {
  content: """;
  font-size: 3em;
  color: #ccc;
}

blockquote::after {
  content: """;
  font-size: 3em;
  color: #ccc;
}

/* 6. Overlay on images */
.image-container {
  position: relative;
}

.image-container::after {
  content: "";
  position: absolute;
  inset: 0;  /* Same as top:0; right:0; bottom:0; left:0; */
  background: linear-gradient(transparent, rgba(0,0,0,0.7));
  pointer-events: none;  /* Allow clicks through */
}
```

#### Other Pseudo-elements

```css
/* First letter (drop cap effect) */
p::first-letter {
  font-size: 3em;
  float: left;
  line-height: 1;
  margin-right: 10px;
  font-weight: bold;
  color: #333;
}

/* First line */
p::first-line {
  font-weight: bold;
  font-variant: small-caps;
}

/* Text selection styling */
::selection {
  background: #007bff;
  color: white;
}

/* Placeholder text */
input::placeholder {
  color: #999;
  font-style: italic;
}

/* Scrollbar styling (WebKit browsers) */
::-webkit-scrollbar {
  width: 10px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
}

::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 5px;
}

::-webkit-scrollbar-thumb:hover {
  background: #555;
}
```

### Key Difference: `:` vs `::`

| Pseudo-class (`:`) | Pseudo-element (`::`) |
|--------------------|-----------------------|
| Selects based on **state** | Creates **new element** |
| `:hover`, `:focus`, `:first-child` | `::before`, `::after`, `::first-letter` |
| Element must exist | Creates virtual element |
| No `content` property needed | Requires `content` for before/after |

**Note:** CSS2 used single colon for both. CSS3 introduced double colon for pseudo-elements to distinguish them. Browsers still support single colon for backwards compatibility.

---

## Specificity

Specificity determines which CSS rule wins when multiple rules target the same element.

### The Specificity Hierarchy

Think of it as a 4-digit number: **A, B, C, D**

```
A = Inline styles (style="...")           → 1,0,0,0 (1000)
B = Number of ID selectors (#)            → 0,1,0,0 (100)
C = Number of classes, attributes, pseudo-classes → 0,0,1,0 (10)
D = Number of element types, pseudo-elements → 0,0,0,1 (1)
```

### Calculating Specificity - Examples

```css
/* Example 1: Simple selectors */
p { }                     /* 0,0,0,1 → 1 */
.intro { }                /* 0,0,1,0 → 10 */
#header { }               /* 0,1,0,0 → 100 */

/* Example 2: Combined selectors */
p.intro { }               /* 0,0,1,1 → 11 (one element + one class) */
div p.intro { }           /* 0,0,1,2 → 12 (two elements + one class) */
#header .nav li { }       /* 0,1,1,1 → 111 (one ID + one class + one element) */

/* Example 3: Complex selectors */
#header nav ul li a.active { }
/* 0,1,1,4 → 114 */
/* Breakdown: #header (100) + .active (10) + nav,ul,li,a (4) */

/* Example 4: Attribute selectors count as classes */
input[type="text"] { }    /* 0,0,1,1 → 11 */
a[href^="https"] { }      /* 0,0,1,1 → 11 */

/* Example 5: Pseudo-classes count as classes */
a:hover { }               /* 0,0,1,1 → 11 */
li:first-child { }        /* 0,0,1,1 → 11 */
input:focus:valid { }     /* 0,0,2,1 → 21 */

/* Example 6: Pseudo-elements count as elements */
p::first-letter { }       /* 0,0,0,2 → 2 */
p::before { }             /* 0,0,0,2 → 2 */
```

### Specificity Battle - Who Wins?

```html
<div id="content" class="main">
  <p class="intro highlight">What color am I?</p>
</div>
```

```css
p { color: black; }                          /* 0,0,0,1 = 1 */
.intro { color: blue; }                      /* 0,0,1,0 = 10 */
p.intro { color: green; }                    /* 0,0,1,1 = 11 */
.main .intro { color: purple; }              /* 0,0,2,0 = 20 */
#content p { color: orange; }                /* 0,1,0,1 = 101 */
#content .intro { color: red; }              /* 0,1,1,0 = 110 ← WINNER! */

/* The paragraph will be RED */
```

### The `!important` Rule

```css
p {
  color: red !important;  /* Beats everything except inline !important */
}

/* Specificity order with !important: */
/* 1. Inline style with !important */
/* 2. !important in stylesheet */
/* 3. Inline style without !important */
/* 4. Normal specificity rules */
```

**⚠️ Why to Avoid `!important`:**
1. Breaks the natural cascade
2. Makes debugging extremely difficult
3. Creates "specificity wars" (!important vs !important)
4. Can only be overridden by another !important with higher specificity

**When `!important` is Acceptable:**
- Utility classes that MUST always apply: `.hidden { display: none !important; }`
- Overriding third-party library styles you can't modify
- User accessibility styles

### Tips to Avoid Specificity Issues

```css
/* ❌ BAD: High specificity, hard to override */
#header #nav ul li a.active { color: blue; }

/* ✅ GOOD: Low specificity, easy to override */
.nav-link { color: gray; }
.nav-link.is-active { color: blue; }

/* ❌ BAD: Using IDs for styling */
#submit-button { background: green; }

/* ✅ GOOD: Using classes */
.btn-submit { background: green; }

/* ❌ BAD: Overly specific */
div.container > ul.menu > li.menu-item > a.menu-link { }

/* ✅ GOOD: Simple and flat */
.menu-link { }
```

---

## The Cascade

The "C" in CSS! When multiple rules match, the cascade determines the winner.

### Cascade Order (Highest to Lowest Priority)

1. **Importance** (`!important` declarations)
2. **Origin** (where the CSS comes from)
3. **Specificity** (selector weight)
4. **Source Order** (position in code)

### Origin Order (Author vs User vs Browser)

```
1. User styles with !important     (Highest)
2. Author styles with !important
3. Author styles (your CSS)
4. User styles
5. Browser default styles          (Lowest)
```

### Cascade Example

```css
/* File: normalize.css (loaded first) */
p { margin: 1em 0; }              /* Source order: 1st */

/* File: styles.css (loaded second) */
p { margin: 0; }                  /* Source order: 2nd ← WINS (same specificity) */

/* Later in styles.css */
.intro { margin: 2em 0; }         /* Higher specificity for .intro elements */
```

---

## Inheritance

Some CSS properties automatically pass from parent to child elements.

### Inherited Properties (Typography-related)

```css
body {
  /* These WILL be inherited by children */
  font-family: Arial, sans-serif;
  font-size: 16px;
  line-height: 1.6;
  color: #333;
  text-align: left;
  letter-spacing: 0.5px;
}

/* All text inside body inherits these styles! */
```

### Non-Inherited Properties (Box model, layout)

```css
.parent {
  /* These will NOT be inherited */
  border: 1px solid black;
  padding: 20px;
  margin: 10px;
  background-color: yellow;
  width: 500px;
}

/* Children won't have borders, padding, or yellow background */
```

### Controlling Inheritance

```css
.child {
  /* Use parent's value */
  color: inherit;
  
  /* Use browser default */
  color: initial;
  
  /* Use inherited value if available, otherwise initial */
  color: unset;
  
  /* Revert to user agent stylesheet */
  color: revert;
}

/* Reset ALL properties */
.reset-all {
  all: initial;  /* Reset everything to initial values */
  all: inherit;  /* Inherit everything from parent */
  all: unset;    /* Natural value (inherit if inheritable, initial if not) */
}
```

### Forcing Inheritance

```css
/* Make non-inherited properties inherit */
.parent {
  border: 2px solid blue;
}

.child {
  border: inherit;  /* Now child has same border as parent */
}
```

---

## Box Model

Every HTML element is a rectangular box with four layers.

### Visual Representation

```
┌─────────────────────────────────────────────────────┐
│                     MARGIN                          │  ← Space OUTSIDE the box
│   ┌─────────────────────────────────────────────┐   │
│   │               BORDER                        │   │  ← The box edge
│   │   ┌─────────────────────────────────────┐   │   │
│   │   │           PADDING                   │   │   │  ← Space INSIDE the box
│   │   │   ┌─────────────────────────────┐   │   │   │
│   │   │   │         CONTENT             │   │   │   │  ← Your text/images
│   │   │   │                             │   │   │   │
│   │   │   │    width × height           │   │   │   │
│   │   │   │                             │   │   │   │
│   │   │   └─────────────────────────────┘   │   │   │
│   │   │                                     │   │   │
│   │   └─────────────────────────────────────┘   │   │
│   │                                             │   │
│   └─────────────────────────────────────────────┘   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### `box-sizing` Property (CRUCIAL!)

#### `content-box` (Default - Usually NOT what you want)

```css
.box {
  box-sizing: content-box;  /* DEFAULT */
  width: 200px;
  padding: 20px;
  border: 5px solid black;
}

/* Calculation:
   Content width:  200px (what you set)
   + Padding:      40px (20px × 2 sides)
   + Border:       10px (5px × 2 sides)
   = TOTAL WIDTH:  250px (not 200px!)
*/
```

```
┌─────────────────────────────────────────┐
│ Total: 250px                            │
│ ┌─────────────────────────────────────┐ │
│ │ Padding: 20px                       │ │
│ │ ┌─────────────────────────────────┐ │ │
│ │ │ Content: 200px                  │ │ │
│ │ └─────────────────────────────────┘ │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

#### `border-box` (RECOMMENDED ✅)

```css
.box {
  box-sizing: border-box;
  width: 200px;
  padding: 20px;
  border: 5px solid black;
}

/* Calculation:
   TOTAL WIDTH:   200px (what you set)
   - Border:      10px
   - Padding:     40px
   = Content:     150px (automatically calculated)
*/
```

```
┌───────────────────────────────┐
│ Total: 200px (as specified!)  │
│ ┌───────────────────────────┐ │
│ │ Content: 150px            │ │
│ │ (shrinks to fit)          │ │
│ └───────────────────────────┘ │
└───────────────────────────────┘
```

#### Universal Box-Sizing Reset (ALWAYS USE THIS!)

```css
/* Apply border-box to EVERYTHING */
*,
*::before,
*::after {
  box-sizing: border-box;
}

/* Why include ::before and ::after? */
/* Pseudo-elements have their own box model! */
```

### Margin Properties

```css
.element {
  /* Individual sides */
  margin-top: 10px;
  margin-right: 20px;
  margin-bottom: 10px;
  margin-left: 20px;
  
  /* Shorthand: top right bottom left (clockwise from top) */
  margin: 10px 20px 10px 20px;
  
  /* Shorthand: top/bottom left/right */
  margin: 10px 20px;
  
  /* Shorthand: all sides same */
  margin: 10px;
  
  /* Shorthand: top left/right bottom */
  margin: 10px 20px 30px;
}
```

#### Centering with Margin

```css
/* Horizontally center a block element */
.centered {
  width: 600px;  /* Must have a width! */
  margin-left: auto;
  margin-right: auto;
  /* or */
  margin: 0 auto;  /* 0 top/bottom, auto left/right */
}
```

**Why `auto` works:** `auto` tells the browser to calculate equal space on both sides.

#### Negative Margins

```css
/* Margins CAN be negative! */
.overlap {
  margin-top: -20px;  /* Pull element UP, overlapping previous element */
}

.break-container {
  margin-left: -50px;
  margin-right: -50px;
  /* Element extends beyond its parent */
}
```

### Padding Properties

```css
.element {
  /* Same syntax as margin */
  padding: 10px 20px 10px 20px;
  
  /* NOTE: Padding CANNOT be negative! */
  /* padding: -10px;  ❌ INVALID */
  
  /* NOTE: Padding adds to background area */
}
```

### Border Properties

```css
.element {
  /* Individual properties */
  border-width: 2px;
  border-style: solid;  /* required for border to show! */
  border-color: black;
  
  /* Shorthand */
  border: 2px solid black;
  
  /* Individual sides */
  border-top: 1px solid red;
  border-right: 2px dashed blue;
  border-bottom: 3px dotted green;
  border-left: 4px double purple;
  
  /* Just one property for one side */
  border-bottom-color: orange;
  border-left-width: 5px;
}
```

#### Border Styles

```css
.solid { border-style: solid; }     /* ─────── */
.dashed { border-style: dashed; }   /* - - - - */
.dotted { border-style: dotted; }   /* ······· */
.double { border-style: double; }   /* ═══════ */
.groove { border-style: groove; }   /* 3D groove */
.ridge { border-style: ridge; }     /* 3D ridge */
.inset { border-style: inset; }     /* 3D inset */
.outset { border-style: outset; }   /* 3D outset */
.none { border-style: none; }       /* No border */
.hidden { border-style: hidden; }   /* Same as none */
```

#### Border Radius

```css
.element {
  /* All corners same */
  border-radius: 10px;
  
  /* Horizontal / Vertical (elliptical) */
  border-radius: 20px / 10px;
  
  /* Each corner: top-left top-right bottom-right bottom-left */
  border-radius: 10px 20px 30px 40px;
  
  /* Circle (requires equal width and height) */
  border-radius: 50%;
  
  /* Pill shape */
  border-radius: 999px;  /* Very large value */
  
  /* Individual corners */
  border-top-left-radius: 10px;
  border-top-right-radius: 20px;
  border-bottom-right-radius: 30px;
  border-bottom-left-radius: 40px;
}
```

---

## Margin Collapsing

When vertical margins meet, they **collapse** into a single margin.

### When Margins Collapse

#### 1. Adjacent Siblings

```css
.box1 { margin-bottom: 30px; }
.box2 { margin-top: 20px; }

/* Expected gap: 50px (30 + 20) */
/* Actual gap: 30px (larger margin wins!) */
```

```
Expected:                 Actual:
┌─────────────┐           ┌─────────────┐
│    Box 1    │           │    Box 1    │
└─────────────┘           └─────────────┘
      ↕ 30px                    ↕ 30px (collapsed!)
      ↕ 20px              ┌─────────────┐
┌─────────────┐           │    Box 2    │
│    Box 2    │           └─────────────┘
└─────────────┘
```

#### 2. Parent and First/Last Child

```css
.parent {
  margin-top: 0;
  background: yellow;
}

.child {
  margin-top: 50px;  /* This collapses OUT of parent! */
}
```

```
Expected:                          Actual:
┌─────────────────────────┐        
│ Parent (yellow)         │        ↕ 50px (margin escapes!)
│   ↕ 50px                │        ┌─────────────────────────┐
│   ┌─────────────────┐   │        │ Parent (yellow)         │
│   │ Child           │   │   →    │ ┌─────────────────┐     │
│   └─────────────────┘   │        │ │ Child           │     │
└─────────────────────────┘        │ └─────────────────┘     │
                                   └─────────────────────────┘
```

#### 3. Empty Blocks

```css
.empty {
  margin-top: 20px;
  margin-bottom: 30px;
  /* No content, padding, or border */
}

/* Both margins collapse into 30px */
```

### When Margins DON'T Collapse

- **Horizontal margins** (left/right) never collapse
- **Flexbox children** - margins don't collapse
- **Grid children** - margins don't collapse
- **Elements with padding/border** between margins
- **Floated elements**
- **Absolutely/Fixed positioned elements**
- **Elements with `overflow` other than `visible`**

### How to Prevent Margin Collapsing

#### Method 1: Add Padding or Border to Parent

```css
.parent {
  padding-top: 1px;  /* Creates barrier */
  /* or */
  border-top: 1px solid transparent;
}
```

**Why it works:** Padding/border creates a physical barrier between parent and child margins.

#### Method 2: `overflow: hidden` (or `auto`)

```css
.parent {
  overflow: hidden;
}
```

**Why it works:** Creates a new **Block Formatting Context (BFC)**, which contains margins.

#### Method 3: `display: flow-root` (Best modern solution!)

```css
.parent {
  display: flow-root;
}
```

**Why it works:** Creates a BFC without side effects!

#### Method 4: `display: flex` or `display: grid`

```css
.parent {
  display: flex;
  flex-direction: column;
}

/* Now child margins don't collapse */
```

**Why it works:** Flex/Grid items have different margin behavior - they don't collapse.

### Visual Summary

```
┌─────────────────────────────────────────────────────────┐
│                   MARGIN COLLAPSING                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│   COLLAPSES:                  DOESN'T COLLAPSE:         │
│   ─────────                   ──────────────────        │
│   • Vertical margins          • Horizontal margins      │
│   • Adjacent siblings         • Flex/Grid children      │
│   • Parent/child (no gap)     • Floated elements        │
│   • Empty blocks              • Absolute/Fixed elements │
│                               • overflow: hidden/auto   │
│                               • Padding/border present  │
│                                                         │
│   PREVENTION:                                           │
│   ───────────                                           │
│   1. padding/border on parent                           │
│   2. overflow: hidden                                   │
│   3. display: flow-root  ← BEST!                        │
│   4. display: flex/grid                                 │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Units in CSS

### Absolute Units (Fixed Size)

```css
.element {
  /* Pixels - most common, doesn't scale */
  width: 200px;
  font-size: 16px;
  
  /* Points - print media */
  font-size: 12pt;  /* 1pt = 1/72 inch */
  
  /* Physical units - rarely used on screen */
  width: 10cm;
  height: 50mm;
  width: 1in;  /* 1 inch = 96px */
}
```

### Relative Units (Scale with something)

#### `em` - Relative to Parent's Font Size

```css
.parent {
  font-size: 16px;
}

.child {
  font-size: 1.5em;   /* 16px × 1.5 = 24px */
  padding: 1em;       /* 24px (uses CHILD's computed font-size!) */
  margin: 2em;        /* 48px */
}

.grandchild {
  font-size: 1.5em;   /* 24px × 1.5 = 36px (compounds!) */
}
```

**⚠️ Problem with `em`:** Compounding effect in nested elements!

```css
/* If all li use 1.2em */
ul { font-size: 16px; }
li { font-size: 1.2em; }

/*
Level 1 li: 16px × 1.2 = 19.2px
Level 2 li: 19.2px × 1.2 = 23px
Level 3 li: 23px × 1.2 = 27.6px
...keeps growing!
*/
```

#### `rem` - Relative to Root Font Size (RECOMMENDED ✅)

```css
html {
  font-size: 16px;  /* Browser default, users can change this */
}

.element {
  font-size: 1.5rem;  /* Always 24px, regardless of parent */
  padding: 1rem;      /* Always 16px */
  margin: 2rem;       /* Always 32px */
}

.nested .deeply .element {
  font-size: 1.5rem;  /* Still 24px! No compounding */
}
```

**Why `rem` is better:**
- Predictable - always based on one value
- Respects user's browser font-size preference
- No compounding issues
- Easy to calculate

#### `%` - Percentage of Parent

```css
.parent {
  width: 1000px;
  font-size: 20px;
}

.child {
  width: 50%;        /* 500px (50% of parent WIDTH) */
  font-size: 80%;    /* 16px (80% of parent FONT-SIZE) */
  padding: 10%;      /* 100px (10% of parent WIDTH, even for vertical!) */
}
```

**Note:** Percentage padding/margin is ALWAYS relative to parent's WIDTH (even for top/bottom)!

#### Viewport Units

```css
.element {
  /* vw - 1% of viewport WIDTH */
  width: 100vw;     /* Full viewport width */
  width: 50vw;      /* Half viewport width */
  
  /* vh - 1% of viewport HEIGHT */
  height: 100vh;    /* Full viewport height */
  min-height: 50vh; /* At least half viewport height */
  
  /* vmin - 1% of SMALLER dimension */
  width: 50vmin;    /* On 1920×1080: 50% of 1080 = 540px */
  
  /* vmax - 1% of LARGER dimension */
  width: 50vmax;    /* On 1920×1080: 50% of 1920 = 960px */
}

/* Use case: Responsive font sizes */
h1 {
  font-size: 5vw;   /* Scales with viewport width */
}
```

**⚠️ Mobile 100vh Problem:**
```css
/* On mobile, 100vh includes space behind browser UI */
.hero {
  height: 100vh;  /* May cause content to hide behind address bar */
}

/* Solution: New viewport units (modern browsers) */
.hero {
  height: 100dvh;  /* Dynamic - adjusts with browser UI */
  height: 100svh;  /* Small viewport (UI visible) */
  height: 100lvh;  /* Large viewport (UI hidden) */
}
```

#### `ch` - Character Width

```css
/* 1ch = width of the "0" character in current font */
input {
  width: 20ch;  /* Approximately 20 characters wide */
}

.paragraph {
  max-width: 70ch;  /* Optimal reading length */
}
```

### When to Use Which Unit?

| Property | Recommended | Why |
|----------|-------------|-----|
| `font-size` | `rem` | Consistent, respects user preference |
| `padding`, `margin` | `rem` or `em` | Scales with text |
| `width` | `%`, `vw`, or `px` | Depends on context |
| `max-width` | `ch` or `px` | For readable line lengths |
| `height` | `vh`, `auto`, or `%` | Avoid fixed heights |
| `border`, `box-shadow` | `px` | Borders don't need to scale |
| `line-height` | Unitless number | Inherits properly |

#### Line-height Special Case

```css
/* ❌ With unit - doesn't inherit well */
.parent {
  font-size: 16px;
  line-height: 24px;  /* Fixed 24px */
}
.child {
  font-size: 32px;
  /* Still inherits 24px line-height - text overlaps! */
}

/* ✅ Unitless - inherits as multiplier */
.parent {
  font-size: 16px;
  line-height: 1.5;  /* 16px × 1.5 = 24px */
}
.child {
  font-size: 32px;
  /* Inherits 1.5 multiplier: 32px × 1.5 = 48px ✅ */
}
```

---

## Colors in CSS

### Color Formats

#### Named Colors
```css
.element {
  color: red;
  color: blue;
  color: tomato;
  color: rebeccapurple;
  color: transparent;  /* Fully transparent */
}
/* 147 named colors available */
```

#### Hexadecimal
```css
.element {
  color: #ff0000;      /* Red (6 digits) */
  color: #f00;         /* Red (3-digit shorthand) */
  color: #ff000080;    /* Red with 50% alpha (8 digits) */
  color: #f008;        /* Red with 50% alpha (4-digit shorthand) */
}

/* Hex breakdown: #RRGGBB */
/* #ff0000 = ff red, 00 green, 00 blue = pure red */
/* #00ff00 = pure green */
/* #0000ff = pure blue */
/* #ffffff = white (all max) */
/* #000000 = black (all zero) */
```

#### RGB / RGBA

```css
.element {
  /* Old syntax */
  color: rgb(255, 0, 0);           /* Red */
  color: rgba(255, 0, 0, 0.5);     /* Red, 50% opacity */
  
  /* Modern syntax (CSS Colors Level 4) */
  color: rgb(255 0 0);             /* Spaces instead of commas */
  color: rgb(255 0 0 / 50%);       /* Alpha after slash */
  color: rgb(255 0 0 / 0.5);       /* Alpha as decimal */
}

/* RGB values: 0-255 for each channel */
/* Alpha: 0 (transparent) to 1 (opaque) or 0%-100% */
```

#### HSL / HSLA (Highly Recommended!)

```css
.element {
  color: hsl(0, 100%, 50%);        /* Red */
  color: hsla(0, 100%, 50%, 0.5);  /* Red, 50% opacity */
  
  /* Modern syntax */
  color: hsl(0 100% 50%);
  color: hsl(0 100% 50% / 50%);
}
```

**HSL Breakdown:**

```
H = Hue (0-360) - Color on the color wheel
    0°   = Red
    60°  = Yellow
    120° = Green
    180° = Cyan
    240° = Blue
    300° = Magenta
    360° = Red (full circle)

S = Saturation (0%-100%) - Color intensity
    0%   = Gray (no color)
    100% = Full color

L = Lightness (0%-100%) - Light to dark
    0%   = Black
    50%  = Pure color
    100% = White
```

**Why HSL is Great for Developers:**

```css
/* Easy to create color variations! */
:root {
  --primary: hsl(220, 80%, 50%);
}

.primary { color: hsl(220, 80%, 50%); }
.primary-light { color: hsl(220, 80%, 70%); }  /* Just increase lightness */
.primary-dark { color: hsl(220, 80%, 30%); }   /* Just decrease lightness */
.primary-muted { color: hsl(220, 30%, 50%); }  /* Decrease saturation */
.primary-vivid { color: hsl(220, 100%, 50%); } /* Max saturation */
```

#### Special Color Values

```css
.element {
  /* currentColor - inherits the text color */
  border-color: currentColor;
  box-shadow: 0 0 10px currentColor;
  
  /* transparent */
  background: transparent;
  
  /* inherit, initial, unset */
  color: inherit;  /* Use parent's color */
  color: initial;  /* Use browser default (usually black) */
}
```

### Color Functions (Modern CSS)

```css
.element {
  /* Lighten/darken with calc (limited) */
  background: hsl(220, 80%, calc(50% + 20%));
  
  /* Color-mix (blend two colors) */
  background: color-mix(in srgb, red, blue);  /* Purple */
  background: color-mix(in srgb, red 25%, blue);  /* More blue */
  
  /* Relative color syntax (newest) */
  --primary: hsl(220, 80%, 50%);
  --primary-light: hsl(from var(--primary) h s calc(l + 20%));
}
```

---

## Interview Questions

### Q1: What is the CSS Box Model?
**Answer:** The box model describes how every HTML element is rendered as a rectangular box consisting of:
- **Content** - The actual content (text, images)
- **Padding** - Space inside the element, between content and border
- **Border** - The element's border
- **Margin** - Space outside the element, between this element and others

The `box-sizing` property determines whether `width`/`height` include padding and border (`border-box`) or not (`content-box`).

### Q2: What's the difference between `display: none` and `visibility: hidden`?
**Answer:**
| `display: none` | `visibility: hidden` |
|-----------------|----------------------|
| Element removed from document flow | Element stays in document flow |
| Takes NO space | Takes up its original space |
| Not accessible to screen readers | Still in accessibility tree |
| Children also hidden | Children can be made visible |
| Triggers reflow when changed | Only triggers repaint |

### Q3: Explain the difference between `em` and `rem`.
**Answer:**
- `em` is relative to the **parent element's** font-size. It compounds when nested (child of child).
- `rem` is relative to the **root element's** (html) font-size. It's predictable and doesn't compound.

**Use `rem`** for consistent sizing across your application. **Use `em`** when you want sizing relative to the component's own font-size.

### Q4: What is specificity and how is it calculated?
**Answer:** Specificity determines which CSS rule wins when multiple rules target the same element. It's calculated as a 4-part value:

1. **Inline styles** (style="...") → 1,0,0,0
2. **IDs** (#id) → 0,1,0,0
3. **Classes, attributes, pseudo-classes** → 0,0,1,0
4. **Elements, pseudo-elements** → 0,0,0,1

Higher total wins. If equal, later rule in source order wins.

### Q5: What is margin collapsing?
**Answer:** When two vertical margins touch, they collapse into a single margin equal to the larger of the two. This happens:
- Between adjacent siblings
- Between parent and first/last child (no gap between them)
- In empty elements

**Prevention methods:** Add padding/border, use `display: flow-root`, use flexbox/grid, or `overflow: hidden`.

### Q6: What's the difference between pseudo-classes and pseudo-elements?
**Answer:**
| Pseudo-class (`:`) | Pseudo-element (`::`) |
|--------------------|-----------------------|
| Selects based on **state** | Creates **virtual element** |
| `:hover`, `:focus`, `:first-child` | `::before`, `::after`, `::first-letter` |
| Element already exists | Creates new element in DOM |
| No `content` property | Requires `content` for before/after |

### Q7: Explain the CSS cascade.
**Answer:** The cascade is the algorithm that determines which styles apply when multiple rules match:

1. **Importance**: `!important` declarations win
2. **Origin**: User styles > Author styles > Browser defaults
3. **Specificity**: Higher specificity wins
4. **Source Order**: Later rules win if specificity is equal

### Q8: What is `box-sizing: border-box` and why use it?
**Answer:** `border-box` makes the `width`/`height` properties include padding and border, not just content. This makes layouts more predictable because:
- A `width: 200px` element is always 200px total
- Adding padding doesn't increase the element's size
- Easier percentage-based layouts (50% + 50% = 100%)

### Q9: What does `inherit`, `initial`, and `unset` do?
**Answer:**
- `inherit`: Takes the computed value from the parent element
- `initial`: Resets to the CSS specification's default value
- `unset`: Acts as `inherit` if the property naturally inherits (like `color`), otherwise acts as `initial`

### Q10: How does the `currentColor` keyword work?
**Answer:** `currentColor` is a keyword that represents the computed value of the element's `color` property. It's useful for:
```css
.button {
  color: blue;
  border: 2px solid currentColor;  /* Blue border */
  box-shadow: 0 2px 10px currentColor;  /* Blue shadow */
}
```

---

## Exercises

### Exercise 1: Specificity Battle
Calculate the specificity and determine which color wins:

```html
<div id="main" class="container">
  <p class="text highlight" id="intro">What color am I?</p>
</div>
```

```css
p { color: black; }
.text { color: blue; }
p.text { color: green; }
#intro { color: red; }
.container .text.highlight { color: orange; }
div p.text { color: purple; }
```

<details>
<summary>Solution</summary>

| Selector | Breakdown | Specificity |
|----------|-----------|-------------|
| `p` | 1 element | 0,0,0,1 = 1 |
| `.text` | 1 class | 0,0,1,0 = 10 |
| `p.text` | 1 element + 1 class | 0,0,1,1 = 11 |
| `#intro` | 1 ID | 0,1,0,0 = 100 |
| `.container .text.highlight` | 3 classes | 0,0,3,0 = 30 |
| `div p.text` | 2 elements + 1 class | 0,0,1,2 = 12 |

**Winner: RED** (`#intro` with specificity 100)

</details>

### Exercise 2: Box Model Calculation
What is the total space this element occupies?

```css
.box {
  width: 300px;
  height: 200px;
  padding: 20px;
  border: 5px solid black;
  margin: 15px;
  box-sizing: content-box;
}
```

<details>
<summary>Solution</summary>

**With `content-box`:**
- Content width: 300px
- + Padding: 40px (20px × 2)
- + Border: 10px (5px × 2)
- = **Total width: 350px**

- Content height: 200px
- + Padding: 40px (20px × 2)
- + Border: 10px (5px × 2)
- = **Total height: 250px**

**Space occupied (including margin):**
- 350px + 30px (margin) = **380px wide**
- 250px + 30px (margin) = **280px tall**

</details>

### Exercise 3: Fix the Margin Collapse
The child's margin is escaping the parent. Fix it using 3 different methods.

```html
<div class="parent">
  <div class="child">I have margin-top: 50px</div>
</div>
```

```css
.parent {
  background: lightblue;
}

.child {
  margin-top: 50px;
  background: lightcoral;
}
```

<details>
<summary>Solution</summary>

```css
/* Method 1: Add padding to parent */
.parent {
  padding-top: 1px;  /* Creates barrier */
}

/* Method 2: display: flow-root (BEST!) */
.parent {
  display: flow-root;
}

/* Method 3: overflow */
.parent {
  overflow: hidden;  /* or auto */
}

/* Method 4: Make parent a flex container */
.parent {
  display: flex;
  flex-direction: column;
}
```

</details>

### Exercise 4: Create Color Variations with HSL
Given a primary color `hsl(220, 80%, 50%)`, create:
- A lighter version
- A darker version
- A muted/desaturated version

<details>
<summary>Solution</summary>

```css
:root {
  --primary: hsl(220, 80%, 50%);
  
  /* Lighter: increase lightness */
  --primary-light: hsl(220, 80%, 70%);
  
  /* Darker: decrease lightness */
  --primary-dark: hsl(220, 80%, 30%);
  
  /* Muted: decrease saturation */
  --primary-muted: hsl(220, 30%, 50%);
  
  /* Very light (for backgrounds) */
  --primary-bg: hsl(220, 80%, 95%);
}
```

</details>

### Exercise 5: Style Form Input States
Create styles for an input showing default, focus, valid, and invalid states.

<details>
<summary>Solution</summary>

```css
input {
  padding: 12px 16px;
  border: 2px solid #ddd;
  border-radius: 6px;
  font-size: 16px;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}

input:focus {
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.2);
}

input:valid {
  border-color: #28a745;
}

input:valid:focus {
  box-shadow: 0 0 0 3px rgba(40, 167, 69, 0.2);
}

input:invalid {
  border-color: #dc3545;
}

input:invalid:focus {
  box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.2);
}

input:disabled {
  background: #f5f5f5;
  cursor: not-allowed;
  opacity: 0.7;
}

input::placeholder {
  color: #999;
}
```

</details>

---

## Quick Reference Cheat Sheet

```css
/* ===== UNIVERSAL RESET ===== */
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

/* ===== SPECIFICITY ORDER ===== */
/* !important > inline > #id > .class > element > * */

/* ===== COMMON SELECTORS ===== */
.class { }           /* Class */
#id { }              /* ID */
element { }          /* Type */
[attr="value"] { }   /* Attribute */
.parent .child { }   /* Descendant */
.parent > .child { } /* Direct child */
.el + .next { }      /* Adjacent sibling */
.el ~ .siblings { }  /* General siblings */

/* ===== PSEUDO-CLASSES ===== */
:hover, :focus, :active     /* User action */
:first-child, :last-child   /* Position */
:nth-child(2n), :nth-child(odd)  /* Pattern */
:not(.class)                /* Negation */
:checked, :disabled, :valid /* Form states */

/* ===== PSEUDO-ELEMENTS ===== */
::before, ::after    /* Insert content */
::first-letter       /* First letter */
::first-line         /* First line */
::placeholder        /* Input placeholder */
::selection          /* Selected text */

/* ===== UNITS ===== */
rem  /* Font-size, consistent spacing */
em   /* Component-relative */
%    /* Parent-relative */
vw, vh  /* Viewport-relative */
px   /* Borders, small fixed values */

/* ===== COLORS ===== */
#RRGGBB, #RGB         /* Hex */
rgb(R, G, B)          /* RGB (0-255) */
hsl(H, S%, L%)        /* HSL (recommended!) */
currentColor          /* Inherits text color */
```

---

**Next:** [02-CSS-Layout.md](./02-CSS-Layout.md) - Display, Positioning, Flexbox, and Grid
