# Chapter 10: Indexes & Performance 🚀

Indexes are crucial for query performance. This chapter covers index types, query optimization, and EXPLAIN ANALYZE interpretation.

---

## How Indexes Work

```
Without Index (Sequential Scan):
┌──────────────────────────────┐
│ Scan ALL rows in table       │
│ Check each row against WHERE │
│ Time: O(n) - linear          │
└──────────────────────────────┘

With B-tree Index:
┌──────────────────────────────┐
│ Navigate tree to find value  │
│ Jump directly to matching    │
│ Time: O(log n) - logarithmic │
└──────────────────────────────┘

Example: Table with 1,000,000 rows
- Sequential scan: ~1,000,000 comparisons
- B-tree index: ~20 comparisons
```

---

## Index Types

### B-tree Index (Default)

Best for: equality and range queries, sorting.

```sql
-- Create B-tree index (default)
CREATE INDEX idx_users_email ON users(email);

-- Equivalent to:
CREATE INDEX idx_users_email ON users USING btree(email);

-- Works well with:
WHERE email = 'user@example.com'           -- equality
WHERE email LIKE 'user%'                   -- prefix pattern
WHERE salary BETWEEN 50000 AND 100000      -- range
WHERE salary > 50000                       -- comparison
ORDER BY email                             -- sorting

-- Does NOT work with:
WHERE email LIKE '%@gmail.com'             -- suffix pattern
WHERE UPPER(email) = 'USER@EXAMPLE.COM'    -- function on column
```

### Hash Index

Best for: equality comparisons only.

```sql
-- Create hash index
CREATE INDEX idx_users_id_hash ON users USING hash(id);

-- Works with:
WHERE id = 123                             -- equality only

-- Does NOT work with:
WHERE id > 100                             -- range (use B-tree)
WHERE id BETWEEN 1 AND 100                 -- range
ORDER BY id                                -- sorting
```

### GIN Index (Generalized Inverted Index)

Best for: arrays, full-text search, JSONB.

```sql
-- For array containment
CREATE INDEX idx_posts_tags ON posts USING gin(tags);

-- Works with:
WHERE tags @> ARRAY['postgresql']          -- contains
WHERE tags && ARRAY['sql', 'database']     -- overlaps

-- For full-text search
CREATE INDEX idx_posts_search ON posts USING gin(to_tsvector('english', content));

-- For JSONB
CREATE INDEX idx_data_jsonb ON documents USING gin(data);

-- Works with:
WHERE data @> '{"status": "active"}'       -- contains
WHERE data ? 'email'                       -- has key
WHERE data ?| ARRAY['email', 'phone']      -- has any key
```

### GiST Index (Generalized Search Tree)

Best for: geometric data, ranges, full-text search.

```sql
-- For range types (requires btree_gist extension)
CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE INDEX idx_reservations_period ON reservations USING gist(reserved_during);

-- Works with exclusion constraints
CREATE TABLE room_bookings (
    room_id INT,
    booking_period TSTZRANGE,
    EXCLUDE USING gist (room_id WITH =, booking_period WITH &&)
);

-- For geometric data
CREATE INDEX idx_locations_point ON locations USING gist(coordinates);

-- Works with:
WHERE coordinates <-> point(0,0) < 10      -- distance
WHERE box @> point(5,5)                    -- contains
```

### BRIN Index (Block Range Index)

Best for: large tables with naturally ordered data (like timestamps).

```sql
-- Create BRIN index
CREATE INDEX idx_logs_timestamp ON logs USING brin(created_at);

-- Best when:
-- 1. Table is very large
-- 2. Column values are correlated with physical order
-- 3. You can tolerate less precise results

-- Example: Time-series data
CREATE TABLE sensor_readings (
    id BIGSERIAL PRIMARY KEY,
    sensor_id INT,
    reading NUMERIC,
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- BRIN is tiny compared to B-tree
CREATE INDEX idx_sensor_brin ON sensor_readings USING brin(recorded_at);

-- Works well with:
WHERE recorded_at BETWEEN '2024-01-01' AND '2024-02-01'
```

---

## Index Options

### Composite (Multi-Column) Index

```sql
-- Index on multiple columns
CREATE INDEX idx_orders_customer_date ON orders(customer_id, order_date);

-- Column order matters!
-- Works for:
WHERE customer_id = 123                              -- uses index
WHERE customer_id = 123 AND order_date = '2024-01-15' -- uses index
WHERE customer_id = 123 AND order_date > '2024-01-01' -- uses index

-- Does NOT use index efficiently:
WHERE order_date = '2024-01-15'                      -- can't use (wrong order)

-- Rule: Leftmost prefix must be present
-- (customer_id) ✓
-- (customer_id, order_date) ✓
-- (order_date) ✗
```

### Partial Index

```sql
-- Index only a subset of rows
CREATE INDEX idx_orders_pending ON orders(created_at)
WHERE status = 'pending';

-- Much smaller than full index
-- Perfect for:
SELECT * FROM orders WHERE status = 'pending' AND created_at > '2024-01-01';

-- Active users only
CREATE INDEX idx_users_active_email ON users(email)
WHERE is_active = true;

-- Non-null values only
CREATE INDEX idx_orders_shipped ON orders(shipped_at)
WHERE shipped_at IS NOT NULL;
```

### Expression Index

```sql
-- Index on expression/function result
CREATE INDEX idx_users_lower_email ON users(LOWER(email));

-- Now this uses the index:
SELECT * FROM users WHERE LOWER(email) = 'user@example.com';

-- Date extraction
CREATE INDEX idx_orders_year ON orders(EXTRACT(YEAR FROM order_date));

-- JSON field
CREATE INDEX idx_data_status ON documents((data->>'status'));
```

### Unique Index

```sql
-- Enforce uniqueness
CREATE UNIQUE INDEX idx_users_email ON users(email);

-- Partial unique (unique only for certain rows)
CREATE UNIQUE INDEX idx_users_active_email ON users(email)
WHERE is_active = true;
```

### Covering Index (INCLUDE)

```sql
-- Include additional columns (not indexed, but stored)
CREATE INDEX idx_orders_customer ON orders(customer_id) 
INCLUDE (order_date, total);

-- Enables index-only scans for:
SELECT order_date, total FROM orders WHERE customer_id = 123;
-- No need to access table heap!
```

### Concurrent Index Creation

```sql
-- Non-blocking index creation
CREATE INDEX CONCURRENTLY idx_users_email ON users(email);

-- Advantages:
-- - Doesn't lock table for writes
-- - Other operations can continue

-- Disadvantages:
-- - Takes longer
-- - Can fail (leaves invalid index)
-- - Can't be done in transaction

-- Check for invalid indexes
SELECT * FROM pg_indexes WHERE indexdef LIKE '%INVALID%';

-- Drop invalid index
DROP INDEX CONCURRENTLY idx_users_email;
```

---

## EXPLAIN ANALYZE

The most important tool for query optimization.

### Basic Usage

```sql
-- Show query plan
EXPLAIN SELECT * FROM users WHERE email = 'user@example.com';

-- Show plan with actual execution
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'user@example.com';

-- With all details
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT * FROM users WHERE email = 'user@example.com';

-- JSON format (for programmatic analysis)
EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
SELECT * FROM users WHERE email = 'user@example.com';
```

### Reading EXPLAIN Output

```sql
EXPLAIN ANALYZE 
SELECT * FROM orders WHERE customer_id = 123;

-- Output:
-- Index Scan using idx_orders_customer on orders  (cost=0.29..8.31 rows=1 width=48) (actual time=0.015..0.016 rows=1 loops=1)
--   Index Cond: (customer_id = 123)
-- Planning Time: 0.065 ms
-- Execution Time: 0.031 ms
```

### Understanding Costs

```
cost=0.29..8.31
      │     └── Total cost to return all rows
      └── Startup cost (before first row)

rows=1        Estimated rows returned
width=48      Estimated row size in bytes

actual time=0.015..0.016
             │         └── Time to return all rows (ms)
             └── Time to first row (ms)

rows=1        Actual rows returned
loops=1       Number of times this node was executed
```

### Scan Types

```sql
-- Sequential Scan (full table scan)
-- Seq Scan on users (cost=0.00..18334.00 rows=1000000 width=48)
-- • Reads entire table
-- • OK for small tables or when selecting most rows

-- Index Scan
-- Index Scan using idx_users_email (cost=0.29..8.31 rows=1 width=48)
-- • Uses index to find rows
-- • Then fetches row data from table

-- Index Only Scan (best!)
-- Index Only Scan using idx_users_email (cost=0.29..4.31 rows=1 width=48)
-- • All needed data is in index
-- • No table access needed

-- Bitmap Index Scan (combines multiple indexes)
-- Bitmap Heap Scan on users
--   -> Bitmap Index Scan on idx_users_email
--   -> Bitmap Index Scan on idx_users_status
-- • Builds bitmap of matching rows
-- • Useful for OR conditions or multiple index conditions
```

### Join Types

```sql
-- Nested Loop Join
-- • For each row in outer table, scan inner table
-- • Good for small result sets
-- • Benefits from index on inner table

-- Hash Join
-- • Build hash table from smaller table
-- • Probe with larger table
-- • Good for large result sets
-- • Needs memory for hash table

-- Merge Join
-- • Both inputs must be sorted
-- • Scans both in parallel
-- • Efficient for large sorted datasets
```

### Example Analysis

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT o.*, c.name
FROM orders o
JOIN customers c ON o.customer_id = c.id
WHERE o.status = 'pending'
  AND o.created_at > '2024-01-01';

-- Output:
-- Hash Join  (cost=4.25..28.50 rows=5 width=128) (actual time=0.089..0.095 rows=3 loops=1)
--   Hash Cond: (o.customer_id = c.id)
--   Buffers: shared hit=4
--   ->  Seq Scan on orders o  (cost=0.00..24.12 rows=5 width=96) (actual time=0.012..0.015 rows=3 loops=1)
--         Filter: ((status = 'pending') AND (created_at > '2024-01-01'))
--         Rows Removed by Filter: 97
--         Buffers: shared hit=2
--   ->  Hash  (cost=3.00..3.00 rows=100 width=36) (actual time=0.054..0.054 rows=100 loops=1)
--         Buckets: 1024  Batches: 1  Memory Usage: 12kB
--         Buffers: shared hit=2
--         ->  Seq Scan on customers c  (cost=0.00..3.00 rows=100 width=36) (actual time=0.003..0.020 rows=100 loops=1)
--               Buffers: shared hit=2
-- Planning Time: 0.285 ms
-- Execution Time: 0.127 ms
```

### Key Metrics to Watch

```sql
-- Red flags in EXPLAIN output:
-- 1. Sequential scans on large tables
-- 2. Large "Rows Removed by Filter"
-- 3. High "actual rows" vs "estimated rows" (statistics issue)
-- 4. Nested loops with many iterations
-- 5. Sort operations using disk (external sort)
-- 6. "Buffers: shared read" (disk I/O instead of cache)
```

---

## Query Optimization Techniques

### 1. Use Appropriate Indexes

```sql
-- Before: Sequential scan
EXPLAIN SELECT * FROM orders WHERE customer_id = 123;
-- Seq Scan on orders...

-- Add index
CREATE INDEX idx_orders_customer ON orders(customer_id);

-- After: Index scan
EXPLAIN SELECT * FROM orders WHERE customer_id = 123;
-- Index Scan using idx_orders_customer...
```

### 2. Fix Query Structure

```sql
-- Bad: Function on indexed column
SELECT * FROM users WHERE UPPER(email) = 'USER@EXAMPLE.COM';

-- Good: Expression index or fix query
CREATE INDEX idx_users_lower_email ON users(LOWER(email));
SELECT * FROM users WHERE LOWER(email) = 'user@example.com';

-- Bad: OR conditions
SELECT * FROM orders WHERE status = 'pending' OR customer_id = 123;

-- Better: UNION
SELECT * FROM orders WHERE status = 'pending'
UNION
SELECT * FROM orders WHERE customer_id = 123;
```

### 3. Limit Result Sets

```sql
-- Bad: Fetch all, process in app
SELECT * FROM orders;

-- Good: Paginate
SELECT * FROM orders ORDER BY id LIMIT 20 OFFSET 0;

-- Better: Keyset pagination
SELECT * FROM orders WHERE id > 1000 ORDER BY id LIMIT 20;
```

### 4. Use EXISTS Instead of IN

```sql
-- Slower for large subqueries
SELECT * FROM orders WHERE customer_id IN (
    SELECT id FROM customers WHERE country = 'USA'
);

-- Faster with EXISTS
SELECT * FROM orders o WHERE EXISTS (
    SELECT 1 FROM customers c 
    WHERE c.id = o.customer_id AND c.country = 'USA'
);
```

### 5. Optimize JOINs

```sql
-- Ensure indexes on join columns
CREATE INDEX idx_orders_customer ON orders(customer_id);

-- Put most restrictive conditions first
SELECT * 
FROM orders o
JOIN customers c ON o.customer_id = c.id
WHERE o.status = 'pending'  -- More restrictive
  AND c.country = 'USA';
```

### 6. Update Statistics

```sql
-- Analyze table (update statistics)
ANALYZE users;

-- Analyze all tables
ANALYZE;

-- With verbose output
ANALYZE VERBOSE users;

-- Auto-vacuum handles this, but manual analysis after bulk operations
```

---

## Index Maintenance

### View Existing Indexes

```sql
-- List indexes on a table
\d users

-- All indexes with details
SELECT 
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) AS size
FROM pg_indexes
JOIN pg_class ON pg_class.relname = indexname
WHERE tablename = 'users';

-- Index usage statistics
SELECT 
    schemaname,
    relname,
    indexrelname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
WHERE relname = 'users';
```

### Identify Unused Indexes

```sql
-- Indexes never used
SELECT 
    schemaname || '.' || relname AS table,
    indexrelname AS index,
    pg_size_pretty(pg_relation_size(i.indexrelid)) AS size,
    idx_scan AS scans
FROM pg_stat_user_indexes i
JOIN pg_index pi ON i.indexrelid = pi.indexrelid
WHERE idx_scan = 0
  AND NOT pi.indisunique  -- Keep unique constraints
ORDER BY pg_relation_size(i.indexrelid) DESC;
```

### Index Bloat

```sql
-- Check for index bloat
SELECT 
    nspname || '.' || relname AS table,
    pg_size_pretty(pg_relation_size(indexrelid)) AS index_size,
    idx_scan AS index_scans
FROM pg_stat_user_indexes i
JOIN pg_statio_user_indexes io ON i.indexrelid = io.indexrelid
WHERE idx_scan < 50
ORDER BY pg_relation_size(indexrelid) DESC;

-- Rebuild bloated index
REINDEX INDEX idx_users_email;

-- Rebuild all indexes on table
REINDEX TABLE users;

-- Concurrent reindex (PostgreSQL 12+)
REINDEX INDEX CONCURRENTLY idx_users_email;
```

### Drop Unused Indexes

```sql
-- Drop index
DROP INDEX idx_users_email;

-- Drop if exists
DROP INDEX IF EXISTS idx_users_email;

-- Drop concurrently
DROP INDEX CONCURRENTLY idx_users_email;
```

---

## PostgreSQL Configuration for Performance

```sql
-- Key settings (postgresql.conf)

-- Memory
shared_buffers = '256MB'        -- 25% of RAM for dedicated server
effective_cache_size = '1GB'    -- 50-75% of RAM
work_mem = '64MB'               -- Per-operation memory
maintenance_work_mem = '256MB'  -- For VACUUM, CREATE INDEX

-- Planner
random_page_cost = 1.1          -- For SSD (default 4.0 for HDD)
effective_io_concurrency = 200  -- For SSD (default 1)
default_statistics_target = 100 -- Statistics detail (default 100)

-- Parallel queries (PostgreSQL 9.6+)
max_parallel_workers_per_gather = 2
parallel_tuple_cost = 0.1
parallel_setup_cost = 1000

-- Check current settings
SHOW shared_buffers;
SHOW work_mem;

-- Set for session
SET work_mem = '256MB';
```

---

## Benchmarking Queries

```sql
-- Enable timing
\timing on

-- Run query multiple times to warm cache
SELECT * FROM users WHERE id = 1;
SELECT * FROM users WHERE id = 1;
SELECT * FROM users WHERE id = 1;

-- Use EXPLAIN (ANALYZE, BUFFERS)
EXPLAIN (ANALYZE, BUFFERS, COSTS)
SELECT * FROM users WHERE id = 1;

-- pgbench for load testing
-- psql: \! pgbench -i -s 10 mydb  -- Initialize
-- psql: \! pgbench -c 10 -j 2 -t 1000 mydb  -- Run benchmark
```

---

## Common Performance Issues

### 1. Missing Index

```sql
-- Symptom: Seq Scan on large table with WHERE clause
-- Solution: Add index on filtered column
CREATE INDEX idx_table_column ON table(column);
```

### 2. Wrong Index Order

```sql
-- Symptom: Index not used for query
-- Solution: Create index with correct column order
-- Put equality columns first, then range columns
CREATE INDEX idx_orders_status_date ON orders(status, created_at);
```

### 3. Statistics Out of Date

```sql
-- Symptom: Bad estimates in EXPLAIN (rows=1000, actual rows=100000)
-- Solution: Update statistics
ANALYZE table_name;
```

### 4. Too Many Indexes

```sql
-- Symptom: Slow INSERTs/UPDATEs
-- Solution: Remove unused indexes
DROP INDEX unused_index;
```

### 5. Lock Contention

```sql
-- Symptom: Queries waiting on locks
-- Solution: Check locks
SELECT * FROM pg_locks WHERE NOT granted;

-- Find blocking queries
SELECT blocked.pid, blocked.query AS blocked_query,
       blocking.pid AS blocking_pid, blocking.query AS blocking_query
FROM pg_stat_activity blocked
JOIN pg_locks blocked_locks ON blocked.pid = blocked_locks.pid
JOIN pg_locks blocking_locks ON blocked_locks.locktype = blocking_locks.locktype
    AND blocked_locks.relation = blocking_locks.relation
JOIN pg_stat_activity blocking ON blocking_locks.pid = blocking.pid
WHERE NOT blocked_locks.granted;
```

---

## Practice Exercises

### Exercise 1: Index Analysis
1. Identify slow queries in your database
2. Use EXPLAIN ANALYZE to understand the query plan
3. Add appropriate indexes

### Exercise 2: Index Types
1. Create a GIN index for JSONB data
2. Create a partial index for active records
3. Create an expression index for case-insensitive search

### Exercise 3: Optimization
1. Optimize a query with multiple JOINs
2. Replace IN with EXISTS and compare
3. Implement keyset pagination

### Exercise 4: Monitoring
1. Find unused indexes
2. Identify index bloat
3. Set up query logging

---

## Summary

In this chapter, you learned:
- ✅ Index types: B-tree, Hash, GIN, GiST, BRIN
- ✅ Index options: composite, partial, expression, unique, covering
- ✅ EXPLAIN ANALYZE interpretation
- ✅ Query optimization techniques
- ✅ Index maintenance and monitoring
- ✅ PostgreSQL performance configuration

---

**Next Chapter:** [Views & Materialized Views →](./11-Views-Materialized.md)




