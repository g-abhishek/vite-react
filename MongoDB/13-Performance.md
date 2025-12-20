# Chapter 13: Performance 🚀

Optimizing MongoDB performance requires understanding query patterns, proper indexing, and system configuration.

---

## Query Optimization

### Using explain()

```javascript
// Execution statistics
db.orders.find({ customerId: "C123" }).explain("executionStats")

// Key metrics to watch:
{
    "executionStats": {
        "nReturned": 10,           // Documents returned
        "executionTimeMillis": 2,   // Time taken
        "totalKeysExamined": 10,    // Index entries scanned
        "totalDocsExamined": 10     // Documents scanned
    },
    "queryPlanner": {
        "winningPlan": {
            "stage": "IXSCAN"       // Index scan (good!)
        }
    }
}

// Ideal: nReturned ≈ totalKeysExamined ≈ totalDocsExamined
```

### Query Plan Stages

```javascript
// Good stages:
// IXSCAN       - Index scan
// IDHACK       - Fast _id lookup
// FETCH        - Retrieve documents
// PROJECTION   - Reduce returned fields
// COUNT_SCAN   - Counting using index

// Bad stages (fix these):
// COLLSCAN     - Collection scan (full table scan)
// SORT         - In-memory sort (no index)
// SORT_KEY_GENERATOR - Sorting large results

// Check winning plan
const explain = db.orders.find({ status: "pending" }).explain();
if (explain.queryPlanner.winningPlan.stage === "COLLSCAN") {
    print("WARNING: Collection scan detected!");
}
```

### Index Optimization

```javascript
// 1. Create indexes for frequent queries
db.orders.createIndex({ customerId: 1 })

// 2. Use compound indexes strategically
// ESR Rule: Equality, Sort, Range
db.orders.createIndex({ status: 1, orderDate: -1, total: 1 })

// 3. Use covered queries
// All fields in projection are in index
db.orders.find(
    { customerId: "C123" },
    { customerId: 1, orderDate: 1, _id: 0 }
)

// 4. Avoid negation operators
// Bad: $ne, $nin, $not don't use indexes well
db.orders.find({ status: { $ne: "cancelled" } })  // May not use index

// Good: Use positive conditions
db.orders.find({ status: { $in: ["pending", "shipped"] } })
```

---

## Profiler

### Enable Profiling

```javascript
// Set profiling level
// 0 = Off
// 1 = Log slow operations
// 2 = Log all operations

db.setProfilingLevel(1, { slowms: 100 })  // Log queries > 100ms

// Check current level
db.getProfilingStatus()
```

### Query Profiler Data

```javascript
// Find slow queries
db.system.profile.find({
    millis: { $gt: 100 }
}).sort({ ts: -1 }).limit(10)

// Find collection scans
db.system.profile.find({
    "planSummary": "COLLSCAN"
}).sort({ ts: -1 })

// Find queries by collection
db.system.profile.find({
    ns: "mydb.orders"
}).sort({ millis: -1 }).limit(10)

// Aggregation for slow query patterns
db.system.profile.aggregate([
    { $match: { millis: { $gt: 100 } } },
    { $group: {
        _id: "$query",
        count: { $sum: 1 },
        avgTime: { $avg: "$millis" },
        maxTime: { $max: "$millis" }
    }},
    { $sort: { avgTime: -1 } }
])
```

---

## Connection Pooling

### Node.js Driver

```javascript
const { MongoClient } = require('mongodb');

const client = new MongoClient(uri, {
    // Connection pool settings
    maxPoolSize: 100,           // Max connections (default: 100)
    minPoolSize: 5,             // Min connections (default: 0)
    maxIdleTimeMS: 30000,       // Close idle connections after 30s
    waitQueueTimeoutMS: 10000,  // Wait 10s for available connection
    
    // Timeouts
    connectTimeoutMS: 10000,    // Connection timeout
    socketTimeoutMS: 45000,     // Socket timeout
    serverSelectionTimeoutMS: 30000
});

// Monitor pool events
client.on('connectionPoolCreated', (event) => {
    console.log('Pool created:', event.address);
});

client.on('connectionCheckedOut', (event) => {
    console.log('Connection checked out');
});

client.on('connectionPoolClosed', (event) => {
    console.log('Pool closed');
});
```

### Mongoose

```javascript
const mongoose = require('mongoose');

mongoose.connect(uri, {
    maxPoolSize: 100,
    minPoolSize: 5,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000
});

// Check connection status
mongoose.connection.on('connected', () => console.log('Connected'));
mongoose.connection.on('error', (err) => console.error('Error:', err));
mongoose.connection.on('disconnected', () => console.log('Disconnected'));
```

---

## Memory Optimization

### WiredTiger Cache

```javascript
// mongod.conf
storage:
  wiredTiger:
    engineConfig:
      cacheSizeGB: 4  // 50% of RAM minus 1GB

// Check cache usage
db.serverStatus().wiredTiger.cache

// Key metrics:
// - bytes currently in cache
// - maximum bytes configured
// - tracked dirty bytes in cache
```

### Working Set

```javascript
// Working set = frequently accessed data + indexes
// Should fit in RAM for best performance

// Check database/collection sizes
db.stats()
db.collection.stats()

// Index sizes
db.collection.stats().indexSizes

// Total index size should fit in RAM
db.collection.totalIndexSize()
```

---

## Write Performance

### Bulk Operations

```javascript
// Bad: Individual inserts
for (const doc of documents) {
    await collection.insertOne(doc);  // Slow!
}

// Good: Bulk insert
await collection.insertMany(documents, { ordered: false });

// Bulk write mixed operations
await collection.bulkWrite([
    { insertOne: { document: { name: "A" } } },
    { updateOne: { filter: { _id: 1 }, update: { $set: { x: 1 } } } },
    { deleteOne: { filter: { _id: 2 } } }
], { ordered: false });

// ordered: false = Continue on error, better parallelism
```

### Write Concern Trade-offs

```javascript
// Fastest (dangerous)
{ writeConcern: { w: 0 } }  // No acknowledgment

// Balanced
{ writeConcern: { w: 1 } }  // Default, primary ack

// Safest (slower)
{ writeConcern: { w: "majority", j: true } }  // Majority + journal

// Choose based on data criticality
```

### Batch Size

```javascript
// For large updates, batch to avoid long-running operations
const BATCH_SIZE = 1000;

let processed = 0;
while (true) {
    const result = await collection.updateMany(
        { status: "old", processed: { $ne: true } },
        { $set: { status: "new", processed: true } },
        { limit: BATCH_SIZE }  // Process in batches
    );
    
    if (result.modifiedCount === 0) break;
    processed += result.modifiedCount;
}
```

---

## Read Performance

### Projection

```javascript
// Only retrieve needed fields
// Bad
db.orders.find({ customerId: "C123" })

// Good
db.orders.find(
    { customerId: "C123" },
    { orderId: 1, total: 1, status: 1 }  // Only needed fields
)

// Exclude large fields
db.posts.find({}, { content: 0, comments: 0 })
```

### Limit and Skip

```javascript
// Always limit results
db.orders.find({ status: "pending" }).limit(100)

// Avoid large skip values (inefficient)
db.orders.find().skip(100000).limit(10)  // Slow!

// Use cursor-based pagination instead
db.orders.find({ _id: { $gt: lastSeenId } })
    .sort({ _id: 1 })
    .limit(10)
```

### Read Preferences

```javascript
// Distribute reads across replica set
const db = client.db('mydb', {
    readPreference: 'secondaryPreferred'
});

// Per-query read preference
db.orders.find().readPref('secondary')
```

---

## Aggregation Performance

### Pipeline Optimization

```javascript
// 1. $match early
db.orders.aggregate([
    { $match: { status: "completed" } },  // Filter first!
    { $group: { _id: "$customerId", total: { $sum: "$amount" } } }
])

// 2. $project to reduce document size
db.orders.aggregate([
    { $match: { status: "completed" } },
    { $project: { customerId: 1, amount: 1 } },  // Reduce size
    { $group: { _id: "$customerId", total: { $sum: "$amount" } } }
])

// 3. Use indexes
// $match and $sort at beginning can use indexes
db.orders.aggregate([
    { $match: { orderDate: { $gte: startDate } } },  // Uses index
    { $sort: { orderDate: -1 } }  // Uses index
])
```

### Allow Disk Use

```javascript
// For large aggregations that exceed memory limit
db.orders.aggregate(
    [
        { $group: { _id: "$customerId", orders: { $push: "$$ROOT" } } }
    ],
    { allowDiskUse: true }
)

// Default memory limit: 100MB per stage
// allowDiskUse enables spilling to disk
```

---

## Monitoring

### Server Status

```javascript
db.serverStatus()

// Key sections:
// connections - Connection pool usage
// opcounters - Operation counts
// mem - Memory usage
// wiredTiger - Storage engine stats
// network - Network traffic
```

### Current Operations

```javascript
// View active operations
db.currentOp()

// Filter long-running operations
db.currentOp({ "secs_running": { $gt: 10 } })

// Filter by type
db.currentOp({ "op": "query" })

// Kill operation
db.killOp(opId)
```

### MongoDB Atlas Monitoring

```javascript
// Atlas provides:
// - Real-time Performance Advisor
// - Index recommendations
// - Slow query analysis
// - Alert configuration
// - Query targeting metrics
```

---

## Common Performance Issues

### 1. Missing Indexes

```javascript
// Symptom: COLLSCAN in explain()
// Solution: Add appropriate index

db.orders.createIndex({ customerId: 1, orderDate: -1 })
```

### 2. Unbounded Arrays

```javascript
// Symptom: Growing document size, slow updates
// Solution: Reference pattern or bucket pattern

// Instead of:
{ items: [/* 10000+ items */] }

// Use separate collection:
// orders: { _id, ... }
// order_items: { orderId, item, ... }
```

### 3. Large Documents

```javascript
// Symptom: Slow reads/writes, memory pressure
// Solution: Split large documents, use GridFS for files

// Check document sizes
db.collection.find().forEach(doc => {
    const size = Object.bsonsize(doc);
    if (size > 1000000) {  // 1MB
        print(`Large doc: ${doc._id}, ${size} bytes`);
    }
});
```

### 4. Too Many Indexes

```javascript
// Symptom: Slow writes
// Solution: Remove unused indexes

// Find unused indexes
db.collection.aggregate([{ $indexStats: {} }])
    .filter(idx => idx.accesses.ops === 0)
```

---

## Performance Checklist

```markdown
## Query Performance
□ All frequent queries use indexes
□ No COLLSCAN in explain output
□ Covered queries where possible
□ Proper projections

## Write Performance
□ Bulk operations for batch writes
□ Appropriate write concern
□ No unbounded arrays

## System Configuration
□ WiredTiger cache sized correctly
□ Connection pool configured
□ Read preference for replica sets

## Monitoring
□ Profiler enabled for slow queries
□ Index usage monitored
□ Alerts for performance degradation
```

---

## Summary

In this chapter, you learned:
- ✅ Using explain() for query analysis
- ✅ Index optimization strategies
- ✅ Database profiler usage
- ✅ Connection pooling configuration
- ✅ Memory and cache optimization
- ✅ Write and read performance tuning
- ✅ Aggregation optimization
- ✅ Monitoring tools and metrics

---

**Next Chapter:** [Mongoose ODM →](./14-Mongoose-ODM.md)




