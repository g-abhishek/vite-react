# Chapter 6: Indexes 📇

Indexes are essential for query performance in MongoDB. They allow the database to find documents without scanning every document in a collection.

---

## Index Basics

### How Indexes Work

```
Without Index:
┌─────────────────────────────────────────────────┐
│  Scan every document in collection (COLLSCAN)   │
│  Time: O(n) - linear with collection size       │
└─────────────────────────────────────────────────┘

With Index:
┌─────────────────────────────────────────────────┐
│  Navigate B-tree structure to find matches      │
│  Time: O(log n) - much faster for large data   │
└─────────────────────────────────────────────────┘
```

### Default _id Index

```javascript
// Every collection has an index on _id
db.collection.getIndexes()
// [ { v: 2, key: { _id: 1 }, name: "_id_" } ]

// _id lookups are always fast
db.users.find({ _id: ObjectId("...") })  // Uses index
```

---

## Creating Indexes

### Single Field Index

```javascript
// Create ascending index
db.users.createIndex({ email: 1 })

// Create descending index
db.users.createIndex({ createdAt: -1 })

// With options
db.users.createIndex(
    { email: 1 },
    { 
        name: "email_index",
        unique: true,
        background: true  // Deprecated in 4.2+, now always background
    }
)

// Check creation result
// { createdCollectionAutomatically: false, numIndexesBefore: 1, numIndexesAfter: 2, ok: 1 }
```

### Compound Index

```javascript
// Index on multiple fields
db.orders.createIndex({ customerId: 1, orderDate: -1 })

// Order matters! Supports queries:
db.orders.find({ customerId: "123" })                           // ✓
db.orders.find({ customerId: "123", orderDate: { $gt: date } }) // ✓
db.orders.find({ customerId: "123" }).sort({ orderDate: -1 })   // ✓
db.orders.find({ orderDate: { $gt: date } })                    // ✗ Can't use index

// Index prefix rule:
// Index: { a: 1, b: 1, c: 1 }
// Supports: { a: 1 }, { a: 1, b: 1 }, { a: 1, b: 1, c: 1 }
// Does NOT support: { b: 1 }, { c: 1 }, { b: 1, c: 1 }
```

### Multikey Index (Arrays)

```javascript
// Automatically created when indexing array field
db.products.createIndex({ tags: 1 })

// Works with:
db.products.find({ tags: "electronics" })
db.products.find({ tags: { $in: ["electronics", "gadgets"] } })

// Limitations:
// - Can only have ONE array field in compound index
// - Cannot create compound index with multiple array fields

// This fails:
db.products.createIndex({ tags: 1, colors: 1 })  // If both are arrays
```

---

## Index Types

### Unique Index

```javascript
// Prevent duplicate values
db.users.createIndex({ email: 1 }, { unique: true })

// Null values count as duplicates
// Only ONE document can have null/missing value

// Compound unique index
db.subscriptions.createIndex(
    { userId: 1, planId: 1 },
    { unique: true }
)
// Same user can't subscribe to same plan twice

// Partial unique (unique only for certain documents)
db.users.createIndex(
    { email: 1 },
    { 
        unique: true,
        partialFilterExpression: { email: { $exists: true } }
    }
)
```

### Sparse Index

```javascript
// Only include documents that have the indexed field
db.users.createIndex({ phone: 1 }, { sparse: true })

// Documents without 'phone' field are NOT indexed
// Smaller index size
// BUT: Some queries may not use sparse index

// Better alternative: Partial Index
db.users.createIndex(
    { phone: 1 },
    { partialFilterExpression: { phone: { $exists: true } } }
)
```

### Partial Index

```javascript
// Index only documents matching filter
db.orders.createIndex(
    { customerId: 1, orderDate: -1 },
    {
        partialFilterExpression: {
            status: "active"
        }
    }
)

// Smaller index, faster updates
// Query must include filter expression to use index
db.orders.find({ customerId: "123", status: "active" })  // Uses index
db.orders.find({ customerId: "123" })                    // May not use index
```

### TTL Index (Time-To-Live)

```javascript
// Automatically delete documents after time period
db.sessions.createIndex(
    { createdAt: 1 },
    { expireAfterSeconds: 3600 }  // Delete after 1 hour
)

// Document deleted when: createdAt + expireAfterSeconds < now

// Use cases:
// - Session tokens
// - Temporary data
// - Logs with retention policy

// Change expiration time
db.runCommand({
    collMod: "sessions",
    index: {
        keyPattern: { createdAt: 1 },
        expireAfterSeconds: 7200
    }
})
```

### Text Index

```javascript
// Full-text search index
db.articles.createIndex({ title: "text", content: "text" })

// Only ONE text index per collection
// Search using $text operator
db.articles.find({ $text: { $search: "mongodb tutorial" } })

// With weights
db.articles.createIndex(
    { title: "text", content: "text" },
    { weights: { title: 10, content: 5 } }
)

// Wildcard text index (all string fields)
db.articles.createIndex({ "$**": "text" })
```

### Geospatial Indexes

```javascript
// 2dsphere for GeoJSON (Earth-like sphere)
db.locations.createIndex({ coordinates: "2dsphere" })

// Document format
db.locations.insertOne({
    name: "Coffee Shop",
    coordinates: {
        type: "Point",
        coordinates: [-73.97, 40.77]  // [longitude, latitude]
    }
})

// Find near a point
db.locations.find({
    coordinates: {
        $near: {
            $geometry: { type: "Point", coordinates: [-73.97, 40.77] },
            $maxDistance: 1000
        }
    }
})

// 2d for flat surfaces (legacy)
db.places.createIndex({ position: "2d" })
```

### Wildcard Index

```javascript
// Index all fields in a document
db.collection.createIndex({ "$**": 1 })

// Index all fields under specific path
db.products.createIndex({ "attributes.$**": 1 })

// Useful for:
// - Dynamic/unpredictable schemas
// - JSONB-like data

// Exclusions
db.products.createIndex(
    { "$**": 1 },
    { wildcardProjection: { metadata: 0 } }
)
```

### Hashed Index

```javascript
// For hash-based sharding
db.users.createIndex({ username: "hashed" })

// Only supports equality queries
db.users.find({ username: "john" })  // ✓
db.users.find({ username: { $gt: "j" } })  // ✗ Cannot use index
```

---

## Index Properties

### Background Building

```javascript
// In MongoDB 4.2+, all index builds are background by default
db.users.createIndex({ email: 1 })

// Builds don't block reads/writes
// But may take longer and use more resources
```

### Hidden Index

```javascript
// Hide index without dropping
db.users.hideIndex("email_1")

// Query planner won't consider hidden index
// Useful for testing impact before dropping

// Unhide
db.users.unhideIndex("email_1")

// Create as hidden
db.users.createIndex({ email: 1 }, { hidden: true })
```

### Case-Insensitive Index

```javascript
// Using collation
db.users.createIndex(
    { email: 1 },
    { collation: { locale: "en", strength: 2 } }
)

// Queries must use same collation
db.users.find({ email: "JOHN@EXAMPLE.COM" })
    .collation({ locale: "en", strength: 2 })
```

---

## Managing Indexes

### View Indexes

```javascript
// List all indexes
db.users.getIndexes()

// Get index statistics
db.users.aggregate([{ $indexStats: {} }])

// Index size
db.users.stats().indexSizes
```

### Drop Indexes

```javascript
// Drop by name
db.users.dropIndex("email_1")

// Drop by specification
db.users.dropIndex({ email: 1 })

// Drop all indexes (except _id)
db.users.dropIndexes()

// Drop multiple specific indexes
db.users.dropIndexes(["email_1", "name_1"])
```

### Rebuild Indexes

```javascript
// Rebuild all indexes
db.users.reIndex()

// In production, prefer dropping and recreating
// reIndex() blocks all operations
```

---

## Query Analysis with explain()

### Using explain()

```javascript
// Execution stats
db.users.find({ email: "john@example.com" }).explain("executionStats")

// Key fields to look at:
{
    "executionStats": {
        "nReturned": 1,              // Documents returned
        "executionTimeMillis": 0,     // Time taken
        "totalKeysExamined": 1,       // Index entries scanned
        "totalDocsExamined": 1,       // Documents scanned
        "executionStages": {
            "stage": "IXSCAN",        // IXSCAN = Index Scan (good!)
            "indexName": "email_1",
            // ...
        }
    }
}

// Query planner mode
db.users.find({ email: "john@example.com" }).explain("queryPlanner")

// All plans examined
db.users.find({ email: "john@example.com" }).explain("allPlansExecution")
```

### Stage Types

```javascript
// Good stages:
// IXSCAN     - Index scan (using index)
// IDHACK     - Query on _id
// FETCH      - Retrieve documents using index
// COUNT_SCAN - Using index to count
// PROJECTION_COVERED - All fields in index (no FETCH needed)

// Bad stages:
// COLLSCAN   - Collection scan (full table scan)
// SORT       - In-memory sort (not using index)

// Check for COLLSCAN
const explain = db.users.find({ name: "John" }).explain()
if (explain.queryPlanner.winningPlan.stage === "COLLSCAN") {
    print("Warning: Collection scan detected!")
}
```

### Covered Queries

```javascript
// Query entirely satisfied by index (no document fetch)
db.users.createIndex({ email: 1, name: 1 })

// This is a covered query
db.users.find(
    { email: "john@example.com" },
    { email: 1, name: 1, _id: 0 }  // Only indexed fields, exclude _id
).explain()
// Stage should be PROJECTION_COVERED or IXSCAN without FETCH
```

---

## Index Strategies

### ESR Rule (Equality, Sort, Range)

```javascript
// For compound indexes, order fields:
// 1. Equality conditions first
// 2. Sort fields next
// 3. Range conditions last

// Query: Find active users in city, sorted by date
db.users.find({
    status: "active",       // Equality
    city: "New York",       // Equality
    age: { $gte: 21 }       // Range
}).sort({ createdAt: -1 })  // Sort

// Optimal index:
db.users.createIndex({
    status: 1,              // Equality
    city: 1,                // Equality
    createdAt: -1,          // Sort
    age: 1                  // Range
})
```

### Index for Sorting

```javascript
// Index can satisfy sort
db.orders.createIndex({ orderDate: -1 })
db.orders.find().sort({ orderDate: -1 })  // Uses index

// Compound sort
db.orders.createIndex({ customerId: 1, orderDate: -1 })
db.orders.find({ customerId: "123" }).sort({ orderDate: -1 })  // Uses index

// Sort direction matters for compound indexes
// Index: { a: 1, b: 1 }
// Supports: sort({ a: 1, b: 1 }) or sort({ a: -1, b: -1 })
// Does NOT support: sort({ a: 1, b: -1 })
```

### When NOT to Index

```javascript
// Small collections (few hundred documents)
// - Full scan might be faster

// Fields with low selectivity
// - Boolean fields (true/false)
// - Status with few values

// Frequently updated fields
// - Index maintenance overhead

// Write-heavy workloads
// - Each index adds write overhead
```

---

## Index Performance

### Monitor Index Usage

```javascript
// Index usage statistics
db.users.aggregate([{ $indexStats: {} }])

// Result:
{
    "name": "email_1",
    "accesses": {
        "ops": 1234,        // Number of operations using this index
        "since": ISODate()
    }
}

// Find unused indexes
db.users.aggregate([
    { $indexStats: {} },
    { $match: { "accesses.ops": 0 } }
])
```

### Index Size Considerations

```javascript
// Check index sizes
db.users.stats().indexSizes
// { "_id_": 229376, "email_1": 180224, "name_1_age_1": 212992 }

// Total index size
db.users.totalIndexSize()

// Indexes should fit in RAM for best performance
```

---

## Practice Exercises

### Exercise 1: Basic Indexes
1. Create a single field index on `email`
2. Create a compound index on `status` and `createdAt`
3. Verify indexes with `getIndexes()`

### Exercise 2: Special Indexes
1. Create a unique index on `username`
2. Create a TTL index for session expiration
3. Create a text index for search

### Exercise 3: Query Analysis
1. Run a query and check explain output
2. Identify if it's using IXSCAN or COLLSCAN
3. Add appropriate index and compare

### Exercise 4: Optimization
1. Analyze a slow query with explain()
2. Apply ESR rule to design optimal index
3. Verify performance improvement

---

## Summary

In this chapter, you learned:
- ✅ How indexes work (B-tree, COLLSCAN vs IXSCAN)
- ✅ Single, compound, and multikey indexes
- ✅ Unique, sparse, partial, and TTL indexes
- ✅ Text, geospatial, and wildcard indexes
- ✅ Using explain() for query analysis
- ✅ ESR rule for compound index design
- ✅ Index management and monitoring

---

**Next Chapter:** [Schema Design →](./07-Schema-Design.md)



