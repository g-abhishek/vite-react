# CSS Architecture & Best Practices - Interview Preparation Guide

## Table of Contents
1. [Why CSS Architecture Matters](#why-css-architecture-matters)
2. [BEM Methodology](#bem-methodology)
3. [OOCSS](#oocss)
4. [SMACSS](#smacss)
5. [ITCSS](#itcss)
6. [CSS-in-JS](#css-in-js)
7. [CSS Modules](#css-modules)
8. [Utility-First CSS (Tailwind)](#utility-first-css)
9. [Best Practices](#best-practices)
10. [Performance Optimization](#performance-optimization)
11. [Interview Questions](#interview-questions)

---

## Why CSS Architecture Matters

### The Problem with Unstructured CSS

```css
/* Without architecture - "CSS soup" */

/* styles.css - 3000 lines of chaos */
.header { ... }
#nav ul li a { ... }
.btn { ... }
.button { ... }           /* Wait, is this different from .btn? */
.card { ... }
.sidebar .card { ... }    /* Specificity war begins! */
#main .content .card { ... }  /* Even more specific! */
.card { ... !important }  /* Nuclear option... */
```

**Problems that arise:**

```
1. SPECIFICITY WARS
   .card { color: blue; }                     → Specificity: 10
   .sidebar .card { color: red; }             → Specificity: 20
   #main .sidebar .card { color: green; }     → Specificity: 120
   .card { color: purple !important; }        → CHAOS

2. UNPREDICTABLE SIDE EFFECTS
   Changed .btn → Broke 15 pages
   Why? Other devs were relying on it!

3. NAMING COLLISIONS
   Your .card vs someone else's .card = confusion

4. DEAD CODE ACCUMULATION
   Is .old-header-style still used?
   Who knows... better keep it just in case!
```

### What Good Architecture Provides

```
✅ Predictable - You know what will happen when you change something
✅ Reusable - Components work anywhere they're placed
✅ Maintainable - Easy to find and update styles
✅ Scalable - Works whether you have 10 or 10,000 components
✅ Self-documenting - Class names explain what they do
```

---

## BEM Methodology

**BEM = Block, Element, Modifier** - The most popular CSS naming convention.

### The Structure

```
.block                    → Standalone component
.block__element           → Part of block (double underscore)
.block--modifier          → Variation of block (double hyphen)
.block__element--modifier → Variation of element
```

### Block

A **standalone** component that is meaningful on its own.

```css
/* Blocks - independent components */
.card { }
.header { }
.navigation { }
.search-form { }
.social-links { }
.user-profile { }
```

### Element

A **part** of a block that has no standalone meaning.

```css
/* Elements - always inside a block */
.card__title { }       /* Title inside card */
.card__image { }       /* Image inside card */
.card__content { }     /* Content area inside card */
.card__footer { }      /* Footer inside card */

.navigation__item { }  /* Item in navigation */
.navigation__link { }  /* Link in navigation */

.search-form__input { }
.search-form__button { }
```

### Modifier

A **flag** that changes appearance or behavior.

```css
/* Block modifiers */
.card--featured { }      /* Featured version of card */
.card--horizontal { }    /* Horizontal layout variant */
.card--compact { }       /* Smaller version */

.button--primary { }     /* Primary button */
.button--large { }       /* Large button */
.button--disabled { }    /* Disabled state */

/* Element modifiers */
.card__title--large { }  /* Large title */
.navigation__link--active { }
```

### Complete BEM Example

```html
<!-- Card Block -->
<article class="card card--featured">
  <img class="card__image" src="..." alt="...">
  
  <div class="card__content">
    <h2 class="card__title card__title--large">Featured Article</h2>
    <p class="card__description">Description text here...</p>
    <span class="card__tag">Technology</span>
  </div>
  
  <div class="card__footer">
    <span class="card__author">John Doe</span>
    <button class="card__button card__button--primary">Read More</button>
  </div>
</article>
```

```css
/* Block */
.card {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

/* Block modifier */
.card--featured {
  border: 2px solid gold;
  box-shadow: 0 4px 20px rgba(255, 215, 0, 0.3);
}

.card--horizontal {
  display: flex;
}

/* Elements */
.card__image {
  width: 100%;
  height: 200px;
  object-fit: cover;
}

.card--horizontal .card__image {
  width: 40%;
  height: auto;
}

.card__content {
  padding: 20px;
}

.card__title {
  margin: 0 0 10px;
  font-size: 1.25rem;
  color: #333;
}

.card__title--large {
  font-size: 1.5rem;
}

.card__description {
  color: #666;
  line-height: 1.6;
}

.card__footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-top: 1px solid #eee;
}

.card__button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.card__button--primary {
  background: #007bff;
  color: white;
}
```

### BEM Rules and Tips

```css
/* ✅ CORRECT BEM */
.block { }
.block__element { }
.block--modifier { }

/* ❌ DON'T chain elements */
.card__content__title { }     /* Wrong! */
.card__title { }              /* Correct */

/* ❌ DON'T use element without block context */
.__element { }                /* Wrong! */

/* ❌ DON'T use modifiers alone */
.--modifier { }               /* Wrong! */

/* ✅ Multiple modifiers are OK */
<button class="button button--primary button--large button--rounded">

/* ✅ Mix blocks */
<nav class="nav">
  <a class="nav__link button button--small">Link</a>
</nav>
```

### BEM with Preprocessors (Sass)

```scss
// Clean nesting with Sass
.card {
  background: white;
  border-radius: 8px;
  
  &--featured {
    border: 2px solid gold;
  }
  
  &--horizontal {
    display: flex;
  }
  
  &__image {
    width: 100%;
    height: 200px;
    object-fit: cover;
  }
  
  &__title {
    font-size: 1.25rem;
    
    &--large {
      font-size: 1.5rem;
    }
  }
  
  &__button {
    padding: 8px 16px;
    
    &--primary {
      background: #007bff;
      color: white;
    }
  }
}
```

---

## OOCSS

**OOCSS = Object-Oriented CSS** - Separate structure from skin, container from content.

### Principle 1: Separate Structure from Skin

```css
/* ❌ WITHOUT OOCSS - Repetition */
.button-primary {
  display: inline-block;
  padding: 10px 20px;
  border-radius: 4px;
  font-weight: bold;
  background: blue;
  color: white;
}

.button-secondary {
  display: inline-block;
  padding: 10px 20px;
  border-radius: 4px;
  font-weight: bold;
  background: gray;
  color: white;
}

.button-danger {
  display: inline-block;
  padding: 10px 20px;
  border-radius: 4px;
  font-weight: bold;
  background: red;
  color: white;
}
```

```css
/* ✅ WITH OOCSS - Separated */

/* Structure (how it's built) */
.button {
  display: inline-block;
  padding: 10px 20px;
  border-radius: 4px;
  font-weight: bold;
  border: none;
  cursor: pointer;
}

/* Skin (how it looks) */
.button-primary {
  background: blue;
  color: white;
}

.button-secondary {
  background: gray;
  color: white;
}

.button-danger {
  background: red;
  color: white;
}
```

```html
<!-- Usage -->
<button class="button button-primary">Primary</button>
<button class="button button-secondary">Secondary</button>
<button class="button button-danger">Delete</button>
```

### Principle 2: Separate Container from Content

```css
/* ❌ WITHOUT OOCSS - Content depends on location */
.sidebar h2 {
  font-size: 1.25rem;
  font-weight: bold;
  color: #333;
}

.main-content h2 {
  font-size: 1.5rem;
  font-weight: bold;
  color: #333;
}

.footer h2 {
  font-size: 1rem;
  font-weight: bold;
  color: #666;
}
```

```css
/* ✅ WITH OOCSS - Content is independent */
.heading {
  font-weight: bold;
}

.heading-lg {
  font-size: 1.5rem;
  color: #333;
}

.heading-md {
  font-size: 1.25rem;
  color: #333;
}

.heading-sm {
  font-size: 1rem;
  color: #666;
}
```

```html
<!-- Same heading class works anywhere -->
<aside class="sidebar">
  <h2 class="heading heading-md">Sidebar Title</h2>
</aside>

<main class="main-content">
  <h2 class="heading heading-lg">Main Title</h2>
</main>

<footer>
  <h2 class="heading heading-sm">Footer Title</h2>
</footer>
```

### The Media Object Pattern

The most famous OOCSS pattern - used for comments, feeds, listings, etc.

```css
/* The media object */
.media {
  display: flex;
  align-items: flex-start;
}

.media__image {
  flex-shrink: 0;
  margin-right: 1rem;
}

.media__body {
  flex-grow: 1;
}

/* Modifiers */
.media--center {
  align-items: center;
}

.media--reverse {
  flex-direction: row-reverse;
}

.media--reverse .media__image {
  margin-right: 0;
  margin-left: 1rem;
}
```

```html
<!-- User comment -->
<div class="media">
  <img class="media__image" src="avatar.jpg" alt="User">
  <div class="media__body">
    <h4>Username</h4>
    <p>Comment text here...</p>
  </div>
</div>

<!-- Product listing -->
<div class="media media--center">
  <img class="media__image" src="product.jpg" alt="Product">
  <div class="media__body">
    <h4>Product Name</h4>
    <p>$99.99</p>
  </div>
</div>
```

---

## SMACSS

**SMACSS = Scalable and Modular Architecture for CSS** - Categorize your CSS rules.

### The Five Categories

```
1. BASE      → Default element styles (no classes)
2. LAYOUT    → Page structure (prefix: l-)
3. MODULE    → Reusable components
4. STATE     → Variations/conditions (prefix: is-)
5. THEME     → Visual themes (prefix: theme-)
```

### 1. Base Rules

Default styles for elements - no classes!

```css
/* Base rules - element selectors only */
*, *::before, *::after {
  box-sizing: border-box;
}

html {
  font-size: 16px;
  line-height: 1.5;
}

body {
  margin: 0;
  font-family: -apple-system, sans-serif;
  color: #333;
  background: #fff;
}

h1, h2, h3, h4, h5, h6 {
  margin-top: 0;
  line-height: 1.2;
}

a {
  color: #007bff;
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

img {
  max-width: 100%;
  height: auto;
  display: block;
}

ul, ol {
  padding-left: 1.5rem;
}
```

### 2. Layout Rules

Major page sections - prefixed with `l-`.

```css
/* Layout rules - page structure */
.l-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 60px;
  z-index: 100;
}

.l-main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 80px 20px 40px;
}

.l-sidebar {
  width: 250px;
  position: sticky;
  top: 80px;
}

.l-content {
  flex: 1;
  min-width: 0;
}

.l-footer {
  background: #333;
  color: white;
  padding: 40px 20px;
}

/* Layout modifiers */
.l-main--full {
  max-width: none;
}

.l-main--narrow {
  max-width: 800px;
}

/* Layout grid */
.l-grid {
  display: grid;
  gap: 20px;
}

.l-grid--2-col {
  grid-template-columns: repeat(2, 1fr);
}

.l-grid--3-col {
  grid-template-columns: repeat(3, 1fr);
}
```

### 3. Module Rules

Reusable, standalone components.

```css
/* Module: Card */
.card {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.card-header {
  padding: 15px 20px;
  border-bottom: 1px solid #eee;
}

.card-body {
  padding: 20px;
}

.card-footer {
  padding: 15px 20px;
  border-top: 1px solid #eee;
}

/* Module: Navigation */
.nav {
  display: flex;
  gap: 20px;
}

.nav-item {
  color: #333;
  text-decoration: none;
  padding: 10px 0;
}

/* Module: Button */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}
```

### 4. State Rules

Dynamic states - prefixed with `is-`.

```css
/* State rules - conditions and variations */
.is-hidden {
  display: none !important;
}

.is-visible {
  display: block !important;
}

.is-active {
  background: #007bff;
  color: white;
}

.is-disabled {
  opacity: 0.5;
  pointer-events: none;
  cursor: not-allowed;
}

.is-loading {
  position: relative;
  color: transparent;
}

.is-loading::after {
  content: '';
  position: absolute;
  /* Spinner styles */
}

.is-error {
  border-color: #dc3545;
  color: #dc3545;
}

.is-success {
  border-color: #28a745;
  color: #28a745;
}

.is-collapsed {
  max-height: 0;
  overflow: hidden;
}

.is-expanded {
  max-height: 1000px;
}

/* State combined with modules */
.nav-item.is-active {
  font-weight: bold;
  border-bottom: 2px solid #007bff;
}

.btn.is-loading {
  /* Button loading state */
}
```

### 5. Theme Rules

Visual themes - prefixed with `theme-`.

```css
/* Theme rules - visual variations */
.theme-dark {
  --bg-primary: #1a1a2e;
  --bg-secondary: #16213e;
  --text-primary: #eaeaea;
  --text-secondary: #b0b0b0;
  --accent: #4dabf7;
}

.theme-light {
  --bg-primary: #ffffff;
  --bg-secondary: #f5f5f5;
  --text-primary: #333333;
  --text-secondary: #666666;
  --accent: #007bff;
}

/* Theme-specific overrides */
.theme-dark .card {
  background: var(--bg-secondary);
  border: 1px solid #2d3748;
}

.theme-dark .btn-primary {
  background: var(--accent);
}
```

### SMACSS File Structure

```
styles/
├── base/
│   ├── _reset.scss
│   ├── _typography.scss
│   └── _base.scss
├── layout/
│   ├── _header.scss
│   ├── _footer.scss
│   ├── _sidebar.scss
│   └── _grid.scss
├── modules/
│   ├── _card.scss
│   ├── _button.scss
│   ├── _nav.scss
│   ├── _form.scss
│   └── _modal.scss
├── state/
│   └── _states.scss
├── theme/
│   ├── _light.scss
│   └── _dark.scss
└── main.scss
```

---

## ITCSS

**ITCSS = Inverted Triangle CSS** - Organize CSS by specificity.

```
         ╱ Settings  - Variables, config
        ╱  Tools     - Mixins, functions
       ╱   Generic   - Reset, normalize
      ╱    Elements  - Base HTML elements
     ╱     Objects   - Design patterns (OOCSS)
    ╱      Components - UI components
   ╱       Utilities  - Helper classes
  ╱
 ───────────────────────────────────────→ Specificity increases
 ───────────────────────────────────────→ Explicitness increases
 ←─────────────────────────────────────── Reach decreases
```

Each layer is more specific than the last, avoiding specificity conflicts.

---

## CSS-in-JS

Writing CSS in JavaScript files - popular in React ecosystem.

### Styled Components (React)

```jsx
import styled from 'styled-components';

// Create styled components
const Button = styled.button`
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  background: ${props => props.primary ? '#007bff' : '#6c757d'};
  color: white;
  cursor: pointer;
  transition: background 0.2s;
  
  &:hover {
    background: ${props => props.primary ? '#0056b3' : '#5a6268'};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Card = styled.div`
  padding: ${props => props.compact ? '12px' : '24px'};
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
`;

// Usage
function App() {
  return (
    <Card>
      <h2>Card Title</h2>
      <Button primary>Primary Button</Button>
      <Button>Secondary Button</Button>
      <Button disabled>Disabled</Button>
    </Card>
  );
}
```

### CSS-in-JS Pros & Cons

| Pros | Cons |
|------|------|
| ✅ Scoped styles (no conflicts) | ❌ Runtime overhead |
| ✅ Dynamic styling with props | ❌ Larger bundle size |
| ✅ Co-located with components | ❌ Learning curve |
| ✅ Dead code elimination | ❌ Harder to debug |
| ✅ TypeScript support | ❌ SSR complexity |
| ✅ Theming built-in | ❌ Different mental model |

---

## CSS Modules

Automatic class name scoping - popular in React/Vue.

### How It Works

```css
/* Button.module.css */
.button {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
}

.primary {
  background: #007bff;
  color: white;
}

.secondary {
  background: #6c757d;
  color: white;
}
```

```jsx
// Button.jsx
import styles from './Button.module.css';

function Button({ variant = 'primary', children }) {
  return (
    <button className={`${styles.button} ${styles[variant]}`}>
      {children}
    </button>
  );
}

// Rendered HTML:
// <button class="Button_button_x7f32 Button_primary_a9d21">
```

### Composition in CSS Modules

```css
/* styles.module.css */
.base {
  padding: 10px 20px;
  border-radius: 4px;
  font-weight: 500;
}

.primary {
  composes: base;  /* Inherits from base */
  background: #007bff;
  color: white;
}

.secondary {
  composes: base;
  background: #6c757d;
  color: white;
}
```

---

## Utility-First CSS

Small, single-purpose classes (Tailwind CSS approach).

### The Concept

```html
<!-- Traditional CSS -->
<div class="card">
  <h2 class="card-title">Title</h2>
  <p class="card-text">Content</p>
</div>

<!-- Utility-First (Tailwind) -->
<div class="bg-white rounded-lg shadow-md p-6">
  <h2 class="text-xl font-bold text-gray-900 mb-2">Title</h2>
  <p class="text-gray-600 leading-relaxed">Content</p>
</div>
```

### Building Components with Utilities

```html
<!-- Card Component -->
<div class="max-w-sm mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
  <img class="w-full h-48 object-cover" src="..." alt="...">
  <div class="p-6">
    <span class="text-xs font-semibold text-blue-600 uppercase">Category</span>
    <h2 class="mt-2 text-xl font-bold text-gray-900">Card Title</h2>
    <p class="mt-2 text-gray-600">Card description goes here...</p>
    <button class="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
      Read More
    </button>
  </div>
</div>

<!-- Button Variants -->
<button class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
  Primary
</button>
<button class="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300">
  Secondary
</button>
<button class="px-4 py-2 border-2 border-blue-600 text-blue-600 rounded hover:bg-blue-50">
  Outline
</button>
```

### Utility-First Pros & Cons

| Pros | Cons |
|------|------|
| ✅ Rapid development | ❌ Long class strings |
| ✅ No naming decisions | ❌ HTML can look messy |
| ✅ Small production CSS (purged) | ❌ Learning curve |
| ✅ Consistent design system | ❌ Less semantic |
| ✅ Easy to maintain | ❌ Harder to read at first |
| ✅ No dead CSS | ❌ Repetition in markup |

---

## Best Practices

### 1. Naming Conventions

```css
/* ✅ Use meaningful, descriptive names */
.primary-navigation { }
.search-form { }
.user-avatar { }
.article-card { }

/* ❌ Avoid cryptic abbreviations */
.pn { }     /* What's this? */
.sf { }     /* ??? */
.ua { }     /* No idea! */

/* ✅ Use lowercase with hyphens */
.site-header { }
.main-content { }
.footer-links { }

/* ❌ Avoid camelCase or underscores (except BEM) */
.siteHeader { }      /* JavaScript style */
.main_content { }    /* Looks like variable */
```

### 2. Keep Specificity Low

```css
/* ✅ GOOD: Low specificity, easy to override */
.nav-link { }
.nav-link.is-active { }

/* ❌ BAD: High specificity, hard to override */
#header nav ul li a.nav-link { }

/* ✅ GOOD: Use classes, not IDs */
.header { }
.submit-button { }

/* ❌ BAD: IDs for styling */
#header { }
#submitButton { }

/* ✅ GOOD: Single class when possible */
.card { }

/* ❌ BAD: Over-qualified selectors */
div.card { }
article.card.featured { }
```

### 3. Organize Properties Logically

```css
.element {
  /* 1. Positioning */
  position: relative;
  top: 0;
  right: 0;
  z-index: 10;
  
  /* 2. Display & Box Model */
  display: flex;
  align-items: center;
  width: 100%;
  max-width: 500px;
  padding: 20px;
  margin: 0 auto;
  
  /* 3. Typography */
  font-family: sans-serif;
  font-size: 1rem;
  font-weight: 500;
  line-height: 1.5;
  color: #333;
  text-align: center;
  
  /* 4. Visual */
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  
  /* 5. Animation */
  transition: all 0.3s ease;
  animation: fadeIn 0.5s ease;
}
```

### 4. Avoid Magic Numbers

```css
/* ❌ Magic numbers - what do these mean? */
.element {
  top: 37px;
  left: 83px;
  width: 754px;
}

/* ✅ Use meaningful values or variables */
:root {
  --header-height: 60px;
  --sidebar-width: 250px;
  --spacing-unit: 8px;
}

.element {
  top: var(--header-height);
  width: calc(100% - var(--sidebar-width));
  padding: calc(var(--spacing-unit) * 2);  /* 16px */
}
```

### 5. Comment Complex Code

```css
/**
 * Card Component
 * 
 * A flexible card for displaying content.
 * 
 * Variants:
 * .card--featured   - Highlighted with gold border
 * .card--horizontal - Side-by-side layout
 * .card--compact    - Reduced padding
 */
.card {
  /* ... */
}

/* Offset for fixed header */
.main-content {
  margin-top: 60px;  /* = header height */
}

/* TODO: Refactor to use CSS Grid */
/* FIXME: Safari rendering bug with transform */
/* HACK: Temporary fix for IE11 */
```

---

## Performance Optimization

### 1. Selector Performance

```css
/* ❌ SLOW: Browser reads right to left! */
body div.container ul.menu li a.link { }
/* Browser must check every <a>, then every <li>, etc. */

/* ✅ FAST: Single class selector */
.menu-link { }
```

### 2. Avoid Expensive Properties

```css
/* ❌ EXPENSIVE: Trigger layout recalculation */
.animate-bad {
  transition: width 0.3s, height 0.3s, margin 0.3s;
}

/* ✅ CHEAP: GPU-accelerated */
.animate-good {
  transition: transform 0.3s, opacity 0.3s;
}

/* Use transform instead of position */
.move-bad { left: 100px; }      /* Reflow! */
.move-good { transform: translateX(100px); }  /* Composite only */
```

### 3. Reduce CSS File Size

```css
/* ✅ Use shorthand properties */
.element {
  margin: 10px 20px;                    /* Instead of 4 properties */
  background: white url(...) no-repeat; /* Combined */
  font: 500 1rem/1.5 sans-serif;       /* font shorthand */
}

/* ✅ Use CSS variables for repeated values */
:root {
  --shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.card { box-shadow: var(--shadow); }
.modal { box-shadow: var(--shadow); }
.dropdown { box-shadow: var(--shadow); }
```

### 4. Critical CSS

```html
<head>
  <!-- Inline critical CSS for above-the-fold content -->
  <style>
    .header { /* ... */ }
    .hero { /* ... */ }
    .nav { /* ... */ }
  </style>
  
  <!-- Load rest asynchronously -->
  <link rel="preload" href="styles.css" as="style" 
        onload="this.onload=null;this.rel='stylesheet'">
  <noscript><link rel="stylesheet" href="styles.css"></noscript>
</head>
```

### 5. Use CSS Containment

```css
.widget {
  contain: layout style paint;  /* Isolates calculations */
}

.card {
  contain: content;  /* layout + paint */
}
```

---

## Interview Questions

### Q1: What is BEM and why would you use it?
**Answer:** BEM (Block, Element, Modifier) is a CSS naming convention that creates reusable, maintainable CSS. It uses `.block__element--modifier` syntax. Benefits:
- Predictable naming - you know what classes mean
- No specificity conflicts - flat structure
- Self-documenting - class names explain purpose
- Easy to understand - structure is visible in HTML

### Q2: How do you handle CSS specificity issues?
**Answer:**
1. Use a methodology like BEM to keep specificity low and flat
2. Avoid ID selectors for styling
3. Avoid !important (except for utilities)
4. Use single class selectors when possible
5. Order CSS properly: base → components → utilities

### Q3: What's the difference between CSS-in-JS and CSS Modules?
**Answer:**
- **CSS-in-JS**: Write CSS in JavaScript, computed at runtime, more dynamic, larger bundle
- **CSS Modules**: Regular CSS files with automatic scoping at build time, no runtime cost

### Q4: What are the pros and cons of utility-first CSS?
**Answer:**
**Pros**: Rapid development, no naming, consistent design, small production CSS
**Cons**: Long class names, HTML looks messy, learning curve, less semantic

### Q5: How do you organize CSS in a large project?
**Answer:** Use a methodology like SMACSS or ITCSS:
- Separate by concerns (base, layout, components, utilities)
- Use consistent naming (BEM)
- Split into multiple files
- Document with comments
- Use a preprocessor or CSS Modules for maintainability

### Q6: What is OOCSS?
**Answer:** Object-Oriented CSS has two principles:
1. **Separate structure from skin** - Reuse structural patterns, vary visual styles
2. **Separate container from content** - Content doesn't depend on location

### Q7: How do you optimize CSS performance?
**Answer:**
1. Keep selectors simple (single class ideal)
2. Use transform/opacity for animations
3. Inline critical CSS
4. Remove unused CSS (PurgeCSS)
5. Minify CSS
6. Avoid @import
7. Use CSS containment

---

## Quick Reference

```css
/* ===== BEM NAMING ===== */
.block { }
.block__element { }
.block--modifier { }
.block__element--modifier { }

/* ===== SMACSS PREFIXES ===== */
.l-layout { }      /* Layout */
.is-state { }      /* State */
.theme-name { }    /* Theme */

/* ===== PROPERTY ORDER ===== */
/* 1. Positioning */
/* 2. Display & Box Model */
/* 3. Typography */
/* 4. Visual */
/* 5. Animation */

/* ===== SPECIFICITY ===== */
/* Keep it flat! */
.selector { }        /* Good: 0,0,1,0 */
.parent .child { }   /* OK: 0,0,2,0 */
#id .class { }       /* Avoid: 0,1,1,0 */

/* ===== PERFORMANCE ===== */
transform: translateX(100px);  /* ✅ */
left: 100px;                   /* ❌ */
```

---

**Previous:** [04-CSS-Advanced.md](./04-CSS-Advanced.md)  
**Next:** [06-CSS-Interview-Questions.md](./06-CSS-Interview-Questions.md) - Comprehensive Interview Questions
