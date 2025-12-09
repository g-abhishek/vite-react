# CSS Basics - Interview Preparation Guide

## Table of Contents
1. [What is CSS?](#what-is-css)
2. [CSS Selectors](#css-selectors)
3. [Specificity](#specificity)
4. [Box Model](#box-model)
5. [Units in CSS](#units-in-css)
6. [Colors in CSS](#colors-in-css)
7. [Interview Questions](#interview-questions)
8. [Exercises](#exercises)

---

## What is CSS?

**CSS (Cascading Style Sheets)** is a stylesheet language used to describe the presentation of HTML documents. The "cascading" refers to how styles are applied based on specificity and source order.

### Three Ways to Include CSS

```html
<!-- 1. Inline CSS (Highest specificity) -->
<p style="color: red;">Text</p>

<!-- 2. Internal CSS -->
<head>
  <style>
    p { color: blue; }
  </style>
</head>

<!-- 3. External CSS (Recommended) -->
<link rel="stylesheet" href="styles.css">
```

**Interview Tip:** External CSS is preferred because it:
- Separates concerns (HTML for structure, CSS for presentation)
- Allows caching by browsers
- Makes maintenance easier
- Enables reusability across pages

---

## CSS Selectors

### 1. Basic Selectors

```css
/* Universal Selector - selects all elements */
* {
  margin: 0;
  padding: 0;
}

/* Type/Element Selector */
p {
  color: blue;
}

/* Class Selector */
.container {
  width: 100%;
}

/* ID Selector */
#header {
  background: black;
}
```

### 2. Combinator Selectors

```css
/* Descendant Selector (space) - all descendants */
div p {
  color: red;  /* All <p> inside <div>, any level deep */
}

/* Child Selector (>) - direct children only */
div > p {
  color: blue;  /* Only <p> that are direct children of <div> */
}

/* Adjacent Sibling (+) - immediately following sibling */
h1 + p {
  margin-top: 0;  /* <p> immediately after <h1> */
}

/* General Sibling (~) - all following siblings */
h1 ~ p {
  color: gray;  /* All <p> after <h1> at same level */
}
```

### 3. Attribute Selectors

```css
/* Has attribute */
[disabled] {
  opacity: 0.5;
}

/* Exact value */
[type="text"] {
  border: 1px solid gray;
}

/* Contains word (space-separated) */
[class~="btn"] {
  cursor: pointer;
}

/* Starts with */
[href^="https"] {
  color: green;
}

/* Ends with */
[src$=".png"] {
  border: none;
}

/* Contains substring */
[class*="col-"] {
  float: left;
}
```

### 4. Pseudo-classes

```css
/* User Action States */
a:hover { color: red; }
a:active { color: blue; }
a:focus { outline: 2px solid blue; }
a:visited { color: purple; }

/* Structural Pseudo-classes */
li:first-child { font-weight: bold; }
li:last-child { border-bottom: none; }
li:nth-child(2) { background: yellow; }
li:nth-child(odd) { background: #f0f0f0; }
li:nth-child(even) { background: #fff; }
li:nth-child(3n) { color: red; }  /* Every 3rd element */
li:nth-child(3n+1) { color: blue; }  /* 1st, 4th, 7th... */

/* Negation */
p:not(.intro) { font-size: 14px; }

/* Form States */
input:checked { background: green; }
input:disabled { cursor: not-allowed; }
input:required { border-color: red; }
input:valid { border-color: green; }
input:invalid { border-color: red; }

/* Empty & Only Child */
p:empty { display: none; }
p:only-child { color: blue; }
```

### 5. Pseudo-elements

```css
/* First Letter & Line */
p::first-letter {
  font-size: 2em;
  font-weight: bold;
}

p::first-line {
  font-style: italic;
}

/* Before & After - VERY IMPORTANT FOR INTERVIEWS */
.tooltip::before {
  content: "ℹ️ ";
}

.clearfix::after {
  content: "";
  display: table;
  clear: both;
}

/* Selection Styling */
::selection {
  background: yellow;
  color: black;
}

/* Placeholder */
input::placeholder {
  color: #999;
  font-style: italic;
}
```

**Interview Question:** What's the difference between `:` and `::`?
- Single colon (`:`) is for pseudo-classes (state-based)
- Double colon (`::`) is for pseudo-elements (create new elements)
- Note: CSS2 syntax used single colon for both; CSS3 introduced `::` for pseudo-elements

---

## Specificity

### Specificity Hierarchy (Most to Least Specific)

| Type | Example | Specificity Value |
|------|---------|-------------------|
| Inline styles | `style="color:red"` | 1,0,0,0 |
| ID selectors | `#header` | 0,1,0,0 |
| Class, attribute, pseudo-class | `.nav`, `[type]`, `:hover` | 0,0,1,0 |
| Type selectors, pseudo-elements | `div`, `::before` | 0,0,0,1 |
| Universal selector | `*` | 0,0,0,0 |

### Calculating Specificity

```css
/* Specificity: 0,0,0,1 (one type selector) */
p { color: black; }

/* Specificity: 0,0,1,0 (one class) */
.text { color: blue; }

/* Specificity: 0,0,1,1 (one class + one type) */
p.text { color: green; }

/* Specificity: 0,1,0,0 (one ID) */
#intro { color: red; }

/* Specificity: 0,1,1,1 (one ID + one class + one type) */
div#intro.highlight { color: purple; }

/* Specificity: 0,0,2,1 (two classes + one type) */
p.text.highlight { color: orange; }
```

### The !important Rule

```css
p {
  color: red !important;  /* Overrides everything except inline !important */
}
```

**Interview Tip:** Avoid `!important` because it:
- Breaks the natural cascading of styles
- Makes debugging difficult
- Creates maintenance nightmares
- Only use for utility classes or overriding third-party libraries

### Specificity Quiz

```css
/* Which color will the paragraph have? */
#content p.intro { color: blue; }      /* 0,1,1,1 = 111 */
.content .intro { color: red; }         /* 0,0,2,0 = 20 */
div#content p { color: green; }         /* 0,1,0,2 = 102 */
p { color: black; }                     /* 0,0,0,1 = 1 */

/* Answer: BLUE (highest specificity: 111) */
```

---

## Box Model

### The Box Model Components

```
+------------------------------------------+
|              MARGIN                       |
|  +------------------------------------+  |
|  |            BORDER                  |  |
|  |  +------------------------------+  |  |
|  |  |          PADDING             |  |  |
|  |  |  +------------------------+  |  |  |
|  |  |  |       CONTENT          |  |  |  |
|  |  |  |                        |  |  |  |
|  |  |  +------------------------+  |  |  |
|  |  +------------------------------+  |  |
|  +------------------------------------+  |
+------------------------------------------+
```

### Content-box vs Border-box (CRUCIAL FOR INTERVIEWS)

```css
/* DEFAULT: content-box */
.box-content {
  box-sizing: content-box;
  width: 200px;
  padding: 20px;
  border: 5px solid black;
  /* Total width = 200 + 40 (padding) + 10 (border) = 250px */
}

/* RECOMMENDED: border-box */
.box-border {
  box-sizing: border-box;
  width: 200px;
  padding: 20px;
  border: 5px solid black;
  /* Total width = 200px (content shrinks to accommodate padding & border) */
}

/* Universal Reset - ALWAYS USE THIS */
*, *::before, *::after {
  box-sizing: border-box;
}
```

### Margin Properties

```css
.element {
  /* Individual sides */
  margin-top: 10px;
  margin-right: 20px;
  margin-bottom: 10px;
  margin-left: 20px;
  
  /* Shorthand: top right bottom left (clockwise) */
  margin: 10px 20px 10px 20px;
  
  /* Shorthand: top/bottom left/right */
  margin: 10px 20px;
  
  /* Shorthand: all sides */
  margin: 10px;
  
  /* Centering horizontally */
  margin: 0 auto;
}
```

### Margin Collapsing (IMPORTANT INTERVIEW TOPIC)

```css
/* Vertical margins collapse - only the larger margin is used */
.box1 {
  margin-bottom: 30px;
}

.box2 {
  margin-top: 20px;
}
/* Gap between box1 and box2 = 30px (not 50px!) */

/* How to prevent margin collapsing: */
/* 1. Add padding or border */
/* 2. Use overflow: hidden on parent */
/* 3. Use display: flex or grid on parent */
/* 4. Use float */
```

### Padding Properties

```css
.element {
  /* Same syntax as margin */
  padding: 10px 20px 10px 20px;
  
  /* NOTE: Padding CANNOT be negative (unlike margin) */
  /* padding: -10px; ❌ INVALID */
  
  /* NOTE: Padding does NOT collapse */
}
```

### Border Properties

```css
.element {
  /* Full syntax */
  border-width: 2px;
  border-style: solid;  /* solid, dashed, dotted, double, groove, ridge, inset, outset */
  border-color: black;
  
  /* Shorthand */
  border: 2px solid black;
  
  /* Individual sides */
  border-top: 1px solid red;
  border-right: 2px dashed blue;
  border-bottom: 3px dotted green;
  border-left: 4px double purple;
  
  /* Border radius */
  border-radius: 10px;  /* All corners */
  border-radius: 10px 20px;  /* top-left/bottom-right  top-right/bottom-left */
  border-radius: 10px 20px 30px 40px;  /* top-left top-right bottom-right bottom-left */
  border-radius: 50%;  /* Circle (if width = height) */
}
```

---

## Units in CSS

### Absolute Units

```css
.element {
  /* Pixels - Most common, fixed size */
  width: 200px;
  
  /* Points - Used in print */
  font-size: 12pt;
  
  /* Centimeters/Millimeters - Print */
  width: 10cm;
  height: 50mm;
}
```

### Relative Units (IMPORTANT FOR INTERVIEWS)

```css
/* em - Relative to parent's font-size */
.parent {
  font-size: 16px;
}
.child {
  font-size: 1.5em;  /* 24px (16 × 1.5) */
  padding: 1em;       /* 24px (uses own font-size) */
}

/* rem - Relative to ROOT element's font-size (usually 16px) */
html {
  font-size: 16px;  /* Browser default */
}
.element {
  font-size: 1.5rem;  /* Always 24px regardless of parent */
  padding: 2rem;      /* Always 32px */
}

/* % - Percentage of parent */
.parent {
  width: 500px;
}
.child {
  width: 50%;  /* 250px */
}

/* vw/vh - Viewport width/height */
.full-screen {
  width: 100vw;   /* 100% of viewport width */
  height: 100vh;  /* 100% of viewport height */
}

.half-screen {
  width: 50vw;
  height: 50vh;
}

/* vmin/vmax - Smaller/larger of vw or vh */
.square {
  width: 50vmin;   /* 50% of smaller viewport dimension */
  height: 50vmin;
}

/* ch - Width of the "0" character */
.input {
  width: 20ch;  /* Approximately 20 characters wide */
}
```

### When to Use Which Unit?

| Property | Recommended Unit | Reason |
|----------|------------------|--------|
| `font-size` | `rem` | Respects user preferences, consistent |
| `padding`, `margin` | `rem` or `em` | Scales with font |
| `width` | `%`, `vw`, or `px` | Context dependent |
| `height` | `vh` or `auto` | Avoid fixed heights |
| `border` | `px` | Borders don't need to scale |
| `line-height` | Unitless number | Inherits properly |

---

## Colors in CSS

### Color Formats

```css
.element {
  /* Named Colors */
  color: red;
  color: tomato;
  color: rebeccapurple;
  
  /* Hexadecimal */
  color: #ff0000;      /* Red */
  color: #f00;         /* Shorthand for #ff0000 */
  color: #ff000080;    /* With alpha (50% transparent) */
  
  /* RGB/RGBA */
  color: rgb(255, 0, 0);
  color: rgba(255, 0, 0, 0.5);  /* 50% transparent */
  
  /* Modern syntax (CSS Colors Level 4) */
  color: rgb(255 0 0);
  color: rgb(255 0 0 / 50%);
  
  /* HSL/HSLA - Hue, Saturation, Lightness */
  color: hsl(0, 100%, 50%);       /* Red */
  color: hsla(0, 100%, 50%, 0.5); /* 50% transparent red */
  color: hsl(0 100% 50% / 50%);   /* Modern syntax */
  
  /* currentColor - Uses the current text color */
  border-color: currentColor;
  
  /* transparent */
  background: transparent;
}
```

### HSL Explained (Useful for Interviews)

```css
/* HSL makes color manipulation easier */

/* Hue: 0-360 (color wheel)
   0/360 = Red
   60 = Yellow
   120 = Green
   180 = Cyan
   240 = Blue
   300 = Magenta
*/

/* Creating color variations */
.primary { color: hsl(220, 80%, 50%); }
.primary-light { color: hsl(220, 80%, 70%); }  /* Just change lightness */
.primary-dark { color: hsl(220, 80%, 30%); }
.primary-muted { color: hsl(220, 30%, 50%); }  /* Lower saturation */
```

---

## Interview Questions

### Q1: What is the CSS Box Model?
**Answer:** The box model is how CSS renders elements. Each element is a rectangular box consisting of content, padding, border, and margin. The `box-sizing` property determines whether the width/height includes padding and border (`border-box`) or not (`content-box`).

### Q2: What's the difference between `display: none` and `visibility: hidden`?
**Answer:**
- `display: none` - Removes element from the document flow, takes no space
- `visibility: hidden` - Hides element but preserves its space in the layout

### Q3: Explain the difference between `em` and `rem`.
**Answer:**
- `em` is relative to the font-size of its direct parent element
- `rem` is relative to the root element's (html) font-size
- `rem` is more predictable as it's always based on one reference point

### Q4: What is specificity and how is it calculated?
**Answer:** Specificity determines which CSS rule takes precedence. It's calculated as a four-part value: inline styles (1,0,0,0) > IDs (0,1,0,0) > classes/attributes/pseudo-classes (0,0,1,0) > elements/pseudo-elements (0,0,0,1).

### Q5: What is margin collapsing?
**Answer:** When two vertical margins meet, they collapse into a single margin equal to the larger of the two. This only happens with vertical margins, not horizontal ones. It can be prevented using padding, borders, flex/grid containers, or overflow.

### Q6: What's the difference between pseudo-classes and pseudo-elements?
**Answer:**
- Pseudo-classes (`:`) select elements based on state (`:hover`, `:focus`, `:first-child`)
- Pseudo-elements (`::`) create virtual elements (`::before`, `::after`, `::first-letter`)

### Q7: Explain the CSS cascade.
**Answer:** The cascade determines how conflicting rules are resolved:
1. Importance (!important declarations)
2. Origin (author > user > browser)
3. Specificity (more specific selectors win)
4. Source Order (later rules win if specificity is equal)

---

## Exercises

### Exercise 1: Specificity Battle
Calculate the specificity and determine which color the element will have:

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

| Selector | Specificity | Value |
|----------|-------------|-------|
| `p` | 0,0,0,1 | 1 |
| `.text` | 0,0,1,0 | 10 |
| `p.text` | 0,0,1,1 | 11 |
| `#intro` | 0,1,0,0 | 100 |
| `.container .text.highlight` | 0,0,3,0 | 30 |
| `div p.text` | 0,0,1,2 | 12 |

**Answer: RED** - `#intro` has the highest specificity (100)
</details>

### Exercise 2: Box Model Calculation
What is the total width and height of this element?

```css
.box {
  width: 300px;
  height: 200px;
  padding: 20px;
  border: 5px solid black;
  margin: 10px;
  box-sizing: content-box;
}
```

<details>
<summary>Solution</summary>

- Total Width = 300 + (20×2) + (5×2) = 350px (plus 20px margin on each side)
- Total Height = 200 + (20×2) + (5×2) = 250px (plus 20px margin on each side)
- Space occupied = 370px × 270px (including margins)
</details>

### Exercise 3: Create a Tooltip with CSS Only
Create a tooltip using `::after` pseudo-element that shows on hover.

<details>
<summary>Solution</summary>

```css
.tooltip {
  position: relative;
  cursor: pointer;
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
  transition: opacity 0.3s;
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

### Exercise 4: Style Form States
Create styles for a form input showing different states (focus, valid, invalid).

<details>
<summary>Solution</summary>

```css
input {
  padding: 10px 15px;
  border: 2px solid #ddd;
  border-radius: 4px;
  outline: none;
  transition: border-color 0.3s, box-shadow 0.3s;
}

input:focus {
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.25);
}

input:valid {
  border-color: #28a745;
}

input:invalid {
  border-color: #dc3545;
}

input:disabled {
  background: #e9ecef;
  cursor: not-allowed;
}

input::placeholder {
  color: #999;
}
```
</details>

---

## Quick Reference Cheat Sheet

```css
/* ===== SELECTOR PRIORITY ===== */
/* !important > inline > #id > .class > element */

/* ===== BOX-SIZING RESET ===== */
*, *::before, *::after { box-sizing: border-box; }

/* ===== CENTERING (QUICK) ===== */
.center-text { text-align: center; }
.center-block { margin: 0 auto; }

/* ===== COMMON RESETS ===== */
* { margin: 0; padding: 0; }
img { max-width: 100%; display: block; }
a { text-decoration: none; color: inherit; }
ul { list-style: none; }
```

---

**Next:** [02-CSS-Layout.md](./02-CSS-Layout.md) - Flexbox, Grid, and Positioning

