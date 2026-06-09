# React Interview — Complete Guide (Basics to Senior)

> A senior-level React interview playbook: fundamentals through concurrent React, state architecture, performance, testing, SSR/RSC, system design, and live-coding patterns — written for 5+ years FE/fullstack roles.

**Companion doc:** For Fiber, reconciliation internals, and hook linked-list mechanics, see [`04-React-Internals.md`](./04-React-Internals.md). This guide focuses on **what interviewers ask**, **how to answer**, and **runnable patterns** you can whiteboard or code in 30–45 minutes.

**How to study:** After each section, answer **Check Your Understanding** questions out loud. The **Reasoning** explains *why* the answer is correct so the concept sticks — not just memorization.

---

## Table of Contents

1. [What is React? — The Real Explanation](#1-what-is-react--the-real-explanation)
2. [Why React Matters — The Problems It Solves](#2-why-react-matters--the-problems-it-solves)
3. [Core Concepts & Mental Models](#3-core-concepts--mental-models)
4. [React Ecosystem Packages — react, react-dom, and Related Libraries](#4-react-ecosystem-packages--react-react-dom-and-related-libraries)
5. [JSX, Elements, and the Render Tree](#5-jsx-elements-and-the-render-tree)
6. [Components — Types, Composition, and Boundaries](#6-components--types-composition-and-boundaries)
7. [Props, State, and Data Flow](#7-props-state-and-data-flow)
8. [Events, Synthetic Events, and Forms](#8-events-synthetic-events-and-forms)
9. [Hooks — Complete Reference for Interviews](#9-hooks--complete-reference-for-interviews)
10. [Class Components & Lifecycle (Legacy but Still Asked)](#10-class-components--lifecycle-legacy-but-still-asked)
11. [Reconciliation, Keys, and Lists](#11-reconciliation-keys-and-lists)
12. [Context API — When and How](#12-context-api--when-and-how)
13. [State Management at Scale](#13-state-management-at-scale)
14. [Side Effects, Data Fetching, and Caching](#14-side-effects-data-fetching-and-caching)
15. [Routing and URL-Driven UI](#15-routing-and-url-driven-ui)
16. [Performance Optimization](#16-performance-optimization)
17. [Concurrent React, Suspense, and Transitions](#17-concurrent-react-suspense-and-transitions)
18. [Server Rendering, Hydration, and React Server Components](#18-server-rendering-hydration-and-react-server-components)
19. [Error Boundaries and Resilience](#19-error-boundaries-and-resilience)
20. [Testing React Applications](#20-testing-react-applications)
21. [TypeScript + React (Senior Expectations)](#21-typescript--react-senior-expectations)
22. [Security, Accessibility, and Production Concerns](#22-security-accessibility-and-production-concerns)
23. [Design Patterns — HOC, Render Props, Compound Components](#23-design-patterns--hoc-render-props-compound-components)
24. [Custom Hooks — Interview-Grade Implementations](#24-custom-hooks--interview-grade-implementations)
25. [Live Coding Problems — Patterns & Solutions](#25-live-coding-problems--patterns--solutions)
26. [Frontend System Design for React Apps](#26-frontend-system-design-for-react-apps)
27. [Behavioral & Architecture Interview Questions](#27-behavioral--architecture-interview-questions)
28. [Advanced Patterns](#28-advanced-patterns)
29. [When to Use What — Decision Guide](#29-when-to-use-what--decision-guide)
30. [Common Pitfalls & How to Avoid Them](#30-common-pitfalls--how-to-avoid-them)
31. [Strict Mode, React 19, and Tooling](#31-strict-mode-react-19-and-tooling)
32. [Senior Interview Question Bank — Model Answers](#32-senior-interview-question-bank--model-answers)

> **Study loop:** Read section → answer **Check Your Understanding** (sections 1–31) without peeking → read **Reasoning** → fix gaps → practice in [`vite-react`](../vite-react/).

---

## 1. What is React? — The Real Explanation

### One sentence

**React is a library for building user interfaces by describing UI as a function of state**, then efficiently updating the real DOM when state changes.

### Before React (the problem)

```
┌─────────────────────────────────────────────────────────────┐
│  jQuery / vanilla DOM era                                    │
├─────────────────────────────────────────────────────────────┤
│  User clicks "Add to cart"                                   │
│       │                                                      │
│       ▼                                                      │
│  You manually: find #cart-count, parse text, increment,      │
│                find #total, recalculate, update badge CSS…   │
│                                                              │
│  State lives in: DOM + global vars + scattered listeners     │
│  Bug pattern: UI out of sync with "real" application state   │
└─────────────────────────────────────────────────────────────┘
```

Every feature doubles the number of places you must remember to update. At scale, **imperative DOM surgery** becomes unmaintainable.

### With React (the solution)

```
┌─────────────────────────────────────────────────────────────┐
│  React model                                                 │
├─────────────────────────────────────────────────────────────┤
│  state = { cart: [...], total: 42 }                          │
│       │                                                      │
│       ▼                                                      │
│  UI = render(state)   // pure description                    │
│       │                                                      │
│       ▼                                                      │
│  React diffs new UI vs old → minimal DOM updates             │
└─────────────────────────────────────────────────────────────┘
```

You declare **what** the UI should look like for a given state; React figures out **how** to get there.

### What React is NOT (interview clarity)

| Term | What people think | Reality |
|------|-------------------|---------|
| Framework | React includes routing, ORM, auth | React is a **UI library**; ecosystem adds the rest |
| MVC | React replaces models | React is **view layer**; data layer is your choice |
| Two-way binding | Like Angular 1 `$scope` | React is **one-way data flow** down; events flow up |
| Virtual DOM only | React = VDOM | Reconciliation + Fiber scheduler are the real engine |

### Senior one-liner for interviews

> "React separates **description** (render) from **mutation** (commit). That separation enables predictable updates, batching, concurrent rendering, and testable UI logic."

### Check Your Understanding — Questions & Reasoning

**Q1. Is React a framework or a library? What would you add for a production app?**  
**Reasoning:** React only solves the **view layer** — rendering UI from state. Routing (React Router), data fetching (React Query), forms, and global state are separate choices. Calling it a "framework" in interviews without clarifying sounds imprecise; senior candidates say "library + ecosystem."  
**Core takeaway:** React = UI; everything else is architectural decisions you defend.

**Q2. "React uses the Virtual DOM because the real DOM is slow." Is that accurate?**  
**Reasoning:** The real DOM is slow when you **touch it too often** with naive updates. React's win is **predictable, batched updates** via a declarative model and reconciliation — not VDOM alone. Fiber adds scheduling and priorities. A weak answer stops at "VDOM = fast."  
**Core takeaway:** Declarative UI + diffing + commit batching — VDOM is one implementation detail.

**Q3. How is React's data flow different from two-way binding (e.g. AngularJS)?**  
**Reasoning:** Two-way binding syncs model ↔ view automatically in both directions, which can make "who changed this?" hard to trace. React pushes **props down, events up** — one direction. You still *can* lift state and pass handlers; the mental model stays explicit.  
**Core takeaway:** Predictability over magic sync — easier debugging at scale.

**Q4. What does "UI is a function of state" mean with a concrete example?**  
**Reasoning:** Given the same `state`, `render(state)` should describe the same UI. When `cartItems` changes from `[]` to `[{id:1}]`, you don't manually toggle DOM nodes — you re-render and React updates the badge count. If UI diverges from state, you have a bug in state placement or derivation.  
**Core takeaway:** State is source of truth; DOM is output.

---

## 2. Why React Matters — The Problems It Solves

### Problem 1: UI/state drift

Without a single source of truth, the cart badge shows 3 while checkout thinks the cart is empty. React pushes you toward **state → UI** unidirectional flow.

### Problem 2: Unmaintainable DOM updates

A table with sort, filter, pagination, and inline edit in vanilla JS often means 400 lines of `querySelector` and fragile indices. React composes **small components** that re-render when their inputs change.

### Problem 3: No component reuse story

Copy-pasting HTML/JS across pages breaks on the third variant. React components are **parameterized functions** with explicit props contracts.

### Problem 4: Performance without manual micro-optimization everywhere

The reconciliation engine batches updates and can skip subtrees. You opt into `memo` / `useMemo` where profiling proves need — not on every line.

### Problem 5: Team scalability

Clear boundaries (presentational vs container, feature folders, design systems) map to how large FE orgs ship. React's ecosystem (Storybook, RTL, React Query) is built for teams.

### Problem 6: Progressive adoption

React embeds in legacy apps (widget on a PHP page, micro-frontend shell). Interviewers at 5+ years expect you to discuss **brownfield** integration, not only greenfield SPAs.

### What breaks without disciplined React usage

```javascript
// BAD: mirroring props into state — classic drift bug
function UserPanel({ userId }) {
  const [user, setUser] = useState(null);

  // Missing dependency: userId changes but fetch doesn't re-run correctly
  useEffect(() => {
    fetchUser(userId).then(setUser);
  }, []); // ← interview trap: stale closure / wrong deps

  return <div>{user?.name}</div>;
}
```

Senior answer: derive async state with proper deps, or use a data library (React Query) with `queryKey: ['user', userId]`.

### Check Your Understanding — Questions & Reasoning

**Q1. Your cart icon shows 2 items but checkout shows empty. What class of bug is this?**  
**Reasoning:** **UI/state drift** — two representations of truth (DOM fragment + React state, or two stores) got out of sync. React's model fixes this by deriving UI from one state tree; the bug in the snippet is **stale/wrong effect deps** when `userId` changes.  
**Core takeaway:** One source of truth per concern; never duplicate without sync logic.

**Q2. Why is "fetch in render" or wrong `useEffect` deps a senior interview trap?**  
**Reasoning:** Render must stay **pure** and fast. Fetch in render can loop (setState → render → fetch). Empty deps `[]` with `userId` in closure means you fetch once for the first id only — classic production bug when navigating between users.  
**Core takeaway:** Side effects belong in effects/handlers with correct dependencies or query keys.

**Q3. When would you NOT choose React for a new feature?**  
**Reasoning:** Static content with zero interactivity might be HTML/CSS only. Heavy canvas/WebGL might be a library island. Teams may embed React as a widget in legacy apps — React doesn't require rewriting everything. Honest tradeoffs beat "React everywhere."  
**Core takeaway:** React solves complex, stateful UI — not every page needs it.

**Q4. How does React help team scale beyond individual productivity?**  
**Reasoning:** Components = contracts (props), testable units, design systems, Storybook. Conventions (feature folders, container/presentational) reduce cognitive load when 20 devs touch the same app.  
**Core takeaway:** Composition + ecosystem = maintainability at org scale.

---

## 3. Core Concepts & Mental Models

### Terminology every senior interview uses

| Term | Definition | Example |
|------|------------|---------|
| **Component** | Function or class that returns UI | `function Button() { return <button /> }` |
| **Element** | Plain object describing a node (`type`, `props`, `key`) | Output of `createElement` / JSX |
| **Props** | Read-only inputs from parent | `<Avatar size="lg" src={url} />` |
| **State** | Mutable data owned by component (or store) | `const [open, setOpen] = useState(false)` |
| **Render** | Calling component function to produce element tree | Runs during render phase |
| **Commit** | Applying DOM changes + running layout effects | After render completes |
| **Reconciliation** | Diffing old vs new element trees | Keys matter for lists |
| **Hook** | Function that attaches state/effects to function components | `useState`, `useEffect` |
| **Controlled** | React state is source of truth for input value | `value={x} onChange={...}` |
| **Uncontrolled** | DOM holds value; read via ref | `ref.current.value` |

### The render → commit mental model

```
        ┌──────────────┐
        │  setState()  │
        └──────┬───────┘
               │
               ▼
        ┌──────────────┐     Pure, can abort/restart
        │ Render phase │     (Concurrent React)
        │  call comps  │
        └──────┬───────┘
               │
               ▼
        ┌──────────────┐     Mutates DOM, runs useLayoutEffect
        │ Commit phase │
        └──────┬───────┘
               │
               ▼
        ┌──────────────┐     useEffect runs after paint
        │   Passive    │
        │   effects    │
        └──────────────┘
```

**Interview rule:** Never put side effects (fetch, subscriptions) in render body — only in effects or event handlers.

### Unidirectional data flow

```
     ┌─────────┐
     │ Parent  │──props──► ┌─────────┐
     └────┬────┘           │  Child  │
          ▲                └────┬────┘
          │                     │
          └──── callbacks ──────┘
                (events up)
```

Lifting state up = move shared state to closest common ancestor.

### Check Your Understanding — Questions & Reasoning

**Q1. What is the difference between a React element and a component?**  
**Reasoning:** An **element** is a plain object description (`type`, `props`, `key`) — immutable. A **component** is a function/class that React **calls** to produce elements. Confusing them leads to "I put hooks on an element" errors.  
**Core takeaway:** Elements describe; components compute descriptions.

**Q2. Why must side effects not run during the render phase?**  
**Reasoning:** Render can run **multiple times** (Strict Mode, concurrent retries) before commit. Side effects during render cause duplicate subscriptions, inconsistent DOM, and break React's purity assumption for future features. Effects run **after** commit; layout effects before paint.  
**Core takeaway:** Render = calculate; commit = apply; effects = sync with world.

**Q3. Parent re-rendered but child's props look unchanged. Will child re-render?**  
**Reasoning:** By default **yes** — parent render invokes child function unless child is wrapped in `memo` and props are shallow-equal. "Unchanged" by eye may still be new object references (`style={{}}`).  
**Core takeaway:** Re-render ≠ DOM update; reconciliation may bail out, but function still ran unless memoized.

**Q4. What is "lifting state up" and when do you do it?**  
**Reasoning:** When two siblings need the same data (selected tab, active user), state lives in **closest common parent** and flows down as props. You lift when colocated state in one child can't serve the sibling — not preemptively on day one.  
**Core takeaway:** Share state at lowest common ancestor.

---

## 4. React Ecosystem Packages — react, react-dom, and Related Libraries

### The Idea — one core, many renderers

React is split **on purpose**. The **`react`** package is **platform-agnostic** — components, hooks, reconciliation logic. It does **not** touch the browser DOM. A separate **renderer** package connects React to a target environment (web DOM, native mobile, canvas, etc.).

```
┌─────────────────────────────────────────────────────────────────┐
│                     YOUR APPLICATION CODE                        │
│  import { useState } from 'react'                                │
│  import { createRoot } from 'react-dom/client'                   │
│  import { BrowserRouter } from 'react-router-dom'                │
└───────────────┬─────────────────────┬───────────────────────────┘
                │                     │
                ▼                     ▼
     ┌──────────────────┐   ┌─────────────────────┐
     │      react       │   │  react-router-dom   │
     │  (core engine)   │   │  (URL ↔ UI mapping) │
     └────────┬─────────┘   └─────────────────────┘
              │
              ▼
     ┌──────────────────┐
     │    react-dom     │  ← web renderer (browser DOM)
     └──────────────────┘
              │
              ▼
        Real DOM in browser
```

**Interview one-liner:** "`react` is the engine; `react-dom` is the browser driver; everything else (router, query, forms) is ecosystem."

---

### Package reference — what each one does

| Package | Maintainer | What it is | Typical imports |
|---------|------------|------------|-----------------|
| **`react`** | Meta / React team | Core: components, hooks, `createElement`, Context, `memo`, reconciliation | `useState`, `useEffect`, `createContext`, `StrictMode` |
| **`react-dom`** | Meta / React team | **Web renderer** — mounts React tree to DOM, events, hydration, portals | `createRoot`, `hydrateRoot`, `createPortal`, `flushSync` |
| **`react-dom/client`** | Meta | React 18+ client entry (`createRoot` replaces legacy `ReactDOM.render`) | `createRoot(document.getElementById('root'))` |
| **`react-dom/server`** | Meta | SSR: HTML string/stream on server | `renderToString`, `renderToPipeableStream` |
| **`react-router`** | Remix / Shopify | **Core routing** (framework-agnostic primitives) | `createBrowserRouter`, `Route`, loaders — usually via `-dom` |
| **`react-router-dom`** | Remix / Shopify | **Web bindings** for React Router (`BrowserRouter`, `Link`, `useNavigate`) | `BrowserRouter`, `Routes`, `Route`, `Link` |
| **`react-native`** | Meta | Mobile renderer (iOS/Android) — uses `react`, not `react-dom` | `View`, `Text`, `FlatList` |
| **`@testing-library/react`** | Community | Test utilities — render components, query DOM like users | `render`, `screen`, `userEvent` |
| **`@types/react`** | DefinitelyTyped | TypeScript types for `react` (devDependency) | Types only, zero runtime |
| **`@vitejs/plugin-react`** | Vite team | Build tool plugin — Fast Refresh, JSX transform | Vite config only |

**Not React team but always in senior interviews:**

| Package | Role |
|---------|------|
| **TanStack Query** (`@tanstack/react-query`) | Server/async state cache — not part of React |
| **Redux / Zustand** | Client global state |
| **React Hook Form** | Form state |
| **Next.js / Remix** | Full-stack frameworks built on React + router + SSR |

---

### `react` — the core (no DOM)

**Contains:** Fiber reconciliation, hooks implementation, element creation, Context, `Children`, `memo`, `lazy`, `Suspense` boundaries (logic side).

**Does NOT contain:** `document`, `window`, `createRoot`, DOM event delegation.

```javascript
// ✅ Valid — only needs 'react'
import { useState, useEffect, createContext } from 'react';

function Counter() {
  const [n, setN] = useState(0);
  return null; // no DOM — still valid React component logic
}
```

**Why split?** Same React core powers React Native, custom renderers (Three.js, PDF), and tests — without pulling in DOM code.

---

### `react-dom` — browser renderer

**Contains:** DOM mounting/updating, synthetic event system (root delegation), `createPortal`, hydration, `findDOMNode` (legacy).

#### React 18+ client API (`react-dom/client`)

```javascript
// main.jsx — your vite-react app
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

const root = createRoot(document.getElementById('root'));
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

| API | Purpose |
|-----|---------|
| `createRoot` | React 18+ client root — enables concurrent features |
| `hydrateRoot` | Attach to server-rendered HTML |
| `root.render()` | Render/update tree |
| `root.unmount()` | Tear down |

**Legacy (React 17):** `ReactDOM.render()` — deprecated; doesn't enable full concurrent mode.

#### Other `react-dom` exports interviewers mention

```javascript
import { createPortal } from 'react-dom';
import { flushSync } from 'react-dom';

// Portal — render outside parent DOM hierarchy (modals, tooltips)
createPortal(<Modal />, document.body);

// flushSync — force synchronous commit (escape hatch; rare)
flushSync(() => setCount(c => c + 1));
```

#### `react-dom/server` (SSR)

```javascript
import { renderToString } from 'react-dom/server';
const html = renderToString(<App />); // server only — no hooks with browser APIs
```

---

### `react-router` vs `react-router-dom`

React Router v6+ split **core** from **environment bindings**:

```
react-router          →  routing logic, data APIs, hooks (useParams, useNavigate)
       │
       ├── react-router-dom   →  BrowserRouter, Link, NavLink (web)
       ├── react-router-native →  React Native navigation
       └── (Remix framework uses react-router internally)
```

**In web apps you almost always install `react-router-dom`**, which re-exports from `react-router`.

```javascript
// App.jsx pattern — from your vite-react repo
import { BrowserRouter } from 'react-router-dom';
import { Link, Route, Routes } from 'react-router-dom';

// main.jsx wraps app:
<BrowserRouter>
  <App />
</BrowserRouter>
```

| Import from | When |
|-------------|------|
| `react-router-dom` | Web SPA — default choice |
| `react-router` | Shared code, library authors, or when docs show core API |

**Interview distinction:** React Router is **not** part of React core — Meta doesn't ship routing. You choose it (or TanStack Router, Next.js file-based routing, etc.).

---

### How packages connect in a typical app

```
package.json dependencies:
  react          ← required
  react-dom      ← required for web
  react-router-dom ← optional (routing)
  @tanstack/react-query ← optional (server state)

main.jsx:
  react-dom/client.createRoot()  → mounts tree
  react-router-dom.BrowserRouter → syncs URL
  App.jsx:
    react hooks + components
```

Your [`vite-react/src/main.jsx`](../vite-react/src/main.jsx):

```javascript
import { createRoot } from 'react-dom/client';  // renderer
import { BrowserRouter } from 'react-router-dom'; // routing (not in package.json yet — add if missing)
```

---

### Internal / transitive packages (name-drop for senior depth)

| Package | Notes |
|---------|-------|
| **`scheduler`** | Priority queue for Fiber — dependency of `react` |
| **`react/jsx-runtime`** | Automatic JSX transform (`import jsx from 'react/jsx-runtime'`) — Vite/Babel emit this |
| **`react-refresh`** | Fast Refresh runtime (dev only, via Vite plugin) |

You don't install these directly — knowing they exist shows you understand the stack.

---

### Comparison matrix — interview quick reference

| Question | Answer |
|----------|--------|
| Can I use `react` without `react-dom`? | Yes — tests, custom renderers, React Native uses `react-native` instead |
| Can I use `react-dom` without `react`? | No — `react-dom` depends on `react` |
| Where do hooks live? | **`react`** |
| Where does `createRoot` live? | **`react-dom/client`** |
| Where does routing live? | **`react-router-dom`** (ecosystem, not core) |
| Is Next.js required? | No — optional framework wrapping React + SSR + routing |
| `ReactDOM.render` vs `createRoot`? | `createRoot` is React 18+; enables concurrent rendering |

---

### Pros & cons of the split architecture

| Pros | Cons |
|------|------|
| Same React core for web, native, VR | Beginners confused by multiple packages |
| Smaller non-web bundles | Must keep `react` + `react-dom` versions aligned |
| Clear separation: logic vs platform | "Which package do I import?" questions in interviews |

---

### Check Your Understanding — Questions & Reasoning

**Q1. What is the difference between `react` and `react-dom`?**  
**Reasoning:** **`react`** = component model, hooks, reconciliation (platform-agnostic). **`react-dom`** = glue to the **browser DOM** — mount, update, events, portals, hydration. You need both for a web SPA; only `react` for logic-only tests or non-DOM renderers.  
**Core takeaway:** Core vs renderer — never confuse the two in imports.

**Q2. Why doesn't `react` include routing?**  
**Reasoning:** Routing is an **application concern**, not view-layer primitive. React team keeps core minimal; React Router (Remix) and frameworks (Next.js) compete/evolve independently. Same for data fetching (React Query) and forms.  
**Core takeaway:** React core = UI state + render; routing is ecosystem.

**Q3. `react-router` vs `react-router-dom` — which do you install for a Vite SPA?**  
**Reasoning:** Install **`react-router-dom`** — includes web components (`BrowserRouter`, `Link`) and re-exports core hooks (`useParams`, `useNavigate`). `react-router` alone is for authors or shared packages without DOM assumptions.  
**Core takeaway:** Web apps → `react-router-dom`.

**Q4. Where does `createRoot` come from and why not `react`?**  
**Reasoning:** Mounting to DOM is **renderer responsibility** → `react-dom/client`. Keeping it out of `react` allows React Native's renderer to expose its own root API. `createRoot` replaces deprecated `ReactDOM.render` and unlocks React 18 concurrent features.  
**Core takeaway:** Entry point for web = `react-dom/client`.

**Q5. Can you import `useState` from `react-dom`?**  
**Reasoning:** **No** — hooks always from **`react`**. `react-dom` only exports DOM-specific APIs. Mixing imports wrong is a common beginner mistake interviewers probe.  
**Core takeaway:** Hooks → `react`; DOM APIs → `react-dom`.

**Q6. What package for SSR `renderToString`?**  
**Reasoning:** **`react-dom/server`** — runs on Node, outputs HTML string/stream. Still uses components from `react`. Client then uses `hydrateRoot` from `react-dom/client`.  
**Core takeaway:** Server HTML = `react-dom/server`; client attach = `react-dom/client`.

**Q7. Is `@testing-library/react` part of React?**  
**Reasoning:** **No** — community testing library. Uses `react-dom` under the hood to render into JSDOM/browser. React team ships `react-test-renderer` (snapshot/low-level) but RTL is interview default for behavior tests.  
**Core takeaway:** Testing libs are ecosystem, not core.

---

## 5. JSX, Elements, and the Render Tree

### The Idea

JSX is **syntax sugar** for `React.createElement(type, props, ...children)`. It is not HTML — `className`, `htmlFor`, camelCase events.

### Walkthrough: what JSX becomes

```jsx
const el = <Greeting name="Ada" bold />;
```

Roughly:

```javascript
const el = React.createElement(
  Greeting,
  { name: 'Ada', bold: true },
  // no children
);
// el ≈ { $$typeof: Symbol.for('react.element'), type: Greeting, props: { name: 'Ada', bold: true }, ... }
```

### Fragment and keys

```jsx
// Fragment avoids extra DOM nodes
return (
  <>
  <li key="a">A</li>
  <li key="b">B</li>
  </>
);
```

### Interview: Why can't we use array index as key in dynamic lists?

When list **reorders, inserts, or deletes**, index keys make React think item at index 0 is still the "same" component instance → **wrong state preserved** (input values, animation, focus). Use stable **entity ids**.

### Conditional rendering patterns

```javascript
// Pattern 1: early return
if (!user) return <Spinner />;

// Pattern 2: ternary (keep shallow)
return isEditing ? <Editor /> : <Viewer />;

// Pattern 3: logical AND — watch falsy 0
{count > 0 && <Badge count={count} />}
// BAD: {count && <Badge />}  → renders "0" when count is 0
```

| Approach | Pros | Cons |
|----------|------|------|
| Early return | Clear loading/error paths | Splits component flow |
| Ternary | Compact for two branches | Nesting hurts readability |
| `&&` | Clean for optional chrome | `0` and `""` render as text |

### Check Your Understanding — Questions & Reasoning

**Q1. What does this JSX compile to conceptually? `<Button primary>Save</Button>`**  
**Reasoning:** `React.createElement(Button, { primary: true }, 'Save')` — `primary` is boolean prop `true`, child is text node. Interviewers check you know JSX is **not** HTML strings in the browser.  
**Core takeaway:** JSX → `createElement` → element objects.

**Q2. Why does `{count && <Badge />}` render "0" on screen when count is 0?**  
**Reasoning:** `&&` returns the first falsy value — number `0` is falsy but **valid React child** and gets rendered. Fix: `count > 0 && <Badge />` or ternary.  
**Core takeaway:** Falsy primitives (`0`, `""`) can appear in UI with `&&`.

**Q3. When are Fragments (`<>...</>`) necessary?**  
**Reasoning:** When a component must return **one** root but you don't want an extra DOM node (invalid HTML like `<p><div></div></p>`, or table row groups). Fragment groups children for React without a wrapper element.  
**Core takeaway:** Fragments = logical grouping without DOM cost.

**Q4. Why is `class` written as `className` in JSX?**  
**Reasoning:** JSX compiles to JavaScript; `class` is a reserved word in JS. React maps `className` to the DOM `class` attribute. Same for `htmlFor` vs `for`.  
**Core takeaway:** JSX attribute names follow JS + DOM conventions.

---

## 6. Components — Types, Composition, and Boundaries

### Function components (default since React 16.8+)

```javascript
/**
 * Presentational component: receives data, no data fetching.
 */
export function PriceTag({ amount, currency = 'USD' }) {
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);

  return <span className="price">{formatted}</span>;
}
```

### Composition over inheritance

React docs favor **composition** (`children`, render props, slots) over class inheritance.

```javascript
function Dialog({ title, children, footer }) {
  return (
    <div role="dialog" aria-labelledby="dialog-title">
      <h2 id="dialog-title">{title}</h2>
      <div className="dialog-body">{children}</div>
      {footer && <div className="dialog-footer">{footer}</div>}
    </div>
  );
}
```

### `children` types interviewers mention

- **React node**: element, string, number, null, array of nodes
- **`React.ReactElement`**: single element type
- **Render prop**: `children` as function `(state) => node`

### `forwardRef` and DOM access

```javascript
import { forwardRef, useImperativeHandle, useRef } from 'react';

const FancyInput = forwardRef(function FancyInput(props, ref) {
  const inputRef = useRef(null);

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
    getValue: () => inputRef.current?.value ?? '',
  }));

  return <input ref={inputRef} {...props} />;
});
```

**When to use:** focus management, integrating non-React widgets, animation libraries. **Avoid** exposing entire DOM — keep imperative API minimal.

### `memo` at component boundary

```javascript
export const ExpensiveList = memo(function ExpensiveList({ items, onSelect }) {
  return items.map((item) => (
    <Row key={item.id} item={item} onSelect={onSelect} />
  ));
});
```

Only helps if props are stable and render cost dominates.

### Check Your Understanding — Questions & Reasoning

**Q1. Why does React recommend composition over class inheritance?**  
**Reasoning:** Deep inheritance hierarchies are hard to change and reason about. Composition (`children`, slots, hooks) lets you combine behaviors without fragile `extends` chains — aligns with "favor small, reusable pieces."  
**Core takeaway:** Compose behavior; don't subclass components.

**Q2. When do you use `forwardRef` + `useImperativeHandle`?**  
**Reasoning:** When a parent must call **imperative** DOM APIs (focus, scroll, measure) on a child without breaking encapsulation. Expose a **minimal** API — not the whole DOM node. Prefer declarative props when possible.  
**Core takeaway:** Imperative escape hatch for integration, not default design.

**Q3. What is the difference between `children` as nodes vs `children` as a function?**  
**Reasoning:** Nodes = opaque content parent doesn't need to understand (flexible layout). Function = **render prop** — parent provides state, child invokes function to render. Both are composition; render props make data flow explicit.  
**Core takeaway:** `children` is just a prop — can be any renderable type.

**Q4. You wrapped a list in `memo` but it still re-renders every keystroke in a search box. Why?**  
**Reasoning:** Parent re-renders on each keystroke; if you pass **inline** `onSelect={() => ...}` or `items={[...]}` new references each time, `memo` shallow compare fails. Fix: `useCallback`, stable data, or colocate search state lower.  
**Core takeaway:** `memo` only works with stable props — profile first.

---

## 7. Props, State, and Data Flow

### Props are immutable

Parent owns props; child must not mutate `props.user.name = 'x'`. Request changes via callbacks.

### State updates are asynchronous and batched

```javascript
function Counter() {
  const [n, setN] = useState(0);

  function handleTripleClick() {
    setN(n + 1); // schedules update from n=0
    setN(n + 1); // still from n=0
    setN(n + 1); // still from n=0 → result 1, not 3
  }

  function handleTripleFunctional() {
    setN((c) => c + 1);
    setN((c) => c + 1);
    setN((c) => c + 1); // → 3
  }
}
```

**React 18:** batching applies in promises, timeouts, native handlers (not only React events).

### Lifting state — interview scenario

Two siblings need selected date: lift `selectedDate` to parent, pass `date` + `onDateChange` down.

### Derived state anti-pattern

```javascript
// BAD: derived value duplicated in state
const [items, setItems] = useState([]);
const [filtered, setFiltered] = useState([]); // gets out of sync

// GOOD: derive on each render (or memoize if expensive)
const filtered = useMemo(
  () => items.filter((i) => i.active),
  [items]
);
```

### State colocation

Keep state as **low** in the tree as possible. Only lift when siblings need it. Senior signal: "I'd start colocated, extract context/store when prop drilling hurts or caching boundaries require it."

### Check Your Understanding — Questions & Reasoning

**Q1. Three `setN(n + 1)` in one handler — why is count 1 not 3?**  
**Reasoning:** All three use the **same closure value** of `n` from this render. React batches updates; functional `setN(c => c + 1)` chains off the **pending** state. This tests whether you understand batching + stale closure, not "React is async" hand-waving.  
**Core takeaway:** Use functional updates when next state depends on previous in one event.

**Q2. Can a child mutate `props.items.push(newItem)`? Why not?**  
**Reasoning:** Props should be treated **immutable**. Mutation breaks parent's expectations, breaks time-travel debugging, and can skip re-renders if parent doesn't know reference changed. Child should call `onAddItem` and let parent own state.  
**Core takeaway:** Props read-only; parent updates state.

**Q3. You store `filteredList` in state synced from `items` via `useEffect`. What's wrong?**  
**Reasoning:** **Derived state** — two sources that can desync. Filter during render or `useMemo` when expensive. Effects for sync are for external systems, not mirroring props/state.  
**Core takeaway:** Don't duplicate state you can compute.

**Q4. Does React 18 batch `setState` inside `setTimeout`?**  
**Reasoning:** **Yes** — automatic batching applies in timeouts, promises, native handlers. Previously only React event handlers batched in 17. Matters when explaining multiple sets → one render.  
**Core takeaway:** Batching is default in 18+ across update sources.

---

## 8. Events, Synthetic Events, and Forms

### Synthetic events

React wraps native events for cross-browser consistency and **pooling** (legacy; React 17+ attaches to root, pooling removed for most).

```javascript
function Form() {
  function handleSubmit(e) {
    e.preventDefault(); // prevent full page reload
    // submit logic
  }

  return (
    <form onSubmit={handleSubmit}>
      <input name="email" />
    </form>
  );
}
```

### Controlled vs uncontrolled

| | Controlled | Uncontrolled |
|---|------------|--------------|
| Source of truth | React state | DOM |
| Validation | On every keystroke possible | On submit |
| File input | Must be uncontrolled | `ref` + FormData |
| Interview pick | Most React forms | Quick prototypes, third-party DOM |

```javascript
// Controlled
const [email, setEmail] = useState('');
<input value={email} onChange={(e) => setEmail(e.target.value)} />

// Uncontrolled
const inputRef = useRef(null);
<input ref={inputRef} defaultValue="hello@example.com" />
// read: inputRef.current.value
```

### Senior form libraries (name-drop with tradeoffs)

- **React Hook Form**: uncontrolled-by-default, less re-renders, great DX
- **Formik**: controlled, schema validation with Yup
- **TanStack Form**: headless, framework-agnostic mindset

### Check Your Understanding — Questions & Reasoning

**Q1. Why call `e.preventDefault()` on form submit in React?**  
**Reasoning:** Without it, browser performs **full page POST** navigation — destroys SPA state and reloads. `preventDefault` keeps control in JS so you validate, call API, update React state.  
**Core takeaway:** SPA forms handle submit in JS unless intentionally native.

**Q2. When choose controlled vs uncontrolled inputs?**  
**Reasoning:** **Controlled** when you need live validation, conditional disable, or value tied to other UI. **Uncontrolled** for simple forms, file inputs, or integrating libs that own DOM — less re-render per keystroke. Senior teams often use RHF (uncontrolled refs) + schema validation.  
**Core takeaway:** Controlled = React owns value; uncontrolled = DOM owns until read.

**Q3. What is a synthetic event and do you still need to know pooling?**  
**Reasoning:** React's cross-browser wrapper around native events, attached at root in modern React. **Pooling** was removed in 17+ for most cases — mention historically if asked, but focus on `preventDefault`, `stopPropagation`, and that `e.persist()` is legacy.  
**Core takeaway:** Synthetic = normalized events; root delegation in React 17+.

**Q4. Can you use `value={undefined}` on a controlled input?**  
**Reasoning:** Controlled inputs need `value` (or `defaultValue` for uncontrolled). Switching controlled ↔ uncontrolled causes warnings and bugs. Initialize with `''` not `undefined` for text inputs.  
**Core takeaway:** Pick one mode and stay consistent per field.

---

## 9. Hooks — Complete Reference for Interviews

### Rules of Hooks (must memorize)

1. Only call hooks at **top level** (not in loops/conditions/nested functions).
2. Only call hooks from **React function components** or **custom hooks**.

**Why:** Hooks are stored in a **linked list on the fiber** — order must be identical every render. See [`04-React-Internals.md`](./04-React-Internals.md#hooks-internals).

### `useState`

```javascript
const [state, setState] = useState(initialState);
// lazy init: useState(() => expensiveComputation())
```

### `useReducer` — when interviewers prefer it over `useState`

Complex transitions, multiple sub-values, next state depends on previous, testable reducer pure function.

```javascript
const initialState = { status: 'idle', data: null, error: null };

function reducer(state, action) {
  switch (action.type) {
    case 'fetch/start':
      return { ...state, status: 'loading', error: null };
    case 'fetch/success':
      return { status: 'success', data: action.payload, error: null };
    case 'fetch/error':
      return { status: 'error', data: null, error: action.payload };
    default:
      return state;
  }
}

function useUser(userId) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    let cancelled = false;
    dispatch({ type: 'fetch/start' });
    fetchUser(userId)
      .then((data) => !cancelled && dispatch({ type: 'fetch/success', payload: data }))
      .catch((err) => !cancelled && dispatch({ type: 'fetch/error', payload: err }));
    return () => { cancelled = true; };
  }, [userId]);

  return state;
}
```

### `useEffect` — the full interview breakdown

**Purpose:** synchronize component with **external systems** (network, subscriptions, document title, non-React widgets).

```
mount ──► effect runs
update (deps changed) ──► cleanup runs ──► effect runs
unmount ──► cleanup runs
```

```javascript
useEffect(() => {
  const sub = eventSource.subscribe(handler);
  return () => sub.unsubscribe(); // cleanup prevents leaks
}, [handler]);
```

| Dependency array | Behavior |
|------------------|----------|
| Omitted | Run after **every** commit (rare, usually wrong) |
| `[]` | Run once on mount (watch stale props) |
| `[a, b]` | Run when `a` or `b` change (referential equality) |

**`useLayoutEffect`:** runs **before browser paint** — measure DOM, sync scroll, prevent flicker. Blocks paint — use sparingly.

### `useRef`

- DOM reference: `<input ref={ref} />`
- Mutable instance variable that **does not trigger re-render**

```javascript
const renderCount = useRef(0);
renderCount.current += 1; // debugging only — not for UI-driving state
```

### `useMemo` vs `useCallback`

```javascript
const sorted = useMemo(() => expensiveSort(items), [items]);
const onClick = useCallback(() => select(id), [id]);
```

| Hook | Returns | Use when |
|------|---------|----------|
| `useMemo` | Memoized **value** | Expensive computation; stable object for dep arrays |
| `useCallback` | Memoized **function** | Passing callback to `memo` child |

**Flaw:** Blind memoization adds memory and comparison cost. **Profile first.**

### `useContext`

```javascript
const ThemeContext = createContext('light');

function App() {
  return (
    <ThemeContext.Provider value="dark">
      <Toolbar />
    </ThemeContext.Provider>
  );
}

function Toolbar() {
  const theme = useContext(ThemeContext);
  return <div className={theme} />;
}
```

**Flaw:** All consumers re-render when `value` changes (reference equality). Split contexts or use selectors (Zustand, Redux, `use-context-selector`).

### `useId` (React 18+)

Stable IDs for accessibility linking `label` ↔ `input` across SSR/client.

```javascript
const id = useId();
return (
  <>
    <label htmlFor={id}>Email</label>
    <input id={id} type="email" />
  </>
);
```

### `useTransition` & `useDeferredValue`

See [Section 17](#17-concurrent-react-suspense-and-transitions). Short answer: mark updates **non-urgent** so typing stays responsive.

### `useSyncExternalStore`

Subscribe to external store (Redux, Zustand, browser API) with tearing-safe reads in concurrent rendering. Library authors use this; know the name in senior interviews.

### `useImperativeHandle` + `forwardRef`

Expose limited imperative API to parent (see Section 6).

### Custom hooks

Any function `use*` that composes hooks — share **stateful logic**, not components.

### Check Your Understanding — Questions & Reasoning

**Q1. Why can't you write `if (loggedIn) useEffect(...)`?**  
**Reasoning:** Hooks are stored in a **fixed-order linked list** on the fiber. A conditional hook means render 1 might call 5 hooks and render 2 calls 6 — state pairs with wrong hook → corruption. Same rule for loops and nested functions.  
**Core takeaway:** Hooks always run in the same order every render.

**Q2. `useEffect(() => { fetch(url) }, [])` — what breaks when `url` is a prop?**  
**Reasoning:** Effect closes over **initial** `url` — stale forever. ESLint `exhaustive-deps` warns for a reason. Fix: add `url` to deps, or abort on change. Empty deps = "run once on mount" only when truly independent of props.  
**Core takeaway:** Deps list = "re-sync when these change."

**Q3. When `useReducer` over `useState`?**  
**Reasoning:** Multiple related fields, complex transitions, or you want a **pure reducer** unit-tested without React. Async fetch + status machine is a classic reducer shape. Simple toggles don't need the ceremony.  
**Core takeaway:** Reducer = predictable state machine; useState = simple scalar/object.

**Q4. `useRef` vs `useState` for storing a counter you display in UI?**  
**Reasoning:** **`useState`** — changing it triggers re-render so UI updates. **`useRef`** mutates without re-render — for DOM nodes, previous values, timers, or "latest callback" holders. Using ref for displayed count = UI won't update.  
**Core takeaway:** Ref = mutable box, not render signal.

**Q5. You memoized everything but app is slower. Why?**  
**Reasoning:** `useMemo`/`useCallback` cost memory and shallow comparisons on every render. If child is cheap or props still change reference, you pay overhead with no benefit. **Profile** then memo at hot boundaries.  
**Core takeaway:** Memoization is opt-in after measurement.

**Q6. Why does `useContext` cause widespread re-renders?**  
**Reasoning:** When `Provider` `value` changes (new object reference each render is a common bug), **all** consumers re-render even if they use one field. Split contexts or use external store with selectors.  
**Core takeaway:** Context broadcasts to all consumers — design narrow providers.

**Q7. What is `useLayoutEffect` for vs `useEffect`?**  
**Reasoning:** Layout runs **synchronously after DOM update, before paint** — use for measurements that affect layout (tooltip position). `useEffect` runs after paint — won't block visual update; better for fetch/subscriptions.  
**Core takeaway:** Layout = sync before paint; effect = async after paint.

---

## 10. Class Components & Lifecycle (Legacy but Still Asked)

Companies with legacy codebases still ask mapping **lifecycle → hooks**.

| Class lifecycle | Hooks equivalent |
|-----------------|------------------|
| `constructor` | `useState` initial / `useReducer` |
| `componentDidMount` | `useEffect(() => {}, [])` |
| `componentDidUpdate` | `useEffect` with deps |
| `componentWillUnmount` | effect cleanup |
| `shouldComponentUpdate` | `memo` / `PureComponent` |
| `getDerivedStateFromProps` | Derive in render or `key={id}` reset |
| `componentDidCatch` | `componentDidCatch` in class Error Boundary only |

```javascript
// Error Boundary MUST be class (no hook equivalent yet)
class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    logToService(error, info.componentStack);
  }

  render() {
    if (this.state.hasError) return <Fallback />;
    return this.props.children;
  }
}
```

### Check Your Understanding — Questions & Reasoning

**Q1. Map `componentDidMount` to hooks.**  
**Reasoning:** `useEffect(() => { ... }, [])` runs after paint (closer to `componentDidMount` + `componentDidUpdate` combined when deps change). Cleanup maps to `componentWillUnmount`. There's no exact `componentDidMount`-only hook besides empty deps — know the nuance.  
**Core takeaway:** Lifecycle methods → effects with appropriate deps + cleanup.

**Q2. Why are Error Boundaries still class components?**  
**Reasoning:** No `useCatchError` hook exists yet — boundaries rely on `getDerivedStateFromError` and `componentDidCatch` lifecycle. You wrap trees with a class boundary; inside can be all functions.  
**Core takeaway:** Boundaries = class-only API today.

**Q3. What replaces `shouldComponentUpdate`?**  
**Reasoning:** `React.memo` for function components (shallow prop compare), or `PureComponent` for classes. Custom compare function as second arg to `memo` when needed.  
**Core takeaway:** `memo` = opt-out of re-render when props equal.

**Q4. `getDerivedStateFromProps` — hook equivalent?**  
**Reasoning:** Usually **avoid** — derive in render: `const derived = props.x + state.y`. Reset state on user change with `key={userId}` on component to remount fresh. Copying props to state causes sync bugs.  
**Core takeaway:** Prefer derive in render over mirroring props to state.

---

## 11. Reconciliation, Keys, and Lists

### The Idea

React compares element **type** and **key** to decide reuse vs destroy. Same type → update props; different type → tear down subtree.

### Flow

```
New element tree
      │
      ▼
 Same type as old? ──NO──► Unmount old, mount new
      │
     YES
      ▼
 Update props / hooks on existing instance
      │
      ▼
 Recurse children (by key in lists)
```

### Keys — concrete failure with index

```
Initial: [A, B, C]  keys 0,1,2  → inputs "aaa", "", ""
Delete A: [B, C]     keys 0,1    → React reuses DOM for key 0,1
                                 → "aaa" now appears on B's row (BUG)
```

Use `key={item.id}`.

**Deep dive:** [`04-React-Internals.md` — Reconciliation](./04-React-Internals.md#reconciliation-algorithm)

### Check Your Understanding — Questions & Reasoning

**Q1. Same component type, different props — mount or update?**  
**Reasoning:** **Update** — React reuses fiber instance, applies new props, may run hooks again. Different `type` (e.g. `div` → `span`, or `UserList` → `AdminList`) → unmount old subtree, mount new.  
**Core takeaway:** Type + key decide reuse vs replace.

**Q2. You delete the first row; text in row 2's input jumps to row 1. Explain.**  
**Reasoning:** **Index keys** — React reused DOM nodes for keys `0` and `1`, preserving internal input state on wrong entity. Fix: `key={item.id}` stable across reorder/delete.  
**Core takeaway:** Keys identify identity across renders, not position.

**Q3. Is `key` passed to the child as `props.key`?**  
**Reasoning:** **No** — `key` is reserved for reconciliation; child can't read it. Use a normal prop `id={item.id}` if the component needs the id.  
**Core takeaway:** `key` is for React's diffing only.

**Q4. Can two siblings share the same key?**  
**Reasoning:** **No** among siblings — keys must be unique in that list. Duplicates confuse reconciliation. Global uniqueness isn't required, only within the list.  
**Core takeaway:** Unique keys per list level.

---

## 12. Context API — When and How

### Good fits

- Theme, locale, auth session (moderate update frequency)
- Dependency injection for tests
- Avoiding prop drilling for **truly global** UI config

### Bad fits

- High-frequency updates (cursor position, scroll)
- Large app **all** state (re-render blast radius)

### Optimization pattern

```javascript
// Split: state context + dispatch context
const StateContext = createContext(null);
const DispatchContext = createContext(null);

function Provider({ children }) {
  const [state, dispatch] = useReducer(reducer, initial);
  return (
    <DispatchContext.Provider value={dispatch}>
      <StateContext.Provider value={state}>{children}</StateContext.Provider>
    </DispatchContext.Provider>
  );
}
// Consumers that only dispatch don't re-render on state change
```

### Check Your Understanding — Questions & Reasoning

**Q1. You put entire Redux store in one Context. What happens?**  
**Reasoning:** Any store change updates `value` → **every** consumer re-renders. Context isn't a performance replacement for Redux selectors — it's for low-frequency, scoped data unless split.  
**Core takeaway:** Context = broadcast; avoid one giant provider value.

**Q2. Theme + auth in one provider object `{ theme, user }` — issue?**  
**Reasoning:** New object literal each render → **all** consumers re-render even if only theme changed. Split providers or memoize value with `useMemo` when values stable.  
**Core takeaway:** Provider `value` reference stability matters.

**Q3. When is Context the right tool vs Zustand?**  
**Reasoning:** Context: theme, locale, auth snapshot, DI for tests — **infrequent** updates. Zustand/Redux: many updates, selectors, middleware, DevTools. Context for "dependency injection"; store for "application state volume."  
**Core takeaway:** Context for low-churn global; store for high-churn or complex logic.

**Q4. What does splitting State vs Dispatch contexts achieve?**  
**Reasoning:** Components that only call `dispatch` don't subscribe to **state** changes — they skip re-render when count changes but they only increment. Pattern from Redux `connect` mental model.  
**Core takeaway:** Separate read and write subscriptions to limit renders.

---

## 13. State Management at Scale

### Decision layers

```
┌────────────────────────────────────────────────────────┐
│ URL state (shareable, bookmarkable)     → React Router │
│ Server cache (async, stale-while-revalidate) → RQ/SWR  │
│ Global client UI (auth, theme)          → Context/Zustand│
│ Form state (ephemeral)                  → RHF/local    │
│ Local component state                   → useState      │
└────────────────────────────────────────────────────────┘
```

### Redux Toolkit (still common in interviews)

- **Single store**, predictable updates, DevTools, middleware (thunk, saga)
- Use when: many domains interact, time-travel debugging matters, large team conventions

```javascript
// Slice pattern (RTK)
const cartSlice = createSlice({
  name: 'cart',
  initialState: { items: [] },
  reducers: {
    addItem: (state, action) => {
      state.items.push(action.payload); // Immer inside RTK
    },
  },
});
```

### Zustand / Jotai / Recoil (lighter)

- Zustand: minimal boilerplate, selector subscriptions
- Jotai/Recoil: atomic model, fine-grained updates

### Interview answer template

> "I'd keep server state in React Query with cache keys per resource, UI globals in Zustand if context becomes noisy, and colocate feature state until a second consumer appears. Redux when the team already standardized on it or we need middleware-heavy workflows."

| Tool | Best for | Watch out |
|------|----------|-----------|
| Context | Low-frequency global | Re-renders |
| Redux Toolkit | Large apps, strict patterns | Boilerplate |
| Zustand | Medium apps, fast DX | Discipline on store shape |
| React Query | Server/async state | Not for all client state |
| URL params | Filters, tabs, ids | Parsing/serialization |

### Check Your Understanding — Questions & Reasoning

**Q1. Where should server-fetched user list live — Redux or React Query?**  
**Reasoning:** **React Query** (or SWR) — caching, stale-while-revalidate, deduping, background refetch are **server state** concerns. Redux for server data duplicates cache logic and goes stale. Redux shines for client UI state spanning many features.  
**Core takeaway:** Server async state ≠ client global store by default.

**Q2. Filter state: URL, Context, or Zustand?**  
**Reasoning:** **URL search params** if users share/bookmark filters. **Local state** if ephemeral UI-only. **Zustand** if many components need it without shareability. Interviewers want you to justify **shareability and refresh behavior**.  
**Core takeaway:** URL for shareable; local for ephemeral; store for wide client-only state.

**Q3. "We use Redux for everything" — pushback?**  
**Reasoning:** Boilerplate, stale server copies, over-rendering without selectors. Modern split: React Query for API, Zustand/Context for UI globals, colocated `useState` for feature-local. Redux still valid for large teams with existing investment.  
**Core takeaway:** Right state in right layer — no single hammer.

**Q4. What is Immer's role in Redux Toolkit?**  
**Reasoning:** Lets you write **mutating-looking** reducers that produce immutable updates — less spread syntax, fewer accidental mutations of state. Interview signal for RTK familiarity.  
**Core takeaway:** RTK + Immer = ergonomic immutable updates.

---

## 14. Side Effects, Data Fetching, and Caching

### Anti-pattern: fetch in render

```javascript
// NEVER
function Bad() {
  const [data, setData] = useState(null);
  fetch('/api').then(setData); // infinite loop risk
  return <div>{data}</div>;
}
```

### Classic effect fetch with cleanup

```javascript
function useFetch(url) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ac = new AbortController();
    setLoading(true);
    fetch(url, { signal: ac.signal })
      .then((r) => r.json())
      .then(setData)
      .catch((e) => !ac.signal.aborted && setError(e))
      .finally(() => !ac.signal.aborted && setLoading(false));
    return () => ac.abort();
  }, [url]);

  return { data, error, loading };
}
```

### React Query (TanStack Query) — senior default answer

```javascript
function UserProfile({ userId }) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),
    staleTime: 60_000,
  });

  if (isLoading) return <Spinner />;
  if (error) return <Error onRetry={refetch} />;
  return <Card user={data} />;
}
```

**Concepts to mention:** `staleTime`, `cacheTime`/`gcTime`, invalidation, optimistic updates, pagination (`useInfiniteQuery`), prefetch on hover.

### Race conditions

Without abort or ignore flag, slow request A can overwrite fast request B's result. Fix: `AbortController`, `ignore` boolean, or React Query's keyed requests.

### Check Your Understanding — Questions & Reasoning

**Q1. User types fast in search; results show wrong order. Cause and fix?**  
**Reasoning:** **Race condition** — slower response for "ab" arrives after faster "abc" and overwrites. Fix: `AbortController` per request, ignore stale responses, or React Query keyed by full query string cancels prior.  
**Core takeaway:** Always handle out-of-order async responses.

**Q2. What does `queryKey: ['user', userId]` do in React Query?**  
**Reasoning:** Uniquely identifies cache entry — changing `userId` = different cache bucket, auto fetch, no manual "reset when id changes" effect. Enables invalidation: `invalidateQueries({ queryKey: ['user'] })`.  
**Core takeaway:** Query key = cache identity + refetch trigger.

**Q3. `staleTime` vs `gcTime` (formerly cacheTime)?**  
**Reasoning:** **staleTime** = how long data is "fresh" (no background refetch on mount). **gcTime** = how long unused data stays in memory after no observers. Confusing them = wrong caching behavior in interviews.  
**Core takeaway:** Stale = refetch policy; GC = memory retention.

**Q4. Why is fetch in render never acceptable?**  
**Reasoning:** Render must be pure; fetch triggers setState → render → infinite loop risk. Also runs on every parent re-render. Effects or event handlers own I/O.  
**Core takeaway:** I/O after commit, not during render.

---

## 15. Routing and URL-Driven UI

### React Router v6+ mental model

- **Routes** match URL → render elements
- **Nested routes** + **outlets** for layouts
- **Loaders/actions** (data routers) colocate data with routes

```javascript
const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <Home /> },
      {
        path: 'users/:userId',
        element: <UserPage />,
        loader: ({ params }) => fetchUser(params.userId),
      },
    ],
  },
]);
```

### Interview topics

- **Declarative vs data routers**
- Protected routes (wrapper checking auth, redirect to login)
- Search params for filters (`useSearchParams`)
- Code splitting with `React.lazy` per route

```javascript
const Admin = lazy(() => import('./Admin'));

<Route path="/admin" element={
  <Suspense fallback={<Spinner />}>
    <Admin />
  </Suspense>
} />
```

### Check Your Understanding — Questions & Reasoning

**Q1. What is an Outlet in React Router v6?**  
**Reasoning:** Placeholder in parent layout where **child routes render** — enables nested layouts (sidebar persistent, main area swaps). Without Outlet, child routes wouldn't appear inside layout.  
**Core takeaway:** Outlet = nested route render slot.

**Q2. How implement protected routes?**  
**Reasoning:** Wrapper component reads auth (context/store), `Navigate` to `/login` if unauthenticated, else renders `<Outlet />` or children. Loader-based routers can redirect in `loader` before render — faster, no flash.  
**Core takeaway:** Guard at route boundary; redirect before sensitive UI.

**Q3. Why lazy-load route components?**  
**Reasoning:** **Code splitting** — initial bundle smaller, faster TTI. Route-based chunks load on navigation. Pair with `Suspense` fallback for loading UI.  
**Core takeaway:** Lazy routes = smaller first paint bundle.

**Q4. Filters in state vs URL — when URL wins?**  
**Reasoning:** Shareable links, back/forward navigation, SSR with same filters, analytics on query strings. State-only filters die on refresh — bad for ecommerce PLP interviews.  
**Core takeaway:** URL = state that should survive refresh and sharing.

---

## 16. Performance Optimization

### Measurement first

React DevTools Profiler, Lighthouse, Web Vitals (LCP, INP, CLS). **Don't optimize without evidence.**

### Re-render causes

1. State change in this component
2. Parent re-rendered (child re-renders unless bailed out)
3. Context value changed
5. Hooks returned new references consumed by memo children incorrectly

### Techniques

| Technique | What it does |
|-----------|----------------|
| `React.memo` | Skip render if props shallow-equal |
| `useMemo` | Cache expensive calculation |
| `useCallback` | Stable function reference |
| State colocation | Shrinks blast radius |
| Virtualization | Window large lists (`react-window`) |
| Code splitting | Smaller initial bundle |
| `startTransition` | Keep UI responsive under load |

### Windowing example (concept)

```javascript
// Only render ~20 rows visible in viewport, not 10,000 DOM nodes
import { FixedSizeList } from 'react-window';
```

### Children as props pitfall

```javascript
function Parent() {
  return <MemoChild>{() => <Expensive />}</MemoChild>; // new function every render → memo useless
}
```

### Profiling answer (senior)

> "I'd reproduce with Profiler, identify commit duration hotspots, check unnecessary renders via 'highlight updates', then apply colocation or memo at the boundary that actually re-renders often. I'd verify with before/after metrics."

### Check Your Understanding — Questions & Reasoning

**Q1. Child is memoized but parent passes `style={{ color: 'red' }}`. Does memo help?**  
**Reasoning:** **No** — new object reference every parent render → shallow compare fails → child re-renders. Fix: stable style outside render, `useMemo`, or CSS class.  
**Core takeaway:** Memo needs referential stability on props.

**Q2. 10,000 table rows lag. First optimization?**  
**Reasoning:** **Virtualization** (render visible rows only) before `memo` on every cell. DOM node count is likely the bottleneck, not React diff alone.  
**Core takeaway:** Virtualize long lists before micro-memoization.

**Q3. What is INP and why care for React apps?**  
**Reasoning:** **Interaction to Next Paint** — measures responsiveness to input. Heavy synchronous render blocks main thread → bad INP. `startTransition`, splitting work, web workers for heavy compute help.  
**Core takeaway:** Main thread budget affects perceived speed.

**Q4. "I'll memo the entire app" — response?**  
**Reasoning:** Premature — adds complexity, memory, comparison cost. Measure with Profiler; optimize hotspots. Colocate state to shrink subtrees often beats blanket memo.  
**Core takeaway:** Profile → colocate → memo at proven boundaries.

---

## 17. Concurrent React, Suspense, and Transitions

### Concurrent rendering (concept)

React can **pause**, **resume**, or **discard** render work. User-facing urgent updates (typing) interrupt heavy tree work.

### `useTransition`

```javascript
function Search() {
  const [query, setQuery] = useState('');
  const [deferredQuery, setDeferredQuery] = useState('');
  const [isPending, startTransition] = useTransition();

  function onChange(e) {
    const v = e.target.value;
    setQuery(v); // urgent: input stays in sync
    startTransition(() => setDeferredQuery(v)); // slow list can lag
  }

  return (
    <>
      <input value={query} onChange={onChange} />
      {isPending && <span>Updating…</span>}
      <HeavyList filter={deferredQuery} />
    </>
  );
}
```

### `useDeferredValue`

Defers a value derived from props/state — similar goal, different API.

### Suspense

Declarative loading boundaries for **lazy components** or **data** (with supporting libraries / RSC).

```javascript
<Suspense fallback={<Skeleton />}>
  <LazyProfile userId={id} />
</Suspense>
```

**Interview:** Suspense does not replace error boundaries — pair with Error Boundary for failures.

### Check Your Understanding — Questions & Reasoning

**Q1. User complains search input feels laggy while filtering 50k items. Solution?**  
**Reasoning:** Input update is **urgent**; list filter is **transition**. `useTransition` or `useDeferredValue` keeps input responsive while deferring heavy list re-render. Virtualization helps too.  
**Core takeaway:** Split urgent vs non-urgent updates.

**Q2. `useTransition` vs `useDeferredValue` — when which?**  
**Reasoning:** **Transition** when you control **setState** that triggers slow update. **Deferred value** when slow part is driven by **prop/state value** you don't set inside transition (e.g. defer `searchQuery` before passing to child).  
**Core takeaway:** Transition wraps updates; deferred value delays reading.

**Q3. Does Suspense catch errors?**  
**Reasoning:** **No** — Suspense shows fallback while **waiting** (lazy load, async). Errors need **Error Boundary**. Pair `<Suspense><ErrorBoundary>` for robust UX.  
**Core takeaway:** Suspense = loading; Boundary = errors.

**Q4. What does "concurrent rendering" mean in one sentence?**  
**Reasoning:** React can **interrupt, resume, or discard** render work to prioritize urgent updates (typing) over heavy trees — not "multiple threads" necessarily, but schedulable work units.  
**Core takeaway:** Interruptible render for responsiveness.

---

## 18. Server Rendering, Hydration, and React Server Components

### SSR flow

```
Server: renderToString / renderToPipeableStream → HTML
Client: load JS → hydrateRoot → attach listeners, reuse DOM
```

### Hydration mismatch causes

- `Date.now()`, `Math.random()` in render
- Browser-only APIs in first render
- Invalid HTML nesting (`<p><div></div></p>`)
- Different data server vs client

Fix: render placeholder on server, `useEffect` for client-only; or `suppressHydrationWarning` sparingly for known diffs (timestamps).

### React Server Components (RSC)

- Run on **server**, zero client bundle for server-only code
- **Cannot** use hooks with browser APIs in server components
- **Serialization** boundary: Server Component → Client Component passes serializable props

### Frameworks

Next.js App Router, Remix — know **where** data fetching runs (loader vs server component vs client effect).

### Senior comparison table

| | CSR | SSR | SSG | ISR |
|---|-----|-----|-----|-----|
| First paint | Slow | Fast | Fastest | Fast |
| SEO | Poor without SSR | Good | Good | Good |
| Personalization | Easy client | Per-request | Hard | Mixed |
| Infra | Static CDN | Node server | CDN | CDN + revalidate |

### Check Your Understanding — Questions & Reasoning

**Q1. Console says "Hydration failed because initial UI does not match." Common causes?**  
**Reasoning:** `Date.now()` / random in render, browser-only APIs on server, invalid HTML nesting, different API data server vs client. Fix: deterministic SSR, `useEffect` for client-only, align data fetching.  
**Core takeaway:** Server and first client render must match HTML.

**Q2. SSR vs SSG vs CSR — pick for marketing blog vs logged-in dashboard.**  
**Reasoning:** **Blog** = SSG/ISR (fast CDN, SEO). **Dashboard** = CSR + React Query often enough (SEO irrelevant, dynamic per user). **SSR** when SEO + personalization per request both matter.  
**Core takeaway:** Match rendering mode to SEO, freshness, personalization.

**Q3. What can Server Components NOT do?**  
**Reasoning:** No `useState`/`useEffect` with browser APIs, no event handlers on server components, no `window`. They run once on server — for data fetch close to DB, zero client bundle for heavy libs.  
**Core takeaway:** RSC = server-only render; interactivity needs Client Components.

**Q4. What is hydration?**  
**Reasoning:** Client React **attaches** event listeners and reconciles against existing server HTML instead of `createRoot` innerHTML from scratch. Mismatch = expensive fix-up or full client render warning.  
**Core takeaway:** Hydration = adopt server HTML + wire interactivity.

---

## 19. Error Boundaries and Resilience

### What boundaries catch

- Render errors in children
- Lifecycle errors in class children

### What they do NOT catch

- Event handler errors (use try/catch)
- Async errors in `useEffect` (unless rethrow in render)
- SSR errors (framework-specific)
- Errors in boundary itself

```javascript
<ErrorBoundary fallback={<PageError />}>
  <Dashboard />
</ErrorBoundary>
```

### Retry / reset pattern

```javascript
function Boundary({ children }) {
  const [key, setKey] = useState(0);
  return (
  <>
    <ErrorBoundary key={key} onReset={() => setKey((k) => k + 1)}>
      {children}
    </ErrorBoundary>
  </>
  );
}
```

### Check Your Understanding — Questions & Reasoning

**Q1. Click handler throws. Does Error Boundary catch it?**  
**Reasoning:** **No** — boundaries catch **render** and certain lifecycle errors in tree below. Event handlers need `try/catch` or global handler. Async errors in `useEffect` need catch unless you rethrow during render.  
**Core takeaway:** Boundaries ≠ try/catch for events/async.

**Q2. Why reset boundary with `key` increment?**  
**Reasoning:** After error, boundary shows fallback — remounting with new `key` **resets internal error state** so user can retry without full page reload.  
**Core takeaway:** `key` reset = fresh subtree after recovery.

**Q3. Where place Error Boundaries in app tree?**  
**Reasoning:** Around **route/feature** chunks — one widget crash shouldn't white-screen entire app. Root boundary + granular boundaries. Log in `componentDidCatch`.  
**Core takeaway:** Isolate failures at feature boundaries.

**Q4. Can you implement Error Boundary with hooks?**  
**Reasoning:** **Not yet** — no official hook API. Use class boundary or library. Mention if asked for forward-looking awareness.  
**Core takeaway:** Class component required for boundaries today.

---

## 20. Testing React Applications

### Testing Library philosophy

Test **behavior** users see, not implementation (no enzyme-style `instance.state`).

```javascript
import { render, screen, userEvent } from '@testing-library/react';

test('increments counter', async () => {
  render(<Counter />);
  await userEvent.click(screen.getByRole('button', { name: /increment/i }));
  expect(screen.getByText('Count: 1')).toBeInTheDocument();
});
```

### What to mock

- Network: MSW (Mock Service Worker) preferred over mocking `fetch` ad hoc
- Modules: `vi.mock` / `jest.mock` for boundaries (router, analytics)

### Async patterns

```javascript
await waitFor(() => expect(screen.getByText('Loaded')).toBeInTheDocument());
```

### Hooks testing

`@testing-library/react` `renderHook`:

```javascript
const { result } = renderHook(() => useCounter(), { wrapper: Provider });
act(() => result.current.increment());
expect(result.current.count).toBe(1);
```

### E2E

Playwright/Cypress for critical paths — login, checkout. Unit/integration for component contracts.

### Check Your Understanding — Questions & Reasoning

**Q1. Why `getByRole` over `getByTestId`?**  
**Reasoning:** Role queries mirror **how users and assistive tech** find elements — tests break when UX breaks meaningfully. `testId` is escape hatch for non-semantic widgets. Shows a11y-aware testing maturity.  
**Core takeaway:** Query like users interact.

**Q2. Why MSW over mocking `fetch` in every test?**  
**Reasoning:** MSW intercepts at **network layer** — components use real `fetch` path, tests stay closer to production, shared handlers across tests. Ad-hoc fetch mocks duplicate setup and drift from API contract.  
**Core takeaway:** MSW = realistic, reusable API mocking.

**Q3. Should you test implementation (state, hook calls)?**  
**Reasoning:** **No** for RTL philosophy — test visible outcomes (text, roles, disabled). Implementation tests brittle-refactor when you rename state. Exception: custom hook unit tests via `renderHook`.  
**Core takeaway:** Behavior over internals for components.

**Q4. When `waitFor` vs `findBy`?**  
**Reasoning:** `findBy*` already async waits for element. `waitFor` wraps custom assertions (multiple conditions). Both handle async UI; choose based on readability.  
**Core takeaway:** Async UI needs await — never assume instant DOM.

---

## 21. TypeScript + React (Senior Expectations)

### Typing components

```typescript
type ButtonProps = {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
};

export function Button({ label, onClick, variant = 'primary' }: ButtonProps) {
  return <button className={variant} onClick={onClick}>{label}</button>;
}
```

### `React.FC` debate

Modern style: **avoid `React.FC`** default — explicit props type; `children` not implicit.

### Event types

```typescript
function onChange(e: React.ChangeEvent<HTMLInputElement>) {
  e.target.value;
}
```

### Generics with components

```typescript
type SelectProps<T> = {
  options: T[];
  value: T;
  onChange: (v: T) => void;
  getLabel: (v: T) => string;
};
```

### `useRef` typing

```typescript
const inputRef = useRef<HTMLInputElement>(null);
// access: inputRef.current?.focus()
```

### Discriminated unions for async state

```typescript
type State =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: User }
  | { status: 'error'; error: Error };
```

Narrow with `switch (state.status)` — exhaustive checks with `never`.

### Check Your Understanding — Questions & Reasoning

**Q1. Why avoid `React.FC` by default?**  
**Reasoning:** Implicit optional `children` confused APIs; generics and default props ergonomics improved with plain function + explicit props type. `FC` still valid if team prefers — know the debate.  
**Core takeaway:** Explicit `Props` type > `React.FC` for most components.

**Q2. Type `useRef` for a div you focus — signature?**  
**Reasoning:** `useRef<HTMLDivElement>(null)` — access via `ref.current?.focus()` because ref starts null until mount.  
**Core takeaway:** Ref generic = DOM element type or value type for mutable box.

**Q3. Discriminated union for fetch state — why?**  
**Reasoning:** `status: 'success'` narrows to guarantee `data` exists — compiler prevents `data` access when `loading`. Better than optional `data?` + `error?` booleans all optional.  
**Core takeaway:** Discriminated unions model async state safely.

**Q4. Generic `<Select<T> value={t} onChange={...} />` — benefit?**  
**Reasoning:** Reusable component preserves **type of option** through props — no `any`, autocomplete for `value`. Senior signal for library/design system work.  
**Core takeaway:** Generics preserve type through component APIs.

---

## 22. Security, Accessibility, and Production Concerns

### XSS

```javascript
// DANGEROUS — only with sanitized HTML
<div dangerouslySetInnerHTML={{ __html: userHtml }} />
```

React escapes text children by default. Risk: `dangerouslySetInnerHTML`, building URLs from user input (`javascript:`), storing HTML in DB.

### CSP, cookies

Know `HttpOnly`, `SameSite`, CSRF basics for fullstack interviews tied to React apps.

### Accessibility (a11y)

- Semantic HTML first (`button` not `div onClick`)
- `aria-*` when semantics insufficient
- Keyboard: focus trap in modals, `Escape` to close
- `eslint-plugin-jsx-a11y`

```javascript
<button aria-expanded={open} aria-controls="menu-id" onClick={toggle}>
  Menu
</button>
```

### Production checklist (mention in system design)

- Error monitoring (Sentry)
- Feature flags
- Bundle analysis (`rollup-plugin-visualizer`)
- CDN, caching headers
- i18n strategy

### Check Your Understanding — Questions & Reasoning

**Q1. Is React safe from XSS by default?**  
**Reasoning:** **Text children are escaped** — `<div>{userInput}</div>` is safe. Risk: `dangerouslySetInnerHTML` with unsanitized HTML, `javascript:` URLs from user input, storing HTML in DB without sanitize pipeline.  
**Core takeaway:** Default escape is safe; explicit HTML insertion is the risk.

**Q2. `div` with `onClick` vs `button` — interview expectation?**  
**Reasoning:** **`<button type="button">`** is focusable, keyboard activatable, announced correctly. `div onClick` needs tabindex, key handlers, role — easy to ship inaccessible UI.  
**Core takeaway:** Semantic HTML first; ARIA when insufficient.

**Q3. JWT in localStorage vs HttpOnly cookie — tradeoff?**  
**Reasoning:** **localStorage** readable by any JS on page — XSS steals token. **HttpOnly cookie** not readable by JS — XSS harder to exfiltrate token; need CSRF protection for cookie auth. Fullstack interviews expect this nuance.  
**Core takeaway:** HttpOnly cookies favor security over localStorage tokens.

**Q4. What do you monitor in production React apps?**  
**Reasoning:** Error tracking (Sentry), Web Vitals (LCP/INP/CLS), API error rates, feature flags for rollback. Ties React work to business reliability — senior scope beyond components.  
**Core takeaway:** Observability = errors + performance + releases.

---

## 23. Design Patterns — HOC, Render Props, Compound Components

### Higher-Order Component (HOC)

Function that takes component, returns enhanced component.

```javascript
function withAuth(Wrapped) {
  return function Authenticated(props) {
    const { user, loading } = useAuth();
    if (loading) return <Spinner />;
    if (!user) return <Navigate to="/login" />;
    return <Wrapped {...props} user={user} />;
  };
}
```

**Flaw:** Wrapper hell, DevTools name noise, ref forwarding needs `forwardRef`. **Hooks often replace HOCs** (`useAuth()`).

### Render props

```javascript
function MouseTracker({ render }) {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const fn = (e) => setPos({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', fn);
    return () => window.removeEventListener('mousemove', fn);
  }, []);
  return render(pos);
}
```

### Compound components

Shared implicit state via context — flexible API (`<Tabs>`, `<Tabs.List>`, `<Tabs.Panel>`).

```javascript
const TabsContext = createContext(null);

export function Tabs({ children, defaultIndex = 0 }) {
  const [index, setIndex] = useState(defaultIndex);
  return (
    <TabsContext.Provider value={{ index, setIndex }}>
      {children}
    </TabsContext.Provider>
  );
}

Tabs.List = function TabsList({ children }) { /* ... */ };
Tabs.Panel = function TabsPanel({ when, children }) {
  const { index } = useContext(TabsContext);
  if (when !== index) return null;
  return children;
};
```

| Pattern | Pros | Cons |
|---------|------|------|
| HOC | Cross-cutting reuse | Indirection, refs |
| Render props | Explicit data sharing | JSX nesting |
| Compound | Ergonomic public API | Context coupling |
| Custom hooks | Best default in 2024+ | Needs discipline |

### Check Your Understanding — Questions & Reasoning

**Q1. `withAuth(Component)` vs `useAuth()` inside component?**  
**Reasoning:** **Hook** shares logic without wrapper nesting, better DevTools names, no ref forwarding pain. HOC still valid for class components or injecting into non-hook trees — hooks are default in 2024+.  
**Core takeaway:** Prefer custom hooks over HOC for logic reuse.

**Q2. When compound components beat props explosion?**  
**Reasoning:** `<Tabs><Tabs.List/><Tabs.Panel/></Tabs>` — flexible layout, implicit shared state via context, cleaner than 12 boolean props. Tradeoff: coupling to parent context.  
**Core takeaway:** Compound = ergonomic API for related UI kit pieces.

**Q3. Render prop vs children-as-function — same idea?**  
**Reasoning:** Both pass **data up** to caller's render function. Named `render` prop vs `children(fn)` is API style; same inversion of control.  
**Core takeaway:** Render props = function prop for shared state.

**Q4. HOC disadvantage senior should name?**  
**Reasoning:** Wrapper hell, prop name collisions, harder debugging in DevTools, must forward refs. Reason to migrate legacy HOCs to hooks over time.  
**Core takeaway:** HOC indirection cost > hook composition for new code.

---

## 24. Custom Hooks — Interview-Grade Implementations

### `useDebounce` (value)

```javascript
import { useState, useEffect } from 'react';

/**
 * Returns a debounced copy of `value` after `delayMs` of stability.
 */
export function useDebounce(value, delayMs = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);

  return debounced;
}
```

### `useDebouncedCallback`

```javascript
import { useRef, useCallback } from 'react';

export function useDebouncedCallback(fn, delayMs = 300) {
  const fnRef = useRef(fn);
  const timerRef = useRef(null);
  fnRef.current = fn;

  return useCallback((...args) => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => fnRef.current(...args), delayMs);
  }, [delayMs]);
}
```

### `usePrevious`

```javascript
import { useRef, useEffect } from 'react';

export function usePrevious(value) {
  const ref = useRef();
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref.current;
}
```

### `useIntersectionObserver` (infinite scroll)

```javascript
export function useIntersectionObserver(ref, options) {
  const [entry, setEntry] = useState(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => setEntry(e), options);
    obs.observe(el);
    return () => obs.disconnect();
  }, [ref, options?.root, options?.rootMargin, options?.threshold]);

  return entry;
}
```

### `useLocalStorage`

```javascript
export function useLocalStorage(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw != null ? JSON.parse(raw) : initial;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
}
```

**Pitfall:** SSR — `localStorage` undefined on server; guard or lazy init in `useEffect`.

### Check Your Understanding — Questions & Reasoning

**Q1. Walk through `useDebounce(value, 300)` when user types "react" quickly.**  
**Reasoning:** Each keystroke resets timer via cleanup. Only after 300ms **silence** does effect set debounced state. API fires once per pause — not per key — reducing load and races.  
**Core takeaway:** Debounce = wait for pause; throttle = rate limit.

**Q2. Why `fnRef.current = fn` in `useDebouncedCallback`?**  
**Reasoning:** Stable debounced function identity (`useCallback` deps `[delayMs]`) while always invoking **latest** `fn` — avoids stale closure without recreating timer wrapper each render.  
**Core takeaway:** Ref holds latest callback for stable debounced wrapper.

**Q3. `usePrevious` returns undefined on first render — expected?**  
**Reasoning:** **Yes** — no prior value yet. Used to compare prop/state changes across renders (animations, diff logging).  
**Core takeaway:** Previous = one render behind.

**Q4. `useLocalStorage` breaks SSR — fix?**  
**Reasoning:** `localStorage` undefined on server — lazy init in `useEffect` or default until mounted (`const [mounted, setMounted] = useState(false)`). Avoid hydration mismatch from reading storage during first render.  
**Core takeaway:** Browser APIs only after mount for SSR apps.

---

## 25. Live Coding Problems — Patterns & Solutions

### Problem: Debounced search

**Approach:** controlled input + `useDebounce` + effect or React Query with debounced term.

```javascript
function SearchUsers() {
  const [q, setQ] = useState('');
  const debouncedQ = useDebounce(q, 400);
  const { data, isLoading } = useQuery({
    queryKey: ['users', debouncedQ],
    queryFn: () => searchUsers(debouncedQ),
    enabled: debouncedQ.length >= 2,
  });

  return (
    <>
      <input value={q} onChange={(e) => setQ(e.target.value)} />
      {isLoading && <p>Searching…</p>}
      <ul>{data?.map((u) => <li key={u.id}>{u.name}</li>)}</ul>
    </>
  );
}
```

### Problem: Infinite scroll

Sentinel div at bottom + `IntersectionObserver` → append next page; guard duplicate fetches with `isFetching` flag.

### Problem: Modal with focus trap & portal

```javascript
import { createPortal } from 'react-dom';

function Modal({ open, onClose, children }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return createPortal(
    <div role="dialog" aria-modal="true">
      {children}
    </div>,
    document.body
  );
}
```

### Problem: Tic-tac-toe / controlled game state

Immutable state updates, lift state to parent or `useReducer` for move history (your `vite-react` repo has examples).

### Problem: Star rating / controlled component

```javascript
function Rating({ value, onChange, max = 5 }) {
  return (
    <div role="radiogroup" aria-label="Rating">
      {Array.from({ length: max }, (_, i) => (
        <button
          key={i}
          type="button"
          role="radio"
          aria-checked={value === i + 1}
          onClick={() => onChange(i + 1)}
        >
          ★
        </button>
      ))}
    </div>
  );
}
```

### Problem: Implement `useReducer` from scratch (conceptual)

Interview tests understanding of reducer purity: `(state, action) => newState`, no mutation.

### Check Your Understanding — Questions & Reasoning

**Q1. Interviewer asks debounced search in 20 minutes — minimum viable architecture?**  
**Reasoning:** Controlled input → debounced value → fetch or `useQuery` with `enabled: debounced.length >= 2` → loading/error/empty states. Mention abort/race handling — shows senior awareness in one sentence.  
**Core takeaway:** State machine: idle → loading → success/error.

**Q2. Infinite scroll — how prevent duplicate page fetches?**  
**Reasoning:** `isFetching` guard, intersection observer on sentinel, reset when filter changes. React Query `useInfiniteQuery` handles `getNextPageParam` — prefer mentioning library over raw scroll math if time short.  
**Core takeaway:** One in-flight page request; reset on filter change.

**Q3. Modal — why portal to `document.body`?**  
**Reasoning:** Escapes `overflow: hidden` / z-index stacking from parents. Focus trap + Escape still required for a11y — portal alone isn't enough.  
**Core takeaway:** Portal fixes stacking; a11y fixes interaction.

**Q4. Tic-tac-toe — lift state or reducer?**  
**Reasoning:** **Lift** if one parent board owns game; **`useReducer`** if move history, undo, or complex rules — immutable updates `board[row][col] = x` with copied arrays.  
**Core takeaway:** Reducer when transitions are multi-step or replayable.

---

## 26. Frontend System Design for React Apps

### Typical prompt

"Design the frontend for a news feed / ecommerce PLP / collaborative doc."

### Structure your answer

1. **Requirements** — functional, non-functional (scale, offline, SEO)
2. **Data model** — entities, relationships, cache keys
3. **API contract** — REST vs GraphQL, pagination (cursor vs offset)
5. **Component architecture** — route-level pages, feature folders, design system
6. **State** — server vs client split (diagram)
7. **Performance** — splitting, CDN, image optimization, virtualization
8. **Reliability** — error boundaries, retries, optimistic UI rollback
9. **Observability** — logging, Real User Monitoring

### ASCII: high-level SPA

```
┌──────────── Browser ────────────┐
│  React app (routes + features)   │
│    ├─ React Query cache          │
│    ├─ UI state (Zustand/Context) │
│    └─ Presentational components  │
└──────────────┬──────────────────┘
               │ HTTPS
               ▼
┌──────────── API / BFF ──────────┐
│  Auth, aggregation, rate limits  │
└──────────────┬──────────────────┘
               ▼
         Microservices / DB
```

### Micro-frontends (senior bonus)

Module Federation, single-spa — independent deploys, shared design tokens, version skew risks.

### Check Your Understanding — Questions & Reasoning

**Q1. "Design Instagram feed" — first three questions you ask?**  
**Reasoning:** Functional (infinite scroll, stories, real-time?), non-functional (latency, offline?), scale (read vs write). Shows you don't jump to components before requirements — senior signal.  
**Core takeaway:** Clarify requirements before architecture.

**Q2. Where does feed data cache live on frontend?**  
**Reasoning:** React Query with cursor pagination, optimistic like counts, WebSocket or polling for updates with invalidation. Separate **server cache** from UI toggle state.  
**Core takeaway:** Server cache layer + normalized entities if complex.

**Q3. How split bundles for large React app?**  
**Reasoning:** Route-based code splitting, vendor chunk, lazy heavy editors/charts, prefetch on hover for likely next route. Mention measuring with bundle analyzer.  
**Core takeaway:** Split by route + heavy deps; measure bundle.

**Q4. Micro-frontends — one benefit, one risk?**  
**Reasoning:** **Benefit:** independent team deploys. **Risk:** version skew, duplicate React, shared design consistency, performance of multiple bundles.  
**Core takeaway:** Team autonomy vs operational complexity.

---

## 27. Behavioral & Architecture Interview Questions

### Sample questions with answer angles

**Q: Class vs function components?**  
A: Functions + hooks are standard; classes for legacy/error boundaries. Hooks enable composition without hierarchy cost.

**Q: How do you prevent unnecessary re-renders?**  
A: Colocate state, split context, memo at measured boundaries, stable callbacks where profiling shows need.

**Q: React 18 vs 17?**  
A: Automatic batching everywhere, `createRoot`, transitions, Strict Mode double-invoke effects in dev, streaming SSR improvements.

**Q: When would you eject from React?**  
A: Rare; might use canvas/WebGL island, embed via web components. Honest tradeoff answer beats zealotry.

**Q: Largest React app you shipped?**  
A: Use STAR: Situation, Task, Action, Result — mention metrics (LCP, error rate, bundle size).

### Check Your Understanding — Questions & Reasoning

**Q1. "Tell me about a performance win" — structure answer?**  
**Reasoning:** **STAR** + numbers: "LCP 4.2s → 2.1s by route splitting and image lazy load; measured in Lighthouse CI." Vague "I optimized React" fails senior bar.  
**Core takeaway:** Metrics + method + business impact.

**Q2. React 18 vs 17 — name three differences?**  
**Reasoning:** `createRoot`, automatic batching everywhere, transitions/`useDeferredValue`, Strict Mode stricter dev, streaming SSR APIs. Pick three you can explain deeply.  
**Core takeaway:** 18 = batching + concurrent features + new root API.

**Q3. "When would you leave React?" — good answer shape?**  
**Reasoning:** Honest scope: static site, native mobile, canvas-heavy with no DOM. Not religious — "right tool" + you'd still recommend React for complex web apps team knows.  
**Core takeaway:** Pragmatism over fanboyism.

**Q4. Disagreed with tech choice — what interviewer wants?**  
**Reasoning:** Collaboration story: data or prototype convinced team, or you disagreed and committed after decision. Shows maturity, not "I was right."  
**Core takeaway:** Influence with evidence; support team decisions.

---

## 28. Advanced Patterns

### 1. State machines (XState)

Explicit states vs boolean soup (`isLoading && !error && !success`). Great for wizards, checkout flows.

### 2. Portal-based tooltips and overlays

Escape stacking context; render at `document.body`.

### 3. `useEvent` pattern (stable handler, experimental/stable in React 19+)

Handler always sees latest props without breaking effect deps — know name for "stale closure in effects" discussions.

### 5. Ref as prop (React 19)

`ref` passed like `ref={ref}` without `forwardRef` — migration note for interviews in 2025+.

### 6. Partial pre-rendering / PPR (Next.js)

Static shell + dynamic holes — tie to RSC and streaming.

### 7. Feature-sliced design

`app / pages / widgets / features / entities / shared` — scalable folder conventions.

### 8. Design system integration

Compound components + tokens + Storybook visual regression.

### Check Your Understanding — Questions & Reasoning

**Q1. Checkout has `isLoading`, `isPaying`, `isSuccess`, `error` booleans — problem?**  
**Reasoning:** **Impossible states** (`isLoading && isSuccess`). State machine (XState or reducer) makes transitions explicit — senior refactor story.  
**Core takeaway:** Machines eliminate invalid boolean combinations.

**Q2. What is PPR (Partial Prerendering)?**  
**Reasoning:** Static shell ships fast; dynamic holes stream in — blends SSG speed with personalized content. Tie to Next.js and RSC architecture discussions.  
**Core takeaway:** PPR = static frame + dynamic streaming slots.

**Q3. Feature-sliced design — why?**  
**Reasoning:** Layers (`entities`, `features`, `shared`) reduce import chaos in monoliths — clear dependency direction. Shows experience on large codebases.  
**Core takeaway:** Folders enforce dependency rules at scale.

**Q4. Stable event handler in effect without adding handler to deps?**  
**Reasoning:** **`useEffectEvent` / useEvent pattern** (React 19+) — or ref holding latest handler. Discuss stale closure problem and why eslint wants deps.  
**Core takeaway:** Latest handler without effect re-subscribe churn.

---

## 29. When to Use What — Decision Guide

```
Need shared async server data?
  YES → React Query / SWR
  NO ↓
Need global client state updating often?
  YES → Zustand / Redux / split Context
  NO ↓
Only parent-child communication?
  YES → props / lift state
  NO ↓
Deep tree, low-frequency theme/auth?
  YES → Context (+ split dispatch/state)
```

| Scenario | Recommendation |
|----------|----------------|
| Form with validation | React Hook Form + Zod |
| List 10k+ rows | Virtualization |
| SEO marketing page | SSR/SSG (Next.js) |
| Dashboard behind login | CSR + React Query often enough |
| Real-time updates | WebSocket + query invalidation or local merge |
| Heavy chart | Canvas/lib island, don't rerender parent |
| Modal | Portal + focus trap + aria |

**Default senior stack (2025):** React 18+, TypeScript, Vite, React Router, TanStack Query, Zustand or RTK if needed, RTL + MSW, ESLint + Prettier.

### Check Your Understanding — Questions & Reasoning

**Q1. New feature needs API data shown in three routes — your state choice?**  
**Reasoning:** **React Query** with shared `queryKey` — cache dedupes fetches, each route `useQuery` reads same cache. Not Context, not Redux for raw GET list.  
**Core takeaway:** Server data → query library with shared keys.

**Q2. Theme toggle only — Context or Zustand?**  
**Reasoning:** **Context** enough — rare updates, few consumers. Zustand if you already use it app-wide or need selectors from many fields without re-render.  
**Core takeaway:** Match tool to update frequency and consumer count.

**Q3. Ecommerce filters must be shareable via link?**  
**Reasoning:** **URL search params** — not Zustand alone. State dies on refresh otherwise; bad for PLP interviews.  
**Core takeaway:** Shareable UI state → URL first.

**Q4. Walk decision tree: "global modal open state" — where?**  
**Reasoning:** If many distant components trigger modals → **Zustand/Context**. If one layout owns all modals → **layout state**. If route-specific → colocated.  
**Core takeaway:** Global only when trigger sites are scattered.

---

## 30. Common Pitfalls & How to Avoid Them

### Pitfall 1: Stale closure in effects

```javascript
// BAD
useEffect(() => {
  const id = setInterval(() => console.log(count), 1000);
  return () => clearInterval(id);
}, []); // logs initial count forever

// GOOD: include dep, or use functional updates / ref for latest
useEffect(() => {
  const id = setInterval(() => console.log(count), 1000);
  return () => clearInterval(id);
}, [count]);
```

### Pitfall 2: Missing effect cleanup

Subscriptions, timers, abort controllers leak without cleanup.

### Pitfall 3: Overusing `useEffect` for derived data

```javascript
// BAD
useEffect(() => setFullName(first + ' ' + last), [first, last]);

// GOOD
const fullName = `${first} ${last}`;
```

### Pitfall 4: Index keys in dynamic lists

See Section 11.

### Pitfall 5: Prop drilling vs context explosion

Start with composition; introduce context/store at clear boundaries.

### Pitfall 6: Premature `memo` / `useCallback`

Adds complexity; unstable deps anyway if parent recreates objects.

### Pitfall 7: Fetch on every render / missing race handling

Use abort, React Query, or `ignore` flag.

### Pitfall 8: Putting app-wide state in React when it belongs in URL

Shareable filters should be search params.

### Pitfall 9: Ignoring Strict Mode dev double-mount

Effects must be idempotent; cleanup required.

### Pitfall 10: Error boundaries for event handlers only

Handlers need `try/catch`; boundaries won't catch them.

### Check Your Understanding — Questions & Reasoning

**Q1. Identify the bug: `useEffect(() => setFullName(first + last), [first, last])`.**  
**Reasoning:** **Derived state in effect** — extra render, flash risk. Compute `fullName` in render directly. Effect should sync **external** systems only.  
**Core takeaway:** Don't effect what you can compute.

**Q2. Effect runs twice in dev only — is production broken?**  
**Reasoning:** **Strict Mode** double-invoke in dev to expose missing cleanup. Fix idempotent effects + cleanup; production runs once per mount cycle for that pattern.  
**Core takeaway:** Double mount in dev = feature, not bug.

**Q3. List uses index key — when is it acceptable?**  
**Reasoning:** **Static list** never reorder/filter/delete — rare. Dynamic lists → ids. Interview answer: "almost never for dynamic data."  
**Core takeaway:** Index keys only for static lists.

**Q4. Wrapped app in Error Boundary expecting to catch button click errors.**  
**Reasoning:** **Won't work** — use try/catch in handler. Boundary is for render-phase failures in children.  
**Core takeaway:** Boundaries ≠ event error handling.

---

## 31. Strict Mode, React 19, and Tooling

### React Strict Mode (development)

Strict Mode **does not render twice in production**. In development it intentionally:

- Double-invokes render and effects to surface non-idempotent side effects
- Warns about deprecated APIs (`findDOMNode`, legacy context)

```javascript
// main.jsx
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

**Interview answer:** "If my effect subscribes twice in dev only, I fix cleanup — production won't double-run, but bugs like missing unsubscribe are real."

### React 19 highlights (know names)

| Feature | Why interviewers care |
|---------|------------------------|
| **Actions / `useActionState`** | Form mutations with pending state built-in |
| **`useOptimistic`** | Optimistic UI during async transitions |
| **`ref` as prop** | Less `forwardRef` boilerplate |
| **Document metadata** | `<title>`, `<meta>` in components |
| **Improved hydration errors** | Easier SSR debugging |

You don't need API memorization — say: "I'd check release notes; we standardize on LTS and upgrade with codemods and visual regression."

### Vite + React (your practice stack)

```
Source (.jsx) → @vitejs/plugin-react (Babel or SWC) → ESM bundles
                → Fast Refresh preserves component state in dev
```

**vs Webpack:** Vite pre-bundles deps with esbuild, serves native ESM in dev → faster cold start. Webpack still common in enterprise legacy.

**Production:** `vite build` → Rollup, code-splitting, tree-shaking. Mention `manualChunks` for vendor splitting.

### CSS strategies (brief comparison)

| Approach | Tradeoff |
|----------|----------|
| CSS Modules | Scoped class names, zero runtime |
| Tailwind | Utility-first, design tokens in config |
| CSS-in-JS (styled-components) | Colocation; runtime cost (improving with compilers) |
| Vanilla Extract | Type-safe, zero runtime |

Senior line: "I match team standards; performance-sensitive surfaces favor static CSS or zero-runtime solutions."

### Check Your Understanding — Questions & Reasoning

**Q1. Effect logs "subscribed" twice on mount in dev — explain to junior.**  
**Reasoning:** **Strict Mode** mounts, unmounts, remounts intentionally to verify cleanup runs. Missing cleanup → duplicate subscriptions in production too eventually. Teach cleanup, not disabling Strict Mode.  
**Core takeaway:** Strict Mode exposes effect hygiene issues.

**Q2. Vite vs Webpack for React — one-liner each?**  
**Reasoning:** **Vite:** ESM dev server, esbuild prebundle, fast HMR. **Webpack:** mature ecosystem, complex configs, common in legacy enterprise. Your repo uses Vite — tie to practice.  
**Core takeaway:** Vite = dev speed; Webpack = legacy ubiquity.

**Q3. React 19 `useOptimistic` — what problem?**  
**Reasoning:** Show **optimistic UI** during async transition (like message sent) with automatic rollback on failure — pairs with Actions/transitions. Name-drop if you haven't used: "UI responds before server confirms."  
**Core takeaway:** Optimistic UX with rollback built into model.

**Q4. Fast Refresh vs full reload?**  
**Reasoning:** Fast Refresh **preserves state** when you edit components if exports are React-compatible. Syntax error or non-component export may full reload — know for dev DX interviews.  
**Core takeaway:** HMR keeps state when safe.

---

## 32. Senior Interview Question Bank — Model Answers

Organized by theme for **cross-topic review** after you complete sections 1–31. Each section above already has **Check Your Understanding** with full reasoning — use this bank for mixed mock interviews. Answers are **concise models** — expand with examples from your experience.

### Fundamentals

**Q: Difference between `react` and `react-dom`?**  
A: `react` = hooks, components, reconciliation (platform-agnostic). `react-dom` = browser renderer — `createRoot`, DOM updates, portals, hydration. Both required for web; hooks always from `react`.

**Q: `react-router` vs `react-router-dom`?**  
A: Core routing logic vs web bindings (`BrowserRouter`, `Link`). Web SPAs install `react-router-dom`.

**Q: Virtual DOM — what and why?**  
A: In-memory representation of UI as plain objects. React diffs trees to compute minimal DOM operations. Not the whole story — Fiber scheduler and priorities matter for concurrent features. See internals doc.

**Q: Difference between element and component?**  
A: Element is immutable description (`type`, `props`). Component is function/class that **produces** elements when React invokes it.

**Q: Controlled vs uncontrolled?**  
A: Controlled: React state drives input value. Uncontrolled: DOM holds value; read via ref, often on submit. Controlled gives live validation; uncontrolled reduces re-renders for simple forms.

**Q: Why one-way data flow?**  
A: Predictable debugging — single direction makes it obvious where data changed. Two-way binding spreads mutations across graph.

### Hooks & effects

**Q: Why can't hooks be inside conditions?**  
A: Hook state stored in linked list indexed by call order. Conditional call breaks order between renders → wrong state paired with wrong hook.

**Q: `useEffect` vs `useLayoutEffect`?**  
A: `useEffect` after paint — good for fetch, subscriptions. `useLayoutEffect` before paint — measure DOM, prevent flash; blocks painting.

**Q: Empty dependency array pitfalls?**  
A: Captures stale props/state from first render. Fix: add deps, use functional updates, or refs for latest values in stable callbacks.

**Q: How to cancel fetch on unmount?**  
A: `AbortController` in effect cleanup, or `let ignore = false` guard before `setState`.

### State & architecture

**Q: When Redux vs Context?**  
A: Context for infrequent global (theme, auth snapshot). Redux/Zustand when many updates, middleware, devtools, selectors, or large teams need conventions. Server state → React Query, not Redux.

**Q: Prop drilling — solutions?**  
A: Colocate, composition (`children`), context, or route loaders. Don't reach for global store first.

**Q: Lifting state up — example?**  
A: Two date pickers sharing selection — parent owns `date`, passes `value` + `onChange`.

### Performance

**Q: When does React re-render?**  
A: State/context change in self or ancestor (unless bailout). Parent render re-renders children by default.

**Q: `useMemo` vs `React.memo`?**  
A: `useMemo` caches a **value** inside one component. `memo` skips **re-render** of child when props shallow-equal.

**Q: How optimize a 10k row table?**  
A: Virtualization, pagination, stable row keys, avoid inline object props to memo rows, server-side sort/filter if possible.

### Concurrent & SSR

**Q: What problem does `useTransition` solve?**  
A: Keeps UI responsive by marking state updates low-priority so typing isn't blocked by expensive re-renders.

**Q: Hydration mismatch — causes?**  
A: Non-deterministic render, browser-only APIs on server, invalid HTML, clock/random in SSR output.

**Q: RSC vs SSR?**  
A: SSR sends HTML+client JS for hydration. RSC runs components on server, ships serialized result — can reduce client bundle for server-only logic.

### Testing & quality

**Q: How test a hook?**  
A: `renderHook` from Testing Library with wrapper for providers; assert on `result.current`.

**Q: Mock API or mock fetch?**  
A: Prefer MSW to intercept network — tests stay close to production.

### Coding & patterns

**Q: Implement debounce hook.**  
A: `useEffect` + `setTimeout` + cleanup on value/delay change (see Section 24).

**Q: HOC vs custom hook?**  
A: Prefer hook for sharing logic; HOC when wrapping component tree for cross-cutting display concerns (legacy auth wrappers).

**Q: Error boundary limitations?**  
A: No event handlers, async in effects unless rethrown during render, not for SSR without framework support.

### Fullstack / production

**Q: XSS in React?**  
A: Default escaping safe; risk from `dangerouslySetInnerHTML` and unsafe URLs. Sanitize server-side.

**Q: Auth token storage?**  
A: Prefer HttpOnly cookies over localStorage for XSS resilience; CSRF protections for cookie-based auth.

**Q: Code splitting strategy?**  
A: Route-based splits, lazy heavy charts/editors, prefetch on navigation intent.

### Trick questions (know the gotcha)

```javascript
// Q: What logs?
function App() {
  const [n, setN] = useState(0);
  useEffect(() => {
    setN(1);
    setN(2);
    setN(3);
  }, []);
  console.log(n);
}
// A: Logs 0 then 3 (batch). Not 0,1,2,3.
```

```javascript
// Q: Infinite loop?
function Bad({ obj }) {
  const [x, setX] = useState(obj);
  useEffect(() => setX(obj), [obj]); // new object ref every parent render → loop if parent passes {}
}
// A: Fix deps — compare id, or lift/normalize data.
```

---

## Summary Cheatsheet

| Topic | One-line answer | Deep dive |
|-------|-----------------|-----------|
| React packages | `react` = core; `react-dom` = web renderer; router = ecosystem | §4 |
| React core | UI = f(state); reconcile + commit | §1–4, `04-React-Internals` |
| Data flow | Props down, events up | §7 |
| Hooks rules | Top-level only, fixed order | §9, internals doc |
| Effects | Sync external systems; cleanup | §9, §14 |
| Keys | Stable IDs for dynamic lists | §11 |
| Context | Low-frequency global; split providers | §12 |
| Server state | React Query > raw useEffect | §14 |
| Performance | Profile → colocate → memo boundary | §16 |
| Concurrent | `useTransition` / deferred value | §17 |
| SSR/RSC | HTML first, hydrate; RSC on server | §18 |
| Testing | RTL user-centric + MSW | §20 |
| Patterns | Hooks > HOC; compound for APIs | §23–24 |
| Pitfalls | Stale closures, index keys, effect abuse | §30 |

### Default interview narrative (60 seconds)

> "React lets me describe UI as a function of state and handles efficient DOM updates through reconciliation. I colocate state, put async server data in React Query with proper cache keys, and reserve Context or Zustand for truly client-global concerns. For performance I profile first, then use memoization at proven boundaries. I'm comfortable with React 18 concurrent features, SSR/hydration tradeoffs, error boundaries, and testing with Testing Library. For legacy topics I can map class lifecycles to hooks and explain Fiber at a high level when needed."

### Map to your `vite-react` practice repo

| Repo component | Concept to review |
|----------------|-------------------|
| `ContextAPI`, `ContextReducer` | Context, useReducer |
| `UseMemo`, `UseCallback` | Memoization |
| `ErrorBoundaryComponent` | Error boundaries |
| `SuspenseComponent`, `LazyloadingImage` | Suspense, lazy |
| `Portal`, `ModalComponent` | Portals, focus |
| `InfiniteScroll`, `Pagination` | Lists, virtualization |
| `DebounceSearch`, hooks | Custom hooks |
| `HOC` | Higher-order components |
| `WebWorker` | Off main thread (not React-specific but FE senior) |

---

*End of guide. For Fiber lanes, update queues, and hook linked lists, continue with [`04-React-Internals.md`](./04-React-Internals.md).*
