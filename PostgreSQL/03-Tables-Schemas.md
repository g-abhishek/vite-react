# Chapter 3: Tables & Schemas 🏗️

Tables are the fundamental building blocks of relational databases. This chapter covers everything about creating, modifying, and organizing tables.

---

## Creating Tables

### Basic CREATE TABLE Syntax

```sql
CREATE TABLE table_name (
    column1 datatype [constraints],
    column2 datatype [constraints],
    ...
    [table_constraints]
);
```

### Complete Example

```sql
-- Create a comprehensive users table
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    bio TEXT,
    avatar_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator')),
    login_count INTEGER DEFAULT 0,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Add comments for documentation
COMMENT ON TABLE users IS 'Main users table storing user account information';
COMMENT ON COLUMN users.password_hash IS 'BCrypt hashed password';
COMMENT ON COLUMN users.role IS 'User role: user, admin, or moderator';
```

### CREATE TABLE Options

```sql
-- Create table only if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100)
);

-- Create temporary table (session-only)
CREATE TEMPORARY TABLE temp_results (
    id INTEGER,
    score NUMERIC
);

-- Create unlogged table (faster, no WAL, lost on crash)
CREATE UNLOGGED TABLE cache_data (
    key VARCHAR(255) PRIMARY KEY,
    value JSONB,
    expires_at TIMESTAMPTZ
);

-- Create table from query result
CREATE TABLE active_users AS
SELECT * FROM users WHERE is_active = true;

-- Create table structure only (no data)
CREATE TABLE users_backup (LIKE users INCLUDING ALL);

-- LIKE options
CREATE TABLE users_copy (
    LIKE users 
    INCLUDING DEFAULTS 
    INCLUDING CONSTRAINTS 
    INCLUDING INDEXES 
    INCLUDING COMMENTS
);
```

---

## Column Constraints

### NOT NULL

```sql
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,      -- Cannot be NULL
    description TEXT                 -- Can be NULL
);

-- Insert will fail
INSERT INTO products (name) VALUES (NULL);  -- ERROR
INSERT INTO products (description) VALUES ('test');  -- ERROR: name is required
```

### UNIQUE

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE,        -- Single column unique
    username VARCHAR(50) UNIQUE
);

-- Multi-column unique constraint
CREATE TABLE subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    plan_id INTEGER,
    UNIQUE (user_id, plan_id)         -- Combination must be unique
);

-- Named constraint
CREATE TABLE employees (
    id SERIAL PRIMARY KEY,
    employee_code VARCHAR(20),
    CONSTRAINT uk_employee_code UNIQUE (employee_code)
);
```

### PRIMARY KEY

```sql
-- Single column primary key
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    order_date DATE
);

-- Composite primary key
CREATE TABLE order_items (
    order_id INTEGER,
    product_id INTEGER,
    quantity INTEGER,
    PRIMARY KEY (order_id, product_id)
);

-- Named primary key
CREATE TABLE categories (
    id SERIAL,
    name VARCHAR(100),
    CONSTRAINT pk_categories PRIMARY KEY (id)
);
```

### FOREIGN KEY

```sql
-- Basic foreign key
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    total NUMERIC(10,2)
);

-- With explicit ON DELETE/UPDATE actions
CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    post_id INTEGER,
    user_id INTEGER,
    content TEXT,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Foreign key actions:
-- CASCADE     - Delete/update child rows
-- SET NULL    - Set foreign key to NULL
-- SET DEFAULT - Set to default value
-- RESTRICT    - Prevent delete/update (default)
-- NO ACTION   - Similar to RESTRICT (checked at end of statement)

-- Named foreign key
CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    product_id INTEGER,
    CONSTRAINT fk_reviews_product 
        FOREIGN KEY (product_id) 
        REFERENCES products(id) 
        ON DELETE CASCADE
);

-- Self-referential foreign key
CREATE TABLE employees (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    manager_id INTEGER REFERENCES employees(id)
);
```

### CHECK Constraint

```sql
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    price NUMERIC(10,2) CHECK (price > 0),
    discount NUMERIC(3,2) CHECK (discount >= 0 AND discount <= 1),
    quantity INTEGER CHECK (quantity >= 0),
    
    -- Multi-column check
    sale_price NUMERIC(10,2),
    CONSTRAINT valid_sale_price CHECK (sale_price IS NULL OR sale_price < price)
);

-- Named check constraint
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    age INTEGER,
    CONSTRAINT age_range CHECK (age >= 0 AND age <= 150)
);

-- Check with function
CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    start_date DATE,
    end_date DATE,
    CONSTRAINT valid_dates CHECK (end_date > start_date)
);
```

### DEFAULT Values

```sql
CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200),
    status VARCHAR(20) DEFAULT 'draft',
    view_count INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    publish_date DATE DEFAULT CURRENT_DATE,
    uuid UUID DEFAULT gen_random_uuid()
);

-- DEFAULT with expression
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    action VARCHAR(50),
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    year INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)
);
```

---

## Table Constraints (Multi-Column)

```sql
CREATE TABLE bookings (
    id SERIAL PRIMARY KEY,
    room_id INTEGER,
    user_id INTEGER,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    
    -- Table-level constraints
    CONSTRAINT fk_room FOREIGN KEY (room_id) REFERENCES rooms(id),
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT unique_booking UNIQUE (room_id, start_time),
    CONSTRAINT valid_time_range CHECK (end_time > start_time),
    CONSTRAINT min_duration CHECK (end_time - start_time >= INTERVAL '30 minutes')
);
```

---

## Altering Tables

### Add Column

```sql
-- Add single column
ALTER TABLE users ADD COLUMN phone VARCHAR(20);

-- Add column with constraints
ALTER TABLE users ADD COLUMN age INTEGER CHECK (age >= 0);

-- Add column with default (fills existing rows)
ALTER TABLE users ADD COLUMN is_premium BOOLEAN DEFAULT false;

-- Add column with NOT NULL (existing rows must have default)
ALTER TABLE users ADD COLUMN country VARCHAR(50) NOT NULL DEFAULT 'Unknown';
```

### Drop Column

```sql
-- Drop column
ALTER TABLE users DROP COLUMN phone;

-- Drop column and dependent objects (views, indexes)
ALTER TABLE users DROP COLUMN phone CASCADE;

-- Drop only if exists
ALTER TABLE users DROP COLUMN IF EXISTS phone;
```

### Modify Column

```sql
-- Change data type
ALTER TABLE users ALTER COLUMN age TYPE SMALLINT;

-- Change type with conversion
ALTER TABLE products ALTER COLUMN price TYPE NUMERIC(12,2);

-- Change type with explicit conversion
ALTER TABLE users 
ALTER COLUMN age TYPE VARCHAR(10) 
USING age::VARCHAR(10);

-- Set/drop default
ALTER TABLE users ALTER COLUMN is_active SET DEFAULT true;
ALTER TABLE users ALTER COLUMN is_active DROP DEFAULT;

-- Set/drop NOT NULL
ALTER TABLE users ALTER COLUMN email SET NOT NULL;
ALTER TABLE users ALTER COLUMN phone DROP NOT NULL;
```

### Rename

```sql
-- Rename column
ALTER TABLE users RENAME COLUMN full_name TO display_name;

-- Rename table
ALTER TABLE users RENAME TO app_users;
```

### Constraints

```sql
-- Add constraint
ALTER TABLE users ADD CONSTRAINT uk_phone UNIQUE (phone);
ALTER TABLE users ADD CONSTRAINT chk_age CHECK (age >= 18);
ALTER TABLE orders ADD CONSTRAINT fk_user 
    FOREIGN KEY (user_id) REFERENCES users(id);

-- Drop constraint
ALTER TABLE users DROP CONSTRAINT uk_phone;

-- Rename constraint
ALTER TABLE users RENAME CONSTRAINT chk_age TO valid_age;

-- Disable/enable constraint (for bulk loading)
ALTER TABLE orders DISABLE TRIGGER ALL;  -- Disable all triggers
-- ... bulk insert ...
ALTER TABLE orders ENABLE TRIGGER ALL;

-- Validate existing data against new constraint
ALTER TABLE users ADD CONSTRAINT chk_email 
    CHECK (email LIKE '%@%') NOT VALID;
-- Later, validate existing rows
ALTER TABLE users VALIDATE CONSTRAINT chk_email;
```

---

## Dropping Tables

```sql
-- Drop table
DROP TABLE users;

-- Drop if exists
DROP TABLE IF EXISTS users;

-- Drop with dependencies (CASCADE)
DROP TABLE users CASCADE;

-- Drop multiple tables
DROP TABLE users, orders, products;

-- Truncate (delete all rows, keep structure)
TRUNCATE TABLE users;

-- Truncate with cascade (truncate dependent tables)
TRUNCATE TABLE users CASCADE;

-- Truncate and reset identity/serial
TRUNCATE TABLE users RESTART IDENTITY;
```

---

## Schemas

Schemas are namespaces that organize database objects.

### Default Schema

```sql
-- PostgreSQL uses 'public' schema by default
-- These are equivalent:
SELECT * FROM users;
SELECT * FROM public.users;

-- Check current schema search path
SHOW search_path;  -- "$user", public
```

### Creating Schemas

```sql
-- Create schema
CREATE SCHEMA sales;
CREATE SCHEMA hr;
CREATE SCHEMA IF NOT EXISTS inventory;

-- Create schema with owner
CREATE SCHEMA sales AUTHORIZATION sales_admin;

-- Create schema with objects
CREATE SCHEMA ecommerce
    CREATE TABLE products (id SERIAL PRIMARY KEY, name VARCHAR(100))
    CREATE TABLE orders (id SERIAL PRIMARY KEY, product_id INTEGER);
```

### Using Schemas

```sql
-- Create table in specific schema
CREATE TABLE sales.customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100)
);

-- Query from schema
SELECT * FROM sales.customers;

-- Set search path
SET search_path TO sales, public;

-- Now 'customers' resolves to 'sales.customers'
SELECT * FROM customers;

-- Permanent search path for user
ALTER USER myuser SET search_path TO sales, public;

-- Permanent search path for database
ALTER DATABASE mydb SET search_path TO sales, public;
```

### Schema Permissions

```sql
-- Grant usage on schema
GRANT USAGE ON SCHEMA sales TO analyst;

-- Grant create on schema
GRANT CREATE ON SCHEMA sales TO developer;

-- Grant all privileges
GRANT ALL ON SCHEMA sales TO admin;

-- Revoke
REVOKE ALL ON SCHEMA sales FROM public;
```

### Schema Best Practices

```sql
-- Organize by domain
CREATE SCHEMA auth;           -- Authentication (users, sessions, tokens)
CREATE SCHEMA inventory;      -- Products, stock, warehouses
CREATE SCHEMA sales;          -- Orders, payments, invoices
CREATE SCHEMA reporting;      -- Views and materialized views for reports
CREATE SCHEMA staging;        -- ETL staging tables
CREATE SCHEMA archive;        -- Historical/archived data

-- Example structure
-- auth.users
-- auth.sessions
-- auth.permissions
-- sales.orders
-- sales.order_items
-- sales.payments
-- reporting.daily_sales
-- reporting.monthly_revenue
```

---

## Table Inheritance

PostgreSQL supports table inheritance (unique feature).

```sql
-- Parent table
CREATE TABLE vehicles (
    id SERIAL PRIMARY KEY,
    make VARCHAR(50),
    model VARCHAR(50),
    year INTEGER,
    price NUMERIC(10,2)
);

-- Child tables inherit columns
CREATE TABLE cars (
    num_doors INTEGER,
    body_type VARCHAR(20)
) INHERITS (vehicles);

CREATE TABLE motorcycles (
    engine_cc INTEGER,
    has_sidecar BOOLEAN DEFAULT false
) INHERITS (vehicles);

-- Insert into child tables
INSERT INTO cars (make, model, year, price, num_doors, body_type)
VALUES ('Toyota', 'Camry', 2024, 28000, 4, 'sedan');

INSERT INTO motorcycles (make, model, year, price, engine_cc)
VALUES ('Honda', 'CBR', 2024, 12000, 600);

-- Query parent (includes all children)
SELECT * FROM vehicles;

-- Query parent only (excludes children)
SELECT * FROM ONLY vehicles;

-- Check which table row comes from
SELECT tableoid::regclass, * FROM vehicles;
```

### Inheritance Caveats

```sql
-- ⚠️ PRIMARY KEY is not inherited
-- Each child needs its own
CREATE TABLE cars (
    id SERIAL PRIMARY KEY,
    num_doors INTEGER
) INHERITS (vehicles);

-- ⚠️ UNIQUE constraints not enforced across tables
-- This might create duplicates across parent and children

-- ⚠️ Foreign keys don't work well with inheritance
-- Consider partitioning instead for modern PostgreSQL
```

---

## Table Partitioning

Partitioning splits a large table into smaller physical pieces.

### Range Partitioning

```sql
-- Create partitioned table
CREATE TABLE orders (
    id BIGSERIAL,
    customer_id INTEGER,
    order_date DATE,
    total NUMERIC(10,2),
    PRIMARY KEY (id, order_date)
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

-- Query works transparently
SELECT * FROM orders WHERE order_date = '2024-06-15';
-- PostgreSQL only scans orders_2024 partition
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
-- Distribute data evenly across partitions
CREATE TABLE logs (
    id BIGSERIAL,
    user_id INTEGER,
    action VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (id, user_id)
) PARTITION BY HASH (user_id);

-- Create 4 partitions
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

-- Detach partition (keeps data, removes from partitioned table)
ALTER TABLE orders DETACH PARTITION orders_2022;

-- Drop partition
DROP TABLE orders_2020;

-- Create index on all partitions
CREATE INDEX idx_orders_customer ON orders (customer_id);
-- Automatically creates indexes on all partitions
```

---

## Temporary Tables

```sql
-- Session-scoped temp table
CREATE TEMPORARY TABLE temp_calculations (
    id INTEGER,
    result NUMERIC
);

-- Transaction-scoped temp table
CREATE TEMPORARY TABLE temp_results (
    data JSONB
) ON COMMIT DROP;  -- Dropped when transaction ends

-- ON COMMIT options:
-- PRESERVE ROWS (default) - Keep data until session ends
-- DELETE ROWS - Truncate at end of each transaction
-- DROP - Drop table at end of transaction

-- Temp tables are only visible in current session
-- Same name can exist in different sessions
```

---

## Useful Table Operations

### Copy Table Structure

```sql
-- Copy structure only
CREATE TABLE users_backup (LIKE users INCLUDING ALL);

-- Copy structure and data
CREATE TABLE users_backup AS SELECT * FROM users;

-- Copy partial data
CREATE TABLE active_users AS 
SELECT * FROM users WHERE is_active = true;
```

### Get Table Information

```sql
-- Table structure
\d users
\d+ users  -- With extra info

-- All tables
\dt
\dt+ public.*

-- Table size
SELECT pg_size_pretty(pg_total_relation_size('users'));

-- Row count estimate (fast)
SELECT reltuples::BIGINT FROM pg_class WHERE relname = 'users';

-- Exact row count (slow for large tables)
SELECT COUNT(*) FROM users;

-- Column information
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'users';

-- Constraints
SELECT 
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'users'::regclass;
```

---

## Practice Exercises

### Exercise 1: E-commerce Schema
Design and create tables for an e-commerce system:
- users (id, email, password_hash, etc.)
- products (id, name, price, category, etc.)
- orders (id, user_id, total, status, etc.)
- order_items (order_id, product_id, quantity, price)

### Exercise 2: Schema Organization
Create a multi-schema structure:
- `auth` schema for user-related tables
- `store` schema for product/order tables
- `analytics` schema for reporting views

### Exercise 3: Partitioned Table
Create a partitioned `events` table:
- Partition by month
- Include indexes
- Add sample data and query specific partitions

---

## Summary

In this chapter, you learned:
- ✅ Creating tables with all constraint types
- ✅ Column and table-level constraints
- ✅ Altering table structure safely
- ✅ Using schemas for organization
- ✅ Table inheritance (legacy feature)
- ✅ Table partitioning (modern approach)
- ✅ Temporary tables for session data

---

**Next Chapter:** [CRUD Operations →](./04-CRUD-Operations.md)




