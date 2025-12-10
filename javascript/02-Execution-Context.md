# Execution Context: A Complete Guide

## Table of Contents

1. [Introduction](#introduction)
2. [What is Execution Context?](#what-is-execution-context)
3. [Types of Execution Context](#types-of-execution-context)
4. [Execution Context Phases](#execution-context-phases)
5. [The Call Stack](#the-call-stack)
6. [Variable Environment & Hoisting](#variable-environment--hoisting)
7. [Scope Chain](#scope-chain)
8. [The `this` Keyword](#the-this-keyword)
9. [Lexical Environment](#lexical-environment)
10. [Closures & Execution Context](#closures--execution-context)
11. [Practical Examples](#practical-examples)
12. [Interview Questions](#interview-questions)

---

## Introduction

Understanding **Execution Context** is fundamental to mastering JavaScript. It explains:
- Why hoisting works the way it does
- How scope and closures function
- What `this` refers to in different situations
- Why certain code executes in a specific order

---

## What is Execution Context?

An **Execution Context** is an abstract environment where JavaScript code is evaluated and executed. Think of it as a "box" or "container" that holds:

1. **Variable Environment** - Variables, functions, and arguments
2. **Scope Chain** - Reference to outer environments
3. **`this` Binding** - What `this` refers to

```
┌─────────────────────────────────────────────────────────────────────┐
│                      EXECUTION CONTEXT                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │                  Variable Environment                          │ │
│   │                                                                │ │
│   │   • Variables declared in this context                        │ │
│   │   • Function declarations                                      │ │
│   │   • Arguments object (for functions)                          │ │
│   └───────────────────────────────────────────────────────────────┘ │
│                                                                      │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │                     Scope Chain                                │ │
│   │                                                                │ │
│   │   • Reference to outer/parent lexical environment             │ │
│   │   • Chain continues until Global Environment                  │ │
│   └───────────────────────────────────────────────────────────────┘ │
│                                                                      │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │                    this Binding                                │ │
│   │                                                                │ │
│   │   • Determined by how the function is called                  │ │
│   └───────────────────────────────────────────────────────────────┘ │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Types of Execution Context

JavaScript has **three** types of execution contexts:

### 1. Global Execution Context (GEC)

- Created when the script first runs
- Only **ONE** global context per program
- Creates the global object (`window` in browser, `global` in Node.js)
- Sets `this` to the global object

```javascript
// This code runs in the Global Execution Context
var globalVar = "I'm global";
console.log(this);  // window (browser) or global (Node.js)

// In browser
console.log(window.globalVar);  // "I'm global"
console.log(this === window);   // true
```

### 2. Function Execution Context (FEC)

- Created **every time** a function is invoked
- Each function call creates a **new** execution context
- Has access to `arguments` object

```javascript
function greet(name) {
  // New Function Execution Context created here
  var greeting = "Hello";
  console.log(greeting + ", " + name);
}

greet("Alice");  // Creates FEC #1
greet("Bob");    // Creates FEC #2 (separate from #1)
```

### 3. Eval Execution Context

- Created when code runs inside `eval()`
- **Avoid using `eval()`** - security and performance issues

```javascript
// Not recommended!
eval('var x = 10; console.log(x);');
```

### Visual: Types of Execution Context

```
┌─────────────────────────────────────────────────────────────────────┐
│                    JAVASCRIPT RUNTIME                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │              GLOBAL EXECUTION CONTEXT                          │ │
│   │                                                                │ │
│   │   • Created automatically when script starts                  │ │
│   │   • Only ONE per program                                      │ │
│   │   • Creates global object (window/global)                     │ │
│   │   • this = global object                                      │ │
│   │                                                                │ │
│   │   ┌─────────────────────────────────────────────────────────┐ │ │
│   │   │         FUNCTION EXECUTION CONTEXT #1                   │ │ │
│   │   │                                                         │ │ │
│   │   │   • Created on function invocation                      │ │ │
│   │   │   • New context per call                                │ │ │
│   │   │   • Has arguments object                                │ │ │
│   │   │                                                         │ │ │
│   │   │   ┌───────────────────────────────────────────────────┐ │ │ │
│   │   │   │     FUNCTION EXECUTION CONTEXT #2 (nested)        │ │ │ │
│   │   │   │                                                   │ │ │ │
│   │   │   │   • Can be nested infinitely                      │ │ │ │
│   │   │   └───────────────────────────────────────────────────┘ │ │ │
│   │   └─────────────────────────────────────────────────────────┘ │ │
│   └───────────────────────────────────────────────────────────────┘ │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Execution Context Phases

Every execution context goes through **two phases**:

### Phase 1: Creation Phase (Memory Allocation)

During this phase, JavaScript engine:

1. **Creates the Variable Object (VO)**
   - Scans for function declarations → stores entire function
   - Scans for variable declarations → stores as `undefined`
   - Scans for function arguments → stores in `arguments` object

2. **Creates the Scope Chain**
   - Links to parent/outer lexical environments

3. **Determines `this` binding**

### Phase 2: Execution Phase

During this phase, JavaScript engine:

1. **Assigns values** to variables
2. **Executes code** line by line
3. **Creates new execution contexts** for function calls

```
┌─────────────────────────────────────────────────────────────────────┐
│                EXECUTION CONTEXT LIFECYCLE                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │              PHASE 1: CREATION PHASE                         │   │
│   │                  (Memory Allocation)                         │   │
│   │                                                              │   │
│   │   Step 1: Create Variable Object (VO)                        │   │
│   │   ┌────────────────────────────────────────────────────────┐ │   │
│   │   │  • Function declarations → stored complete             │ │   │
│   │   │  • var declarations → initialized to undefined         │ │   │
│   │   │  • let/const declarations → uninitialized (TDZ)        │ │   │
│   │   │  • Function arguments → stored in arguments object     │ │   │
│   │   └────────────────────────────────────────────────────────┘ │   │
│   │                                                              │   │
│   │   Step 2: Create Scope Chain                                 │   │
│   │   ┌────────────────────────────────────────────────────────┐ │   │
│   │   │  • Link to outer/parent environment                    │ │   │
│   │   │  • Enables variable lookup in parent scopes            │ │   │
│   │   └────────────────────────────────────────────────────────┘ │   │
│   │                                                              │   │
│   │   Step 3: Determine 'this' binding                           │   │
│   │   ┌────────────────────────────────────────────────────────┐ │   │
│   │   │  • Based on how function is called                     │ │   │
│   │   │  • Global: this = window/global                        │ │   │
│   │   │  • Method: this = object                               │ │   │
│   │   │  • Arrow: this = lexical (inherited)                   │ │   │
│   │   └────────────────────────────────────────────────────────┘ │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                              │                                       │
│                              ▼                                       │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │              PHASE 2: EXECUTION PHASE                        │   │
│   │                 (Code Execution)                             │   │
│   │                                                              │   │
│   │   • Assign actual values to variables                        │   │
│   │   • Execute code line by line                                │   │
│   │   • Function calls create new execution contexts             │   │
│   │   • Returns control to calling context when done             │   │
│   │                                                              │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                              │                                       │
│                              ▼                                       │
│                    Context destroyed                                 │
│               (unless closure keeps it alive)                        │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Example: Phases in Action

```javascript
var name = "Global";

function greet(person) {
  var greeting = "Hello";
  console.log(greeting + ", " + person);
}

greet("Alice");
```

**Global Execution Context:**

```
┌─────────────────────────────────────────────────────────────────┐
│           GLOBAL EXECUTION CONTEXT                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   CREATION PHASE:                                                │
│   ┌────────────────────────────────────────────────────────────┐│
│   │  Variable Object:                                          ││
│   │    name: undefined                                         ││
│   │    greet: function greet(person) { ... }                   ││
│   │                                                            ││
│   │  Scope Chain: [Global VO]                                  ││
│   │  this: window (browser) / global (Node.js)                 ││
│   └────────────────────────────────────────────────────────────┘│
│                                                                  │
│   EXECUTION PHASE:                                               │
│   ┌────────────────────────────────────────────────────────────┐│
│   │  Line 1: name = "Global"                                   ││
│   │  Line 8: greet("Alice") → Creates new FEC                  ││
│   └────────────────────────────────────────────────────────────┘│
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Function Execution Context (greet):**

```
┌─────────────────────────────────────────────────────────────────┐
│           FUNCTION EXECUTION CONTEXT: greet("Alice")             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   CREATION PHASE:                                                │
│   ┌────────────────────────────────────────────────────────────┐│
│   │  Variable Object:                                          ││
│   │    arguments: { 0: "Alice", length: 1 }                    ││
│   │    person: "Alice"                                         ││
│   │    greeting: undefined                                     ││
│   │                                                            ││
│   │  Scope Chain: [greet VO] → [Global VO]                     ││
│   │  this: window (non-strict) / undefined (strict)            ││
│   └────────────────────────────────────────────────────────────┘│
│                                                                  │
│   EXECUTION PHASE:                                               │
│   ┌────────────────────────────────────────────────────────────┐│
│   │  Line 4: greeting = "Hello"                                ││
│   │  Line 5: console.log("Hello, Alice")                       ││
│   └────────────────────────────────────────────────────────────┘│
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## The Call Stack

The **Call Stack** is a LIFO (Last In, First Out) data structure that keeps track of execution contexts.

### How It Works

```javascript
function first() {
  console.log("First function");
  second();
  console.log("Back to first");
}

function second() {
  console.log("Second function");
  third();
  console.log("Back to second");
}

function third() {
  console.log("Third function");
}

first();
```

### Stack Visualization

```
Step 1: Script starts              Step 2: first() called
┌─────────────────────┐            ┌─────────────────────┐
│                     │            │                     │
│                     │            │                     │
│                     │            │      first()        │
│   Global Context    │            │   Global Context    │
└─────────────────────┘            └─────────────────────┘

Step 3: second() called            Step 4: third() called
┌─────────────────────┐            ┌─────────────────────┐
│                     │            │      third()        │
│     second()        │            │     second()        │
│      first()        │            │      first()        │
│   Global Context    │            │   Global Context    │
└─────────────────────┘            └─────────────────────┘

Step 5: third() returns            Step 6: second() returns
┌─────────────────────┐            ┌─────────────────────┐
│                     │            │                     │
│     second()        │            │                     │
│      first()        │            │      first()        │
│   Global Context    │            │   Global Context    │
└─────────────────────┘            └─────────────────────┘

Step 7: first() returns            Step 8: Script ends
┌─────────────────────┐            ┌─────────────────────┐
│                     │            │                     │
│                     │            │                     │
│                     │            │                     │
│   Global Context    │            │       (empty)       │
└─────────────────────┘            └─────────────────────┘
```

**Output:**
```
First function
Second function
Third function
Back to second
Back to first
```

### Stack Overflow

```javascript
// ❌ Infinite recursion causes stack overflow
function overflow() {
  overflow();  // No base case!
}

overflow();  // RangeError: Maximum call stack size exceeded
```

```
┌─────────────────────┐
│    overflow()       │  ← Stack keeps growing
│    overflow()       │
│    overflow()       │
│    overflow()       │
│       ...           │
│    overflow()       │  ← Until limit reached
│   Global Context    │
└─────────────────────┘
       💥 OVERFLOW!
```

---

## Variable Environment & Hoisting

**Hoisting** is the result of the Creation Phase. During this phase, declarations are "moved" to the top of their scope.

### var Hoisting

```javascript
console.log(x);  // undefined (not ReferenceError!)
var x = 5;
console.log(x);  // 5
```

**What JavaScript sees:**
```javascript
// Creation Phase
var x;  // Declaration hoisted, initialized to undefined

// Execution Phase
console.log(x);  // undefined
x = 5;           // Assignment happens here
console.log(x);  // 5
```

### Function Declaration Hoisting

Function declarations are **fully hoisted** (both declaration and definition):

```javascript
sayHello();  // Works! "Hello!"

function sayHello() {
  console.log("Hello!");
}
```

**What JavaScript sees:**
```javascript
// Creation Phase
function sayHello() {  // Entire function is hoisted
  console.log("Hello!");
}

// Execution Phase
sayHello();  // "Hello!"
```

### Function Expression Hoisting

Function expressions behave like variables:

```javascript
sayHello();  // TypeError: sayHello is not a function

var sayHello = function() {
  console.log("Hello!");
};
```

**What JavaScript sees:**
```javascript
// Creation Phase
var sayHello;  // Only declaration hoisted (undefined)

// Execution Phase
sayHello();  // TypeError! undefined is not a function
sayHello = function() { console.log("Hello!"); };
```

### let and const: Temporal Dead Zone (TDZ)

`let` and `const` are hoisted but **not initialized**. Accessing them before declaration causes a `ReferenceError`:

```javascript
console.log(x);  // ReferenceError: Cannot access 'x' before initialization
let x = 5;
```

```
┌─────────────────────────────────────────────────────────────────┐
│                 TEMPORAL DEAD ZONE (TDZ)                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   {                                                              │
│     // TDZ for 'x' starts here (beginning of block)             │
│     //                                                          │
│     // ┌──────────────────────────────────────────────┐         │
│     // │          TEMPORAL DEAD ZONE                  │         │
│     // │                                              │         │
│     // │   console.log(x);  // ReferenceError!       │         │
│     // │   x = 10;          // ReferenceError!       │         │
│     // │                                              │         │
│     // └──────────────────────────────────────────────┘         │
│     //                                                          │
│     let x = 5;  // TDZ ends here, 'x' is initialized            │
│     console.log(x);  // 5 - Works fine!                         │
│   }                                                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Hoisting Summary Table

| Declaration Type | Hoisted? | Initialized To | TDZ? |
|-----------------|----------|----------------|------|
| `var` | ✅ Yes | `undefined` | ❌ No |
| `let` | ✅ Yes | Not initialized | ✅ Yes |
| `const` | ✅ Yes | Not initialized | ✅ Yes |
| `function declaration` | ✅ Yes | Entire function | ❌ No |
| `function expression` | Depends on var/let/const | Same as variable | Same as variable |
| `class` | ✅ Yes | Not initialized | ✅ Yes |

### Example: Complex Hoisting

```javascript
console.log(a);        // undefined
console.log(b);        // ReferenceError: Cannot access 'b' before initialization
console.log(c);        // ReferenceError: c is not defined
console.log(foo);      // [Function: foo]
console.log(bar);      // undefined

var a = 1;
let b = 2;
// c is never declared

function foo() {
  return "I'm hoisted!";
}

var bar = function() {
  return "I'm not fully hoisted!";
};
```

---

## Scope Chain

The **Scope Chain** is how JavaScript resolves variable names. When a variable is accessed, JavaScript looks for it in:

1. Current execution context's Variable Environment
2. Parent execution context's Variable Environment
3. Continue up the chain until Global context
4. If not found → `ReferenceError`

### How Scope Chain is Created

The scope chain is determined by **where a function is written** (lexical scoping), not where it's called.

```javascript
var globalVar = "global";

function outer() {
  var outerVar = "outer";
  
  function inner() {
    var innerVar = "inner";
    
    console.log(innerVar);   // "inner" - found in current scope
    console.log(outerVar);   // "outer" - found in parent scope
    console.log(globalVar);  // "global" - found in global scope
  }
  
  inner();
}

outer();
```

### Scope Chain Visualization

```
┌─────────────────────────────────────────────────────────────────────┐
│                       SCOPE CHAIN                                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │              INNER FUNCTION SCOPE                            │   │
│   │                                                              │   │
│   │   Variables: innerVar = "inner"                              │   │
│   │                                                              │   │
│   │   Looking for 'innerVar'?  ✅ Found here!                    │   │
│   │   Looking for 'outerVar'?  ❌ Not here, look up...          │   │
│   │                        │                                     │   │
│   └────────────────────────┼────────────────────────────────────┘   │
│                            │                                         │
│                            ▼                                         │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │              OUTER FUNCTION SCOPE                            │   │
│   │                                                              │   │
│   │   Variables: outerVar = "outer"                              │   │
│   │              inner = function                                │   │
│   │                                                              │   │
│   │   Looking for 'outerVar'?  ✅ Found here!                    │   │
│   │   Looking for 'globalVar'? ❌ Not here, look up...          │   │
│   │                        │                                     │   │
│   └────────────────────────┼────────────────────────────────────┘   │
│                            │                                         │
│                            ▼                                         │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │                 GLOBAL SCOPE                                 │   │
│   │                                                              │   │
│   │   Variables: globalVar = "global"                            │   │
│   │              outer = function                                │   │
│   │                                                              │   │
│   │   Looking for 'globalVar'?  ✅ Found here!                   │   │
│   │   Looking for 'unknown'?    ❌ ReferenceError!              │   │
│   │                                                              │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Lexical Scope vs Dynamic Scope

JavaScript uses **lexical (static) scoping** - scope is determined at write time, not call time:

```javascript
var x = 10;

function foo() {
  console.log(x);  // What will this print?
}

function bar() {
  var x = 20;
  foo();  // foo's scope was determined when it was WRITTEN, not here
}

bar();  // Prints: 10 (not 20!)
```

**Why 10?** `foo` was defined in the global scope, so its scope chain is:
`[foo's scope] → [global scope]`

Even though `foo` is called from `bar`, it doesn't have access to `bar`'s variables.

---

## The `this` Keyword

`this` is determined during the Creation Phase based on **how the function is called**.

### Rules for `this` Binding

```
┌─────────────────────────────────────────────────────────────────────┐
│                    'this' BINDING RULES                              │
│                   (Priority: 1 = Highest)                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   1. NEW BINDING                                                     │
│   ┌────────────────────────────────────────────────────────────────┐│
│   │  const obj = new Constructor()                                 ││
│   │  this = newly created object                                   ││
│   └────────────────────────────────────────────────────────────────┘│
│                                                                      │
│   2. EXPLICIT BINDING                                                │
│   ┌────────────────────────────────────────────────────────────────┐│
│   │  func.call(obj), func.apply(obj), func.bind(obj)              ││
│   │  this = obj (the first argument)                               ││
│   └────────────────────────────────────────────────────────────────┘│
│                                                                      │
│   3. IMPLICIT BINDING                                                │
│   ┌────────────────────────────────────────────────────────────────┐│
│   │  obj.method()                                                  ││
│   │  this = obj (the object before the dot)                        ││
│   └────────────────────────────────────────────────────────────────┘│
│                                                                      │
│   4. DEFAULT BINDING                                                 │
│   ┌────────────────────────────────────────────────────────────────┐│
│   │  func()  (standalone function call)                            ││
│   │  this = window (non-strict) / undefined (strict)               ││
│   └────────────────────────────────────────────────────────────────┘│
│                                                                      │
│   5. ARROW FUNCTIONS (Special Case)                                  │
│   ┌────────────────────────────────────────────────────────────────┐│
│   │  const arrow = () => { ... }                                   ││
│   │  this = lexically inherited from enclosing scope               ││
│   │  Cannot be changed with call/apply/bind!                       ││
│   └────────────────────────────────────────────────────────────────┘│
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Rule 1: New Binding

```javascript
function Person(name) {
  // this = {} (new empty object)
  this.name = name;
  // return this (implicit)
}

const john = new Person("John");
console.log(john.name);  // "John"
```

### Rule 2: Explicit Binding

```javascript
function greet() {
  console.log(`Hello, ${this.name}`);
}

const person = { name: "Alice" };

greet.call(person);   // "Hello, Alice"
greet.apply(person);  // "Hello, Alice"

const boundGreet = greet.bind(person);
boundGreet();         // "Hello, Alice"
```

**Difference between call, apply, bind:**

```javascript
function introduce(greeting, punctuation) {
  console.log(`${greeting}, I'm ${this.name}${punctuation}`);
}

const user = { name: "Bob" };

// call - arguments passed individually
introduce.call(user, "Hi", "!");        // "Hi, I'm Bob!"

// apply - arguments passed as array
introduce.apply(user, ["Hey", "!!"]);   // "Hey, I'm Bob!!"

// bind - returns new function, doesn't execute immediately
const boundIntro = introduce.bind(user, "Hello");
boundIntro(".");                         // "Hello, I'm Bob."
```

### Rule 3: Implicit Binding

```javascript
const obj = {
  name: "Object",
  greet: function() {
    console.log(`Hello from ${this.name}`);
  }
};

obj.greet();  // "Hello from Object"
// 'this' = obj (what's left of the dot)
```

**⚠️ Losing Implicit Binding:**

```javascript
const obj = {
  name: "Object",
  greet: function() {
    console.log(`Hello from ${this.name}`);
  }
};

const greetFunc = obj.greet;  // Extracting the method
greetFunc();  // "Hello from undefined" (or window.name in browser)
// 'this' is lost! It's now a standalone call (default binding)
```

### Rule 4: Default Binding

```javascript
function showThis() {
  console.log(this);
}

showThis();  // window (non-strict) / undefined (strict mode)
```

### Rule 5: Arrow Functions

Arrow functions **don't have their own `this`**. They inherit `this` from their enclosing scope:

```javascript
const obj = {
  name: "Object",
  
  regularFunc: function() {
    console.log("Regular:", this.name);
  },
  
  arrowFunc: () => {
    console.log("Arrow:", this.name);
  },
  
  nestedExample: function() {
    // Regular function inside method
    const inner = function() {
      console.log("Inner regular:", this.name);  // undefined
    };
    
    // Arrow function inside method
    const innerArrow = () => {
      console.log("Inner arrow:", this.name);    // "Object"
    };
    
    inner();
    innerArrow();
  }
};

obj.regularFunc();    // "Regular: Object"
obj.arrowFunc();      // "Arrow: undefined" (inherits from global!)
obj.nestedExample();  
// "Inner regular: undefined"
// "Inner arrow: Object"
```

### this Binding Summary Table

| Call Style | `this` Value | Example |
|------------|--------------|---------|
| `new func()` | New object | `new Person()` |
| `func.call(obj)` | obj | `greet.call(user)` |
| `func.apply(obj)` | obj | `greet.apply(user)` |
| `func.bind(obj)()` | obj | `greet.bind(user)()` |
| `obj.func()` | obj | `user.greet()` |
| `func()` | window/undefined | `greet()` |
| `() => {}` | Lexical | Inherited from parent |

---

## Lexical Environment

The **Lexical Environment** is the internal structure that holds:
1. **Environment Record** - Stores variables and functions
2. **Outer Reference** - Link to parent lexical environment

```
┌─────────────────────────────────────────────────────────────────────┐
│                    LEXICAL ENVIRONMENT                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │              ENVIRONMENT RECORD                              │   │
│   │                                                              │   │
│   │   Declarative Environment Record (for functions/blocks):     │   │
│   │   • Variables (let, const, var)                              │   │
│   │   • Functions                                                │   │
│   │   • Arguments                                                │   │
│   │                                                              │   │
│   │   Object Environment Record (for global/with):               │   │
│   │   • Properties of global object                              │   │
│   │                                                              │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │              OUTER REFERENCE                                 │   │
│   │                                                              │   │
│   │   • Points to parent lexical environment                     │   │
│   │   • null for global environment                              │   │
│   │   • Forms the scope chain                                    │   │
│   │                                                              │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Block Scoping with let/const

#### What is Block Scope?

A **block** is any code between curly braces `{ }`. This includes:
- `if` statements
- `for` / `while` loops
- `switch` statements
- Plain blocks `{ }`

**Block scope** means a variable is only accessible within the block where it's declared.

#### The Fundamental Difference

```
┌─────────────────────────────────────────────────────────────────────┐
│                    var vs let/const SCOPING                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   var → FUNCTION SCOPED                                              │
│   ┌────────────────────────────────────────────────────────────────┐│
│   │  • Scoped to the nearest FUNCTION (or global if none)         ││
│   │  • Ignores block boundaries (if, for, while, etc.)            ││
│   │  • Hoisted to function top, initialized as undefined          ││
│   │  • Can be re-declared in same scope                           ││
│   └────────────────────────────────────────────────────────────────┘│
│                                                                      │
│   let/const → BLOCK SCOPED                                           │
│   ┌────────────────────────────────────────────────────────────────┐│
│   │  • Scoped to the nearest BLOCK { }                             ││
│   │  • Respects all block boundaries                               ││
│   │  • Hoisted but NOT initialized (Temporal Dead Zone)            ││
│   │  • Cannot be re-declared in same scope                         ││
│   └────────────────────────────────────────────────────────────────┘│
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

#### Example 1: Basic Block Scoping

```javascript
// GLOBAL SCOPE
var a = 1;
let b = 2;
const c = 3;

if (true) {
  // BLOCK SCOPE (if block)
  var a = 10;    // ⚠️ OVERWRITES global 'a' (same variable!)
  let b = 20;    // ✅ NEW variable, shadows global 'b'
  const c = 30;  // ✅ NEW variable, shadows global 'c'
  let d = 40;    // ✅ Only exists in this block
  
  console.log(a, b, c, d);  // 10, 20, 30, 40
}

console.log(a);  // 10 ← var was modified!
console.log(b);  // 2  ← let was NOT modified (different variable)
console.log(c);  // 3  ← const was NOT modified (different variable)
// console.log(d);  // ❌ ReferenceError: d is not defined
```

**Visual Breakdown:**

```
┌─────────────────────────────────────────────────────────────────────┐
│  GLOBAL SCOPE                                                        │
│                                                                      │
│    var a ─────────────────────────────────────────┐                 │
│    let b                                          │                 │
│    const c                                        │                 │
│                                                   │                 │
│    ┌──────────────────────────────────────────────┼───────────────┐ │
│    │  IF BLOCK SCOPE                              │               │ │
│    │                                              ▼               │ │
│    │    var a = 10  ──────────────────────▶  SAME VARIABLE       │ │
│    │                                         (overwrites!)        │ │
│    │                                                              │ │
│    │    let b = 20  ──────────────────────▶  NEW VARIABLE        │ │
│    │                                         (shadows global b)   │ │
│    │                                                              │ │
│    │    const c = 30 ─────────────────────▶  NEW VARIABLE        │ │
│    │                                         (shadows global c)   │ │
│    │                                                              │ │
│    │    let d = 40  ──────────────────────▶  BLOCK-ONLY          │ │
│    │                                         (dies with block)    │ │
│    └──────────────────────────────────────────────────────────────┘ │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

#### Example 2: Loop Scoping (The Classic Problem)

```javascript
// ❌ Problem with var in loops
for (var i = 0; i < 3; i++) {
  setTimeout(() => {
    console.log("var i:", i);
  }, 100);
}
// Output: 3, 3, 3 (all same value!)

// ✅ Solution with let in loops
for (let j = 0; j < 3; j++) {
  setTimeout(() => {
    console.log("let j:", j);
  }, 100);
}
// Output: 0, 1, 2 (each iteration has its own j!)
```

**Why does this happen?**

```
┌─────────────────────────────────────────────────────────────────────┐
│  WITH var (FUNCTION SCOPED)                                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  SINGLE 'i' variable in function scope                        │  │
│  │                                                                │  │
│  │    i = 0 → i = 1 → i = 2 → i = 3 (loop ends)                  │  │
│  │    ▲         ▲         ▲                                       │  │
│  │    │         │         │                                       │  │
│  │  callback  callback  callback                                  │  │
│  │    │         │         │                                       │  │
│  │    └─────────┴─────────┴──────▶ All see i = 3 when they run   │  │
│  │                                                                │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  WITH let (BLOCK SCOPED)                                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐     │
│  │ Iteration 1      │ │ Iteration 2      │ │ Iteration 3      │     │
│  │                  │ │                  │ │                  │     │
│  │  j = 0           │ │  j = 1           │ │  j = 2           │     │
│  │    │             │ │    │             │ │    │             │     │
│  │  callback ───────│─│────│─────────────│─│────│─────────────│     │
│  │  sees j = 0      │ │  sees j = 1      │ │  sees j = 2      │     │
│  │                  │ │                  │ │                  │     │
│  └──────────────────┘ └──────────────────┘ └──────────────────┘     │
│                                                                      │
│  Each iteration creates a NEW binding for 'j'!                       │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

#### Example 3: Nested Blocks

```javascript
let x = 'global';

function outer() {
  let x = 'outer';
  
  if (true) {
    let x = 'if-block';
    
    {
      let x = 'plain-block';
      console.log(x);  // "plain-block"
    }
    
    console.log(x);  // "if-block"
  }
  
  console.log(x);  // "outer"
}

outer();
console.log(x);  // "global"
```

**Scope Chain:**

```
┌─────────────────────────────────────────────────────────────────────┐
│  GLOBAL: x = 'global'                                                │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  FUNCTION outer(): x = 'outer'                                 │  │
│  │  ┌─────────────────────────────────────────────────────────┐  │  │
│  │  │  IF BLOCK: x = 'if-block'                                │  │  │
│  │  │  ┌───────────────────────────────────────────────────┐  │  │  │
│  │  │  │  PLAIN BLOCK: x = 'plain-block'                    │  │  │  │
│  │  │  │                                                    │  │  │  │
│  │  │  │  console.log(x) → 'plain-block' (found here!)      │  │  │  │
│  │  │  └───────────────────────────────────────────────────┘  │  │  │
│  │  │                                                          │  │  │
│  │  │  console.log(x) → 'if-block' (found here!)               │  │  │
│  │  └─────────────────────────────────────────────────────────┘  │  │
│  │                                                                │  │
│  │  console.log(x) → 'outer' (found here!)                        │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  console.log(x) → 'global' (found here!)                             │
└─────────────────────────────────────────────────────────────────────┘
```

#### Example 4: Temporal Dead Zone (TDZ) in Detail

```javascript
// This is the TDZ for 'x' - accessing 'x' here throws ReferenceError
console.log(x);  // ❌ ReferenceError: Cannot access 'x' before initialization

let x = 5;  // TDZ ends here

console.log(x);  // ✅ 5
```

**TDZ exists even within the same block:**

```javascript
{
  // TDZ starts at block beginning
  
  console.log(typeof undeclared);  // ✅ "undefined" (no error for typeof)
  console.log(typeof x);           // ❌ ReferenceError! (TDZ applies even to typeof)
  
  let x = 10;  // TDZ ends
}
```

**TDZ Visualization:**

```
┌─────────────────────────────────────────────────────────────────────┐
│                    TEMPORAL DEAD ZONE                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   {                                                                  │
│     // ══════════════════════════════════════════════════════════   │
│     // ║           TEMPORAL DEAD ZONE FOR 'x'                   ║   │
│     // ║                                                        ║   │
│     // ║   x exists (hoisted) but is UNINITIALIZED              ║   │
│     // ║   Any access to x throws ReferenceError                ║   │
│     // ║                                                        ║   │
│     // ║   x = 5;           // ❌ ReferenceError                ║   │
│     // ║   console.log(x);  // ❌ ReferenceError                ║   │
│     // ║   if (x) {}        // ❌ ReferenceError                ║   │
│     // ║                                                        ║   │
│     // ══════════════════════════════════════════════════════════   │
│                                                                      │
│     let x = 10;  // ← TDZ ENDS HERE (x is now initialized)           │
│                                                                      │
│     // ══════════════════════════════════════════════════════════   │
│     // ║           SAFE ZONE - x is accessible                  ║   │
│     // ║                                                        ║   │
│     // ║   console.log(x);  // ✅ 10                            ║   │
│     // ║   x = 20;          // ✅ Works (for let, not const)    ║   │
│     // ║                                                        ║   │
│     // ══════════════════════════════════════════════════════════   │
│   }                                                                  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

#### Example 5: const Specifics

```javascript
const obj = { name: 'John' };

// ❌ Cannot reassign
obj = { name: 'Jane' };  // TypeError: Assignment to constant variable

// ✅ CAN mutate the object
obj.name = 'Jane';       // Works!
obj.age = 30;            // Works!

// const means: the BINDING is constant, not the VALUE
```

```
┌─────────────────────────────────────────────────────────────────────┐
│  const obj = { name: 'John' }                                        │
│                                                                      │
│                                                                      │
│   STACK                           HEAP                               │
│  ┌──────────┐                    ┌─────────────────────────┐        │
│  │          │                    │  { name: 'John' }       │        │
│  │   obj ───│────────────────────│──▶                      │        │
│  │    🔒    │    LOCKED BINDING  │  (can be mutated!)      │        │
│  │          │    (cannot change) │                         │        │
│  └──────────┘                    └─────────────────────────┘        │
│                                                                      │
│  obj = newValue  ❌ ERROR (trying to change the binding)             │
│  obj.prop = x    ✅ OK (mutating the object in heap)                 │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

#### Lexical Environment Structure

```javascript
var x = 1;
let y = 2;

if (true) {
  var x = 10;   // Same variable (function-scoped)
  let y = 20;   // Different variable (block-scoped)
  let z = 30;   // Only exists in this block
  
  console.log(x, y, z);  // 10, 20, 30
}

console.log(x);  // 10 (changed!)
console.log(y);  // 2 (unchanged, different variable)
// console.log(z);  // ReferenceError: z is not defined
```

```
Global Lexical Environment
┌────────────────────────────────────────────┐
│  Environment Record:                        │
│    x: 10 (var - modified by block)         │
│    y: 2 (let)                              │
│  Outer: null                               │
└────────────────────────────────────────────┘
              ▲
              │
Block Lexical Environment (if block)
┌────────────────────────────────────────────┐
│  Environment Record:                        │
│    y: 20 (separate from global y)          │
│    z: 30                                   │
│  Outer: → Global Lexical Environment       │
└────────────────────────────────────────────┘
```

#### Block Scoping Summary Table

| Feature | `var` | `let` | `const` |
|---------|-------|-------|---------|
| **Scope** | Function | Block | Block |
| **Hoisted** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Initialized on hoist** | `undefined` | ❌ No (TDZ) | ❌ No (TDZ) |
| **Re-declarable** | ✅ Yes | ❌ No | ❌ No |
| **Reassignable** | ✅ Yes | ✅ Yes | ❌ No |
| **Creates global property** | ✅ Yes | ❌ No | ❌ No |

```javascript
// Global property example
var globalVar = 1;
let globalLet = 2;

console.log(window.globalVar);  // 1 (in browser)
console.log(window.globalLet);  // undefined (not on window!)
```

#### Best Practices

```javascript
// ✅ Use const by default
const PI = 3.14159;
const config = { debug: true };

// ✅ Use let when you need to reassign
let counter = 0;
counter++;

// ❌ Avoid var in modern code
// var has confusing scoping behavior
```

---

## Closures & Execution Context

A **closure** is created when a function "remembers" its lexical scope even after the outer function has returned.

### How Closures Work

```javascript
function outer() {
  let count = 0;  // This variable is "closed over"
  
  function inner() {
    count++;
    console.log(count);
  }
  
  return inner;
}

const counter = outer();  // outer() returns inner function
counter();  // 1
counter();  // 2
counter();  // 3
```

**What happens:**

```
Step 1: outer() is called
┌─────────────────────────────────────────────────────────────────┐
│  outer's Execution Context                                       │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Lexical Environment:                                      │  │
│  │    count: 0                                                │  │
│  │    inner: function                                         │  │
│  │  Outer: Global                                             │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘

Step 2: outer() returns, but inner maintains a CLOSURE
┌─────────────────────────────────────────────────────────────────┐
│  inner function (stored in 'counter' variable)                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  [[Environment]] → outer's Lexical Environment            │  │
│  │                    (kept alive by closure!)               │  │
│  │                                                            │  │
│  │    count: 0 ──────────────────────────────────────────┐   │  │
│  │                                                        │   │  │
│  └────────────────────────────────────────────────────────┼──┘  │
│                                                           │      │
│  Even though outer() has returned, its lexical            │      │
│  environment is preserved because inner references it!    │      │
└───────────────────────────────────────────────────────────┼──────┘
                                                            │
Step 3: counter() is called                                 │
┌───────────────────────────────────────────────────────────┼──────┐
│  inner's Execution Context                                │      │
│  ┌────────────────────────────────────────────────────────┼───┐  │
│  │  Lexical Environment:                                  │   │  │
│  │    (no local variables)                                │   │  │
│  │  Outer: → outer's Lexical Environment ─────────────────┘   │  │
│  │           count: 1 (incremented)                           │  │
│  └────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Closure Practical Example: Private Variables

```javascript
function createBankAccount(initialBalance) {
  let balance = initialBalance;  // Private variable
  
  return {
    deposit: function(amount) {
      balance += amount;
      console.log(`Deposited: $${amount}. Balance: $${balance}`);
    },
    withdraw: function(amount) {
      if (amount <= balance) {
        balance -= amount;
        console.log(`Withdrew: $${amount}. Balance: $${balance}`);
      } else {
        console.log("Insufficient funds!");
      }
    },
    getBalance: function() {
      return balance;
    }
  };
}

const account = createBankAccount(100);
account.deposit(50);    // "Deposited: $50. Balance: $150"
account.withdraw(30);   // "Withdrew: $30. Balance: $120"
console.log(account.getBalance());  // 120
console.log(account.balance);       // undefined (private!)
```

### Common Closure Gotcha: Loop Variables

```javascript
// ❌ Common mistake
for (var i = 0; i < 3; i++) {
  setTimeout(() => {
    console.log(i);  // Prints: 3, 3, 3
  }, 100);
}

// Why? All callbacks share the same 'i' (var is function-scoped)
// By the time callbacks run, loop has finished and i = 3
```

**Solutions:**

```javascript
// ✅ Solution 1: Use let (block-scoped)
for (let i = 0; i < 3; i++) {
  setTimeout(() => {
    console.log(i);  // Prints: 0, 1, 2
  }, 100);
}

// ✅ Solution 2: Create a new scope with IIFE
for (var i = 0; i < 3; i++) {
  (function(j) {
    setTimeout(() => {
      console.log(j);  // Prints: 0, 1, 2
    }, 100);
  })(i);
}

// ✅ Solution 3: Use bind
for (var i = 0; i < 3; i++) {
  setTimeout(function(j) {
    console.log(j);  // Prints: 0, 1, 2
  }.bind(null, i), 100);
}
```

---

## Practical Examples

### Example 1: Complete Execution Flow

```javascript
var a = 10;
var b = 20;

function add(x, y) {
  var result = x + y;
  return result;
}

function multiply(x, y) {
  var result = x * y;
  return result;
}

var sum = add(a, b);
var product = multiply(a, b);

console.log(sum);      // 30
console.log(product);  // 200
```

**Detailed Execution:**

```
┌─────────────────────────────────────────────────────────────────────┐
│                    EXECUTION FLOW                                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   1. GLOBAL CONTEXT - CREATION PHASE                                 │
│   ┌────────────────────────────────────────────────────────────────┐│
│   │  Variable Object:                                              ││
│   │    a: undefined                                                ││
│   │    b: undefined                                                ││
│   │    add: function add(x, y) { ... }                             ││
│   │    multiply: function multiply(x, y) { ... }                   ││
│   │    sum: undefined                                              ││
│   │    product: undefined                                          ││
│   │                                                                ││
│   │  Scope Chain: [Global]                                         ││
│   │  this: window                                                  ││
│   └────────────────────────────────────────────────────────────────┘│
│                                                                      │
│   2. GLOBAL CONTEXT - EXECUTION PHASE                                │
│   ┌────────────────────────────────────────────────────────────────┐│
│   │  Line 1: a = 10                                                ││
│   │  Line 2: b = 20                                                ││
│   │  Line 3-6: add function (already hoisted)                      ││
│   │  Line 8-11: multiply function (already hoisted)                ││
│   │  Line 13: sum = add(a, b) → Creates new FEC                    ││
│   └────────────────────────────────────────────────────────────────┘│
│                                                                      │
│   3. add() CONTEXT - CREATION PHASE                                  │
│   ┌────────────────────────────────────────────────────────────────┐│
│   │  Variable Object:                                              ││
│   │    arguments: { 0: 10, 1: 20, length: 2 }                      ││
│   │    x: 10                                                       ││
│   │    y: 20                                                       ││
│   │    result: undefined                                           ││
│   │                                                                ││
│   │  Scope Chain: [add] → [Global]                                 ││
│   │  this: window                                                  ││
│   └────────────────────────────────────────────────────────────────┘│
│                                                                      │
│   4. add() CONTEXT - EXECUTION PHASE                                 │
│   ┌────────────────────────────────────────────────────────────────┐│
│   │  result = 10 + 20 = 30                                         ││
│   │  return 30                                                     ││
│   │  Context destroyed, return to Global                           ││
│   └────────────────────────────────────────────────────────────────┘│
│                                                                      │
│   5. BACK TO GLOBAL - Continue Execution                             │
│   ┌────────────────────────────────────────────────────────────────┐│
│   │  sum = 30                                                      ││
│   │  Line 14: product = multiply(a, b) → Creates new FEC           ││
│   └────────────────────────────────────────────────────────────────┘│
│                                                                      │
│   6. multiply() - Same process as add()                              │
│   ┌────────────────────────────────────────────────────────────────┐│
│   │  result = 10 * 20 = 200                                        ││
│   │  return 200                                                    ││
│   └────────────────────────────────────────────────────────────────┘│
│                                                                      │
│   7. BACK TO GLOBAL - Final Execution                                │
│   ┌────────────────────────────────────────────────────────────────┐│
│   │  product = 200                                                 ││
│   │  console.log(sum) → 30                                         ││
│   │  console.log(product) → 200                                    ││
│   │  Script ends, Global context destroyed                         ││
│   └────────────────────────────────────────────────────────────────┘│
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Example 2: Nested Functions and Scope

```javascript
var global = "I'm global";

function outer() {
  var outerVar = "I'm outer";
  
  function middle() {
    var middleVar = "I'm middle";
    
    function inner() {
      var innerVar = "I'm inner";
      
      console.log(innerVar);   // "I'm inner"
      console.log(middleVar);  // "I'm middle"
      console.log(outerVar);   // "I'm outer"
      console.log(global);     // "I'm global"
    }
    
    inner();
  }
  
  middle();
}

outer();
```

**Scope Chain Visualization:**

```
inner() scope chain:
[inner] → [middle] → [outer] → [Global]
   ↓         ↓          ↓          ↓
innerVar  middleVar  outerVar   global
```

### Example 3: this in Different Contexts

```javascript
const obj = {
  name: "MyObject",
  
  regularMethod: function() {
    console.log("Regular method:", this.name);
    
    function innerRegular() {
      console.log("Inner regular:", this.name);
    }
    
    const innerArrow = () => {
      console.log("Inner arrow:", this.name);
    };
    
    innerRegular();  // this = window/undefined
    innerArrow();    // this = obj (inherited)
  },
  
  arrowMethod: () => {
    console.log("Arrow method:", this.name);
  }
};

obj.regularMethod();
// "Regular method: MyObject"
// "Inner regular: undefined"
// "Inner arrow: MyObject"

obj.arrowMethod();
// "Arrow method: undefined"
```

---

## Interview Questions

### Q1: What's the output?

```javascript
console.log(a);
console.log(b);
var a = 1;
let b = 2;
```

<details>
<summary>Answer</summary>

```
undefined
ReferenceError: Cannot access 'b' before initialization
```

**Explanation:**
- `var a` is hoisted and initialized to `undefined`
- `let b` is hoisted but stays in Temporal Dead Zone until initialization

</details>

### Q2: What's the output?

```javascript
var x = 1;

function foo() {
  console.log(x);
  var x = 2;
  console.log(x);
}

foo();
```

<details>
<summary>Answer</summary>

```
undefined
2
```

**Explanation:**
- `var x` inside `foo` is hoisted to the top of the function
- The local `x` shadows the global `x`
- First `console.log` sees the hoisted but uninitialized local `x`
- Second `console.log` sees the assigned value

</details>

### Q3: What's the output?

```javascript
const obj = {
  name: "Object",
  getName: function() {
    return this.name;
  },
  getNameArrow: () => {
    return this.name;
  }
};

console.log(obj.getName());
console.log(obj.getNameArrow());

const getName = obj.getName;
console.log(getName());
```

<details>
<summary>Answer</summary>

```
"Object"
undefined
undefined
```

**Explanation:**
1. `obj.getName()` - Implicit binding, `this` = obj
2. `obj.getNameArrow()` - Arrow function, `this` = global (lexical)
3. `getName()` - Default binding, `this` = window/undefined

</details>

### Q4: What's the output?

```javascript
function createFunctions() {
  var result = [];
  
  for (var i = 0; i < 3; i++) {
    result.push(function() {
      return i;
    });
  }
  
  return result;
}

var funcs = createFunctions();
console.log(funcs[0]());
console.log(funcs[1]());
console.log(funcs[2]());
```

<details>
<summary>Answer</summary>

```
3
3
3
```

**Explanation:**
- `var i` is function-scoped, so all closures share the same `i`
- By the time functions are called, the loop has finished and `i = 3`

**Fix:** Use `let` instead of `var` to create a new binding per iteration

</details>

### Q5: Explain the output

```javascript
var a = 1;

function outer() {
  var a = 2;
  
  function inner() {
    console.log(a);
  }
  
  return inner;
}

var innerFunc = outer();
a = 3;
innerFunc();
```

<details>
<summary>Answer</summary>

```
2
```

**Explanation:**
- `inner` function creates a closure over `outer`'s scope
- `inner` remembers `a = 2` from its lexical environment
- Changing global `a` to 3 doesn't affect the closed-over variable
- The scope chain is determined at definition time, not call time

</details>

### Q6: What's the output?

```javascript
function foo() {
  console.log(this);
}

const obj = { foo };

foo();
obj.foo();
foo.call({ name: "explicit" });
new foo();
```

<details>
<summary>Answer</summary>

```
Window (or undefined in strict mode)
{ foo: [Function: foo] }
{ name: "explicit" }
foo {} (newly created object)
```

**Explanation:**
1. `foo()` - Default binding → global/undefined
2. `obj.foo()` - Implicit binding → obj
3. `foo.call(...)` - Explicit binding → passed object
4. `new foo()` - New binding → new instance

</details>

---

## Summary

```
┌─────────────────────────────────────────────────────────────────────┐
│                    EXECUTION CONTEXT SUMMARY                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   TYPES:                                                             │
│   • Global Execution Context (one per program)                       │
│   • Function Execution Context (one per function call)               │
│   • Eval Execution Context (avoid using)                             │
│                                                                      │
│   PHASES:                                                            │
│   1. Creation Phase                                                  │
│      • Create Variable Object (hoist declarations)                   │
│      • Create Scope Chain                                            │
│      • Determine 'this' binding                                      │
│                                                                      │
│   2. Execution Phase                                                 │
│      • Assign values to variables                                    │
│      • Execute code line by line                                     │
│                                                                      │
│   KEY CONCEPTS:                                                      │
│   • Hoisting: var → undefined, let/const → TDZ, functions → full    │
│   • Scope Chain: Lexical (where written), not dynamic (where called)│
│   • this: new > call/apply/bind > obj.method > standalone           │
│   • Closures: Functions remember their lexical environment          │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Further Reading

- [MDN: Closures](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures)
- [MDN: this](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/this)
- [JavaScript.info: Variable Scope](https://javascript.info/closure)
- [You Don't Know JS: Scope & Closures](https://github.com/getify/You-Dont-Know-JS/tree/2nd-ed/scope-closures)

