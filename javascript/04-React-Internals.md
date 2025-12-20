# React Internals: A Deep Dive

## Table of Contents

1. [Introduction](#introduction)
2. [Virtual DOM](#virtual-dom)
   - JSX Transformation Pipeline
   - React Element Structure
   - Security ($$typeof)
3. [Reconciliation Algorithm](#reconciliation-algorithm)
   - Diffing Rules
   - Keys and List Reconciliation
   - Complete Step-by-Step Example
   - State Preservation Rules
4. [Fiber Architecture](#fiber-architecture)
   - Fiber Node Structure
   - Tree Navigation
   - Double Buffering
   - Fiber Traversal Example
   - Interruptible Rendering
5. [Rendering Phases](#rendering-phases)
   - Render Phase (Reconciliation)
   - Commit Phase
   - Work Loop
   - Effect Execution Order
6. [Hooks Internals](#hooks-internals)
   - Hooks Linked List
   - useState Implementation
   - Rules of Hooks
   - Complete Hooks Execution Example
   - useRef vs useState
   - Custom Hooks
7. [Batching & State Updates](#batching--state-updates)
   - Automatic Batching (React 18)
   - Update Queue Processing
   - flushSync
8. [Concurrent React](#concurrent-react)
   - useTransition
   - useDeferredValue
   - Priority Lanes
   - Suspense
9. [React Server Components](#react-server-components)
10. [Performance Optimization Internals](#performance-optimization-internals)
    - React.memo
    - useMemo & useCallback
    - Bailout Conditions
    - Children as Props Pattern
    - Context Optimization
    - Debugging Re-renders
11. [Common Bugs and How to Debug Them](#common-bugs-and-how-to-debug-them)
12. [Interview Questions](#interview-questions)
13. [Practical Interview Coding Patterns](#practical-interview-coding-patterns)
    - Custom Hooks (useDebounce, usePrevious, useFetch, etc.)
    - Higher Order Components
    - Render Props
    - Compound Components
    - forwardRef & useImperativeHandle

---

## Introduction

Understanding React's internal mechanisms is crucial for:
- Writing performant React applications
- Debugging complex issues
- Making informed architectural decisions
- Acing senior-level interviews

```
┌─────────────────────────────────────────────────────────────────────┐
│                    REACT'S CORE ARCHITECTURE                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   Your Code                                                          │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  JSX → React.createElement() → React Elements (Objects)     │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                              │                                       │
│                              ▼                                       │
│   React Core                                                         │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  Fiber Tree → Reconciliation → Work Loop → Effects          │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                              │                                       │
│                              ▼                                       │
│   React Renderer (react-dom, react-native, etc.)                    │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  Commit Phase → DOM Updates / Native Updates                 │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Virtual DOM

### What is the Virtual DOM?

The **Virtual DOM (VDOM)** is a lightweight JavaScript representation of the actual DOM. It's a programming concept where a "virtual" representation of the UI is kept in memory and synced with the "real" DOM.

```javascript
// JSX
<div className="container">
  <h1>Hello</h1>
  <p>World</p>
</div>

// Compiles to React.createElement() calls
React.createElement(
  'div',
  { className: 'container' },
  React.createElement('h1', null, 'Hello'),
  React.createElement('p', null, 'World')
)

// Produces a React Element (Plain JavaScript Object)
{
  type: 'div',
  props: {
    className: 'container',
    children: [
      { type: 'h1', props: { children: 'Hello' } },
      { type: 'p', props: { children: 'World' } }
    ]
  }
}
```

### Why Virtual DOM?

```
┌─────────────────────────────────────────────────────────────────────┐
│                    WHY VIRTUAL DOM?                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   Problem: Direct DOM manipulation is expensive                      │
│                                                                      │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │  DOM Operation Cost (relative)                                │ │
│   │                                                               │ │
│   │  JavaScript object manipulation: 1x                           │ │
│   │  Reading DOM property: 10x                                    │ │
│   │  Writing DOM property: 100x                                   │ │
│   │  Layout/Reflow: 1000x                                         │ │
│   │  Paint: 1000x+                                                │ │
│   └───────────────────────────────────────────────────────────────┘ │
│                                                                      │
│   Solution: Batch and minimize DOM operations                        │
│                                                                      │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │                                                               │ │
│   │   State Change → New VDOM → Diff with Old VDOM → Patch DOM   │ │
│   │                                                               │ │
│   │   Only the MINIMUM necessary DOM operations are performed     │ │
│   │                                                               │ │
│   └───────────────────────────────────────────────────────────────┘ │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Virtual DOM vs Real DOM

```javascript
// Without Virtual DOM (jQuery style)
// Each operation touches the real DOM
$('#counter').text(count);      // DOM write
$('#list').append('<li>New</li>'); // DOM write + reflow
$('.item').addClass('active');  // Multiple DOM writes

// With Virtual DOM (React style)
// Changes are batched
setState({ count: count + 1, items: [...items, 'New'] });
// React:
// 1. Creates new VDOM tree
// 2. Diffs with old VDOM tree
// 3. Calculates minimum DOM operations
// 4. Applies all changes in ONE batch
```

### React Element Structure

```javascript
// A React Element is a plain object describing a component instance or DOM node
const element = {
  $$typeof: Symbol.for('react.element'), // Security: prevents JSON injection
  type: 'div',                           // String for DOM, Function/Class for components
  key: null,                             // For reconciliation
  ref: null,                             // For accessing DOM/instance
  props: {
    className: 'container',
    children: [/* nested elements */]
  },
  _owner: null,                          // Fiber that created this element
};

// Component Element
const componentElement = {
  $$typeof: Symbol.for('react.element'),
  type: MyComponent,                     // Function or Class reference
  key: null,
  ref: null,
  props: { name: 'John' },
};
```

### Detailed Example: JSX to React Elements

Let's trace through exactly what happens when React processes your JSX:

```javascript
// Your JSX Component
function App() {
  return (
    <div className="app">
      <Header title="Welcome" />
      <main>
        <p>Hello, World!</p>
      </main>
    </div>
  );
}

// Step 1: Babel compiles JSX to React.createElement calls
function App() {
  return React.createElement(
    'div',
    { className: 'app' },
    React.createElement(Header, { title: 'Welcome' }),
    React.createElement(
      'main',
      null,
      React.createElement('p', null, 'Hello, World!')
    )
  );
}

// Step 2: React.createElement returns React Elements (plain objects)
// When App() is called, it returns:
{
  $$typeof: Symbol.for('react.element'),
  type: 'div',
  key: null,
  ref: null,
  props: {
    className: 'app',
    children: [
      {
        $$typeof: Symbol.for('react.element'),
        type: Header,  // Function reference, not string!
        key: null,
        ref: null,
        props: { title: 'Welcome' }
      },
      {
        $$typeof: Symbol.for('react.element'),
        type: 'main',
        key: null,
        ref: null,
        props: {
          children: {
            $$typeof: Symbol.for('react.element'),
            type: 'p',
            key: null,
            ref: null,
            props: { children: 'Hello, World!' }
          }
        }
      }
    ]
  }
}
```

```
┌─────────────────────────────────────────────────────────────────────┐
│                    JSX TRANSFORMATION PIPELINE                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   1. JSX (Developer writes)                                         │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │  <Button color="blue" onClick={handleClick}>                  │ │
│   │    Click Me                                                   │ │
│   │  </Button>                                                    │ │
│   └───────────────────────────────────────────────────────────────┘ │
│                              │                                       │
│                              ▼  Babel Transform                      │
│   2. React.createElement() calls                                    │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │  React.createElement(                                         │ │
│   │    Button,                          // type                   │ │
│   │    { color: "blue", onClick: handleClick },  // props         │ │
│   │    "Click Me"                       // children               │ │
│   │  )                                                            │ │
│   └───────────────────────────────────────────────────────────────┘ │
│                              │                                       │
│                              ▼  createElement returns                │
│   3. React Element (Plain Object)                                   │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │  {                                                            │ │
│   │    $$typeof: Symbol.for('react.element'),                     │ │
│   │    type: Button,                                              │ │
│   │    key: null,                                                 │ │
│   │    ref: null,                                                 │ │
│   │    props: {                                                   │ │
│   │      color: "blue",                                           │ │
│   │      onClick: handleClick,                                    │ │
│   │      children: "Click Me"                                     │ │
│   │    }                                                          │ │
│   │  }                                                            │ │
│   └───────────────────────────────────────────────────────────────┘ │
│                              │                                       │
│                              ▼  Reconciliation                       │
│   4. Fiber Node (React's internal representation)                   │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │  {                                                            │ │
│   │    tag: FunctionComponent,                                    │ │
│   │    type: Button,                                              │ │
│   │    stateNode: null,                                           │ │
│   │    memoizedProps: { color: "blue", ... },                     │ │
│   │    memoizedState: null,                                       │ │
│   │    child: ..., sibling: ..., return: ...                      │ │
│   │  }                                                            │ │
│   └───────────────────────────────────────────────────────────────┘ │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Why $$typeof Symbol Exists (Security)

```javascript
// ❌ Security vulnerability without $$typeof
// If server returns user-controlled JSON:
const userInput = {
  type: 'div',
  props: {
    dangerouslySetInnerHTML: { __html: '<script>evil()</script>' }
  }
};

// React could accidentally render this as a valid element!
// But Symbols can't be created from JSON.parse()

// ✅ React checks for $$typeof
// Since Symbol.for('react.element') can't come from JSON,
// user input can never be mistaken for a React element
```

---

## Reconciliation Algorithm

**Reconciliation** is the algorithm React uses to diff one tree with another to determine which parts need to be changed.

### The Diffing Algorithm

React implements a heuristic O(n) algorithm based on two assumptions:

1. **Different types produce different trees** - If element type changes, rebuild entire subtree
2. **Keys hint at stable identity** - Elements with same key are the same across renders

```
┌─────────────────────────────────────────────────────────────────────┐
│                    RECONCILIATION RULES                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   RULE 1: Different Element Types → Replace Entire Subtree          │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │                                                               │ │
│   │   Before:  <div><Counter /></div>                             │ │
│   │   After:   <span><Counter /></span>                           │ │
│   │                                                               │ │
│   │   Result:  Entire <div> tree destroyed                        │ │
│   │            New <span> tree created                            │ │
│   │            Counter component UNMOUNTS and REMOUNTS            │ │
│   │            All state is LOST                                  │ │
│   │                                                               │ │
│   └───────────────────────────────────────────────────────────────┘ │
│                                                                      │
│   RULE 2: Same Element Type → Update Props Only                      │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │                                                               │ │
│   │   Before:  <div className="old" title="x" />                  │ │
│   │   After:   <div className="new" title="x" />                  │ │
│   │                                                               │ │
│   │   Result:  Same DOM node kept                                 │ │
│   │            Only className attribute updated                    │ │
│   │            title unchanged (not touched)                       │ │
│   │                                                               │ │
│   └───────────────────────────────────────────────────────────────┘ │
│                                                                      │
│   RULE 3: Component Type → Re-render with New Props                  │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │                                                               │ │
│   │   Before:  <Profile user={alice} />                           │ │
│   │   After:   <Profile user={bob} />                             │ │
│   │                                                               │ │
│   │   Result:  Same component instance                            │ │
│   │            State is PRESERVED                                 │ │
│   │            componentDidUpdate / useEffect runs                │ │
│   │                                                               │ │
│   └───────────────────────────────────────────────────────────────┘ │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Keys and List Reconciliation

```javascript
// ❌ Without keys - Inefficient
// React can't identify which items changed
<ul>
  {items.map(item => <li>{item.name}</li>)}
</ul>

// If you insert at the beginning:
// Before: [A, B, C]
// After:  [Z, A, B, C]
// React thinks: A→Z, B→A, C→B, +D (updates ALL items!)

// ✅ With keys - Efficient
<ul>
  {items.map(item => <li key={item.id}>{item.name}</li>)}
</ul>

// React knows: A stays, B stays, C stays, Z is new
// Only inserts Z at the beginning
```

```
┌─────────────────────────────────────────────────────────────────────┐
│                    KEY RECONCILIATION                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   WITHOUT KEYS (using index):                                        │
│                                                                      │
│   Before:  [ li(0)="A"  li(1)="B"  li(2)="C" ]                      │
│   After:   [ li(0)="Z"  li(1)="A"  li(2)="B"  li(3)="C" ]           │
│                                                                      │
│   React's interpretation:                                            │
│   - Index 0: "A" → "Z" (UPDATE content)                              │
│   - Index 1: "B" → "A" (UPDATE content)                              │
│   - Index 2: "C" → "B" (UPDATE content)                              │
│   - Index 3: (CREATE new with "C")                                   │
│                                                                      │
│   Result: 4 DOM operations! 😱                                       │
│                                                                      │
│   ─────────────────────────────────────────────────────────────────  │
│                                                                      │
│   WITH UNIQUE KEYS:                                                  │
│                                                                      │
│   Before:  [ li(key=a)="A"  li(key=b)="B"  li(key=c)="C" ]          │
│   After:   [ li(key=z)="Z"  li(key=a)="A"  li(key=b)="B"  ...]      │
│                                                                      │
│   React's interpretation:                                            │
│   - key=z: Not found before (CREATE new, insert at start)            │
│   - key=a, key=b, key=c: Same (NO CHANGE, just reposition)          │
│                                                                      │
│   Result: 1 DOM operation! 🚀                                        │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Why Index as Key is Bad

```javascript
// ❌ Problem: Using index as key
function TodoList({ todos }) {
  return (
    <ul>
      {todos.map((todo, index) => (
        <li key={index}>
          <input type="checkbox" />
          {todo.text}
        </li>
      ))}
    </ul>
  );
}

// Scenario: Delete item at index 0
// Before: [{text: "A"}, {text: "B"}, {text: "C"}]
// User checks checkbox on "A"
// Delete "A"
// After: [{text: "B"}, {text: "C"}]

// What happens:
// - Index 0: "A" → "B" (React updates text, keeps checkbox state!)
// - Index 1: "B" → "C" (React updates text, keeps checkbox state!)
// - Index 2: "C" removed

// Bug: Checkbox that was on "A" is now shown on "B"!
```

### Complete Reconciliation Example: Step by Step

Let's trace through a complete example of how React reconciles a component tree:

```javascript
// Initial render
function App() {
  const [user, setUser] = useState({ name: 'Alice', age: 25 });
  
  return (
    <div className="app">
      <h1>Profile</h1>
      <UserCard user={user} />
      <button onClick={() => setUser({ name: 'Bob', age: 30 })}>
        Switch User
      </button>
    </div>
  );
}

function UserCard({ user }) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  return (
    <div className="card">
      <span>{user.name}</span>
      {isExpanded && <span>Age: {user.age}</span>}
      <button onClick={() => setIsExpanded(!isExpanded)}>
        {isExpanded ? 'Less' : 'More'}
      </button>
    </div>
  );
}
```

```
┌─────────────────────────────────────────────────────────────────────┐
│          RECONCILIATION: When setUser({name: 'Bob'}) is called       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   STEP 1: React receives the state update                           │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │  setUser({ name: 'Bob', age: 30 })                            │ │
│   │  → Triggers re-render of App component                        │ │
│   │  → React schedules work on App's fiber                        │ │
│   └───────────────────────────────────────────────────────────────┘ │
│                                                                      │
│   STEP 2: React calls App() to get new elements                     │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │  OLD VDOM (Alice):              NEW VDOM (Bob):               │ │
│   │                                                               │ │
│   │  div.app                        div.app                       │ │
│   │  ├─ h1: "Profile"               ├─ h1: "Profile"    ✓ SAME   │ │
│   │  ├─ UserCard(Alice)             ├─ UserCard(Bob)    ≈ UPDATE │ │
│   │  └─ button                      └─ button           ✓ SAME   │ │
│   └───────────────────────────────────────────────────────────────┘ │
│                                                                      │
│   STEP 3: Diffing - Compare old and new                             │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │  <div className="app">                                        │ │
│   │    → Same type (div), same props → REUSE, no DOM change       │ │
│   │                                                               │ │
│   │  <h1>Profile</h1>                                             │ │
│   │    → Same type, same content → REUSE, no DOM change           │ │
│   │                                                               │ │
│   │  <UserCard user={user} />                                     │ │
│   │    → Same COMPONENT TYPE (UserCard function)                  │ │
│   │    → Props changed (user.name: Alice → Bob)                   │ │
│   │    → RE-RENDER UserCard with new props                        │ │
│   │    → BUT keep UserCard's internal state (isExpanded)!         │ │
│   │                                                               │ │
│   │  <button>                                                     │ │
│   │    → Same type, same content → REUSE, no DOM change           │ │
│   └───────────────────────────────────────────────────────────────┘ │
│                                                                      │
│   STEP 4: UserCard re-renders with new props                        │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │  UserCard receives: { user: { name: 'Bob', age: 30 } }        │ │
│   │                                                               │ │
│   │  ⚠️ IMPORTANT: isExpanded state is PRESERVED!                 │ │
│   │  React sees same component type at same position              │ │
│   │  So it keeps the existing fiber and its state                 │ │
│   │                                                               │ │
│   │  Inside UserCard:                                             │ │
│   │  <span>Alice</span>  →  <span>Bob</span>  // Text node update │ │
│   └───────────────────────────────────────────────────────────────┘ │
│                                                                      │
│   STEP 5: Commit - Apply minimal DOM changes                        │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │  DOM Operations performed:                                    │ │
│   │  1. textNode.nodeValue = "Bob"  // That's it! Just one op!   │ │
│   │                                                               │ │
│   │  DOM Operations NOT performed:                                │ │
│   │  - No div recreation                                          │ │
│   │  - No h1 recreation                                           │ │
│   │  - No button recreation                                       │ │
│   │  - No UserCard DOM recreation                                 │ │
│   └───────────────────────────────────────────────────────────────┘ │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### When Component Type Changes: State is Lost!

```javascript
// Example: Conditional component types
function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  
  return (
    <div>
      {isAdmin ? (
        <AdminDashboard />  // Component type A
      ) : (
        <UserDashboard />   // Component type B
      )}
      <button onClick={() => setIsAdmin(!isAdmin)}>Toggle</button>
    </div>
  );
}

function AdminDashboard() {
  const [tab, setTab] = useState('users');  // Has its own state
  return <div>Admin Tab: {tab}</div>;
}

function UserDashboard() {
  const [tab, setTab] = useState('home');   // Has its own state
  return <div>User Tab: {tab}</div>;
}
```

```
┌─────────────────────────────────────────────────────────────────────┐
│          STATE LOSS: When component TYPE changes                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   Initial: isAdmin = false                                          │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │  <div>                                                        │ │
│   │    <UserDashboard />  ← Fiber created, state: tab='home'      │ │
│   │    <button />                                                 │ │
│   │  </div>                                                       │ │
│   └───────────────────────────────────────────────────────────────┘ │
│                                                                      │
│   User clicks "Toggle" → isAdmin = true                             │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │  <div>                                                        │ │
│   │    <AdminDashboard />  ← DIFFERENT TYPE!                      │ │
│   │    <button />                                                 │ │
│   │  </div>                                                       │ │
│   │                                                               │ │
│   │  React's reconciliation:                                      │ │
│   │  Position 0: UserDashboard → AdminDashboard                   │ │
│   │            Types are DIFFERENT                                │ │
│   │                                                               │ │
│   │  Result:                                                      │ │
│   │  1. UNMOUNT UserDashboard (state lost!)                       │ │
│   │  2. MOUNT fresh AdminDashboard (state: tab='users')           │ │
│   └───────────────────────────────────────────────────────────────┘ │
│                                                                      │
│   User clicks "Toggle" again → isAdmin = false                      │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │  <div>                                                        │ │
│   │    <UserDashboard />  ← DIFFERENT TYPE again!                 │ │
│   │    <button />                                                 │ │
│   │  </div>                                                       │ │
│   │                                                               │ │
│   │  Result:                                                      │ │
│   │  1. UNMOUNT AdminDashboard (state lost!)                      │ │
│   │  2. MOUNT fresh UserDashboard (state: tab='home' again)       │ │
│   │                                                               │ │
│   │  ⚠️ The previous UserDashboard state is GONE FOREVER          │ │
│   └───────────────────────────────────────────────────────────────┘ │
│                                                                      │
│   KEY INSIGHT:                                                       │
│   Component identity = Component Type + Position in tree            │
│   Different type at same position = unmount old + mount new         │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### How to Preserve State with Key

```javascript
// ✅ Using key to preserve state across position changes
function App() {
  const [items, setItems] = useState([
    { id: 1, text: 'First' },
    { id: 2, text: 'Second' },
  ]);
  
  const addToStart = () => {
    setItems([{ id: Date.now(), text: 'New' }, ...items]);
  };
  
  return (
    <div>
      <button onClick={addToStart}>Add to Start</button>
      {items.map(item => (
        <ItemWithState key={item.id} text={item.text} />
      ))}
    </div>
  );
}

function ItemWithState({ text }) {
  const [count, setCount] = useState(0);
  
  return (
    <div>
      {text}: {count}
      <button onClick={() => setCount(c => c + 1)}>+</button>
    </div>
  );
}
```

```
┌─────────────────────────────────────────────────────────────────────┐
│          KEY-BASED RECONCILIATION                                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   Before adding new item:                                           │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │  Position 0: <ItemWithState key={1}> state: count=5           │ │
│   │  Position 1: <ItemWithState key={2}> state: count=3           │ │
│   └───────────────────────────────────────────────────────────────┘ │
│                                                                      │
│   After adding to start (with keys):                                │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │  Position 0: <ItemWithState key={123}> ← NEW (count=0)        │ │
│   │  Position 1: <ItemWithState key={1}>   ← MOVED (count=5 kept!)│ │
│   │  Position 2: <ItemWithState key={2}>   ← MOVED (count=3 kept!)│ │
│   │                                                               │ │
│   │  React matches by KEY, not position:                          │ │
│   │  - key=123: New, create fresh fiber                           │ │
│   │  - key=1: Found in old tree, reuse fiber + state              │ │
│   │  - key=2: Found in old tree, reuse fiber + state              │ │
│   └───────────────────────────────────────────────────────────────┘ │
│                                                                      │
│   After adding to start (WITHOUT keys / index as key):              │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │  Position 0: <ItemWithState key={0}> ← Was "First", now "New" │ │
│   │            Text changed, but state kept → count=5 BUG!        │ │
│   │  Position 1: <ItemWithState key={1}> ← Was "Second", now "First"│
│   │            count=3 shown for "First" BUG!                     │ │
│   │  Position 2: <ItemWithState key={2}> ← NEW "Second" (count=0) │ │
│   │                                                               │ │
│   │  ❌ State is mismatched because React used index, not content │ │
│   └───────────────────────────────────────────────────────────────┘ │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Fiber Architecture

**Fiber** is React's reconciliation engine, introduced in React 16. It's a complete rewrite of the React core algorithm.

### What is a Fiber?

A **Fiber** is a JavaScript object that represents a unit of work. Each React element has a corresponding Fiber node.

```javascript
// Simplified Fiber Node Structure
const fiber = {
  // Instance
  tag: FunctionComponent,        // Type of fiber (Function, Class, Host, etc.)
  type: MyComponent,             // The function/class/string
  key: null,                     // Key from JSX
  
  // Tree Structure
  return: parentFiber,           // Parent fiber
  child: firstChildFiber,        // First child
  sibling: nextSiblingFiber,     // Next sibling
  
  // State
  pendingProps: {},              // New props
  memoizedProps: {},             // Props used to create output
  memoizedState: null,           // State (hooks linked list for functions)
  
  // Effects
  flags: Placement | Update,     // Side effects to perform
  subtreeFlags: 0,               // Aggregated flags from subtree
  nextEffect: null,              // Next fiber with effects
  
  // Alternate (double buffering)
  alternate: currentFiber,       // The other version of this fiber
  
  // Priority
  lanes: DefaultLane,            // Priority lanes
};
```

### Fiber Tree Structure

```
┌─────────────────────────────────────────────────────────────────────┐
│                    FIBER TREE STRUCTURE                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   React Component Tree:          Fiber Tree:                         │
│                                                                      │
│         <App>                         App (Fiber)                    │
│           │                              │                           │
│       ┌───┴───┐                      child                          │
│       │       │                          │                           │
│    <Header> <Main>              Header (Fiber)                      │
│               │                     │    │                           │
│           <Content>            sibling   return                      │
│                                     │       │                        │
│                                     ▼       ▼                        │
│                                Main (Fiber) ───▶ App                 │
│                                     │                                │
│                                   child                              │
│                                     │                                │
│                                     ▼                                │
│                               Content (Fiber)                        │
│                                                                      │
│   Tree Navigation:                                                   │
│   - child: First child fiber                                         │
│   - sibling: Next sibling fiber                                      │
│   - return: Parent fiber                                             │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Double Buffering (Current vs Work-In-Progress)

React maintains two fiber trees:
1. **Current** - The tree currently rendered on screen
2. **Work-In-Progress (WIP)** - The tree being built

```
┌─────────────────────────────────────────────────────────────────────┐
│                    DOUBLE BUFFERING                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   ┌──────────────────────┐      ┌──────────────────────┐            │
│   │   CURRENT TREE       │      │   WORK-IN-PROGRESS   │            │
│   │   (on screen)        │      │   (being built)      │            │
│   │                      │      │                      │            │
│   │   ┌──────────────┐   │      │   ┌──────────────┐   │            │
│   │   │  App Fiber   │◄──┼──────┼──▶│  App Fiber   │   │            │
│   │   │  (current)   │ alternate   │  (WIP)       │   │            │
│   │   └──────────────┘   │      │   └──────────────┘   │            │
│   │         │            │      │         │            │            │
│   │   ┌─────┴─────┐      │      │   ┌─────┴─────┐      │            │
│   │   │           │      │      │   │           │      │            │
│   │   ▼           ▼      │      │   ▼           ▼      │            │
│   │ Header     Main      │      │ Header     Main      │            │
│   │ (current)  (current) │      │ (WIP)      (WIP)     │            │
│   └──────────────────────┘      └──────────────────────┘            │
│                                                                      │
│   After commit: WIP becomes Current, old Current becomes WIP         │
│                                                                      │
│   Benefits:                                                          │
│   - Can discard WIP if higher priority update comes                  │
│   - Enables interruptible rendering                                  │
│   - Smooth animations (current always consistent)                    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Why Fiber? (Problems with Stack Reconciler)

```
┌─────────────────────────────────────────────────────────────────────┐
│                    STACK vs FIBER RECONCILER                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   STACK RECONCILER (React 15 and earlier):                          │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │                                                               │ │
│   │   render() ──▶ Component ──▶ Children ──▶ ... ──▶ Done       │ │
│   │      │                                              │         │ │
│   │      └──────── SYNCHRONOUS, CANNOT PAUSE ──────────┘         │ │
│   │                                                               │ │
│   │   Problems:                                                   │ │
│   │   - Blocks main thread for entire tree                       │ │
│   │   - Can't pause for high-priority updates (user input)       │ │
│   │   - Large trees cause jank (dropped frames)                  │ │
│   │   - No way to abort work if props change mid-render          │ │
│   │                                                               │ │
│   └───────────────────────────────────────────────────────────────┘ │
│                                                                      │
│   FIBER RECONCILER (React 16+):                                     │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │                                                               │ │
│   │   Fiber 1 ──▶ Fiber 2 ──▶ [PAUSE] ──▶ Fiber 3 ──▶ ...       │ │
│   │      │            │           │           │                   │ │
│   │      │            │    Handle user        │                   │ │
│   │      │            │    input here!        │                   │ │
│   │      │            │           │           │                   │ │
│   │      └────────────┴───────────┴───────────┘                   │ │
│   │              INTERRUPTIBLE RENDERING                          │ │
│   │                                                               │ │
│   │   Benefits:                                                   │ │
│   │   - Work split into small units (fibers)                     │ │
│   │   - Can pause, abort, or restart work                        │ │
│   │   - Priority-based scheduling                                │ │
│   │   - Concurrent features possible                              │ │
│   │                                                               │ │
│   └───────────────────────────────────────────────────────────────┘ │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Detailed Example: How Fiber Processes a Component Tree

```javascript
// Let's trace how React processes this component
function App() {
  return (
    <div>
      <Header />
      <Main>
        <Sidebar />
        <Content />
      </Main>
      <Footer />
    </div>
  );
}
```

```
┌─────────────────────────────────────────────────────────────────────┐
│          FIBER TRAVERSAL: How React walks the tree                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   Fiber Tree Structure (after creation):                            │
│                                                                      │
│                    App (root)                                        │
│                       │                                              │
│                     child                                            │
│                       ▼                                              │
│                     div                                              │
│                       │                                              │
│                     child                                            │
│                       ▼                                              │
│   ┌────────────────Header ─────sibling──────▶ Main                  │
│   │                                             │                    │
│   │                                           child                  │
│   │                                             ▼                    │
│   │                               Sidebar ──sibling──▶ Content      │
│   │                                                                  │
│   │              Main ─────────sibling──────▶ Footer                │
│   │                                                                  │
│   └──────────────────────────────────────────────────────────────── │
│                                                                      │
│   WORK LOOP EXECUTION ORDER:                                        │
│                                                                      │
│   Step  │ Action           │ Current Fiber │ Next Action            │
│   ──────┼──────────────────┼───────────────┼───────────────────     │
│   1     │ beginWork        │ App           │ Go to child            │
│   2     │ beginWork        │ div           │ Go to child            │
│   3     │ beginWork        │ Header        │ No child, complete     │
│   4     │ completeWork     │ Header        │ Go to sibling          │
│   5     │ beginWork        │ Main          │ Go to child            │
│   6     │ beginWork        │ Sidebar       │ No child, complete     │
│   7     │ completeWork     │ Sidebar       │ Go to sibling          │
│   8     │ beginWork        │ Content       │ No child, complete     │
│   9     │ completeWork     │ Content       │ No sibling, up         │
│   10    │ completeWork     │ Main          │ Go to sibling          │
│   11    │ beginWork        │ Footer        │ No child, complete     │
│   12    │ completeWork     │ Footer        │ No sibling, up         │
│   13    │ completeWork     │ div           │ No sibling, up         │
│   14    │ completeWork     │ App           │ Done!                  │
│                                                                      │
│   PATTERN:                                                          │
│   - beginWork: Process fiber (call render, create child fibers)     │
│   - If child exists → go to child                                   │
│   - If no child → completeWork, then go to sibling                  │
│   - If no sibling → go up to parent's sibling                       │
│   - Repeat until back at root                                       │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### How Interruptible Rendering Works

```javascript
// React's work loop (simplified)
function workLoopConcurrent() {
  // Keep working while there's work and we haven't run out of time
  while (workInProgress !== null && !shouldYield()) {
    performUnitOfWork(workInProgress);
  }
}

function shouldYield() {
  // Check if browser needs to handle other things
  // Using scheduler's shouldYield (checks frame deadline)
  return getCurrentTime() >= deadline;
}

// What happens when React yields:
// 1. workInProgress points to next fiber to process
// 2. React returns control to browser
// 3. Browser handles paint, user input, etc.
// 4. React continues from where it left off

// Example scenario:
function BigList() {
  const items = Array(10000).fill(null);
  return (
    <ul>
      {items.map((_, i) => (
        <ExpensiveItem key={i} index={i} />
      ))}
    </ul>
  );
}
```

```
┌─────────────────────────────────────────────────────────────────────┐
│          INTERRUPTIBLE RENDERING IN ACTION                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   TIME ──────────────────────────────────────────────────────────▶  │
│                                                                      │
│   16ms frame budget for 60fps                                       │
│                                                                      │
│   ┌──────────────────────────────────────────────────────────────┐  │
│   │  Frame 1                                                      │  │
│   │  ┌────────────────────────┐                                   │  │
│   │  │ Process items 0-500    │ (React rendering)                 │  │
│   │  └────────────────────────┘                                   │  │
│   │                            │                                   │  │
│   │                            ▼ ~12ms elapsed                     │  │
│   │                   shouldYield() = true                         │  │
│   │                            │                                   │  │
│   │                            ▼                                   │  │
│   │  ┌────────────┐ ┌────────────────────────┐                    │  │
│   │  │ Paint      │ │ Handle User Input      │                    │  │
│   │  │ previous   │ │ (click on search box)  │                    │  │
│   │  │ changes    │ │                        │                    │  │
│   │  └────────────┘ └────────────────────────┘                    │  │
│   └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
│   ┌──────────────────────────────────────────────────────────────┐  │
│   │  Frame 2                                                      │  │
│   │  ┌────────────────────────────────────┐                       │  │
│   │  │ HIGH PRIORITY: Search input update │ (interrupts!)        │  │
│   │  └────────────────────────────────────┘                       │  │
│   │                                                               │  │
│   │  Previous BigList work is SUSPENDED                           │  │
│   │  (workInProgress saved at item 500)                           │  │
│   │                                                               │  │
│   │  ┌────────────┐                                               │  │
│   │  │ Paint      │                                               │  │
│   │  │ search box │                                               │  │
│   │  └────────────┘                                               │  │
│   └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
│   ┌──────────────────────────────────────────────────────────────┐  │
│   │  Frame 3+                                                     │  │
│   │  ┌────────────────────────┐                                   │  │
│   │  │ Resume items 501-1000  │ (continue where we left off)     │  │
│   │  └────────────────────────┘                                   │  │
│   │  ...                                                          │  │
│   └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
│   RESULT: User input stays responsive even during heavy renders!    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Rendering Phases

React rendering happens in two main phases:

### Phase 1: Render Phase (Reconciliation)

- **Pure and has no side effects**
- Can be paused, aborted, or restarted
- Builds the work-in-progress tree
- Calculates what changes are needed

### Phase 2: Commit Phase

- **Synchronous and cannot be interrupted**
- Applies changes to the DOM
- Runs effects (useLayoutEffect, componentDidMount, etc.)

```
┌─────────────────────────────────────────────────────────────────────┐
│                    TWO PHASES OF RENDERING                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   ═══════════════════════════════════════════════════════════════   │
│   ║                    RENDER PHASE                              ║   │
│   ║                (Interruptible, Async)                        ║   │
│   ═══════════════════════════════════════════════════════════════   │
│                                                                      │
│   ┌─────────────┐     ┌─────────────┐     ┌─────────────┐          │
│   │  beginWork  │────▶│  beginWork  │────▶│  beginWork  │          │
│   │  (App)      │     │  (Header)   │     │  (Main)     │          │
│   └─────────────┘     └─────────────┘     └─────────────┘          │
│          │                                       │                   │
│          │         Work on each fiber            │                   │
│          │         - Call render()               │                   │
│          │         - Diff children               │                   │
│          │         - Tag effects                 │                   │
│          │                                       │                   │
│          ▼                                       ▼                   │
│   ┌─────────────┐                         ┌─────────────┐           │
│   │completeWork │◀────────────────────────│completeWork │           │
│   │  (bubble up)│                         │  (Main)     │           │
│   └─────────────┘                         └─────────────┘           │
│                                                                      │
│   Result: Effect List (what needs to be done to DOM)                │
│                                                                      │
│   ═══════════════════════════════════════════════════════════════   │
│   ║                    COMMIT PHASE                              ║   │
│   ║                (Synchronous, Cannot pause)                   ║   │
│   ═══════════════════════════════════════════════════════════════   │
│                                                                      │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │                                                               │ │
│   │   1. Before Mutation                                          │ │
│   │      └─ getSnapshotBeforeUpdate()                            │ │
│   │                                                               │ │
│   │   2. Mutation Phase                                           │ │
│   │      └─ DOM insertions, updates, deletions                    │ │
│   │      └─ Ref detachments                                       │ │
│   │                                                               │ │
│   │   3. Layout Phase                                             │ │
│   │      └─ useLayoutEffect callbacks                             │ │
│   │      └─ componentDidMount / componentDidUpdate                │ │
│   │      └─ Ref attachments                                       │ │
│   │                                                               │ │
│   └───────────────────────────────────────────────────────────────┘ │
│                                                                      │
│   After commit: useEffect callbacks scheduled (async)                │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### The Work Loop

```javascript
// Simplified work loop (pseudocode)
function workLoop(deadline) {
  let shouldYield = false;
  
  while (nextUnitOfWork && !shouldYield) {
    // Perform one unit of work
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    
    // Check if we should yield to the browser
    shouldYield = deadline.timeRemaining() < 1;
  }
  
  // If there's more work, schedule another callback
  if (nextUnitOfWork) {
    requestIdleCallback(workLoop);
  } else {
    // All render work done, commit!
    commitRoot();
  }
}

function performUnitOfWork(fiber) {
  // 1. beginWork: Process the fiber (call render, diff)
  beginWork(fiber);
  
  // 2. If there's a child, return it as next work
  if (fiber.child) {
    return fiber.child;
  }
  
  // 3. Otherwise, complete work and move to sibling/parent
  let current = fiber;
  while (current) {
    completeWork(current);
    if (current.sibling) {
      return current.sibling;
    }
    current = current.return;
  }
  
  return null;
}
```

### Effect Execution Order

```javascript
function App() {
  useLayoutEffect(() => {
    console.log('1. useLayoutEffect');  // Sync, before paint
    return () => console.log('cleanup useLayoutEffect');
  });
  
  useEffect(() => {
    console.log('2. useEffect');  // Async, after paint
    return () => console.log('cleanup useEffect');
  });
  
  return <div>App</div>;
}

// Mount order:
// 1. "1. useLayoutEffect" (before browser paint)
// 2. Browser paints
// 3. "2. useEffect" (after browser paint)

// Unmount order:
// 1. "cleanup useLayoutEffect"
// 2. "cleanup useEffect"
```

---

## Hooks Internals

### How Hooks Work Under the Hood

Hooks are stored as a **linked list** on the fiber node:

```
┌─────────────────────────────────────────────────────────────────────┐
│                    HOOKS LINKED LIST                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   function Counter() {                                               │
│     const [count, setCount] = useState(0);      // Hook 1           │
│     const [name, setName] = useState('');       // Hook 2           │
│     const doubled = useMemo(() => count * 2, [count]); // Hook 3    │
│     useEffect(() => { ... }, [count]);          // Hook 4           │
│     return <div>{count}</div>;                                       │
│   }                                                                  │
│                                                                      │
│   Fiber.memoizedState (Linked List):                                │
│                                                                      │
│   ┌─────────────────┐     ┌─────────────────┐                       │
│   │  Hook 1         │     │  Hook 2         │                       │
│   │  ┌───────────┐  │     │  ┌───────────┐  │                       │
│   │  │ state: 0  │  │────▶│  │ state: '' │  │────▶ ...              │
│   │  │ queue: {} │  │next │  │ queue: {} │  │next                   │
│   │  └───────────┘  │     │  └───────────┘  │                       │
│   └─────────────────┘     └─────────────────┘                       │
│                                                                      │
│   On each render, React walks this list in ORDER                     │
│   This is why hooks must be called in the same order every time!    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### useState Implementation (Simplified)

```javascript
// Simplified useState implementation
let currentFiber = null;
let hookIndex = 0;

function useState(initialValue) {
  const oldHook = currentFiber.alternate?.memoizedState?.[hookIndex];
  
  const hook = {
    state: oldHook ? oldHook.state : initialValue,
    queue: [],
  };
  
  // Process pending state updates
  const actions = oldHook ? oldHook.queue : [];
  actions.forEach(action => {
    hook.state = typeof action === 'function' 
      ? action(hook.state) 
      : action;
  });
  
  const setState = (action) => {
    hook.queue.push(action);
    // Schedule re-render
    scheduleUpdateOnFiber(currentFiber);
  };
  
  currentFiber.memoizedState[hookIndex] = hook;
  hookIndex++;
  
  return [hook.state, setState];
}
```

### Why Hooks Rules Exist

```javascript
// ❌ WRONG: Conditional hook call
function Bad({ condition }) {
  if (condition) {
    const [a, setA] = useState(0);  // Hook 1 (sometimes)
  }
  const [b, setB] = useState(0);    // Hook 1 or 2?
  
  // First render (condition = true):
  // hookIndex 0: useState(a) ✓
  // hookIndex 1: useState(b) ✓
  
  // Second render (condition = false):
  // hookIndex 0: useState(b) ← WRONG! Reads 'a' state!
  // React can't tell that this is a different hook
}

// ✅ CORRECT: Always same order
function Good({ condition }) {
  const [a, setA] = useState(0);    // Always Hook 1
  const [b, setB] = useState(0);    // Always Hook 2
  
  // Use condition INSIDE the component logic
  if (condition) {
    // do something with a
  }
}
```

```
┌─────────────────────────────────────────────────────────────────────┐
│                    RULES OF HOOKS                                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   ✅ MUST:                                                           │
│   • Call hooks at the TOP LEVEL of your function                     │
│   • Call hooks in the SAME ORDER every render                        │
│   • Only call hooks from React functions (components or hooks)       │
│                                                                      │
│   ❌ NEVER:                                                          │
│   • Call hooks inside conditions (if/else)                           │
│   • Call hooks inside loops (for/while)                              │
│   • Call hooks inside nested functions                               │
│   • Call hooks after early returns                                   │
│                                                                      │
│   WHY: React uses CALL ORDER to match hooks to their state!          │
│                                                                      │
│   Render 1:        Render 2:                                         │
│   hook[0] = A      hook[0] = A  ✓ Same position                     │
│   hook[1] = B      hook[1] = B  ✓ Same position                     │
│   hook[2] = C      hook[2] = C  ✓ Same position                     │
│                                                                      │
│   If order changes, React reads wrong state for each hook!           │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### useEffect Cleanup Timing

```javascript
function Component({ id }) {
  useEffect(() => {
    console.log(`Effect setup for ${id}`);
    
    return () => {
      console.log(`Effect cleanup for ${id}`);
    };
  }, [id]);
  
  return <div>{id}</div>;
}

// When id changes from 1 to 2:
// 1. Render with new id (2)
// 2. Commit DOM changes
// 3. Cleanup PREVIOUS effect: "Effect cleanup for 1"
// 4. Run NEW effect: "Effect setup for 2"

// Cleanup runs BEFORE new effect, but AFTER new render
```

### Complete Hooks Example: Step-by-Step Execution

```javascript
function Counter() {
  console.log('1. Render start');
  
  const [count, setCount] = useState(0);
  console.log('2. After useState, count =', count);
  
  const doubled = useMemo(() => {
    console.log('3. Computing doubled');
    return count * 2;
  }, [count]);
  
  useEffect(() => {
    console.log('5. useEffect runs');
    document.title = `Count: ${count}`;
    
    return () => {
      console.log('4. useEffect cleanup');
    };
  }, [count]);
  
  useLayoutEffect(() => {
    console.log('4.5. useLayoutEffect runs (before paint)');
  }, [count]);
  
  console.log('4. Render end, returning JSX');
  
  return (
    <button onClick={() => setCount(c => c + 1)}>
      Count: {count}, Doubled: {doubled}
    </button>
  );
}
```

```
┌─────────────────────────────────────────────────────────────────────┐
│          HOOKS EXECUTION: Initial Mount                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   RENDER PHASE (can be paused/restarted)                            │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │  1. "Render start"                                            │ │
│   │                                                               │ │
│   │  2. useState(0) called:                                       │ │
│   │     - First render, no previous hook                          │ │
│   │     - Create new hook: { state: 0, queue: [] }                │ │
│   │     - Return [0, setCount]                                    │ │
│   │     - "After useState, count = 0"                             │ │
│   │                                                               │ │
│   │  3. useMemo called:                                           │ │
│   │     - No previous memoized value                              │ │
│   │     - Execute factory: () => count * 2                        │ │
│   │     - "Computing doubled"                                     │ │
│   │     - Store { value: 0, deps: [0] }                           │ │
│   │                                                               │ │
│   │  4. useEffect called:                                         │ │
│   │     - DON'T run effect yet!                                   │ │
│   │     - Schedule effect for after commit                        │ │
│   │     - Store { create: fn, destroy: null, deps: [0] }          │ │
│   │                                                               │ │
│   │  5. useLayoutEffect called:                                   │ │
│   │     - Schedule for layout phase                               │ │
│   │                                                               │ │
│   │  6. "Render end, returning JSX"                               │ │
│   │     - Return React elements                                   │ │
│   └───────────────────────────────────────────────────────────────┘ │
│                                                                      │
│   COMMIT PHASE (synchronous, cannot be interrupted)                 │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │  1. Mutation: Insert DOM nodes                                │ │
│   │                                                               │ │
│   │  2. Layout: Run useLayoutEffect                               │ │
│   │     - "useLayoutEffect runs (before paint)"                   │ │
│   │                                                               │ │
│   │  3. Browser paints the screen                                 │ │
│   └───────────────────────────────────────────────────────────────┘ │
│                                                                      │
│   AFTER PAINT (async)                                               │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │  - Run useEffect                                              │ │
│   │  - "useEffect runs"                                           │ │
│   │  - document.title updated                                     │ │
│   └───────────────────────────────────────────────────────────────┘ │
│                                                                      │
│   Console output order:                                              │
│   1. "Render start"                                                  │
│   2. "After useState, count = 0"                                     │
│   3. "Computing doubled"                                             │
│   4. "Render end, returning JSX"                                     │
│   4.5. "useLayoutEffect runs (before paint)"                         │
│   [Browser paints]                                                   │
│   5. "useEffect runs"                                                │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

```
┌─────────────────────────────────────────────────────────────────────┐
│          HOOKS EXECUTION: After Click (count: 0 → 1)                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   CLICK HANDLER                                                      │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │  setCount(c => c + 1) called:                                 │ │
│   │  - Add updater function to hook's queue                       │ │
│   │  - Schedule re-render                                         │ │
│   └───────────────────────────────────────────────────────────────┘ │
│                                                                      │
│   RE-RENDER PHASE                                                   │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │  1. "Render start"                                            │ │
│   │                                                               │ │
│   │  2. useState(0) called:                                       │ │
│   │     - Find existing hook (index 0)                            │ │
│   │     - Process queue: [c => c + 1]                             │ │
│   │     - New state: 0 + 1 = 1                                    │ │
│   │     - Return [1, setCount]                                    │ │
│   │     - "After useState, count = 1"                             │ │
│   │                                                               │ │
│   │  3. useMemo called:                                           │ │
│   │     - Find existing hook (index 1)                            │ │
│   │     - Compare deps: [0] vs [1]                                │ │
│   │     - Deps CHANGED! Re-compute.                               │ │
│   │     - "Computing doubled"                                     │ │
│   │     - Store { value: 2, deps: [1] }                           │ │
│   │                                                               │ │
│   │  4. useEffect called:                                         │ │
│   │     - Compare deps: [0] vs [1]                                │ │
│   │     - Deps CHANGED! Schedule cleanup + effect                 │ │
│   │                                                               │ │
│   │  5. "Render end, returning JSX"                               │ │
│   └───────────────────────────────────────────────────────────────┘ │
│                                                                      │
│   COMMIT PHASE                                                      │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │  1. Mutation: Update DOM (button text)                        │ │
│   │                                                               │ │
│   │  2. Layout:                                                   │ │
│   │     - Run useLayoutEffect cleanup (none on mount)             │ │
│   │     - Run useLayoutEffect                                     │ │
│   │     - "useLayoutEffect runs (before paint)"                   │ │
│   │                                                               │ │
│   │  3. Browser paints                                            │ │
│   └───────────────────────────────────────────────────────────────┘ │
│                                                                      │
│   AFTER PAINT                                                       │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │  1. Run PREVIOUS useEffect cleanup                            │ │
│   │     - "useEffect cleanup" (from count=0 effect)               │ │
│   │                                                               │ │
│   │  2. Run NEW useEffect                                         │ │
│   │     - "useEffect runs"                                        │ │
│   │     - document.title = "Count: 1"                             │ │
│   └───────────────────────────────────────────────────────────────┘ │
│                                                                      │
│   Console output order:                                              │
│   1. "Render start"                                                  │
│   2. "After useState, count = 1"                                     │
│   3. "Computing doubled"                                             │
│   4. "Render end, returning JSX"                                     │
│   4.5. "useLayoutEffect runs (before paint)"                         │
│   [Browser paints]                                                   │
│   4. "useEffect cleanup" (PREVIOUS effect)                           │
│   5. "useEffect runs" (NEW effect)                                   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### useRef: The Exception to Re-render Rules

```javascript
function RefExample() {
  const [count, setCount] = useState(0);
  const renderCount = useRef(0);
  const intervalRef = useRef(null);
  
  // This runs every render, but doesn't cause re-render
  renderCount.current++;
  console.log('Rendered', renderCount.current, 'times');
  
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      console.log('Interval running');
    }, 1000);
    
    return () => {
      clearInterval(intervalRef.current);
    };
  }, []);
  
  return (
    <div>
      <p>Count: {count}</p>
      <p>Render count: {renderCount.current}</p>
      <button onClick={() => setCount(c => c + 1)}>Increment</button>
    </div>
  );
}
```

```
┌─────────────────────────────────────────────────────────────────────┐
│          useRef vs useState: Key Differences                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   useState                          useRef                           │
│   ─────────────────────────────────────────────────────────────     │
│                                                                      │
│   const [val, setVal] = useState(0) const ref = useRef(0)           │
│                                                                      │
│   setVal(1)                         ref.current = 1                  │
│       ↓                                 ↓                            │
│   Triggers re-render               NO re-render!                     │
│       ↓                                                              │
│   Component function called                                          │
│       ↓                                                              │
│   New val returned                  Same ref object                  │
│                                     (mutated in place)               │
│                                                                      │
│   ─────────────────────────────────────────────────────────────     │
│                                                                      │
│   HOOK STORAGE:                                                      │
│                                                                      │
│   useState hook:                    useRef hook:                     │
│   {                                 {                                │
│     memoizedState: 0,                 memoizedState: { current: 0 } │
│     queue: [...updates],            }                                │
│   }                                                                  │
│                                     Same object every render!        │
│   New state computed from queue     Object reference never changes   │
│                                                                      │
│   ─────────────────────────────────────────────────────────────     │
│                                                                      │
│   USE CASES:                                                         │
│                                                                      │
│   useState:                         useRef:                          │
│   - UI state that should render     - Mutable values that don't     │
│   - Form inputs                       need render                    │
│   - Toggle states                   - DOM element references         │
│   - Lists of items                  - Previous value storage         │
│                                     - Timer/interval IDs             │
│                                     - Instance variables             │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Custom Hooks: Sharing Logic

```javascript
// Custom hook that encapsulates logic
function useLocalStorage(key, initialValue) {
  // This is just a regular function that calls other hooks
  // React doesn't treat it specially - it just follows the rules
  
  const [storedValue, setStoredValue] = useState(() => {
    // Lazy initialization - only runs on mount
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });
  
  const setValue = useCallback((value) => {
    try {
      // Allow value to be a function (like useState)
      const valueToStore = value instanceof Function 
        ? value(storedValue) 
        : value;
      
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  }, [key, storedValue]);
  
  return [storedValue, setValue];
}

// Usage
function App() {
  const [name, setName] = useLocalStorage('name', 'Guest');
  const [theme, setTheme] = useLocalStorage('theme', 'light');
  
  // name and theme persist across page refreshes!
}
```

```
┌─────────────────────────────────────────────────────────────────────┐
│          CUSTOM HOOK: What happens internally                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   function App() {                                                   │
│     const [name, setName] = useLocalStorage('name', 'Guest');       │
│     const [theme, setTheme] = useLocalStorage('theme', 'light');    │
│   }                                                                  │
│                                                                      │
│   Hook calls flattened (what React sees):                           │
│                                                                      │
│   App Fiber's memoizedState (linked list):                          │
│                                                                      │
│   ┌────────────────┐    ┌────────────────┐    ┌────────────────┐   │
│   │ Hook 0         │    │ Hook 1         │    │ Hook 2         │   │
│   │ (useState for  │───▶│ (useCallback   │───▶│ (useState for  │──▶│
│   │  name)         │    │  for setName)  │    │  theme)        │   │
│   │ state: "Guest" │    │                │    │ state: "light" │   │
│   └────────────────┘    └────────────────┘    └────────────────┘   │
│                                                                      │
│       ┌────────────────┐                                            │
│   ───▶│ Hook 3         │───▶ null                                   │
│       │ (useCallback   │                                            │
│       │  for setTheme) │                                            │
│       └────────────────┘                                            │
│                                                                      │
│   ⚠️ Each call to useLocalStorage adds 2 hooks (useState + useCallback) │
│   The hooks are stored in the ORDER they were called                │
│   Custom hooks are NOT special - they're just functions with hooks  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Batching & State Updates

### Automatic Batching (React 18+)

```javascript
function Component() {
  const [count, setCount] = useState(0);
  const [flag, setFlag] = useState(false);
  
  function handleClick() {
    // React 18: These are BATCHED (single re-render)
    setCount(c => c + 1);  // Does not re-render yet
    setFlag(f => !f);      // Does not re-render yet
    // React re-renders ONCE at the end
  }
  
  // Also batched in React 18:
  async function handleAsync() {
    await fetch('/api/data');
    setCount(c => c + 1);  // Batched!
    setFlag(f => !f);      // Batched!
    // Single re-render
  }
  
  // Also batched:
  setTimeout(() => {
    setCount(c => c + 1);  // Batched!
    setFlag(f => !f);      // Batched!
  }, 100);
}
```

### State Update Queue

```javascript
function Counter() {
  const [count, setCount] = useState(0);
  
  function handleClick() {
    // Multiple updates queue up
    setCount(count + 1);  // 0 + 1 = 1
    setCount(count + 1);  // 0 + 1 = 1 (still using stale count!)
    setCount(count + 1);  // 0 + 1 = 1
    // Result: count = 1 (not 3!)
  }
  
  function handleClickCorrect() {
    // Use updater function for sequential updates
    setCount(c => c + 1);  // 0 → 1
    setCount(c => c + 1);  // 1 → 2
    setCount(c => c + 1);  // 2 → 3
    // Result: count = 3 ✓
  }
}
```

```
┌─────────────────────────────────────────────────────────────────────┐
│                    STATE UPDATE PROCESSING                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   setState(value) vs setState(updater)                               │
│                                                                      │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │  setState(count + 1)  // Value: uses current closure value    │ │
│   │                                                               │ │
│   │  Queue: [1, 1, 1]     // All computed with count = 0          │ │
│   │  Process: last value wins → 1                                 │ │
│   └───────────────────────────────────────────────────────────────┘ │
│                                                                      │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │  setState(c => c + 1)  // Updater: receives latest state      │ │
│   │                                                               │ │
│   │  Queue: [fn, fn, fn]                                          │ │
│   │  Process: 0 →fn→ 1 →fn→ 2 →fn→ 3                             │ │
│   └───────────────────────────────────────────────────────────────┘ │
│                                                                      │
│   Rule: Use updater function when new state depends on previous     │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### flushSync for Immediate Updates

```javascript
import { flushSync } from 'react-dom';

function Component() {
  const [count, setCount] = useState(0);
  
  function handleClick() {
    flushSync(() => {
      setCount(c => c + 1);
    });
    // DOM is updated HERE
    console.log(document.getElementById('count').textContent);
    
    flushSync(() => {
      setCount(c => c + 1);
    });
    // DOM is updated AGAIN
  }
}
```

### Complete Batching Example: Before and After React 18

```javascript
function BatchingDemo() {
  const [count, setCount] = useState(0);
  const [flag, setFlag] = useState(false);
  const [text, setText] = useState('');
  
  console.log('Render!', { count, flag, text });
  
  // Case 1: Event handler (batched in both React 17 and 18)
  function handleClick() {
    setCount(c => c + 1);
    setFlag(f => !f);
    setText('clicked');
    // React 17: 1 render
    // React 18: 1 render
  }
  
  // Case 2: setTimeout (different behavior!)
  function handleTimeout() {
    setTimeout(() => {
      setCount(c => c + 1);
      setFlag(f => !f);
      setText('timeout');
      // React 17: 3 renders (one per setState!)
      // React 18: 1 render (automatic batching)
    }, 0);
  }
  
  // Case 3: Promise (different behavior!)
  async function handleAsync() {
    await fetch('/api/data');
    setCount(c => c + 1);
    setFlag(f => !f);
    setText('fetched');
    // React 17: 3 renders
    // React 18: 1 render
  }
  
  // Case 4: Native event listener (different behavior!)
  useEffect(() => {
    const button = document.getElementById('native-btn');
    
    button.addEventListener('click', () => {
      setCount(c => c + 1);
      setFlag(f => !f);
      // React 17: 2 renders
      // React 18: 1 render
    });
  }, []);
  
  return (/* ... */);
}
```

```
┌─────────────────────────────────────────────────────────────────────┐
│          BATCHING COMPARISON: React 17 vs React 18                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   SCENARIO                    │ React 17      │ React 18             │
│   ────────────────────────────┼───────────────┼─────────────────     │
│   Event handler               │ 1 render ✓    │ 1 render ✓           │
│   setTimeout callback         │ N renders ✗   │ 1 render ✓           │
│   Promise .then()             │ N renders ✗   │ 1 render ✓           │
│   fetch().then()              │ N renders ✗   │ 1 render ✓           │
│   Native event listener       │ N renders ✗   │ 1 render ✓           │
│                                                                      │
│   WHY THE DIFFERENCE?                                                │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │                                                               │ │
│   │   React 17:                                                   │ │
│   │   - Only batches inside React-managed events                  │ │
│   │   - Uses legacy "unstable_batchedUpdates"                     │ │
│   │   - Asynchronous code runs outside React's control            │ │
│   │                                                               │ │
│   │   React 18:                                                   │ │
│   │   - createRoot() enables automatic batching                   │ │
│   │   - ALL updates are batched by default                        │ │
│   │   - Uses new "transitions" and "lanes" system                 │ │
│   │                                                               │ │
│   └───────────────────────────────────────────────────────────────┘ │
│                                                                      │
│   OPT-OUT with flushSync:                                           │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │                                                               │ │
│   │   flushSync(() => setCount(1));  // Render #1                │ │
│   │   flushSync(() => setFlag(true)); // Render #2               │ │
│   │   // Each flushSync triggers immediate render                 │ │
│   │                                                               │ │
│   └───────────────────────────────────────────────────────────────┘ │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### The Update Queue: How Multiple setStates Work

```javascript
function UpdateQueueDemo() {
  const [count, setCount] = useState(0);
  
  function handleClick() {
    // What's in the update queue after each call?
    
    setCount(1);           // Queue: [1]
    setCount(2);           // Queue: [1, 2]
    setCount(prev => prev + 1); // Queue: [1, 2, fn]
    setCount(3);           // Queue: [1, 2, fn, 3]
    
    // React processes the queue:
    // Start: baseState = 0
    // Apply 1:          newState = 1
    // Apply 2:          newState = 2
    // Apply fn(2):      newState = 2 + 1 = 3
    // Apply 3:          newState = 3
    // Final: count = 3
  }
  
  function handleClickFunctions() {
    // All updater functions
    setCount(c => c + 1);  // Queue: [fn]
    setCount(c => c + 1);  // Queue: [fn, fn]
    setCount(c => c + 1);  // Queue: [fn, fn, fn]
    
    // React processes:
    // Start: baseState = 0
    // Apply fn(0):      newState = 1
    // Apply fn(1):      newState = 2
    // Apply fn(2):      newState = 3
    // Final: count = 3
  }
  
  return <button onClick={handleClick}>{count}</button>;
}
```

```
┌─────────────────────────────────────────────────────────────────────┐
│          UPDATE QUEUE PROCESSING                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   function handleClick() {                                          │
│     setCount(count + 1);  // count is 0 from closure               │
│     setCount(count + 1);  // count is STILL 0 from closure         │
│     setCount(count + 1);  // count is STILL 0!                     │
│   }                                                                  │
│                                                                      │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │                                                               │ │
│   │   Queue after all setCount calls: [1, 1, 1]                   │ │
│   │                                                               │ │
│   │   Processing:                                                 │ │
│   │   baseState = 0                                               │ │
│   │   apply 1 → newState = 1                                      │ │
│   │   apply 1 → newState = 1 (overwrites!)                        │ │
│   │   apply 1 → newState = 1 (overwrites!)                        │ │
│   │                                                               │ │
│   │   Result: count = 1 (not 3!)                                  │ │
│   │                                                               │ │
│   │   WHY? Because "count" in "count + 1" is the closure value    │ │
│   │   from when the function was created (0), not the latest     │ │
│   │                                                               │ │
│   └───────────────────────────────────────────────────────────────┘ │
│                                                                      │
│   ─────────────────────────────────────────────────────────────────  │
│                                                                      │
│   function handleClick() {                                          │
│     setCount(c => c + 1);  // Receives LATEST state               │
│     setCount(c => c + 1);  // Receives LATEST state               │
│     setCount(c => c + 1);  // Receives LATEST state               │
│   }                                                                  │
│                                                                      │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │                                                               │ │
│   │   Queue: [fn, fn, fn]                                         │ │
│   │                                                               │ │
│   │   Processing:                                                 │ │
│   │   baseState = 0                                               │ │
│   │   apply fn(0) → newState = 0 + 1 = 1                         │ │
│   │   apply fn(1) → newState = 1 + 1 = 2                         │ │
│   │   apply fn(2) → newState = 2 + 1 = 3                         │ │
│   │                                                               │ │
│   │   Result: count = 3 ✓                                         │ │
│   │                                                               │ │
│   │   Each function receives the COMPUTED state so far            │ │
│   │                                                               │ │
│   └───────────────────────────────────────────────────────────────┘ │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Concurrent React

### What is Concurrent Rendering?

**Concurrent rendering** allows React to:
- Interrupt rendering to handle urgent updates
- Prepare multiple versions of UI simultaneously
- Keep UI responsive during heavy computations

```
┌─────────────────────────────────────────────────────────────────────┐
│                    CONCURRENT RENDERING                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   SYNCHRONOUS (React 17):                                           │
│                                                                      │
│   User types ─┬─ [===== Render slow list =====] ─────▶ Jank! 😢     │
│               │                                                      │
│               └─ User can't see input updating                       │
│                                                                      │
│   ─────────────────────────────────────────────────────────────────  │
│                                                                      │
│   CONCURRENT (React 18):                                            │
│                                                                      │
│   User types ─┬─ [=] PAUSE [=] PAUSE [=] ──────────▶ Smooth! 😊     │
│               │      │          │                                    │
│               │      ▼          ▼                                    │
│               └─ Urgent: Update input immediately                    │
│                  Deferred: Render list in background                 │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Transitions (useTransition)

```javascript
import { useState, useTransition } from 'react';

function SearchResults() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isPending, startTransition] = useTransition();
  
  function handleChange(e) {
    // Urgent: Update input immediately
    setQuery(e.target.value);
    
    // Non-urgent: Can be interrupted
    startTransition(() => {
      // This update can be deferred
      setResults(filterLargeDataset(e.target.value));
    });
  }
  
  return (
    <div>
      <input value={query} onChange={handleChange} />
      {isPending && <Spinner />}
      <ResultsList results={results} />
    </div>
  );
}
```

### Deferred Values (useDeferredValue)

```javascript
import { useState, useDeferredValue, memo } from 'react';

function Search() {
  const [query, setQuery] = useState('');
  // deferredQuery will "lag behind" query during updates
  const deferredQuery = useDeferredValue(query);
  
  // This will show immediately with new query
  const isStale = query !== deferredQuery;
  
  return (
    <div>
      <input 
        value={query} 
        onChange={e => setQuery(e.target.value)} 
      />
      {/* This expensive component renders with deferred value */}
      <div style={{ opacity: isStale ? 0.5 : 1 }}>
        <SlowList text={deferredQuery} />
      </div>
    </div>
  );
}

const SlowList = memo(function SlowList({ text }) {
  // Expensive render
  const items = Array(5000).fill(null).map((_, i) => (
    <li key={i}>{text} - Item {i}</li>
  ));
  return <ul>{items}</ul>;
});
```

### Priority Lanes

React uses "lanes" to prioritize updates:

```
┌─────────────────────────────────────────────────────────────────────┐
│                    UPDATE PRIORITY LANES                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   HIGHEST PRIORITY                                                   │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │  SyncLane                    Immediate, blocking               │ │
│   │  • flushSync()                                                 │ │
│   │  • Legacy mode renders                                         │ │
│   └───────────────────────────────────────────────────────────────┘ │
│                                                                      │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │  InputContinuousLane         User input events                 │ │
│   │  • Text input                                                  │ │
│   │  • Keyboard events                                             │ │
│   │  • Mouse moves                                                 │ │
│   └───────────────────────────────────────────────────────────────┘ │
│                                                                      │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │  DefaultLane                 Normal updates                    │ │
│   │  • State updates                                               │ │
│   │  • Network responses                                           │ │
│   └───────────────────────────────────────────────────────────────┘ │
│                                                                      │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │  TransitionLane              Transitions (can be deferred)     │ │
│   │  • startTransition()                                           │ │
│   │  • useDeferredValue()                                          │ │
│   └───────────────────────────────────────────────────────────────┘ │
│                                                                      │
│   LOWEST PRIORITY                                                    │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │  IdleLane                    Idle time work                    │ │
│   │  • Offscreen rendering                                         │ │
│   │  • Background tasks                                            │ │
│   └───────────────────────────────────────────────────────────────┘ │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Suspense for Data Fetching

```javascript
import { Suspense } from 'react';

// With a Suspense-enabled library (like Relay, SWR)
function ProfilePage({ userId }) {
  return (
    <Suspense fallback={<ProfileSkeleton />}>
      <ProfileDetails userId={userId} />
      <Suspense fallback={<PostsSkeleton />}>
        <ProfilePosts userId={userId} />
      </Suspense>
    </Suspense>
  );
}

// How Suspense works internally:
// 1. Component throws a Promise during render
// 2. React catches it and shows fallback
// 3. When Promise resolves, React re-renders

// Example of a Suspense-compatible resource
function createResource(promise) {
  let status = 'pending';
  let result;
  
  const suspender = promise.then(
    (data) => { status = 'success'; result = data; },
    (error) => { status = 'error'; result = error; }
  );
  
  return {
    read() {
      if (status === 'pending') throw suspender;  // Suspend!
      if (status === 'error') throw result;
      return result;
    }
  };
}
```

### Complete useTransition Example

```javascript
import { useState, useTransition, memo } from 'react';

function App() {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isPending, startTransition] = useTransition();
  
  // Expensive filtering function
  function filterProducts(query) {
    // Imagine this searches through 10,000 products
    return ALL_PRODUCTS.filter(product => 
      product.name.toLowerCase().includes(query.toLowerCase())
    );
  }
  
  function handleChange(e) {
    const value = e.target.value;
    
    // URGENT: Update input immediately (high priority)
    // User sees their typing instantly
    setQuery(value);
    
    // NON-URGENT: Filter results (low priority, can be interrupted)
    startTransition(() => {
      const filtered = filterProducts(value);
      setSearchResults(filtered);
    });
  }
  
  return (
    <div>
      <input 
        value={query} 
        onChange={handleChange}
        placeholder="Search products..."
      />
      
      {/* Show spinner while transition is pending */}
      {isPending && <Spinner />}
      
      {/* This list renders with a delay, but input stays responsive */}
      <ProductList products={searchResults} isPending={isPending} />
    </div>
  );
}

const ProductList = memo(function ProductList({ products, isPending }) {
  return (
    <ul style={{ opacity: isPending ? 0.5 : 1 }}>
      {products.map(product => (
        <li key={product.id}>
          <Product product={product} />
        </li>
      ))}
    </ul>
  );
});
```

```
┌─────────────────────────────────────────────────────────────────────┐
│          useTransition: What Happens Step by Step                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   User types "a" in search box                                      │
│                                                                      │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │  handleChange called with value = "a"                         │ │
│   │                                                               │ │
│   │  1. setQuery("a")                                             │ │
│   │     → Urgent update (InputContinuousLane)                     │ │
│   │     → Scheduled immediately                                   │ │
│   │                                                               │ │
│   │  2. startTransition(() => { setSearchResults(...) })          │ │
│   │     → Transition update (TransitionLane)                      │ │
│   │     → Lower priority, can be interrupted                      │ │
│   │     → isPending = true                                        │ │
│   └───────────────────────────────────────────────────────────────┘ │
│                                                                      │
│   React scheduling:                                                  │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │                                                               │ │
│   │   URGENT RENDER (happens first)                               │ │
│   │   ┌─────────────────────────────────────────────────────────┐ │ │
│   │   │ query: "" → "a"                                         │ │ │
│   │   │ isPending: false → true                                 │ │ │
│   │   │ searchResults: unchanged                                │ │ │
│   │   │                                                         │ │ │
│   │   │ DOM: Input shows "a" immediately!                       │ │ │
│   │   │      Spinner appears!                                   │ │ │
│   │   └─────────────────────────────────────────────────────────┘ │ │
│   │                                                               │ │
│   │   User types "b" while transition is processing...           │ │
│   │                                                               │ │
│   │   TRANSITION RENDER (interrupted!)                            │ │
│   │   ┌─────────────────────────────────────────────────────────┐ │ │
│   │   │ Previous transition for "a" is ABANDONED                │ │ │
│   │   │ New urgent update for "ab" takes priority               │ │ │
│   │   └─────────────────────────────────────────────────────────┘ │ │
│   │                                                               │ │
│   │   URGENT RENDER (for "ab")                                    │ │
│   │   ┌─────────────────────────────────────────────────────────┐ │ │
│   │   │ query: "a" → "ab"                                       │ │ │
│   │   │ Input shows "ab" immediately!                           │ │ │
│   │   └─────────────────────────────────────────────────────────┘ │ │
│   │                                                               │ │
│   │   User stops typing...                                        │ │
│   │                                                               │ │
│   │   TRANSITION RENDER (finally completes)                       │ │
│   │   ┌─────────────────────────────────────────────────────────┐ │ │
│   │   │ searchResults: filters with "ab"                        │ │ │
│   │   │ isPending: true → false                                 │ │ │
│   │   │ Spinner disappears, results show                        │ │ │
│   │   └─────────────────────────────────────────────────────────┘ │ │
│   │                                                               │ │
│   └───────────────────────────────────────────────────────────────┘ │
│                                                                      │
│   KEY INSIGHT: Input stays responsive because typing always         │
│   triggers urgent updates that interrupt transition work            │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### useDeferredValue: Alternative Approach

```javascript
import { useState, useDeferredValue, memo } from 'react';

function App() {
  const [query, setQuery] = useState('');
  
  // deferredQuery "lags behind" query during updates
  const deferredQuery = useDeferredValue(query);
  
  // Detect if we're showing stale data
  const isStale = query !== deferredQuery;
  
  return (
    <div>
      <input 
        value={query}
        onChange={e => setQuery(e.target.value)}
      />
      
      {/* Pass deferred value to expensive component */}
      <div style={{ opacity: isStale ? 0.7 : 1 }}>
        <ExpensiveList query={deferredQuery} />
      </div>
    </div>
  );
}

// Must be memoized for useDeferredValue to work!
const ExpensiveList = memo(function ExpensiveList({ query }) {
  // This is expensive
  const items = filterItems(query);
  
  return (
    <ul>
      {items.map(item => <li key={item.id}>{item.name}</li>)}
    </ul>
  );
});
```

```
┌─────────────────────────────────────────────────────────────────────┐
│          useDeferredValue vs useTransition                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   useTransition                      useDeferredValue                │
│   ────────────────────────────────────────────────────────────────   │
│                                                                      │
│   You control WHEN update happens    Value automatically defers      │
│   Wrap setState in startTransition   Pass value, get deferred back  │
│                                                                      │
│   const [isPending, startTransition] const deferredVal =            │
│     = useTransition();                 useDeferredValue(val);        │
│                                                                      │
│   startTransition(() => {            // Use deferredVal in          │
│     setState(newValue);              // expensive child              │
│   });                                <Expensive val={deferredVal} /> │
│                                                                      │
│   ────────────────────────────────────────────────────────────────   │
│                                                                      │
│   USE WHEN:                          USE WHEN:                       │
│   - You own the state setter         - You receive value as prop    │
│   - Need isPending for UI            - Don't control when updated   │
│   - Want explicit control            - Simpler API                   │
│                                                                      │
│   ────────────────────────────────────────────────────────────────   │
│                                                                      │
│   HOW IT WORKS:                                                      │
│                                                                      │
│   Both tell React: "This update can wait if there's urgent work"    │
│                                                                      │
│   React will:                                                        │
│   1. First render with old value (fast, keeps UI responsive)         │
│   2. Then re-render with new value (in background)                   │
│   3. Show new value when ready (no jank)                             │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## React Server Components

### Client vs Server Components

```
┌─────────────────────────────────────────────────────────────────────┐
│                    SERVER vs CLIENT COMPONENTS                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   SERVER COMPONENTS (default in App Router)                         │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │  • Render on server only                                      │ │
│   │  • Can access server resources (DB, filesystem)               │ │
│   │  • Zero client-side JavaScript                                │ │
│   │  • Cannot use hooks (useState, useEffect)                     │ │
│   │  • Cannot use browser APIs                                    │ │
│   │  • Cannot handle events                                       │ │
│   │                                                               │ │
│   │  // app/page.js (Server Component)                            │ │
│   │  async function Page() {                                      │ │
│   │    const data = await db.query('SELECT * FROM posts');        │ │
│   │    return <PostList posts={data} />;                          │ │
│   │  }                                                            │ │
│   └───────────────────────────────────────────────────────────────┘ │
│                                                                      │
│   CLIENT COMPONENTS ('use client' directive)                         │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │  • Render on client (hydrate)                                 │ │
│   │  • Can use hooks and state                                    │ │
│   │  • Can handle events                                          │ │
│   │  • Adds to bundle size                                        │ │
│   │                                                               │ │
│   │  'use client';                                                │ │
│   │                                                               │ │
│   │  export function Counter() {                                  │ │
│   │    const [count, setCount] = useState(0);                     │ │
│   │    return <button onClick={() => setCount(c + 1)}>{count}</button>;│
│   │  }                                                            │ │
│   └───────────────────────────────────────────────────────────────┘ │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### RSC Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    RSC DATA FLOW                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   SERVER                                                             │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │                                                               │ │
│   │   1. Server receives request                                  │ │
│   │                    │                                          │ │
│   │                    ▼                                          │ │
│   │   2. Render Server Components                                 │ │
│   │      ┌────────────────────────────────────────────┐          │ │
│   │      │  async function Page() {                    │          │ │
│   │      │    const data = await fetch(...);           │          │ │
│   │      │    return <Layout><Content data={data} /></Layout>;   │ │
│   │      │  }                                          │          │ │
│   │      └────────────────────────────────────────────┘          │ │
│   │                    │                                          │ │
│   │                    ▼                                          │ │
│   │   3. Output: RSC Payload (special format)                     │ │
│   │      • Serialized component tree                              │ │
│   │      • Placeholders for Client Components                     │ │
│   │      • Data already fetched and embedded                      │ │
│   │                                                               │ │
│   └───────────────────────────────────────────────────────────────┘ │
│                              │                                       │
│                              │  Stream to client                     │
│                              ▼                                       │
│   CLIENT                                                             │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │                                                               │ │
│   │   4. Receive RSC Payload                                      │ │
│   │                    │                                          │ │
│   │                    ▼                                          │ │
│   │   5. Render Client Components                                 │ │
│   │      • Hydrate placeholders with client code                  │ │
│   │      • Attach event handlers                                  │ │
│   │                    │                                          │ │
│   │                    ▼                                          │ │
│   │   6. Interactive page ready!                                  │ │
│   │                                                               │ │
│   └───────────────────────────────────────────────────────────────┘ │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Performance Optimization Internals

### React.memo - How It Works

```javascript
// React.memo creates a wrapper that compares props
const MemoizedComponent = memo(function Component({ name, data }) {
  return <div>{name}: {data.value}</div>;
});

// Internally equivalent to:
function MemoWrapper(Component) {
  let prevProps = null;
  let prevResult = null;
  
  return function MemoizedComponent(props) {
    if (prevProps !== null && shallowEqual(prevProps, props)) {
      return prevResult;  // Skip render, reuse previous result
    }
    
    prevProps = props;
    prevResult = <Component {...props} />;
    return prevResult;
  };
}

// Custom comparison
const CustomMemo = memo(Component, (prevProps, nextProps) => {
  // Return true to SKIP render (props are equal)
  // Return false to RE-RENDER (props changed)
  return prevProps.id === nextProps.id;
});
```

### useMemo & useCallback Internals

```javascript
// useMemo caches a VALUE
function useMemo(factory, deps) {
  const hook = getHook();
  
  if (depsChanged(hook.memoizedState?.deps, deps)) {
    const value = factory();
    hook.memoizedState = { value, deps };
    return value;
  }
  
  return hook.memoizedState.value;
}

// useCallback caches a FUNCTION
// It's literally useMemo for functions
function useCallback(fn, deps) {
  return useMemo(() => fn, deps);
}

// When to use:
// useMemo: Expensive calculations
const sortedList = useMemo(() => 
  items.sort((a, b) => a.value - b.value), 
  [items]
);

// useCallback: Functions passed to memoized children
const handleClick = useCallback(() => {
  doSomething(id);
}, [id]);
```

### Bailout - When React Skips Re-render

```
┌─────────────────────────────────────────────────────────────────────┐
│                    REACT BAILOUT CONDITIONS                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   React will SKIP re-rendering a component when:                     │
│                                                                      │
│   1. Same element reference (parent didn't re-render)                │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │  function Parent() {                                          │ │
│   │    return (                                                   │ │
│   │      <Layout>                                                 │ │
│   │        {children}  // children don't re-render if unchanged  │ │
│   │      </Layout>                                                │ │
│   │    );                                                         │ │
│   │  }                                                            │ │
│   └───────────────────────────────────────────────────────────────┘ │
│                                                                      │
│   2. memo() with unchanged props (shallow comparison)                │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │  const Child = memo(({ name }) => <div>{name}</div>);         │ │
│   │  // Skips if name === prevName                                │ │
│   └───────────────────────────────────────────────────────────────┘ │
│                                                                      │
│   3. setState with same state (Object.is comparison)                 │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │  const [count, setCount] = useState(0);                       │ │
│   │  setCount(0);  // Bails out if count is already 0            │ │
│   └───────────────────────────────────────────────────────────────┘ │
│                                                                      │
│   4. Context: useMemo on value + memo on consumers                   │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │  const value = useMemo(() => ({ user, setUser }), [user]);    │ │
│   │  return <Context.Provider value={value}>{children}</Context.Provider>;│
│   └───────────────────────────────────────────────────────────────┘ │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Children as Props Pattern (Composition)

```javascript
// This pattern prevents unnecessary re-renders

// ❌ Slow: SlowComponent re-renders on every count change
function Slow() {
  const [count, setCount] = useState(0);
  
  return (
    <div>
      <button onClick={() => setCount(c + 1)}>{count}</button>
      <ExpensiveComponent />  {/* Re-renders every time! */}
    </div>
  );
}

// ✅ Fast: ExpensiveComponent passed as children
function Fast({ children }) {
  const [count, setCount] = useState(0);
  
  return (
    <div>
      <button onClick={() => setCount(c + 1)}>{count}</button>
      {children}  {/* Same reference, doesn't re-render */}
    </div>
  );
}

// Usage
<Fast>
  <ExpensiveComponent />
</Fast>

// Why it works:
// - children is created in PARENT's render
// - Parent doesn't re-render when Fast's state changes
// - children reference stays the same
// - React bails out of re-rendering ExpensiveComponent
```

### Complete Performance Example: All Optimization Techniques

```javascript
import { useState, useMemo, useCallback, memo, createContext, useContext } from 'react';

// ===============================================
// PROBLEM: Every re-render cascades to all children
// ===============================================

function BadApp() {
  const [user, setUser] = useState({ name: 'John', theme: 'dark' });
  const [count, setCount] = useState(0);
  
  // ❌ New object every render
  const settings = { color: user.theme === 'dark' ? '#fff' : '#000' };
  
  // ❌ New function every render
  const handleClick = () => setCount(c => c + 1);
  
  return (
    <div>
      <Counter count={count} onClick={handleClick} />
      <UserProfile user={user} settings={settings} />
      <ExpensiveList items={items} />
    </div>
  );
}

// ===============================================
// SOLUTION: Strategic memoization
// ===============================================

function GoodApp() {
  const [user, setUser] = useState({ name: 'John', theme: 'dark' });
  const [count, setCount] = useState(0);
  
  // ✅ Memoized object - only recreates when theme changes
  const settings = useMemo(() => ({
    color: user.theme === 'dark' ? '#fff' : '#000'
  }), [user.theme]);
  
  // ✅ Memoized function - stable reference
  const handleClick = useCallback(() => {
    setCount(c => c + 1);
  }, []);
  
  // ✅ Memoized expensive computation
  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => a.name.localeCompare(b.name));
  }, [items]);
  
  return (
    <div>
      <Counter count={count} onClick={handleClick} />
      <UserProfile user={user} settings={settings} />
      <ExpensiveList items={sortedItems} />
    </div>
  );
}

// ===============================================
// MEMOIZED CHILD COMPONENTS
// ===============================================

// ✅ Wrapped with memo - only re-renders if props change
const Counter = memo(function Counter({ count, onClick }) {
  console.log('Counter rendered');
  return <button onClick={onClick}>{count}</button>;
});

// ✅ Custom comparison for complex props
const UserProfile = memo(function UserProfile({ user, settings }) {
  console.log('UserProfile rendered');
  return (
    <div style={{ color: settings.color }}>
      {user.name}
    </div>
  );
}, (prevProps, nextProps) => {
  // Return true to SKIP render
  return prevProps.user.name === nextProps.user.name &&
         prevProps.settings.color === nextProps.settings.color;
});

// ✅ Expensive component that only re-renders when items change
const ExpensiveList = memo(function ExpensiveList({ items }) {
  console.log('ExpensiveList rendered');
  
  return (
    <ul>
      {items.map(item => (
        <ExpensiveItem key={item.id} item={item} />
      ))}
    </ul>
  );
});
```

```
┌─────────────────────────────────────────────────────────────────────┐
│          WHEN TO USE EACH OPTIMIZATION                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   memo()                                                            │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │  USE WHEN:                                                    │ │
│   │  ✓ Component receives same props frequently                   │ │
│   │  ✓ Component is expensive to render                           │ │
│   │  ✓ Parent re-renders often with unrelated state               │ │
│   │                                                               │ │
│   │  DON'T USE WHEN:                                              │ │
│   │  ✗ Props change every render (memo check is wasted)           │ │
│   │  ✗ Component is simple (comparison might cost more)           │ │
│   │  ✗ All props are primitives and always change                 │ │
│   └───────────────────────────────────────────────────────────────┘ │
│                                                                      │
│   useMemo()                                                         │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │  USE WHEN:                                                    │ │
│   │  ✓ Expensive calculations (sorting, filtering large arrays)  │ │
│   │  ✓ Creating objects/arrays passed to memoized children       │ │
│   │  ✓ Referential equality matters for effects                  │ │
│   │                                                               │ │
│   │  DON'T USE WHEN:                                              │ │
│   │  ✗ Simple calculations (x + y)                                │ │
│   │  ✗ Value isn't passed to children or used in deps            │ │
│   │  ✗ No memoized children consume it                           │ │
│   └───────────────────────────────────────────────────────────────┘ │
│                                                                      │
│   useCallback()                                                     │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │  USE WHEN:                                                    │ │
│   │  ✓ Passing callbacks to memoized children                    │ │
│   │  ✓ Function is in dependency array of hooks                  │ │
│   │  ✓ Function passed to components that rely on reference      │ │
│   │                                                               │ │
│   │  DON'T USE WHEN:                                              │ │
│   │  ✗ Child isn't memoized (useless to stabilize reference)     │ │
│   │  ✗ Function recreated every render anyway (closure changed)  │ │
│   └───────────────────────────────────────────────────────────────┘ │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Context Optimization Pattern

```javascript
// ❌ BAD: Any context change re-renders ALL consumers
const AppContext = createContext();

function BadProvider({ children }) {
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState('light');
  const [notifications, setNotifications] = useState([]);
  
  // New object every render!
  const value = { user, setUser, theme, setTheme, notifications, setNotifications };
  
  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

// Every component using useContext(AppContext) re-renders
// when ANY of these values change!
```

```javascript
// ✅ GOOD: Split contexts by update frequency

// Rarely changes
const UserContext = createContext();
// Changes with user interactions
const ThemeContext = createContext();
// Changes frequently
const NotificationContext = createContext();

function GoodProvider({ children }) {
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState('light');
  const [notifications, setNotifications] = useState([]);
  
  // ✅ Memoize each context value
  const userValue = useMemo(() => ({ user, setUser }), [user]);
  const themeValue = useMemo(() => ({ theme, setTheme }), [theme]);
  const notifValue = useMemo(() => ({ notifications, setNotifications }), [notifications]);
  
  return (
    <UserContext.Provider value={userValue}>
      <ThemeContext.Provider value={themeValue}>
        <NotificationContext.Provider value={notifValue}>
          {children}
        </NotificationContext.Provider>
      </ThemeContext.Provider>
    </UserContext.Provider>
  );
}

// Components only re-render when their specific context changes!
function ThemeToggle() {
  const { theme, setTheme } = useContext(ThemeContext);
  // Only re-renders when theme changes, not when user or notifications change
  return <button onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')}>{theme}</button>;
}
```

```
┌─────────────────────────────────────────────────────────────────────┐
│          CONTEXT OPTIMIZATION PATTERNS                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   Pattern 1: Split by update frequency                              │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │                                                               │ │
│   │   UserContext        → Changes on login/logout (rare)         │ │
│   │   ThemeContext       → Changes on user action (occasional)    │ │
│   │   NotificationContext → Changes frequently (often)            │ │
│   │                                                               │ │
│   │   Components subscribe only to what they need                 │ │
│   │                                                               │ │
│   └───────────────────────────────────────────────────────────────┘ │
│                                                                      │
│   Pattern 2: Separate state from dispatch                           │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │                                                               │ │
│   │   const StateContext = createContext();    // Value           │ │
│   │   const DispatchContext = createContext(); // Functions       │ │
│   │                                                               │ │
│   │   // Components that only dispatch never re-render            │ │
│   │   // from state changes                                       │ │
│   │                                                               │ │
│   │   function AddButton() {                                      │ │
│   │     const dispatch = useContext(DispatchContext);             │ │
│   │     // Never re-renders when state changes!                   │ │
│   │     return <button onClick={() => dispatch({ type: 'ADD' })}>;│ │
│   │   }                                                           │ │
│   │                                                               │ │
│   └───────────────────────────────────────────────────────────────┘ │
│                                                                      │
│   Pattern 3: Memoize consumers                                      │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │                                                               │ │
│   │   // If you can't split context, memoize consumers            │ │
│   │                                                               │ │
│   │   function Container() {                                      │ │
│   │     const { theme } = useContext(AppContext);                 │ │
│   │     // This re-renders on any context change                  │ │
│   │                                                               │ │
│   │     return (                                                  │ │
│   │       <div style={{ background: theme.bg }}>                  │ │
│   │         <MemoizedContent />  // But children don't!           │ │
│   │       </div>                                                  │ │
│   │     );                                                        │ │
│   │   }                                                           │ │
│   │                                                               │ │
│   └───────────────────────────────────────────────────────────────┘ │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Debugging Re-renders: Why Did This Render?

```javascript
import { useRef, useEffect } from 'react';

// Custom hook to log what changed
function useWhyDidYouRender(name, props) {
  const previousProps = useRef();
  
  useEffect(() => {
    if (previousProps.current) {
      const allKeys = Object.keys({ ...previousProps.current, ...props });
      const changedProps = {};
      
      allKeys.forEach(key => {
        if (previousProps.current[key] !== props[key]) {
          changedProps[key] = {
            from: previousProps.current[key],
            to: props[key]
          };
        }
      });
      
      if (Object.keys(changedProps).length) {
        console.log('[why-did-you-render]', name, 'changed props:', changedProps);
      }
    }
    
    previousProps.current = props;
  });
}

// Usage
function MyComponent(props) {
  useWhyDidYouRender('MyComponent', props);
  
  return <div>{/* ... */}</div>;
}

// Console output when unnecessary re-render occurs:
// [why-did-you-render] MyComponent changed props: {
//   onClick: { from: [Function], to: [Function] }  // Different reference!
// }
// This tells you: onClick prop is a new function every render
// Solution: useCallback on the parent
```

---

## Interview Questions

### Q1: Explain the Virtual DOM and its benefits

<details>
<summary>Answer</summary>

The Virtual DOM is a lightweight JavaScript representation of the actual DOM. React maintains two virtual trees - the current and the work-in-progress.

**Benefits:**
1. **Batching**: Multiple state changes result in a single DOM update
2. **Diffing**: Only changed elements are updated in real DOM
3. **Abstraction**: Declarative API (describe what, not how)
4. **Cross-platform**: Same model works for React Native

**Process:**
1. State changes trigger re-render
2. New VDOM tree is created
3. Diff algorithm compares old and new trees
4. Minimal DOM operations calculated
5. Changes applied in a batch

</details>

### Q2: What is the Fiber architecture and why was it introduced?

<details>
<summary>Answer</summary>

Fiber is React's reconciliation engine (React 16+). It's a complete rewrite that enables:

1. **Interruptible rendering**: Work can be paused and resumed
2. **Priority-based updates**: Urgent updates (user input) processed first
3. **Concurrent features**: Multiple versions of UI can be prepared

**Why introduced:**
- The old Stack reconciler was synchronous and blocking
- Large renders caused jank (dropped frames)
- Couldn't prioritize urgent updates over slow ones

**How it works:**
- Work is broken into small units (fibers)
- Each fiber represents a component instance
- Fibers form a linked list (child, sibling, return)
- Work loop processes fibers one by one, yielding to browser

</details>

### Q3: Explain the two phases of React rendering

<details>
<summary>Answer</summary>

**1. Render Phase (Reconciliation):**
- Pure, has no side effects
- Can be paused, aborted, or restarted
- Builds work-in-progress fiber tree
- Runs: constructor, render, getDerivedStateFromProps
- Calculates what changes are needed

**2. Commit Phase:**
- Synchronous, cannot be interrupted
- Applies changes to the DOM
- Runs effects and lifecycle methods
- Three sub-phases:
  - Before Mutation (getSnapshotBeforeUpdate)
  - Mutation (DOM changes, ref detachment)
  - Layout (useLayoutEffect, componentDidMount/Update, ref attachment)

After commit, useEffect runs asynchronously.

</details>

### Q4: Why must hooks be called in the same order?

<details>
<summary>Answer</summary>

Hooks are stored as a **linked list** on the fiber node. React identifies each hook by its **call order**, not by name.

```javascript
// Render 1:
useState(0)   // Index 0: { state: 0 }
useState('')  // Index 1: { state: '' }

// Render 2:
useState(0)   // Index 0: reads { state: 0 } ✓
useState('')  // Index 1: reads { state: '' } ✓
```

If order changes (conditional hooks):
```javascript
// Render 2 (condition changed):
// skipped useState(0)
useState('')  // Index 0: reads { state: 0 } ❌ WRONG STATE!
```

React can't know which hook is which without consistent ordering.

</details>

### Q5: What's the difference between useEffect and useLayoutEffect?

<details>
<summary>Answer</summary>

**useLayoutEffect:**
- Runs **synchronously** after DOM mutations
- Runs **before** browser paint
- Blocks visual updates
- Use for: DOM measurements, scroll position, animations

**useEffect:**
- Runs **asynchronously** after paint
- Doesn't block the browser
- Use for: Data fetching, subscriptions, logging

**Execution order:**
1. React renders
2. DOM mutations applied
3. `useLayoutEffect` runs (blocking)
4. Browser paints
5. `useEffect` runs (non-blocking)

```javascript
// Prevent flash of wrong content
useLayoutEffect(() => {
  // Measure and set immediately before paint
  const height = ref.current.offsetHeight;
  setHeight(height);
}, []);
```

</details>

### Q6: How does React batching work?

<details>
<summary>Answer</summary>

**React 18 Automatic Batching:**

All state updates are batched, regardless of where they occur:

```javascript
// All these are batched (single re-render):
function handleClick() {
  setCount(c => c + 1);
  setFlag(f => !f);
}

// Also batched in React 18:
setTimeout(() => {
  setCount(c => c + 1);
  setFlag(f => !f);
}, 100);

// Also batched:
fetch('/api').then(() => {
  setCount(c => c + 1);
  setFlag(f => !f);
});
```

**To force immediate update:**
```javascript
import { flushSync } from 'react-dom';

flushSync(() => {
  setCount(c => c + 1);
});
// DOM updated here

flushSync(() => {
  setFlag(f => !f);
});
// DOM updated again
```

</details>

### Q7: How do keys affect reconciliation?

<details>
<summary>Answer</summary>

Keys help React identify which items have changed, been added, or removed.

**Without keys (using index):**
```javascript
// Before: [A, B, C]
// After:  [Z, A, B, C]
// React: Updates A→Z, B→A, C→B, creates D
// Result: 4 operations, state issues
```

**With proper keys:**
```javascript
// Before: [A(key=a), B(key=b), C(key=c)]
// After:  [Z(key=z), A(key=a), B(key=b), C(key=c)]
// React: Creates Z, moves others
// Result: 1 operation, state preserved
```

**Key rules:**
- Must be unique among siblings
- Must be stable (don't use random IDs)
- Don't use index if list can reorder
- Use database IDs or stable identifiers

</details>

### Q8: Explain concurrent features in React 18

<details>
<summary>Answer</summary>

**Concurrent rendering** allows React to prepare multiple versions of UI and prioritize updates.

**Key features:**

1. **useTransition**: Mark updates as non-urgent
```javascript
const [isPending, startTransition] = useTransition();
startTransition(() => {
  setSearchResults(filter(data));
});
```

2. **useDeferredValue**: Defer updating a value
```javascript
const deferredQuery = useDeferredValue(query);
// deferredQuery lags behind query during updates
```

3. **Suspense improvements**: Better streaming and transitions

**How it works:**
- Updates are assigned priority lanes
- High-priority (user input) interrupts low-priority
- Work-in-progress can be abandoned
- Multiple versions of UI prepared simultaneously

</details>

### Q9: What are Server Components?

<details>
<summary>Answer</summary>

**React Server Components (RSC)** run on the server and send serialized output to the client.

**Server Components:**
- No client-side JavaScript
- Can access server resources directly
- Cannot use hooks or event handlers
- Great for static or data-fetching components

**Client Components:**
- Standard React components
- Can use hooks, state, effects
- Handle interactivity
- Add to bundle size

**Benefits:**
- Smaller bundles (server code not shipped)
- Direct database/API access
- Improved performance for static content
- Streaming and Suspense integration

```javascript
// Server Component (default)
async function Posts() {
  const posts = await db.posts.findAll();
  return <PostList posts={posts} />;
}

// Client Component
'use client';
function LikeButton() {
  const [liked, setLiked] = useState(false);
  return <button onClick={() => setLiked(!liked)}>Like</button>;
}
```

</details>

### Q10: How does React.memo work internally?

<details>
<summary>Answer</summary>

`React.memo` wraps a component and **shallow compares props** before re-rendering.

**Internal logic:**
```javascript
function memo(Component, compare = shallowEqual) {
  return function MemoizedComponent(props) {
    const prevProps = usePreviousProps(props);
    
    if (prevProps && compare(prevProps, props)) {
      // Props unchanged, return previous render
      return previousResult;
    }
    
    // Props changed, re-render
    return <Component {...props} />;
  };
}
```

**Gotchas:**
- New object/array props break memoization
- Inline functions break memoization
- Use useCallback/useMemo for stable references

**Custom comparison:**
```javascript
const MemoComponent = memo(Component, (prev, next) => {
  return prev.id === next.id && prev.name === next.name;
});
```

</details>

### Q11: Explain what happens when you call setState

<details>
<summary>Answer</summary>

**Step-by-step process:**

1. **setState is called**
   - React adds update to the fiber's update queue
   - Schedules a re-render (doesn't happen immediately)

2. **React processes the update queue**
   - During next render, React reads the queue
   - Applies each update to compute new state
   - Value updates replace; function updates receive previous state

3. **Reconciliation**
   - React calls your component with new state
   - Compares new elements with previous elements
   - Determines what changed

4. **Commit**
   - Applies minimum necessary DOM changes
   - Runs effects

```javascript
function Counter() {
  const [count, setCount] = useState(0);
  
  function increment() {
    setCount(count + 1);
    // count is still 0 here!
    console.log(count); // 0
    
    setCount(count + 1);
    // count is STILL 0!
    console.log(count); // 0
  }
  
  // After render, count will be 1, not 2
  // Because both setCount used the same closure value (0)
}
```

**Key insight:** State updates are asynchronous and batched. The state variable doesn't change until the next render.

</details>

### Q12: What causes unnecessary re-renders and how to fix them?

<details>
<summary>Answer</summary>

**Common causes:**

1. **Parent re-renders** (child re-renders too)
   ```javascript
   // Fix: memo() the child
   const Child = memo(function Child(props) { ... });
   ```

2. **New object/array in props**
   ```javascript
   // ❌ New object every render
   <Child style={{ color: 'red' }} />
   
   // ✅ Memoize or define outside
   const style = useMemo(() => ({ color: 'red' }), []);
   <Child style={style} />
   ```

3. **Inline functions**
   ```javascript
   // ❌ New function every render
   <Child onClick={() => handleClick(id)} />
   
   // ✅ useCallback
   const onClick = useCallback(() => handleClick(id), [id]);
   <Child onClick={onClick} />
   ```

4. **Context changes**
   ```javascript
   // ❌ All consumers re-render
   <Context.Provider value={{ user, theme }}>
   
   // ✅ Split contexts or memoize value
   const value = useMemo(() => ({ user, theme }), [user, theme]);
   ```

</details>

### Q13: Explain the difference between controlled and uncontrolled components

<details>
<summary>Answer</summary>

**Controlled Component:**
- React state is the "single source of truth"
- Every change goes through setState
- You can validate/transform input

```javascript
function ControlledInput() {
  const [value, setValue] = useState('');
  
  return (
    <input 
      value={value}  // Controlled by React
      onChange={e => setValue(e.target.value)}
    />
  );
}
```

**Uncontrolled Component:**
- DOM is the source of truth
- Use ref to read value when needed
- Less code, but less control

```javascript
function UncontrolledInput() {
  const inputRef = useRef();
  
  const handleSubmit = () => {
    console.log(inputRef.current.value);  // Read DOM directly
  };
  
  return (
    <>
      <input ref={inputRef} defaultValue="initial" />
      <button onClick={handleSubmit}>Submit</button>
    </>
  );
}
```

**When to use each:**
- Controlled: Forms with validation, conditional disable, formatting
- Uncontrolled: Simple forms, file inputs, integrating non-React code

</details>

### Q14: How does React handle events differently from native DOM events?

<details>
<summary>Answer</summary>

**React's Synthetic Events:**

1. **Event Delegation**
   - React attaches one handler at the root, not on each element
   - Events bubble up and React routes them to correct handler
   - More efficient than attaching listeners to every element

2. **Cross-browser compatibility**
   - SyntheticEvent normalizes browser differences
   - Same API across all browsers

3. **Event Pooling (React 16 and earlier)**
   - Events were recycled for performance
   - Accessing event async would fail
   - React 17+ removed pooling

```javascript
function EventExample() {
  const handleClick = (e) => {
    // e is a SyntheticEvent
    console.log(e.type);        // 'click'
    console.log(e.nativeEvent); // Original DOM event
    
    // React 16: e.persist() needed for async
    // React 17+: No longer needed
    setTimeout(() => {
      console.log(e.type);  // Works in React 17+
    }, 100);
  };
  
  return <button onClick={handleClick}>Click</button>;
}
```

**Event naming:**
- React: onClick, onChange (camelCase)
- DOM: onclick, onchange (lowercase)

</details>

### Q15: What is Strict Mode and what does it do?

<details>
<summary>Answer</summary>

**React.StrictMode** is a development tool that:

1. **Detects unsafe lifecycles**
   - Warns about deprecated methods

2. **Warns about legacy APIs**
   - findDOMNode, legacy context, etc.

3. **Detects side effects in render**
   - Double-invokes render phase methods
   - Helps find impure rendering

```javascript
function App() {
  console.log('Render');  // Logs TWICE in StrictMode (dev only)
  
  const [count, setCount] = useState(() => {
    console.log('Init');  // Also logs TWICE
    return 0;
  });
  
  useEffect(() => {
    console.log('Effect');  // Runs TWICE (mount, unmount, mount)
    return () => console.log('Cleanup');
  }, []);
  
  return <div>{count}</div>;
}

// Wrap in StrictMode
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

**Why double invoke?**
- Exposes bugs from impure renders
- In React 18, helps prepare for Offscreen/concurrent features
- Only in development mode (no performance impact in production)

</details>

---

## Common Bugs and How to Debug Them

### Bug 1: Infinite Loop from useEffect

```javascript
// ❌ BUG: Infinite re-renders
function InfiniteLoop() {
  const [data, setData] = useState([]);
  
  useEffect(() => {
    // This creates a new array every time
    setData([...data, 'new item']);
  }, [data]);  // data changes → effect runs → setData → data changes...
}

// ✅ FIX: Use functional update
function Fixed() {
  const [data, setData] = useState([]);
  
  useEffect(() => {
    setData(prev => [...prev, 'new item']);
  }, []);  // Empty deps - runs once
}
```

### Bug 2: Stale Closure in Event Handler

```javascript
// ❌ BUG: Handler always uses initial count
function StaleClosureBug() {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    const handler = () => {
      // This `count` is captured when effect ran (0)
      console.log('Count:', count);  // Always 0!
    };
    
    window.addEventListener('click', handler);
    return () => window.removeEventListener('click', handler);
  }, []);  // Empty deps = closure captures initial values
  
  return <button onClick={() => setCount(c => c + 1)}>
    Count: {count}
  </button>;
}

// ✅ FIX 1: Add count to deps
useEffect(() => {
  const handler = () => console.log('Count:', count);
  window.addEventListener('click', handler);
  return () => window.removeEventListener('click', handler);
}, [count]);  // Re-subscribe when count changes

// ✅ FIX 2: Use ref for latest value
function FixedWithRef() {
  const [count, setCount] = useState(0);
  const countRef = useRef(count);
  countRef.current = count;  // Always update ref
  
  useEffect(() => {
    const handler = () => {
      console.log('Count:', countRef.current);  // Always current!
    };
    window.addEventListener('click', handler);
    return () => window.removeEventListener('click', handler);
  }, []);  // Can use empty deps now
}
```

### Bug 3: Object/Array Dependency Causes Infinite Effect

```javascript
// ❌ BUG: Effect runs every render
function ObjectDepBug({ user }) {
  const [profile, setProfile] = useState(null);
  
  const options = { userId: user.id, includeAvatar: true };
  
  useEffect(() => {
    fetchProfile(options).then(setProfile);
  }, [options]);  // options is NEW object every render!
}

// ✅ FIX 1: Use primitive values
useEffect(() => {
  const options = { userId: user.id, includeAvatar: true };
  fetchProfile(options).then(setProfile);
}, [user.id]);  // Primitive, stable comparison

// ✅ FIX 2: Memoize the object
const options = useMemo(() => ({
  userId: user.id,
  includeAvatar: true
}), [user.id]);

useEffect(() => {
  fetchProfile(options).then(setProfile);
}, [options]);  // Now stable
```

### Bug 4: State Update on Unmounted Component

```javascript
// ❌ BUG: Memory leak warning
function UnmountBug() {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    fetch('/api/data')
      .then(res => res.json())
      .then(data => setData(data));  // Might run after unmount!
  }, []);
}

// ✅ FIX: Cancel or ignore on unmount
function Fixed() {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    let cancelled = false;
    
    fetch('/api/data')
      .then(res => res.json())
      .then(data => {
        if (!cancelled) {
          setData(data);  // Only update if still mounted
        }
      });
    
    return () => { cancelled = true; };
  }, []);
}

// ✅ BETTER: Use AbortController
function BetterFix() {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    const controller = new AbortController();
    
    fetch('/api/data', { signal: controller.signal })
      .then(res => res.json())
      .then(setData)
      .catch(err => {
        if (err.name !== 'AbortError') throw err;
      });
    
    return () => controller.abort();
  }, []);
}
```

### Bug 5: Missing Key Causes State Bug

```javascript
// ❌ BUG: Editing wrong item after reorder
function ListBug({ items }) {
  return (
    <ul>
      {items.map((item, index) => (
        <li key={index}>  {/* Using index as key! */}
          <input defaultValue={item.text} />
        </li>
      ))}
    </ul>
  );
}

// User types in first input
// Items reorder (e.g., sort)
// Input text stays in first position, but item moved!

// ✅ FIX: Use stable, unique key
function ListFixed({ items }) {
  return (
    <ul>
      {items.map(item => (
        <li key={item.id}>  {/* Unique ID */}
          <input defaultValue={item.text} />
        </li>
      ))}
    </ul>
  );
}
```

```
┌─────────────────────────────────────────────────────────────────────┐
│          DEBUGGING CHECKLIST                                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   🔄 INFINITE RE-RENDERS?                                           │
│   □ Check useEffect dependencies for objects/arrays                  │
│   □ Check if setState in effect creates loop                         │
│   □ Check if functional update would help                            │
│                                                                      │
│   📦 STATE NOT UPDATING?                                            │
│   □ Check if using stale closure                                     │
│   □ Check if mutating state instead of creating new                  │
│   □ Check if using same object reference                             │
│                                                                      │
│   🔑 LIST ITEMS BEHAVING WRONG?                                     │
│   □ Check if using index as key                                      │
│   □ Check if key is unique and stable                                │
│   □ Check if component type changed (unmounts!)                      │
│                                                                      │
│   ⚡ PERFORMANCE ISSUE?                                              │
│   □ Check React DevTools Profiler                                    │
│   □ Check if memoization would help                                  │
│   □ Check context subscription scope                                 │
│                                                                      │
│   💀 MEMORY LEAK?                                                    │
│   □ Check effect cleanup function                                    │
│   □ Check async operations on unmount                                │
│   □ Check subscriptions/event listeners                              │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Summary

```
┌─────────────────────────────────────────────────────────────────────┐
│                    REACT INTERNALS CHEAT SHEET                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   VIRTUAL DOM                                                        │
│   • JavaScript representation of DOM                                 │
│   • Enables efficient batching and diffing                           │
│   • React Elements are plain objects                                 │
│                                                                      │
│   RECONCILIATION                                                     │
│   • O(n) algorithm with heuristics                                   │
│   • Different types = rebuild subtree                                │
│   • Keys identify stable elements in lists                           │
│                                                                      │
│   FIBER                                                              │
│   • Unit of work (linked list)                                       │
│   • Enables interruptible rendering                                  │
│   • Double buffering (current ↔ WIP)                                │
│                                                                      │
│   RENDERING PHASES                                                   │
│   • Render: Pure, interruptible, builds fiber tree                   │
│   • Commit: Synchronous, applies DOM changes, runs effects          │
│                                                                      │
│   HOOKS                                                              │
│   • Stored as linked list on fiber                                   │
│   • Order must be consistent                                         │
│   • useState queues updates, useEffect deferred                     │
│                                                                      │
│   CONCURRENT FEATURES                                                │
│   • Priority lanes for update scheduling                             │
│   • useTransition for non-urgent updates                            │
│   • useDeferredValue for lagging values                             │
│                                                                      │
│   OPTIMIZATION                                                       │
│   • memo() for prop comparison                                       │
│   • useMemo for expensive calculations                               │
│   • useCallback for stable function references                       │
│   • Children-as-props pattern for composition                        │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Practical Interview Coding Patterns

### Pattern 1: Implement a Custom Hook - useDebounce

```javascript
import { useState, useEffect } from 'react';

function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    // Set up timer to update debounced value after delay
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    // Clean up timer if value changes before delay passes
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);
  
  return debouncedValue;
}

// Usage
function SearchComponent() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 500);
  
  useEffect(() => {
    if (debouncedQuery) {
      // This only runs 500ms after user stops typing
      fetchSearchResults(debouncedQuery);
    }
  }, [debouncedQuery]);
  
  return (
    <input 
      value={query} 
      onChange={e => setQuery(e.target.value)}
      placeholder="Search..."
    />
  );
}
```

### Pattern 2: Implement a Custom Hook - usePrevious

```javascript
import { useRef, useEffect } from 'react';

function usePrevious(value) {
  const ref = useRef();
  
  useEffect(() => {
    ref.current = value;
  }, [value]);
  
  return ref.current;  // Returns undefined on first render
}

// Usage: Detect changes
function Counter() {
  const [count, setCount] = useState(0);
  const prevCount = usePrevious(count);
  
  return (
    <div>
      <p>Current: {count}, Previous: {prevCount}</p>
      <button onClick={() => setCount(c => c + 1)}>Increment</button>
    </div>
  );
}
```

### Pattern 3: Implement a Custom Hook - useOnClickOutside

```javascript
import { useEffect, useRef } from 'react';

function useOnClickOutside(ref, handler) {
  useEffect(() => {
    const listener = (event) => {
      // Do nothing if clicking ref's element or descendant elements
      if (!ref.current || ref.current.contains(event.target)) {
        return;
      }
      handler(event);
    };
    
    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);
    
    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]);
}

// Usage: Close dropdown when clicking outside
function Dropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef();
  
  useOnClickOutside(ref, () => setIsOpen(false));
  
  return (
    <div ref={ref}>
      <button onClick={() => setIsOpen(!isOpen)}>Toggle</button>
      {isOpen && (
        <ul>
          <li>Option 1</li>
          <li>Option 2</li>
        </ul>
      )}
    </div>
  );
}
```

### Pattern 4: Implement a Custom Hook - useFetch

```javascript
import { useState, useEffect } from 'react';

function useFetch(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const controller = new AbortController();
    
    async function fetchData() {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const json = await response.json();
        setData(json);
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
    
    return () => controller.abort();
  }, [url]);
  
  return { data, loading, error };
}

// Usage
function UserProfile({ userId }) {
  const { data: user, loading, error } = useFetch(`/api/users/${userId}`);
  
  if (loading) return <Spinner />;
  if (error) return <Error message={error} />;
  return <div>{user.name}</div>;
}
```

### Pattern 5: Higher Order Component (HOC)

```javascript
// HOC for adding loading state
function withLoading(WrappedComponent) {
  return function WithLoadingComponent({ isLoading, ...props }) {
    if (isLoading) {
      return <div className="loading">Loading...</div>;
    }
    return <WrappedComponent {...props} />;
  };
}

// HOC for adding authentication check
function withAuth(WrappedComponent) {
  return function WithAuthComponent(props) {
    const { user, loading } = useAuth();
    
    if (loading) return <Spinner />;
    if (!user) return <Navigate to="/login" />;
    
    return <WrappedComponent {...props} user={user} />;
  };
}

// Usage
const ProtectedDashboard = withAuth(Dashboard);
const LoadableList = withLoading(ItemList);
```

### Pattern 6: Render Props Pattern

```javascript
// Mouse position tracker using render props
function MouseTracker({ render }) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  
  useEffect(() => {
    const handleMove = (e) => {
      setPosition({ x: e.clientX, y: e.clientY });
    };
    
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);
  
  return render(position);
}

// Usage
function App() {
  return (
    <MouseTracker
      render={({ x, y }) => (
        <div>
          Mouse position: ({x}, {y})
        </div>
      )}
    />
  );
}

// Also works with children
function MouseTrackerWithChildren({ children }) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  // ... same logic
  return children(position);
}

// Usage with children
<MouseTrackerWithChildren>
  {({ x, y }) => <div>Position: {x}, {y}</div>}
</MouseTrackerWithChildren>
```

### Pattern 7: Compound Components

```javascript
const TabsContext = createContext();

function Tabs({ children, defaultTab }) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  
  const value = useMemo(() => ({
    activeTab,
    setActiveTab
  }), [activeTab]);
  
  return (
    <TabsContext.Provider value={value}>
      <div className="tabs">{children}</div>
    </TabsContext.Provider>
  );
}

function TabList({ children }) {
  return <div className="tab-list">{children}</div>;
}

function Tab({ name, children }) {
  const { activeTab, setActiveTab } = useContext(TabsContext);
  const isActive = activeTab === name;
  
  return (
    <button 
      className={`tab ${isActive ? 'active' : ''}`}
      onClick={() => setActiveTab(name)}
    >
      {children}
    </button>
  );
}

function TabPanels({ children }) {
  return <div className="tab-panels">{children}</div>;
}

function TabPanel({ name, children }) {
  const { activeTab } = useContext(TabsContext);
  
  if (activeTab !== name) return null;
  return <div className="tab-panel">{children}</div>;
}

// Attach sub-components
Tabs.List = TabList;
Tabs.Tab = Tab;
Tabs.Panels = TabPanels;
Tabs.Panel = TabPanel;

// Usage - Clean, declarative API!
function App() {
  return (
    <Tabs defaultTab="tab1">
      <Tabs.List>
        <Tabs.Tab name="tab1">First</Tabs.Tab>
        <Tabs.Tab name="tab2">Second</Tabs.Tab>
        <Tabs.Tab name="tab3">Third</Tabs.Tab>
      </Tabs.List>
      
      <Tabs.Panels>
        <Tabs.Panel name="tab1">Content for first tab</Tabs.Panel>
        <Tabs.Panel name="tab2">Content for second tab</Tabs.Panel>
        <Tabs.Panel name="tab3">Content for third tab</Tabs.Panel>
      </Tabs.Panels>
    </Tabs>
  );
}
```

### Pattern 8: Controlled vs Uncontrolled with forwardRef

```javascript
import { forwardRef, useImperativeHandle, useRef, useState } from 'react';

// Uncontrolled input with imperative handle
const FancyInput = forwardRef(function FancyInput(props, ref) {
  const inputRef = useRef();
  
  // Expose custom methods to parent
  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current.focus(),
    clear: () => { inputRef.current.value = ''; },
    getValue: () => inputRef.current.value,
    shake: () => {
      inputRef.current.classList.add('shake');
      setTimeout(() => inputRef.current.classList.remove('shake'), 500);
    }
  }));
  
  return <input ref={inputRef} {...props} />;
});

// Usage
function Form() {
  const inputRef = useRef();
  
  const handleSubmit = () => {
    if (!inputRef.current.getValue()) {
      inputRef.current.shake();  // Custom method!
      inputRef.current.focus();
      return;
    }
    // Submit...
    inputRef.current.clear();
  };
  
  return (
    <div>
      <FancyInput ref={inputRef} placeholder="Enter value" />
      <button onClick={handleSubmit}>Submit</button>
    </div>
  );
}
```

---

## Further Reading

- [React Fiber Architecture](https://github.com/acdlite/react-fiber-architecture)
- [Inside Fiber: In-depth overview](https://indepth.dev/posts/1008/inside-fiber-in-depth-overview-of-the-new-reconciliation-algorithm-in-react)
- [A Cartoon Intro to Fiber](https://www.youtube.com/watch?v=ZCuYPiUIONs)
- [React Source Code](https://github.com/facebook/react)
- [Building a Custom React Renderer](https://agent.build/blog/building-a-custom-react-renderer)


