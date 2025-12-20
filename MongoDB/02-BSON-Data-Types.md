# Chapter 2: BSON & Data Types 📊

MongoDB stores data in BSON (Binary JSON), which extends JSON with additional data types and efficient encoding.

---

## BSON vs JSON

| Aspect | JSON | BSON |
|--------|------|------|
| Format | Text-based | Binary |
| Data Types | 6 types | 20+ types |
| Encoding | Slower | Faster |
| Size | Larger | More compact (usually) |
| Features | Basic | Dates, Binary, ObjectId, etc. |

```javascript
// JSON (what you write)
{
    "name": "John",
    "age": 30,
    "created": "2024-01-15T10:30:00Z"  // String!
}

// BSON (how MongoDB stores it)
// Includes type markers, length prefixes, native date type
// Enables efficient traversal and querying
```

---

## BSON Data Types

### String

```javascript
// String type
db.collection.insertOne({
    name: "John Doe",
    email: "john@example.com",
    description: "A long text string..."
});

// UTF-8 encoded
// Maximum size: ~16MB (document limit)
```

### Numbers

```javascript
// Integer (32-bit)
db.products.insertOne({ quantity: 100 });
db.products.insertOne({ quantity: NumberInt(100) });  // Explicit

// Long (64-bit integer)
db.analytics.insertOne({ views: NumberLong("9007199254740993") });

// Double (64-bit floating point) - Default for numbers
db.products.insertOne({ price: 29.99 });

// Decimal128 (128-bit decimal) - For precise decimals
db.financials.insertOne({
    amount: NumberDecimal("19.99"),
    tax: NumberDecimal("0.0825")
});

// Check number types
typeof db.products.findOne().price  // "number"
db.products.findOne().price instanceof NumberDecimal  // Check specific type
```

### Boolean

```javascript
db.users.insertOne({
    isActive: true,
    isVerified: false,
    hasSubscription: null  // Note: null is different from false
});

// Query booleans
db.users.find({ isActive: true });
db.users.find({ isActive: { $ne: false } });  // true or null
```

### Date

```javascript
// Current date
db.events.insertOne({
    eventName: "Conference",
    createdAt: new Date(),
    scheduledFor: new Date("2024-06-15T14:00:00Z")
});

// Date methods in mongosh
new Date()                           // Current date/time
new Date("2024-06-15")              // Parse string
new Date(2024, 5, 15)               // Year, Month (0-indexed), Day
new Date(1718452800000)             // Milliseconds since epoch
ISODate("2024-06-15T14:00:00Z")     // ISO format

// Date operations
const now = new Date();
const yesterday = new Date(now.getTime() - 24*60*60*1000);

// Query dates
db.events.find({ createdAt: { $gt: new Date("2024-01-01") } });
db.events.find({ 
    scheduledFor: { 
        $gte: new Date("2024-06-01"), 
        $lt: new Date("2024-07-01") 
    } 
});
```

### Timestamp

```javascript
// Internal MongoDB timestamp (for replication)
// Not typically used in application code
db.test.insertOne({
    ts: new Timestamp()  // Current timestamp
});

// For application timestamps, use Date instead
```

### ObjectId

```javascript
// ObjectId - 12-byte unique identifier
// Format: 4-byte timestamp | 5-byte random | 3-byte counter

// Auto-generated _id
db.users.insertOne({ name: "John" });
// { "_id": ObjectId("6575b3d5f3c8a8b3d5f3c8a8"), "name": "John" }

// Create ObjectId manually
const id = new ObjectId();
const specificId = new ObjectId("6575b3d5f3c8a8b3d5f3c8a8");

// ObjectId methods
id.getTimestamp()                    // Extract creation time
id.toString()                        // "6575b3d5f3c8a8b3d5f3c8a8"
id.valueOf()                         // Same as toString()

// Query by ObjectId
db.users.find({ _id: ObjectId("6575b3d5f3c8a8b3d5f3c8a8") });

// Check if string is valid ObjectId
ObjectId.isValid("6575b3d5f3c8a8b3d5f3c8a8")  // true
ObjectId.isValid("invalid")                    // false

// ObjectId structure breakdown:
// 6575b3d5 - timestamp (4 bytes)
// f3c8a8    - machine identifier (3 bytes - now random)
// b3d5      - process id (2 bytes - now random)
// f3c8a8    - counter (3 bytes)
```

### Array

```javascript
// Arrays can contain any BSON type
db.products.insertOne({
    name: "T-Shirt",
    sizes: ["S", "M", "L", "XL"],
    colors: ["red", "blue", "green"],
    tags: ["clothing", "summer", "sale"],
    priceHistory: [
        { date: new Date("2024-01-01"), price: 29.99 },
        { date: new Date("2024-02-01"), price: 24.99 }
    ]
});

// Query arrays
db.products.find({ sizes: "M" });                    // Contains "M"
db.products.find({ sizes: { $all: ["S", "M"] } });   // Contains all
db.products.find({ "sizes.0": "S" });                // First element is "S"
db.products.find({ sizes: { $size: 4 } });           // Exactly 4 elements

// Update arrays
db.products.updateOne(
    { name: "T-Shirt" },
    { $push: { sizes: "XXL" } }
);

db.products.updateOne(
    { name: "T-Shirt" },
    { $addToSet: { tags: "new" } }  // Add if not exists
);
```

### Embedded Document (Object)

```javascript
// Nested documents
db.users.insertOne({
    name: "John Doe",
    address: {
        street: "123 Main St",
        city: "New York",
        state: "NY",
        zip: "10001",
        coordinates: {
            lat: 40.7128,
            lng: -74.0060
        }
    },
    preferences: {
        theme: "dark",
        notifications: {
            email: true,
            push: false
        }
    }
});

// Query nested documents
db.users.find({ "address.city": "New York" });
db.users.find({ "address.coordinates.lat": { $gt: 40 } });
db.users.find({ "preferences.notifications.email": true });

// Update nested fields
db.users.updateOne(
    { name: "John Doe" },
    { $set: { "address.zip": "10002" } }
);
```

### Binary Data

```javascript
// Binary data (for files, images, etc.)
db.files.insertOne({
    filename: "image.png",
    data: new BinData(0, "base64encodeddata=="),
    contentType: "image/png"
});

// BinData subtypes:
// 0 - Generic binary
// 1 - Function (deprecated)
// 2 - Binary (old) - deprecated
// 3 - UUID (old)
// 4 - UUID (new)
// 5 - MD5
// 128-255 - User defined

// For large files, use GridFS instead (Chapter 15)
```

### Null and Undefined

```javascript
// null - Explicit null value
db.users.insertOne({
    name: "John",
    middleName: null,       // Explicitly no value
    nickname: undefined     // Will be stored as null
});

// Query null
db.users.find({ middleName: null });         // Matches null AND missing
db.users.find({ middleName: { $eq: null } }); // Same
db.users.find({ middleName: { $type: "null" } }); // Only explicit null
db.users.find({ nickname: { $exists: false } });  // Missing field only
```

### Regular Expression

```javascript
// Regex type
db.users.insertOne({
    name: "John",
    email: "john@example.com",
    pattern: /^[a-z]+$/i  // Stored as regex type
});

// Query with regex
db.users.find({ email: /example\.com$/i });
db.users.find({ name: { $regex: "^john", $options: "i" } });

// Regex options:
// i - case insensitive
// m - multiline
// x - extended (ignore whitespace)
// s - dotall (. matches newline)
```

### JavaScript Code (Legacy)

```javascript
// JavaScript code type (deprecated for queries)
// Use only with mapReduce (also deprecated)
db.code.insertOne({
    name: "myFunction",
    code: new Code("function() { return 1; }")
});

// With scope
db.code.insertOne({
    name: "myFunction",
    code: new Code("function() { return x; }", { x: 1 })
});

// Note: For most use cases, use aggregation pipeline instead
```

### Min/Max Keys

```javascript
// MinKey and MaxKey - Compare lower/higher than all values
db.test.insertOne({ value: MinKey() });
db.test.insertOne({ value: MaxKey() });

// Useful for range queries
db.test.find({ value: { $gte: MinKey(), $lte: MaxKey() } });
```

---

## Type Checking

### $type Operator

```javascript
// Query by type
db.collection.find({ field: { $type: "string" } });
db.collection.find({ field: { $type: "number" } });
db.collection.find({ field: { $type: "objectId" } });

// Type aliases and numbers:
// "double" or 1
// "string" or 2
// "object" or 3
// "array" or 4
// "binData" or 5
// "objectId" or 7
// "bool" or 8
// "date" or 9
// "null" or 10
// "regex" or 11
// "int" or 16
// "timestamp" or 17
// "long" or 18
// "decimal" or 19
// "minKey" or -1
// "maxKey" or 127

// Multiple types
db.collection.find({ field: { $type: ["string", "null"] } });

// Practical example: Find documents where age is a number
db.users.find({ age: { $type: "number" } });
```

### typeof in Shell

```javascript
// Check type in mongosh
const doc = db.users.findOne();
typeof doc.name           // "string"
typeof doc.age            // "number"
typeof doc.createdAt      // "object" (Date is object in JS)

// Instance checks
doc.createdAt instanceof Date     // true
doc._id instanceof ObjectId       // true
Array.isArray(doc.tags)           // true
```

---

## Type Conversion

### In Aggregation

```javascript
// Convert types using aggregation
db.users.aggregate([
    {
        $project: {
            stringAge: { $toString: "$age" },
            intAge: { $toInt: "$age" },
            doublePrice: { $toDouble: "$price" },
            boolActive: { $toBool: "$isActive" },
            dateStr: { $toString: "$createdAt" },
            objectIdStr: { $toString: "$_id" }
        }
    }
]);

// Convert string to date
db.events.aggregate([
    {
        $addFields: {
            parsedDate: {
                $dateFromString: {
                    dateString: "$dateStr",
                    format: "%Y-%m-%d"
                }
            }
        }
    }
]);

// Convert date to string
db.events.aggregate([
    {
        $addFields: {
            formattedDate: {
                $dateToString: {
                    format: "%Y-%m-%d %H:%M",
                    date: "$createdAt"
                }
            }
        }
    }
]);
```

### $convert Operator

```javascript
db.collection.aggregate([
    {
        $project: {
            converted: {
                $convert: {
                    input: "$value",
                    to: "int",
                    onError: 0,      // Default on error
                    onNull: 0        // Default on null
                }
            }
        }
    }
]);
```

---

## Document Size Limit

```javascript
// Maximum document size: 16 MB
// Check document size
Object.bsonsize(db.collection.findOne())

// Large document example
db.test.insertOne({
    title: "Large Document",
    content: "x".repeat(16 * 1024 * 1024)  // Would fail!
});
// Error: Document exceeds maximum size

// Solutions for large data:
// 1. Split into multiple documents
// 2. Use GridFS for files
// 3. Store in external storage (S3) and reference URL
```

---

## Schema Validation

```javascript
// Create collection with validation
db.createCollection("users", {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["name", "email", "age"],
            properties: {
                name: {
                    bsonType: "string",
                    description: "must be a string and is required"
                },
                email: {
                    bsonType: "string",
                    pattern: "^.+@.+\\..+$",
                    description: "must be a valid email"
                },
                age: {
                    bsonType: "int",
                    minimum: 0,
                    maximum: 150,
                    description: "must be an integer between 0 and 150"
                },
                status: {
                    enum: ["active", "inactive", "pending"],
                    description: "must be one of the allowed values"
                },
                address: {
                    bsonType: "object",
                    properties: {
                        city: { bsonType: "string" },
                        zip: { bsonType: "string" }
                    }
                }
            }
        }
    },
    validationLevel: "strict",      // strict or moderate
    validationAction: "error"       // error or warn
});

// Add validation to existing collection
db.runCommand({
    collMod: "users",
    validator: {
        $jsonSchema: {
            // ... schema
        }
    }
});

// Test validation
db.users.insertOne({ name: "John" });  // Fails - missing email, age
```

---

## Best Practices

### 1. Choose Appropriate Number Types

```javascript
// For integers
{ count: NumberInt(100) }           // 32-bit, when value fits
{ bigCount: NumberLong("999999999999") }  // 64-bit for large integers

// For money/decimals
{ price: NumberDecimal("19.99") }    // Precise decimals
// NOT: { price: 19.99 }             // Floating point imprecision
```

### 2. Use Native Date Type

```javascript
// Good
{ createdAt: new Date() }

// Bad - storing as string
{ createdAt: "2024-01-15T10:30:00Z" }

// Dates enable:
// - Range queries
// - Date aggregation ($year, $month, $dayOfWeek)
// - Index optimization
```

### 3. Consistent Types

```javascript
// Bad - mixed types
{ age: 25 }
{ age: "25" }
{ age: null }

// Good - consistent type
{ age: NumberInt(25) }
{ age: NumberInt(0) }  // Use 0 instead of null if needed
```

### 4. Array vs Embedded Document

```javascript
// Use arrays for:
// - Lists of similar items
// - Order matters
// - Will query with $elemMatch, $push, $pull

// Use embedded documents for:
// - Named properties
// - Structured data
// - Order doesn't matter
```

---

## Practice Exercises

### Exercise 1: Data Types
Create a `products` collection with documents containing all major data types:
- String (name, description)
- Numbers (price, quantity)
- Date (createdAt)
- Array (tags, sizes)
- Embedded document (specifications)
- Boolean (isAvailable)

### Exercise 2: Type Queries
1. Find all products where price is a decimal
2. Find all products with null descriptions
3. Find products where tags is an array

### Exercise 3: Schema Validation
Create a validated `orders` collection requiring:
- customerId (ObjectId)
- items (array)
- total (decimal)
- status (enum: pending/shipped/delivered)

---

## Summary

In this chapter, you learned:
- ✅ BSON vs JSON differences
- ✅ All MongoDB data types
- ✅ ObjectId structure and usage
- ✅ Working with dates, arrays, embedded documents
- ✅ Type checking and conversion
- ✅ Schema validation
- ✅ Best practices for data types

---

**Next Chapter:** [CRUD Operations →](./03-CRUD-Operations.md)




