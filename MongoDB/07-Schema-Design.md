# Chapter 7: Schema Design 📐

Schema design is crucial in MongoDB. Unlike relational databases, MongoDB gives you flexibility - but that requires careful design decisions.

---

## Schema Design Principles

### Think About Queries First

```javascript
// Ask: How will the data be accessed?
// - What queries will be run?
// - Read vs Write ratio?
// - How often will data change?

// Design for your access patterns, not for "normalization"
```

### Document Model Benefits

```javascript
// 1. Data that's accessed together should be stored together
// 2. Atomic operations on single documents
// 3. No expensive JOINs needed
// 4. Hierarchical data fits naturally
```

---

## Embedding vs Referencing

### When to Embed

```javascript
// ✅ Embed when:
// - One-to-few relationship (1:small N)
// - Data is always accessed together
// - Child data doesn't make sense alone
// - Data rarely changes

// Example: User with addresses
{
    _id: ObjectId("..."),
    name: "John Doe",
    email: "john@example.com",
    addresses: [
        { type: "home", street: "123 Main St", city: "NYC" },
        { type: "work", street: "456 Office Blvd", city: "NYC" }
    ]
}

// Single read gets all user data
db.users.findOne({ email: "john@example.com" })
```

### When to Reference

```javascript
// ✅ Reference when:
// - One-to-many relationship (1:large N)
// - Many-to-many relationship
// - Data is accessed independently
// - Data changes frequently
// - Document size would exceed 16MB

// Example: User with orders (reference)
// users collection
{
    _id: ObjectId("user123"),
    name: "John Doe",
    email: "john@example.com"
}

// orders collection
{
    _id: ObjectId("order456"),
    userId: ObjectId("user123"),
    items: [...],
    total: 99.99
}

// Requires two queries or $lookup
```

---

## Common Patterns

### 1. One-to-One: Embed

```javascript
// User profile - always accessed together
{
    _id: ObjectId("..."),
    username: "johndoe",
    email: "john@example.com",
    profile: {
        firstName: "John",
        lastName: "Doe",
        bio: "Software developer",
        avatar: "https://..."
    }
}
```

### 2. One-to-Few: Embed

```javascript
// Blog post with few comments (< 100)
{
    _id: ObjectId("..."),
    title: "MongoDB Schema Design",
    content: "...",
    author: "John",
    comments: [
        { user: "Jane", text: "Great post!", date: new Date() },
        { user: "Bob", text: "Very helpful", date: new Date() }
    ]
}

// Single read, atomic updates
```

### 3. One-to-Many: Reference

```javascript
// Blog post with many comments (100+)
// posts collection
{
    _id: ObjectId("post123"),
    title: "MongoDB Schema Design",
    content: "...",
    commentCount: 500
}

// comments collection
{
    _id: ObjectId("..."),
    postId: ObjectId("post123"),
    user: "Jane",
    text: "Great post!",
    createdAt: new Date()
}

// Query with pagination
db.comments.find({ postId: ObjectId("post123") })
    .sort({ createdAt: -1 })
    .limit(20)
```

### 4. One-to-Squillions: Reference (Parent Reference)

```javascript
// Log entries (millions per host)
// hosts collection
{
    _id: ObjectId("host123"),
    hostname: "server1.example.com",
    ip: "192.168.1.1"
}

// logs collection - reference parent
{
    _id: ObjectId("..."),
    hostId: ObjectId("host123"),
    level: "error",
    message: "Connection timeout",
    timestamp: new Date()
}

// Child references parent, not parent referencing children
```

### 5. Many-to-Many: Array of References

```javascript
// Books and Authors (both can have many)
// authors collection
{
    _id: ObjectId("author1"),
    name: "Author One"
}

// books collection
{
    _id: ObjectId("book1"),
    title: "Book Title",
    authorIds: [ObjectId("author1"), ObjectId("author2")]
}

// Or use linking collection
// book_authors collection
{
    bookId: ObjectId("book1"),
    authorId: ObjectId("author1"),
    role: "primary"
}
```

---

## Advanced Patterns

### Subset Pattern

```javascript
// Store frequently accessed data in main document
// Full data in separate collection

// products collection (with top reviews)
{
    _id: ObjectId("..."),
    name: "Laptop",
    price: 999,
    topReviews: [
        { user: "John", rating: 5, text: "Excellent!", date: new Date() },
        { user: "Jane", rating: 4, text: "Very good", date: new Date() }
    ],
    reviewCount: 150,
    avgRating: 4.5
}

// reviews collection (all reviews)
{
    _id: ObjectId("..."),
    productId: ObjectId("..."),
    user: "...",
    rating: 5,
    text: "...",
    date: new Date()
}
```

### Extended Reference Pattern

```javascript
// Embed frequently needed fields from referenced document

// orders collection
{
    _id: ObjectId("..."),
    customerId: ObjectId("cust123"),
    // Extended reference - duplicated for quick access
    customerName: "John Doe",
    customerEmail: "john@example.com",
    items: [
        {
            productId: ObjectId("prod456"),
            // Extended reference
            productName: "Laptop",
            productPrice: 999,
            quantity: 1
        }
    ]
}

// Trade-off: Faster reads, need to handle updates
```

### Computed Pattern

```javascript
// Pre-compute expensive calculations

// products collection
{
    _id: ObjectId("..."),
    name: "Laptop",
    reviews: [...],
    // Computed fields
    reviewCount: 150,
    avgRating: 4.5,
    totalRevenue: 149850,
    lastReviewDate: new Date()
}

// Update computed fields when data changes
db.products.updateOne(
    { _id: productId },
    {
        $inc: { reviewCount: 1, totalRatings: newRating },
        $set: { 
            avgRating: { $divide: ["$totalRatings", "$reviewCount"] },
            lastReviewDate: new Date()
        }
    }
)
```

### Bucket Pattern

```javascript
// Group data into buckets (time-series)

// Instead of one document per measurement
// sensor_readings collection
{
    _id: ObjectId("..."),
    sensorId: "sensor001",
    timestamp: new Date("2024-01-15T00:00:00"),
    // Bucket - 1 hour of readings
    readings: [
        { minute: 0, value: 23.5 },
        { minute: 1, value: 23.6 },
        // ... up to 59
    ],
    count: 60,
    sum: 1416,
    avg: 23.6
}

// Reduces document count dramatically
// Pre-computed aggregations in each bucket
```

### Outlier Pattern

```javascript
// Handle documents that don't fit the normal pattern

// Normal user
{
    _id: ObjectId("..."),
    username: "regularuser",
    followers: ["user1", "user2", "user3"],  // Few followers
    hasOverflow: false
}

// Popular user (celebrity)
{
    _id: ObjectId("celebrity1"),
    username: "celebrity",
    followers: ["user1", "user2", /* ... 1000 users */],
    hasOverflow: true
}

// followers_overflow collection
{
    userId: ObjectId("celebrity1"),
    followers: [/* more followers */],
    page: 2
}
```

### Polymorphic Pattern

```javascript
// Different document types in same collection

// products collection
{
    _id: ObjectId("..."),
    type: "book",
    name: "MongoDB Guide",
    author: "John Doe",
    pages: 300,
    isbn: "978-..."
}

{
    _id: ObjectId("..."),
    type: "electronics",
    name: "Laptop",
    brand: "Dell",
    specs: { ram: "16GB", storage: "512GB" }
}

{
    _id: ObjectId("..."),
    type: "clothing",
    name: "T-Shirt",
    sizes: ["S", "M", "L"],
    material: "cotton"
}

// Query by type
db.products.find({ type: "book" })
```

---

## Schema Validation

```javascript
// Create collection with validation
db.createCollection("users", {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["email", "name"],
            properties: {
                email: {
                    bsonType: "string",
                    pattern: "^.+@.+$",
                    description: "Valid email required"
                },
                name: {
                    bsonType: "string",
                    minLength: 2,
                    maxLength: 100
                },
                age: {
                    bsonType: "int",
                    minimum: 0,
                    maximum: 150
                },
                status: {
                    enum: ["active", "inactive", "pending"]
                },
                address: {
                    bsonType: "object",
                    properties: {
                        city: { bsonType: "string" },
                        zip: { bsonType: "string" }
                    }
                },
                tags: {
                    bsonType: "array",
                    items: { bsonType: "string" }
                }
            }
        }
    },
    validationLevel: "strict",    // or "moderate"
    validationAction: "error"     // or "warn"
})

// Modify existing collection
db.runCommand({
    collMod: "users",
    validator: { /* ... */ }
})
```

---

## Anti-Patterns to Avoid

### 1. Massive Arrays

```javascript
// ❌ Bad: Unbounded array growth
{
    _id: "popular_page",
    views: [
        { userId: "...", timestamp: new Date() },
        // ... millions of entries
    ]
}

// ✅ Good: Separate collection
// page_views collection
{
    pageId: "popular_page",
    userId: "...",
    timestamp: new Date()
}
```

### 2. Deep Nesting

```javascript
// ❌ Bad: Too deeply nested
{
    level1: {
        level2: {
            level3: {
                level4: {
                    level5: { /* hard to query and update */ }
                }
            }
        }
    }
}

// ✅ Good: Flatten structure
{
    "level1.level2.key": "value",
    metadata: { /* ... */ }
}
```

### 3. Unnecessary Normalization

```javascript
// ❌ Bad: Over-normalized (SQL-style)
// users: { _id, name, addressId }
// addresses: { _id, street, city }
// cities: { _id, name, countryId }
// countries: { _id, name }

// ✅ Good: Embed related data
{
    _id: ObjectId("..."),
    name: "John",
    address: {
        street: "123 Main St",
        city: "New York",
        country: "USA"
    }
}
```

### 4. BLOB Storage

```javascript
// ❌ Bad: Storing large files in documents
{
    name: "video.mp4",
    data: BinData(0, "...huge binary...")  // May exceed 16MB
}

// ✅ Good: Use GridFS or external storage
{
    name: "video.mp4",
    url: "https://cdn.example.com/videos/video.mp4",
    size: 104857600,
    contentType: "video/mp4"
}
```

---

## Design Checklist

```markdown
Before finalizing your schema, ask:

□ What are the main access patterns?
□ What's the read/write ratio?
□ How large can arrays grow?
□ How often does embedded data change?
□ Do I need atomic operations across documents?
□ What are the index requirements?
□ Will documents fit within 16MB limit?
□ Is data accessed together stored together?
```

---

## Practice Exercises

### Exercise 1: Blog Platform
Design schema for:
- Users (profile, settings)
- Posts (content, tags, views)
- Comments (nested replies)
- Likes

### Exercise 2: E-commerce
Design schema for:
- Products (variations, inventory)
- Orders (items, shipping)
- Reviews (ratings, helpful votes)

### Exercise 3: Social Network
Design schema for:
- Users (profile, followers)
- Posts (media, reactions)
- Messages (threads, read status)

---

## Summary

In this chapter, you learned:
- ✅ Embedding vs referencing trade-offs
- ✅ One-to-one, one-to-few, one-to-many patterns
- ✅ Advanced patterns: subset, extended reference, bucket
- ✅ Schema validation with JSON Schema
- ✅ Anti-patterns to avoid
- ✅ Design decision checklist

---

**Next Chapter:** [Relationships →](./08-Relationships.md)




