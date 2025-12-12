# Chapter 16: Interview Questions 💼

Common MongoDB interview questions from beginner to advanced level with detailed answers.

---

## Beginner Level

### Q1: What is MongoDB? How is it different from SQL databases?

**Answer:**
MongoDB is a document-oriented NoSQL database that stores data in flexible, JSON-like documents (BSON). Key differences from SQL:

| Aspect | MongoDB | SQL |
|--------|---------|-----|
| Data Model | Documents (JSON) | Tables (Rows/Columns) |
| Schema | Flexible/Dynamic | Fixed/Rigid |
| Scaling | Horizontal (Sharding) | Vertical (mostly) |
| Relationships | Embedded or References | Foreign Keys, JOINs |
| Transactions | Multi-document (4.0+) | Full ACID |
| Query Language | MongoDB Query Language | SQL |

---

### Q2: What is BSON?

**Answer:**
BSON (Binary JSON) is the binary representation MongoDB uses to store documents. Key features:

- Binary encoded JSON-like documents
- Supports additional data types (Date, ObjectId, Binary, Decimal128)
- More efficient for storage and traversal than JSON
- Maximum document size: 16MB

```javascript
// JSON
{ "name": "John", "age": 30 }

// BSON adds type markers, length prefixes, and supports:
// - ObjectId
// - Date
// - NumberLong
// - Decimal128
// - Binary data
```

---

### Q3: What is ObjectId? Explain its structure.

**Answer:**
ObjectId is a 12-byte unique identifier used as the default primary key (_id).

Structure:
- **Bytes 0-3**: Unix timestamp (seconds since epoch)
- **Bytes 4-8**: Random value (unique per machine/process)
- **Bytes 9-11**: Incrementing counter

```javascript
const id = new ObjectId();  // 507f1f77bcf86cd799439011

// Extract timestamp
id.getTimestamp();  // ISODate("2024-01-15T10:30:00Z")

// Check validity
ObjectId.isValid("507f1f77bcf86cd799439011");  // true
```

Benefits:
- Globally unique without coordination
- Sortable by creation time
- Contains embedded timestamp

---

### Q4: What are the differences between `find()` and `findOne()`?

**Answer:**

| `find()` | `findOne()` |
|----------|-------------|
| Returns a cursor | Returns single document |
| Can iterate through multiple docs | Returns first match or null |
| Supports cursor methods (limit, sort) | More efficient for single doc |
| Returns empty cursor if no match | Returns null if no match |

```javascript
// find() - returns cursor
const cursor = db.users.find({ age: { $gt: 25 } });
const users = await cursor.toArray();

// findOne() - returns document
const user = db.users.findOne({ email: "john@example.com" });
```

---

### Q5: Explain the difference between embedding and referencing.

**Answer:**

**Embedding**: Store related data within the same document.
```javascript
// User with embedded address
{
    _id: ObjectId("..."),
    name: "John",
    address: {
        street: "123 Main St",
        city: "NYC"
    }
}
```

**Referencing**: Store related data in separate documents with references.
```javascript
// User document
{ _id: ObjectId("user1"), name: "John", addressId: ObjectId("addr1") }

// Address document
{ _id: ObjectId("addr1"), street: "123 Main St", city: "NYC" }
```

| When to Embed | When to Reference |
|---------------|-------------------|
| Data accessed together | Data accessed separately |
| One-to-few relationship | One-to-many (large N) |
| Data changes infrequently | Data changes often |
| Child data small | Child data large |

---

## Intermediate Level

### Q6: What are indexes? What types of indexes does MongoDB support?

**Answer:**
Indexes are data structures that store a subset of data for efficient query execution.

**Types of Indexes:**

1. **Single Field Index**
```javascript
db.users.createIndex({ email: 1 })
```

2. **Compound Index**
```javascript
db.orders.createIndex({ customerId: 1, orderDate: -1 })
```

3. **Multikey Index** (arrays)
```javascript
db.products.createIndex({ tags: 1 })
```

4. **Text Index** (full-text search)
```javascript
db.articles.createIndex({ content: "text" })
```

5. **Geospatial Index**
```javascript
db.places.createIndex({ location: "2dsphere" })
```

6. **Hashed Index**
```javascript
db.users.createIndex({ ssn: "hashed" })
```

7. **TTL Index** (auto-delete)
```javascript
db.sessions.createIndex({ createdAt: 1 }, { expireAfterSeconds: 3600 })
```

8. **Unique Index**
```javascript
db.users.createIndex({ email: 1 }, { unique: true })
```

---

### Q7: Explain the aggregation framework.

**Answer:**
The aggregation framework is a data processing pipeline that transforms documents through stages.

```javascript
db.orders.aggregate([
    { $match: { status: "completed" } },           // Filter
    { $unwind: "$items" },                         // Flatten arrays
    { $group: {                                    // Group and calculate
        _id: "$customerId",
        totalSpent: { $sum: "$items.price" }
    }},
    { $sort: { totalSpent: -1 } },                // Sort
    { $limit: 10 }                                 // Limit results
])
```

**Common Stages:**
- `$match` - Filter documents
- `$group` - Group and aggregate
- `$project` - Shape output
- `$sort` - Order results
- `$limit` / `$skip` - Pagination
- `$lookup` - Join collections
- `$unwind` - Flatten arrays
- `$facet` - Multiple pipelines

---

### Q8: What is a replica set? How does failover work?

**Answer:**
A replica set is a group of MongoDB servers maintaining the same data for high availability.

**Components:**
- **Primary**: Receives all writes
- **Secondaries**: Replicate from primary, can serve reads
- **Arbiter**: Votes in elections but holds no data

**Failover Process:**
1. Primary becomes unavailable
2. Secondaries detect primary failure (heartbeats)
3. Eligible secondaries start election
4. Member with most up-to-date data and highest priority wins
5. New primary begins accepting writes
6. Automatic (typically 10-30 seconds)

```javascript
// Check replica set status
rs.status()

// Configuration
rs.conf()
```

---

### Q9: Explain write concern and read concern.

**Answer:**

**Write Concern** - Level of acknowledgment for write operations:
```javascript
// No acknowledgment (fastest, least safe)
{ writeConcern: { w: 0 } }

// Primary acknowledgment (default)
{ writeConcern: { w: 1 } }

// Majority acknowledgment (recommended for important data)
{ writeConcern: { w: "majority", j: true } }
```

**Read Concern** - Consistency level for reads:
```javascript
// "local" - Most recent data (may be rolled back)
// "majority" - Data acknowledged by majority (durable)
// "snapshot" - Consistent point-in-time view
```

Trade-off: Stronger concerns = more consistency but slower performance.

---

### Q10: How would you optimize a slow query?

**Answer:**

1. **Analyze with explain()**
```javascript
db.orders.find({ status: "pending" }).explain("executionStats")
// Look for COLLSCAN (bad) vs IXSCAN (good)
```

2. **Add appropriate index**
```javascript
db.orders.createIndex({ status: 1, createdAt: -1 })
```

3. **Use covered queries**
```javascript
db.orders.find(
    { status: "pending" },
    { status: 1, orderId: 1, _id: 0 }  // Only indexed fields
)
```

4. **Limit returned data**
```javascript
db.orders.find({ status: "pending" })
    .projection({ neededField: 1 })
    .limit(100)
```

5. **Use appropriate operators**
```javascript
// Bad: $ne, $nin, $not (can't use index well)
// Good: $eq, $in, $gt, $lt
```

---

## Advanced Level

### Q11: Explain sharding. How do you choose a shard key?

**Answer:**
Sharding horizontally distributes data across multiple servers.

**Components:**
- **Shards**: Store data subsets (each is a replica set)
- **Config Servers**: Store cluster metadata
- **mongos**: Query routers

**Choosing Shard Key:**

Good shard key has:
1. **High Cardinality**: Many unique values
2. **Even Distribution**: No hotspots
3. **Query Isolation**: Queries target single shard
4. **Write Distribution**: Writes spread across shards

```javascript
// Bad: Boolean field (only 2 values)
sh.shardCollection("db.users", { isActive: 1 })

// Bad: Monotonically increasing (hotspot)
sh.shardCollection("db.logs", { timestamp: 1 })

// Good: Hashed for even distribution
sh.shardCollection("db.logs", { _id: "hashed" })

// Good: Compound for query isolation
sh.shardCollection("db.orders", { customerId: 1, orderDate: 1 })
```

---

### Q12: What are ACID transactions in MongoDB?

**Answer:**
MongoDB supports multi-document ACID transactions since version 4.0.

**ACID Properties:**
- **Atomicity**: All operations succeed or all fail
- **Consistency**: Database remains in valid state
- **Isolation**: Concurrent transactions don't interfere
- **Durability**: Committed changes persist

```javascript
const session = client.startSession();

try {
    await session.withTransaction(async () => {
        await accounts.updateOne(
            { _id: fromAccount },
            { $inc: { balance: -100 } },
            { session }
        );
        await accounts.updateOne(
            { _id: toAccount },
            { $inc: { balance: 100 } },
            { session }
        );
    });
} finally {
    session.endSession();
}
```

**Note:** Single document operations are always atomic without transactions.

---

### Q13: What is the oplog? How does replication work?

**Answer:**
The oplog (operations log) is a capped collection that records all operations that modify data.

**Location:** `local.oplog.rs`

**How Replication Works:**
1. Primary records write operations in oplog
2. Secondaries tail the oplog and apply operations
3. Each operation is idempotent (can be applied multiple times)

**Oplog Entry Structure:**
```javascript
{
    ts: Timestamp(1704067200, 1),  // Timestamp
    op: "i",                        // Operation type (i/u/d)
    ns: "mydb.users",               // Namespace
    o: { _id: ObjectId("..."), name: "John" }  // Document
}
```

**Important Considerations:**
- Size affects replication window
- Too small = can't recover lagging secondaries
- Monitor with `rs.printReplicationInfo()`

---

### Q14: What are Change Streams? Use cases?

**Answer:**
Change Streams provide real-time notifications when data changes.

```javascript
const changeStream = collection.watch([
    { $match: { operationType: "insert" } }
]);

changeStream.on('change', (change) => {
    console.log('New document:', change.fullDocument);
});
```

**Use Cases:**
- Real-time notifications
- Cache invalidation
- Data synchronization
- Event sourcing
- Audit logging
- Search index updates

**Features:**
- Resume tokens for fault tolerance
- Filter with aggregation pipeline
- Watch collection, database, or cluster
- Requires replica set or sharded cluster

---

### Q15: How do you handle schema migrations in MongoDB?

**Answer:**
MongoDB's flexible schema allows gradual migrations:

**1. Lazy Migration**
```javascript
// Handle old and new schema in application
function getUser(doc) {
    return {
        name: doc.name || doc.fullName,  // Support both
        email: doc.email
    };
}
```

**2. Batch Migration**
```javascript
// Update documents in batches
db.users.updateMany(
    { fullName: { $exists: true }, name: { $exists: false } },
    [{ $set: { name: "$fullName" } }]
)
```

**3. Schema Validation**
```javascript
db.runCommand({
    collMod: "users",
    validator: {
        $jsonSchema: {
            required: ["name", "email"],
            properties: {
                name: { bsonType: "string" }
            }
        }
    },
    validationLevel: "moderate"  // Only validate new/modified docs
})
```

**4. Migration Scripts**
```javascript
// Version-based migration
const CURRENT_VERSION = 2;

async function migrate(doc) {
    if (!doc.schemaVersion || doc.schemaVersion < 2) {
        // Apply v2 migration
        doc.name = doc.fullName;
        delete doc.fullName;
        doc.schemaVersion = 2;
    }
    return doc;
}
```

---

## Scenario-Based Questions

### Q16: Design a schema for an e-commerce platform.

**Answer:**

```javascript
// Users
{
    _id: ObjectId,
    email: String (unique),
    password: String (hashed),
    profile: {
        name: String,
        phone: String
    },
    addresses: [{
        type: String,  // "home", "work"
        street: String,
        city: String,
        zip: String,
        isDefault: Boolean
    }],
    createdAt: Date
}

// Products
{
    _id: ObjectId,
    sku: String (unique),
    name: String,
    description: String,
    price: Decimal128,
    category: {
        _id: ObjectId,
        name: String,       // Denormalized for quick access
        path: String        // "/electronics/phones"
    },
    inventory: Number,
    variants: [{
        color: String,
        size: String,
        sku: String,
        stock: Number
    }],
    // Denormalized review stats
    avgRating: Number,
    reviewCount: Number
}

// Orders
{
    _id: ObjectId,
    orderNumber: String,
    userId: ObjectId,
    // Snapshot of customer at order time
    customer: {
        name: String,
        email: String
    },
    shippingAddress: { /* embedded */ },
    items: [{
        productId: ObjectId,
        sku: String,
        name: String,       // Snapshot
        price: Decimal128,  // Snapshot
        quantity: Number
    }],
    subtotal: Decimal128,
    tax: Decimal128,
    total: Decimal128,
    status: String,  // "pending", "paid", "shipped", "delivered"
    createdAt: Date
}

// Reviews (separate collection for unbounded growth)
{
    _id: ObjectId,
    productId: ObjectId,
    userId: ObjectId,
    rating: Number,
    title: String,
    text: String,
    helpful: Number,
    createdAt: Date
}
```

**Indexes:**
```javascript
db.users.createIndex({ email: 1 }, { unique: true })
db.products.createIndex({ sku: 1 }, { unique: true })
db.products.createIndex({ "category.path": 1 })
db.products.createIndex({ name: "text", description: "text" })
db.orders.createIndex({ userId: 1, createdAt: -1 })
db.orders.createIndex({ orderNumber: 1 }, { unique: true })
db.reviews.createIndex({ productId: 1, createdAt: -1 })
```

---

### Q17: How would you implement pagination efficiently?

**Answer:**

**Offset-based (simple but slow for large offsets):**
```javascript
const page = 5;
const limit = 20;

db.products.find()
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)

// Problem: skip() scans and discards documents
// Slow for large page numbers
```

**Cursor-based (efficient):**
```javascript
// First page
db.products.find()
    .sort({ createdAt: -1, _id: -1 })
    .limit(20)

// Next page (use last doc's values)
db.products.find({
    $or: [
        { createdAt: { $lt: lastCreatedAt } },
        { 
            createdAt: lastCreatedAt,
            _id: { $lt: lastId }
        }
    ]
})
.sort({ createdAt: -1, _id: -1 })
.limit(20)

// Benefits:
// - Consistent performance regardless of page
// - Works well with real-time data
```

---

### Q18: How do you handle high write throughput?

**Answer:**

1. **Bulk writes**
```javascript
await collection.bulkWrite(operations, { ordered: false })
```

2. **Appropriate write concern**
```javascript
// Balance safety vs speed
{ writeConcern: { w: 1 } }  // Faster
{ writeConcern: { w: "majority" } }  // Safer
```

3. **Sharding for write distribution**
```javascript
// Use hashed shard key for even write distribution
sh.shardCollection("db.logs", { _id: "hashed" })
```

4. **Batch operations**
```javascript
// Accumulate and write in batches
const BATCH_SIZE = 1000;
const batch = [];

for (const item of items) {
    batch.push(item);
    if (batch.length >= BATCH_SIZE) {
        await collection.insertMany(batch);
        batch.length = 0;
    }
}
```

5. **Pre-aggregated data**
```javascript
// Instead of updating counters with each event:
// Use bucketed/pre-aggregated documents
{ _id: "2024-01-15:page123", views: 1500 }
```

---

## Quick Fire Questions

### Q19: What is the maximum document size?
**Answer:** 16 MB

### Q20: What is the maximum BSON nesting depth?
**Answer:** 100 levels

### Q21: Can you change the shard key after sharding?
**Answer:** MongoDB 5.0+ allows resharding, but it's resource-intensive. Prior versions: No.

### Q22: What's the difference between `update()` and `save()`?
**Answer:**
- `update()`: Partial update with operators, doesn't require fetching document
- `save()`: Requires full document, replaces entire document

### Q23: What is a covered query?
**Answer:** A query where all fields in the query and projection are in the index. MongoDB can answer from index without reading documents.

### Q24: How do you handle many-to-many relationships?
**Answer:**
1. Array of references in one side
2. Arrays in both sides (bidirectional)
3. Junction collection with additional metadata

### Q25: What happens if you insert a duplicate `_id`?
**Answer:** MongoDB throws `DuplicateKeyError` (error code 11000)

---

## Summary

Key areas to master:
- ✅ Document model and BSON types
- ✅ CRUD operations and query operators
- ✅ Indexing strategies and optimization
- ✅ Aggregation framework
- ✅ Schema design patterns
- ✅ Replication and sharding
- ✅ Transactions and consistency
- ✅ Performance tuning
- ✅ Security best practices

Good luck with your interview! 🍀



