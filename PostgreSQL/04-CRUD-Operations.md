# Chapter 4: CRUD Operations 📝

CRUD stands for **Create, Read, Update, Delete** - the four fundamental operations for managing data.

---

## Sample Database Setup

```sql
-- Create our practice tables
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    city VARCHAR(50),
    country VARCHAR(50) DEFAULT 'USA',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    price NUMERIC(10,2) NOT NULL CHECK (price > 0),
    stock INTEGER DEFAULT 0,
    category VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id),
    status VARCHAR(20) DEFAULT 'pending' 
        CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
    total NUMERIC(12,2),
    shipping_address TEXT,
    ordered_at TIMESTAMPTZ DEFAULT NOW(),
    shipped_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ
);

CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(10,2) NOT NULL,
    subtotal NUMERIC(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED
);
```

---

## INSERT - Create Data

### Basic INSERT

```sql
-- Insert single row
INSERT INTO customers (name, email, phone, city)
VALUES ('John Doe', 'john@example.com', '555-1234', 'New York');

-- Insert with all columns (not recommended - fragile)
INSERT INTO customers 
VALUES (DEFAULT, 'Jane Smith', 'jane@example.com', '555-5678', 'Los Angeles', 'USA', NOW());

-- Insert multiple rows
INSERT INTO products (name, price, stock, category) VALUES
    ('Laptop Pro', 1299.99, 50, 'Electronics'),
    ('Wireless Mouse', 29.99, 200, 'Electronics'),
    ('Office Chair', 249.99, 30, 'Furniture'),
    ('Desk Lamp', 45.99, 100, 'Furniture'),
    ('USB Cable', 9.99, 500, 'Electronics');
```

### INSERT with RETURNING

```sql
-- Get the inserted row back
INSERT INTO customers (name, email)
VALUES ('Alice Brown', 'alice@example.com')
RETURNING *;

-- Get specific columns
INSERT INTO customers (name, email)
VALUES ('Bob Wilson', 'bob@example.com')
RETURNING id, email;

-- Use returned ID immediately
WITH new_customer AS (
    INSERT INTO customers (name, email)
    VALUES ('Carol Davis', 'carol@example.com')
    RETURNING id
)
INSERT INTO orders (customer_id, status)
SELECT id, 'pending' FROM new_customer
RETURNING *;
```

### INSERT from SELECT

```sql
-- Copy data from another table
INSERT INTO customers_backup
SELECT * FROM customers WHERE country = 'USA';

-- Insert transformed data
INSERT INTO premium_customers (name, email, tier)
SELECT name, email, 'gold'
FROM customers
WHERE created_at < NOW() - INTERVAL '1 year';

-- Insert with computed values
INSERT INTO order_summary (customer_id, order_count, total_spent)
SELECT 
    customer_id,
    COUNT(*),
    SUM(total)
FROM orders
GROUP BY customer_id;
```

### INSERT with ON CONFLICT (UPSERT)

```sql
-- Insert or update on conflict
INSERT INTO customers (email, name, city)
VALUES ('john@example.com', 'John Updated', 'Boston')
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    city = EXCLUDED.city;

-- Insert or do nothing
INSERT INTO customers (email, name)
VALUES ('john@example.com', 'John Doe')
ON CONFLICT (email) DO NOTHING;

-- Upsert with condition
INSERT INTO products (id, name, price, stock)
VALUES (1, 'Laptop Pro', 1199.99, 60)
ON CONFLICT (id) DO UPDATE SET
    price = EXCLUDED.price,
    stock = EXCLUDED.stock
WHERE products.price > EXCLUDED.price;  -- Only update if new price is lower

-- Upsert multiple rows
INSERT INTO products (name, price, stock, category)
VALUES 
    ('Laptop Pro', 1299.99, 50, 'Electronics'),
    ('New Product', 99.99, 100, 'Electronics')
ON CONFLICT (name) DO UPDATE SET
    price = EXCLUDED.price,
    stock = products.stock + EXCLUDED.stock  -- Add to existing stock
RETURNING *;

-- Upsert with composite key
INSERT INTO order_items (order_id, product_id, quantity, unit_price)
VALUES (1, 5, 2, 9.99)
ON CONFLICT (order_id, product_id) DO UPDATE SET
    quantity = order_items.quantity + EXCLUDED.quantity;
```

### INSERT with DEFAULT VALUES

```sql
-- Insert with all defaults
INSERT INTO products DEFAULT VALUES;

-- Insert with specific defaults
INSERT INTO products (name, price)
VALUES ('Test Product', 0.01);  -- stock defaults to 0, is_active to true
```

---

## SELECT - Read Data

### Basic SELECT

```sql
-- Select all columns
SELECT * FROM customers;

-- Select specific columns
SELECT name, email, city FROM customers;

-- Select with alias
SELECT 
    name AS customer_name,
    email AS contact_email,
    CONCAT(city, ', ', country) AS location
FROM customers;

-- Select distinct values
SELECT DISTINCT category FROM products;
SELECT DISTINCT ON (category) * FROM products ORDER BY category, price DESC;
```

### WHERE Clause - Filtering

```sql
-- Comparison operators
SELECT * FROM products WHERE price > 100;
SELECT * FROM products WHERE price >= 100 AND price <= 500;
SELECT * FROM products WHERE stock = 0;
SELECT * FROM products WHERE category != 'Electronics';
SELECT * FROM products WHERE category <> 'Electronics';  -- Same as !=

-- BETWEEN
SELECT * FROM products WHERE price BETWEEN 50 AND 200;
SELECT * FROM orders WHERE ordered_at BETWEEN '2024-01-01' AND '2024-12-31';

-- IN / NOT IN
SELECT * FROM products WHERE category IN ('Electronics', 'Furniture');
SELECT * FROM customers WHERE city NOT IN ('New York', 'Los Angeles');

-- LIKE / ILIKE (pattern matching)
SELECT * FROM customers WHERE name LIKE 'John%';      -- Starts with John
SELECT * FROM customers WHERE email LIKE '%@gmail.com';  -- Gmail users
SELECT * FROM products WHERE name LIKE '%Pro%';       -- Contains Pro
SELECT * FROM products WHERE name LIKE '____';        -- Exactly 4 characters
SELECT * FROM customers WHERE name ILIKE 'john%';    -- Case-insensitive

-- Regular expressions
SELECT * FROM customers WHERE email ~ '^[a-z]+@';    -- Regex match
SELECT * FROM customers WHERE email ~* '^[a-z]+@';   -- Case-insensitive regex
SELECT * FROM customers WHERE email !~ '@gmail';     -- Doesn't match

-- NULL checks
SELECT * FROM orders WHERE shipped_at IS NULL;
SELECT * FROM orders WHERE shipped_at IS NOT NULL;
SELECT * FROM customers WHERE phone IS DISTINCT FROM '555-1234';

-- Boolean
SELECT * FROM products WHERE is_active;
SELECT * FROM products WHERE NOT is_active;
SELECT * FROM products WHERE is_active = true;
```

### Logical Operators

```sql
-- AND
SELECT * FROM products 
WHERE category = 'Electronics' AND price < 100;

-- OR
SELECT * FROM products 
WHERE category = 'Electronics' OR category = 'Furniture';

-- Combined (use parentheses for clarity)
SELECT * FROM products
WHERE (category = 'Electronics' OR category = 'Furniture')
  AND price > 50
  AND is_active = true;

-- NOT
SELECT * FROM customers WHERE NOT (city = 'New York');
SELECT * FROM products WHERE category NOT IN ('Electronics', 'Furniture');
```

### ORDER BY - Sorting

```sql
-- Ascending (default)
SELECT * FROM products ORDER BY price;
SELECT * FROM products ORDER BY price ASC;

-- Descending
SELECT * FROM products ORDER BY price DESC;

-- Multiple columns
SELECT * FROM products ORDER BY category ASC, price DESC;

-- Order by expression
SELECT *, (price * stock) AS inventory_value 
FROM products 
ORDER BY inventory_value DESC;

-- Order by column position
SELECT name, price, stock FROM products ORDER BY 2 DESC;  -- Order by price

-- NULLS FIRST / LAST
SELECT * FROM orders ORDER BY shipped_at NULLS FIRST;
SELECT * FROM orders ORDER BY shipped_at DESC NULLS LAST;
```

### LIMIT and OFFSET - Pagination

```sql
-- Limit results
SELECT * FROM products ORDER BY price DESC LIMIT 10;

-- Offset for pagination
SELECT * FROM products ORDER BY id LIMIT 10 OFFSET 0;   -- Page 1
SELECT * FROM products ORDER BY id LIMIT 10 OFFSET 10;  -- Page 2
SELECT * FROM products ORDER BY id LIMIT 10 OFFSET 20;  -- Page 3

-- FETCH (SQL standard alternative)
SELECT * FROM products ORDER BY price DESC FETCH FIRST 10 ROWS ONLY;
SELECT * FROM products ORDER BY price DESC OFFSET 10 ROWS FETCH NEXT 10 ROWS ONLY;

-- ⚠️ Pagination performance tip
-- For large offsets, use keyset pagination instead:
SELECT * FROM products 
WHERE id > 1000  -- Last seen ID
ORDER BY id 
LIMIT 10;
```

### Expressions and Functions

```sql
-- Arithmetic
SELECT 
    name,
    price,
    stock,
    price * stock AS inventory_value,
    price * 0.9 AS discounted_price
FROM products;

-- String functions
SELECT 
    UPPER(name) AS upper_name,
    LOWER(email) AS lower_email,
    LENGTH(name) AS name_length,
    SUBSTRING(email FROM 1 FOR POSITION('@' IN email) - 1) AS username
FROM customers;

-- Date functions
SELECT 
    ordered_at,
    DATE(ordered_at) AS order_date,
    EXTRACT(YEAR FROM ordered_at) AS year,
    EXTRACT(MONTH FROM ordered_at) AS month,
    TO_CHAR(ordered_at, 'YYYY-MM-DD HH24:MI') AS formatted
FROM orders;

-- Conditional expressions
SELECT 
    name,
    price,
    CASE 
        WHEN price < 50 THEN 'Budget'
        WHEN price < 200 THEN 'Mid-range'
        ELSE 'Premium'
    END AS price_tier
FROM products;

-- COALESCE (first non-null)
SELECT 
    name,
    COALESCE(phone, email, 'No contact') AS contact
FROM customers;

-- NULLIF
SELECT 
    name,
    NULLIF(stock, 0) AS stock_or_null  -- Returns NULL if stock = 0
FROM products;

-- GREATEST / LEAST
SELECT GREATEST(10, 20, 5);   -- 20
SELECT LEAST(10, 20, 5);      -- 5
```

---

## UPDATE - Modify Data

### Basic UPDATE

```sql
-- Update single column
UPDATE products SET price = 1199.99 WHERE id = 1;

-- Update multiple columns
UPDATE products 
SET price = 1199.99, stock = 75, is_active = true 
WHERE id = 1;

-- Update all rows (dangerous!)
UPDATE products SET price = price * 1.1;  -- 10% price increase

-- Update with expression
UPDATE products SET stock = stock - 5 WHERE id = 1;
UPDATE products SET price = price * 0.9 WHERE category = 'Electronics';
```

### UPDATE with RETURNING

```sql
-- Get updated rows
UPDATE products 
SET price = price * 0.9 
WHERE category = 'Electronics'
RETURNING id, name, price;

-- Use in CTE
WITH updated AS (
    UPDATE products 
    SET price = price * 0.9 
    WHERE category = 'Electronics'
    RETURNING id, name, price
)
SELECT * FROM updated WHERE price < 100;
```

### UPDATE with FROM (Join Update)

```sql
-- Update based on another table
UPDATE orders
SET total = (
    SELECT SUM(subtotal) FROM order_items WHERE order_items.order_id = orders.id
);

-- Using FROM clause
UPDATE orders o
SET status = 'premium'
FROM customers c
WHERE o.customer_id = c.id AND c.tier = 'gold';

-- Complex update with join
UPDATE products p
SET stock = p.stock - oi.quantity
FROM order_items oi
JOIN orders o ON oi.order_id = o.id
WHERE p.id = oi.product_id 
  AND o.status = 'shipped';
```

### UPDATE with Subquery

```sql
-- Update using subquery result
UPDATE customers
SET city = (SELECT city FROM customers WHERE id = 1)
WHERE id = 2;

-- Update matching subquery
UPDATE products
SET is_active = false
WHERE id IN (
    SELECT product_id 
    FROM order_items 
    GROUP BY product_id 
    HAVING SUM(quantity) < 10
);

-- Update with EXISTS
UPDATE customers c
SET tier = 'gold'
WHERE EXISTS (
    SELECT 1 FROM orders o 
    WHERE o.customer_id = c.id 
    GROUP BY o.customer_id 
    HAVING SUM(o.total) > 10000
);
```

### Conditional UPDATE

```sql
-- Update with CASE
UPDATE products
SET price = CASE
    WHEN category = 'Electronics' THEN price * 0.9
    WHEN category = 'Furniture' THEN price * 0.85
    ELSE price * 0.95
END
WHERE is_active = true;

-- Update with COALESCE (preserve existing if NULL)
UPDATE customers
SET phone = COALESCE(phone, 'No phone')
WHERE phone IS NULL;
```

---

## DELETE - Remove Data

### Basic DELETE

```sql
-- Delete specific rows
DELETE FROM products WHERE id = 1;

-- Delete with multiple conditions
DELETE FROM products WHERE category = 'Electronics' AND stock = 0;

-- Delete all rows (but keep table)
DELETE FROM products;

-- ⚠️ Always use WHERE clause!
-- This deletes everything:
DELETE FROM products;  -- Dangerous!
```

### DELETE with RETURNING

```sql
-- Get deleted rows
DELETE FROM products 
WHERE stock = 0
RETURNING *;

-- Archive before delete
WITH deleted AS (
    DELETE FROM products 
    WHERE stock = 0
    RETURNING *
)
INSERT INTO products_archive SELECT * FROM deleted;
```

### DELETE with Subquery

```sql
-- Delete based on another table
DELETE FROM order_items
WHERE order_id IN (
    SELECT id FROM orders WHERE status = 'cancelled'
);

-- Delete with EXISTS
DELETE FROM customers c
WHERE NOT EXISTS (
    SELECT 1 FROM orders o WHERE o.customer_id = c.id
);

-- Delete using CTE
WITH inactive_products AS (
    SELECT id FROM products 
    WHERE is_active = false 
      AND created_at < NOW() - INTERVAL '1 year'
)
DELETE FROM products WHERE id IN (SELECT id FROM inactive_products);
```

### DELETE with USING

```sql
-- Delete with join condition
DELETE FROM order_items oi
USING orders o
WHERE oi.order_id = o.id AND o.status = 'cancelled';

-- More complex delete
DELETE FROM products p
USING (
    SELECT product_id, SUM(quantity) as total_sold
    FROM order_items
    GROUP BY product_id
    HAVING SUM(quantity) < 10
) low_sellers
WHERE p.id = low_sellers.product_id;
```

---

## TRUNCATE - Fast Delete All

```sql
-- Delete all rows (much faster than DELETE for large tables)
TRUNCATE TABLE products;

-- Truncate and reset serial/identity
TRUNCATE TABLE products RESTART IDENTITY;

-- Truncate multiple tables
TRUNCATE TABLE orders, order_items;

-- Truncate with cascade (truncate referencing tables)
TRUNCATE TABLE customers CASCADE;

-- Key differences from DELETE:
-- 1. TRUNCATE is faster (doesn't scan rows)
-- 2. TRUNCATE resets sequences with RESTART IDENTITY
-- 3. TRUNCATE doesn't fire row-level triggers
-- 4. TRUNCATE cannot have WHERE clause
-- 5. TRUNCATE acquires stronger lock
```

---

## COPY Command - Bulk Operations

### Export Data

```sql
-- Export to CSV
COPY products TO '/tmp/products.csv' WITH CSV HEADER;

-- Export query result
COPY (SELECT * FROM products WHERE is_active = true) 
TO '/tmp/active_products.csv' WITH CSV HEADER;

-- Export with options
COPY products TO '/tmp/products.csv' 
WITH (
    FORMAT CSV,
    HEADER true,
    DELIMITER ',',
    QUOTE '"',
    ESCAPE '\',
    NULL ''
);

-- From psql (client-side)
\copy products TO 'products.csv' WITH CSV HEADER
```

### Import Data

```sql
-- Import from CSV
COPY products FROM '/tmp/products.csv' WITH CSV HEADER;

-- Import with column mapping
COPY products (name, price, stock, category) 
FROM '/tmp/products.csv' WITH CSV HEADER;

-- Import with options
COPY products FROM '/tmp/products.csv'
WITH (
    FORMAT CSV,
    HEADER true,
    DELIMITER ',',
    NULL 'NULL'
);

-- From psql (client-side)
\copy products FROM 'products.csv' WITH CSV HEADER
```

---

## Transaction Patterns

```sql
-- Basic transaction
BEGIN;
    INSERT INTO orders (customer_id, total) VALUES (1, 100);
    INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (1, 1, 2, 50);
COMMIT;

-- Rollback on error
BEGIN;
    UPDATE products SET stock = stock - 5 WHERE id = 1;
    -- Something goes wrong
ROLLBACK;

-- With savepoint
BEGIN;
    INSERT INTO orders (customer_id, total) VALUES (1, 100);
    SAVEPOINT sp1;
    INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (999, 1, 2, 50);
    -- Error! order_id 999 doesn't exist
    ROLLBACK TO sp1;
    -- Continue with other operations
COMMIT;
```

---

## Common Patterns

### Soft Delete

```sql
-- Add soft delete column
ALTER TABLE products ADD COLUMN deleted_at TIMESTAMPTZ;

-- Soft delete instead of hard delete
UPDATE products SET deleted_at = NOW() WHERE id = 1;

-- Query active records only
SELECT * FROM products WHERE deleted_at IS NULL;

-- Create view for convenience
CREATE VIEW active_products AS
SELECT * FROM products WHERE deleted_at IS NULL;

-- Restore soft-deleted record
UPDATE products SET deleted_at = NULL WHERE id = 1;
```

### Audit Trail

```sql
-- Create audit table
CREATE TABLE products_audit (
    id SERIAL PRIMARY KEY,
    product_id INTEGER,
    action VARCHAR(10),
    old_data JSONB,
    new_data JSONB,
    changed_by TEXT DEFAULT current_user,
    changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Manual audit on update
WITH old AS (
    SELECT * FROM products WHERE id = 1
), updated AS (
    UPDATE products SET price = 999 WHERE id = 1
    RETURNING *
)
INSERT INTO products_audit (product_id, action, old_data, new_data)
SELECT 1, 'UPDATE', to_jsonb(old.*), to_jsonb(updated.*)
FROM old, updated;

-- Better: Use triggers (covered in Chapter 13)
```

### Increment/Decrement

```sql
-- Safe increment
UPDATE products SET stock = stock + 10 WHERE id = 1;

-- Safe decrement with check
UPDATE products 
SET stock = stock - 5 
WHERE id = 1 AND stock >= 5
RETURNING stock;

-- Check if update succeeded
UPDATE products SET stock = stock - 5 WHERE id = 1 AND stock >= 5;
-- Check: SELECT ROW_COUNT; or use RETURNING
```

---

## Practice Exercises

### Exercise 1: Data Entry
1. Insert 5 customers with varying data
2. Insert 10 products in different categories
3. Create 3 orders with multiple items each

### Exercise 2: Complex Queries
1. Find top 5 products by inventory value (price × stock)
2. List customers with their total order amounts
3. Find products never ordered

### Exercise 3: Data Modification
1. Apply 20% discount to products with stock > 100
2. Update order status based on shipped_at date
3. Delete orders older than 1 year and their items

### Exercise 4: Bulk Operations
1. Export all Electronics products to CSV
2. Import a CSV file of new products
3. Create an UPSERT to update product prices from file

---

## Summary

In this chapter, you learned:
- ✅ INSERT with single/multiple rows, RETURNING, and UPSERT
- ✅ SELECT with filtering, sorting, and pagination
- ✅ UPDATE with joins, subqueries, and conditions
- ✅ DELETE with safety patterns
- ✅ TRUNCATE for fast bulk deletion
- ✅ COPY for import/export
- ✅ Common patterns: soft delete, audit, transactions

---

**Next Chapter:** [Constraints →](./05-Constraints.md)



