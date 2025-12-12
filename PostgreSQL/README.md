# PostgreSQL Complete Learning Guide 🐘

A comprehensive guide to learning PostgreSQL from basics to advanced concepts with practical examples.

## 📚 Table of Contents

### **Part 1: Foundations**
1. [Introduction & Setup](./01-Introduction-Setup.md)
   - What is PostgreSQL?
   - Installation & Configuration
   - psql Command Line Basics
   - GUI Tools

2. [Data Types](./02-Data-Types.md)
   - Numeric Types
   - Character Types
   - Date/Time Types
   - Boolean, UUID, Arrays
   - JSON/JSONB

3. [Tables & Schemas](./03-Tables-Schemas.md)
   - CREATE, ALTER, DROP TABLE
   - Schemas and Namespaces
   - Table Inheritance

4. [CRUD Operations](./04-CRUD-Operations.md)
   - INSERT, SELECT, UPDATE, DELETE
   - UPSERT (ON CONFLICT)
   - RETURNING Clause
   - COPY Command

### **Part 2: Querying Data**
5. [Constraints](./05-Constraints.md)
   - PRIMARY KEY, FOREIGN KEY
   - UNIQUE, NOT NULL, CHECK
   - DEFAULT Values
   - Exclusion Constraints

6. [Joins](./06-Joins.md)
   - INNER, LEFT, RIGHT, FULL JOIN
   - CROSS JOIN, SELF JOIN
   - LATERAL Joins
   - Performance Considerations

7. [Aggregations & Grouping](./07-Aggregations-Grouping.md)
   - Aggregate Functions
   - GROUP BY, HAVING
   - ROLLUP, CUBE, GROUPING SETS
   - FILTER Clause

8. [Subqueries](./08-Subqueries.md)
   - Scalar Subqueries
   - EXISTS, IN, ANY, ALL
   - Common Table Expressions (CTEs)
   - Recursive CTEs

9. [Window Functions](./09-Window-Functions.md)
   - ROW_NUMBER, RANK, DENSE_RANK
   - LAG, LEAD
   - FIRST_VALUE, LAST_VALUE
   - Partitioning & Framing

### **Part 3: Performance & Optimization**
10. [Indexes & Performance](./10-Indexes-Performance.md)
    - B-tree, Hash, GIN, GiST, BRIN
    - EXPLAIN ANALYZE
    - Query Optimization Techniques
    - Index-Only Scans

### **Part 4: Advanced Database Objects**
11. [Views & Materialized Views](./11-Views-Materialized.md)
    - Creating Views
    - Updatable Views
    - Materialized Views
    - Refresh Strategies

12. [Functions & Stored Procedures](./12-Functions-Procedures.md)
    - PL/pgSQL Basics
    - Control Structures
    - Exception Handling
    - Stored Procedures vs Functions

13. [Triggers](./13-Triggers.md)
    - BEFORE/AFTER Triggers
    - ROW vs STATEMENT Level
    - Trigger Functions
    - Audit Logging

### **Part 5: Transactions & Data Integrity**
14. [Transactions & ACID](./14-Transactions-ACID.md)
    - ACID Properties
    - Isolation Levels
    - Savepoints
    - Deadlock Prevention

### **Part 6: Modern PostgreSQL**
15. [JSON & JSONB](./15-JSON-JSONB.md)
    - JSON vs JSONB
    - Operators & Functions
    - Indexing JSON Data
    - Practical Examples

### **Part 7: Advanced Topics**
16. [Advanced Topics](./16-Advanced-Topics.md)
    - Table Partitioning
    - Full-Text Search
    - Security & Permissions
    - Backup & Recovery

### **Part 8: Interview Preparation**
17. [Interview Questions](./17-Interview-Questions.md)
    - Beginner to Advanced Q&A
    - Real-world Scenarios
    - Query Optimization Problems

---

## 🎯 Learning Path

### Beginner (Week 1-2)
- Chapters 1-5: Foundations & Basic Operations

### Intermediate (Week 3-4)
- Chapters 6-9: Joins, Aggregations, Window Functions

### Advanced (Week 5-6)
- Chapters 10-16: Performance, PL/pgSQL, Advanced Features

### Interview Ready (Week 7)
- Chapter 17: Practice & Review

---

## 🛠️ Practice Database

Throughout this guide, we'll use a sample e-commerce database:

```sql
-- Create the practice database
CREATE DATABASE ecommerce_db;

-- Tables we'll build:
-- customers, products, orders, order_items, reviews, inventory
```

---

## 📖 Quick Reference: psql Commands

| Command | Description |
|---------|-------------|
| `\l` | List all databases |
| `\c dbname` | Connect to database |
| `\dt` | List tables |
| `\d tablename` | Describe table structure |
| `\di` | List indexes |
| `\dv` | List views |
| `\df` | List functions |
| `\du` | List users/roles |
| `\timing` | Toggle query timing |
| `\x` | Toggle expanded display |
| `\q` | Quit psql |

---

Happy Learning! 🚀


