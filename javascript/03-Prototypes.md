# Prototypes in JavaScript: A Complete Guide

## Table of Contents

1. [Introduction](#introduction)
2. [What is a Prototype?](#what-is-a-prototype)
3. [__proto__ vs prototype](#__proto__-vs-prototype)
4. [The Prototype Chain](#the-prototype-chain)
5. [Constructor Functions](#constructor-functions)
6. [Object.create()](#objectcreate)
7. [ES6 Classes (Syntactic Sugar)](#es6-classes-syntactic-sugar)
8. [Inheritance Patterns](#inheritance-patterns)
9. [Built-in Prototypes](#built-in-prototypes)
10. [Prototype Methods](#prototype-methods)
11. [Common Patterns & Best Practices](#common-patterns--best-practices)
12. [Interview Questions](#interview-questions)

---

## Introduction

JavaScript is a **prototype-based language**. Unlike classical inheritance (Java, C++), JavaScript uses prototypes for inheritance. Every object in JavaScript has a hidden link to another object called its **prototype**.

```
┌─────────────────────────────────────────────────────────────────────┐
│                    TWO INHERITANCE MODELS                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   CLASSICAL INHERITANCE              PROTOTYPAL INHERITANCE          │
│   (Java, C++, C#)                    (JavaScript)                    │
│                                                                      │
│   ┌─────────────┐                    ┌─────────────┐                │
│   │    Class    │                    │   Object    │                │
│   │  (Blueprint)│                    │ (Prototype) │                │
│   └──────┬──────┘                    └──────┬──────┘                │
│          │                                  │                        │
│          │ instantiate                      │ delegate               │
│          ▼                                  ▼                        │
│   ┌─────────────┐                    ┌─────────────┐                │
│   │   Object    │                    │   Object    │                │
│   │  (Instance) │                    │   (Child)   │                │
│   └─────────────┘                    └─────────────┘                │
│                                                                      │
│   Classes are blueprints             Objects inherit directly        │
│   Objects are copies                 from other objects              │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## What is a Prototype?

A **prototype** is simply an object that other objects can delegate to (inherit from). When you try to access a property on an object, JavaScript will:

1. Look for the property on the object itself
2. If not found, look on its prototype
3. If not found, look on the prototype's prototype
4. Continue until reaching `null` (end of chain)

### Simple Example

```javascript
const animal = {
  eats: true,
  walk() {
    console.log("Animal walks");
  }
};

const rabbit = {
  jumps: true
};

// Set animal as the prototype of rabbit
rabbit.__proto__ = animal;

console.log(rabbit.jumps);  // true (own property)
console.log(rabbit.eats);   // true (inherited from animal)
rabbit.walk();              // "Animal walks" (inherited method)
```

**What happens when accessing `rabbit.eats`:**

```
┌─────────────────────────────────────────────────────────────────────┐
│                    PROPERTY LOOKUP                                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   rabbit.eats                                                        │
│      │                                                               │
│      ▼                                                               │
│   ┌─────────────────────────────────────────┐                       │
│   │  rabbit object                          │                       │
│   │  ┌─────────────────────────────────┐    │                       │
│   │  │  jumps: true                    │    │                       │
│   │  │  __proto__: animal ─────────────┼────┼───┐                   │
│   │  └─────────────────────────────────┘    │   │                   │
│   │                                         │   │                   │
│   │  Does rabbit have 'eats'? ❌ NO         │   │                   │
│   └─────────────────────────────────────────┘   │                   │
│                                                 │                   │
│   Follow __proto__ ◀────────────────────────────┘                   │
│      │                                                               │
│      ▼                                                               │
│   ┌─────────────────────────────────────────┐                       │
│   │  animal object (prototype)              │                       │
│   │  ┌─────────────────────────────────┐    │                       │
│   │  │  eats: true  ◀── FOUND!         │    │                       │
│   │  │  walk: function                 │    │                       │
│   │  │  __proto__: Object.prototype    │    │                       │
│   │  └─────────────────────────────────┘    │                       │
│   │                                         │                       │
│   │  Does animal have 'eats'? ✅ YES        │                       │
│   │  Return: true                           │                       │
│   └─────────────────────────────────────────┘                       │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## __proto__ vs prototype

This is one of the most confusing parts of JavaScript. Let's clarify:

### The Two Different Things

```
┌─────────────────────────────────────────────────────────────────────┐
│                __proto__ vs prototype                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   __proto__ (or [[Prototype]])                                       │
│   ┌────────────────────────────────────────────────────────────────┐│
│   │  • EXISTS ON EVERY OBJECT                                      ││
│   │  • Points to the object's prototype (parent)                   ││
│   │  • Used for property lookup (inheritance chain)                ││
│   │  • Accessor property (getter/setter)                           ││
│   │  • Modern: Object.getPrototypeOf() / Object.setPrototypeOf()   ││
│   └────────────────────────────────────────────────────────────────┘│
│                                                                      │
│   prototype                                                          │
│   ┌────────────────────────────────────────────────────────────────┐│
│   │  • EXISTS ONLY ON FUNCTIONS                                    ││
│   │  • An object that will become __proto__ of instances           ││
│   │  • Used when function is called with 'new' keyword             ││
│   │  • Contains shared methods for all instances                   ││
│   │  • Has a 'constructor' property pointing back to function      ││
│   └────────────────────────────────────────────────────────────────┘│
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Visual Explanation

```javascript
function Person(name) {
  this.name = name;
}

Person.prototype.greet = function() {
  console.log(`Hi, I'm ${this.name}`);
};

const john = new Person("John");
```

```
┌─────────────────────────────────────────────────────────────────────┐
│                    THE RELATIONSHIP                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   Person (function)                                                  │
│   ┌─────────────────────────────────────────┐                       │
│   │  name: "Person"                         │                       │
│   │  prototype: ─────────────────────────────┼──┐                   │
│   │  __proto__: Function.prototype          │  │                    │
│   └─────────────────────────────────────────┘  │                    │
│                                                │                    │
│                                                ▼                    │
│   Person.prototype (object)      ◀─────────────┘                    │
│   ┌─────────────────────────────────────────┐                       │
│   │  constructor: Person ───────────────────┼──▶ (points back)      │
│   │  greet: function                        │                       │
│   │  __proto__: Object.prototype            │                       │
│   └─────────────────────────────────────────┘                       │
│                         ▲                                            │
│                         │                                            │
│                         │ __proto__                                  │
│                         │                                            │
│   john (instance)       │                                            │
│   ┌─────────────────────┼───────────────────┐                       │
│   │  name: "John"       │                   │                       │
│   │  __proto__: ────────┘                   │                       │
│   └─────────────────────────────────────────┘                       │
│                                                                      │
│   john.greet()                                                       │
│   1. Does john have 'greet'? ❌                                      │
│   2. Does john.__proto__ (Person.prototype) have 'greet'? ✅        │
│   3. Execute greet()                                                 │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Code Verification

```javascript
function Person(name) {
  this.name = name;
}

Person.prototype.greet = function() {
  console.log(`Hi, I'm ${this.name}`);
};

const john = new Person("John");

// Verify the relationships
console.log(john.__proto__ === Person.prototype);  // true
console.log(Person.prototype.constructor === Person);  // true
console.log(john.constructor === Person);  // true (inherited)

// Modern way to get prototype
console.log(Object.getPrototypeOf(john) === Person.prototype);  // true
```

### Key Points

```javascript
// __proto__ - Every object has this
const obj = {};
console.log(obj.__proto__);  // Object.prototype

const arr = [];
console.log(arr.__proto__);  // Array.prototype

const fn = function() {};
console.log(fn.__proto__);   // Function.prototype

// prototype - Only functions have this
console.log(obj.prototype);  // undefined (obj is not a function)
console.log(arr.prototype);  // undefined (arr is not a function)
console.log(fn.prototype);   // {} (fn is a function, so it has prototype)
```

---

## The Prototype Chain

The **prototype chain** is the series of links between objects through their `__proto__` properties, ending at `null`.

### Complete Chain Example

```javascript
function Animal(name) {
  this.name = name;
}
Animal.prototype.eat = function() {
  console.log(`${this.name} eats`);
};

function Dog(name, breed) {
  Animal.call(this, name);  // Call parent constructor
  this.breed = breed;
}

// Set up inheritance
Dog.prototype = Object.create(Animal.prototype);
Dog.prototype.constructor = Dog;

Dog.prototype.bark = function() {
  console.log(`${this.name} barks!`);
};

const buddy = new Dog("Buddy", "Golden Retriever");
```

### Chain Visualization

```
┌─────────────────────────────────────────────────────────────────────┐
│                    PROTOTYPE CHAIN                                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   buddy                                                              │
│   ┌─────────────────────────────────────────┐                       │
│   │  name: "Buddy"                          │                       │
│   │  breed: "Golden Retriever"              │                       │
│   │  __proto__: ────────────────────────────┼──┐                    │
│   └─────────────────────────────────────────┘  │                    │
│                                                │                    │
│                                                ▼                    │
│   Dog.prototype                                                      │
│   ┌─────────────────────────────────────────┐                       │
│   │  constructor: Dog                       │                       │
│   │  bark: function                         │                       │
│   │  __proto__: ────────────────────────────┼──┐                    │
│   └─────────────────────────────────────────┘  │                    │
│                                                │                    │
│                                                ▼                    │
│   Animal.prototype                                                   │
│   ┌─────────────────────────────────────────┐                       │
│   │  constructor: Animal                    │                       │
│   │  eat: function                          │                       │
│   │  __proto__: ────────────────────────────┼──┐                    │
│   └─────────────────────────────────────────┘  │                    │
│                                                │                    │
│                                                ▼                    │
│   Object.prototype                                                   │
│   ┌─────────────────────────────────────────┐                       │
│   │  constructor: Object                    │                       │
│   │  toString: function                     │                       │
│   │  hasOwnProperty: function               │                       │
│   │  valueOf: function                      │                       │
│   │  ... (many more methods)                │                       │
│   │  __proto__: null ◀── END OF CHAIN       │                       │
│   └─────────────────────────────────────────┘                       │
│                                                                      │
│   Property Lookup for buddy.toString():                              │
│   buddy → Dog.prototype → Animal.prototype → Object.prototype ✅     │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Checking the Chain

```javascript
// Check chain membership
console.log(buddy instanceof Dog);     // true
console.log(buddy instanceof Animal);  // true
console.log(buddy instanceof Object);  // true

// Check direct prototype
console.log(Dog.prototype.isPrototypeOf(buddy));     // true
console.log(Animal.prototype.isPrototypeOf(buddy));  // true

// Walk the chain manually
console.log(buddy.__proto__);                           // Dog.prototype
console.log(buddy.__proto__.__proto__);                 // Animal.prototype
console.log(buddy.__proto__.__proto__.__proto__);       // Object.prototype
console.log(buddy.__proto__.__proto__.__proto__.__proto__);  // null
```

---

## Constructor Functions

Constructor functions are the traditional way to create objects with shared prototypes.

### Anatomy of a Constructor

```javascript
function Car(make, model, year) {
  // Instance properties (own properties)
  this.make = make;
  this.model = model;
  this.year = year;
  this.miles = 0;
}

// Shared methods (on prototype)
Car.prototype.drive = function(distance) {
  this.miles += distance;
  console.log(`Drove ${distance} miles. Total: ${this.miles}`);
};

Car.prototype.getInfo = function() {
  return `${this.year} ${this.make} ${this.model}`;
};

// Static method (on constructor itself)
Car.compare = function(car1, car2) {
  return car1.year - car2.year;
};

const tesla = new Car("Tesla", "Model 3", 2023);
const bmw = new Car("BMW", "M3", 2022);

tesla.drive(100);  // "Drove 100 miles. Total: 100"
console.log(tesla.getInfo());  // "2023 Tesla Model 3"
console.log(Car.compare(tesla, bmw));  // 1
```

### What `new` Does (Step by Step)

```javascript
const tesla = new Car("Tesla", "Model 3", 2023);

// Is equivalent to:
const tesla = (function() {
  // Step 1: Create empty object
  const obj = {};
  
  // Step 2: Link __proto__ to Constructor.prototype
  obj.__proto__ = Car.prototype;
  // Or: Object.setPrototypeOf(obj, Car.prototype);
  
  // Step 3: Call constructor with 'this' = obj
  const result = Car.call(obj, "Tesla", "Model 3", 2023);
  
  // Step 4: Return object (or result if it's an object)
  return result instanceof Object ? result : obj;
})();
```

```
┌─────────────────────────────────────────────────────────────────────┐
│                    WHAT 'new' DOES                                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   new Car("Tesla", "Model 3", 2023)                                  │
│                                                                      │
│   Step 1: Create empty object                                        │
│   ┌─────────────────────────────────────────┐                       │
│   │  {}                                     │                       │
│   └─────────────────────────────────────────┘                       │
│                      │                                               │
│                      ▼                                               │
│   Step 2: Set __proto__ to Car.prototype                             │
│   ┌─────────────────────────────────────────┐                       │
│   │  __proto__: Car.prototype               │                       │
│   └─────────────────────────────────────────┘                       │
│                      │                                               │
│                      ▼                                               │
│   Step 3: Execute constructor with this = obj                        │
│   ┌─────────────────────────────────────────┐                       │
│   │  make: "Tesla"                          │                       │
│   │  model: "Model 3"                       │                       │
│   │  year: 2023                             │                       │
│   │  miles: 0                               │                       │
│   │  __proto__: Car.prototype               │                       │
│   └─────────────────────────────────────────┘                       │
│                      │                                               │
│                      ▼                                               │
│   Step 4: Return the object                                          │
│   ┌─────────────────────────────────────────┐                       │
│   │  tesla = {                              │                       │
│   │    make: "Tesla",                       │                       │
│   │    model: "Model 3",                    │                       │
│   │    year: 2023,                          │                       │
│   │    miles: 0,                            │                       │
│   │    __proto__: Car.prototype             │                       │
│   │  }                                      │                       │
│   └─────────────────────────────────────────┘                       │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Why Put Methods on Prototype?

```javascript
// ❌ BAD: Methods defined in constructor
function BadCar(make) {
  this.make = make;
  this.drive = function() {  // New function created for EACH instance!
    console.log("Driving...");
  };
}

const car1 = new BadCar("Toyota");
const car2 = new BadCar("Honda");
console.log(car1.drive === car2.drive);  // false (different functions!)

// ✅ GOOD: Methods on prototype
function GoodCar(make) {
  this.make = make;
}
GoodCar.prototype.drive = function() {  // Shared by ALL instances
  console.log("Driving...");
};

const car3 = new GoodCar("Toyota");
const car4 = new GoodCar("Honda");
console.log(car3.drive === car4.drive);  // true (same function!)
```

```
┌─────────────────────────────────────────────────────────────────────┐
│                    MEMORY COMPARISON                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   ❌ Methods in Constructor (Wasteful)                               │
│                                                                      │
│   car1                    car2                    car3               │
│   ┌──────────────┐        ┌──────────────┐        ┌──────────────┐  │
│   │ make: "A"    │        │ make: "B"    │        │ make: "C"    │  │
│   │ drive: fn1   │        │ drive: fn2   │        │ drive: fn3   │  │
│   └──────────────┘        └──────────────┘        └──────────────┘  │
│        ↓                       ↓                       ↓            │
│   [Function]              [Function]              [Function]        │
│   (copy 1)                (copy 2)                (copy 3)          │
│                                                                      │
│   3 instances = 3 function copies in memory! 😱                      │
│                                                                      │
│   ─────────────────────────────────────────────────────────────────  │
│                                                                      │
│   ✅ Methods on Prototype (Efficient)                                │
│                                                                      │
│   car1              car2              car3                           │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│   │ make: "A"    │  │ make: "B"    │  │ make: "C"    │              │
│   │ __proto__    │  │ __proto__    │  │ __proto__    │              │
│   └──────┬───────┘  └──────┬───────┘  └──────┬───────┘              │
│          │                 │                 │                       │
│          └─────────────────┼─────────────────┘                       │
│                            ▼                                         │
│                 ┌──────────────────────┐                             │
│                 │  Car.prototype       │                             │
│                 │  drive: function     │  ← Single shared copy!      │
│                 └──────────────────────┘                             │
│                                                                      │
│   3 instances = 1 function copy! 👍                                  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Object.create()

`Object.create()` creates a new object with the specified prototype.

### Basic Usage

```javascript
// Create object with specific prototype
const animal = {
  eat() {
    console.log(`${this.name} is eating`);
  },
  sleep() {
    console.log(`${this.name} is sleeping`);
  }
};

const dog = Object.create(animal);
dog.name = "Buddy";
dog.bark = function() {
  console.log(`${this.name} barks!`);
};

dog.eat();    // "Buddy is eating" (inherited)
dog.bark();   // "Buddy barks!" (own method)
```

### Object.create() with Property Descriptors

```javascript
const person = Object.create(Object.prototype, {
  name: {
    value: "John",
    writable: true,
    enumerable: true,
    configurable: true
  },
  age: {
    value: 30,
    writable: false,  // Cannot be changed
    enumerable: true,
    configurable: false
  }
});

console.log(person.name);  // "John"
person.name = "Jane";      // Works
console.log(person.name);  // "Jane"

person.age = 25;           // Silently fails (strict mode: TypeError)
console.log(person.age);   // 30
```

### Create Object with No Prototype

```javascript
// Object with no prototype (truly empty)
const bareObject = Object.create(null);

console.log(bareObject.toString);  // undefined (no inherited methods!)
console.log(bareObject.__proto__); // undefined

// Useful for dictionaries (no prototype pollution)
bareObject.key = "value";
console.log("toString" in bareObject);  // false (truly empty)
```

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Object.create() OPTIONS                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   Object.create(proto)           Object.create(null)                 │
│                                                                      │
│   ┌─────────────────┐            ┌─────────────────┐                │
│   │  new object     │            │  new object     │                │
│   │  __proto__: ────┼──┐         │  (no proto!)    │                │
│   └─────────────────┘  │         └─────────────────┘                │
│                        ▼                                             │
│                ┌──────────────┐         No inheritance chain         │
│                │    proto     │         No toString, valueOf, etc.   │
│                │   (object)   │         Pure dictionary/map          │
│                └──────────────┘                                      │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Object.create() for Inheritance

```javascript
function Shape(color) {
  this.color = color;
}
Shape.prototype.describe = function() {
  return `A ${this.color} shape`;
};

function Circle(color, radius) {
  Shape.call(this, color);  // Call parent constructor
  this.radius = radius;
}

// Set up prototype chain
Circle.prototype = Object.create(Shape.prototype);
Circle.prototype.constructor = Circle;

// Add Circle-specific methods
Circle.prototype.area = function() {
  return Math.PI * this.radius ** 2;
};

const redCircle = new Circle("red", 5);
console.log(redCircle.describe());  // "A red shape"
console.log(redCircle.area());      // 78.54...
```

---

## ES6 Classes (Syntactic Sugar)

ES6 classes are **syntactic sugar** over the prototype-based inheritance. Under the hood, it's still prototypes!

### Class Syntax

```javascript
class Animal {
  // Constructor
  constructor(name) {
    this.name = name;
  }
  
  // Instance method (goes on prototype)
  speak() {
    console.log(`${this.name} makes a sound`);
  }
  
  // Static method (goes on class itself)
  static isAnimal(obj) {
    return obj instanceof Animal;
  }
  
  // Getter
  get info() {
    return `Animal: ${this.name}`;
  }
  
  // Setter
  set nickname(value) {
    this.name = value;
  }
}

class Dog extends Animal {
  constructor(name, breed) {
    super(name);  // Call parent constructor
    this.breed = breed;
  }
  
  // Override parent method
  speak() {
    console.log(`${this.name} barks!`);
  }
  
  // Call parent method
  speakPolitely() {
    super.speak();  // Calls Animal's speak
    console.log("(wagging tail)");
  }
}

const dog = new Dog("Buddy", "Golden Retriever");
dog.speak();         // "Buddy barks!"
dog.speakPolitely(); // "Buddy makes a sound" + "(wagging tail)"
```

### Class vs Constructor Function (Same Thing!)

```javascript
// ES6 Class
class PersonClass {
  constructor(name) {
    this.name = name;
  }
  greet() {
    console.log(`Hi, I'm ${this.name}`);
  }
  static create(name) {
    return new PersonClass(name);
  }
}

// Equivalent Constructor Function
function PersonFunction(name) {
  this.name = name;
}
PersonFunction.prototype.greet = function() {
  console.log(`Hi, I'm ${this.name}`);
};
PersonFunction.create = function(name) {
  return new PersonFunction(name);
};

// They work the same way!
const p1 = new PersonClass("John");
const p2 = new PersonFunction("Jane");

console.log(typeof PersonClass);   // "function" (classes ARE functions!)
console.log(p1.__proto__ === PersonClass.prototype);  // true
```

### Proof: Classes are Prototype-Based

```javascript
class MyClass {
  constructor(value) {
    this.value = value;
  }
  getValue() {
    return this.value;
  }
}

// Classes are just functions
console.log(typeof MyClass);  // "function"

// Methods are on prototype
console.log(MyClass.prototype.getValue);  // [Function: getValue]

// Instances link to prototype
const instance = new MyClass(42);
console.log(instance.__proto__ === MyClass.prototype);  // true

// You can even modify the prototype!
MyClass.prototype.doubled = function() {
  return this.value * 2;
};
console.log(instance.doubled());  // 84
```

```
┌─────────────────────────────────────────────────────────────────────┐
│                    CLASS = SYNTACTIC SUGAR                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   class Dog extends Animal {        function Dog(name) {             │
│     constructor(name) {               Animal.call(this, name);       │
│       super(name);              →   }                                │
│     }                               Dog.prototype =                  │
│     bark() { ... }                    Object.create(Animal.prototype)│
│   }                                 Dog.prototype.constructor = Dog; │
│                                     Dog.prototype.bark = function(){}│
│                                                                      │
│   SAME RESULT, DIFFERENT SYNTAX!                                     │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Private Fields (ES2022)

```javascript
class BankAccount {
  #balance = 0;  // Private field (truly private!)
  
  constructor(initialBalance) {
    this.#balance = initialBalance;
  }
  
  deposit(amount) {
    if (amount > 0) {
      this.#balance += amount;
    }
  }
  
  getBalance() {
    return this.#balance;
  }
  
  // Private method
  #validateAmount(amount) {
    return amount > 0 && amount <= this.#balance;
  }
  
  withdraw(amount) {
    if (this.#validateAmount(amount)) {
      this.#balance -= amount;
      return amount;
    }
    return 0;
  }
}

const account = new BankAccount(100);
console.log(account.getBalance());  // 100
// console.log(account.#balance);   // SyntaxError: Private field!
```

---

## Inheritance Patterns

### Pattern 1: Prototypal Inheritance (Object.create)

```javascript
const vehicleProto = {
  init(make, model) {
    this.make = make;
    this.model = model;
    return this;
  },
  getInfo() {
    return `${this.make} ${this.model}`;
  }
};

const carProto = Object.create(vehicleProto);
carProto.drive = function() {
  console.log(`${this.getInfo()} is driving`);
};

const myCar = Object.create(carProto).init("Toyota", "Camry");
myCar.drive();  // "Toyota Camry is driving"
```

### Pattern 2: Constructor Inheritance

```javascript
function Vehicle(make, model) {
  this.make = make;
  this.model = model;
}

Vehicle.prototype.getInfo = function() {
  return `${this.make} ${this.model}`;
};

function Car(make, model, doors) {
  Vehicle.call(this, make, model);  // Inherit properties
  this.doors = doors;
}

// Inherit methods
Car.prototype = Object.create(Vehicle.prototype);
Car.prototype.constructor = Car;

Car.prototype.honk = function() {
  console.log("Beep beep!");
};

const myCar = new Car("Honda", "Civic", 4);
```

### Pattern 3: Class Inheritance (ES6+)

```javascript
class Vehicle {
  constructor(make, model) {
    this.make = make;
    this.model = model;
  }
  
  getInfo() {
    return `${this.make} ${this.model}`;
  }
}

class Car extends Vehicle {
  constructor(make, model, doors) {
    super(make, model);
    this.doors = doors;
  }
  
  honk() {
    console.log("Beep beep!");
  }
}

class ElectricCar extends Car {
  constructor(make, model, doors, batteryCapacity) {
    super(make, model, doors);
    this.batteryCapacity = batteryCapacity;
  }
  
  charge() {
    console.log("Charging...");
  }
}
```

### Pattern 4: Mixin Pattern (Multiple Inheritance)

```javascript
// JavaScript doesn't support multiple inheritance, but we can use mixins

const canSwim = {
  swim() {
    console.log(`${this.name} is swimming`);
  }
};

const canFly = {
  fly() {
    console.log(`${this.name} is flying`);
  }
};

const canWalk = {
  walk() {
    console.log(`${this.name} is walking`);
  }
};

class Animal {
  constructor(name) {
    this.name = name;
  }
}

class Duck extends Animal {
  constructor(name) {
    super(name);
  }
}

// Apply mixins
Object.assign(Duck.prototype, canSwim, canFly, canWalk);

const donald = new Duck("Donald");
donald.swim();  // "Donald is swimming"
donald.fly();   // "Donald is flying"
donald.walk();  // "Donald is walking"
```

```
┌─────────────────────────────────────────────────────────────────────┐
│                    MIXIN PATTERN                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   canSwim         canFly          canWalk                            │
│   ┌─────────┐     ┌─────────┐     ┌─────────┐                       │
│   │ swim()  │     │  fly()  │     │ walk()  │                       │
│   └────┬────┘     └────┬────┘     └────┬────┘                       │
│        │               │               │                             │
│        └───────────────┼───────────────┘                             │
│                        │                                             │
│                        ▼  Object.assign()                            │
│              ┌─────────────────────┐                                 │
│              │   Duck.prototype    │                                 │
│              │   ┌───────────────┐ │                                 │
│              │   │ swim()        │ │  ← All methods merged!          │
│              │   │ fly()         │ │                                 │
│              │   │ walk()        │ │                                 │
│              │   └───────────────┘ │                                 │
│              └─────────────────────┘                                 │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Built-in Prototypes

Every built-in type has its own prototype with useful methods.

### The Prototype Hierarchy

```
┌─────────────────────────────────────────────────────────────────────┐
│                    BUILT-IN PROTOTYPES                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│                           null                                       │
│                             ▲                                        │
│                             │                                        │
│                    ┌────────┴────────┐                              │
│                    │ Object.prototype │ ← Base of everything        │
│                    │ toString()       │                              │
│                    │ hasOwnProperty() │                              │
│                    │ valueOf()        │                              │
│                    └────────┬────────┘                              │
│           ┌─────────────────┼─────────────────┐                     │
│           │                 │                 │                     │
│           ▼                 ▼                 ▼                     │
│   ┌───────────────┐ ┌───────────────┐ ┌───────────────┐            │
│   │Array.prototype│ │Function.proto │ │String.prototype│            │
│   │ push()        │ │ call()        │ │ charAt()      │            │
│   │ pop()         │ │ apply()       │ │ slice()       │            │
│   │ map()         │ │ bind()        │ │ split()       │            │
│   │ filter()      │ │               │ │ trim()        │            │
│   └───────┬───────┘ └───────────────┘ └───────┬───────┘            │
│           │                                   │                     │
│           ▼                                   ▼                     │
│   ┌───────────────┐                   ┌───────────────┐            │
│   │ [1, 2, 3]     │                   │ "hello"       │            │
│   │ (array)       │                   │ (string)      │            │
│   └───────────────┘                   └───────────────┘            │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Verifying Built-in Chains

```javascript
// Array
const arr = [1, 2, 3];
console.log(arr.__proto__ === Array.prototype);  // true
console.log(arr.__proto__.__proto__ === Object.prototype);  // true
console.log(arr.__proto__.__proto__.__proto__ === null);  // true

// Function
function fn() {}
console.log(fn.__proto__ === Function.prototype);  // true
console.log(fn.__proto__.__proto__ === Object.prototype);  // true

// String (primitive is wrapped)
const str = "hello";
console.log(str.__proto__ === String.prototype);  // true

// Number
const num = 42;
console.log(num.__proto__ === Number.prototype);  // true
```

### Extending Built-in Prototypes (⚠️ Use with Caution!)

```javascript
// Adding method to all arrays
Array.prototype.first = function() {
  return this[0];
};

Array.prototype.last = function() {
  return this[this.length - 1];
};

const numbers = [1, 2, 3, 4, 5];
console.log(numbers.first());  // 1
console.log(numbers.last());   // 5

// ⚠️ WARNING: This is generally considered bad practice!
// - Can conflict with future JS features
// - Can conflict with other libraries
// - Pollutes global namespace
// - Makes code less predictable

// ✅ Better approach: Create utility functions
const arrayUtils = {
  first: (arr) => arr[0],
  last: (arr) => arr[arr.length - 1]
};
```

---

## Prototype Methods

### Important Methods for Working with Prototypes

```javascript
const proto = { x: 10 };
const obj = Object.create(proto);
obj.y = 20;

// Object.getPrototypeOf() - Get the prototype
console.log(Object.getPrototypeOf(obj) === proto);  // true

// Object.setPrototypeOf() - Set the prototype (slow, avoid if possible)
const newProto = { z: 30 };
Object.setPrototypeOf(obj, newProto);

// obj.hasOwnProperty() - Check if property is own (not inherited)
console.log(obj.hasOwnProperty('y'));  // true
console.log(obj.hasOwnProperty('z'));  // false (inherited)

// 'in' operator - Check if property exists (including inherited)
console.log('y' in obj);  // true
console.log('z' in obj);  // true (finds in prototype)

// Object.keys() - Only own enumerable properties
console.log(Object.keys(obj));  // ['y']

// for...in - All enumerable properties (including inherited)
for (let key in obj) {
  console.log(key);  // 'y', 'z'
}

// Object.getOwnPropertyNames() - All own properties (including non-enumerable)
console.log(Object.getOwnPropertyNames(obj));  // ['y']

// isPrototypeOf() - Check if object is in prototype chain
console.log(proto.isPrototypeOf(obj));     // false (changed!)
console.log(newProto.isPrototypeOf(obj));  // true
```

### Property Descriptors and Prototypes

```javascript
const obj = {};

Object.defineProperty(obj, 'readonly', {
  value: 42,
  writable: false,
  enumerable: true,
  configurable: false
});

Object.defineProperty(obj, 'hidden', {
  value: 'secret',
  writable: true,
  enumerable: false,  // Won't show in for...in or Object.keys()
  configurable: true
});

console.log(obj.readonly);  // 42
obj.readonly = 100;         // Silently fails (or TypeError in strict mode)
console.log(obj.readonly);  // 42

console.log(Object.keys(obj));  // ['readonly'] - 'hidden' not shown
console.log(obj.hidden);        // 'secret' - but accessible directly
```

---

## Common Patterns & Best Practices

### Pattern: Factory Functions with Shared Prototype

```javascript
const personMethods = {
  greet() {
    console.log(`Hi, I'm ${this.name}`);
  },
  haveBirthday() {
    this.age++;
    console.log(`Happy birthday! Now ${this.age}`);
  }
};

function createPerson(name, age) {
  const person = Object.create(personMethods);
  person.name = name;
  person.age = age;
  return person;
}

const john = createPerson("John", 30);
john.greet();         // "Hi, I'm John"
john.haveBirthday();  // "Happy birthday! Now 31"
```

### Pattern: Composition over Inheritance

```javascript
// Instead of deep inheritance chains, compose behaviors

const canEat = (state) => ({
  eat() {
    console.log(`${state.name} is eating`);
    state.energy += 10;
  }
});

const canSleep = (state) => ({
  sleep() {
    console.log(`${state.name} is sleeping`);
    state.energy += 20;
  }
});

const canPlay = (state) => ({
  play() {
    console.log(`${state.name} is playing`);
    state.energy -= 5;
  }
});

function createDog(name) {
  const state = {
    name,
    energy: 100
  };
  
  return {
    ...state,
    ...canEat(state),
    ...canSleep(state),
    ...canPlay(state),
    bark() {
      console.log(`${state.name} barks!`);
    }
  };
}

const dog = createDog("Buddy");
dog.eat();   // "Buddy is eating"
dog.sleep(); // "Buddy is sleeping"
dog.play();  // "Buddy is playing"
dog.bark();  // "Buddy barks!"
```

### Best Practices Summary

```
┌─────────────────────────────────────────────────────────────────────┐
│                    PROTOTYPE BEST PRACTICES                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   ✅ DO:                                                             │
│   • Put shared methods on prototype (memory efficient)               │
│   • Use Object.create() for clean prototype chains                   │
│   • Use ES6 classes for clarity (they're still prototypes!)         │
│   • Use Object.getPrototypeOf() instead of __proto__                │
│   • Check hasOwnProperty() when iterating with for...in             │
│   • Favor composition over deep inheritance                          │
│                                                                      │
│   ❌ DON'T:                                                          │
│   • Modify built-in prototypes (Array, Object, etc.)                │
│   • Create deep inheritance chains (> 2-3 levels)                   │
│   • Use Object.setPrototypeOf() in hot code paths (slow)            │
│   • Rely on __proto__ in production code (use standard methods)     │
│   • Put instance-specific data on prototype                          │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Interview Questions

### Q1: What's the output?

```javascript
function Animal() {}
Animal.prototype.speak = function() {
  return "Some sound";
};

function Dog() {}
Dog.prototype = Object.create(Animal.prototype);

const dog = new Dog();
console.log(dog.speak());
console.log(dog.constructor === Dog);
```

<details>
<summary>Answer</summary>

```
"Some sound"
false
```

**Explanation:**
- `dog.speak()` works because `Dog.prototype` inherits from `Animal.prototype`
- `dog.constructor` is `false` because we replaced `Dog.prototype` but didn't reset `constructor`
- Fix: Add `Dog.prototype.constructor = Dog;` after setting up inheritance

</details>

### Q2: What's the output?

```javascript
const obj = {
  a: 1,
  b: 2
};

const child = Object.create(obj);
child.c = 3;

console.log(Object.keys(child));
console.log('a' in child);
console.log(child.hasOwnProperty('a'));
```

<details>
<summary>Answer</summary>

```
['c']
true
false
```

**Explanation:**
- `Object.keys()` only returns own enumerable properties: `['c']`
- `'a' in child` checks entire prototype chain: `true`
- `hasOwnProperty('a')` checks only own properties: `false` (a is inherited)

</details>

### Q3: What's the output?

```javascript
function Foo() {
  return this;
}
Foo.prototype.getValue = function() {
  return 42;
};

const a = Foo();
const b = new Foo();

console.log(a.getValue);
console.log(b.getValue());
```

<details>
<summary>Answer</summary>

```
undefined
42
```

**Explanation:**
- `Foo()` without `new`: `this` is global object (window), returns global
- Global object doesn't have `getValue`, so `undefined`
- `new Foo()`: Creates new object linked to `Foo.prototype`
- `b.getValue()` finds the method on prototype and returns `42`

</details>

### Q4: Explain what happens here

```javascript
Array.prototype.sum = function() {
  return this.reduce((a, b) => a + b, 0);
};

const nums = [1, 2, 3];
console.log(nums.sum());

const nums2 = [4, 5, 6];
console.log(nums2.sum());
```

<details>
<summary>Answer</summary>

```
6
15
```

**Explanation:**
- We added `sum` method to `Array.prototype`
- ALL arrays now have access to this method
- Both `nums` and `nums2` can use `sum()` through prototype chain
- This works but is considered bad practice (modifying built-ins)

</details>

### Q5: What's the output?

```javascript
function Person(name) {
  this.name = name;
}

const john = new Person("John");
const jane = new Person("Jane");

Person.prototype.greet = function() {
  console.log(`Hi, I'm ${this.name}`);
};

john.greet();
jane.greet();

Person.prototype = {
  goodbye() {
    console.log("Goodbye!");
  }
};

john.greet();
const jim = new Person("Jim");
jim.greet();
```

<details>
<summary>Answer</summary>

```
Hi, I'm John
Hi, I'm Jane
Hi, I'm John
TypeError: jim.greet is not a function
```

**Explanation:**
- `john` and `jane` are created before prototype modification
- Adding `greet` to prototype works for both
- Replacing entire prototype doesn't affect existing instances
- `john` still has reference to OLD `Person.prototype`
- `jim` is created after replacement, linked to NEW prototype (no `greet`)

</details>

### Q6: What's the difference?

```javascript
// Version A
function Car(make) {
  this.make = make;
  this.drive = function() {
    console.log("Driving");
  };
}

// Version B
function Car(make) {
  this.make = make;
}
Car.prototype.drive = function() {
  console.log("Driving");
};
```

<details>
<summary>Answer</summary>

**Version A:**
- Creates a NEW function for every instance
- Each `car.drive` is a different function object
- More memory usage
- Use when method needs closure over constructor variables

**Version B:**
- Single function shared by all instances
- All instances reference the same function
- Memory efficient
- Use for most cases (recommended)

```javascript
// Version A
const a1 = new Car("Toyota");
const a2 = new Car("Honda");
console.log(a1.drive === a2.drive);  // false (different functions)

// Version B
const b1 = new Car("Toyota");
const b2 = new Car("Honda");
console.log(b1.drive === b2.drive);  // true (same function)
```

</details>

---

## Summary Cheat Sheet

```
┌─────────────────────────────────────────────────────────────────────┐
│                    PROTOTYPE CHEAT SHEET                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   __proto__                                                          │
│   • Every object has it                                              │
│   • Points to object's prototype (parent)                            │
│   • Used for property lookup                                         │
│   • Modern: Object.getPrototypeOf(obj)                              │
│                                                                      │
│   prototype                                                          │
│   • Only functions have it                                           │
│   • Becomes __proto__ of instances created with 'new'               │
│   • Place to put shared methods                                      │
│                                                                      │
│   Prototype Chain                                                    │
│   obj → obj.__proto__ → obj.__proto__.__proto__ → ... → null        │
│                                                                      │
│   Key Relationships                                                  │
│   instance.__proto__ === Constructor.prototype                       │
│   Constructor.prototype.constructor === Constructor                  │
│   Object.getPrototypeOf(instance) === Constructor.prototype         │
│                                                                      │
│   Creating Objects                                                   │
│   • Object literal: { }                                              │
│   • new Constructor()                                                │
│   • Object.create(proto)                                             │
│   • class syntax                                                     │
│                                                                      │
│   Property Lookup                                                    │
│   1. Check own properties                                            │
│   2. Check __proto__                                                 │
│   3. Check __proto__.__proto__                                       │
│   4. Continue until null                                             │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Further Reading

- [MDN: Object prototypes](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Objects/Object_prototypes)
- [MDN: Inheritance and the prototype chain](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Inheritance_and_the_prototype_chain)
- [JavaScript.info: Prototypes](https://javascript.info/prototypes)
- [You Don't Know JS: this & Object Prototypes](https://github.com/getify/You-Dont-Know-JS/tree/2nd-ed/objects-classes)



