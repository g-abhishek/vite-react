# Chapter 16: Advanced Topics 🔬

This chapter covers advanced PostgreSQL features: partitioning, full-text search, security, backup, and replication.

---

## Table Partitioning

Split large tables into smaller, manageable pieces.

### Range Partitioning

```sql
-- Create partitioned table
CREATE TABLE orders (
    id BIGSERIAL,
    customer_id INTEGER,
    order_date DATE,
    total NUMERIC(12,2),
    PRIMARY KEY (id, order_date)  -- Must include partition key
) PARTITION BY RANGE (order_date);

-- Create partitions
CREATE TABLE orders_2023 PARTITION OF orders
    FOR VALUES FROM ('2023-01-01') TO ('2024-01-01');

CREATE TABLE orders_2024 PARTITION OF orders
    FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');

CREATE TABLE orders_2025 PARTITION OF orders
    FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');

-- Default partition for unmatched values
CREATE TABLE orders_default PARTITION OF orders DEFAULT;

-- Insert works transparently
INSERT INTO orders (customer_id, order_date, total) VALUES (1, '2024-06-15', 99.99);
-- Automatically goes to orders_2024 partition

-- Query benefits from partition pruning
EXPLAIN SELECT * FROM orders WHERE order_date = '2024-06-15';
-- Only scans orders_2024 partition
```

### List Partitioning

```sql
CREATE TABLE customers (
    id SERIAL,
    name VARCHAR(100),
    country VARCHAR(50),
    PRIMARY KEY (id, country)
) PARTITION BY LIST (country);

CREATE TABLE customers_usa PARTITION OF customers
    FOR VALUES IN ('USA', 'United States');

CREATE TABLE customers_eu PARTITION OF customers
    FOR VALUES IN ('Germany', 'France', 'UK', 'Spain', 'Italy');

CREATE TABLE customers_asia PARTITION OF customers
    FOR VALUES IN ('Japan', 'China', 'India', 'Korea');

CREATE TABLE customers_other PARTITION OF customers DEFAULT;
```

### Hash Partitioning

```sql
CREATE TABLE logs (
    id BIGSERIAL,
    user_id INTEGER,
    action TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (id, user_id)
) PARTITION BY HASH (user_id);

-- Create 4 partitions for even distribution
CREATE TABLE logs_0 PARTITION OF logs FOR VALUES WITH (MODULUS 4, REMAINDER 0);
CREATE TABLE logs_1 PARTITION OF logs FOR VALUES WITH (MODULUS 4, REMAINDER 1);
CREATE TABLE logs_2 PARTITION OF logs FOR VALUES WITH (MODULUS 4, REMAINDER 2);
CREATE TABLE logs_3 PARTITION OF logs FOR VALUES WITH (MODULUS 4, REMAINDER 3);
```

### Partition Management

```sql
-- Attach existing table as partition
ALTER TABLE orders ATTACH PARTITION orders_2024
    FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');

-- Detach partition (keeps data)
ALTER TABLE orders DETACH PARTITION orders_2022;
-- Now orders_2022 is a standalone table

-- Detach concurrently (PostgreSQL 14+)
ALTER TABLE orders DETACH PARTITION orders_2022 CONCURRENTLY;

-- Create indexes on partitioned table (creates on all partitions)
CREATE INDEX idx_orders_customer ON orders(customer_id);

-- Maintenance per partition
VACUUM orders_2024;
ANALYZE orders_2024;
```

### Automated Partition Creation

```sql
-- Function to create monthly partitions
CREATE OR REPLACE FUNCTION create_monthly_partition(
    parent_table TEXT,
    partition_date DATE
)
RETURNS void AS $$
DECLARE
    partition_name TEXT;
    start_date DATE;
    end_date DATE;
BEGIN
    start_date := DATE_TRUNC('month', partition_date);
    end_date := start_date + INTERVAL '1 month';
    partition_name := parent_table || '_' || TO_CHAR(start_date, 'YYYY_MM');
    
    EXECUTE format(
        'CREATE TABLE IF NOT EXISTS %I PARTITION OF %I FOR VALUES FROM (%L) TO (%L)',
        partition_name, parent_table, start_date, end_date
    );
END;
$$ LANGUAGE plpgsql;

-- Create next 12 months of partitions
DO $$
DECLARE
    i INTEGER;
BEGIN
    FOR i IN 0..11 LOOP
        PERFORM create_monthly_partition('orders', CURRENT_DATE + (i || ' months')::INTERVAL);
    END LOOP;
END;
$$;
```

---

## Full-Text Search

Powerful text search capabilities built into PostgreSQL.

### Basic Full-Text Search

```sql
-- Create table with text content
CREATE TABLE articles (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200),
    content TEXT,
    published_at TIMESTAMPTZ DEFAULT NOW()
);

-- Simple search using to_tsvector and to_tsquery
SELECT * FROM articles
WHERE to_tsvector('english', content) @@ to_tsquery('english', 'postgresql & performance');

-- @@ is the "matches" operator
-- to_tsvector converts text to searchable vector
-- to_tsquery converts query string to search query
```

### Search Vectors and Queries

```sql
-- Text to vector
SELECT to_tsvector('english', 'The quick brown fox jumps over the lazy dog');
-- 'brown':3 'dog':9 'fox':4 'jump':5 'lazi':8 'quick':2

-- Query formats
SELECT to_tsquery('english', 'fox & dog');        -- AND
SELECT to_tsquery('english', 'fox | cat');        -- OR
SELECT to_tsquery('english', '!fox');             -- NOT
SELECT to_tsquery('english', 'fox <-> jumps');    -- FOLLOWED BY
SELECT to_tsquery('english', 'fox <2> dog');      -- Within 2 words
SELECT plainto_tsquery('english', 'fox dog');     -- Plain text (implicit AND)
SELECT phraseto_tsquery('english', 'quick fox');  -- Exact phrase
SELECT websearch_to_tsquery('english', '"quick fox" -lazy'); -- Web-style query
```

### Stored Search Vectors

```sql
-- Add tsvector column (better performance)
ALTER TABLE articles ADD COLUMN search_vector TSVECTOR;

-- Update search vector
UPDATE articles SET search_vector = 
    setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(content, '')), 'B');

-- Create GIN index
CREATE INDEX idx_articles_search ON articles USING GIN(search_vector);

-- Trigger to maintain search vector
CREATE OR REPLACE FUNCTION update_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.content, '')), 'B');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_update_search
    BEFORE INSERT OR UPDATE ON articles
    FOR EACH ROW
    EXECUTE FUNCTION update_search_vector();
```

### Ranking Results

```sql
-- ts_rank for relevance scoring
SELECT 
    title,
    ts_rank(search_vector, query) AS rank
FROM articles, to_tsquery('english', 'postgresql') AS query
WHERE search_vector @@ query
ORDER BY rank DESC;

-- ts_rank_cd considers document length
SELECT 
    title,
    ts_rank_cd(search_vector, query) AS rank
FROM articles, to_tsquery('english', 'postgresql') AS query
WHERE search_vector @@ query
ORDER BY rank DESC;

-- Highlight matches
SELECT 
    title,
    ts_headline('english', content, to_tsquery('english', 'postgresql'),
        'StartSel=<mark>, StopSel=</mark>, MaxWords=50, MinWords=25'
    ) AS snippet
FROM articles
WHERE search_vector @@ to_tsquery('english', 'postgresql');
```

### Full-Text Search Configuration

```sql
-- List available configurations
\dF

-- List dictionaries
\dFd

-- Create custom configuration
CREATE TEXT SEARCH CONFIGURATION custom_config (COPY = english);

-- Add synonym dictionary
CREATE TEXT SEARCH DICTIONARY synonyms (
    TEMPLATE = synonym,
    SYNONYMS = my_synonyms  -- file: $SHAREDIR/tsearch_data/my_synonyms.syn
);

ALTER TEXT SEARCH CONFIGURATION custom_config
    ALTER MAPPING FOR asciiword WITH synonyms, english_stem;
```

---

## Security & Permissions

### Roles and Users

```sql
-- Create role
CREATE ROLE analyst;

-- Create user (role with login)
CREATE USER john WITH PASSWORD 'secret123';
-- or
CREATE ROLE john WITH LOGIN PASSWORD 'secret123';

-- Role attributes
CREATE ROLE admin WITH 
    LOGIN
    SUPERUSER
    CREATEDB
    CREATEROLE
    INHERIT
    REPLICATION
    CONNECTION LIMIT 10;

-- Grant role to user
GRANT analyst TO john;

-- Alter role
ALTER ROLE john WITH PASSWORD 'newsecret';
ALTER ROLE john SET search_path TO myschema, public;
ALTER ROLE john VALID UNTIL '2025-01-01';

-- Drop role
DROP ROLE john;
```

### Privileges

```sql
-- Grant privileges on database
GRANT CONNECT ON DATABASE mydb TO analyst;
GRANT CREATE ON DATABASE mydb TO developer;

-- Grant privileges on schema
GRANT USAGE ON SCHEMA myschema TO analyst;
GRANT CREATE ON SCHEMA myschema TO developer;
GRANT ALL ON SCHEMA myschema TO admin;

-- Grant privileges on table
GRANT SELECT ON users TO analyst;
GRANT SELECT, INSERT, UPDATE ON users TO developer;
GRANT ALL ON users TO admin;

-- Grant on all tables
GRANT SELECT ON ALL TABLES IN SCHEMA public TO analyst;

-- Grant on future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT SELECT ON TABLES TO analyst;

-- Grant specific columns
GRANT SELECT (id, name, email) ON users TO analyst;
GRANT UPDATE (status) ON orders TO support;

-- Revoke privileges
REVOKE ALL ON users FROM public;
REVOKE SELECT ON users FROM analyst;

-- Check privileges
\dp users
-- or
SELECT * FROM information_schema.table_privileges 
WHERE table_name = 'users';
```

### Row-Level Security (RLS)

```sql
-- Enable RLS on table
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY orders_own_data ON orders
    FOR ALL
    TO customer_role
    USING (customer_id = current_setting('app.current_user_id')::INTEGER);

-- Policy for SELECT only
CREATE POLICY orders_select ON orders
    FOR SELECT
    TO analyst
    USING (true);  -- Can read all

-- Policy for INSERT
CREATE POLICY orders_insert ON orders
    FOR INSERT
    TO customer_role
    WITH CHECK (customer_id = current_setting('app.current_user_id')::INTEGER);

-- Policy with function
CREATE POLICY orders_by_region ON orders
    FOR SELECT
    TO regional_manager
    USING (region = get_user_region(current_user));

-- Bypass RLS (for admin)
ALTER TABLE orders FORCE ROW LEVEL SECURITY;
GRANT BYPASSRLS TO admin;

-- Drop policy
DROP POLICY orders_own_data ON orders;
```

### Encryption

```sql
-- pgcrypto extension for encryption
CREATE EXTENSION pgcrypto;

-- Hash passwords
INSERT INTO users (email, password_hash)
VALUES ('john@example.com', crypt('password123', gen_salt('bf')));

-- Verify password
SELECT * FROM users
WHERE email = 'john@example.com'
  AND password_hash = crypt('password123', password_hash);

-- Encrypt data
INSERT INTO sensitive_data (encrypted_ssn)
VALUES (pgp_sym_encrypt('123-45-6789', 'encryption_key'));

-- Decrypt data
SELECT pgp_sym_decrypt(encrypted_ssn::bytea, 'encryption_key')
FROM sensitive_data;

-- SSL/TLS connection
-- Configure in postgresql.conf:
-- ssl = on
-- ssl_cert_file = 'server.crt'
-- ssl_key_file = 'server.key'
```

---

## Backup & Recovery

### pg_dump (Logical Backup)

```bash
# Dump single database
pg_dump mydb > mydb_backup.sql

# Dump with compression
pg_dump -Fc mydb > mydb_backup.dump

# Dump specific tables
pg_dump -t users -t orders mydb > tables_backup.sql

# Dump schema only
pg_dump --schema-only mydb > schema_backup.sql

# Dump data only
pg_dump --data-only mydb > data_backup.sql

# Parallel dump (directory format)
pg_dump -Fd -j 4 -f backup_dir mydb
```

### pg_restore

```bash
# Restore from custom format
pg_restore -d newdb mydb_backup.dump

# Restore specific table
pg_restore -t users -d mydb mydb_backup.dump

# Parallel restore
pg_restore -j 4 -d mydb backup_dir

# List contents of backup
pg_restore -l mydb_backup.dump
```

### pg_dumpall (All Databases)

```bash
# Dump all databases including roles
pg_dumpall > full_backup.sql

# Dump roles only
pg_dumpall --roles-only > roles.sql

# Dump tablespaces
pg_dumpall --tablespaces-only > tablespaces.sql
```

### Continuous Archiving (PITR)

```sql
-- postgresql.conf settings
-- wal_level = replica
-- archive_mode = on
-- archive_command = 'cp %p /backup/archive/%f'

-- Create base backup
-- pg_basebackup -D /backup/base -Ft -z -P

-- Restore with PITR
-- 1. Stop PostgreSQL
-- 2. Clear data directory
-- 3. Extract base backup
-- 4. Create recovery.signal file
-- 5. Configure postgresql.conf:
--    restore_command = 'cp /backup/archive/%f %p'
--    recovery_target_time = '2024-06-15 14:30:00'
-- 6. Start PostgreSQL
```

---

## Replication

### Streaming Replication

```sql
-- Primary server postgresql.conf
-- wal_level = replica
-- max_wal_senders = 3
-- wal_keep_size = 1GB

-- Primary server pg_hba.conf
-- host replication replicator 192.168.1.0/24 md5

-- Create replication user
CREATE ROLE replicator WITH REPLICATION LOGIN PASSWORD 'repl_password';

-- On standby server
-- pg_basebackup -h primary_host -D /var/lib/postgresql/data -U replicator -P -R
-- -R creates standby.signal and sets primary_conninfo

-- Check replication status
SELECT * FROM pg_stat_replication;  -- On primary
SELECT * FROM pg_stat_wal_receiver; -- On standby
```

### Logical Replication

```sql
-- Publisher (source) setup
-- wal_level = logical

-- Create publication
CREATE PUBLICATION my_pub FOR ALL TABLES;
-- or specific tables
CREATE PUBLICATION my_pub FOR TABLE users, orders;

-- Subscriber (target) setup
CREATE SUBSCRIPTION my_sub
    CONNECTION 'host=primary_host dbname=mydb user=replicator password=secret'
    PUBLICATION my_pub;

-- Monitor
SELECT * FROM pg_publication_tables;
SELECT * FROM pg_stat_subscription;
```

---

## Performance Monitoring

### System Views

```sql
-- Active queries
SELECT pid, usename, state, query, query_start, 
       NOW() - query_start AS duration
FROM pg_stat_activity
WHERE state = 'active'
ORDER BY duration DESC;

-- Table statistics
SELECT 
    schemaname,
    relname,
    seq_scan, seq_tup_read,
    idx_scan, idx_tup_fetch,
    n_tup_ins, n_tup_upd, n_tup_del,
    n_live_tup, n_dead_tup,
    last_vacuum, last_autovacuum,
    last_analyze, last_autoanalyze
FROM pg_stat_user_tables
ORDER BY seq_scan DESC;

-- Index usage
SELECT 
    schemaname, relname, indexrelname,
    idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- Unused indexes
SELECT schemaname, relname, indexrelname, idx_scan
FROM pg_stat_user_indexes
WHERE idx_scan = 0
ORDER BY pg_relation_size(indexrelid) DESC;

-- Cache hit ratio
SELECT 
    sum(heap_blks_hit) * 100.0 / nullif(sum(heap_blks_hit) + sum(heap_blks_read), 0) AS cache_hit_ratio
FROM pg_statio_user_tables;

-- Database size
SELECT 
    datname,
    pg_size_pretty(pg_database_size(datname)) AS size
FROM pg_database
ORDER BY pg_database_size(datname) DESC;

-- Table sizes
SELECT 
    relname,
    pg_size_pretty(pg_total_relation_size(relid)) AS total_size,
    pg_size_pretty(pg_relation_size(relid)) AS data_size,
    pg_size_pretty(pg_indexes_size(relid)) AS index_size
FROM pg_stat_user_tables
ORDER BY pg_total_relation_size(relid) DESC
LIMIT 20;
```

### pg_stat_statements

```sql
-- Enable extension
CREATE EXTENSION pg_stat_statements;

-- Top queries by total time
SELECT 
    query,
    calls,
    total_exec_time / 1000 AS total_seconds,
    mean_exec_time AS avg_ms,
    rows
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 20;

-- Top queries by calls
SELECT query, calls, mean_exec_time
FROM pg_stat_statements
ORDER BY calls DESC
LIMIT 20;

-- Reset statistics
SELECT pg_stat_statements_reset();
```

---

## Configuration Tuning

```sql
-- Memory settings
shared_buffers = '256MB'           -- 25% of RAM for dedicated server
effective_cache_size = '1GB'       -- 50-75% of RAM
work_mem = '64MB'                  -- Per-operation memory
maintenance_work_mem = '256MB'     -- For VACUUM, CREATE INDEX

-- WAL settings
wal_buffers = '16MB'
checkpoint_completion_target = 0.9
max_wal_size = '2GB'

-- Planner settings
random_page_cost = 1.1             -- For SSD (default 4.0)
effective_io_concurrency = 200     -- For SSD

-- Connection settings
max_connections = 100
listen_addresses = '*'

-- Logging
log_statement = 'all'              -- For debugging
log_duration = on
log_min_duration_statement = 1000  -- Log queries > 1s

-- Check current settings
SHOW shared_buffers;
SHOW ALL;

-- Change setting for session
SET work_mem = '128MB';

-- Change setting permanently (requires restart for some)
ALTER SYSTEM SET shared_buffers = '512MB';
SELECT pg_reload_conf();  -- Reload config without restart
```

---

## Practice Exercises

### Exercise 1: Partitioning
1. Create a partitioned table for time-series data
2. Set up automatic partition creation
3. Test partition pruning with EXPLAIN

### Exercise 2: Full-Text Search
1. Implement search across articles table
2. Add ranking and highlighting
3. Create weighted search vector

### Exercise 3: Security
1. Set up roles for different user types
2. Implement row-level security
3. Configure SSL connections

### Exercise 4: Backup & Recovery
1. Create logical backup with pg_dump
2. Set up streaming replication
3. Practice point-in-time recovery

---

## Summary

In this chapter, you learned:
- ✅ Table partitioning (range, list, hash)
- ✅ Full-text search with tsvector and GIN indexes
- ✅ Security: roles, privileges, RLS
- ✅ Backup strategies: pg_dump, pg_basebackup
- ✅ Replication: streaming and logical
- ✅ Performance monitoring and tuning

---

**Next Chapter:** [Interview Questions →](./17-Interview-Questions.md)




