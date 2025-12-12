# Chapter 5: Aggregation Framework 🔧

The Aggregation Framework is MongoDB's powerful data processing pipeline for transforming, filtering, grouping, and analyzing data.

---

## Pipeline Concept

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  Collection  │───▶│   $match     │───▶│   $group     │───▶│   $sort      │───▶ Result
│  (Documents) │    │  (Filter)    │    │  (Aggregate) │    │  (Order)     │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
```

Documents flow through stages, each stage transforms the data.

```javascript
db.collection.aggregate([
    { $stage1: { /* ... */ } },
    { $stage2: { /* ... */ } },
    { $stage3: { /* ... */ } }
])
```

---

## Sample Data

```javascript
use analytics

db.orders.insertMany([
    { _id: 1, customer: "John", items: [{ product: "Laptop", price: 999, qty: 1 }, { product: "Mouse", price: 29, qty: 2 }], status: "completed", date: new Date("2024-01-15") },
    { _id: 2, customer: "Jane", items: [{ product: "Phone", price: 699, qty: 1 }], status: "completed", date: new Date("2024-01-20") },
    { _id: 3, customer: "John", items: [{ product: "Keyboard", price: 79, qty: 1 }], status: "pending", date: new Date("2024-02-01") },
    { _id: 4, customer: "Bob", items: [{ product: "Monitor", price: 399, qty: 2 }], status: "completed", date: new Date("2024-02-10") },
    { _id: 5, customer: "Jane", items: [{ product: "Laptop", price: 999, qty: 1 }, { product: "Bag", price: 49, qty: 1 }], status: "completed", date: new Date("2024-02-15") }
]);
```

---

## Core Pipeline Stages

### $match

Filter documents (like find()).

```javascript
// Simple match
db.orders.aggregate([
    { $match: { status: "completed" } }
])

// Multiple conditions
db.orders.aggregate([
    { 
        $match: { 
            status: "completed",
            date: { $gte: new Date("2024-01-01") }
        } 
    }
])

// With $or
db.orders.aggregate([
    {
        $match: {
            $or: [
                { status: "completed" },
                { customer: "John" }
            ]
        }
    }
])

// Best practice: Put $match early to reduce documents
```

### $project

Shape documents (include, exclude, compute fields).

```javascript
// Include specific fields
db.orders.aggregate([
    { 
        $project: { 
            customer: 1, 
            status: 1, 
            _id: 0 
        } 
    }
])

// Rename fields
db.orders.aggregate([
    {
        $project: {
            customerName: "$customer",
            orderStatus: "$status"
        }
    }
])

// Computed fields
db.orders.aggregate([
    {
        $project: {
            customer: 1,
            totalItems: { $size: "$items" },
            orderYear: { $year: "$date" },
            orderMonth: { $month: "$date" }
        }
    }
])

// Nested fields
db.orders.aggregate([
    {
        $project: {
            "items.product": 1,
            "items.price": 1
        }
    }
])
```

### $group

Group documents and perform aggregations.

```javascript
// Group by field and count
db.orders.aggregate([
    {
        $group: {
            _id: "$status",
            count: { $sum: 1 }
        }
    }
])
// Result: { _id: "completed", count: 4 }, { _id: "pending", count: 1 }

// Multiple aggregations
db.orders.aggregate([
    {
        $group: {
            _id: "$customer",
            orderCount: { $sum: 1 },
            totalSpent: { $sum: { $sum: "$items.price" } },
            firstOrder: { $min: "$date" },
            lastOrder: { $max: "$date" }
        }
    }
])

// Group by multiple fields
db.orders.aggregate([
    {
        $group: {
            _id: {
                customer: "$customer",
                year: { $year: "$date" }
            },
            orders: { $sum: 1 }
        }
    }
])

// Group all documents (_id: null)
db.orders.aggregate([
    {
        $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalRevenue: { $sum: { $sum: "$items.price" } }
        }
    }
])

// Collect into array
db.orders.aggregate([
    {
        $group: {
            _id: "$customer",
            products: { $push: "$items.product" },
            allItems: { $push: "$items" }
        }
    }
])

// Unique values with $addToSet
db.orders.aggregate([
    {
        $group: {
            _id: "$customer",
            uniqueProducts: { $addToSet: "$items.product" }
        }
    }
])
```

### Group Accumulators

```javascript
// $sum - Sum values
{ $sum: "$amount" }
{ $sum: 1 }  // Count

// $avg - Average
{ $avg: "$price" }

// $min / $max
{ $min: "$date" }
{ $max: "$score" }

// $first / $last (order matters, use with $sort)
{ $first: "$item" }
{ $last: "$item" }

// $push - Collect into array
{ $push: "$item" }

// $addToSet - Collect unique values
{ $addToSet: "$category" }

// $stdDevPop / $stdDevSamp - Standard deviation
{ $stdDevPop: "$values" }

// $mergeObjects - Merge documents
{ $mergeObjects: "$data" }
```

### $sort

Order documents.

```javascript
db.orders.aggregate([
    { $match: { status: "completed" } },
    { $sort: { date: -1 } }  // Descending
])

// Multiple sort fields
db.orders.aggregate([
    { $sort: { status: 1, date: -1 } }
])

// Sort after group
db.orders.aggregate([
    { $group: { _id: "$customer", total: { $sum: 1 } } },
    { $sort: { total: -1 } }
])
```

### $limit and $skip

Pagination.

```javascript
// Top 5 customers
db.orders.aggregate([
    { $group: { _id: "$customer", orders: { $sum: 1 } } },
    { $sort: { orders: -1 } },
    { $limit: 5 }
])

// Pagination
const page = 2;
const perPage = 10;
db.orders.aggregate([
    { $sort: { date: -1 } },
    { $skip: (page - 1) * perPage },
    { $limit: perPage }
])
```

### $unwind

Flatten arrays (creates document per array element).

```javascript
// Unwind items array
db.orders.aggregate([
    { $unwind: "$items" }
])
// Each item becomes a separate document

// Preserve empty arrays
db.orders.aggregate([
    { 
        $unwind: { 
            path: "$items",
            preserveNullAndEmptyArrays: true 
        } 
    }
])

// Include array index
db.orders.aggregate([
    { 
        $unwind: { 
            path: "$items",
            includeArrayIndex: "itemIndex" 
        } 
    }
])

// Common pattern: Unwind then group
db.orders.aggregate([
    { $unwind: "$items" },
    { 
        $group: {
            _id: "$items.product",
            totalSold: { $sum: "$items.qty" },
            revenue: { $sum: { $multiply: ["$items.price", "$items.qty"] } }
        }
    },
    { $sort: { revenue: -1 } }
])
```

### $lookup (Join)

Join with another collection.

```javascript
// Basic lookup
db.orders.aggregate([
    {
        $lookup: {
            from: "customers",       // Collection to join
            localField: "customer",  // Field from orders
            foreignField: "name",    // Field from customers
            as: "customerInfo"       // Output array field
        }
    }
])

// Unwind after lookup (1:1 relationship)
db.orders.aggregate([
    {
        $lookup: {
            from: "customers",
            localField: "customerId",
            foreignField: "_id",
            as: "customer"
        }
    },
    { $unwind: "$customer" }
])

// Pipeline lookup (advanced)
db.orders.aggregate([
    {
        $lookup: {
            from: "products",
            let: { orderItems: "$items" },
            pipeline: [
                {
                    $match: {
                        $expr: {
                            $in: ["$name", "$$orderItems.product"]
                        }
                    }
                },
                { $project: { name: 1, category: 1 } }
            ],
            as: "productDetails"
        }
    }
])

// Multiple lookups
db.orders.aggregate([
    {
        $lookup: {
            from: "customers",
            localField: "customerId",
            foreignField: "_id",
            as: "customer"
        }
    },
    { $unwind: "$customer" },
    {
        $lookup: {
            from: "products",
            localField: "items.productId",
            foreignField: "_id",
            as: "products"
        }
    }
])
```

---

## Transformation Stages

### $addFields

Add new fields (keeps existing).

```javascript
db.orders.aggregate([
    {
        $addFields: {
            itemCount: { $size: "$items" },
            orderYear: { $year: "$date" },
            isHighValue: { $gte: [{ $sum: "$items.price" }, 500] }
        }
    }
])
```

### $set (Alias for $addFields)

```javascript
db.orders.aggregate([
    {
        $set: {
            processed: true,
            processedAt: new Date()
        }
    }
])
```

### $unset

Remove fields.

```javascript
db.orders.aggregate([
    { $unset: ["internalNotes", "tempData"] }
])

// Or single field
db.orders.aggregate([
    { $unset: "internalNotes" }
])
```

### $replaceRoot

Replace document with nested document.

```javascript
db.orders.aggregate([
    {
        $replaceRoot: { 
            newRoot: "$customer"  // Make customer subdoc the root
        }
    }
])

// With merge
db.orders.aggregate([
    {
        $replaceRoot: {
            newRoot: {
                $mergeObjects: [
                    { orderId: "$_id" },
                    "$customer"
                ]
            }
        }
    }
])
```

### $replaceWith (Alias)

```javascript
db.orders.aggregate([
    { $replaceWith: "$customer" }
])
```

---

## Expression Operators

### Arithmetic

```javascript
db.orders.aggregate([
    {
        $project: {
            total: { $sum: "$items.price" },
            average: { $avg: "$items.price" },
            subtotal: { $multiply: ["$price", "$qty"] },
            discount: { $subtract: ["$price", "$discountAmount"] },
            tax: { $divide: ["$price", 10] },
            rounded: { $round: ["$price", 2] },
            ceiling: { $ceil: "$price" },
            floor: { $floor: "$price" },
            absolute: { $abs: "$balance" },
            power: { $pow: ["$base", "$exponent"] },
            squareRoot: { $sqrt: "$value" }
        }
    }
])
```

### String

```javascript
db.orders.aggregate([
    {
        $project: {
            fullName: { $concat: ["$firstName", " ", "$lastName"] },
            upperName: { $toUpper: "$name" },
            lowerName: { $toLower: "$name" },
            trimmed: { $trim: { input: "$name" } },
            substring: { $substr: ["$name", 0, 3] },
            length: { $strLenCP: "$name" },
            split: { $split: ["$email", "@"] },
            replaced: { $replaceAll: { input: "$text", find: "old", replacement: "new" } }
        }
    }
])
```

### Date

```javascript
db.orders.aggregate([
    {
        $project: {
            year: { $year: "$date" },
            month: { $month: "$date" },
            day: { $dayOfMonth: "$date" },
            dayOfWeek: { $dayOfWeek: "$date" },
            hour: { $hour: "$date" },
            formatted: {
                $dateToString: {
                    format: "%Y-%m-%d",
                    date: "$date"
                }
            },
            parsed: {
                $dateFromString: {
                    dateString: "$dateStr",
                    format: "%Y-%m-%d"
                }
            },
            diff: {
                $dateDiff: {
                    startDate: "$startDate",
                    endDate: "$endDate",
                    unit: "day"
                }
            }
        }
    }
])
```

### Conditional

```javascript
db.orders.aggregate([
    {
        $project: {
            status: 1,
            priority: {
                $cond: {
                    if: { $gte: ["$total", 1000] },
                    then: "high",
                    else: "normal"
                }
            },
            // Short form
            priority2: {
                $cond: [{ $gte: ["$total", 1000] }, "high", "normal"]
            },
            // Switch (multiple conditions)
            tier: {
                $switch: {
                    branches: [
                        { case: { $gte: ["$total", 1000] }, then: "gold" },
                        { case: { $gte: ["$total", 500] }, then: "silver" },
                        { case: { $gte: ["$total", 100] }, then: "bronze" }
                    ],
                    default: "standard"
                }
            },
            // Null handling
            displayName: { $ifNull: ["$nickname", "$name"] }
        }
    }
])
```

### Array

```javascript
db.orders.aggregate([
    {
        $project: {
            firstItem: { $first: "$items" },
            lastItem: { $last: "$items" },
            itemCount: { $size: "$items" },
            hasLaptop: { $in: ["Laptop", "$items.product"] },
            filtered: {
                $filter: {
                    input: "$items",
                    as: "item",
                    cond: { $gte: ["$$item.price", 100] }
                }
            },
            mapped: {
                $map: {
                    input: "$items",
                    as: "item",
                    in: { name: "$$item.product", total: { $multiply: ["$$item.price", "$$item.qty"] } }
                }
            },
            reduced: {
                $reduce: {
                    input: "$items",
                    initialValue: 0,
                    in: { $add: ["$$value", "$$this.price"] }
                }
            },
            sliced: { $slice: ["$items", 2] },
            reversed: { $reverseArray: "$items" },
            sorted: {
                $sortArray: {
                    input: "$items",
                    sortBy: { price: -1 }
                }
            }
        }
    }
])
```

---

## Output Stages

### $out

Write results to collection (replaces).

```javascript
db.orders.aggregate([
    { $group: { _id: "$customer", total: { $sum: 1 } } },
    { $out: "customer_stats" }
])

// Note: Replaces entire collection
```

### $merge

Merge results into collection.

```javascript
db.orders.aggregate([
    { $group: { _id: "$customer", orders: { $sum: 1 } } },
    {
        $merge: {
            into: "customer_stats",
            on: "_id",
            whenMatched: "merge",   // or "replace", "keepExisting", "fail"
            whenNotMatched: "insert"  // or "discard", "fail"
        }
    }
])
```

### $facet

Multiple pipelines on same input.

```javascript
db.orders.aggregate([
    {
        $facet: {
            "totalStats": [
                { $count: "total" }
            ],
            "byStatus": [
                { $group: { _id: "$status", count: { $sum: 1 } } }
            ],
            "topCustomers": [
                { $group: { _id: "$customer", orders: { $sum: 1 } } },
                { $sort: { orders: -1 } },
                { $limit: 5 }
            ]
        }
    }
])
```

### $bucket

Group into buckets.

```javascript
db.orders.aggregate([
    { $unwind: "$items" },
    {
        $bucket: {
            groupBy: "$items.price",
            boundaries: [0, 50, 100, 500, 1000],
            default: "Other",
            output: {
                count: { $sum: 1 },
                products: { $push: "$items.product" }
            }
        }
    }
])
```

### $bucketAuto

Automatic bucket distribution.

```javascript
db.orders.aggregate([
    { $unwind: "$items" },
    {
        $bucketAuto: {
            groupBy: "$items.price",
            buckets: 4,
            output: {
                count: { $sum: 1 },
                avgPrice: { $avg: "$items.price" }
            }
        }
    }
])
```

---

## Practical Examples

### Sales Report

```javascript
db.orders.aggregate([
    { $match: { status: "completed" } },
    { $unwind: "$items" },
    {
        $group: {
            _id: {
                year: { $year: "$date" },
                month: { $month: "$date" }
            },
            revenue: { $sum: { $multiply: ["$items.price", "$items.qty"] } },
            orders: { $sum: 1 },
            avgOrderValue: { $avg: { $multiply: ["$items.price", "$items.qty"] } }
        }
    },
    { $sort: { "_id.year": -1, "_id.month": -1 } },
    {
        $project: {
            _id: 0,
            year: "$_id.year",
            month: "$_id.month",
            revenue: { $round: ["$revenue", 2] },
            orders: 1,
            avgOrderValue: { $round: ["$avgOrderValue", 2] }
        }
    }
])
```

### Customer Analytics

```javascript
db.orders.aggregate([
    {
        $group: {
            _id: "$customer",
            totalOrders: { $sum: 1 },
            totalSpent: { $sum: { $sum: "$items.price" } },
            firstOrder: { $min: "$date" },
            lastOrder: { $max: "$date" },
            products: { $addToSet: "$items.product" }
        }
    },
    {
        $addFields: {
            avgOrderValue: { $divide: ["$totalSpent", "$totalOrders"] },
            daysSinceLastOrder: {
                $dateDiff: {
                    startDate: "$lastOrder",
                    endDate: new Date(),
                    unit: "day"
                }
            }
        }
    },
    { $sort: { totalSpent: -1 } }
])
```

---

## Performance Tips

```javascript
// 1. Put $match early
db.orders.aggregate([
    { $match: { status: "completed" } },  // Filter first!
    { $group: { /* ... */ } }
])

// 2. Use indexes
// $match can use indexes at the beginning of pipeline

// 3. Limit fields early
db.orders.aggregate([
    { $project: { customer: 1, items: 1 } },  // Reduce document size
    { $unwind: "$items" },
    { $group: { /* ... */ } }
])

// 4. Use allowDiskUse for large datasets
db.orders.aggregate([/* ... */], { allowDiskUse: true })

// 5. Explain the pipeline
db.orders.explain().aggregate([/* ... */])
```

---

## Summary

In this chapter, you learned:
- ✅ Pipeline concept and data flow
- ✅ $match, $project, $group, $sort, $limit, $skip
- ✅ $unwind for array flattening
- ✅ $lookup for joins
- ✅ Transformation stages: $addFields, $set, $unset
- ✅ Expression operators (arithmetic, string, date, array)
- ✅ Output stages: $out, $merge, $facet, $bucket

---

**Next Chapter:** [Indexes →](./06-Indexes.md)



