# MongoDB Complete Learning Guide 🍃

A comprehensive guide to learning MongoDB from basics to advanced concepts with practical examples.

## 📚 Table of Contents

### **Part 1: Foundations**
1. [Introduction & Setup](./01-Introduction-Setup.md)
   - What is MongoDB?
   - Installation & Configuration
   - MongoDB Shell (mongosh)
   - MongoDB Compass GUI

2. [BSON & Data Types](./02-BSON-Data-Types.md)
   - BSON vs JSON
   - All Data Types
   - ObjectId Explained
   - Date and Timestamp

3. [CRUD Operations](./03-CRUD-Operations.md)
   - insertOne, insertMany
   - find, findOne
   - updateOne, updateMany
   - deleteOne, deleteMany
   - Bulk Operations

### **Part 2: Querying Data**
4. [Query Operators](./04-Query-Operators.md)
   - Comparison: $eq, $gt, $lt, $in
   - Logical: $and, $or, $not
   - Element: $exists, $type
   - Array: $elemMatch, $all, $size
   - Evaluation: $regex, $expr

5. [Aggregation Framework](./05-Aggregation-Framework.md)
   - Pipeline Concepts
   - $match, $group, $project
   - $lookup (Joins)
   - $unwind, $sort, $limit
   - Advanced Operators

6. [Indexes](./06-Indexes.md)
   - Single & Compound Indexes
   - Multikey Indexes (Arrays)
   - Text & Geospatial Indexes
   - TTL & Unique Indexes
   - explain() Analysis

### **Part 3: Data Modeling**
7. [Schema Design](./07-Schema-Design.md)
   - Document Structure
   - Schema Validation
   - Design Patterns
   - Anti-Patterns

8. [Relationships](./08-Relationships.md)
   - Embedding vs Referencing
   - One-to-One
   - One-to-Many
   - Many-to-Many
   - Denormalization Strategies

### **Part 4: Transactions & Reliability**
9. [Transactions](./09-Transactions.md)
   - ACID in MongoDB
   - Multi-document Transactions
   - Read/Write Concerns
   - Causal Consistency

10. [Replication](./10-Replication.md)
    - Replica Sets
    - Elections & Failover
    - Read Preferences
    - Arbiter Nodes

11. [Sharding](./11-Sharding.md)
    - Horizontal Scaling
    - Shard Keys
    - Chunk Migration
    - Balancer

### **Part 5: Security & Operations**
12. [Security](./12-Security.md)
    - Authentication
    - Role-Based Access Control
    - Encryption at Rest
    - TLS/SSL

13. [Performance](./13-Performance.md)
    - Query Optimization
    - Profiler
    - Connection Pooling
    - Memory & Storage

### **Part 6: Application Development**
14. [Mongoose ODM](./14-Mongoose-ODM.md)
    - Schemas & Models
    - Validation
    - Middleware (Hooks)
    - Population (Joins)
    - Virtuals & Methods

15. [Advanced Features](./15-Advanced-Features.md)
    - Change Streams
    - GridFS (Large Files)
    - Time Series Collections
    - Atlas Search

### **Part 7: Interview Preparation**
16. [Interview Questions](./16-Interview-Questions.md)
    - Beginner to Advanced Q&A
    - Scenario-Based Questions
    - Schema Design Problems

---

## 🎯 Learning Path

### Beginner (Week 1-2)
- Chapters 1-4: Foundations & CRUD

### Intermediate (Week 3-4)
- Chapters 5-9: Aggregation, Modeling, Transactions

### Advanced (Week 5-6)
- Chapters 10-15: Scaling, Security, Mongoose

### Interview Ready (Week 7)
- Chapter 16: Practice & Review

---

## 🛠️ Practice Database

Throughout this guide, we'll use a sample e-commerce database:

```javascript
// Databases we'll build:
// - ecommerce
//   - users
//   - products
//   - orders
//   - reviews
//   - categories
```

---

## 📖 Quick Reference: mongosh Commands

| Command | Description |
|---------|-------------|
| `show dbs` | List all databases |
| `use dbname` | Switch to database |
| `show collections` | List collections |
| `db.collection.find()` | Query documents |
| `db.collection.insertOne()` | Insert document |
| `db.collection.updateOne()` | Update document |
| `db.collection.deleteOne()` | Delete document |
| `db.collection.createIndex()` | Create index |
| `db.collection.explain()` | Query analysis |
| `db.stats()` | Database statistics |
| `exit` | Exit shell |

---

## 🔗 MongoDB vs SQL Terminology

| SQL | MongoDB |
|-----|---------|
| Database | Database |
| Table | Collection |
| Row | Document |
| Column | Field |
| Primary Key | _id |
| Index | Index |
| JOIN | $lookup / Embedding |
| GROUP BY | $group (Aggregation) |

---

Happy Learning! 🚀



