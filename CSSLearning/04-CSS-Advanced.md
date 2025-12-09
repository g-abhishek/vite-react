# CSS Advanced - Interview Preparation Guide

## Table of Contents
1. [CSS Transforms](#css-transforms)
2. [CSS Transitions](#css-transitions)
3. [CSS Animations](#css-animations)
4. [CSS Variables (Custom Properties)](#css-variables-custom-properties)
5. [CSS Filters](#css-filters)
6. [CSS Blend Modes](#css-blend-modes)
7. [CSS Shapes & Clip-Path](#css-shapes--clip-path)
8. [Performance Optimization](#performance-optimization)
9. [Interview Questions](#interview-questions)
10. [Exercises](#exercises)

---

## CSS Transforms

Transforms modify an element's visual rendering without affecting document flow.

### Why Transforms Are Special

```
Normal position change:              Transform:
┌─────────────────────┐             ┌─────────────────────┐
│   ┌───┐             │             │             ┌───┐   │
│   │ A │             │             │             │ A │   │
│   └───┘             │             │             └───┘   │
│                     │             │                     │
│   ↓ left: 100px     │             │   ↓ translateX(100px)
│     (REFLOW!)       │             │     (GPU accelerated)
│                     │             │                     │
│         ┌───┐       │             │             ┌───┐   │
│         │ A │       │             │             │ A │   │ ← Original space kept!
│         └───┘       │             │             └───┘   │
│   ┌───┐             │             │   ┌───┐             │
│   │ B │ moves up!   │             │   │ B │ stays put   │
│   └───┘             │             │   └───┘             │
└─────────────────────┘             └─────────────────────┘
       Expensive                          Cheap & fast
```

### 2D Transforms

#### translate() - Move Elements

```css
.element {
  /* Move along X axis */
  transform: translateX(50px);      /* Right 50px */
  transform: translateX(-50px);     /* Left 50px */
  transform: translateX(50%);       /* Right by 50% of element's width */
  
  /* Move along Y axis */
  transform: translateY(30px);      /* Down 30px */
  transform: translateY(-30px);     /* Up 30px */
  
  /* Move both axes */
  transform: translate(50px, 30px); /* Right 50px, down 30px */
  transform: translate(-50%, -50%); /* Common centering technique! */
}

/* Perfect centering with translate */
.centered {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  /* Moves element back by half its own width and height */
}
```

#### rotate() - Rotate Elements

```css
.element {
  /* Degrees */
  transform: rotate(45deg);         /* Clockwise */
  transform: rotate(-45deg);        /* Counter-clockwise */
  transform: rotate(180deg);        /* Half turn */
  transform: rotate(360deg);        /* Full turn (no visible change) */
  
  /* Turns */
  transform: rotate(0.5turn);       /* Half turn (180deg) */
  transform: rotate(1turn);         /* Full turn (360deg) */
  
  /* Radians and gradians */
  transform: rotate(3.14159rad);    /* ~180deg */
  transform: rotate(100grad);       /* 90deg */
}
```

**Visual rotation:**

```
rotate(0deg)    rotate(45deg)    rotate(90deg)    rotate(180deg)
┌─────────┐       ◢███◣          ██████████        ┌─────────┐
│         │      ███████         █        █        │         │
│    A    │     █████████        █   A    █        │    ∀    │
│         │      ███████         █        █        │         │
└─────────┘       ◥███◤          ██████████        └─────────┘
```

#### scale() - Resize Elements

```css
.element {
  /* Uniform scaling */
  transform: scale(1.5);            /* 150% size */
  transform: scale(0.5);            /* 50% size */
  transform: scale(2);              /* 200% size */
  
  /* Scale X only (width) */
  transform: scaleX(2);             /* Double width */
  transform: scaleX(0.5);           /* Half width */
  
  /* Scale Y only (height) */
  transform: scaleY(2);             /* Double height */
  
  /* Non-uniform scaling */
  transform: scale(2, 0.5);         /* 2x width, 0.5x height */
  
  /* Mirror/flip */
  transform: scaleX(-1);            /* Horizontal flip */
  transform: scaleY(-1);            /* Vertical flip */
  transform: scale(-1, -1);         /* Both (180deg rotation) */
}
```

**Visual scaling:**

```
scale(1)        scale(1.5)       scale(0.5)       scaleX(-1)
┌─────┐         ┌───────┐          ┌───┐          ┌─────┐
│  →  │         │   →   │          │ → │          │  ←  │
└─────┘         │       │          └───┘          └─────┘
                └───────┘                          Flipped!
```

#### skew() - Slant Elements

```css
.element {
  /* Skew X (horizontal tilt) */
  transform: skewX(20deg);
  
  /* Skew Y (vertical tilt) */
  transform: skewY(10deg);
  
  /* Both */
  transform: skew(20deg, 10deg);
}
```

**Visual skewing:**

```
skew(0)         skewX(20deg)     skewY(20deg)
┌─────────┐      ╱─────────╱      ┌─────────┐
│         │     ╱         ╱       │\        │
│         │    ╱         ╱        │ \       │
│         │   ╱         ╱         │  \      │
└─────────┘  ╱─────────╱          └───\─────┘
```

### Combining Multiple Transforms

```css
.element {
  /* Multiple transforms - applied RIGHT TO LEFT! */
  transform: translateX(100px) rotate(45deg) scale(1.5);
  
  /* Order matters! */
  transform: rotate(45deg) translateX(100px);  /* Different result! */
  transform: translateX(100px) rotate(45deg);  /* Different result! */
}
```

**Why order matters:**

```
translateX(100px) rotate(45deg):
1. First rotate the element 45deg
2. Then translate 100px along the (now rotated) X axis

rotate(45deg) translateX(100px):
1. First translate 100px to the right
2. Then rotate 45deg around the new center
```

### transform-origin

```css
.element {
  /* Default: center of element */
  transform-origin: center;         /* Same as 50% 50% */
  
  /* Keywords */
  transform-origin: top left;
  transform-origin: bottom right;
  transform-origin: top center;
  
  /* Percentages */
  transform-origin: 0% 0%;          /* Top left */
  transform-origin: 100% 100%;      /* Bottom right */
  transform-origin: 50% 0%;         /* Top center */
  
  /* Length values */
  transform-origin: 20px 30px;
  
  /* For 3D transforms */
  transform-origin: 50% 50% 50px;   /* X Y Z */
}
```

**Visual transform-origin:**

```
transform-origin: center (default)    transform-origin: top left
          ↓                                    ↓
      ┌───┼───┐                            ●───────┐
      │   │   │   rotate(45deg)            │       │   rotate(45deg)
      │───●───│  ───────────────>          │       │  ───────────────>
      │   │   │                            │       │
      └───┼───┘                            └───────┘
      
      Rotates around center                 Rotates around corner
```

### 3D Transforms

```css
/* Enable 3D space on parent */
.parent {
  perspective: 1000px;              /* Distance from viewer to z=0 plane */
  perspective-origin: center;       /* Viewpoint position */
}

/* 3D transforms on children */
.child {
  /* Translate in 3D */
  transform: translateZ(50px);      /* Closer to viewer */
  transform: translateZ(-50px);     /* Further from viewer */
  transform: translate3d(10px, 20px, 50px);
  
  /* Rotate in 3D */
  transform: rotateX(45deg);        /* Rotate around horizontal axis */
  transform: rotateY(45deg);        /* Rotate around vertical axis */
  transform: rotateZ(45deg);        /* Same as rotate(45deg) */
  transform: rotate3d(1, 1, 0, 45deg);  /* Custom axis */
  
  /* Scale in 3D */
  transform: scaleZ(2);
  transform: scale3d(1, 1, 2);
  
  /* Preserve 3D for nested transforms */
  transform-style: preserve-3d;
  
  /* Hide back of element when rotated */
  backface-visibility: hidden;
}
```

**3D rotation visualization:**

```
rotateX(45deg):        rotateY(45deg):        rotateZ(45deg):
    ───────                 ┌───┐               ◢███◣
   ╱       ╲               ╱    │              ███████
  ╱         ╲             ╱     │             █████████
 ╱───────────╲            ╲     │              ███████
  Tilts back              │     ╲               ◥███◤
                          │    ╱               Flat rotate
                          └───╱
                          Spins like door
```

### Card Flip Animation

```css
.card {
  width: 300px;
  height: 200px;
  perspective: 1000px;
}

.card__inner {
  width: 100%;
  height: 100%;
  position: relative;
  transform-style: preserve-3d;
  transition: transform 0.6s;
}

.card:hover .card__inner {
  transform: rotateY(180deg);
}

.card__front,
.card__back {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card__front {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
}

.card__back {
  background: linear-gradient(135deg, #f093fb, #f5576c);
  color: white;
  transform: rotateY(180deg);
}
```

---

## CSS Transitions

Transitions animate property changes from one state to another.

### Transition Properties

```css
.element {
  /* Individual properties */
  transition-property: background-color, transform, opacity;
  transition-duration: 0.3s;
  transition-timing-function: ease;
  transition-delay: 0s;
  
  /* Shorthand: property duration timing-function delay */
  transition: background-color 0.3s ease 0s;
  
  /* Multiple transitions */
  transition: 
    transform 0.3s ease,
    background-color 0.2s ease,
    box-shadow 0.3s ease;
  
  /* All properties (use carefully!) */
  transition: all 0.3s ease;
}

.element:hover {
  background-color: blue;
  transform: scale(1.05);
  box-shadow: 0 10px 30px rgba(0,0,0,0.2);
}
```

### Timing Functions Explained

```css
.element {
  /* Keywords */
  transition-timing-function: ease;        /* Slow → Fast → Slow (default) */
  transition-timing-function: ease-in;     /* Slow → Fast */
  transition-timing-function: ease-out;    /* Fast → Slow */
  transition-timing-function: ease-in-out; /* Slow → Fast → Slow (smoother) */
  transition-timing-function: linear;      /* Constant speed */
  
  /* Cubic bezier (custom curves) */
  transition-timing-function: cubic-bezier(0.68, -0.55, 0.265, 1.55);
  
  /* Steps (frame-by-frame) */
  transition-timing-function: steps(4);
  transition-timing-function: steps(10, jump-start);
}
```

**Visual timing functions:**

```
Progress over time:

linear:     ╱
           ╱
          ╱
         ╱
        ╱
       ╱
      ╱  Constant speed

ease:       _______
           ╱       ╲
          ╱         ╲
         ╱           ╲
        ╱             ╲
       ╱               ╲_______  
      Slow start, fast middle, slow end

ease-in:    
           ___________
          ╱
         ╱
        ╱
       ╱
      ╱  Slow start, fast end

ease-out:  _______
                   ╲
                    ╲
                     ╲
                      ╲
                       ╲___  Fast start, slow end
```

### Common Cubic Bezier Values

```css
:root {
  /* Natural feeling */
  --ease-out-quad: cubic-bezier(0.25, 0.46, 0.45, 0.94);
  --ease-out-cubic: cubic-bezier(0.215, 0.61, 0.355, 1);
  --ease-out-quart: cubic-bezier(0.165, 0.84, 0.44, 1);
  --ease-out-expo: cubic-bezier(0.19, 1, 0.22, 1);
  
  /* Bouncy/Elastic */
  --ease-out-back: cubic-bezier(0.34, 1.56, 0.64, 1);      /* Overshoots */
  --ease-in-out-back: cubic-bezier(0.68, -0.55, 0.265, 1.55);
  
  /* Snappy */
  --ease-in-expo: cubic-bezier(0.95, 0.05, 0.795, 0.035);
}

.button {
  transition: transform 0.2s var(--ease-out-back);
}
```

### What Can (and Can't) Be Transitioned

```css
/* ✅ CAN be transitioned (animatable properties) */
opacity: 0 → 1
transform: scale(1) → scale(1.5)
color: red → blue
background-color: #fff → #000
border-color, border-width, border-radius
width, height, padding, margin (but expensive!)
font-size, letter-spacing, line-height
box-shadow, text-shadow
filter: blur(0) → blur(10px)

/* ❌ CANNOT be transitioned */
display: none → block    /* Use opacity + visibility instead */
font-family: Arial → Helvetica
background-image: url(a.jpg) → url(b.jpg)  /* Abrupt change */
position: relative → absolute

/* ⚠️ AVOID transitioning (performance) */
width, height          /* Causes reflow */
top, left, right, bottom  /* Causes reflow */
margin, padding        /* Causes reflow */

/* ✅ USE INSTEAD */
transform: translateX(), scale()  /* GPU accelerated */
opacity                            /* GPU accelerated */
```

### Transition Patterns

```css
/* Fade in/out (with display control) */
.modal {
  opacity: 0;
  visibility: hidden;  /* Also prevents interaction */
  transition: opacity 0.3s ease, visibility 0.3s ease;
}

.modal.active {
  opacity: 1;
  visibility: visible;
}

/* Button hover */
.button {
  background-color: #007bff;
  transform: translateY(0);
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
  transition: 
    background-color 0.2s ease,
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.button:hover {
  background-color: #0056b3;
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0,0,0,0.3);
}

/* Height animation (tricky!) */
.accordion__content {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease;
}

.accordion.open .accordion__content {
  max-height: 500px;  /* Must be larger than content */
}

/* Modern height animation with Grid */
.accordion__content {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.3s ease;
}

.accordion.open .accordion__content {
  grid-template-rows: 1fr;
}

.accordion__content > div {
  overflow: hidden;
}
```

---

## CSS Animations

Animations allow complex multi-step animations without triggers.

### @keyframes Syntax

```css
/* Simple: from/to */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* Percentage keyframes */
@keyframes bounce {
  0% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-30px);
  }
  100% {
    transform: translateY(0);
  }
}

/* Multiple properties */
@keyframes slideInUp {
  0% {
    opacity: 0;
    transform: translateY(50px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Complex animation */
@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(0, 123, 255, 0.7);
  }
  50% {
    transform: scale(1.05);
    box-shadow: 0 0 0 20px rgba(0, 123, 255, 0);
  }
}
```

### Animation Properties

```css
.element {
  /* Individual properties */
  animation-name: bounce;
  animation-duration: 1s;
  animation-timing-function: ease-in-out;
  animation-delay: 0s;
  animation-iteration-count: infinite;
  animation-direction: alternate;
  animation-fill-mode: forwards;
  animation-play-state: running;
  
  /* Shorthand */
  animation: bounce 1s ease-in-out 0s infinite alternate forwards;
  /* name | duration | timing | delay | iterations | direction | fill-mode */
  
  /* Multiple animations */
  animation: 
    fadeIn 0.5s ease forwards,
    slideUp 0.5s ease 0.2s forwards;
}
```

### animation-direction

```css
.element {
  animation-direction: normal;           /* 0% → 100%, restart */
  animation-direction: reverse;          /* 100% → 0%, restart */
  animation-direction: alternate;        /* 0% → 100% → 0% */
  animation-direction: alternate-reverse; /* 100% → 0% → 100% */
}
```

**Visual direction:**

```
normal:             reverse:            alternate:
→ → → → →          ← ← ← ← ←          → → → ← ← ← → → →
0%    100%         100%    0%         0% 100% 0% 100%
↺ restart          ↺ restart          ↔ bounces
```

### animation-fill-mode (IMPORTANT!)

```css
.element {
  animation-fill-mode: none;      /* Default: returns to initial state */
  animation-fill-mode: forwards;  /* Keeps final keyframe state */
  animation-fill-mode: backwards; /* Applies first keyframe during delay */
  animation-fill-mode: both;      /* Combines forwards and backwards */
}
```

**Visual fill-mode:**

```
@keyframes slideIn {
  from { transform: translateX(-100px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

Timeline:
       |--delay--|---animation---|--after--|

none:     Initial   Animated      Initial   ← Returns to start!
forwards: Initial   Animated      Final     ← Stays at end
backwards: First    Animated      Initial   ← Starts at first keyframe
both:     First    Animated      Final     ← Best of both
```

### Common Animation Patterns

```css
/* Loading spinner */
@keyframes spin {
  to { transform: rotate(360deg); }
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top-color: #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

/* Fade in up */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fade-in-up {
  animation: fadeInUp 0.6s ease forwards;
}

/* Staggered animation */
.item {
  opacity: 0;
  animation: fadeInUp 0.5s ease forwards;
}

.item:nth-child(1) { animation-delay: 0.1s; }
.item:nth-child(2) { animation-delay: 0.2s; }
.item:nth-child(3) { animation-delay: 0.3s; }
.item:nth-child(4) { animation-delay: 0.4s; }
.item:nth-child(5) { animation-delay: 0.5s; }

/* Or with CSS custom properties */
.item {
  animation: fadeInUp 0.5s ease forwards;
  animation-delay: calc(var(--index) * 0.1s);
}

/* Pulse effect */
@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.pulse {
  animation: pulse 2s ease-in-out infinite;
}

/* Shake effect */
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
  20%, 40%, 60%, 80% { transform: translateX(5px); }
}

.shake {
  animation: shake 0.5s ease;
}

/* Typewriter effect */
@keyframes typewriter {
  from { width: 0; }
  to { width: 100%; }
}

@keyframes blink {
  50% { border-color: transparent; }
}

.typewriter {
  overflow: hidden;
  white-space: nowrap;
  border-right: 3px solid;
  animation: 
    typewriter 4s steps(40) forwards,
    blink 0.75s step-end infinite;
}

/* Skeleton loading shimmer */
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.skeleton {
  background: linear-gradient(
    90deg,
    #f0f0f0 25%,
    #e0e0e0 50%,
    #f0f0f0 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
```

### Transitions vs Animations

| Transitions | Animations |
|-------------|------------|
| Requires trigger (hover, class change) | Can run automatically |
| Two states only (start → end) | Multiple keyframes |
| Simple property changes | Complex sequences |
| Good for: hover effects, UI feedback | Good for: loading, attention, decorative |

---

## CSS Variables (Custom Properties)

CSS variables (custom properties) are reusable values defined in CSS.

### Basic Syntax

```css
/* Define variables (usually in :root for global scope) */
:root {
  --primary-color: #007bff;
  --secondary-color: #6c757d;
  --font-family: 'Segoe UI', sans-serif;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --border-radius: 4px;
}

/* Use variables */
.button {
  background-color: var(--primary-color);
  font-family: var(--font-family);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--border-radius);
}

/* Fallback value */
.element {
  color: var(--undefined-color, #333);  /* Uses #333 if var doesn't exist */
  background: var(--bg, var(--primary-color));  /* Nested fallback */
}
```

### Scope and Inheritance

```css
/* Global scope */
:root {
  --color: blue;
}

/* Scoped to element and descendants */
.card {
  --color: red;  /* Overrides for .card and children */
}

.text {
  color: var(--color);
  /* Inside .card: red */
  /* Outside .card: blue */
}

/* Variables inherit like other CSS properties */
.parent {
  --spacing: 20px;
}

.child {
  padding: var(--spacing);  /* Gets 20px from parent */
}
```

### Dynamic Variables with JavaScript

```css
:root {
  --mouse-x: 0;
  --mouse-y: 0;
}

.spotlight {
  background: radial-gradient(
    circle at calc(var(--mouse-x) * 1px) calc(var(--mouse-y) * 1px),
    rgba(255, 255, 255, 0.3),
    transparent 200px
  );
}
```

```javascript
document.addEventListener('mousemove', (e) => {
  document.documentElement.style.setProperty('--mouse-x', e.clientX);
  document.documentElement.style.setProperty('--mouse-y', e.clientY);
});
```

### Theming with Variables

```css
/* Light theme (default) */
:root {
  --bg-primary: #ffffff;
  --bg-secondary: #f5f5f5;
  --text-primary: #1a1a1a;
  --text-secondary: #666666;
  --accent: #007bff;
  --border-color: #e0e0e0;
}

/* Dark theme */
[data-theme="dark"] {
  --bg-primary: #1a1a2e;
  --bg-secondary: #16213e;
  --text-primary: #eaeaea;
  --text-secondary: #b0b0b0;
  --accent: #4dabf7;
  --border-color: #2d3748;
}

/* System preference */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --bg-primary: #1a1a2e;
    --bg-secondary: #16213e;
    --text-primary: #eaeaea;
    --text-secondary: #b0b0b0;
    --accent: #4dabf7;
    --border-color: #2d3748;
  }
}

/* Use the variables */
body {
  background-color: var(--bg-primary);
  color: var(--text-primary);
}

.card {
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
}

a {
  color: var(--accent);
}
```

```javascript
// Theme toggle
function toggleTheme() {
  const html = document.documentElement;
  const currentTheme = html.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
}

// Load saved theme
const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
  document.documentElement.setAttribute('data-theme', savedTheme);
}
```

### CSS Variables vs Preprocessor Variables

| CSS Variables | Sass/Less Variables |
|---------------|---------------------|
| Runtime (live in browser) | Compile-time (baked into CSS) |
| Can change with JavaScript | Cannot change at runtime |
| Cascade and inherit | Do not cascade |
| Scoped to selectors | Global or scoped to file |
| Supported in all modern browsers | Need preprocessor |

### Component-Level Variables

```css
.button {
  /* Component-level defaults */
  --btn-bg: #007bff;
  --btn-color: white;
  --btn-padding: 8px 16px;
  --btn-radius: 4px;
  
  background: var(--btn-bg);
  color: var(--btn-color);
  padding: var(--btn-padding);
  border-radius: var(--btn-radius);
}

/* Variants override variables */
.button--secondary {
  --btn-bg: #6c757d;
}

.button--outline {
  --btn-bg: transparent;
  --btn-color: #007bff;
  border: 2px solid currentColor;
}

.button--large {
  --btn-padding: 12px 24px;
  --btn-radius: 8px;
}
```

---

## CSS Filters

Filters apply visual effects to elements.

### Filter Functions

```css
.element {
  /* Blur - Gaussian blur */
  filter: blur(5px);              /* Amount of blur */
  
  /* Brightness - Lighten/darken */
  filter: brightness(1.5);        /* > 1 = lighter, < 1 = darker */
  filter: brightness(0.5);
  
  /* Contrast */
  filter: contrast(2);            /* > 1 = more contrast */
  filter: contrast(0.5);          /* < 1 = less contrast */
  
  /* Grayscale */
  filter: grayscale(100%);        /* Fully gray */
  filter: grayscale(50%);         /* Partially gray */
  
  /* Hue-rotate - Shift colors */
  filter: hue-rotate(90deg);      /* Rotate color wheel */
  filter: hue-rotate(180deg);     /* Complementary colors */
  
  /* Invert - Negative */
  filter: invert(100%);           /* Full negative */
  
  /* Opacity */
  filter: opacity(50%);           /* Same as opacity: 0.5 */
  
  /* Saturate - Color intensity */
  filter: saturate(200%);         /* More saturated */
  filter: saturate(50%);          /* Less saturated */
  
  /* Sepia - Warm/vintage */
  filter: sepia(100%);            /* Full sepia */
  filter: sepia(50%);             /* Partial sepia */
  
  /* Drop-shadow - Like box-shadow but follows shape! */
  filter: drop-shadow(5px 5px 10px rgba(0,0,0,0.5));
  
  /* Multiple filters */
  filter: grayscale(50%) blur(2px) brightness(1.1);
  
  /* Remove filters */
  filter: none;
}
```

### drop-shadow vs box-shadow

```css
/* box-shadow - Rectangular, doesn't follow shape */
.png-image {
  box-shadow: 5px 5px 10px rgba(0,0,0,0.5);
  /* Shadow is rectangular, ignores transparency */
}

/* drop-shadow - Follows the actual shape */
.png-image {
  filter: drop-shadow(5px 5px 10px rgba(0,0,0,0.5));
  /* Shadow follows the PNG's transparent areas! */
}
```

**Visual difference:**

```
PNG with transparency:

box-shadow:              drop-shadow:
┌─────────────────┐      
│  ██████████     │         ██████████
│  ██      ██     │         ██      ██
│  ██████████     │         ██████████
│      ░░░░░░░░░░░│              ░░░░░░░░
│      ░░░░░░░░░░░│              ░░░░░░░░
└─────────────────┘      
  Rectangle shadow         Follows shape!
```

### Backdrop Filter

Applies filter to the area BEHIND the element (glassmorphism!).

```css
.glass {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);  /* Safari */
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
}

/* Frosted glass navbar */
.navbar {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px) saturate(180%);
  position: fixed;
  width: 100%;
}

/* Glass card */
.glass-card {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}
```

---

## CSS Blend Modes

Blend modes determine how element colors mix with colors behind them.

### mix-blend-mode

```css
.element {
  mix-blend-mode: normal;       /* Default - no blending */
  mix-blend-mode: multiply;     /* Darken effect */
  mix-blend-mode: screen;       /* Lighten effect */
  mix-blend-mode: overlay;      /* Contrast effect */
  mix-blend-mode: darken;       /* Keep darker pixels */
  mix-blend-mode: lighten;      /* Keep lighter pixels */
  mix-blend-mode: color-dodge;  /* Brighten underlying */
  mix-blend-mode: color-burn;   /* Darken underlying */
  mix-blend-mode: difference;   /* Color difference */
  mix-blend-mode: exclusion;    /* Similar to difference */
  mix-blend-mode: hue;          /* Hue of element, saturation/luminosity of bg */
  mix-blend-mode: saturation;
  mix-blend-mode: color;
  mix-blend-mode: luminosity;
}
```

**Common use cases:**

```css
/* Text that adapts to any background */
.adaptive-text {
  color: white;
  mix-blend-mode: difference;
  /* White on black = black, white on white = black */
}

/* Overlay effect on images */
.image-overlay {
  position: relative;
}

.image-overlay::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(to right, #ff6b6b, #4ecdc4);
  mix-blend-mode: multiply;
}
```

### background-blend-mode

```css
.element {
  background-image: url('image.jpg');
  background-color: #ff6b6b;
  background-blend-mode: multiply;  /* Blend image with color */
}

/* Multiple backgrounds */
.element {
  background: 
    linear-gradient(to right, #ff6b6b, #4ecdc4),
    url('image.jpg');
  background-blend-mode: overlay;
}

/* Duotone effect */
.duotone {
  background: 
    linear-gradient(#ff6b6b, #ff6b6b),
    url('image.jpg');
  background-blend-mode: screen;
  background-size: cover;
}
```

---

## CSS Shapes & Clip-Path

### clip-path

Clips element to a specific shape.

```css
.element {
  /* Circle */
  clip-path: circle(50%);                    /* Radius 50% of element */
  clip-path: circle(100px at center);        /* Fixed 100px radius */
  clip-path: circle(50% at 0 0);            /* Centered at top-left */
  
  /* Ellipse */
  clip-path: ellipse(50% 30% at center);    /* Horizontal 50%, vertical 30% */
  
  /* Inset (rectangle) */
  clip-path: inset(10px);                   /* 10px from all edges */
  clip-path: inset(10px 20px 30px 40px);    /* top right bottom left */
  clip-path: inset(10px round 15px);        /* With border-radius */
  
  /* Polygon - Custom shapes */
  clip-path: polygon(50% 0%, 100% 100%, 0% 100%);  /* Triangle */
  clip-path: polygon(0 0, 100% 0, 100% 75%, 50% 100%, 0 75%);  /* Pentagon */
}
```

### Common Polygon Shapes

```css
/* Triangle pointing up */
.triangle-up {
  clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
}

/* Triangle pointing down */
.triangle-down {
  clip-path: polygon(0% 0%, 100% 0%, 50% 100%);
}

/* Diamond/Rhombus */
.diamond {
  clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);
}

/* Hexagon */
.hexagon {
  clip-path: polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%);
}

/* Star */
.star {
  clip-path: polygon(
    50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%,
    50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%
  );
}

/* Arrow right */
.arrow-right {
  clip-path: polygon(0% 20%, 60% 20%, 60% 0%, 100% 50%, 60% 100%, 60% 80%, 0% 80%);
}

/* Diagonal cut */
.diagonal-cut {
  clip-path: polygon(0 0, 100% 0, 100% 80%, 0 100%);
}

/* Slant */
.slant {
  clip-path: polygon(0 0, 100% 10%, 100% 100%, 0 90%);
}
```

**Visual shapes:**

```
Triangle:        Diamond:        Hexagon:         Star:
    ▲             ◆             ⬡               ★
   ╱ ╲           ╱╲            ╱──╲            ╱ ╲
  ╱   ╲         ╱  ╲          ╱    ╲          ╱╲ ╱╲
 ╱     ╲       ◆    ◆        │      │        ╲  ╳  ╱
╱───────╲       ╲  ╱         │      │         ╲╱ ╲╱
                 ╲╱           ╲    ╱
                               ╲──╱
```

### Animated clip-path

```css
.reveal {
  clip-path: circle(0% at 50% 50%);
  transition: clip-path 0.5s ease;
}

.reveal:hover {
  clip-path: circle(100% at 50% 50%);
}

/* Wipe animation */
@keyframes wipe {
  from {
    clip-path: inset(0 100% 0 0);
  }
  to {
    clip-path: inset(0 0 0 0);
  }
}

.wipe-in {
  animation: wipe 1s ease forwards;
}
```

---

## Performance Optimization

### What's Cheap vs Expensive

```
CHEAP (GPU-accelerated, compositor-only):
├── opacity
├── transform (translate, rotate, scale)
└── filter

EXPENSIVE (triggers layout/paint):
├── width, height
├── top, left, right, bottom
├── margin, padding
├── border
├── font-size
└── display
```

### will-change

Tells browser to optimize for upcoming changes.

```css
/* ✅ Good - Use sparingly for animated elements */
.animated-element {
  will-change: transform, opacity;
}

/* ❌ Bad - Don't apply to everything! */
* {
  will-change: all;  /* Memory hog! */
}

/* Best practice: Add before animation, remove after */
.card {
  transition: transform 0.3s;
}

.card:hover {
  will-change: transform;
}

.card.animating {
  will-change: transform;
}
```

### contain

Limits browser's scope for style/layout calculations.

```css
.widget {
  /* Layout containment - layout doesn't affect outside */
  contain: layout;
  
  /* Paint containment - painting doesn't affect outside */
  contain: paint;
  
  /* Size containment - size doesn't depend on children */
  contain: size;
  
  /* Strict - all containment */
  contain: strict;  /* size + layout + paint */
  
  /* Content - recommended for components */
  contain: content;  /* layout + paint */
}

/* Use for:
   - Independent widgets
   - Off-screen content
   - Components with many children
   - Virtual scrolling items
*/
```

### Animation Performance Tips

```css
/* ❌ Animating expensive properties */
.bad {
  transition: left 0.3s, width 0.3s;
}
.bad:hover {
  left: 100px;
  width: 200px;
}

/* ✅ Use transforms instead */
.good {
  transition: transform 0.3s;
}
.good:hover {
  transform: translateX(100px) scaleX(1.5);
}

/* ✅ Reduce motion for accessibility */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

---

## Interview Questions

### Q1: What's the difference between transitions and animations?
**Answer:**
- **Transitions**: Require a trigger (hover, class change), only A→B, simpler syntax
- **Animations**: Can auto-run, multiple keyframes, can loop, more control (fill-mode, direction)

### Q2: Explain `transform: translate()` vs changing `top`/`left`.
**Answer:** `transform` is GPU-accelerated and doesn't cause reflow. Changing `top`/`left` triggers layout recalculation for the entire page, which is expensive. Always use transforms for animations.

### Q3: What is `will-change` and when should you use it?
**Answer:** `will-change` hints to the browser that an element will change, allowing optimization (creating a new compositor layer). Use sparingly for animated elements. Overuse consumes memory and can hurt performance.

### Q4: How do CSS variables differ from Sass variables?
**Answer:**
- CSS variables are **runtime** - can be changed with JS, cascade, inherit
- Sass variables are **compile-time** - baked into CSS output, can't change at runtime

### Q5: What is `animation-fill-mode: forwards`?
**Answer:** It keeps the element in its **final keyframe state** after the animation ends. Without it (or with `none`), the element returns to its pre-animation state.

### Q6: What is `backdrop-filter`?
**Answer:** `backdrop-filter` applies filter effects to the area **behind** an element. Used for glassmorphism effects - creating frosted glass appearance.

### Q7: What's the difference between `filter: drop-shadow()` and `box-shadow`?
**Answer:** `box-shadow` creates a shadow based on the rectangular box. `drop-shadow` creates a shadow that follows the actual shape of the element, including transparent areas in images.

### Q8: How would you create a smooth height animation from 0 to auto?
**Answer:** You can't directly transition to `auto`. Solutions:
1. Use `max-height` with a large enough value
2. Use CSS Grid: `grid-template-rows: 0fr` to `1fr`
3. Calculate height with JavaScript

---

## Exercises

### Exercise 1: Loading Spinner
Create a CSS-only loading spinner.

<details>
<summary>Solution</summary>

```css
.spinner {
  width: 50px;
  height: 50px;
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

### Exercise 2: Card Hover Effect
Create a card that lifts and glows on hover.

<details>
<summary>Solution</summary>

```css
.card {
  padding: 24px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  transition: 
    transform 0.3s ease,
    box-shadow 0.3s ease;
}

.card:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
}
```
</details>

### Exercise 3: Staggered Fade-In Animation
Make a list of items fade in one after another.

<details>
<summary>Solution</summary>

```css
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.list-item {
  opacity: 0;
  animation: fadeInUp 0.5s ease forwards;
}

.list-item:nth-child(1) { animation-delay: 0.1s; }
.list-item:nth-child(2) { animation-delay: 0.2s; }
.list-item:nth-child(3) { animation-delay: 0.3s; }
.list-item:nth-child(4) { animation-delay: 0.4s; }

/* Or dynamically with inline style */
/* style="--index: 0" */
.list-item {
  animation-delay: calc(var(--index, 0) * 0.1s);
}
```
</details>

### Exercise 4: Glassmorphism Card
Create a frosted glass effect card.

<details>
<summary>Solution</summary>

```css
.glass-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea, #764ba2);
  display: flex;
  justify-content: center;
  align-items: center;
}

.glass-card {
  padding: 40px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  color: white;
}
```
</details>

---

## Quick Reference

```css
/* ===== TRANSFORMS ===== */
transform: translate(x, y);
transform: rotate(deg);
transform: scale(n);
transform: skew(x, y);
transform-origin: center;

/* ===== TRANSITIONS ===== */
transition: property duration timing-function delay;
transition: transform 0.3s ease;

/* ===== ANIMATIONS ===== */
@keyframes name {
  from { }
  to { }
}
animation: name 1s ease infinite;
animation-fill-mode: forwards;

/* ===== CSS VARIABLES ===== */
:root { --color: blue; }
color: var(--color, fallback);

/* ===== FILTERS ===== */
filter: blur(5px) grayscale(50%);
backdrop-filter: blur(10px);

/* ===== CLIP-PATH ===== */
clip-path: circle(50%);
clip-path: polygon(50% 0%, 100% 100%, 0% 100%);

/* ===== PERFORMANCE ===== */
will-change: transform;
contain: content;
/* Only animate: transform, opacity, filter */
```

---

**Previous:** [03-CSS-Responsive.md](./03-CSS-Responsive.md)  
**Next:** [05-CSS-Architecture.md](./05-CSS-Architecture.md) - CSS Architecture & Best Practices
