# Chapter 17: Interview Questions 🎯

Comprehensive PostgreSQL interview questions from beginner to advanced levels.

---

## Beginner Level

### Q1: What is PostgreSQL?
**Answer:** PostgreSQL is an open-source, object-relational database management system (ORDBMS) known for:
- ACID compliance
- Extensibility (custom types, functions, operators)
- Standards compliance (closest to SQL standard)
- Advanced features (JSON, full-text search, geospatial)
- Strong community and ecosystem

### Q2: What is the difference between `CHAR`, `VARCHAR`, and `TEXT`?

| Type | Description | Use Case |
|------|-------------|----------|
| `CHAR(n)` | Fixed-length, padded with spaces | Fixed codes (country codes) |
| `VARCHAR(n)` | Variable-length with limit | User inputs with max length |
| `TEXT` | Variable-length, unlimited | Long content |

```sql
-- In PostgreSQL, VARCHAR and TEXT have same performance
-- Use VARCHAR(n) only for business validation
```

### Q3: What are PRIMARY KEY and FOREIGN KEY?

```sql
-- PRIMARY KEY: Unique identifier for each row
CREATE TABLE users (
    id SERIAL PRIMARY KEY,  -- Unique, NOT NULL, one per table
    email VARCHAR(255)
);

-- FOREIGN KEY: References PRIMARY KEY in another table
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id)  -- Ensures referential integrity
);
```

### Q4: Explain INNER JOIN vs LEFT JOIN

```sql
-- INNER JOIN: Only matching rows from both tables
SELECT u.name, o.total
FROM users u
INNER JOIN orders o ON u.id = o.user_id;
-- Users without orders are excluded

-- LEFT JOIN: All rows from left table, matching from right
SELECT u.name, o.total
FROM users u
LEFT JOIN orders o ON u.id = o.user_id;
-- All users shown, NULL for those without orders
```

### Q5: What is the difference between WHERE and HAVING?

```sql
-- WHERE: Filters rows BEFORE grouping
SELECT department, COUNT(*)
FROM employees
WHERE salary > 50000      -- Filter individual rows
GROUP BY department;

-- HAVING: Filters groups AFTER aggregation
SELECT department, COUNT(*)
FROM employees
GROUP BY department
HAVING COUNT(*) > 5;      -- Filter groups
```

---

## Intermediate Level

### Q6: Explain ACID properties

| Property | Description | Example |
|----------|-------------|---------|
| **Atomicity** | All or nothing | Transfer money: both debit and credit succeed or fail |
| **Consistency** | Valid state to valid state | Constraints enforced after transaction |
| **Isolation** | Transactions don't interfere | Concurrent reads see consistent data |
| **Durability** | Committed data survives crashes | Data written to disk after COMMIT |

### Q7: What are indexes? When to use them?

```sql
-- B-tree (default): Equality and range queries
CREATE INDEX idx_email ON users(email);

-- Use indexes when:
-- 1. Frequent WHERE/JOIN conditions
-- 2. ORDER BY columns
-- 3. Columns with high cardinality

-- Avoid indexes when:
-- 1. Small tables
-- 2. Frequently updated columns
-- 3. Low cardinality columns

-- Check if index is used
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'test@example.com';
```

### Q8: What are the different types of indexes in PostgreSQL?

| Type | Use Case |
|------|----------|
| **B-tree** | Equality, range, sorting (default) |
| **Hash** | Equality only |
| **GIN** | Arrays, JSONB, full-text search |
| **GiST** | Geometric data, ranges |
| **BRIN** | Large tables with naturally ordered data |

### Q9: Explain the difference between DELETE, TRUNCATE, and DROP

```sql
-- DELETE: Removes rows, can use WHERE, logged, triggers fire
DELETE FROM users WHERE status = 'inactive';

-- TRUNCATE: Removes all rows, faster, minimal logging
TRUNCATE TABLE logs;  -- Can't use WHERE

-- DROP: Removes entire table structure
DROP TABLE old_data;
```

| Operation | WHERE | Speed | Rollback | Triggers | Space |
|-----------|-------|-------|----------|----------|-------|
| DELETE | Yes | Slow | Yes | Fire | Not reclaimed |
| TRUNCATE | No | Fast | Yes | Don't fire | Reclaimed |
| DROP | N/A | Fast | Yes | Don't fire | Reclaimed |

### Q10: What is a View? What is a Materialized View?

```sql
-- View: Virtual table, query executed each time
CREATE VIEW active_users AS
SELECT * FROM users WHERE is_active = true;
-- Always current, no storage

-- Materialized View: Cached result, stored on disk
CREATE MATERIALIZED VIEW sales_summary AS
SELECT category, SUM(amount) FROM sales GROUP BY category;
-- Fast reads, needs manual refresh
REFRESH MATERIALIZED VIEW sales_summary;
```

---

## Advanced Level

### Q11: Explain Window Functions with examples

```sql
-- Window functions compute across related rows without grouping

-- ROW_NUMBER: Unique sequence
SELECT name, salary, ROW_NUMBER() OVER (ORDER BY salary DESC) AS rank
FROM employees;

-- RANK: Same rank for ties, gaps after
SELECT name, salary, RANK() OVER (ORDER BY salary DESC)
FROM employees;

-- LAG/LEAD: Access previous/next rows
SELECT month, revenue,
       LAG(revenue) OVER (ORDER BY month) AS prev_month,
       revenue - LAG(revenue) OVER (ORDER BY month) AS growth
FROM monthly_sales;

-- Running total
SELECT order_date, amount,
       SUM(amount) OVER (ORDER BY order_date) AS running_total
FROM orders;
```

### Q12: What are CTEs and Recursive CTEs?

```sql
-- CTE: Named temporary result set
WITH high_earners AS (
    SELECT * FROM employees WHERE salary > 100000
)
SELECT department, COUNT(*) FROM high_earners GROUP BY department;

-- Recursive CTE: Self-referential queries
WITH RECURSIVE employee_tree AS (
    -- Base: CEO (no manager)
    SELECT id, name, manager_id, 1 AS level
    FROM employees WHERE manager_id IS NULL
    
    UNION ALL
    
    -- Recursive: Employees with managers
    SELECT e.id, e.name, e.manager_id, et.level + 1
    FROM employees e
    JOIN employee_tree et ON e.manager_id = et.id
)
SELECT * FROM employee_tree;
```

### Q13: Explain Transaction Isolation Levels

| Level | Dirty Read | Non-Repeatable Read | Phantom Read |
|-------|------------|---------------------|--------------|
| Read Uncommitted* | No | Yes | Yes |
| Read Committed | No | Yes | Yes |
| Repeatable Read | No | No | No** |
| Serializable | No | No | No |

*PostgreSQL's Read Uncommitted = Read Committed
**PostgreSQL's Repeatable Read also prevents phantoms

```sql
-- Set isolation level
BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;
-- ... queries ...
COMMIT;
```

### Q14: How would you optimize a slow query?

```sql
-- 1. Analyze the query plan
EXPLAIN ANALYZE SELECT * FROM orders WHERE customer_id = 123;

-- 2. Check for missing indexes
CREATE INDEX idx_orders_customer ON orders(customer_id);

-- 3. Update statistics
ANALYZE orders;

-- 4. Rewrite query if needed
-- Bad: Function on indexed column
SELECT * FROM users WHERE LOWER(email) = 'test@example.com';
-- Good: Expression index
CREATE INDEX idx_users_email_lower ON users(LOWER(email));

-- 5. Check for N+1 queries (use JOINs instead)
-- 6. Consider materialized views for complex aggregations
-- 7. Partition large tables
```

### Q15: Explain EXPLAIN ANALYZE output

```sql
EXPLAIN ANALYZE SELECT * FROM orders WHERE customer_id = 123;

-- Index Scan using idx_orders_customer on orders
--   (cost=0.29..8.31 rows=1 width=48) 
--   (actual time=0.015..0.016 rows=1 loops=1)
--   Index Cond: (customer_id = 123)
-- Planning Time: 0.065 ms
-- Execution Time: 0.031 ms

-- Key metrics:
-- cost: Estimated (startup..total)
-- rows: Estimated vs actual
-- time: Actual execution time (ms)
-- loops: How many times executed
```

### Q16: What is table partitioning? When would you use it?

```sql
-- Partitioning splits large tables into smaller pieces

CREATE TABLE orders (
    id BIGSERIAL,
    order_date DATE,
    total NUMERIC
) PARTITION BY RANGE (order_date);

CREATE TABLE orders_2024 PARTITION OF orders
    FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');

-- Benefits:
-- 1. Faster queries (partition pruning)
-- 2. Easier maintenance (VACUUM per partition)
-- 3. Drop old data by detaching partition
-- 4. Parallel processing

-- Use when:
-- Table > 100GB
-- Time-series data
-- Need to archive old data
```

### Q17: How does PostgreSQL handle JSON?

```sql
-- JSONB (binary, recommended) vs JSON (text)
CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    data JSONB
);

-- Access operators
SELECT data->>'name' FROM events;           -- As text
SELECT data->'address'->'city' FROM events; -- Nested

-- Containment
SELECT * FROM events WHERE data @> '{"status": "active"}';

-- Index for fast containment queries
CREATE INDEX idx_events_data ON events USING GIN(data);

-- Index specific path
CREATE INDEX idx_events_status ON events((data->>'status'));
```

---

## Scenario-Based Questions

### Q18: Design a query for "Find the second highest salary per department"

```sql
-- Using ROW_NUMBER
WITH ranked AS (
    SELECT 
        department_id,
        name,
        salary,
        ROW_NUMBER() OVER (PARTITION BY department_id ORDER BY salary DESC) AS rn
    FROM employees
)
SELECT department_id, name, salary
FROM ranked
WHERE rn = 2;

-- Alternative: Using DENSE_RANK for ties
WITH ranked AS (
    SELECT 
        department_id,
        name,
        salary,
        DENSE_RANK() OVER (PARTITION BY department_id ORDER BY salary DESC) AS dr
    FROM employees
)
SELECT department_id, name, salary
FROM ranked
WHERE dr = 2;
```

### Q19: How would you find duplicate records?

```sql
-- Find duplicates by email
SELECT email, COUNT(*)
FROM users
GROUP BY email
HAVING COUNT(*) > 1;

-- Get all duplicate rows with details
WITH duplicates AS (
    SELECT email, COUNT(*) OVER (PARTITION BY email) AS cnt
    FROM users
)
SELECT * FROM duplicates WHERE cnt > 1;

-- Delete duplicates keeping one
DELETE FROM users
WHERE id NOT IN (
    SELECT MIN(id)
    FROM users
    GROUP BY email
);

-- Better approach with CTE
WITH ranked AS (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY email ORDER BY created_at) AS rn
    FROM users
)
DELETE FROM users WHERE id IN (SELECT id FROM ranked WHERE rn > 1);
```

### Q20: Implement a simple job queue

```sql
-- Table structure
CREATE TABLE jobs (
    id SERIAL PRIMARY KEY,
    payload JSONB,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

CREATE INDEX idx_jobs_pending ON jobs(created_at) WHERE status = 'pending';

-- Fetch and lock next job
WITH next_job AS (
    SELECT id FROM jobs
    WHERE status = 'pending'
    ORDER BY created_at
    FOR UPDATE SKIP LOCKED
    LIMIT 1
)
UPDATE jobs
SET status = 'processing', started_at = NOW()
WHERE id = (SELECT id FROM next_job)
RETURNING *;

-- SKIP LOCKED avoids blocking - perfect for concurrent workers
```

### Q21: Calculate running totals and moving averages

```sql
-- Running total
SELECT 
    order_date,
    amount,
    SUM(amount) OVER (ORDER BY order_date) AS running_total
FROM orders;

-- 7-day moving average
SELECT 
    sale_date,
    amount,
    AVG(amount) OVER (
        ORDER BY sale_date
        ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
    ) AS moving_avg_7day
FROM sales;

-- Year-to-date by month
SELECT 
    DATE_TRUNC('month', order_date) AS month,
    SUM(amount) AS monthly_total,
    SUM(SUM(amount)) OVER (
        PARTITION BY DATE_TRUNC('year', order_date)
        ORDER BY DATE_TRUNC('month', order_date)
    ) AS ytd_total
FROM orders
GROUP BY DATE_TRUNC('month', order_date);
```

### Q22: Design a notification/audit system

```sql
-- Audit table
CREATE TABLE audit_log (
    id BIGSERIAL PRIMARY KEY,
    table_name TEXT,
    record_id INTEGER,
    action TEXT,
    old_data JSONB,
    new_data JSONB,
    changed_by TEXT DEFAULT current_user,
    changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Generic audit trigger
CREATE OR REPLACE FUNCTION audit_trigger()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_log (table_name, record_id, action, old_data, new_data)
    VALUES (
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        TG_OP,
        CASE WHEN TG_OP != 'INSERT' THEN to_jsonb(OLD) END,
        CASE WHEN TG_OP != 'DELETE' THEN to_jsonb(NEW) END
    );
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Apply to any table
CREATE TRIGGER tr_audit_users
    AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW EXECUTE FUNCTION audit_trigger();
```

---

## Quick Reference

### Essential psql Commands
```
\l        List databases
\c db     Connect to database
\dt       List tables
\d table  Describe table
\di       List indexes
\df       List functions
\x        Toggle expanded display
\timing   Toggle timing
```

### Performance Checklist
- [ ] EXPLAIN ANALYZE suspicious queries
- [ ] Check for missing indexes on WHERE/JOIN columns
- [ ] Run ANALYZE after bulk operations
- [ ] Monitor pg_stat_statements for slow queries
- [ ] Use connection pooling (PgBouncer)
- [ ] Consider partitioning for large tables
- [ ] Review and remove unused indexes

### Common Gotchas
1. **NULL comparisons**: Use `IS NULL`, not `= NULL`
2. **String case**: PostgreSQL is case-sensitive by default
3. **Implicit casts**: Be explicit about data types
4. **N+1 queries**: Use JOINs instead of loops
5. **Large IN lists**: Use `= ANY(ARRAY[...])` instead
6. **Missing indexes on FKs**: Foreign keys don't auto-create indexes

---

## Sample Interview Questions & Answers

**Q: "We have a slow query that joins 5 tables. How would you optimize it?"**

A: 
1. Run EXPLAIN ANALYZE to identify bottlenecks
2. Check indexes on JOIN columns
3. Verify statistics are up-to-date (ANALYZE)
4. Consider query restructuring (CTEs, subqueries)
5. Look for sequential scans on large tables
6. Consider materialized view if query runs frequently
7. Check for implicit type conversions

**Q: "How would you handle a database migration with zero downtime?"**

A:
1. Use blue-green deployment
2. Make schema changes backward-compatible
3. Add new columns as nullable first
4. Use triggers for dual-write during transition
5. CREATE INDEX CONCURRENTLY for new indexes
6. Test thoroughly in staging environment

**Q: "Explain how you would design a multi-tenant database."**

A: Three approaches:
1. **Separate databases**: Best isolation, highest overhead
2. **Shared database, separate schemas**: Good isolation, moderate overhead
3. **Shared tables with tenant_id**: Lowest overhead, requires careful RLS

```sql
-- Row-level security approach
ALTER TABLE data ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON data
    USING (tenant_id = current_setting('app.tenant_id')::INTEGER);
```

---

## Resources for Further Learning

1. **Official Documentation**: postgresql.org/docs
2. **PostgreSQL Wiki**: wiki.postgresql.org
3. **Use The Index, Luke**: use-the-index-luke.com
4. **pgExercises**: pgexercises.com
5. **Postgres Weekly**: postgresweekly.com

---

Good luck with your interviews! 🍀




