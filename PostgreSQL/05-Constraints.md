# Chapter 5: Constraints 🔒

Constraints are rules enforced on table columns to ensure data integrity. They prevent invalid data from entering the database.

---

## Why Constraints Matter

```sql
-- Without constraints, anything goes:
INSERT INTO users (email) VALUES (NULL);           -- Oops, no email
INSERT INTO users (email) VALUES ('invalid');      -- Not a valid email
INSERT INTO users (email) VALUES ('same@email.com');  -- Duplicate!
INSERT INTO orders (user_id) VALUES (99999);       -- User doesn't exist

-- With constraints, the database enforces rules automatically
```

---

## NOT NULL Constraint

Ensures a column cannot contain NULL values.

```sql
-- Create table with NOT NULL
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,      -- Required
    username VARCHAR(50) NOT NULL,    -- Required
    bio TEXT                          -- Optional (can be NULL)
);

-- Insert tests
INSERT INTO users (email, username) VALUES ('test@example.com', 'testuser');  -- ✓
INSERT INTO users (email) VALUES ('test@example.com');  -- ✗ ERROR: null value in column "username"
INSERT INTO users (username) VALUES ('testuser');       -- ✗ ERROR: null value in column "email"

-- Add NOT NULL to existing column
-- First, update existing NULLs
UPDATE users SET bio = 'No bio' WHERE bio IS NULL;
-- Then add constraint
ALTER TABLE users ALTER COLUMN bio SET NOT NULL;

-- Remove NOT NULL
ALTER TABLE users ALTER COLUMN bio DROP NOT NULL;

-- NOT NULL with DEFAULT (allows inserts without specifying column)
CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'draft'  -- Required but has default
);

INSERT INTO posts (title) VALUES ('My First Post');  -- ✓ status = 'draft'
```

---

## UNIQUE Constraint

Ensures all values in a column are distinct.

```sql
-- Single column unique
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE,
    username VARCHAR(50) UNIQUE
);

-- Insert tests
INSERT INTO users (email, username) VALUES ('user1@test.com', 'user1');  -- ✓
INSERT INTO users (email, username) VALUES ('user1@test.com', 'user2');  -- ✗ Duplicate email
INSERT INTO users (email, username) VALUES ('user2@test.com', 'user1');  -- ✗ Duplicate username

-- NULL values in UNIQUE columns
-- Multiple NULLs are allowed (NULL ≠ NULL)
INSERT INTO users (email, username) VALUES (NULL, 'user3');  -- ✓
INSERT INTO users (email, username) VALUES (NULL, 'user4');  -- ✓ (both can be NULL)

-- Named UNIQUE constraint
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    sku VARCHAR(50),
    CONSTRAINT uk_products_sku UNIQUE (sku)
);

-- Multi-column UNIQUE (composite)
CREATE TABLE subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    plan_id INTEGER,
    UNIQUE (user_id, plan_id)  -- Same user can't subscribe to same plan twice
);

-- Named multi-column unique
CREATE TABLE user_roles (
    user_id INTEGER,
    role_id INTEGER,
    CONSTRAINT uk_user_roles UNIQUE (user_id, role_id)
);

-- Add UNIQUE to existing table
ALTER TABLE users ADD CONSTRAINT uk_users_phone UNIQUE (phone);

-- Remove UNIQUE constraint
ALTER TABLE users DROP CONSTRAINT uk_users_phone;

-- Partial unique (unique only for certain rows)
CREATE UNIQUE INDEX idx_active_email ON users (email) WHERE is_active = true;
-- Only active users must have unique emails
```

---

## PRIMARY KEY Constraint

Uniquely identifies each row. Combines NOT NULL and UNIQUE.

```sql
-- Simple primary key
CREATE TABLE users (
    id SERIAL PRIMARY KEY,  -- Auto-incrementing integer
    email VARCHAR(255)
);

-- Equivalent to:
CREATE TABLE users (
    id SERIAL NOT NULL UNIQUE,
    email VARCHAR(255)
);

-- Named primary key
CREATE TABLE products (
    id SERIAL,
    name VARCHAR(200),
    CONSTRAINT pk_products PRIMARY KEY (id)
);

-- Composite primary key
CREATE TABLE order_items (
    order_id INTEGER,
    product_id INTEGER,
    quantity INTEGER,
    PRIMARY KEY (order_id, product_id)  -- Combination must be unique
);

-- UUID as primary key
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255)
);

-- IDENTITY (SQL standard, recommended over SERIAL)
CREATE TABLE users (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email VARCHAR(255)
);

-- Add primary key to existing table
ALTER TABLE logs ADD CONSTRAINT pk_logs PRIMARY KEY (id);

-- Remove primary key
ALTER TABLE logs DROP CONSTRAINT pk_logs;

-- Cannot have NULL in primary key
INSERT INTO users (id, email) VALUES (NULL, 'test@test.com');  -- ✗ ERROR
```

---

## FOREIGN KEY Constraint

Ensures referential integrity between tables.

```sql
-- Basic foreign key
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id),
    total NUMERIC(10,2)
);

-- Explicit foreign key syntax
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER,
    CONSTRAINT fk_orders_customer 
        FOREIGN KEY (customer_id) 
        REFERENCES customers(id)
);

-- Multi-column foreign key
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER,
    product_id INTEGER,
    FOREIGN KEY (order_id, product_id) 
        REFERENCES order_products(order_id, product_id)
);
```

### ON DELETE Actions

```sql
-- CASCADE: Delete child rows when parent is deleted
CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
    content TEXT
);
-- When post is deleted, all its comments are deleted too

-- SET NULL: Set foreign key to NULL
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    salesperson_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
    total NUMERIC(10,2)
);
-- When salesperson is deleted, orders remain but salesperson_id becomes NULL

-- SET DEFAULT: Set to default value
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    category_id INTEGER DEFAULT 1 REFERENCES categories(id) ON DELETE SET DEFAULT,
    name VARCHAR(200)
);
-- When category is deleted, orders get category_id = 1

-- RESTRICT: Prevent deletion (default behavior)
CREATE TABLE departments (
    id SERIAL PRIMARY KEY,
    manager_id INTEGER REFERENCES employees(id) ON DELETE RESTRICT
);
-- Cannot delete employee if they're a manager

-- NO ACTION: Similar to RESTRICT, but checked at end of statement
CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER REFERENCES employees(id) ON DELETE NO ACTION
);
```

### ON UPDATE Actions

```sql
-- CASCADE: Update child foreign keys when parent key changes
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,
    quantity INTEGER
);
-- If order ID changes (rare), order_items.order_id updates too

-- Usually primary keys don't change, but it's useful for natural keys
CREATE TABLE countries (
    code CHAR(2) PRIMARY KEY,  -- 'US', 'UK', etc.
    name VARCHAR(100)
);

CREATE TABLE cities (
    id SERIAL PRIMARY KEY,
    country_code CHAR(2) REFERENCES countries(code) ON UPDATE CASCADE,
    name VARCHAR(100)
);
-- If country code changes (e.g., 'UK' to 'GB'), cities update automatically
```

### Deferred Constraints

```sql
-- Deferred constraint checking
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    parent_id INTEGER,
    name VARCHAR(100),
    CONSTRAINT fk_parent 
        FOREIGN KEY (parent_id) 
        REFERENCES categories(id) 
        DEFERRABLE INITIALLY DEFERRED
);

-- Allows circular references within a transaction
BEGIN;
INSERT INTO categories (id, parent_id, name) VALUES (1, 2, 'Child');
INSERT INTO categories (id, parent_id, name) VALUES (2, 1, 'Parent');
COMMIT;  -- Constraints checked here, both rows exist

-- Change deferral mode in transaction
SET CONSTRAINTS fk_parent IMMEDIATE;
SET CONSTRAINTS fk_parent DEFERRED;
SET CONSTRAINTS ALL DEFERRED;
```

### Self-Referential Foreign Key

```sql
-- Employee reports to manager (who is also an employee)
CREATE TABLE employees (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    manager_id INTEGER REFERENCES employees(id)
);

INSERT INTO employees (id, name, manager_id) VALUES (1, 'CEO', NULL);
INSERT INTO employees (id, name, manager_id) VALUES (2, 'CTO', 1);
INSERT INTO employees (id, name, manager_id) VALUES (3, 'Developer', 2);

-- Find employee's manager
SELECT e.name, m.name AS manager
FROM employees e
LEFT JOIN employees m ON e.manager_id = m.id;

-- Category tree
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    parent_id INTEGER REFERENCES categories(id) ON DELETE CASCADE
);
```

---

## CHECK Constraint

Validates column values against a condition.

```sql
-- Simple check
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200),
    price NUMERIC(10,2) CHECK (price > 0),
    stock INTEGER CHECK (stock >= 0),
    discount NUMERIC(3,2) CHECK (discount >= 0 AND discount <= 1)
);

-- Named check constraint
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    age INTEGER,
    CONSTRAINT chk_age CHECK (age >= 0 AND age <= 150)
);

-- Multi-column check
CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    start_date DATE,
    end_date DATE,
    CONSTRAINT chk_dates CHECK (end_date >= start_date)
);

-- Check with IN list (simulates ENUM)
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    status VARCHAR(20) CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled'))
);

-- Check with pattern (basic validation)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    phone VARCHAR(20) CHECK (phone ~ '^\+?[0-9]{10,15}$')
);

-- Check with function
CREATE TABLE files (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255),
    size_bytes BIGINT CHECK (size_bytes BETWEEN 1 AND 1073741824)  -- Max 1GB
);

-- Add check to existing table
ALTER TABLE products ADD CONSTRAINT chk_price CHECK (price > 0);

-- Remove check constraint
ALTER TABLE products DROP CONSTRAINT chk_price;

-- Disable validation for existing rows (add constraint, check only new rows)
ALTER TABLE products ADD CONSTRAINT chk_stock CHECK (stock >= 0) NOT VALID;
-- Later, validate existing rows
ALTER TABLE products VALIDATE CONSTRAINT chk_stock;
```

---

## DEFAULT Constraint

Provides default values for columns.

```sql
-- Literal defaults
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    role VARCHAR(20) DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    login_count INTEGER DEFAULT 0,
    bio TEXT DEFAULT ''
);

-- Expression defaults
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(50) DEFAULT 'ORD-' || to_char(NOW(), 'YYYYMMDD') || '-' || nextval('order_seq'),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    year INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)
);

-- Function defaults
CREATE TABLE users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Change default
ALTER TABLE users ALTER COLUMN role SET DEFAULT 'guest';

-- Remove default
ALTER TABLE users ALTER COLUMN role DROP DEFAULT;

-- DEFAULT vs NOT NULL
-- Column can be NOT NULL with DEFAULT (required but has fallback)
CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,            -- Must be provided
    status VARCHAR(20) NOT NULL DEFAULT 'draft'  -- Has default if not provided
);

INSERT INTO posts (title) VALUES ('Test');  -- ✓ status = 'draft'
INSERT INTO posts (status) VALUES ('published');  -- ✗ title is required
```

---

## EXCLUSION Constraint

Prevents overlapping values (useful for ranges, scheduling).

```sql
-- Requires btree_gist extension for non-geometric types
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Prevent overlapping room bookings
CREATE TABLE reservations (
    id SERIAL PRIMARY KEY,
    room_id INTEGER,
    during TSTZRANGE,
    EXCLUDE USING GIST (room_id WITH =, during WITH &&)
);

-- Insert tests
INSERT INTO reservations (room_id, during) 
VALUES (1, '[2024-06-15 10:00, 2024-06-15 12:00)');  -- ✓

INSERT INTO reservations (room_id, during) 
VALUES (1, '[2024-06-15 11:00, 2024-06-15 13:00)');  -- ✗ Overlaps!

INSERT INTO reservations (room_id, during) 
VALUES (2, '[2024-06-15 11:00, 2024-06-15 13:00)');  -- ✓ Different room

-- Prevent overlapping employee shifts
CREATE TABLE shifts (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER,
    shift_period TSTZRANGE,
    EXCLUDE USING GIST (employee_id WITH =, shift_period WITH &&)
);

-- Prevent overlapping IP ranges
CREATE TABLE ip_allocations (
    id SERIAL PRIMARY KEY,
    network_id INTEGER,
    ip_range INT8RANGE,  -- Use int8range for IP as integer
    EXCLUDE USING GIST (network_id WITH =, ip_range WITH &&)
);
```

---

## Generated Columns

Columns whose values are computed from other columns.

```sql
-- STORED generated column (computed and stored)
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    quantity INTEGER,
    unit_price NUMERIC(10,2),
    subtotal NUMERIC(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED
);

INSERT INTO orders (quantity, unit_price) VALUES (5, 29.99);
SELECT * FROM orders;  -- subtotal = 149.95

-- Cannot update generated column directly
UPDATE orders SET subtotal = 200;  -- ✗ ERROR

-- More examples
CREATE TABLE people (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    full_name VARCHAR(100) GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
    email VARCHAR(255),
    email_domain VARCHAR(100) GENERATED ALWAYS AS (
        SUBSTRING(email FROM POSITION('@' IN email) + 1)
    ) STORED
);

-- Generated with CASE
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    price NUMERIC(10,2),
    discount_pct NUMERIC(3,2) DEFAULT 0,
    final_price NUMERIC(10,2) GENERATED ALWAYS AS (
        price * (1 - discount_pct)
    ) STORED,
    price_category VARCHAR(20) GENERATED ALWAYS AS (
        CASE 
            WHEN price < 50 THEN 'budget'
            WHEN price < 200 THEN 'mid'
            ELSE 'premium'
        END
    ) STORED
);

-- Note: PostgreSQL doesn't support VIRTUAL generated columns yet
-- Only STORED (computed and physically saved)
```

---

## Constraint Best Practices

### 1. Name Your Constraints

```sql
-- Good: Named constraints
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255),
    CONSTRAINT uk_users_email UNIQUE (email),
    CONSTRAINT chk_email_format CHECK (email LIKE '%@%')
);

-- Bad: Unnamed constraints (PostgreSQL generates names like 'users_email_key')
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE CHECK (email LIKE '%@%')
);

-- Naming convention suggestions:
-- pk_tablename              - Primary key
-- uk_tablename_column       - Unique
-- fk_tablename_reference    - Foreign key
-- chk_tablename_condition   - Check
-- df_tablename_column       - Default
```

### 2. Validate Data Before Adding Constraints

```sql
-- Check for violations before adding constraint
SELECT * FROM users WHERE email !~ '^[A-Za-z0-9._%+-]+@';

-- Add NOT VALID first (doesn't check existing data)
ALTER TABLE users ADD CONSTRAINT chk_email 
    CHECK (email ~ '^[A-Za-z0-9._%+-]+@') NOT VALID;

-- Fix data
UPDATE users SET email = email || '@unknown.com' WHERE email !~ '@';

-- Then validate
ALTER TABLE users VALIDATE CONSTRAINT chk_email;
```

### 3. Consider Performance

```sql
-- Foreign keys create implicit indexes on referenced column
-- But NOT on the referencing column!
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id)
);

-- Add index on foreign key for better join performance
CREATE INDEX idx_orders_customer_id ON orders(customer_id);

-- Check constraints are evaluated on every INSERT/UPDATE
-- Keep them simple for better performance
```

### 4. Use Appropriate Constraint Type

```sql
-- For fixed values, use CHECK or ENUM
-- CHECK is easier to modify
status VARCHAR(20) CHECK (status IN ('active', 'inactive'))

-- For related data, use FOREIGN KEY
category_id INTEGER REFERENCES categories(id)

-- For uniqueness, use UNIQUE or PRIMARY KEY
email VARCHAR(255) UNIQUE

-- For non-overlapping ranges, use EXCLUSION
booking_period TSTZRANGE, EXCLUDE USING GIST (room_id WITH =, booking_period WITH &&)
```

---

## Viewing Constraints

```sql
-- List all constraints on a table
SELECT 
    conname AS constraint_name,
    contype AS type,
    pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'users'::regclass;

-- Constraint types:
-- c = check
-- f = foreign key
-- p = primary key
-- u = unique
-- x = exclusion

-- Using information_schema
SELECT 
    constraint_name,
    constraint_type,
    table_name
FROM information_schema.table_constraints
WHERE table_name = 'users';

-- Check constraints details
SELECT 
    constraint_name,
    check_clause
FROM information_schema.check_constraints
WHERE constraint_schema = 'public';

-- Foreign key details
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table,
    ccu.column_name AS foreign_column
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu 
    ON tc.constraint_name = ccu.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY';
```

---

## Practice Exercises

### Exercise 1: Design Constraints
Design a `employees` table with:
- Auto-incrementing ID
- Required email (unique, valid format)
- Salary (must be positive)
- Department (must be one of: 'Engineering', 'Sales', 'HR', 'Marketing')
- Hire date (cannot be in the future)
- Manager ID (self-referential foreign key)

### Exercise 2: Referential Integrity
Create tables for a blog system:
- `authors` (id, name, email)
- `posts` (id, author_id, title, published_at)
- `comments` (id, post_id, author_id, content)

Add appropriate foreign keys with cascading deletes.

### Exercise 3: Booking System
Create a `room_bookings` table that prevents:
- Overlapping bookings for the same room
- Bookings where end time is before start time
- Bookings longer than 8 hours

---

## Summary

In this chapter, you learned:
- ✅ NOT NULL - Require values
- ✅ UNIQUE - Prevent duplicates
- ✅ PRIMARY KEY - Unique row identifier
- ✅ FOREIGN KEY - Referential integrity with actions
- ✅ CHECK - Validate values with conditions
- ✅ DEFAULT - Automatic default values
- ✅ EXCLUSION - Prevent overlapping data
- ✅ Generated Columns - Computed values
- ✅ Best practices for constraint design

---

**Next Chapter:** [Joins →](./06-Joins.md)




