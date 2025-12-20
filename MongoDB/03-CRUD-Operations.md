# Chapter 3: CRUD Operations 📝

CRUD stands for **Create, Read, Update, Delete** - the four fundamental operations for managing data in MongoDB.

---

## Sample Data Setup

```javascript
// Switch to test database
use ecommerce

// Create sample collections
db.customers.insertMany([
    {
        name: "John Doe",
        email: "john@example.com",
        age: 35,
        address: { city: "New York", country: "USA" },
        tags: ["premium", "verified"],
        createdAt: new Date("2024-01-15")
    },
    {
        name: "Jane Smith",
        email: "jane@example.com",
        age: 28,
        address: { city: "Los Angeles", country: "USA" },
        tags: ["new"],
        createdAt: new Date("2024-02-20")
    },
    {
        name: "Bob Wilson",
        email: "bob@example.com",
        age: 42,
        address: { city: "London", country: "UK" },
        tags: ["premium"],
        createdAt: new Date("2024-03-10")
    }
]);

db.products.insertMany([
    { name: "Laptop", price: 999.99, category: "Electronics", stock: 50, ratings: [4, 5, 4, 5] },
    { name: "Phone", price: 599.99, category: "Electronics", stock: 100, ratings: [5, 4, 5] },
    { name: "Desk", price: 299.99, category: "Furniture", stock: 25, ratings: [4, 3, 4] },
    { name: "Chair", price: 149.99, category: "Furniture", stock: 75, ratings: [5, 5, 4, 5] },
    { name: "Headphones", price: 199.99, category: "Electronics", stock: 200, ratings: [4, 4, 5] }
]);
```

---

## CREATE Operations

### insertOne()

Insert a single document.

```javascript
// Basic insert
db.customers.insertOne({
    name: "Alice Brown",
    email: "alice@example.com",
    age: 30
});

// Returns: { acknowledged: true, insertedId: ObjectId("...") }

// With all fields
db.customers.insertOne({
    _id: "custom-id-123",  // Custom _id (optional)
    name: "Charlie Davis",
    email: "charlie@example.com",
    age: 25,
    address: {
        street: "456 Oak Ave",
        city: "Chicago",
        country: "USA"
    },
    tags: ["new", "referral"],
    preferences: {
        newsletter: true,
        notifications: false
    },
    createdAt: new Date(),
    updatedAt: new Date()
});

// Capture result
const result = db.customers.insertOne({ name: "Test User", email: "test@example.com" });
print(`Inserted ID: ${result.insertedId}`);
```

### insertMany()

Insert multiple documents.

```javascript
// Insert multiple documents
db.products.insertMany([
    { name: "Monitor", price: 399.99, category: "Electronics", stock: 30 },
    { name: "Keyboard", price: 79.99, category: "Electronics", stock: 150 },
    { name: "Mouse", price: 29.99, category: "Electronics", stock: 200 }
]);

// Returns: { acknowledged: true, insertedIds: { '0': ObjectId(...), '1': ObjectId(...), ... } }

// With ordered option
db.products.insertMany(
    [
        { name: "Product A", price: 10 },
        { name: "Product B", price: 20 },
        { name: "Product C", price: 30 }
    ],
    { ordered: false }  // Continue on error (default: true stops on first error)
);

// Bulk insert from array
const newProducts = [
    { name: "Tablet", price: 449.99, category: "Electronics" },
    { name: "Lamp", price: 39.99, category: "Furniture" }
];
db.products.insertMany(newProducts);
```

---

## READ Operations

### find()

Query multiple documents.

```javascript
// Find all documents
db.customers.find()

// Find with pretty print
db.customers.find().pretty()

// Find with condition
db.customers.find({ age: 30 })

// Find with multiple conditions (implicit AND)
db.customers.find({ age: { $gte: 30 }, "address.country": "USA" })

// Find and return specific fields (projection)
db.customers.find(
    { age: { $gte: 30 } },        // Query
    { name: 1, email: 1, _id: 0 }  // Projection (1 = include, 0 = exclude)
)

// Exclude fields
db.customers.find({}, { password: 0, ssn: 0 })

// Nested field projection
db.customers.find({}, { "address.city": 1, name: 1 })

// Count results
db.customers.find({ age: { $gte: 30 } }).count()
db.customers.countDocuments({ age: { $gte: 30 } })  // Preferred

// Limit results
db.customers.find().limit(5)

// Skip results (pagination)
db.customers.find().skip(10).limit(5)  // Page 3 (5 per page)

// Sort results
db.customers.find().sort({ age: 1 })   // Ascending
db.customers.find().sort({ age: -1 })  // Descending
db.customers.find().sort({ age: -1, name: 1 })  // Multiple fields

// Chaining
db.customers
    .find({ "address.country": "USA" })
    .sort({ createdAt: -1 })
    .skip(0)
    .limit(10)
```

### findOne()

Query single document.

```javascript
// Find first matching document
db.customers.findOne({ email: "john@example.com" })

// Find by _id
db.customers.findOne({ _id: ObjectId("6575b3d5f3c8a8b3d5f3c8a8") })

// With projection
db.customers.findOne(
    { email: "john@example.com" },
    { name: 1, email: 1 }
)

// Returns null if not found
db.customers.findOne({ email: "nonexistent@example.com" })  // null
```

### Cursor Methods

```javascript
// find() returns a cursor, not an array
const cursor = db.customers.find();

// Iterate cursor
cursor.forEach(doc => print(doc.name));

// Convert to array
const customers = db.customers.find().toArray();

// Check if more results
cursor.hasNext()

// Get next document
cursor.next()

// Cursor methods chain
db.customers.find()
    .sort({ age: -1 })
    .limit(10)
    .skip(5)
    .projection({ name: 1, age: 1 })
```

### Distinct Values

```javascript
// Get distinct values
db.customers.distinct("address.country")
// Returns: ["USA", "UK"]

// With condition
db.customers.distinct("tags", { age: { $gte: 30 } })
```

---

## UPDATE Operations

### updateOne()

Update first matching document.

```javascript
// Basic update with $set
db.customers.updateOne(
    { email: "john@example.com" },      // Filter
    { $set: { age: 36 } }               // Update
)

// Returns: { acknowledged: true, matchedCount: 1, modifiedCount: 1 }

// Update multiple fields
db.customers.updateOne(
    { email: "john@example.com" },
    { 
        $set: { 
            age: 36,
            "address.city": "Boston",
            updatedAt: new Date()
        } 
    }
)

// Upsert - insert if not found
db.customers.updateOne(
    { email: "new@example.com" },
    { 
        $set: { name: "New User", email: "new@example.com", age: 25 },
        $setOnInsert: { createdAt: new Date() }
    },
    { upsert: true }
)
```

### updateMany()

Update all matching documents.

```javascript
// Update all matching
db.products.updateMany(
    { category: "Electronics" },
    { $set: { onSale: true } }
)

// Update with increment
db.products.updateMany(
    { category: "Electronics" },
    { $mul: { price: 0.9 } }  // 10% discount
)

// Update all documents
db.products.updateMany(
    {},
    { $set: { updatedAt: new Date() } }
)
```

### Update Operators

```javascript
// $set - Set field value
db.customers.updateOne(
    { _id: id },
    { $set: { name: "New Name", age: 30 } }
)

// $unset - Remove field
db.customers.updateOne(
    { _id: id },
    { $unset: { tempField: "" } }
)

// $inc - Increment number
db.products.updateOne(
    { name: "Laptop" },
    { $inc: { stock: -1, soldCount: 1 } }  // Decrease stock, increase sold
)

// $mul - Multiply
db.products.updateOne(
    { name: "Laptop" },
    { $mul: { price: 1.1 } }  // 10% price increase
)

// $min / $max - Update if less/greater
db.products.updateOne(
    { name: "Laptop" },
    { $min: { price: 899.99 } }  // Only update if 899.99 is less than current
)

// $rename - Rename field
db.customers.updateOne(
    { _id: id },
    { $rename: { "oldFieldName": "newFieldName" } }
)

// $currentDate - Set to current date
db.customers.updateOne(
    { _id: id },
    { $currentDate: { updatedAt: true, lastModified: { $type: "timestamp" } } }
)
```

### Array Update Operators

```javascript
// $push - Add to array
db.customers.updateOne(
    { email: "john@example.com" },
    { $push: { tags: "loyal" } }
)

// $push with modifiers
db.customers.updateOne(
    { email: "john@example.com" },
    { 
        $push: { 
            tags: { 
                $each: ["tag1", "tag2"],
                $position: 0,
                $slice: 5  // Keep only 5 elements
            } 
        } 
    }
)

// $addToSet - Add if not exists
db.customers.updateOne(
    { email: "john@example.com" },
    { $addToSet: { tags: "premium" } }  // Won't add if already exists
)

// $addToSet with multiple values
db.customers.updateOne(
    { email: "john@example.com" },
    { $addToSet: { tags: { $each: ["tag1", "tag2"] } } }
)

// $pop - Remove first/last element
db.customers.updateOne(
    { email: "john@example.com" },
    { $pop: { tags: 1 } }   // Remove last
    // { $pop: { tags: -1 } } // Remove first
)

// $pull - Remove by value
db.customers.updateOne(
    { email: "john@example.com" },
    { $pull: { tags: "premium" } }
)

// $pull with condition
db.products.updateOne(
    { name: "Laptop" },
    { $pull: { ratings: { $lt: 3 } } }  // Remove ratings below 3
)

// $pullAll - Remove multiple values
db.customers.updateOne(
    { email: "john@example.com" },
    { $pullAll: { tags: ["tag1", "tag2"] } }
)

// $ positional operator - Update matching array element
db.products.updateOne(
    { name: "Laptop", ratings: 4 },
    { $set: { "ratings.$": 5 } }  // Update first matching 4 to 5
)

// $[] - Update all array elements
db.products.updateOne(
    { name: "Laptop" },
    { $inc: { "ratings.$[]": 1 } }  // Increment all ratings by 1
)

// $[<identifier>] - Update filtered elements
db.products.updateOne(
    { name: "Laptop" },
    { $set: { "ratings.$[elem]": 5 } },
    { arrayFilters: [{ "elem": { $lt: 4 } }] }  // Set ratings < 4 to 5
)
```

### replaceOne()

Replace entire document (except _id).

```javascript
db.customers.replaceOne(
    { email: "john@example.com" },
    {
        name: "John Doe Updated",
        email: "john@example.com",
        age: 36,
        address: { city: "Boston", country: "USA" },
        tags: ["premium", "verified", "loyal"],
        createdAt: new Date("2024-01-15"),
        updatedAt: new Date()
    }
)

// Note: _id cannot be changed
// All fields not included will be removed (except _id)
```

### findOneAndUpdate()

Update and return document (atomic).

```javascript
// Return original document
db.customers.findOneAndUpdate(
    { email: "john@example.com" },
    { $inc: { loginCount: 1 } }
)

// Return updated document
db.customers.findOneAndUpdate(
    { email: "john@example.com" },
    { $inc: { loginCount: 1 } },
    { returnDocument: "after" }
)

// With upsert
db.customers.findOneAndUpdate(
    { email: "new@example.com" },
    { $set: { name: "New User" } },
    { upsert: true, returnDocument: "after" }
)

// With projection
db.customers.findOneAndUpdate(
    { email: "john@example.com" },
    { $set: { lastLogin: new Date() } },
    { 
        returnDocument: "after",
        projection: { name: 1, email: 1, lastLogin: 1 }
    }
)
```

---

## DELETE Operations

### deleteOne()

Delete first matching document.

```javascript
// Delete by condition
db.customers.deleteOne({ email: "test@example.com" })

// Returns: { acknowledged: true, deletedCount: 1 }

// Delete by _id
db.customers.deleteOne({ _id: ObjectId("6575b3d5f3c8a8b3d5f3c8a8") })
```

### deleteMany()

Delete all matching documents.

```javascript
// Delete multiple
db.products.deleteMany({ stock: 0 })

// Delete by multiple conditions
db.customers.deleteMany({ 
    createdAt: { $lt: new Date("2023-01-01") },
    "tags": { $nin: ["premium"] }
})

// Delete all documents (use with caution!)
db.logs.deleteMany({})
```

### findOneAndDelete()

Delete and return document (atomic).

```javascript
// Delete and get deleted document
const deleted = db.customers.findOneAndDelete(
    { email: "john@example.com" }
)
print(`Deleted: ${deleted.name}`)

// With sort (delete oldest)
db.sessions.findOneAndDelete(
    { userId: ObjectId("...") },
    { sort: { createdAt: 1 } }  // Delete oldest first
)
```

### drop()

Delete entire collection.

```javascript
// Drop collection
db.tempData.drop()

// Drop database
db.dropDatabase()
```

---

## Bulk Operations

### Ordered Bulk Write

```javascript
db.products.bulkWrite([
    {
        insertOne: {
            document: { name: "New Product", price: 99.99, stock: 100 }
        }
    },
    {
        updateOne: {
            filter: { name: "Laptop" },
            update: { $inc: { stock: 10 } }
        }
    },
    {
        updateMany: {
            filter: { category: "Electronics" },
            update: { $set: { inStock: true } }
        }
    },
    {
        deleteOne: {
            filter: { name: "Obsolete Product" }
        }
    },
    {
        replaceOne: {
            filter: { name: "Old Product" },
            replacement: { name: "New Product", price: 49.99, stock: 50 }
        }
    }
], { ordered: true });  // Stop on first error (default)
```

### Unordered Bulk Write

```javascript
db.products.bulkWrite([
    { insertOne: { document: { name: "A", price: 10 } } },
    { insertOne: { document: { name: "B", price: 20 } } },
    { insertOne: { document: { name: "C", price: 30 } } }
], { ordered: false });  // Continue on error, better performance
```

---

## Write Concerns

```javascript
// Write concern options
db.customers.insertOne(
    { name: "Test", email: "test@example.com" },
    {
        writeConcern: {
            w: "majority",   // Wait for majority of nodes
            j: true,         // Wait for journal write
            wtimeout: 5000   // Timeout in ms
        }
    }
)

// Write concern levels:
// w: 0    - No acknowledgment (fire and forget)
// w: 1    - Acknowledgment from primary (default)
// w: "majority" - Acknowledgment from majority
// w: <n>  - Acknowledgment from n nodes
```

---

## Common Patterns

### Upsert Pattern

```javascript
// Create or update
db.counters.updateOne(
    { _id: "visitors" },
    { $inc: { count: 1 } },
    { upsert: true }
)
```

### Soft Delete Pattern

```javascript
// Instead of deleting, mark as deleted
db.users.updateOne(
    { _id: userId },
    { 
        $set: { 
            deletedAt: new Date(),
            isDeleted: true 
        } 
    }
)

// Query only active users
db.users.find({ isDeleted: { $ne: true } })

// Create partial index for better performance
db.users.createIndex(
    { email: 1 },
    { partialFilterExpression: { isDeleted: { $ne: true } } }
)
```

### Optimistic Locking

```javascript
// Add version field
db.products.updateOne(
    { _id: productId, version: currentVersion },
    { 
        $set: { price: newPrice },
        $inc: { version: 1 }
    }
)

// Check if update succeeded
if (result.modifiedCount === 0) {
    throw new Error("Concurrent modification detected")
}
```

### Pagination

```javascript
// Offset-based (simple but slow for large offsets)
const page = 2;
const limit = 10;
db.products.find()
    .sort({ _id: 1 })
    .skip((page - 1) * limit)
    .limit(limit)

// Cursor-based (more efficient)
const lastId = ObjectId("...");  // Last seen _id
db.products.find({ _id: { $gt: lastId } })
    .sort({ _id: 1 })
    .limit(10)
```

---

## Practice Exercises

### Exercise 1: Insert Operations
1. Create an `orders` collection
2. Insert a single order with customer info, items array, total
3. Insert 5 orders using insertMany

### Exercise 2: Query Operations
1. Find all customers from USA
2. Find products with price between 100 and 500
3. Find customers with "premium" tag, sorted by age

### Exercise 3: Update Operations
1. Update a customer's address
2. Add a new rating to a product's ratings array
3. Apply 20% discount to all Electronics products

### Exercise 4: Delete Operations
1. Delete products with 0 stock
2. Implement soft delete for a customer
3. Use findOneAndDelete to remove and log expired sessions

---

## Summary

In this chapter, you learned:
- ✅ insertOne and insertMany for creating documents
- ✅ find, findOne, and cursor methods for querying
- ✅ Projections for selecting specific fields
- ✅ updateOne, updateMany with all operators
- ✅ Array update operators ($push, $pull, $addToSet)
- ✅ deleteOne, deleteMany, and findOneAndDelete
- ✅ Bulk operations for efficiency
- ✅ Common patterns: upsert, soft delete, pagination

---

**Next Chapter:** [Query Operators →](./04-Query-Operators.md)




