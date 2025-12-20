# Chapter 4: Query Operators 🔍

MongoDB provides powerful query operators for filtering, comparing, and matching documents.

---

## Comparison Operators

### $eq (Equals)

```javascript
// Implicit equality
db.products.find({ price: 99.99 })

// Explicit $eq
db.products.find({ price: { $eq: 99.99 } })

// Match null or missing
db.products.find({ discount: { $eq: null } })
```

### $ne (Not Equal)

```javascript
// Find products NOT in Electronics category
db.products.find({ category: { $ne: "Electronics" } })

// Note: $ne also matches documents where field doesn't exist
// To exclude non-existent fields, combine with $exists
db.products.find({ 
    category: { $ne: "Electronics", $exists: true } 
})
```

### $gt, $gte, $lt, $lte

```javascript
// Greater than
db.products.find({ price: { $gt: 100 } })

// Greater than or equal
db.products.find({ price: { $gte: 100 } })

// Less than
db.products.find({ stock: { $lt: 50 } })

// Less than or equal
db.products.find({ stock: { $lte: 50 } })

// Range query (combining operators)
db.products.find({ 
    price: { $gte: 100, $lte: 500 } 
})

// Date comparisons
db.orders.find({ 
    createdAt: { $gte: new Date("2024-01-01") } 
})

// Multiple conditions
db.products.find({
    price: { $gte: 50, $lte: 200 },
    stock: { $gt: 0 }
})
```

### $in (In Array)

```javascript
// Match any value in array
db.products.find({ 
    category: { $in: ["Electronics", "Furniture"] } 
})

// With _id
db.products.find({ 
    _id: { $in: [
        ObjectId("..."),
        ObjectId("..."),
        ObjectId("...")
    ]} 
})

// With numbers
db.products.find({ price: { $in: [99.99, 199.99, 299.99] } })
```

### $nin (Not In Array)

```javascript
// Match values NOT in array
db.products.find({ 
    category: { $nin: ["Electronics", "Furniture"] } 
})

// Note: Also matches documents where field doesn't exist
```

---

## Logical Operators

### $and

```javascript
// Implicit AND (comma-separated)
db.products.find({ 
    category: "Electronics",
    price: { $lt: 500 }
})

// Explicit $and (required for same field)
db.products.find({
    $and: [
        { price: { $gt: 100 } },
        { price: { $lt: 500 } }
    ]
})

// Same field with different operators
db.products.find({
    $and: [
        { tags: "sale" },
        { tags: "featured" }
    ]
})
```

### $or

```javascript
// Match any condition
db.products.find({
    $or: [
        { category: "Electronics" },
        { price: { $lt: 50 } }
    ]
})

// Complex OR with AND
db.products.find({
    $or: [
        { category: "Electronics", price: { $lt: 500 } },
        { category: "Furniture", price: { $lt: 200 } }
    ]
})

// Combined with other conditions
db.products.find({
    stock: { $gt: 0 },
    $or: [
        { category: "Electronics" },
        { category: "Furniture" }
    ]
})
```

### $not

```javascript
// Negate a condition
db.products.find({ 
    price: { $not: { $gt: 100 } } 
})
// Equivalent to price <= 100 OR price doesn't exist

// With regex
db.products.find({ 
    name: { $not: /^[A-Z]/ } 
})

// Note: $not only affects the operator it wraps
```

### $nor

```javascript
// None of the conditions match
db.products.find({
    $nor: [
        { category: "Electronics" },
        { price: { $lt: 50 } }
    ]
})
// Products that are NOT Electronics AND NOT less than $50
```

---

## Element Operators

### $exists

```javascript
// Field exists
db.products.find({ discount: { $exists: true } })

// Field does NOT exist
db.products.find({ discount: { $exists: false } })

// Combine with other operators
db.products.find({ 
    discount: { $exists: true, $gt: 0 } 
})
```

### $type

```javascript
// Match by BSON type
db.products.find({ price: { $type: "double" } })
db.products.find({ price: { $type: "number" } })  // Any numeric type
db.products.find({ tags: { $type: "array" } })

// Type aliases:
// "double", "string", "object", "array", "binData",
// "objectId", "bool", "date", "null", "regex",
// "int", "timestamp", "long", "decimal", "number"

// Multiple types
db.products.find({ 
    field: { $type: ["string", "null"] } 
})

// Find fields with wrong type (data cleanup)
db.products.find({ 
    price: { $not: { $type: "number" } } 
})
```

---

## Evaluation Operators

### $regex

```javascript
// Regular expression matching
db.products.find({ 
    name: { $regex: /laptop/i }  // Case-insensitive
})

// Alternative syntax
db.products.find({ 
    name: { $regex: "laptop", $options: "i" } 
})

// Pattern matching
db.products.find({ name: { $regex: /^Pro/ } })   // Starts with
db.products.find({ name: { $regex: /Pro$/ } })   // Ends with
db.products.find({ name: { $regex: /.*phone.*/ } }) // Contains

// Options:
// i - case insensitive
// m - multiline
// x - extended (ignore whitespace)
// s - dotall (. matches newline)

// For better performance, prefer anchored patterns (^...)
// and create text index for full-text search
```

### $expr

```javascript
// Compare fields within document
db.products.find({
    $expr: { $gt: ["$stock", "$minStock"] }
})

// Compare with calculation
db.products.find({
    $expr: { 
        $lt: [
            { $multiply: ["$price", "$quantity"] },
            1000
        ]
    }
})

// Use aggregation operators in find
db.orders.find({
    $expr: {
        $eq: [
            { $year: "$createdAt" },
            2024
        ]
    }
})

// Complex expression
db.products.find({
    $expr: {
        $and: [
            { $gte: ["$stock", 10] },
            { $lte: ["$price", 100] }
        ]
    }
})
```

### $mod

```javascript
// Modulo operation
// Find documents where field % divisor === remainder
db.products.find({ 
    stock: { $mod: [10, 0] }  // stock divisible by 10
})

db.products.find({ 
    qty: { $mod: [2, 1] }  // Odd numbers
})
```

### $text

```javascript
// Full-text search (requires text index)
db.products.createIndex({ name: "text", description: "text" })

// Search
db.products.find({ 
    $text: { $search: "laptop wireless" }  // OR search
})

// Phrase search
db.products.find({ 
    $text: { $search: "\"wireless mouse\"" }  // Exact phrase
})

// Exclude terms
db.products.find({ 
    $text: { $search: "laptop -gaming" }  // laptop but not gaming
})

// With score
db.products.find(
    { $text: { $search: "laptop" } },
    { score: { $meta: "textScore" } }
).sort({ score: { $meta: "textScore" } })

// Language and case sensitivity
db.products.find({
    $text: {
        $search: "café",
        $language: "french",
        $caseSensitive: false,
        $diacriticSensitive: false
    }
})
```

### $where

```javascript
// JavaScript expression (SLOW - avoid in production)
db.products.find({
    $where: function() {
        return this.price > 100 && this.stock > 10;
    }
})

// Or as string
db.products.find({
    $where: "this.price > 100 && this.stock > 10"
})

// ⚠️ Avoid $where - it's slow and can't use indexes
// Use $expr with aggregation operators instead
```

---

## Array Operators

### $all

```javascript
// Match all specified elements
db.products.find({ 
    tags: { $all: ["featured", "sale"] } 
})
// Both "featured" AND "sale" must be in tags array

// Order doesn't matter
db.products.find({ 
    tags: { $all: ["sale", "featured"] }  // Same result
})
```

### $elemMatch

```javascript
// Match array element with multiple conditions
db.orders.find({
    items: {
        $elemMatch: {
            product: "Laptop",
            quantity: { $gt: 1 }
        }
    }
})

// Without $elemMatch (different behavior!)
db.orders.find({
    "items.product": "Laptop",
    "items.quantity": { $gt: 1 }
})
// This finds orders where ANY item is Laptop AND ANY item qty > 1
// Not necessarily the SAME item!

// Complex conditions
db.users.find({
    scores: {
        $elemMatch: {
            $gte: 80,
            $lt: 90
        }
    }
})
```

### $size

```javascript
// Match array with exact size
db.products.find({ tags: { $size: 3 } })

// ⚠️ $size doesn't work with ranges
// For range, use aggregation or store length as field
db.products.find({ 
    $expr: { $gte: [{ $size: "$tags" }, 3] } 
})
```

### Querying Array Elements

```javascript
// Query array by index
db.products.find({ "ratings.0": 5 })  // First rating is 5

// Query nested arrays
db.orders.find({ "items.0.product": "Laptop" })

// Any element matches
db.products.find({ ratings: 5 })  // Any rating is 5

// Embedded documents in arrays
db.orders.find({ "items.product": "Laptop" })
```

---

## Geospatial Operators

### $near

```javascript
// Create 2dsphere index
db.places.createIndex({ location: "2dsphere" })

// Find near a point
db.places.find({
    location: {
        $near: {
            $geometry: {
                type: "Point",
                coordinates: [-73.97, 40.77]  // [longitude, latitude]
            },
            $maxDistance: 1000,  // meters
            $minDistance: 100
        }
    }
})
```

### $geoWithin

```javascript
// Find within polygon
db.places.find({
    location: {
        $geoWithin: {
            $geometry: {
                type: "Polygon",
                coordinates: [[
                    [-73.99, 40.75],
                    [-73.98, 40.75],
                    [-73.98, 40.76],
                    [-73.99, 40.76],
                    [-73.99, 40.75]
                ]]
            }
        }
    }
})

// Circle (legacy coordinates)
db.places.find({
    location: {
        $geoWithin: {
            $centerSphere: [[-73.97, 40.77], 1 / 3963.2]  // radius in radians
        }
    }
})
```

### $geoIntersects

```javascript
// Find locations that intersect with a geometry
db.places.find({
    location: {
        $geoIntersects: {
            $geometry: {
                type: "Polygon",
                coordinates: [[/* ... */]]
            }
        }
    }
})
```

---

## Bitwise Operators

```javascript
// $bitsAllSet - All specified bits are set
db.collection.find({ 
    flags: { $bitsAllSet: [1, 5] }  // Bits at positions 1 and 5 are set
})

// $bitsAnySet - Any specified bit is set
db.collection.find({ 
    flags: { $bitsAnySet: [1, 5] } 
})

// $bitsAllClear - All specified bits are clear
db.collection.find({ 
    flags: { $bitsAllClear: [1, 5] } 
})

// $bitsAnyClear - Any specified bit is clear
db.collection.find({ 
    flags: { $bitsAnyClear: [1, 5] } 
})

// With bitmask
db.collection.find({ 
    flags: { $bitsAllSet: 0b00100010 } 
})
```

---

## Projection Operators

### $ (Positional)

```javascript
// Return only the matched array element
db.products.find(
    { ratings: 5 },
    { "ratings.$": 1 }
)
// Returns only the first matching element (5)
```

### $elemMatch (Projection)

```javascript
// Return first element matching criteria
db.orders.find(
    { status: "shipped" },
    {
        items: {
            $elemMatch: { quantity: { $gt: 2 } }
        }
    }
)
```

### $slice

```javascript
// Return subset of array
db.posts.find({}, { comments: { $slice: 5 } })      // First 5
db.posts.find({}, { comments: { $slice: -5 } })     // Last 5
db.posts.find({}, { comments: { $slice: [10, 5] } }) // Skip 10, return 5
```

### $meta

```javascript
// Return text search score
db.products.find(
    { $text: { $search: "laptop" } },
    { score: { $meta: "textScore" } }
)
```

---

## Complex Query Examples

### Multi-Condition Query

```javascript
db.products.find({
    $and: [
        { category: "Electronics" },
        { price: { $gte: 100, $lte: 500 } },
        { stock: { $gt: 0 } },
        { 
            $or: [
                { tags: "featured" },
                { ratings: { $gte: 4 } }
            ]
        }
    ]
})
```

### Search with Sorting and Pagination

```javascript
db.products.find({
    category: { $in: ["Electronics", "Furniture"] },
    price: { $lte: 1000 }
})
.sort({ price: -1 })
.skip(20)
.limit(10)
```

### Date Range Query

```javascript
const startOfMonth = new Date("2024-01-01");
const endOfMonth = new Date("2024-02-01");

db.orders.find({
    createdAt: {
        $gte: startOfMonth,
        $lt: endOfMonth
    }
})
```

---

## Practice Exercises

### Exercise 1: Comparison Operators
1. Find products priced between $50 and $200
2. Find customers NOT from USA
3. Find orders from the last 30 days

### Exercise 2: Logical Operators
1. Find products that are Electronics OR under $50
2. Find customers who have "premium" tag AND are from USA
3. Find products that are NOT in stock

### Exercise 3: Array Operators
1. Find products with exactly 3 tags
2. Find orders containing items with quantity > 5
3. Find products with all ratings >= 4

### Exercise 4: Complex Queries
1. Build a product search with category, price range, and text
2. Find inactive customers (no orders in 6 months)
3. Find products matching multiple criteria with pagination

---

## Summary

In this chapter, you learned:
- ✅ Comparison: $eq, $ne, $gt, $gte, $lt, $lte, $in, $nin
- ✅ Logical: $and, $or, $not, $nor
- ✅ Element: $exists, $type
- ✅ Evaluation: $regex, $expr, $text, $where
- ✅ Array: $all, $elemMatch, $size
- ✅ Geospatial: $near, $geoWithin, $geoIntersects
- ✅ Projection: $, $elemMatch, $slice, $meta

---

**Next Chapter:** [Aggregation Framework →](./05-Aggregation-Framework.md)




