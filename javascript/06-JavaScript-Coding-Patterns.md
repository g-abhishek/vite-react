# JavaScript Coding Patterns & Problem Solving

## Table of Contents

1. [Polyfills](#polyfills)
   - [Promise](#promise-polyfill) (with lifecycle walkthrough, common mistakes)
   - [Array Methods](#array-methods-polyfills) (map/filter/reduce internals, sparse arrays)
   - [Function Methods](#function-methods-polyfills) (call/apply/bind deep dive)
   - [Object Methods](#object-methods-polyfills)
2. [Common Utility Functions](#common-utility-functions)
   - [Debounce & Throttle](#debounce--throttle) (visual timeline, leading/trailing)
   - [Deep Clone](#deep-clone) (shallow vs deep, circular refs, WeakMap)
   - [Flatten Array/Object](#flatten)
   - [Currying](#currying) (practical examples, vs partial application)
   - [Memoization](#memoization) (Fibonacci walkthrough, gotchas)
3. [Async Patterns](#async-patterns)
   - [Promise Utilities](#promise-utilities) (concurrency limit, retry, timeout)
   - [Async Flow Control](#async-flow-control) (queue, compose, pool)
4. [Data Structure Problems](#data-structure-problems)
   - LRU Cache, Event Emitter, Trie
5. [String/Array Problems](#stringarray-problems)
   - Algorithm Patterns (Two Sum, Sliding Window, Two Pointers, Kadane's)
6. [DOM Manipulation](#dom-manipulation)
   - Virtual DOM implementation
7. [Interview Coding Challenges](#interview-coding-challenges)
   - instanceof, new, JSON.stringify/parse, Observable

---

## Polyfills

### Promise Polyfill

```javascript
class MyPromise {
  constructor(executor) {
    this.state = 'pending';
    this.value = undefined;
    this.handlers = [];
    
    const resolve = (value) => {
      if (this.state !== 'pending') return;
      
      // Handle promise returned as value
      if (value instanceof MyPromise) {
        value.then(resolve, reject);
        return;
      }
      
      this.state = 'fulfilled';
      this.value = value;
      this.handlers.forEach(this.handle.bind(this));
    };
    
    const reject = (error) => {
      if (this.state !== 'pending') return;
      this.state = 'rejected';
      this.value = error;
      this.handlers.forEach(this.handle.bind(this));
    };
    
    try {
      executor(resolve, reject);
    } catch (error) {
      reject(error);
    }
  }
  
  handle(handler) {
    if (this.state === 'pending') {
      this.handlers.push(handler);
      return;
    }
    
    const callback = this.state === 'fulfilled' 
      ? handler.onFulfilled 
      : handler.onRejected;
    
    if (!callback) {
      if (this.state === 'fulfilled') {
        handler.resolve(this.value);
      } else {
        handler.reject(this.value);
      }
      return;
    }
    
    // Execute callback asynchronously
    queueMicrotask(() => {
      try {
        const result = callback(this.value);
        handler.resolve(result);
      } catch (error) {
        handler.reject(error);
      }
    });
  }
  
  then(onFulfilled, onRejected) {
    return new MyPromise((resolve, reject) => {
      this.handle({
        onFulfilled,
        onRejected,
        resolve,
        reject
      });
    });
  }
  
  catch(onRejected) {
    return this.then(null, onRejected);
  }
  
  finally(callback) {
    return this.then(
      value => MyPromise.resolve(callback()).then(() => value),
      error => MyPromise.resolve(callback()).then(() => { throw error; })
    );
  }
  
  static resolve(value) {
    if (value instanceof MyPromise) return value;
    return new MyPromise(resolve => resolve(value));
  }
  
  static reject(error) {
    return new MyPromise((_, reject) => reject(error));
  }
  
  static all(promises) {
    return new MyPromise((resolve, reject) => {
      if (!promises.length) {
        resolve([]);
        return;
      }
      
      const results = [];
      let completed = 0;
      
      promises.forEach((promise, index) => {
        MyPromise.resolve(promise)
          .then(value => {
            results[index] = value;
            completed++;
            if (completed === promises.length) {
              resolve(results);
            }
          })
          .catch(reject);
      });
    });
  }
  
  static race(promises) {
    return new MyPromise((resolve, reject) => {
      promises.forEach(promise => {
        MyPromise.resolve(promise).then(resolve, reject);
      });
    });
  }
  
  static allSettled(promises) {
    return new MyPromise((resolve) => {
      if (!promises.length) {
        resolve([]);
        return;
      }
      
      const results = [];
      let completed = 0;
      
      promises.forEach((promise, index) => {
        MyPromise.resolve(promise)
          .then(value => {
            results[index] = { status: 'fulfilled', value };
          })
          .catch(reason => {
            results[index] = { status: 'rejected', reason };
          })
          .finally(() => {
            completed++;
            if (completed === promises.length) {
              resolve(results);
            }
          });
      });
    });
  }
  
  static any(promises) {
    return new MyPromise((resolve, reject) => {
      if (!promises.length) {
        reject(new AggregateError([], 'All promises were rejected'));
        return;
      }
      
      const errors = [];
      let rejected = 0;
      
      promises.forEach((promise, index) => {
        MyPromise.resolve(promise)
          .then(resolve)
          .catch(error => {
            errors[index] = error;
            rejected++;
            if (rejected === promises.length) {
              reject(new AggregateError(errors, 'All promises were rejected'));
            }
          });
      });
    });
  }
}

// Test
const p = new MyPromise((resolve) => {
  setTimeout(() => resolve('Hello'), 100);
});
p.then(val => console.log(val));  // 'Hello'
```

### How Promise Works: Step-by-Step Walkthrough

```
┌─────────────────────────────────────────────────────────────────────┐
│          PROMISE LIFECYCLE                                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   new Promise((resolve, reject) => {                                │
│     // executor runs SYNCHRONOUSLY                                  │
│     asyncOperation((result) => resolve(result));                    │
│   });                                                               │
│                                                                      │
│   STATE MACHINE:                                                    │
│                                                                      │
│                    ┌──────────────────────────────────┐             │
│                    │          PENDING                 │             │
│                    │    state = 'pending'             │             │
│                    │    value = undefined             │             │
│                    │    handlers = []                 │             │
│                    └────────────┬─────────────────────┘             │
│                                 │                                    │
│           ┌─────────────────────┴─────────────────────┐             │
│           │                                           │             │
│      resolve(value)                              reject(error)      │
│           │                                           │             │
│           ▼                                           ▼             │
│   ┌───────────────────┐                   ┌───────────────────┐    │
│   │    FULFILLED      │                   │    REJECTED       │    │
│   │ state='fulfilled' │                   │ state='rejected'  │    │
│   │ value = result    │                   │ value = error     │    │
│   └───────────────────┘                   └───────────────────┘    │
│                                                                      │
│   ⚠️ Once resolved/rejected, state can NEVER change!               │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Tracing Through Promise Execution

```javascript
console.log('1. Start');

const promise = new Promise((resolve, reject) => {
  console.log('2. Executor (sync)');
  
  setTimeout(() => {
    console.log('4. Inside setTimeout');
    resolve('Done!');
  }, 0);
});

promise.then(value => {
  console.log('5. Then handler:', value);
});

console.log('3. End');

// Output:
// 1. Start
// 2. Executor (sync)  ← Executor runs immediately!
// 3. End
// 4. Inside setTimeout
// 5. Then handler: Done!
```

```
┌─────────────────────────────────────────────────────────────────────┐
│          PROMISE EXECUTION TRACE                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   CALL STACK              │  MICROTASK QUEUE  │  TIMER QUEUE        │
│   ─────────────────────────────────────────────────────────────     │
│                                                                      │
│   Step 1: Execute sync code                                         │
│   ┌───────────────────────┐                                         │
│   │ console.log('1')      │                                         │
│   │ new Promise(executor) │ → Executor runs NOW (sync)              │
│   │ console.log('2')      │                                         │
│   │ setTimeout(cb, 0)     │ → Adds to Timer Queue                   │
│   │ promise.then(handler) │ → Stores handler (promise pending)      │
│   │ console.log('3')      │                                         │
│   └───────────────────────┘                                         │
│                                                                      │
│   Timer Queue: [setTimeout callback]                                │
│   Promise handlers: [{onFulfilled: handler}]                        │
│                                                                      │
│   Step 2: Call stack empty → check microtasks (none)                │
│                                                                      │
│   Step 3: Timer fires                                               │
│   ┌───────────────────────┐                                         │
│   │ console.log('4')      │                                         │
│   │ resolve('Done!')      │ → Promise fulfilled!                    │
│   │                       │ → handler queued to MICROTASKS          │
│   └───────────────────────┘                                         │
│                                                                      │
│   Microtask Queue: [then handler]                                   │
│                                                                      │
│   Step 4: Process microtasks                                        │
│   ┌───────────────────────┐                                         │
│   │ console.log('5')      │                                         │
│   └───────────────────────┘                                         │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Promise Chaining Deep Dive

```javascript
// Each .then() returns a NEW promise
const p1 = Promise.resolve(1);

const p2 = p1.then(x => x + 1);   // New promise, resolves to 2
const p3 = p2.then(x => x * 2);   // New promise, resolves to 4
const p4 = p3.then(x => {
  throw new Error('Oops!');       // Rejects p4
});
const p5 = p4.catch(err => 'Recovered');  // New promise, resolves to 'Recovered'

console.log(p1 === p2);  // false - different promise objects!

// Chaining visualization:
// p1 (fulfilled: 1)
//    └──> p2 (fulfilled: 2)
//            └──> p3 (fulfilled: 4)
//                    └──> p4 (rejected: Error)
//                            └──> p5 (fulfilled: 'Recovered')
```

### Common Promise Mistakes

```javascript
// ❌ Mistake 1: Not returning in .then()
Promise.resolve(1)
  .then(x => {
    x + 1;  // No return! Next .then gets undefined
  })
  .then(x => console.log(x));  // undefined

// ✅ Fix: Always return
Promise.resolve(1)
  .then(x => x + 1)
  .then(x => console.log(x));  // 2

// ─────────────────────────────────────────────────────────────────

// ❌ Mistake 2: Nested .then() instead of chaining
fetchUser()
  .then(user => {
    fetchPosts(user.id)
      .then(posts => {
        // Callback hell returns!
      });
  });

// ✅ Fix: Return promises for flat chain
fetchUser()
  .then(user => fetchPosts(user.id))
  .then(posts => {
    // Flat and readable
  });

// ─────────────────────────────────────────────────────────────────

// ❌ Mistake 3: Swallowing errors
fetchData()
  .then(data => process(data));
// If fetchData or process throws, error is silently lost!

// ✅ Fix: Always add .catch() at the end
fetchData()
  .then(data => process(data))
  .catch(err => console.error('Error:', err));

// ─────────────────────────────────────────────────────────────────

// ❌ Mistake 4: Creating promise in a loop with race condition
const results = [];
for (let i = 0; i < 3; i++) {
  fetch(`/api/${i}`).then(data => {
    results[i] = data;  // Order not guaranteed!
  });
}

// ✅ Fix: Use Promise.all
const results = await Promise.all([
  fetch('/api/0'),
  fetch('/api/1'),
  fetch('/api/2')
]);
```

---

### Array Methods Polyfills

#### Array.prototype.map

```javascript
Array.prototype.myMap = function(callback, thisArg) {
  if (typeof callback !== 'function') {
    throw new TypeError(callback + ' is not a function');
  }
  
  const result = [];
  for (let i = 0; i < this.length; i++) {
    if (i in this) {  // Handle sparse arrays
      result[i] = callback.call(thisArg, this[i], i, this);
    }
  }
  return result;
};

// Test
[1, 2, 3].myMap(x => x * 2);  // [2, 4, 6]
```

#### Array.prototype.filter

```javascript
Array.prototype.myFilter = function(callback, thisArg) {
  if (typeof callback !== 'function') {
    throw new TypeError(callback + ' is not a function');
  }
  
  const result = [];
  for (let i = 0; i < this.length; i++) {
    if (i in this && callback.call(thisArg, this[i], i, this)) {
      result.push(this[i]);
    }
  }
  return result;
};

// Test
[1, 2, 3, 4].myFilter(x => x % 2 === 0);  // [2, 4]
```

#### Array.prototype.reduce

```javascript
Array.prototype.myReduce = function(callback, initialValue) {
  if (typeof callback !== 'function') {
    throw new TypeError(callback + ' is not a function');
  }
  
  const len = this.length;
  let accumulator;
  let startIndex;
  
  if (arguments.length >= 2) {
    accumulator = initialValue;
    startIndex = 0;
  } else {
    // No initial value: use first element
    if (len === 0) {
      throw new TypeError('Reduce of empty array with no initial value');
    }
    
    // Find first existing index (sparse array)
    let found = false;
    for (let i = 0; i < len; i++) {
      if (i in this) {
        accumulator = this[i];
        startIndex = i + 1;
        found = true;
        break;
      }
    }
    
    if (!found) {
      throw new TypeError('Reduce of empty array with no initial value');
    }
  }
  
  for (let i = startIndex; i < len; i++) {
    if (i in this) {
      accumulator = callback(accumulator, this[i], i, this);
    }
  }
  
  return accumulator;
};

// Test
[1, 2, 3, 4].myReduce((acc, curr) => acc + curr, 0);  // 10
```

#### Array.prototype.forEach

```javascript
Array.prototype.myForEach = function(callback, thisArg) {
  if (typeof callback !== 'function') {
    throw new TypeError(callback + ' is not a function');
  }
  
  for (let i = 0; i < this.length; i++) {
    if (i in this) {
      callback.call(thisArg, this[i], i, this);
    }
  }
};

// Test
[1, 2, 3].myForEach(x => console.log(x));
```

#### Array.prototype.find & findIndex

```javascript
Array.prototype.myFind = function(callback, thisArg) {
  if (typeof callback !== 'function') {
    throw new TypeError(callback + ' is not a function');
  }
  
  for (let i = 0; i < this.length; i++) {
    if (i in this && callback.call(thisArg, this[i], i, this)) {
      return this[i];
    }
  }
  return undefined;
};

Array.prototype.myFindIndex = function(callback, thisArg) {
  if (typeof callback !== 'function') {
    throw new TypeError(callback + ' is not a function');
  }
  
  for (let i = 0; i < this.length; i++) {
    if (i in this && callback.call(thisArg, this[i], i, this)) {
      return i;
    }
  }
  return -1;
};

// Test
[1, 2, 3, 4].myFind(x => x > 2);       // 3
[1, 2, 3, 4].myFindIndex(x => x > 2);  // 2
```

#### Array.prototype.some & every

```javascript
Array.prototype.mySome = function(callback, thisArg) {
  if (typeof callback !== 'function') {
    throw new TypeError(callback + ' is not a function');
  }
  
  for (let i = 0; i < this.length; i++) {
    if (i in this && callback.call(thisArg, this[i], i, this)) {
      return true;
    }
  }
  return false;
};

Array.prototype.myEvery = function(callback, thisArg) {
  if (typeof callback !== 'function') {
    throw new TypeError(callback + ' is not a function');
  }
  
  for (let i = 0; i < this.length; i++) {
    if (i in this && !callback.call(thisArg, this[i], i, this)) {
      return false;
    }
  }
  return true;
};

// Test
[1, 2, 3, 4].mySome(x => x > 3);   // true
[1, 2, 3, 4].myEvery(x => x > 0);  // true
```

#### Array.prototype.flat & flatMap

```javascript
Array.prototype.myFlat = function(depth = 1) {
  const result = [];
  
  const flatten = (arr, d) => {
    for (const item of arr) {
      if (Array.isArray(item) && d > 0) {
        flatten(item, d - 1);
      } else {
        result.push(item);
      }
    }
  };
  
  flatten(this, depth);
  return result;
};

Array.prototype.myFlatMap = function(callback, thisArg) {
  return this.myMap(callback, thisArg).myFlat(1);
};

// Test
[1, [2, [3, [4]]]].myFlat(2);  // [1, 2, 3, [4]]
[[1, 2], [3, 4]].myFlatMap(x => x.map(n => n * 2));  // [2, 4, 6, 8]
```

#### Array.prototype.includes

```javascript
Array.prototype.myIncludes = function(searchElement, fromIndex = 0) {
  const len = this.length;
  
  if (len === 0) return false;
  
  // Handle negative fromIndex
  let start = fromIndex >= 0 
    ? fromIndex 
    : Math.max(len + fromIndex, 0);
  
  for (let i = start; i < len; i++) {
    // Handle NaN
    if (Number.isNaN(searchElement) && Number.isNaN(this[i])) {
      return true;
    }
    if (this[i] === searchElement) {
      return true;
    }
  }
  
  return false;
};

// Test
[1, 2, NaN].myIncludes(NaN);  // true
[1, 2, 3].myIncludes(2, 2);   // false
```

### Understanding Array Method Polyfills

```
┌─────────────────────────────────────────────────────────────────────┐
│          ARRAY METHOD INTERNALS                                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   HOW THESE METHODS WORK ON 'this':                                 │
│                                                                      │
│   When you call: [1, 2, 3].map(fn)                                  │
│                                                                      │
│   Inside myMap:                                                     │
│   • 'this' refers to the array [1, 2, 3]                            │
│   • We iterate using for loop (not for...of for sparse arrays)     │
│   • We check 'i in this' to handle holes in sparse arrays          │
│                                                                      │
│   ─────────────────────────────────────────────────────────────────  │
│                                                                      │
│   SPARSE ARRAYS (arrays with holes):                                │
│                                                                      │
│   const sparse = [1, , , 4];  // Length 4, but only 2 elements     │
│   sparse.length;              // 4                                  │
│   0 in sparse;                // true                               │
│   1 in sparse;                // false (hole!)                      │
│   2 in sparse;                // false (hole!)                      │
│   3 in sparse;                // true                               │
│                                                                      │
│   Native map SKIPS holes:                                           │
│   sparse.map(x => x * 2);     // [2, empty × 2, 8]                 │
│                                                                      │
│   Our polyfill must do the same with 'i in this' check!            │
│                                                                      │
│   ─────────────────────────────────────────────────────────────────  │
│                                                                      │
│   thisArg PARAMETER:                                                │
│                                                                      │
│   const obj = { multiplier: 10 };                                   │
│                                                                      │
│   [1, 2].map(function(x) {                                          │
│     return x * this.multiplier;  // 'this' is obj                   │
│   }, obj);  // [10, 20]                                             │
│                                                                      │
│   ⚠️ Arrow functions ignore thisArg (they use lexical this)        │
│                                                                      │
│   ─────────────────────────────────────────────────────────────────  │
│                                                                      │
│   CALLBACK PARAMETERS:                                               │
│                                                                      │
│   [1, 2].map((element, index, array) => {                           │
│     // element: current element (1, then 2)                         │
│     // index: current index (0, then 1)                             │
│     // array: the original array [1, 2]                             │
│   });                                                               │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Reduce: The Most Powerful Array Method

```javascript
// Reduce can implement ANY other array method!

// map using reduce
function mapWithReduce(arr, fn) {
  return arr.reduce((acc, item, i, array) => {
    acc.push(fn(item, i, array));
    return acc;
  }, []);
}

// filter using reduce
function filterWithReduce(arr, fn) {
  return arr.reduce((acc, item, i, array) => {
    if (fn(item, i, array)) acc.push(item);
    return acc;
  }, []);
}

// find using reduce
function findWithReduce(arr, fn) {
  return arr.reduce((found, item, i, array) => {
    if (found !== undefined) return found;
    return fn(item, i, array) ? item : undefined;
  }, undefined);
}

// flat using reduce
function flatWithReduce(arr, depth = 1) {
  return arr.reduce((acc, item) => {
    if (Array.isArray(item) && depth > 0) {
      acc.push(...flatWithReduce(item, depth - 1));
    } else {
      acc.push(item);
    }
    return acc;
  }, []);
}
```

```
┌─────────────────────────────────────────────────────────────────────┐
│          REDUCE STEP-BY-STEP VISUALIZATION                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   [1, 2, 3, 4].reduce((acc, curr) => acc + curr, 0)                 │
│                                                                      │
│   Initial: acc = 0 (initial value)                                  │
│                                                                      │
│   Step 1: acc = 0,  curr = 1  → 0 + 1 = 1                          │
│   Step 2: acc = 1,  curr = 2  → 1 + 2 = 3                          │
│   Step 3: acc = 3,  curr = 3  → 3 + 3 = 6                          │
│   Step 4: acc = 6,  curr = 4  → 6 + 4 = 10                         │
│                                                                      │
│   Result: 10                                                        │
│                                                                      │
│   ─────────────────────────────────────────────────────────────────  │
│                                                                      │
│   [1, 2, 3].reduce((acc, curr) => acc + curr)  // No initial value │
│                                                                      │
│   When NO initial value:                                            │
│   • acc starts as first element (1)                                 │
│   • Iteration starts from index 1                                   │
│                                                                      │
│   Step 1: acc = 1,  curr = 2  → 1 + 2 = 3                          │
│   Step 2: acc = 3,  curr = 3  → 3 + 3 = 6                          │
│                                                                      │
│   Result: 6                                                         │
│                                                                      │
│   ⚠️ Empty array with no initial value throws TypeError!            │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

### Function Methods Polyfills

#### Function.prototype.bind

```javascript
Function.prototype.myBind = function(thisArg, ...boundArgs) {
  if (typeof this !== 'function') {
    throw new TypeError('Bind must be called on a function');
  }
  
  const fn = this;
  
  const boundFunction = function(...args) {
    // Handle 'new' operator
    if (new.target) {
      return new fn(...boundArgs, ...args);
    }
    return fn.apply(thisArg, [...boundArgs, ...args]);
  };
  
  // Maintain prototype chain
  if (fn.prototype) {
    boundFunction.prototype = Object.create(fn.prototype);
  }
  
  return boundFunction;
};

// Test
const obj = { x: 42 };
function getX() { return this.x; }
const boundGetX = getX.myBind(obj);
boundGetX();  // 42
```

#### Function.prototype.call

```javascript
Function.prototype.myCall = function(thisArg, ...args) {
  if (typeof this !== 'function') {
    throw new TypeError('myCall must be called on a function');
  }
  
  // Handle null/undefined
  thisArg = thisArg ?? globalThis;
  
  // Convert primitive to object
  thisArg = Object(thisArg);
  
  // Create unique property
  const fn = Symbol('fn');
  thisArg[fn] = this;
  
  const result = thisArg[fn](...args);
  delete thisArg[fn];
  
  return result;
};

// Test
function greet(greeting) {
  return `${greeting}, ${this.name}`;
}
greet.myCall({ name: 'John' }, 'Hello');  // 'Hello, John'
```

#### Function.prototype.apply

```javascript
Function.prototype.myApply = function(thisArg, argsArray = []) {
  if (typeof this !== 'function') {
    throw new TypeError('myApply must be called on a function');
  }
  
  thisArg = thisArg ?? globalThis;
  thisArg = Object(thisArg);
  
  const fn = Symbol('fn');
  thisArg[fn] = this;
  
  const result = thisArg[fn](...argsArray);
  delete thisArg[fn];
  
  return result;
};

// Test
function sum(a, b) {
  return a + b + this.c;
}
sum.myApply({ c: 10 }, [1, 2]);  // 13
```

### Understanding call, apply, bind

```
┌─────────────────────────────────────────────────────────────────────┐
│          call vs apply vs bind                                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   METHOD    │ SYNTAX                    │ EXECUTION                 │
│   ──────────┼───────────────────────────┼────────────────────────   │
│   call      │ fn.call(this, a, b, c)    │ Immediate                 │
│   apply     │ fn.apply(this, [a, b, c]) │ Immediate                 │
│   bind      │ fn.bind(this, a, b)       │ Returns new function      │
│                                                                      │
│   ─────────────────────────────────────────────────────────────────  │
│                                                                      │
│   call: "Call with this, and pass args one by one"                  │
│   apply: "Apply with this, and pass args as Array"                  │
│   bind: "Bind this permanently, optionally with some args"          │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

```javascript
// PRACTICAL EXAMPLES

const person = {
  name: 'Alice',
  greet(greeting, punctuation) {
    return `${greeting}, ${this.name}${punctuation}`;
  }
};

const anotherPerson = { name: 'Bob' };

// Using call - pass args individually
person.greet.call(anotherPerson, 'Hello', '!');
// "Hello, Bob!"

// Using apply - pass args as array
person.greet.apply(anotherPerson, ['Hi', '?']);
// "Hi, Bob?"

// Using bind - create bound function
const boundGreet = person.greet.bind(anotherPerson, 'Hey');
boundGreet('...');  // "Hey, Bob..."
// First arg was pre-bound, only need punctuation!

// ═══════════════════════════════════════════════════════════════════
// HOW BIND WORKS INTERNALLY
// ═══════════════════════════════════════════════════════════════════

Function.prototype.myBind = function(thisArg, ...boundArgs) {
  const originalFn = this;
  
  // Return a new function
  return function boundFunction(...callArgs) {
    // Combine pre-bound args with call-time args
    return originalFn.apply(thisArg, [...boundArgs, ...callArgs]);
  };
};

// Step by step:
// 1. const boundGreet = greet.bind(bob, 'Hey')
//    - originalFn = greet
//    - thisArg = bob
//    - boundArgs = ['Hey']
//    - Returns a new function
//
// 2. boundGreet('!')
//    - callArgs = ['!']
//    - Calls: greet.apply(bob, ['Hey', '!'])
//    - Result: "Hey, Bob!"
```

### Bind with Constructor Functions (The Tricky Part!)

```javascript
function Person(name, age) {
  this.name = name;
  this.age = age;
}

const BoundPerson = Person.bind({ ignored: true }, 'Alice');

// When used with 'new', the bound 'this' is IGNORED!
const p = new BoundPerson(25);
console.log(p.name);  // 'Alice' (bound arg still works)
console.log(p.age);   // 25
console.log(p instanceof Person);  // true

// Why? 'new' creates a fresh object as 'this'
// The bound thisArg is only used when NOT using 'new'

// Our polyfill handles this:
Function.prototype.myBind = function(thisArg, ...boundArgs) {
  const fn = this;
  
  const boundFunction = function(...args) {
    // Check if called with 'new'
    if (new.target) {
      // 'new' was used - ignore thisArg, use fresh object
      return new fn(...boundArgs, ...args);
    }
    // Normal call - use thisArg
    return fn.apply(thisArg, [...boundArgs, ...args]);
  };
  
  // Preserve prototype chain for instanceof
  if (fn.prototype) {
    boundFunction.prototype = Object.create(fn.prototype);
  }
  
  return boundFunction;
};
```

---

### Object Methods Polyfills

#### Object.create

```javascript
Object.myCreate = function(proto, propertiesObject) {
  if (proto !== null && typeof proto !== 'object') {
    throw new TypeError('Object prototype may only be an Object or null');
  }
  
  function F() {}
  F.prototype = proto;
  const obj = new F();
  
  if (propertiesObject !== undefined) {
    Object.defineProperties(obj, propertiesObject);
  }
  
  return obj;
};

// Test
const parent = { x: 10 };
const child = Object.myCreate(parent);
child.x;  // 10
```

#### Object.assign

```javascript
Object.myAssign = function(target, ...sources) {
  if (target == null) {
    throw new TypeError('Cannot convert undefined or null to object');
  }
  
  const to = Object(target);
  
  for (const source of sources) {
    if (source != null) {
      // Get own enumerable properties
      for (const key of Object.keys(source)) {
        to[key] = source[key];
      }
      
      // Handle Symbol properties
      for (const symbol of Object.getOwnPropertySymbols(source)) {
        if (Object.prototype.propertyIsEnumerable.call(source, symbol)) {
          to[symbol] = source[symbol];
        }
      }
    }
  }
  
  return to;
};

// Test
Object.myAssign({}, { a: 1 }, { b: 2 });  // { a: 1, b: 2 }
```

#### Object.keys / Object.values / Object.entries

```javascript
Object.myKeys = function(obj) {
  if (obj == null) {
    throw new TypeError('Cannot convert undefined or null to object');
  }
  
  const result = [];
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      result.push(key);
    }
  }
  return result;
};

Object.myValues = function(obj) {
  return Object.myKeys(obj).map(key => obj[key]);
};

Object.myEntries = function(obj) {
  return Object.myKeys(obj).map(key => [key, obj[key]]);
};

Object.myFromEntries = function(entries) {
  const result = {};
  for (const [key, value] of entries) {
    result[key] = value;
  }
  return result;
};

// Test
Object.myKeys({ a: 1, b: 2 });     // ['a', 'b']
Object.myValues({ a: 1, b: 2 });   // [1, 2]
Object.myEntries({ a: 1, b: 2 });  // [['a', 1], ['b', 2]]
Object.myFromEntries([['a', 1], ['b', 2]]);  // { a: 1, b: 2 }
```

---

## Common Utility Functions

### Debounce & Throttle

```javascript
/**
 * Debounce: Execute function after delay, reset timer on each call
 * Use case: Search input, resize handler
 */
function debounce(fn, delay, options = {}) {
  const { leading = false, trailing = true } = options;
  let timeoutId = null;
  let lastArgs = null;
  
  const debounced = function(...args) {
    lastArgs = args;
    
    const shouldCallNow = leading && !timeoutId;
    
    clearTimeout(timeoutId);
    
    timeoutId = setTimeout(() => {
      timeoutId = null;
      if (trailing && lastArgs) {
        fn.apply(this, lastArgs);
        lastArgs = null;
      }
    }, delay);
    
    if (shouldCallNow) {
      fn.apply(this, args);
    }
  };
  
  debounced.cancel = () => {
    clearTimeout(timeoutId);
    timeoutId = null;
    lastArgs = null;
  };
  
  debounced.flush = () => {
    if (timeoutId && lastArgs) {
      fn.apply(this, lastArgs);
      debounced.cancel();
    }
  };
  
  return debounced;
}

/**
 * Throttle: Execute function at most once per interval
 * Use case: Scroll handler, mouse move
 */
function throttle(fn, interval, options = {}) {
  const { leading = true, trailing = true } = options;
  let lastTime = 0;
  let timeoutId = null;
  let lastArgs = null;
  
  const throttled = function(...args) {
    const now = Date.now();
    
    if (!lastTime && !leading) {
      lastTime = now;
    }
    
    const remaining = interval - (now - lastTime);
    
    if (remaining <= 0 || remaining > interval) {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      lastTime = now;
      fn.apply(this, args);
    } else if (!timeoutId && trailing) {
      lastArgs = args;
      timeoutId = setTimeout(() => {
        lastTime = leading ? Date.now() : 0;
        timeoutId = null;
        fn.apply(this, lastArgs);
        lastArgs = null;
      }, remaining);
    }
  };
  
  throttled.cancel = () => {
    clearTimeout(timeoutId);
    timeoutId = null;
    lastTime = 0;
    lastArgs = null;
  };
  
  return throttled;
}

// Usage
const debouncedSearch = debounce(search, 300);
const throttledScroll = throttle(handleScroll, 100);
```

### Debounce vs Throttle: Visual Explanation

```
┌─────────────────────────────────────────────────────────────────────┐
│          DEBOUNCE vs THROTTLE                                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   User typing: "h" "e" "l" "l" "o"                                  │
│   Events:       ↓   ↓   ↓   ↓   ↓                                   │
│   Time:         0  100 200 300 400 500 600 700 800 (ms)             │
│                                                                      │
│   ─────────────────────────────────────────────────────────────────  │
│                                                                      │
│   NO DEBOUNCE/THROTTLE:                                             │
│   Executions:   ✓   ✓   ✓   ✓   ✓                                   │
│   Result: 5 API calls (wasteful!)                                   │
│                                                                      │
│   ─────────────────────────────────────────────────────────────────  │
│                                                                      │
│   DEBOUNCE (300ms):                                                 │
│   "Wait 300ms after LAST keystroke before executing"               │
│                                                                      │
│   Events:       ↓   ↓   ↓   ↓   ↓                                   │
│   Timers:      [---]reset                                           │
│                    [---]reset                                        │
│                        [---]reset                                    │
│                            [---]reset                                │
│                                [---300ms---]→ ✓ Execute!            │
│                                                                      │
│   Result: 1 API call with "hello"                                   │
│                                                                      │
│   ─────────────────────────────────────────────────────────────────  │
│                                                                      │
│   THROTTLE (300ms):                                                 │
│   "Execute at most once per 300ms"                                  │
│                                                                      │
│   Events:       ↓   ↓   ↓   ↓   ↓                                   │
│   Executions:   ✓           ✓       (trailing) ✓                    │
│                 |←──300ms──→|←──300ms──→|                           │
│                                                                      │
│   Result: 3 API calls ("h", "llo", "hello")                         │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### When to Use Each

```javascript
// ═══════════════════════════════════════════════════════════════════
// DEBOUNCE: Wait until user STOPS doing something
// ═══════════════════════════════════════════════════════════════════

// 1. Search input - wait until user stops typing
const searchInput = document.querySelector('#search');
const debouncedSearch = debounce((e) => {
  fetch(`/api/search?q=${e.target.value}`);
}, 300);
searchInput.addEventListener('input', debouncedSearch);

// 2. Window resize - wait until user stops resizing
const debouncedResize = debounce(() => {
  recalculateLayout();
}, 250);
window.addEventListener('resize', debouncedResize);

// 3. Auto-save - wait until user stops editing
const debouncedSave = debounce(() => {
  saveDocument();
}, 1000);
editor.on('change', debouncedSave);

// ═══════════════════════════════════════════════════════════════════
// THROTTLE: Limit frequency of continuous events
// ═══════════════════════════════════════════════════════════════════

// 1. Scroll handler - don't fire 60 times per second
const throttledScroll = throttle(() => {
  updateScrollProgress();
  checkIfElementInView();
}, 100);
window.addEventListener('scroll', throttledScroll);

// 2. Mouse move - limit position updates
const throttledMove = throttle((e) => {
  updateTooltipPosition(e.clientX, e.clientY);
}, 50);
document.addEventListener('mousemove', throttledMove);

// 3. API rate limiting - max N requests per second
const throttledAPI = throttle(() => {
  sendAnalytics();
}, 1000);  // Max 1 call per second
```

### Advanced: Leading and Trailing Options

```javascript
// LEADING: Execute at the START of wait period
const debouncedLeading = debounce(fn, 300, { leading: true, trailing: false });

// Events:     ↓   ↓   ↓   ↓   ↓
// Execution:  ✓   (ignored during 300ms after each call)
// Use case: Prevent double-click on submit button

// TRAILING (default): Execute at the END of wait period
const debouncedTrailing = debounce(fn, 300, { leading: false, trailing: true });

// Events:     ↓   ↓   ↓   ↓   ↓   [300ms wait]
// Execution:                                    ✓
// Use case: Search as you type

// BOTH: Execute at start AND end
const debouncedBoth = debounce(fn, 300, { leading: true, trailing: true });

// Events:     ↓   ↓   ↓   ↓   ↓   [300ms wait]
// Execution:  ✓                                 ✓
// Use case: Show loading immediately, then update with final result
```

### Deep Clone

```javascript
/**
 * Deep clone with support for:
 * - Primitives, Arrays, Objects
 * - Date, RegExp, Map, Set
 * - Circular references
 * - Symbols
 */
function deepClone(obj, seen = new WeakMap()) {
  // Handle primitives and null
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  // Handle circular references
  if (seen.has(obj)) {
    return seen.get(obj);
  }
  
  // Handle Date
  if (obj instanceof Date) {
    return new Date(obj.getTime());
  }
  
  // Handle RegExp
  if (obj instanceof RegExp) {
    return new RegExp(obj.source, obj.flags);
  }
  
  // Handle Map
  if (obj instanceof Map) {
    const clonedMap = new Map();
    seen.set(obj, clonedMap);
    obj.forEach((value, key) => {
      clonedMap.set(deepClone(key, seen), deepClone(value, seen));
    });
    return clonedMap;
  }
  
  // Handle Set
  if (obj instanceof Set) {
    const clonedSet = new Set();
    seen.set(obj, clonedSet);
    obj.forEach(value => {
      clonedSet.add(deepClone(value, seen));
    });
    return clonedSet;
  }
  
  // Handle Array
  if (Array.isArray(obj)) {
    const clonedArr = [];
    seen.set(obj, clonedArr);
    for (let i = 0; i < obj.length; i++) {
      clonedArr[i] = deepClone(obj[i], seen);
    }
    return clonedArr;
  }
  
  // Handle Object
  const clonedObj = Object.create(Object.getPrototypeOf(obj));
  seen.set(obj, clonedObj);
  
  // Clone all properties including symbols
  const keys = [...Object.keys(obj), ...Object.getOwnPropertySymbols(obj)];
  for (const key of keys) {
    const descriptor = Object.getOwnPropertyDescriptor(obj, key);
    if (descriptor.value !== undefined) {
      descriptor.value = deepClone(descriptor.value, seen);
    }
    Object.defineProperty(clonedObj, key, descriptor);
  }
  
  return clonedObj;
}

// Test
const obj = { 
  a: 1, 
  b: { c: 2 }, 
  d: [1, 2, { e: 3 }],
  date: new Date(),
  regex: /test/gi,
  map: new Map([['key', 'value']]),
  set: new Set([1, 2, 3])
};
obj.circular = obj;  // Circular reference

const cloned = deepClone(obj);
console.log(cloned.circular === cloned);  // true
console.log(cloned.b !== obj.b);          // true
```

### Deep Clone: Why It's Tricky

```
┌─────────────────────────────────────────────────────────────────────┐
│          SHALLOW vs DEEP COPY                                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   const original = { a: 1, b: { c: 2 } };                           │
│                                                                      │
│   SHALLOW COPY (Object.assign, spread):                             │
│                                                                      │
│   const shallow = { ...original };                                  │
│                                                                      │
│   original                     shallow                               │
│   ┌─────────────────┐         ┌─────────────────┐                   │
│   │ a: 1            │         │ a: 1            │  ✓ Copied         │
│   │ b: ────────────────────────▶ { c: 2 }       │  ✗ Same reference!│
│   └─────────────────┘         └─────────────────┘                   │
│                                      ▲                               │
│                                      │                               │
│   shallow.b === original.b  // true (SAME object!)                  │
│   shallow.b.c = 999;        // Also changes original.b.c!           │
│                                                                      │
│   ─────────────────────────────────────────────────────────────────  │
│                                                                      │
│   DEEP COPY (deepClone):                                            │
│                                                                      │
│   const deep = deepClone(original);                                 │
│                                                                      │
│   original                     deep                                  │
│   ┌─────────────────┐         ┌─────────────────┐                   │
│   │ a: 1            │         │ a: 1            │  ✓ Copied         │
│   │ b: ───┐         │         │ b: ───┐         │  ✓ Copied         │
│   └───────┼─────────┘         └───────┼─────────┘                   │
│           ▼                           ▼                              │
│      { c: 2 }                    { c: 2 }  (NEW object!)            │
│                                                                      │
│   deep.b === original.b  // false (different objects)               │
│   deep.b.c = 999;        // Does NOT affect original                │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Different Deep Clone Methods

```javascript
// Method 1: JSON (simple but limited)
const clone1 = JSON.parse(JSON.stringify(obj));

// ❌ Limitations:
// - Loses: Date (→ string), RegExp (→ {}), 
//          undefined, functions, Symbol, Map, Set
// - Throws on circular references
// - Ignores prototype chain

// ─────────────────────────────────────────────────────────────────

// Method 2: structuredClone (modern, built-in)
const clone2 = structuredClone(obj);

// ✅ Handles: Date, RegExp, Map, Set, ArrayBuffer, 
//            circular references, Error
// ❌ Cannot clone: Functions, DOM nodes, prototype chain

// ─────────────────────────────────────────────────────────────────

// Method 3: Custom deepClone (full control)
// See implementation above

// ✅ Can handle everything
// ✅ Can preserve prototype chain
// ❌ More code to maintain
```

### Circular Reference Handling

```javascript
// The problem:
const a = { name: 'a' };
const b = { name: 'b', ref: a };
a.ref = b;  // Circular!

// a → b → a → b → a ... infinite loop!

// JSON.stringify throws:
JSON.stringify(a);  // TypeError: Converting circular structure

// Our solution: WeakMap to track seen objects
function deepClone(obj, seen = new WeakMap()) {
  // Already cloned this object?
  if (seen.has(obj)) {
    return seen.get(obj);  // Return the clone, not original!
  }
  
  const clone = Array.isArray(obj) ? [] : {};
  seen.set(obj, clone);  // Register BEFORE recursing!
  
  for (const key of Object.keys(obj)) {
    clone[key] = deepClone(obj[key], seen);
  }
  
  return clone;
}

// Trace:
// 1. Clone 'a', register a→cloneA in seen
// 2. Clone a.ref (which is 'b'), register b→cloneB
// 3. Clone b.ref (which is 'a')
// 4. 'a' already in seen! Return cloneA instead of recursing
// 5. cloneB.ref = cloneA (not original 'a')
// 6. cloneA.ref = cloneB
// Result: cloneA ↔ cloneB (proper circular clone!)
```

### Flatten

```javascript
/**
 * Flatten nested array to specified depth
 */
function flattenArray(arr, depth = 1) {
  if (depth === 0) return [...arr];
  
  return arr.reduce((acc, item) => {
    if (Array.isArray(item) && depth > 0) {
      acc.push(...flattenArray(item, depth - 1));
    } else {
      acc.push(item);
    }
    return acc;
  }, []);
}

// Iterative version (no recursion limit)
function flattenArrayIterative(arr, depth = 1) {
  const result = [];
  const stack = arr.map(item => [item, depth]);
  
  while (stack.length) {
    const [item, d] = stack.pop();
    
    if (Array.isArray(item) && d > 0) {
      stack.push(...item.map(i => [i, d - 1]));
    } else {
      result.push(item);
    }
  }
  
  return result.reverse();
}

/**
 * Flatten nested object
 */
function flattenObject(obj, prefix = '', separator = '.') {
  const result = {};
  
  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}${separator}${key}` : key;
    
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(result, flattenObject(value, newKey, separator));
    } else {
      result[newKey] = value;
    }
  }
  
  return result;
}

/**
 * Unflatten object
 */
function unflattenObject(obj, separator = '.') {
  const result = {};
  
  for (const [key, value] of Object.entries(obj)) {
    const keys = key.split(separator);
    let current = result;
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (!(keys[i] in current)) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
  }
  
  return result;
}

// Test
flattenArray([1, [2, [3, [4]]]], 2);  // [1, 2, 3, [4]]
flattenObject({ a: { b: { c: 1 } }, d: 2 });  // { 'a.b.c': 1, d: 2 }
unflattenObject({ 'a.b.c': 1, d: 2 });  // { a: { b: { c: 1 } }, d: 2 }
```

### Currying

```javascript
/**
 * Curry: Transform f(a, b, c) into f(a)(b)(c)
 */
function curry(fn) {
  return function curried(...args) {
    if (args.length >= fn.length) {
      return fn.apply(this, args);
    }
    return function(...moreArgs) {
      return curried.apply(this, [...args, ...moreArgs]);
    };
  };
}

/**
 * Curry with placeholder support
 */
function curryWithPlaceholder(fn, placeholder = '_') {
  return function curried(...args) {
    // Check if all non-placeholder args are filled
    const complete = args.length >= fn.length && 
      args.slice(0, fn.length).every(arg => arg !== placeholder);
    
    if (complete) {
      return fn.apply(this, args);
    }
    
    return function(...moreArgs) {
      // Replace placeholders with new args
      const merged = args.map(arg => 
        arg === placeholder && moreArgs.length ? moreArgs.shift() : arg
      );
      return curried.apply(this, [...merged, ...moreArgs]);
    };
  };
}

/**
 * Partial application
 */
function partial(fn, ...partialArgs) {
  return function(...args) {
    return fn.apply(this, [...partialArgs, ...args]);
  };
}

// Test
const add = (a, b, c) => a + b + c;
const curriedAdd = curry(add);
curriedAdd(1)(2)(3);     // 6
curriedAdd(1, 2)(3);     // 6
curriedAdd(1)(2, 3);     // 6

const _ = '_';
const curriedAddP = curryWithPlaceholder(add, _);
curriedAddP(_, 2, _)(1)(3);  // 6
```

### Understanding Currying

```
┌─────────────────────────────────────────────────────────────────────┐
│          CURRYING EXPLAINED                                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   Normal function:  add(1, 2, 3) → 6                                │
│   Curried function: add(1)(2)(3) → 6                                │
│                                                                      │
│   ─────────────────────────────────────────────────────────────────  │
│                                                                      │
│   HOW IT WORKS:                                                     │
│                                                                      │
│   const add = curry((a, b, c) => a + b + c);                        │
│   // add.length = 3 (needs 3 arguments)                             │
│                                                                      │
│   Step 1: add(1)                                                    │
│   • Received: 1 argument                                            │
│   • Needed: 3 arguments                                             │
│   • Not enough! Return: (...more) => curried(1, ...more)            │
│                                                                      │
│   Step 2: add(1)(2)                                                 │
│   • Received: 2 arguments total (1 + 2)                             │
│   • Needed: 3 arguments                                             │
│   • Still not enough! Return: (...more) => curried(1, 2, ...more)   │
│                                                                      │
│   Step 3: add(1)(2)(3)                                              │
│   • Received: 3 arguments total (1 + 2 + 3)                         │
│   • Needed: 3 arguments                                             │
│   • Enough! Execute: (1, 2, 3) => 1 + 2 + 3 = 6                    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Practical Uses for Currying

```javascript
// Use Case 1: Configuration and Reuse
const log = curry((level, prefix, message) => {
  console.log(`[${level}] ${prefix}: ${message}`);
});

const debugLog = log('DEBUG');
const authDebugLog = debugLog('Auth');

authDebugLog('User logged in');   // [DEBUG] Auth: User logged in
authDebugLog('Token refreshed');  // [DEBUG] Auth: Token refreshed

// Use Case 2: Functional Composition
const map = curry((fn, arr) => arr.map(fn));
const filter = curry((fn, arr) => arr.filter(fn));
const prop = curry((key, obj) => obj[key]);

const getNames = map(prop('name'));
const adults = filter(person => person.age >= 18);

// Compose them:
const getAdultNames = (people) => getNames(adults(people));

getAdultNames([
  { name: 'Alice', age: 25 },
  { name: 'Bob', age: 15 },
  { name: 'Charlie', age: 30 }
]);  // ['Alice', 'Charlie']

// Use Case 3: Event Handlers
const handleEvent = curry((eventType, handler, event) => {
  console.log(`${eventType} event:`, event.target);
  handler(event);
});

const handleClick = handleEvent('click');
const handleSubmitClick = handleClick((e) => {
  e.preventDefault();
  submitForm();
});

button.addEventListener('click', handleSubmitClick);
```

### Currying vs Partial Application

```javascript
// CURRYING: Always single argument at a time (in theory)
// f(a, b, c) → f(a)(b)(c)

const curriedAdd = curry((a, b, c) => a + b + c);
curriedAdd(1)(2)(3);  // 6

// PARTIAL APPLICATION: Fix some arguments, return new function
// f(a, b, c) → g(c) where a, b are fixed

const add = (a, b, c) => a + b + c;
const add1And2 = partial(add, 1, 2);  // Fix a=1, b=2
add1And2(3);  // 6

// JavaScript's curry is often "loose" - accepts multiple args
curriedAdd(1, 2)(3);  // Also 6 (not pure currying!)
curriedAdd(1)(2, 3);  // Also 6
```

### Memoization

```javascript
/**
 * Memoize with single argument
 */
function memoize(fn) {
  const cache = new Map();
  
  return function(arg) {
    if (cache.has(arg)) {
      return cache.get(arg);
    }
    const result = fn.call(this, arg);
    cache.set(arg, result);
    return result;
  };
}

/**
 * Memoize with multiple arguments
 */
function memoizeMultiple(fn, resolver) {
  const cache = new Map();
  
  const memoized = function(...args) {
    const key = resolver ? resolver(...args) : JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  };
  
  memoized.cache = cache;
  memoized.clear = () => cache.clear();
  
  return memoized;
}

/**
 * Memoize with LRU eviction
 */
function memoizeLRU(fn, maxSize = 100) {
  const cache = new Map();
  
  return function(...args) {
    const key = JSON.stringify(args);
    
    if (cache.has(key)) {
      // Move to end (most recently used)
      const value = cache.get(key);
      cache.delete(key);
      cache.set(key, value);
      return value;
    }
    
    const result = fn.apply(this, args);
    
    // Evict oldest if at capacity
    if (cache.size >= maxSize) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }
    
    cache.set(key, result);
    return result;
  };
}

// Test
const fibonacci = memoize(function fib(n) {
  if (n <= 1) return n;
  return fib(n - 1) + fib(n - 2);
});

fibonacci(100);  // Fast!
```

### Memoization Deep Dive

```
┌─────────────────────────────────────────────────────────────────────┐
│          MEMOIZATION: TRADING SPACE FOR TIME                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   WITHOUT MEMOIZATION - Fibonacci                                   │
│                                                                      │
│   fib(5)                                                            │
│   ├── fib(4)                                                        │
│   │   ├── fib(3)                  Calls: fib(5) = 1                 │
│   │   │   ├── fib(2)                     fib(4) = 1                 │
│   │   │   │   ├── fib(1)                 fib(3) = 2                 │
│   │   │   │   └── fib(0)                 fib(2) = 3                 │
│   │   │   └── fib(1)                     fib(1) = 5                 │
│   │   └── fib(2)                         fib(0) = 3                 │
│   │       ├── fib(1)              ─────────────────                 │
│   │       └── fib(0)              Total: 15 calls                   │
│   └── fib(3)                                                        │
│       ├── fib(2)               Time Complexity: O(2^n) 💀           │
│       │   ├── fib(1)                                                │
│       │   └── fib(0)                                                │
│       └── fib(1)                                                    │
│                                                                      │
│   ─────────────────────────────────────────────────────────────────  │
│                                                                      │
│   WITH MEMOIZATION                                                  │
│                                                                      │
│   Cache: {}                                                         │
│   fib(5):                                                           │
│   ├── fib(4): not cached, compute                                   │
│   │   ├── fib(3): not cached, compute                               │
│   │   │   ├── fib(2): not cached → returns 1, cache[2] = 1         │
│   │   │   └── fib(1): → returns 1                                   │
│   │   │   → returns 2, cache[3] = 2                                 │
│   │   └── fib(2): CACHED! → returns 1                               │
│   │   → returns 3, cache[4] = 3                                     │
│   └── fib(3): CACHED! → returns 2                                   │
│   → returns 5, cache[5] = 5                                         │
│                                                                      │
│   Cache: {2: 1, 3: 2, 4: 3, 5: 5}                                   │
│   Total: 9 calls (vs 15)                                            │
│   For fib(40): 331,160,281 calls vs 79 calls!                       │
│                                                                      │
│   Time Complexity: O(n) 🚀                                          │
│   Space Complexity: O(n) for cache                                  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### When to Use Memoization

```javascript
// ✅ GOOD CANDIDATES:

// 1. Pure functions with expensive calculations
const factorial = memoize((n) => {
  if (n <= 1) return 1;
  return n * factorial(n - 1);
});

// 2. Functions called with same args repeatedly
const getPriceWithTax = memoize((price, taxRate) => {
  // Complex tax calculation
  return price * (1 + taxRate);
});

// 3. Recursive functions
const fibonacci = memoize((n) => {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
});

// 4. API data transformation
const transformData = memoize((rawData) => {
  // Expensive parsing/transformation
  return complexTransform(rawData);
});

// ─────────────────────────────────────────────────────────────────

// ❌ BAD CANDIDATES:

// 1. Functions with side effects
function logAndReturn(x) {
  console.log(x);  // Side effect!
  return x;
}
// Memoized version would skip the log on cache hit

// 2. Functions with random/time-based results
function getRandomWithSeed(seed) {
  return Math.random();  // Different each call!
}

// 3. Functions with object/array arguments (cache key issues)
function processArray(arr) {
  return arr.map(x => x * 2);
}
// [1, 2] !== [1, 2] - cache keys don't match!

// 4. Infrequently called functions (overhead > benefit)
```

### Memoization Gotchas

```javascript
// GOTCHA 1: Object/Array arguments
const memoized = memoize((obj) => obj.value * 2);

memoized({ value: 5 });  // Computes: 10
memoized({ value: 5 });  // Computes AGAIN: 10 (different object reference!)

// Solution: Custom key resolver
const memoizedWithKey = memoizeMultiple(
  (obj) => obj.value * 2,
  (obj) => obj.value  // Use value as cache key, not object reference
);

// GOTCHA 2: 'this' context
const obj = {
  multiplier: 10,
  calculate: memoize(function(x) {
    return x * this.multiplier;
  })
};

obj.calculate(5);  // 50
const fn = obj.calculate;
fn(5);  // NaN! 'this' is undefined

// Solution: Bind or use arrow function carefully

// GOTCHA 3: Memory leaks with unbounded cache
const cache = {};  // Grows forever!

// Solution: LRU eviction (see memoizeLRU above)
```

---

## Async Patterns

### Promise Utilities

```javascript
/**
 * Promise.all with concurrency limit
 */
async function promiseAllLimit(promises, limit) {
  const results = [];
  const executing = new Set();
  
  for (const [index, promise] of promises.entries()) {
    const p = Promise.resolve(promise).then(result => {
      executing.delete(p);
      return result;
    });
    
    results[index] = p;
    executing.add(p);
    
    if (executing.size >= limit) {
      await Promise.race(executing);
    }
  }
  
  return Promise.all(results);
}

/**
 * Promise with timeout
 */
function promiseWithTimeout(promise, timeout, errorMessage = 'Timeout') {
  return Promise.race([
    promise,
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error(errorMessage)), timeout)
    )
  ]);
}

/**
 * Retry with exponential backoff
 */
async function retry(fn, options = {}) {
  const {
    retries = 3,
    delay = 1000,
    factor = 2,
    onRetry = () => {}
  } = options;
  
  let lastError;
  let currentDelay = delay;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt < retries) {
        onRetry(error, attempt + 1);
        await new Promise(resolve => setTimeout(resolve, currentDelay));
        currentDelay *= factor;
      }
    }
  }
  
  throw lastError;
}

/**
 * Sequential promise execution
 */
async function promiseSequence(promiseFns) {
  const results = [];
  
  for (const fn of promiseFns) {
    results.push(await fn());
  }
  
  return results;
}

/**
 * Promise pool (run N promises at a time)
 */
async function promisePool(promiseFns, poolSize) {
  const results = [];
  let index = 0;
  
  async function runNext() {
    const currentIndex = index++;
    if (currentIndex >= promiseFns.length) return;
    
    results[currentIndex] = await promiseFns[currentIndex]();
    await runNext();
  }
  
  await Promise.all(
    Array(Math.min(poolSize, promiseFns.length))
      .fill()
      .map(runNext)
  );
  
  return results;
}

// Usage
await promiseAllLimit([fetch1, fetch2, fetch3, fetch4, fetch5], 2);

await promiseWithTimeout(fetch('/api/data'), 5000);

await retry(() => fetch('/api/flaky'), { 
  retries: 3, 
  delay: 1000,
  onRetry: (err, attempt) => console.log(`Retry ${attempt}`)
});
```

### Async Flow Control

```javascript
/**
 * Async compose (right to left)
 */
function asyncCompose(...fns) {
  return function(x) {
    return fns.reduceRight(
      (acc, fn) => acc.then(fn),
      Promise.resolve(x)
    );
  };
}

/**
 * Async pipe (left to right)
 */
function asyncPipe(...fns) {
  return function(x) {
    return fns.reduce(
      (acc, fn) => acc.then(fn),
      Promise.resolve(x)
    );
  };
}

/**
 * Parallel limit
 */
async function parallelLimit(tasks, limit) {
  const results = [];
  const running = [];
  
  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i]().then(result => {
      results[i] = result;
      running.splice(running.indexOf(task), 1);
    });
    
    running.push(task);
    
    if (running.length >= limit) {
      await Promise.race(running);
    }
  }
  
  await Promise.all(running);
  return results;
}

/**
 * Async queue
 */
class AsyncQueue {
  constructor(concurrency = 1) {
    this.concurrency = concurrency;
    this.running = 0;
    this.queue = [];
  }
  
  async push(task) {
    return new Promise((resolve, reject) => {
      this.queue.push({ task, resolve, reject });
      this.process();
    });
  }
  
  async process() {
    while (this.running < this.concurrency && this.queue.length) {
      const { task, resolve, reject } = this.queue.shift();
      this.running++;
      
      try {
        const result = await task();
        resolve(result);
      } catch (error) {
        reject(error);
      } finally {
        this.running--;
        this.process();
      }
    }
  }
}

// Usage
const queue = new AsyncQueue(2);  // 2 concurrent tasks
queue.push(() => fetch('/api/1'));
queue.push(() => fetch('/api/2'));
queue.push(() => fetch('/api/3'));  // Waits for one to complete
```

---

## Data Structure Problems

### LRU Cache

```javascript
class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.cache = new Map();  // Map maintains insertion order
  }
  
  get(key) {
    if (!this.cache.has(key)) {
      return -1;
    }
    
    // Move to end (most recently used)
    const value = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }
  
  put(key, value) {
    // If key exists, delete to update position
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }
    
    // Evict least recently used if at capacity
    if (this.cache.size >= this.capacity) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, value);
  }
}

// Test
const cache = new LRUCache(2);
cache.put(1, 1);
cache.put(2, 2);
cache.get(1);     // 1
cache.put(3, 3);  // Evicts key 2
cache.get(2);     // -1 (not found)
```

### Event Emitter

```javascript
class EventEmitter {
  constructor() {
    this.events = new Map();
  }
  
  on(event, listener) {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event).push(listener);
    return this;
  }
  
  off(event, listener) {
    if (!this.events.has(event)) return this;
    
    const listeners = this.events.get(event);
    const index = listeners.indexOf(listener);
    if (index > -1) {
      listeners.splice(index, 1);
    }
    return this;
  }
  
  once(event, listener) {
    const wrapper = (...args) => {
      listener.apply(this, args);
      this.off(event, wrapper);
    };
    return this.on(event, wrapper);
  }
  
  emit(event, ...args) {
    if (!this.events.has(event)) return false;
    
    const listeners = this.events.get(event).slice();
    listeners.forEach(listener => listener.apply(this, args));
    return true;
  }
  
  listenerCount(event) {
    return this.events.get(event)?.length || 0;
  }
  
  removeAllListeners(event) {
    if (event) {
      this.events.delete(event);
    } else {
      this.events.clear();
    }
    return this;
  }
}

// Test
const emitter = new EventEmitter();
const handler = (data) => console.log(data);

emitter.on('message', handler);
emitter.emit('message', 'Hello!');  // 'Hello!'
emitter.off('message', handler);
```

### Trie (Prefix Tree)

```javascript
class TrieNode {
  constructor() {
    this.children = new Map();
    this.isEndOfWord = false;
  }
}

class Trie {
  constructor() {
    this.root = new TrieNode();
  }
  
  insert(word) {
    let node = this.root;
    
    for (const char of word) {
      if (!node.children.has(char)) {
        node.children.set(char, new TrieNode());
      }
      node = node.children.get(char);
    }
    
    node.isEndOfWord = true;
  }
  
  search(word) {
    const node = this.findNode(word);
    return node !== null && node.isEndOfWord;
  }
  
  startsWith(prefix) {
    return this.findNode(prefix) !== null;
  }
  
  findNode(str) {
    let node = this.root;
    
    for (const char of str) {
      if (!node.children.has(char)) {
        return null;
      }
      node = node.children.get(char);
    }
    
    return node;
  }
  
  // Get all words with prefix
  getWordsWithPrefix(prefix) {
    const node = this.findNode(prefix);
    if (!node) return [];
    
    const results = [];
    this.collectWords(node, prefix, results);
    return results;
  }
  
  collectWords(node, prefix, results) {
    if (node.isEndOfWord) {
      results.push(prefix);
    }
    
    for (const [char, childNode] of node.children) {
      this.collectWords(childNode, prefix + char, results);
    }
  }
}

// Test
const trie = new Trie();
trie.insert('apple');
trie.insert('app');
trie.insert('application');
trie.search('app');           // true
trie.startsWith('app');       // true
trie.getWordsWithPrefix('app');  // ['app', 'apple', 'application']
```

---

## String/Array Problems

### String Problems

```javascript
/**
 * Reverse words in a string
 */
function reverseWords(str) {
  return str.trim().split(/\s+/).reverse().join(' ');
}

/**
 * Longest substring without repeating characters
 */
function lengthOfLongestSubstring(s) {
  const charIndex = new Map();
  let maxLength = 0;
  let start = 0;
  
  for (let end = 0; end < s.length; end++) {
    const char = s[end];
    
    if (charIndex.has(char) && charIndex.get(char) >= start) {
      start = charIndex.get(char) + 1;
    }
    
    charIndex.set(char, end);
    maxLength = Math.max(maxLength, end - start + 1);
  }
  
  return maxLength;
}

/**
 * Valid parentheses
 */
function isValidParentheses(s) {
  const stack = [];
  const pairs = { ')': '(', '}': '{', ']': '[' };
  
  for (const char of s) {
    if (char in pairs) {
      if (stack.pop() !== pairs[char]) {
        return false;
      }
    } else {
      stack.push(char);
    }
  }
  
  return stack.length === 0;
}

/**
 * Group anagrams
 */
function groupAnagrams(strs) {
  const groups = new Map();
  
  for (const str of strs) {
    const key = [...str].sort().join('');
    
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key).push(str);
  }
  
  return [...groups.values()];
}

/**
 * Longest palindromic substring
 */
function longestPalindrome(s) {
  if (s.length < 2) return s;
  
  let start = 0;
  let maxLength = 1;
  
  function expandAroundCenter(left, right) {
    while (left >= 0 && right < s.length && s[left] === s[right]) {
      const length = right - left + 1;
      if (length > maxLength) {
        start = left;
        maxLength = length;
      }
      left--;
      right++;
    }
  }
  
  for (let i = 0; i < s.length; i++) {
    expandAroundCenter(i, i);     // Odd length
    expandAroundCenter(i, i + 1); // Even length
  }
  
  return s.substring(start, start + maxLength);
}

// Test
reverseWords('  hello world  ');  // 'world hello'
lengthOfLongestSubstring('abcabcbb');  // 3
isValidParentheses('()[]{}');  // true
groupAnagrams(['eat', 'tea', 'tan', 'ate', 'nat', 'bat']);
// [['eat', 'tea', 'ate'], ['tan', 'nat'], ['bat']]
longestPalindrome('babad');  // 'bab' or 'aba'
```

### Array Problems

```javascript
/**
 * Two Sum
 */
function twoSum(nums, target) {
  const map = new Map();
  
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    
    if (map.has(complement)) {
      return [map.get(complement), i];
    }
    
    map.set(nums[i], i);
  }
  
  return [];
}

/**
 * Three Sum
 */
function threeSum(nums) {
  const result = [];
  nums.sort((a, b) => a - b);
  
  for (let i = 0; i < nums.length - 2; i++) {
    // Skip duplicates
    if (i > 0 && nums[i] === nums[i - 1]) continue;
    
    let left = i + 1;
    let right = nums.length - 1;
    
    while (left < right) {
      const sum = nums[i] + nums[left] + nums[right];
      
      if (sum === 0) {
        result.push([nums[i], nums[left], nums[right]]);
        
        // Skip duplicates
        while (left < right && nums[left] === nums[left + 1]) left++;
        while (left < right && nums[right] === nums[right - 1]) right--;
        
        left++;
        right--;
      } else if (sum < 0) {
        left++;
      } else {
        right--;
      }
    }
  }
  
  return result;
}

/**
 * Maximum subarray sum (Kadane's algorithm)
 */
function maxSubArray(nums) {
  let maxSum = nums[0];
  let currentSum = nums[0];
  
  for (let i = 1; i < nums.length; i++) {
    currentSum = Math.max(nums[i], currentSum + nums[i]);
    maxSum = Math.max(maxSum, currentSum);
  }
  
  return maxSum;
}

/**
 * Merge intervals
 */
function mergeIntervals(intervals) {
  if (intervals.length <= 1) return intervals;
  
  intervals.sort((a, b) => a[0] - b[0]);
  const result = [intervals[0]];
  
  for (let i = 1; i < intervals.length; i++) {
    const current = intervals[i];
    const last = result[result.length - 1];
    
    if (current[0] <= last[1]) {
      last[1] = Math.max(last[1], current[1]);
    } else {
      result.push(current);
    }
  }
  
  return result;
}

/**
 * Find duplicate number (Floyd's cycle detection)
 */
function findDuplicate(nums) {
  let slow = nums[0];
  let fast = nums[0];
  
  // Find cycle
  do {
    slow = nums[slow];
    fast = nums[nums[fast]];
  } while (slow !== fast);
  
  // Find cycle start
  slow = nums[0];
  while (slow !== fast) {
    slow = nums[slow];
    fast = nums[fast];
  }
  
  return slow;
}

/**
 * Product of array except self
 */
function productExceptSelf(nums) {
  const n = nums.length;
  const result = new Array(n).fill(1);
  
  // Left products
  let leftProduct = 1;
  for (let i = 0; i < n; i++) {
    result[i] = leftProduct;
    leftProduct *= nums[i];
  }
  
  // Right products
  let rightProduct = 1;
  for (let i = n - 1; i >= 0; i--) {
    result[i] *= rightProduct;
    rightProduct *= nums[i];
  }
  
  return result;
}

// Test
twoSum([2, 7, 11, 15], 9);  // [0, 1]
threeSum([-1, 0, 1, 2, -1, -4]);  // [[-1, -1, 2], [-1, 0, 1]]
maxSubArray([-2, 1, -3, 4, -1, 2, 1, -5, 4]);  // 6
mergeIntervals([[1, 3], [2, 6], [8, 10], [15, 18]]);  // [[1, 6], [8, 10], [15, 18]]
productExceptSelf([1, 2, 3, 4]);  // [24, 12, 8, 6]
```

### Algorithm Patterns: Detailed Walkthrough

```
┌─────────────────────────────────────────────────────────────────────┐
│          TWO SUM - Hash Map Pattern                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   Problem: Find indices of two numbers that sum to target           │
│   Input: nums = [2, 7, 11, 15], target = 9                          │
│                                                                      │
│   BRUTE FORCE: O(n²) - Check every pair                             │
│   for i in range(n):                                                │
│     for j in range(i+1, n):                                         │
│       if nums[i] + nums[j] == target: return [i, j]                │
│                                                                      │
│   OPTIMAL: O(n) - Use Hash Map                                      │
│                                                                      │
│   Map: {}                                                           │
│                                                                      │
│   i=0: nums[0] = 2                                                  │
│        complement = 9 - 2 = 7                                       │
│        7 in map? NO                                                 │
│        map[2] = 0  →  Map: {2: 0}                                   │
│                                                                      │
│   i=1: nums[1] = 7                                                  │
│        complement = 9 - 7 = 2                                       │
│        2 in map? YES! at index 0                                    │
│        return [0, 1] ✓                                              │
│                                                                      │
│   KEY INSIGHT: For each number, we need its "complement"           │
│   Store each number's index as we go, check if complement exists   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

```
┌─────────────────────────────────────────────────────────────────────┐
│          SLIDING WINDOW Pattern                                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   Problem: Longest substring without repeating characters           │
│   Input: "abcabcbb"                                                 │
│                                                                      │
│   Window = characters between 'start' and 'end' pointers           │
│                                                                      │
│   String:  a  b  c  a  b  c  b  b                                   │
│   Index:   0  1  2  3  4  5  6  7                                   │
│                                                                      │
│   start=0, end=0: window="a"     seen={a:0}    max=1                │
│   start=0, end=1: window="ab"    seen={a:0,b:1}    max=2            │
│   start=0, end=2: window="abc"   seen={a:0,b:1,c:2}    max=3        │
│   start=0, end=3: 'a' seen at 0! start=1                            │
│                   window="bca"   seen={a:3,b:1,c:2}    max=3        │
│   start=1, end=4: 'b' seen at 1! start=2                            │
│                   window="cab"   seen={a:3,b:4,c:2}    max=3        │
│   start=2, end=5: 'c' seen at 2! start=3                            │
│                   window="abc"   seen={a:3,b:4,c:5}    max=3        │
│   start=3, end=6: 'b' seen at 4! start=5                            │
│                   window="cb"    seen={a:3,b:6,c:5}    max=3        │
│   start=5, end=7: 'b' seen at 6! start=7                            │
│                   window="b"     seen={a:3,b:7,c:5}    max=3        │
│                                                                      │
│   Answer: 3 ("abc")                                                 │
│                                                                      │
│   KEY INSIGHT: Expand end, shrink start when duplicate found       │
│   Keep track of last seen index for each character                  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

```
┌─────────────────────────────────────────────────────────────────────┐
│          TWO POINTERS Pattern                                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   Problem: Three Sum - find triplets that sum to zero               │
│   Input: [-1, 0, 1, 2, -1, -4]                                      │
│                                                                      │
│   Step 1: Sort array                                                │
│   Sorted: [-4, -1, -1, 0, 1, 2]                                     │
│                                                                      │
│   Step 2: Fix one number, use two pointers for remaining           │
│                                                                      │
│   i=0 (fix -4):                                                     │
│   [-4, -1, -1, 0, 1, 2]                                             │
│     i   L            R                                              │
│                                                                      │
│   -4 + (-1) + 2 = -3 < 0 → move L right                             │
│   -4 + (-1) + 2 = -3 < 0 → move L right                             │
│   -4 + 0 + 2 = -2 < 0 → move L right                                │
│   -4 + 1 + 2 = -1 < 0 → L meets R, done with i=0                    │
│                                                                      │
│   i=1 (fix -1):                                                     │
│   [-4, -1, -1, 0, 1, 2]                                             │
│         i   L        R                                              │
│                                                                      │
│   -1 + (-1) + 2 = 0 ✓ Found! [-1, -1, 2]                           │
│   Skip duplicates, move both pointers                               │
│   -1 + 0 + 1 = 0 ✓ Found! [-1, 0, 1]                               │
│                                                                      │
│   i=2: Same as i=1, skip (duplicate)                                │
│   i=3: 0 + 1 + 2 = 3 > 0, no solution                               │
│                                                                      │
│   Answer: [[-1, -1, 2], [-1, 0, 1]]                                 │
│                                                                      │
│   KEY INSIGHT: Sorting enables two-pointer technique                │
│   If sum < target, move left pointer right (increase sum)          │
│   If sum > target, move right pointer left (decrease sum)          │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

```
┌─────────────────────────────────────────────────────────────────────┐
│          KADANE'S ALGORITHM - Maximum Subarray                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   Problem: Find contiguous subarray with largest sum                │
│   Input: [-2, 1, -3, 4, -1, 2, 1, -5, 4]                            │
│                                                                      │
│   Key Insight: At each position, decide:                            │
│   1. Start fresh from current element, OR                           │
│   2. Extend previous subarray with current element                  │
│                                                                      │
│   currentSum = max(element, currentSum + element)                   │
│                                                                      │
│   Index: 0    1    2    3    4    5    6    7    8                  │
│   Array: -2   1   -3    4   -1    2    1   -5    4                  │
│                                                                      │
│   i=0: curr = max(-2, 0+-2) = -2    maxSum = -2                     │
│   i=1: curr = max(1, -2+1) = 1      maxSum = 1                      │
│   i=2: curr = max(-3, 1+-3) = -2    maxSum = 1                      │
│   i=3: curr = max(4, -2+4) = 4      maxSum = 4   ← Start fresh!    │
│   i=4: curr = max(-1, 4+-1) = 3     maxSum = 4                      │
│   i=5: curr = max(2, 3+2) = 5       maxSum = 5                      │
│   i=6: curr = max(1, 5+1) = 6       maxSum = 6   ← Best so far!    │
│   i=7: curr = max(-5, 6+-5) = 1     maxSum = 6                      │
│   i=8: curr = max(4, 1+4) = 5       maxSum = 6                      │
│                                                                      │
│   Answer: 6 (subarray [4, -1, 2, 1])                                │
│                                                                      │
│   Time: O(n), Space: O(1)                                           │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Common Interview Algorithm Patterns

```javascript
// PATTERN 1: Frequency Counter / Hash Map
// Use for: Finding duplicates, counting occurrences, anagrams

function isAnagram(s1, s2) {
  if (s1.length !== s2.length) return false;
  
  const count = {};
  for (const char of s1) count[char] = (count[char] || 0) + 1;
  for (const char of s2) {
    if (!count[char]) return false;
    count[char]--;
  }
  return true;
}

// PATTERN 2: Multiple Pointers
// Use for: Sorted arrays, finding pairs, removing duplicates in-place

function removeDuplicates(nums) {
  if (nums.length === 0) return 0;
  
  let slow = 0;
  for (let fast = 1; fast < nums.length; fast++) {
    if (nums[fast] !== nums[slow]) {
      slow++;
      nums[slow] = nums[fast];
    }
  }
  return slow + 1;
}

// PATTERN 3: Sliding Window
// Use for: Contiguous subarrays, substring problems

function maxSumSubarray(arr, k) {
  let maxSum = 0;
  let windowSum = 0;
  
  // First window
  for (let i = 0; i < k; i++) windowSum += arr[i];
  maxSum = windowSum;
  
  // Slide window
  for (let i = k; i < arr.length; i++) {
    windowSum = windowSum - arr[i - k] + arr[i];
    maxSum = Math.max(maxSum, windowSum);
  }
  
  return maxSum;
}

// PATTERN 4: Fast & Slow Pointers (Floyd's Cycle)
// Use for: Linked list cycle detection, finding middle element

function hasCycle(head) {
  let slow = head;
  let fast = head;
  
  while (fast && fast.next) {
    slow = slow.next;
    fast = fast.next.next;
    if (slow === fast) return true;
  }
  return false;
}

// PATTERN 5: Binary Search
// Use for: Sorted data, finding target, min/max optimization

function binarySearch(arr, target) {
  let left = 0;
  let right = arr.length - 1;
  
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) left = mid + 1;
    else right = mid - 1;
  }
  
  return -1;
}
```

---

## DOM Manipulation

### DOM Utilities

```javascript
/**
 * Query selector with context
 */
function $(selector, context = document) {
  return context.querySelector(selector);
}

function $$(selector, context = document) {
  return [...context.querySelectorAll(selector)];
}

/**
 * Create element with attributes
 */
function createElement(tag, attributes = {}, children = []) {
  const element = document.createElement(tag);
  
  for (const [key, value] of Object.entries(attributes)) {
    if (key === 'className') {
      element.className = value;
    } else if (key === 'style' && typeof value === 'object') {
      Object.assign(element.style, value);
    } else if (key.startsWith('on') && typeof value === 'function') {
      element.addEventListener(key.slice(2).toLowerCase(), value);
    } else if (key === 'dataset') {
      Object.assign(element.dataset, value);
    } else {
      element.setAttribute(key, value);
    }
  }
  
  children.forEach(child => {
    if (typeof child === 'string') {
      element.appendChild(document.createTextNode(child));
    } else {
      element.appendChild(child);
    }
  });
  
  return element;
}

/**
 * Event delegation
 */
function delegate(parent, eventType, selector, handler) {
  parent.addEventListener(eventType, function(event) {
    const target = event.target.closest(selector);
    
    if (target && parent.contains(target)) {
      handler.call(target, event);
    }
  });
}

/**
 * Get/set data attributes
 */
function data(element, key, value) {
  if (value === undefined) {
    const val = element.dataset[key];
    try {
      return JSON.parse(val);
    } catch {
      return val;
    }
  }
  
  element.dataset[key] = typeof value === 'object' 
    ? JSON.stringify(value) 
    : value;
}

/**
 * Class manipulation
 */
function toggleClass(element, className, force) {
  if (force !== undefined) {
    return element.classList.toggle(className, force);
  }
  return element.classList.toggle(className);
}

function hasClass(element, className) {
  return element.classList.contains(className);
}

function addClass(element, ...classNames) {
  element.classList.add(...classNames);
}

function removeClass(element, ...classNames) {
  element.classList.remove(...classNames);
}

// Usage
const button = createElement('button', {
  className: 'btn btn-primary',
  onClick: () => console.log('clicked'),
  dataset: { id: 123 }
}, ['Click me']);

delegate(document.body, 'click', '.item', function(e) {
  console.log('Clicked item:', this);
});
```

### Virtual DOM Implementation (Simplified)

```javascript
// Virtual DOM node
function h(type, props = {}, ...children) {
  return {
    type,
    props: { ...props, children: children.flat() }
  };
}

// Render virtual DOM to real DOM
function render(vnode) {
  if (typeof vnode === 'string' || typeof vnode === 'number') {
    return document.createTextNode(vnode);
  }
  
  if (typeof vnode.type === 'function') {
    // Component
    return render(vnode.type(vnode.props));
  }
  
  const element = document.createElement(vnode.type);
  
  // Set props
  for (const [key, value] of Object.entries(vnode.props)) {
    if (key === 'children') continue;
    
    if (key.startsWith('on') && typeof value === 'function') {
      element.addEventListener(key.slice(2).toLowerCase(), value);
    } else if (key === 'className') {
      element.className = value;
    } else if (key === 'style' && typeof value === 'object') {
      Object.assign(element.style, value);
    } else {
      element.setAttribute(key, value);
    }
  }
  
  // Render children
  vnode.props.children
    .filter(child => child != null && child !== false)
    .forEach(child => element.appendChild(render(child)));
  
  return element;
}

// Diff and patch (simplified)
function diff(oldVNode, newVNode) {
  if (!oldVNode) return { type: 'CREATE', newVNode };
  if (!newVNode) return { type: 'REMOVE' };
  
  if (typeof oldVNode !== typeof newVNode ||
      (typeof oldVNode === 'string' && oldVNode !== newVNode) ||
      oldVNode.type !== newVNode.type) {
    return { type: 'REPLACE', newVNode };
  }
  
  if (newVNode.type) {
    return {
      type: 'UPDATE',
      props: diffProps(oldVNode.props, newVNode.props),
      children: diffChildren(oldVNode.props.children, newVNode.props.children)
    };
  }
  
  return null;
}

function patch(parent, patches, index = 0) {
  const element = parent.childNodes[index];
  
  switch (patches.type) {
    case 'CREATE':
      parent.appendChild(render(patches.newVNode));
      break;
    case 'REMOVE':
      parent.removeChild(element);
      break;
    case 'REPLACE':
      parent.replaceChild(render(patches.newVNode), element);
      break;
    case 'UPDATE':
      patchProps(element, patches.props);
      patches.children.forEach((childPatch, i) => {
        if (childPatch) patch(element, childPatch, i);
      });
      break;
  }
}

// Usage
const vdom = h('div', { className: 'container' },
  h('h1', {}, 'Hello'),
  h('button', { onClick: () => alert('Hi') }, 'Click')
);

document.body.appendChild(render(vdom));
```

---

## Interview Coding Challenges

### 1. Implement `instanceof`

```javascript
function myInstanceOf(obj, constructor) {
  if (obj === null || typeof obj !== 'object') {
    return false;
  }
  
  let proto = Object.getPrototypeOf(obj);
  
  while (proto !== null) {
    if (proto === constructor.prototype) {
      return true;
    }
    proto = Object.getPrototypeOf(proto);
  }
  
  return false;
}

// Test
myInstanceOf([], Array);  // true
myInstanceOf({}, Array);  // false
```

### 2. Implement `new` operator

```javascript
function myNew(Constructor, ...args) {
  // Create object with Constructor's prototype
  const obj = Object.create(Constructor.prototype);
  
  // Call constructor with new object as 'this'
  const result = Constructor.apply(obj, args);
  
  // If constructor returns object, use it; otherwise use obj
  return result instanceof Object ? result : obj;
}

// Test
function Person(name) { this.name = name; }
const p = myNew(Person, 'John');
console.log(p.name);  // 'John'
console.log(p instanceof Person);  // true
```

### 3. Implement `JSON.stringify`

```javascript
function myStringify(value) {
  if (value === null) return 'null';
  if (value === undefined) return undefined;
  
  const type = typeof value;
  
  if (type === 'boolean' || type === 'number') {
    return String(value);
  }
  
  if (type === 'string') {
    return `"${value.replace(/"/g, '\\"')}"`;
  }
  
  if (type === 'function' || type === 'symbol') {
    return undefined;
  }
  
  if (Array.isArray(value)) {
    const items = value.map(item => {
      const stringified = myStringify(item);
      return stringified === undefined ? 'null' : stringified;
    });
    return `[${items.join(',')}]`;
  }
  
  if (type === 'object') {
    const pairs = [];
    
    for (const key of Object.keys(value)) {
      const stringified = myStringify(value[key]);
      if (stringified !== undefined) {
        pairs.push(`"${key}":${stringified}`);
      }
    }
    
    return `{${pairs.join(',')}}`;
  }
  
  return undefined;
}

// Test
myStringify({ a: 1, b: 'hello', c: [1, 2, 3] });
// '{"a":1,"b":"hello","c":[1,2,3]}'
```

### 4. Implement `JSON.parse`

```javascript
function myParse(json) {
  let index = 0;
  
  function parseValue() {
    skipWhitespace();
    const char = json[index];
    
    if (char === '"') return parseString();
    if (char === '{') return parseObject();
    if (char === '[') return parseArray();
    if (char === 't') return parseTrue();
    if (char === 'f') return parseFalse();
    if (char === 'n') return parseNull();
    return parseNumber();
  }
  
  function skipWhitespace() {
    while (/\s/.test(json[index])) index++;
  }
  
  function parseString() {
    index++;  // Skip opening quote
    let result = '';
    
    while (json[index] !== '"') {
      if (json[index] === '\\') {
        index++;
        const escapes = { 'n': '\n', 't': '\t', 'r': '\r', '"': '"', '\\': '\\' };
        result += escapes[json[index]] || json[index];
      } else {
        result += json[index];
      }
      index++;
    }
    
    index++;  // Skip closing quote
    return result;
  }
  
  function parseNumber() {
    const start = index;
    if (json[index] === '-') index++;
    
    while (/\d/.test(json[index])) index++;
    if (json[index] === '.') {
      index++;
      while (/\d/.test(json[index])) index++;
    }
    
    return parseFloat(json.slice(start, index));
  }
  
  function parseObject() {
    index++;  // Skip {
    skipWhitespace();
    
    const result = {};
    
    if (json[index] === '}') {
      index++;
      return result;
    }
    
    while (true) {
      skipWhitespace();
      const key = parseString();
      skipWhitespace();
      index++;  // Skip :
      const value = parseValue();
      result[key] = value;
      skipWhitespace();
      
      if (json[index] === '}') {
        index++;
        break;
      }
      index++;  // Skip ,
    }
    
    return result;
  }
  
  function parseArray() {
    index++;  // Skip [
    skipWhitespace();
    
    const result = [];
    
    if (json[index] === ']') {
      index++;
      return result;
    }
    
    while (true) {
      result.push(parseValue());
      skipWhitespace();
      
      if (json[index] === ']') {
        index++;
        break;
      }
      index++;  // Skip ,
    }
    
    return result;
  }
  
  function parseTrue() {
    index += 4;
    return true;
  }
  
  function parseFalse() {
    index += 5;
    return false;
  }
  
  function parseNull() {
    index += 4;
    return null;
  }
  
  return parseValue();
}

// Test
myParse('{"a":1,"b":"hello","c":[1,2,3]}');
// { a: 1, b: 'hello', c: [1, 2, 3] }
```

### 5. Implement `setInterval` using `setTimeout`

```javascript
function mySetInterval(callback, delay, ...args) {
  let timeoutId;
  let isCancelled = false;
  
  function run() {
    if (isCancelled) return;
    callback.apply(null, args);
    timeoutId = setTimeout(run, delay);
  }
  
  timeoutId = setTimeout(run, delay);
  
  return {
    clear() {
      isCancelled = true;
      clearTimeout(timeoutId);
    }
  };
}

// Test
const interval = mySetInterval(() => console.log('tick'), 1000);
setTimeout(() => interval.clear(), 5000);  // Stop after 5 seconds
```

### 6. Implement `Promise.prototype.finally`

```javascript
Promise.prototype.myFinally = function(callback) {
  return this.then(
    value => Promise.resolve(callback()).then(() => value),
    reason => Promise.resolve(callback()).then(() => { throw reason; })
  );
};

// Test
Promise.resolve(42)
  .myFinally(() => console.log('cleanup'))
  .then(val => console.log(val));  // 'cleanup', 42
```

### 7. Implement Range

```javascript
function* range(start, end, step = 1) {
  if (end === undefined) {
    end = start;
    start = 0;
  }
  
  if (step > 0) {
    for (let i = start; i < end; i += step) {
      yield i;
    }
  } else {
    for (let i = start; i > end; i += step) {
      yield i;
    }
  }
}

// Test
[...range(5)];        // [0, 1, 2, 3, 4]
[...range(1, 5)];     // [1, 2, 3, 4]
[...range(0, 10, 2)]; // [0, 2, 4, 6, 8]
[...range(5, 0, -1)]; // [5, 4, 3, 2, 1]
```

### 8. Implement Observable

```javascript
class Observable {
  constructor(subscribe) {
    this._subscribe = subscribe;
  }
  
  subscribe(observer) {
    if (typeof observer === 'function') {
      observer = { next: observer };
    }
    
    const subscription = { unsubscribed: false };
    
    const safeObserver = {
      next: (value) => {
        if (!subscription.unsubscribed && observer.next) {
          observer.next(value);
        }
      },
      error: (err) => {
        if (!subscription.unsubscribed && observer.error) {
          observer.error(err);
          subscription.unsubscribed = true;
        }
      },
      complete: () => {
        if (!subscription.unsubscribed && observer.complete) {
          observer.complete();
          subscription.unsubscribed = true;
        }
      }
    };
    
    const cleanup = this._subscribe(safeObserver);
    
    return {
      unsubscribe() {
        subscription.unsubscribed = true;
        if (cleanup) cleanup();
      }
    };
  }
  
  map(fn) {
    return new Observable(observer => {
      return this.subscribe({
        next: value => observer.next(fn(value)),
        error: err => observer.error(err),
        complete: () => observer.complete()
      }).unsubscribe;
    });
  }
  
  filter(fn) {
    return new Observable(observer => {
      return this.subscribe({
        next: value => fn(value) && observer.next(value),
        error: err => observer.error(err),
        complete: () => observer.complete()
      }).unsubscribe;
    });
  }
  
  static fromEvent(element, eventName) {
    return new Observable(observer => {
      const handler = event => observer.next(event);
      element.addEventListener(eventName, handler);
      return () => element.removeEventListener(eventName, handler);
    });
  }
  
  static interval(ms) {
    return new Observable(observer => {
      let count = 0;
      const id = setInterval(() => observer.next(count++), ms);
      return () => clearInterval(id);
    });
  }
}

// Test
const clicks = Observable.fromEvent(document, 'click')
  .map(e => ({ x: e.clientX, y: e.clientY }))
  .filter(pos => pos.x > 100);

const sub = clicks.subscribe({
  next: pos => console.log('Click at', pos)
});

// sub.unsubscribe();
```

---

## Summary Cheat Sheet

```
┌─────────────────────────────────────────────────────────────────────┐
│                    CODING PATTERNS CHEAT SHEET                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   POLYFILLS                                                         │
│   • Promise: states (pending/fulfilled/rejected), then/catch/finally│
│   • Array: map/filter/reduce/forEach/find/flat                      │
│   • Function: bind/call/apply (use Symbol for context)              │
│   • Object: create/assign/keys/entries                              │
│                                                                      │
│   UTILITIES                                                         │
│   • Debounce: delay execution, reset on each call                   │
│   • Throttle: max once per interval                                 │
│   • Deep Clone: handle circular refs, Map/Set/Date/RegExp           │
│   • Curry: f(a,b,c) → f(a)(b)(c)                                    │
│   • Memoize: cache results by arguments                             │
│                                                                      │
│   ASYNC PATTERNS                                                    │
│   • Promise.all with limit                                          │
│   • Retry with exponential backoff                                  │
│   • Async queue with concurrency                                    │
│                                                                      │
│   DATA STRUCTURES                                                   │
│   • LRU Cache: Map maintains insertion order                        │
│   • Event Emitter: on/off/emit/once                                 │
│   • Trie: prefix search                                             │
│                                                                      │
│   ALGORITHMS                                                        │
│   • Two Sum: Hash map O(n)                                          │
│   • Sliding Window: for substring problems                          │
│   • Two Pointers: for sorted arrays                                 │
│   • Kadane's: max subarray O(n)                                     │
│                                                                      │
│   DOM                                                               │
│   • Event Delegation: listen on parent, check target                │
│   • Virtual DOM: diff and patch                                     │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Further Practice

- [LeetCode](https://leetcode.com/) - Coding challenges
- [JavaScript30](https://javascript30.com/) - DOM projects
- [Frontend Mentor](https://www.frontendmentor.io/) - UI challenges
- [Exercism](https://exercism.org/tracks/javascript) - Practice problems
- [Big Frontend Dev](https://bigfrontend.dev/) - Frontend-specific problems


