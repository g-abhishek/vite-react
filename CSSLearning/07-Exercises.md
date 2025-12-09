# CSS Practical Exercises - Interview Preparation

## Table of Contents
1. [Beginner Exercises](#beginner-exercises)
2. [Intermediate Exercises](#intermediate-exercises)
3. [Advanced Exercises](#advanced-exercises)
4. [Real-World Mini Projects](#real-world-mini-projects)

---

## Beginner Exercises

### Exercise 1: Specificity Calculator

**Task:** Calculate the specificity and determine which color wins.

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
div#main p.text { color: purple; }
```

<details>
<summary>Solution</summary>

| Selector | Calculation | Specificity |
|----------|-------------|-------------|
| `p` | 0 IDs + 0 classes + 1 element | 0,0,1 = 1 |
| `.text` | 0 + 1 + 0 | 0,1,0 = 10 |
| `p.text` | 0 + 1 + 1 | 0,1,1 = 11 |
| `#intro` | 1 + 0 + 0 | 1,0,0 = 100 |
| `.container .text.highlight` | 0 + 3 + 0 | 0,3,0 = 30 |
| `div#main p.text` | 1 + 1 + 2 | 1,1,2 = 112 |

**Winner: PURPLE** (specificity 112)

</details>

---

### Exercise 2: Box Model Calculation

**Task:** Calculate the total space this element occupies.

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

**Width:**
- Content: 300px
- Padding: 20px × 2 = 40px
- Border: 5px × 2 = 10px
- **Total element width: 350px**
- Plus margin: 15px × 2 = 30px
- **Space occupied: 380px**

**Height:**
- Content: 200px
- Padding: 40px
- Border: 10px
- **Total element height: 250px**
- Plus margin: 30px
- **Space occupied: 280px**

**If `box-sizing: border-box`:**
- Width would be 300px (content = 300 - 40 - 10 = 250px)
- Height would be 200px (content = 200 - 40 - 10 = 150px)

</details>

---

### Exercise 3: Style a Button

**Task:** Create a button with:
- 12px vertical, 24px horizontal padding
- Blue (#007bff) background
- White text
- 4px rounded corners
- Darker blue on hover (#0056b3)
- Disabled state (50% opacity, not-allowed cursor)

<details>
<summary>Solution</summary>

```css
.button {
  /* Structure */
  display: inline-block;
  padding: 12px 24px;
  border: none;
  border-radius: 4px;
  
  /* Typography */
  font-size: 16px;
  font-weight: 500;
  text-decoration: none;
  
  /* Visual */
  background-color: #007bff;
  color: white;
  cursor: pointer;
  
  /* Animation */
  transition: background-color 0.2s ease;
}

.button:hover {
  background-color: #0056b3;
}

.button:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.4);
}

.button:active {
  background-color: #004494;
}

.button:disabled,
.button.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}
```

```html
<button class="button">Normal Button</button>
<button class="button" disabled>Disabled Button</button>
```

</details>

---

### Exercise 4: Create a Card Component

**Task:** Build a card with:
- White background
- Rounded corners (8px)
- Shadow
- Image at top
- Title and description
- Consistent padding

<details>
<summary>Solution</summary>

```css
.card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  max-width: 350px;
}

.card__image {
  width: 100%;
  height: 200px;
  object-fit: cover;
}

.card__content {
  padding: 20px;
}

.card__title {
  margin: 0 0 10px;
  font-size: 1.25rem;
  color: #333;
}

.card__description {
  margin: 0;
  color: #666;
  line-height: 1.6;
}

/* Hover effect */
.card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}
```

```html
<article class="card">
  <img class="card__image" src="https://picsum.photos/350/200" alt="Card image">
  <div class="card__content">
    <h3 class="card__title">Card Title</h3>
    <p class="card__description">
      This is a description of the card. It provides more details about the content.
    </p>
  </div>
</article>
```

</details>

---

### Exercise 5: Center an Element (Multiple Ways)

**Task:** Center a 200×200px box both horizontally and vertically using 4 different methods.

<details>
<summary>Solution</summary>

```css
/* Setup */
.container {
  height: 100vh;
  background: #f0f0f0;
}

.box {
  width: 200px;
  height: 200px;
  background: #007bff;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Method 1: Flexbox */
.container-flex {
  display: flex;
  justify-content: center;
  align-items: center;
}

/* Method 2: Grid */
.container-grid {
  display: grid;
  place-items: center;
}

/* Method 3: Absolute + Transform */
.container-absolute {
  position: relative;
}

.container-absolute .box {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

/* Method 4: Absolute + Margin Auto */
.container-margin {
  position: relative;
}

.container-margin .box {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  margin: auto;
}
```

</details>

---

### Exercise 6: Form Input Styling

**Task:** Style a text input with:
- Default state with border
- Focus state with blue border and glow
- Valid state with green border
- Invalid state with red border
- Placeholder styling

<details>
<summary>Solution</summary>

```css
.input {
  /* Structure */
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #ddd;
  border-radius: 6px;
  
  /* Typography */
  font-size: 16px;
  font-family: inherit;
  
  /* Visual */
  background: white;
  outline: none;
  
  /* Animation */
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

/* Placeholder */
.input::placeholder {
  color: #999;
}

/* Focus state */
.input:focus {
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.2);
}

/* Valid state */
.input:valid:not(:placeholder-shown) {
  border-color: #28a745;
}

.input:valid:focus:not(:placeholder-shown) {
  box-shadow: 0 0 0 3px rgba(40, 167, 69, 0.2);
}

/* Invalid state */
.input:invalid:not(:placeholder-shown) {
  border-color: #dc3545;
}

.input:invalid:focus:not(:placeholder-shown) {
  box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.2);
}

/* Disabled state */
.input:disabled {
  background: #f5f5f5;
  cursor: not-allowed;
  opacity: 0.7;
}
```

```html
<input 
  class="input" 
  type="email" 
  placeholder="Enter your email"
  required
>
```

</details>

---

## Intermediate Exercises

### Exercise 7: Responsive Navigation

**Task:** Create a navigation that:
- Shows horizontal menu on desktop
- Collapses to hamburger on mobile
- Has smooth transition

<details>
<summary>Solution</summary>

```css
/* Base styles */
.nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background: #1a1a2e;
}

.nav__logo {
  font-size: 1.5rem;
  font-weight: bold;
  color: white;
  text-decoration: none;
}

/* Hamburger button */
.nav__toggle {
  display: flex;
  flex-direction: column;
  gap: 5px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 5px;
}

.nav__toggle-bar {
  width: 25px;
  height: 3px;
  background: white;
  transition: transform 0.3s, opacity 0.3s;
}

/* Hamburger animation */
.nav__toggle.active .nav__toggle-bar:nth-child(1) {
  transform: rotate(45deg) translate(5px, 5px);
}

.nav__toggle.active .nav__toggle-bar:nth-child(2) {
  opacity: 0;
}

.nav__toggle.active .nav__toggle-bar:nth-child(3) {
  transform: rotate(-45deg) translate(7px, -6px);
}

/* Menu */
.nav__menu {
  position: fixed;
  top: 0;
  right: -100%;
  width: 70%;
  max-width: 300px;
  height: 100vh;
  background: #16213e;
  display: flex;
  flex-direction: column;
  padding: 5rem 2rem;
  gap: 1.5rem;
  transition: right 0.3s ease;
  z-index: 100;
}

.nav__menu.active {
  right: 0;
}

.nav__link {
  color: #ccc;
  text-decoration: none;
  font-size: 1.1rem;
  transition: color 0.2s;
}

.nav__link:hover,
.nav__link.active {
  color: white;
}

/* Overlay */
.nav__overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.3s, visibility 0.3s;
  z-index: 99;
}

.nav__overlay.active {
  opacity: 1;
  visibility: visible;
}

/* Desktop styles */
@media (min-width: 768px) {
  .nav__toggle {
    display: none;
  }
  
  .nav__menu {
    position: static;
    width: auto;
    height: auto;
    background: transparent;
    flex-direction: row;
    padding: 0;
    gap: 2rem;
  }
  
  .nav__overlay {
    display: none;
  }
}
```

```html
<nav class="nav">
  <a href="#" class="nav__logo">Logo</a>
  
  <button class="nav__toggle" id="navToggle">
    <span class="nav__toggle-bar"></span>
    <span class="nav__toggle-bar"></span>
    <span class="nav__toggle-bar"></span>
  </button>
  
  <div class="nav__menu" id="navMenu">
    <a href="#" class="nav__link active">Home</a>
    <a href="#" class="nav__link">About</a>
    <a href="#" class="nav__link">Services</a>
    <a href="#" class="nav__link">Contact</a>
  </div>
  
  <div class="nav__overlay" id="navOverlay"></div>
</nav>
```

```javascript
const toggle = document.getElementById('navToggle');
const menu = document.getElementById('navMenu');
const overlay = document.getElementById('navOverlay');

function toggleNav() {
  toggle.classList.toggle('active');
  menu.classList.toggle('active');
  overlay.classList.toggle('active');
}

toggle.addEventListener('click', toggleNav);
overlay.addEventListener('click', toggleNav);
```

</details>

---

### Exercise 8: Responsive Card Grid

**Task:** Create a grid that:
- 1 column on mobile
- 2 columns on tablet (≥600px)
- 3 columns on desktop (≥900px)
- Uses `auto-fit` for flexibility

<details>
<summary>Solution</summary>

```css
/* Method 1: Media queries */
.card-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
  padding: 24px;
}

@media (min-width: 600px) {
  .card-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 900px) {
  .card-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* Method 2: auto-fit (preferred) */
.card-grid-auto {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
  padding: 24px;
}

/* Card styling */
.card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  transition: transform 0.2s, box-shadow 0.2s;
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.12);
}

.card__image {
  width: 100%;
  height: 180px;
  object-fit: cover;
}

.card__body {
  padding: 20px;
}

.card__title {
  margin: 0 0 8px;
  font-size: 1.125rem;
  color: #333;
}

.card__text {
  margin: 0;
  color: #666;
  line-height: 1.6;
}
```

</details>

---

### Exercise 9: CSS-Only Accordion

**Task:** Build an accordion without JavaScript.

<details>
<summary>Solution</summary>

```css
.accordion {
  max-width: 600px;
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
}

.accordion__item {
  border-bottom: 1px solid #ddd;
}

.accordion__item:last-child {
  border-bottom: none;
}

/* Hide the checkbox */
.accordion__checkbox {
  display: none;
}

/* Header */
.accordion__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: #f8f9fa;
  cursor: pointer;
  font-weight: 600;
  color: #333;
  transition: background 0.2s;
}

.accordion__header:hover {
  background: #e9ecef;
}

/* Icon */
.accordion__icon {
  font-size: 1.25rem;
  transition: transform 0.3s;
}

/* Content */
.accordion__content {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease;
}

.accordion__inner {
  padding: 20px;
  line-height: 1.7;
  color: #555;
}

/* Checked state */
.accordion__checkbox:checked + .accordion__header {
  background: #e9ecef;
}

.accordion__checkbox:checked + .accordion__header .accordion__icon {
  transform: rotate(180deg);
}

.accordion__checkbox:checked ~ .accordion__content {
  max-height: 300px;
}
```

```html
<div class="accordion">
  <div class="accordion__item">
    <input type="checkbox" id="acc1" class="accordion__checkbox">
    <label for="acc1" class="accordion__header">
      <span>Section 1: Getting Started</span>
      <span class="accordion__icon">▼</span>
    </label>
    <div class="accordion__content">
      <div class="accordion__inner">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
        Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
      </div>
    </div>
  </div>
  
  <div class="accordion__item">
    <input type="checkbox" id="acc2" class="accordion__checkbox">
    <label for="acc2" class="accordion__header">
      <span>Section 2: Advanced Topics</span>
      <span class="accordion__icon">▼</span>
    </label>
    <div class="accordion__content">
      <div class="accordion__inner">
        Ut enim ad minim veniam, quis nostrud exercitation ullamco 
        laboris nisi ut aliquip ex ea commodo consequat.
      </div>
    </div>
  </div>
</div>
```

</details>

---

### Exercise 10: Loading Spinners (3 Types)

**Task:** Create 3 different loading animations.

<details>
<summary>Solution</summary>

```css
/* 1. Circle Spinner */
.spinner-circle {
  width: 50px;
  height: 50px;
  border: 4px solid #f3f3f3;
  border-top-color: #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 2. Bouncing Dots */
.spinner-dots {
  display: flex;
  gap: 8px;
}

.spinner-dots__dot {
  width: 14px;
  height: 14px;
  background: #3498db;
  border-radius: 50%;
  animation: bounce 1.4s ease-in-out infinite;
}

.spinner-dots__dot:nth-child(1) { animation-delay: -0.32s; }
.spinner-dots__dot:nth-child(2) { animation-delay: -0.16s; }

@keyframes bounce {
  0%, 80%, 100% {
    transform: scale(0);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

/* 3. Pulse Ring */
.spinner-pulse {
  width: 50px;
  height: 50px;
  position: relative;
}

.spinner-pulse::before,
.spinner-pulse::after {
  content: '';
  position: absolute;
  inset: 0;
  border: 4px solid #3498db;
  border-radius: 50%;
  animation: pulse 2s ease-out infinite;
}

.spinner-pulse::after {
  animation-delay: 1s;
}

@keyframes pulse {
  0% {
    transform: scale(0.5);
    opacity: 1;
  }
  100% {
    transform: scale(1.5);
    opacity: 0;
  }
}
```

```html
<!-- Circle Spinner -->
<div class="spinner-circle"></div>

<!-- Bouncing Dots -->
<div class="spinner-dots">
  <div class="spinner-dots__dot"></div>
  <div class="spinner-dots__dot"></div>
  <div class="spinner-dots__dot"></div>
</div>

<!-- Pulse Ring -->
<div class="spinner-pulse"></div>
```

</details>

---

### Exercise 11: Tooltip with Arrow

**Task:** Create a tooltip with an arrow pointer.

<details>
<summary>Solution</summary>

```css
.tooltip {
  position: relative;
  display: inline-block;
  cursor: help;
}

/* Tooltip box */
.tooltip::after {
  content: attr(data-tooltip);
  position: absolute;
  bottom: calc(100% + 10px);
  left: 50%;
  transform: translateX(-50%);
  padding: 10px 14px;
  background: #333;
  color: white;
  font-size: 14px;
  border-radius: 6px;
  white-space: nowrap;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.2s, visibility 0.2s;
  z-index: 100;
}

/* Arrow */
.tooltip::before {
  content: '';
  position: absolute;
  bottom: calc(100% + 2px);
  left: 50%;
  transform: translateX(-50%);
  border: 8px solid transparent;
  border-top-color: #333;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.2s, visibility 0.2s;
  z-index: 100;
}

/* Show on hover */
.tooltip:hover::before,
.tooltip:hover::after {
  opacity: 1;
  visibility: visible;
}

/* Bottom tooltip */
.tooltip--bottom::after {
  bottom: auto;
  top: calc(100% + 10px);
}

.tooltip--bottom::before {
  bottom: auto;
  top: calc(100% + 2px);
  border-top-color: transparent;
  border-bottom-color: #333;
}
```

```html
<span class="tooltip" data-tooltip="This is a tooltip!">
  Hover me (top)
</span>

<span class="tooltip tooltip--bottom" data-tooltip="Bottom tooltip">
  Hover me (bottom)
</span>
```

</details>

---

## Advanced Exercises

### Exercise 12: Card Flip Animation

**Task:** Create a card that flips to reveal back content on hover.

<details>
<summary>Solution</summary>

```css
.flip-card {
  width: 300px;
  height: 400px;
  perspective: 1000px;
}

.flip-card__inner {
  width: 100%;
  height: 100%;
  position: relative;
  transform-style: preserve-3d;
  transition: transform 0.6s;
}

.flip-card:hover .flip-card__inner {
  transform: rotateY(180deg);
}

.flip-card__front,
.flip-card__back {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 30px;
  border-radius: 16px;
  text-align: center;
}

.flip-card__front {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.flip-card__back {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
  transform: rotateY(180deg);
}

.flip-card__title {
  font-size: 1.75rem;
  margin-bottom: 15px;
}

.flip-card__text {
  font-size: 1rem;
  line-height: 1.6;
  opacity: 0.9;
}
```

```html
<div class="flip-card">
  <div class="flip-card__inner">
    <div class="flip-card__front">
      <h3 class="flip-card__title">Front Side</h3>
      <p class="flip-card__text">Hover to see more!</p>
    </div>
    <div class="flip-card__back">
      <h3 class="flip-card__title">Back Side</h3>
      <p class="flip-card__text">Here's the hidden content that appears when you flip the card.</p>
    </div>
  </div>
</div>
```

</details>

---

### Exercise 13: Dark Mode System

**Task:** Implement dark mode with CSS variables and toggle.

<details>
<summary>Solution</summary>

```css
/* Light theme (default) */
:root {
  --bg-primary: #ffffff;
  --bg-secondary: #f5f5f5;
  --text-primary: #1a1a1a;
  --text-secondary: #666666;
  --accent: #007bff;
  --border: #e0e0e0;
  --shadow: rgba(0, 0, 0, 0.1);
}

/* Dark theme */
[data-theme="dark"] {
  --bg-primary: #1a1a2e;
  --bg-secondary: #16213e;
  --text-primary: #eaeaea;
  --text-secondary: #b0b0b0;
  --accent: #4dabf7;
  --border: #2d3748;
  --shadow: rgba(0, 0, 0, 0.3);
}

/* Apply variables */
body {
  background-color: var(--bg-primary);
  color: var(--text-primary);
  transition: background-color 0.3s, color 0.3s;
}

.card {
  background-color: var(--bg-secondary);
  border: 1px solid var(--border);
  box-shadow: 0 2px 10px var(--shadow);
}

/* Theme toggle button */
.theme-toggle {
  --size: 60px;
  width: var(--size);
  height: calc(var(--size) / 2);
  background: var(--bg-secondary);
  border: 2px solid var(--border);
  border-radius: 999px;
  position: relative;
  cursor: pointer;
  transition: background 0.3s, border-color 0.3s;
}

.theme-toggle__thumb {
  position: absolute;
  width: calc(var(--size) / 2 - 8px);
  height: calc(var(--size) / 2 - 8px);
  background: var(--accent);
  border-radius: 50%;
  top: 2px;
  left: 2px;
  transition: left 0.3s;
}

[data-theme="dark"] .theme-toggle__thumb {
  left: calc(var(--size) / 2 + 2px);
}

.theme-toggle__icon {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  font-size: 12px;
}

.theme-toggle__icon--sun {
  left: 6px;
}

.theme-toggle__icon--moon {
  right: 6px;
}
```

```html
<button class="theme-toggle" onclick="toggleTheme()">
  <span class="theme-toggle__icon theme-toggle__icon--sun">☀️</span>
  <span class="theme-toggle__icon theme-toggle__icon--moon">🌙</span>
  <span class="theme-toggle__thumb"></span>
</button>
```

```javascript
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

</details>

---

### Exercise 14: Glassmorphism Card

**Task:** Create a frosted glass effect card.

<details>
<summary>Solution</summary>

```css
.glass-container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f5576c 100%);
  padding: 20px;
}

.glass-card {
  max-width: 400px;
  padding: 40px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  color: white;
}

.glass-card__title {
  font-size: 2rem;
  margin: 0 0 20px;
  font-weight: 600;
}

.glass-card__text {
  font-size: 1rem;
  line-height: 1.8;
  margin: 0 0 30px;
  opacity: 0.9;
}

.glass-card__button {
  display: inline-block;
  padding: 14px 28px;
  background: rgba(255, 255, 255, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 10px;
  color: white;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s, transform 0.2s;
}

.glass-card__button:hover {
  background: rgba(255, 255, 255, 0.35);
  transform: translateY(-2px);
}
```

```html
<div class="glass-container">
  <div class="glass-card">
    <h2 class="glass-card__title">Glassmorphism</h2>
    <p class="glass-card__text">
      This is a beautiful frosted glass effect using CSS backdrop-filter. 
      It creates a modern, elegant UI design.
    </p>
    <button class="glass-card__button">Learn More</button>
  </div>
</div>
```

</details>

---

### Exercise 15: Skeleton Loading

**Task:** Create skeleton loading placeholder with shimmer effect.

<details>
<summary>Solution</summary>

```css
.skeleton {
  background: #e2e5e7;
  background-image: linear-gradient(
    90deg,
    #e2e5e7 0%,
    #f0f2f4 50%,
    #e2e5e7 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 4px;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* Skeleton card */
.skeleton-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
}

.skeleton-card__image {
  width: 100%;
  height: 200px;
  margin-bottom: 20px;
  border-radius: 8px;
}

.skeleton-card__title {
  height: 28px;
  width: 70%;
  margin-bottom: 15px;
}

.skeleton-card__text {
  height: 16px;
  margin-bottom: 10px;
}

.skeleton-card__text:last-child {
  width: 50%;
  margin-bottom: 0;
}

/* Skeleton avatar */
.skeleton-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
}

/* Skeleton button */
.skeleton-button {
  width: 120px;
  height: 40px;
  border-radius: 6px;
}
```

```html
<div class="skeleton-card">
  <div class="skeleton skeleton-card__image"></div>
  <div class="skeleton skeleton-card__title"></div>
  <div class="skeleton skeleton-card__text"></div>
  <div class="skeleton skeleton-card__text"></div>
  <div class="skeleton skeleton-card__text"></div>
</div>
```

</details>

---

## Real-World Mini Projects

### Project 1: Pricing Table

Build a responsive pricing table with 3 tiers and a "featured" plan.

### Project 2: Dashboard Sidebar

Create a collapsible sidebar navigation for a dashboard.

### Project 3: Image Gallery

Build a responsive masonry-style image gallery with lightbox effect.

### Project 4: Testimonial Slider

Create a CSS-only testimonial slider with smooth transitions.

### Project 5: Login/Signup Form

Design a beautiful, animated login form with validation states.

---

## Tips for Practice

1. **Start with HTML structure** - Plan your markup before CSS
2. **Use BEM naming** - Keeps your code organized
3. **Mobile-first approach** - Start with mobile styles
4. **Test across browsers** - Use browser DevTools
5. **Inspect existing sites** - Learn from well-designed websites
6. **Practice daily** - Consistency is key
7. **Build real projects** - Apply what you learn

---

## Resources for More Practice

- [CSSBattle](https://cssbattle.dev) - CSS code golfing
- [Frontend Mentor](https://frontendmentor.io) - Real-world projects
- [100 Days CSS](https://100dayscss.com) - Daily CSS challenges
- [Codepen](https://codepen.io) - Inspiration and experiments
- [CSS Diner](https://flukeout.github.io) - Learn selectors
- [Flexbox Froggy](https://flexboxfroggy.com) - Learn Flexbox
- [Grid Garden](https://cssgridgarden.com) - Learn Grid

---

**Good luck with your CSS journey!** 🚀

**Back to:** [README.md](./README.md)
