# Chapter 8: Relationships 🔗

MongoDB supports various relationship patterns. Understanding when to embed vs reference is key to effective schema design.

---

## Relationship Types

### One-to-One

```javascript
// Approach 1: Embed (preferred for 1:1)
{
    _id: ObjectId("..."),
    name: "John Doe",
    email: "john@example.com",
    profile: {
        bio: "Software developer",
        avatar: "https://example.com/avatar.jpg",
        socialLinks: {
            twitter: "@johndoe",
            github: "johndoe"
        }
    }
}

// Approach 2: Reference (when data is large or accessed separately)
// users collection
{
    _id: ObjectId("user1"),
    name: "John Doe",
    email: "john@example.com",
    profileId: ObjectId("profile1")
}

// profiles collection
{
    _id: ObjectId("profile1"),
    userId: ObjectId("user1"),
    bio: "...",
    avatar: "...",
    // ... lots of profile data
}
```

### One-to-Many

```javascript
// Approach 1: Embed (when "many" is small and bounded)
// Blog post with comments (< 100)
{
    _id: ObjectId("..."),
    title: "My Blog Post",
    content: "...",
    comments: [
        {
            _id: ObjectId("..."),
            author: "Jane",
            text: "Great post!",
            createdAt: new Date()
        },
        // ... up to ~100 comments
    ]
}

// Approach 2: Child Reference (when "many" is large)
// posts collection
{
    _id: ObjectId("post1"),
    title: "My Blog Post",
    content: "..."
}

// comments collection
{
    _id: ObjectId("..."),
    postId: ObjectId("post1"),  // References parent
    author: "Jane",
    text: "Great post!",
    createdAt: new Date()
}

// Approach 3: Parent Reference (when "many" is huge)
// Same as above - child references parent
// Best for one-to-squillions (logging, events)
```

### Many-to-Many

```javascript
// Approach 1: Array of references in one side
// students collection
{
    _id: ObjectId("student1"),
    name: "Alice",
    courseIds: [ObjectId("course1"), ObjectId("course2")]
}

// courses collection
{
    _id: ObjectId("course1"),
    name: "MongoDB 101",
    instructor: "Prof. Smith"
}

// Approach 2: Array of references in both sides (bidirectional)
// students collection
{
    _id: ObjectId("student1"),
    name: "Alice",
    courseIds: [ObjectId("course1"), ObjectId("course2")]
}

// courses collection
{
    _id: ObjectId("course1"),
    name: "MongoDB 101",
    studentIds: [ObjectId("student1"), ObjectId("student2")]
}

// Approach 3: Junction/Join collection (for extra data on relationship)
// enrollments collection
{
    _id: ObjectId("..."),
    studentId: ObjectId("student1"),
    courseId: ObjectId("course1"),
    enrolledAt: new Date(),
    grade: "A",
    status: "active"
}
```

---

## Embedding in Detail

### When to Embed

```javascript
// ✅ Embed when:
// 1. Data is always accessed together
// 2. Nested data doesn't change frequently
// 3. Array size is bounded (< 100 elements typical)
// 4. Child data doesn't make sense alone

// Example: Order with line items
{
    _id: ObjectId("..."),
    orderNumber: "ORD-2024-001",
    customer: {
        name: "John Doe",
        email: "john@example.com"
    },
    items: [
        {
            productId: ObjectId("..."),
            name: "Laptop",
            price: 999.99,
            quantity: 1
        },
        {
            productId: ObjectId("..."),
            name: "Mouse",
            price: 29.99,
            quantity: 2
        }
    ],
    total: 1059.97,
    createdAt: new Date()
}
```

### Embedded Updates

```javascript
// Update embedded document
db.orders.updateOne(
    { _id: orderId },
    { $set: { "customer.email": "newemail@example.com" } }
)

// Update array element by index
db.orders.updateOne(
    { _id: orderId },
    { $set: { "items.0.quantity": 3 } }
)

// Update array element by query
db.orders.updateOne(
    { _id: orderId, "items.productId": productId },
    { $set: { "items.$.quantity": 3 } }
)

// Add to embedded array
db.orders.updateOne(
    { _id: orderId },
    { 
        $push: { 
            items: { 
                productId: ObjectId("..."),
                name: "Keyboard",
                price: 79.99,
                quantity: 1
            }
        }
    }
)

// Remove from embedded array
db.orders.updateOne(
    { _id: orderId },
    { $pull: { items: { productId: productId } } }
)
```

---

## Referencing in Detail

### When to Reference

```javascript
// ✅ Reference when:
// 1. Data is large and would exceed document size
// 2. Data changes frequently
// 3. Data is accessed independently
// 4. Many-to-many relationships
// 5. Unbounded one-to-many

// Example: User and Orders
// users collection
{
    _id: ObjectId("user1"),
    name: "John Doe",
    email: "john@example.com"
}

// orders collection
{
    _id: ObjectId("order1"),
    userId: ObjectId("user1"),
    items: [...],
    total: 99.99
}
```

### Manual Joins (Application Level)

```javascript
// Two queries - application joins results
const user = await db.users.findOne({ _id: userId });
const orders = await db.orders.find({ userId: userId }).toArray();

// Combine in application
const result = { ...user, orders };
```

### $lookup (Aggregation Join)

```javascript
// Single lookup
db.orders.aggregate([
    {
        $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "user"
        }
    },
    { $unwind: "$user" }  // Convert array to object
])

// Multiple lookups
db.orders.aggregate([
    // Join user
    {
        $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "user"
        }
    },
    { $unwind: "$user" },
    // Join products
    {
        $lookup: {
            from: "products",
            localField: "items.productId",
            foreignField: "_id",
            as: "products"
        }
    }
])

// Pipeline lookup (with conditions)
db.orders.aggregate([
    {
        $lookup: {
            from: "reviews",
            let: { orderId: "$_id" },
            pipeline: [
                {
                    $match: {
                        $expr: { $eq: ["$orderId", "$$orderId"] }
                    }
                },
                { $limit: 5 }  // Only recent reviews
            ],
            as: "reviews"
        }
    }
])
```

---

## Hybrid Approach

### Extended Reference

```javascript
// Store frequently accessed fields from referenced document
{
    _id: ObjectId("order1"),
    userId: ObjectId("user1"),
    // Extended reference - copied from user
    userName: "John Doe",
    userEmail: "john@example.com",
    items: [...],
    total: 99.99
}

// Benefits: Fast reads, no joins needed
// Trade-off: Need to update copies when original changes
```

### Handling Updates

```javascript
// When user updates email, update all orders
db.orders.updateMany(
    { userId: userId },
    { $set: { userEmail: newEmail } }
)

// Or accept eventual consistency for historical data
// Orders show email at time of order
```

---

## Denormalization

### When to Denormalize

```javascript
// Denormalize = duplicate data for read performance

// ✅ Denormalize when:
// - Read performance is critical
// - Data changes infrequently
// - Stale data is acceptable

// ✗ Avoid when:
// - Data changes frequently
// - Consistency is critical
// - Storage is a concern
```

### Denormalization Examples

```javascript
// 1. Store count instead of computing
{
    _id: ObjectId("..."),
    title: "Blog Post",
    commentCount: 42,  // Denormalized
    likeCount: 156     // Denormalized
}

// Update on comment add
db.posts.updateOne(
    { _id: postId },
    { $inc: { commentCount: 1 } }
)

// 2. Store computed values
{
    _id: ObjectId("..."),
    items: [
        { price: 100, qty: 2 },
        { price: 50, qty: 1 }
    ],
    subtotal: 250,     // Computed once
    tax: 25,           // Computed once
    total: 275         // Computed once
}

// 3. Store derived data
{
    _id: ObjectId("..."),
    name: "John Doe",
    email: "john@example.com",
    // Derived for search
    searchTerms: ["john", "doe", "john@example.com"]
}
```

---

## Tree Structures

### Parent Reference

```javascript
// Each node stores parent reference
// categories collection
{
    _id: ObjectId("electronics"),
    name: "Electronics",
    parent: null  // Root
}
{
    _id: ObjectId("phones"),
    name: "Phones",
    parent: ObjectId("electronics")
}
{
    _id: ObjectId("smartphones"),
    name: "Smartphones",
    parent: ObjectId("phones")
}

// Find children
db.categories.find({ parent: ObjectId("electronics") })

// Find ancestors (multiple queries or aggregation)
```

### Child Reference

```javascript
// Each node stores children
{
    _id: ObjectId("electronics"),
    name: "Electronics",
    children: [ObjectId("phones"), ObjectId("computers")]
}

// Find children: Single read
db.categories.findOne({ _id: ObjectId("electronics") })
```

### Materialized Path

```javascript
// Store full path as string
{
    _id: ObjectId("smartphones"),
    name: "Smartphones",
    path: "/electronics/phones/smartphones"
}

// Find all descendants
db.categories.find({ path: /^\/electronics/ })

// Find all ancestors
const paths = "/electronics/phones/smartphones".split("/").filter(Boolean);
db.categories.find({ name: { $in: paths } })
```

### Nested Sets

```javascript
// Store left and right values
{
    _id: ObjectId("electronics"),
    name: "Electronics",
    left: 1,
    right: 6
}
{
    _id: ObjectId("phones"),
    name: "Phones",
    left: 2,
    right: 5
}
{
    _id: ObjectId("smartphones"),
    name: "Smartphones",
    left: 3,
    right: 4
}

// Find all descendants
db.categories.find({
    left: { $gt: 1 },
    right: { $lt: 6 }
})

// Fast reads, slow updates
```

### Array of Ancestors

```javascript
// Store all ancestors
{
    _id: ObjectId("smartphones"),
    name: "Smartphones",
    ancestors: [
        ObjectId("electronics"),
        ObjectId("phones")
    ],
    parent: ObjectId("phones")
}

// Find all ancestors: Single read
const doc = db.categories.findOne({ _id: ObjectId("smartphones") });
db.categories.find({ _id: { $in: doc.ancestors } })

// Find all descendants
db.categories.find({ ancestors: ObjectId("electronics") })
```

---

## Practical Examples

### Blog Platform

```javascript
// users collection
{
    _id: ObjectId("..."),
    username: "johndoe",
    email: "john@example.com",
    profile: {
        name: "John Doe",
        bio: "..."
    }
}

// posts collection
{
    _id: ObjectId("..."),
    authorId: ObjectId("..."),
    // Extended reference
    authorName: "John Doe",
    authorUsername: "johndoe",
    title: "...",
    content: "...",
    tags: ["mongodb", "tutorial"],
    // Denormalized counts
    viewCount: 1500,
    likeCount: 42,
    commentCount: 15,
    // Recent comments embedded
    recentComments: [
        { user: "...", text: "...", date: new Date() }
    ],
    createdAt: new Date()
}

// comments collection (all comments)
{
    _id: ObjectId("..."),
    postId: ObjectId("..."),
    userId: ObjectId("..."),
    userName: "...",
    text: "...",
    createdAt: new Date()
}
```

### E-commerce

```javascript
// products collection
{
    _id: ObjectId("..."),
    name: "Laptop",
    description: "...",
    category: {
        _id: ObjectId("..."),
        name: "Electronics",
        path: "/electronics/computers"
    },
    price: 999.99,
    inventory: 50,
    // Embedded variations
    variations: [
        { color: "Silver", sku: "LAP-001-S", stock: 30 },
        { color: "Black", sku: "LAP-001-B", stock: 20 }
    ],
    // Denormalized reviews
    avgRating: 4.5,
    reviewCount: 120
}

// orders collection
{
    _id: ObjectId("..."),
    userId: ObjectId("..."),
    // Extended reference
    userEmail: "john@example.com",
    shippingAddress: { ... },
    items: [
        {
            productId: ObjectId("..."),
            // Snapshot at time of order
            name: "Laptop",
            price: 999.99,
            quantity: 1
        }
    ],
    status: "shipped",
    total: 999.99
}
```

---

## Summary

In this chapter, you learned:
- ✅ One-to-one, one-to-many, many-to-many patterns
- ✅ When to embed vs reference
- ✅ Using $lookup for joins
- ✅ Extended reference pattern
- ✅ Denormalization strategies
- ✅ Tree structures in MongoDB

---

**Next Chapter:** [Transactions →](./09-Transactions.md)



