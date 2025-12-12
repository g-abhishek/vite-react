# Chapter 14: Transactions & ACID 🔐

Transactions ensure data integrity by grouping operations into atomic units. Understanding ACID properties and isolation levels is crucial for building reliable applications.

---

## ACID Properties

### Atomicity
All operations succeed or all fail. No partial updates.

```sql
-- Either both happen or neither happens
BEGIN;
    UPDATE accounts SET balance = balance - 100 WHERE id = 1;
    UPDATE accounts SET balance = balance + 100 WHERE id = 2;
COMMIT;
-- If any statement fails, ROLLBACK undoes everything
```

### Consistency
Database moves from one valid state to another. Constraints are enforced.

```sql
-- Constraints prevent invalid states
BEGIN;
    UPDATE accounts SET balance = balance - 1000 WHERE id = 1;
    -- If this violates CHECK (balance >= 0), entire transaction fails
COMMIT;
```

### Isolation
Concurrent transactions don't interfere with each other.

```sql
-- Transaction A
BEGIN;
SELECT balance FROM accounts WHERE id = 1;  -- Sees 1000
-- ... some time passes ...
-- Transaction B updates balance to 500 and commits
SELECT balance FROM accounts WHERE id = 1;  -- What does A see?
-- Depends on isolation level!
COMMIT;
```

### Durability
Committed changes survive crashes.

```sql
-- After COMMIT, data is on disk
COMMIT;
-- Even if server crashes now, data is safe
```

---

## Basic Transaction Commands

```sql
-- Start transaction
BEGIN;
-- or
BEGIN TRANSACTION;
-- or
START TRANSACTION;

-- Commit (save changes)
COMMIT;
-- or
END;

-- Rollback (discard changes)
ROLLBACK;
-- or
ABORT;

-- Example
BEGIN;
    INSERT INTO users (name, email) VALUES ('John', 'john@example.com');
    INSERT INTO profiles (user_id, bio) VALUES (currval('users_id_seq'), 'Hello!');
    -- If second insert fails, first is also rolled back
COMMIT;
```

### Autocommit Mode

```sql
-- By default, PostgreSQL runs in autocommit mode
-- Each statement is its own transaction
INSERT INTO users (name) VALUES ('Alice');  -- Automatically committed

-- In psql, you can disable autocommit
\set AUTOCOMMIT off
INSERT INTO users (name) VALUES ('Bob');    -- Not committed yet
COMMIT;                                       -- Now committed

-- Check autocommit status
\echo :AUTOCOMMIT
```

---

## Savepoints

Partial rollback within a transaction.

```sql
BEGIN;
    INSERT INTO orders (customer_id, total) VALUES (1, 100);
    SAVEPOINT sp1;
    
    INSERT INTO order_items (order_id, product_id, quantity) VALUES (1, 1, 5);
    -- Oops, something went wrong
    ROLLBACK TO sp1;  -- Undo only the order_items insert
    
    -- Try again
    INSERT INTO order_items (order_id, product_id, quantity) VALUES (1, 2, 3);
    
    SAVEPOINT sp2;
    UPDATE inventory SET stock = stock - 100 WHERE product_id = 2;
    -- This might fail due to insufficient stock
    -- If it does, we can ROLLBACK TO sp2
    
COMMIT;

-- Release savepoint (optional, for cleanup)
RELEASE SAVEPOINT sp1;
```

### Nested Savepoints

```sql
BEGIN;
    SAVEPOINT a;
        INSERT INTO t1 VALUES (1);
        SAVEPOINT b;
            INSERT INTO t1 VALUES (2);
            SAVEPOINT c;
                INSERT INTO t1 VALUES (3);
            ROLLBACK TO c;  -- Undoes value 3
        ROLLBACK TO b;      -- Undoes value 2
    -- Value 1 still pending
COMMIT;
-- Only value 1 is inserted
```

---

## Isolation Levels

### Overview

| Level | Dirty Read | Non-Repeatable Read | Phantom Read | Serialization Anomaly |
|-------|------------|---------------------|--------------|----------------------|
| Read Uncommitted | Possible* | Possible | Possible | Possible |
| Read Committed | No | Possible | Possible | Possible |
| Repeatable Read | No | No | Possible* | Possible |
| Serializable | No | No | No | No |

*PostgreSQL's Read Uncommitted = Read Committed; Repeatable Read prevents phantoms too.

### Read Committed (Default)

Sees only committed data at the time of each statement.

```sql
-- Session 1
BEGIN;
SELECT balance FROM accounts WHERE id = 1;  -- 1000

    -- Session 2 updates and commits
    -- UPDATE accounts SET balance = 500 WHERE id = 1;
    -- COMMIT;

SELECT balance FROM accounts WHERE id = 1;  -- 500 (sees committed change)
COMMIT;
```

```sql
-- Set isolation level
BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED;
-- or
SET TRANSACTION ISOLATION LEVEL READ COMMITTED;
```

### Repeatable Read

Sees a snapshot of the database from the start of the transaction.

```sql
-- Session 1
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ;
SELECT balance FROM accounts WHERE id = 1;  -- 1000

    -- Session 2 updates and commits
    -- UPDATE accounts SET balance = 500 WHERE id = 1;
    -- COMMIT;

SELECT balance FROM accounts WHERE id = 1;  -- Still 1000! (snapshot)

-- But if Session 1 tries to update...
UPDATE accounts SET balance = balance + 100 WHERE id = 1;
-- ERROR: could not serialize access due to concurrent update
ROLLBACK;
```

### Serializable

Strictest level. Transactions appear to execute one at a time.

```sql
-- Session 1
BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;
SELECT SUM(balance) FROM accounts;  -- 10000
INSERT INTO accounts (balance) VALUES (1000);

    -- Session 2 (also serializable)
    -- BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;
    -- SELECT SUM(balance) FROM accounts;  -- 10000 (snapshot)
    -- INSERT INTO accounts (balance) VALUES (2000);
    -- COMMIT;

COMMIT;
-- One of these will fail with serialization error
-- The other succeeds
```

### Choosing Isolation Level

```sql
-- Read Committed (default): Best for most applications
-- - Tolerates concurrent modifications
-- - No serialization errors

-- Repeatable Read: When you need consistent reads
-- - Reports that shouldn't see concurrent changes
-- - May need to retry on serialization failure

-- Serializable: When absolute consistency is required
-- - Financial calculations
-- - Inventory management
-- - Be prepared to retry failed transactions

-- Set default for session
SET default_transaction_isolation = 'repeatable read';

-- Set for current transaction
BEGIN;
SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
```

---

## Locking

### Row-Level Locks

```sql
-- Explicit row lock (SELECT ... FOR UPDATE)
BEGIN;
SELECT * FROM accounts WHERE id = 1 FOR UPDATE;
-- Row is locked until transaction ends
-- Other transactions wait when trying to update this row
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
COMMIT;

-- Lock modes
SELECT ... FOR UPDATE;           -- Exclusive lock, blocks all other locks
SELECT ... FOR NO KEY UPDATE;    -- Blocks UPDATE/DELETE but not foreign keys
SELECT ... FOR SHARE;            -- Shared lock, blocks UPDATE/DELETE
SELECT ... FOR KEY SHARE;        -- Weakest, only blocks DELETE

-- NOWAIT - Fail immediately if locked
SELECT * FROM accounts WHERE id = 1 FOR UPDATE NOWAIT;
-- ERROR: could not obtain lock on row in relation "accounts"

-- SKIP LOCKED - Skip locked rows
SELECT * FROM jobs WHERE status = 'pending'
FOR UPDATE SKIP LOCKED
LIMIT 1;
-- Returns first unlocked row (useful for job queues)
```

### Table-Level Locks

```sql
-- Explicit table lock
LOCK TABLE accounts IN ACCESS EXCLUSIVE MODE;

-- Lock modes (from weakest to strongest):
-- ACCESS SHARE          - SELECT
-- ROW SHARE            - SELECT FOR UPDATE/SHARE
-- ROW EXCLUSIVE        - UPDATE, DELETE, INSERT
-- SHARE UPDATE EXCLUSIVE - VACUUM, ANALYZE, CREATE INDEX CONCURRENTLY
-- SHARE                - CREATE INDEX (non-concurrent)
-- SHARE ROW EXCLUSIVE  - (rarely used)
-- EXCLUSIVE            - (rarely used)
-- ACCESS EXCLUSIVE     - ALTER TABLE, DROP TABLE

-- Most locks are acquired automatically
```

### Advisory Locks

Application-managed locks (not tied to database objects).

```sql
-- Session-level advisory lock
SELECT pg_advisory_lock(123);  -- Lock key 123
-- Do exclusive work
SELECT pg_advisory_unlock(123);  -- Release lock

-- Transaction-level (auto-released on commit/rollback)
SELECT pg_advisory_xact_lock(123);

-- Try to acquire (non-blocking)
SELECT pg_try_advisory_lock(123);  -- Returns true if acquired

-- Two-key locks (more granular)
SELECT pg_advisory_lock(100, 1);  -- Lock (100, 1)

-- Use case: Ensure only one process runs a job
SELECT pg_try_advisory_lock(hashtext('daily_report'));
IF acquired THEN
    -- Run report
    SELECT pg_advisory_unlock(hashtext('daily_report'));
END IF;
```

### Deadlock Prevention

```sql
-- Deadlock occurs when:
-- Transaction A holds lock on row 1, waits for row 2
-- Transaction B holds lock on row 2, waits for row 1

-- Prevention: Always lock in consistent order
BEGIN;
-- Always lock accounts in order of ID
SELECT * FROM accounts WHERE id IN (1, 2) ORDER BY id FOR UPDATE;
-- Now update in any order
COMMIT;

-- Detection: PostgreSQL automatically detects and aborts one transaction
-- Log shows: ERROR: deadlock detected
-- Check deadlock_timeout setting (default 1s)
SHOW deadlock_timeout;
```

---

## Transaction Patterns

### Retry Pattern

```sql
-- Pseudo-code for retry logic in application
max_retries = 3
retry_count = 0

WHILE retry_count < max_retries:
    TRY:
        BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE
        -- Do work
        COMMIT
        BREAK  -- Success
    CATCH serialization_failure, deadlock_detected:
        retry_count += 1
        SLEEP(random_backoff)
    CATCH other_error:
        RAISE  -- Don't retry other errors
```

### Job Queue Pattern

```sql
-- Get next job with lock
BEGIN;
SELECT id, data 
FROM jobs 
WHERE status = 'pending'
ORDER BY created_at
FOR UPDATE SKIP LOCKED
LIMIT 1;

-- Process job
UPDATE jobs SET status = 'processing', started_at = NOW() WHERE id = ?;
COMMIT;

-- After processing
UPDATE jobs SET status = 'completed', finished_at = NOW() WHERE id = ?;
```

### Optimistic Locking

```sql
-- Add version column
ALTER TABLE products ADD COLUMN version INTEGER DEFAULT 1;

-- Read with version
SELECT id, name, price, version FROM products WHERE id = 1;
-- Returns: id=1, name='Widget', price=10, version=5

-- Update only if version matches
UPDATE products 
SET price = 15, version = version + 1
WHERE id = 1 AND version = 5;

-- Check if update succeeded
-- If affected rows = 0, someone else modified it
-- Application should re-read and retry
```

### Pessimistic Locking

```sql
-- Lock immediately when reading
BEGIN;
SELECT * FROM products WHERE id = 1 FOR UPDATE;
-- Row is locked, others wait
UPDATE products SET price = 15 WHERE id = 1;
COMMIT;
```

---

## Transaction Status

```sql
-- Current transaction status
SELECT txid_current();  -- Current transaction ID

-- Check if in transaction
SELECT pg_current_xact_id_if_assigned();  -- NULL if not in transaction

-- Transaction state
-- Use \echo :TRANSACTION to see state in psql

-- View active transactions
SELECT 
    pid,
    usename,
    state,
    query,
    xact_start,
    query_start,
    NOW() - xact_start AS duration
FROM pg_stat_activity
WHERE state != 'idle'
ORDER BY xact_start;

-- Long-running transactions
SELECT 
    pid,
    NOW() - xact_start AS duration,
    query
FROM pg_stat_activity
WHERE xact_start IS NOT NULL
  AND NOW() - xact_start > interval '5 minutes';

-- Kill long-running transaction
SELECT pg_terminate_backend(pid);
```

---

## Two-Phase Commit

For distributed transactions across multiple databases.

```sql
-- Phase 1: Prepare
BEGIN;
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
PREPARE TRANSACTION 'transfer_123';

-- Transaction is now in "prepared" state
-- Can survive server restart

-- Phase 2: Commit (or Rollback)
COMMIT PREPARED 'transfer_123';
-- or
ROLLBACK PREPARED 'transfer_123';

-- View prepared transactions
SELECT * FROM pg_prepared_xacts;

-- Note: Requires max_prepared_transactions > 0 in config
```

---

## Common Issues

### Lost Update

```sql
-- Session 1 reads balance = 1000
-- Session 2 reads balance = 1000
-- Session 1 updates to 1000 + 100 = 1100
-- Session 2 updates to 1000 + 50 = 1050
-- Final: 1050 (Session 1's update is lost!)

-- Solution: Use FOR UPDATE or atomic operations
UPDATE accounts SET balance = balance + 100 WHERE id = 1;
```

### Dirty Read

```sql
-- PostgreSQL prevents dirty reads by default
-- Even Read Uncommitted behaves like Read Committed
```

### Non-Repeatable Read

```sql
-- Use Repeatable Read isolation if you need consistent reads
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ;
SELECT balance FROM accounts WHERE id = 1;
-- Same query will always return same result within transaction
```

### Phantom Read

```sql
-- Session 1 selects rows matching condition
-- Session 2 inserts new row matching condition
-- Session 1 selects again and sees "phantom" row

-- Use Repeatable Read (or Serializable) to prevent
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ;
```

---

## Best Practices

### 1. Keep Transactions Short

```sql
-- Bad: Long transaction
BEGIN;
SELECT * FROM large_table;  -- Read lots of data
-- ... application processing for minutes ...
UPDATE table SET processed = true WHERE id = ?;
COMMIT;

-- Good: Short transactions
-- Read data
SELECT * FROM large_table WHERE processed = false LIMIT 100;

-- Process in application (no transaction)

-- Quick update
BEGIN;
UPDATE table SET processed = true WHERE id IN (?, ?, ?);
COMMIT;
```

### 2. Handle Errors Properly

```sql
-- In PL/pgSQL
BEGIN
    -- Do work
EXCEPTION
    WHEN serialization_failure THEN
        -- Retry logic
    WHEN OTHERS THEN
        RAISE;  -- Re-raise unexpected errors
END;
```

### 3. Use Appropriate Isolation Level

```sql
-- Default (Read Committed) for most operations
BEGIN;

-- Repeatable Read for consistent reports
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ;

-- Serializable for critical financial operations
BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;
```

### 4. Avoid Holding Locks During External Operations

```sql
-- Bad
BEGIN;
SELECT * FROM orders FOR UPDATE;
-- Make HTTP call to payment provider (slow!)
UPDATE orders SET status = 'paid';
COMMIT;

-- Good
-- Make HTTP call first
-- Then quick transaction
BEGIN;
UPDATE orders SET status = 'paid' WHERE id = ? AND status = 'pending';
COMMIT;
-- Check affected rows to verify
```

---

## Practice Exercises

### Exercise 1: Basic Transactions
1. Create a money transfer between accounts
2. Use savepoints for partial rollback
3. Test concurrent access

### Exercise 2: Isolation Levels
1. Demonstrate non-repeatable read
2. Test serializable with concurrent inserts
3. Handle serialization failures

### Exercise 3: Locking
1. Implement a job queue with SKIP LOCKED
2. Test deadlock detection
3. Use advisory locks for exclusive processing

### Exercise 4: Real-World Scenarios
1. Implement optimistic locking
2. Create a retry mechanism for serialization failures
3. Monitor long-running transactions

---

## Summary

In this chapter, you learned:
- ✅ ACID properties and their importance
- ✅ Transaction commands: BEGIN, COMMIT, ROLLBACK
- ✅ Savepoints for partial rollback
- ✅ Isolation levels and their trade-offs
- ✅ Row-level and table-level locking
- ✅ Advisory locks for application logic
- ✅ Common issues and solutions
- ✅ Best practices for transaction management

---

**Next Chapter:** [JSON & JSONB →](./15-JSON-JSONB.md)



