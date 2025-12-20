# Chapter 11: Views & Materialized Views 👁️

Views are virtual tables based on SQL queries. They simplify complex queries, provide security, and create abstraction layers.

---

## Regular Views

### Creating Views

```sql
-- Basic view
CREATE VIEW active_users AS
SELECT id, username, email, created_at
FROM users
WHERE is_active = true;

-- Query view like a table
SELECT * FROM active_users;
SELECT * FROM active_users WHERE created_at > '2024-01-01';

-- View with joins
CREATE VIEW order_details AS
SELECT 
    o.id AS order_id,
    o.order_date,
    c.name AS customer_name,
    c.email AS customer_email,
    p.name AS product_name,
    oi.quantity,
    oi.unit_price,
    oi.quantity * oi.unit_price AS line_total
FROM orders o
JOIN customers c ON o.customer_id = c.id
JOIN order_items oi ON o.id = oi.order_id
JOIN products p ON oi.product_id = p.id;

-- View with aggregation
CREATE VIEW department_stats AS
SELECT 
    d.id,
    d.name,
    COUNT(e.id) AS employee_count,
    COALESCE(AVG(e.salary), 0)::NUMERIC(10,2) AS avg_salary,
    COALESCE(SUM(e.salary), 0) AS total_salary
FROM departments d
LEFT JOIN employees e ON d.id = e.department_id
GROUP BY d.id, d.name;

-- View with expressions
CREATE VIEW user_summary AS
SELECT 
    id,
    username,
    email,
    CASE 
        WHEN last_login_at > NOW() - INTERVAL '7 days' THEN 'Active'
        WHEN last_login_at > NOW() - INTERVAL '30 days' THEN 'Inactive'
        ELSE 'Dormant'
    END AS activity_status,
    AGE(created_at) AS account_age
FROM users;
```

### View Options

```sql
-- CREATE OR REPLACE (update existing view)
CREATE OR REPLACE VIEW active_users AS
SELECT id, username, email, created_at, role
FROM users
WHERE is_active = true;

-- Temporary view (session-only)
CREATE TEMPORARY VIEW my_temp_view AS
SELECT * FROM users WHERE department_id = 1;

-- Recursive view
CREATE RECURSIVE VIEW employee_hierarchy (id, name, manager_id, level) AS
    SELECT id, name, manager_id, 0 AS level
    FROM employees
    WHERE manager_id IS NULL
    UNION ALL
    SELECT e.id, e.name, e.manager_id, h.level + 1
    FROM employees e
    JOIN employee_hierarchy h ON e.manager_id = h.id;
```

### View Management

```sql
-- List views
\dv

-- View definition
\d+ active_users

-- Get view SQL
SELECT pg_get_viewdef('active_users', true);

-- Rename view
ALTER VIEW active_users RENAME TO enabled_users;

-- Change view owner
ALTER VIEW active_users OWNER TO admin;

-- Drop view
DROP VIEW active_users;

-- Drop if exists
DROP VIEW IF EXISTS active_users;

-- Drop with dependencies
DROP VIEW active_users CASCADE;
```

---

## Updatable Views

Views that allow INSERT, UPDATE, DELETE operations.

### Simple Updatable Views

```sql
-- Automatically updatable view (simple conditions met)
CREATE VIEW engineering_employees AS
SELECT id, name, email, salary, department_id
FROM employees
WHERE department_id = 1;

-- This works because:
-- 1. One table in FROM
-- 2. No aggregation, DISTINCT, GROUP BY
-- 3. No window functions
-- 4. No LIMIT/OFFSET
-- 5. No UNION/INTERSECT/EXCEPT

-- Insert through view
INSERT INTO engineering_employees (name, email, salary, department_id)
VALUES ('New Engineer', 'new@company.com', 80000, 1);

-- Update through view
UPDATE engineering_employees SET salary = 85000 WHERE id = 10;

-- Delete through view
DELETE FROM engineering_employees WHERE id = 10;

-- ⚠️ Warning: Can insert rows not visible in view
INSERT INTO engineering_employees (name, email, salary, department_id)
VALUES ('Sales Person', 'sales@company.com', 60000, 2);  -- Works but disappears from view!
```

### WITH CHECK OPTION

```sql
-- Prevent inserting/updating rows that wouldn't be visible
CREATE VIEW engineering_employees AS
SELECT id, name, email, salary, department_id
FROM employees
WHERE department_id = 1
WITH CHECK OPTION;

-- Now this fails:
INSERT INTO engineering_employees (name, email, salary, department_id)
VALUES ('Sales Person', 'sales@company.com', 60000, 2);
-- ERROR: new row violates check option for view

-- LOCAL vs CASCADED
CREATE VIEW senior_engineers AS
SELECT * FROM engineering_employees
WHERE salary > 80000
WITH LOCAL CHECK OPTION;    -- Only checks this view's condition

CREATE VIEW senior_engineers AS
SELECT * FROM engineering_employees
WHERE salary > 80000
WITH CASCADED CHECK OPTION; -- Checks all underlying view conditions
```

### Updatable View with INSTEAD OF Trigger

```sql
-- For complex views that aren't automatically updatable
CREATE VIEW order_summary AS
SELECT 
    o.id AS order_id,
    c.name AS customer_name,
    o.total
FROM orders o
JOIN customers c ON o.customer_id = c.id;

-- Create INSTEAD OF trigger for updates
CREATE OR REPLACE FUNCTION update_order_summary()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE orders SET total = NEW.total WHERE id = NEW.order_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_update_order_summary
INSTEAD OF UPDATE ON order_summary
FOR EACH ROW
EXECUTE FUNCTION update_order_summary();

-- Now this works:
UPDATE order_summary SET total = 150.00 WHERE order_id = 1;
```

---

## Materialized Views

Pre-computed results stored on disk. Fast reads, manual refresh needed.

### Creating Materialized Views

```sql
-- Basic materialized view
CREATE MATERIALIZED VIEW sales_summary AS
SELECT 
    DATE_TRUNC('month', sale_date) AS month,
    product_category,
    COUNT(*) AS transaction_count,
    SUM(amount) AS total_revenue,
    AVG(amount)::NUMERIC(10,2) AS avg_transaction
FROM sales
GROUP BY DATE_TRUNC('month', sale_date), product_category
ORDER BY month, product_category;

-- Query like regular table (uses stored data)
SELECT * FROM sales_summary WHERE month = '2024-01-01';

-- With no data initially
CREATE MATERIALIZED VIEW report_cache AS
SELECT * FROM expensive_query
WITH NO DATA;  -- Empty until refreshed

-- Check if data exists
SELECT relispopulated FROM pg_class WHERE relname = 'report_cache';
```

### Refreshing Materialized Views

```sql
-- Full refresh (replaces all data)
REFRESH MATERIALIZED VIEW sales_summary;

-- Concurrent refresh (doesn't lock view for reads)
-- Requires UNIQUE index
CREATE UNIQUE INDEX idx_sales_summary ON sales_summary(month, product_category);
REFRESH MATERIALIZED VIEW CONCURRENTLY sales_summary;

-- Check last refresh time (requires tracking)
CREATE TABLE mv_refresh_log (
    view_name TEXT PRIMARY KEY,
    last_refresh TIMESTAMPTZ
);

-- Manual refresh with logging
CREATE OR REPLACE FUNCTION refresh_mv(view_name TEXT)
RETURNS void AS $$
BEGIN
    EXECUTE 'REFRESH MATERIALIZED VIEW CONCURRENTLY ' || quote_ident(view_name);
    INSERT INTO mv_refresh_log VALUES (view_name, NOW())
    ON CONFLICT (view_name) DO UPDATE SET last_refresh = NOW();
END;
$$ LANGUAGE plpgsql;

SELECT refresh_mv('sales_summary');
```

### Automatic Refresh Strategies

```sql
-- 1. Scheduled with pg_cron
-- Install pg_cron extension first
CREATE EXTENSION pg_cron;

-- Refresh every hour
SELECT cron.schedule('refresh-sales', '0 * * * *', 
    'REFRESH MATERIALIZED VIEW CONCURRENTLY sales_summary');

-- 2. Trigger-based refresh (careful with performance!)
CREATE OR REPLACE FUNCTION refresh_on_change()
RETURNS TRIGGER AS $$
BEGIN
    REFRESH MATERIALIZED VIEW sales_summary;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Only for low-volume changes!
CREATE TRIGGER tr_refresh_summary
AFTER INSERT OR UPDATE OR DELETE ON sales
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_on_change();

-- 3. Application-level refresh
-- Call refresh from your application after batch operations
```

### Materialized View Indexes

```sql
-- Create indexes on materialized view
CREATE INDEX idx_mv_month ON sales_summary(month);
CREATE INDEX idx_mv_category ON sales_summary(product_category);

-- Check indexes
\d+ sales_summary
```

### Materialized View Management

```sql
-- List materialized views
\dm

-- View definition
SELECT pg_get_viewdef('sales_summary', true);

-- Rename
ALTER MATERIALIZED VIEW sales_summary RENAME TO monthly_sales;

-- Change owner
ALTER MATERIALIZED VIEW sales_summary OWNER TO analyst;

-- Drop
DROP MATERIALIZED VIEW sales_summary;

-- Drop with dependencies
DROP MATERIALIZED VIEW sales_summary CASCADE;
```

---

## Views vs Materialized Views

| Aspect | View | Materialized View |
|--------|------|-------------------|
| Storage | None (virtual) | Stores data on disk |
| Query Speed | Executes query each time | Fast (reads stored data) |
| Data Freshness | Always current | Stale until refresh |
| Indexes | Cannot create | Can create indexes |
| Write Operations | Sometimes updatable | Read-only |
| Use Case | Simple abstraction | Complex reports, caching |

### When to Use What

```sql
-- Use VIEW when:
-- 1. Data must always be current
-- 2. Underlying query is fast
-- 3. Need updatable access
-- 4. Storage space is a concern

-- Use MATERIALIZED VIEW when:
-- 1. Query is expensive (aggregations, joins)
-- 2. Data doesn't need real-time accuracy
-- 3. Read performance is critical
-- 4. Query runs frequently with same parameters
```

---

## Practical Examples

### Security View (Column-Level Security)

```sql
-- Hide sensitive columns
CREATE VIEW public_employees AS
SELECT id, name, department_id, hire_date
-- Excluded: salary, ssn, bank_account
FROM employees;

GRANT SELECT ON public_employees TO analyst;
REVOKE SELECT ON employees FROM analyst;
```

### API View (Stable Interface)

```sql
-- Create stable interface for applications
CREATE VIEW api_orders AS
SELECT 
    id,
    customer_id,
    status,
    total_amount AS total,
    created_at AS order_date
FROM orders;

-- If underlying table changes, update view:
CREATE OR REPLACE VIEW api_orders AS
SELECT 
    order_id AS id,  -- Column renamed in table
    customer_id,
    order_status AS status,  -- Column renamed
    COALESCE(subtotal + tax, 0) AS total,  -- Calculation changed
    created_timestamp AS order_date
FROM orders_v2;

-- Application code doesn't need to change!
```

### Dashboard Cache

```sql
-- Expensive dashboard query
CREATE MATERIALIZED VIEW dashboard_metrics AS
SELECT 
    -- Users
    (SELECT COUNT(*) FROM users) AS total_users,
    (SELECT COUNT(*) FROM users WHERE created_at > NOW() - INTERVAL '30 days') AS new_users,
    
    -- Orders
    (SELECT COUNT(*) FROM orders WHERE status = 'pending') AS pending_orders,
    (SELECT SUM(total) FROM orders WHERE created_at > NOW() - INTERVAL '24 hours') AS daily_revenue,
    
    -- Products
    (SELECT COUNT(*) FROM products WHERE stock < 10) AS low_stock_count,
    
    -- Metadata
    NOW() AS generated_at;

-- Single row result, very fast to query
SELECT * FROM dashboard_metrics;

-- Refresh every 5 minutes
SELECT cron.schedule('dashboard', '*/5 * * * *', 
    'REFRESH MATERIALIZED VIEW dashboard_metrics');
```

### Report Builder

```sql
-- Base fact table view
CREATE VIEW v_sales_facts AS
SELECT 
    s.id,
    s.sale_date,
    s.amount,
    p.name AS product_name,
    p.category AS product_category,
    c.name AS customer_name,
    c.region AS customer_region,
    e.name AS salesperson
FROM sales s
JOIN products p ON s.product_id = p.id
JOIN customers c ON s.customer_id = c.id
JOIN employees e ON s.salesperson_id = e.id;

-- Materialized aggregations for different time grains
CREATE MATERIALIZED VIEW mv_daily_sales AS
SELECT 
    sale_date,
    product_category,
    customer_region,
    COUNT(*) AS transactions,
    SUM(amount) AS revenue
FROM v_sales_facts
GROUP BY sale_date, product_category, customer_region;

CREATE MATERIALIZED VIEW mv_monthly_sales AS
SELECT 
    DATE_TRUNC('month', sale_date) AS month,
    product_category,
    customer_region,
    COUNT(*) AS transactions,
    SUM(amount) AS revenue
FROM v_sales_facts
GROUP BY DATE_TRUNC('month', sale_date), product_category, customer_region;

-- Drill-down queries use appropriate materialized view
```

### Incremental Materialized View Pattern

```sql
-- For append-only data, track what's processed
CREATE TABLE mv_watermark (
    mv_name TEXT PRIMARY KEY,
    last_processed_id BIGINT,
    last_refresh TIMESTAMPTZ
);

-- Main table
CREATE TABLE events (
    id BIGSERIAL PRIMARY KEY,
    event_type TEXT,
    event_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Incremental refresh function
CREATE OR REPLACE FUNCTION incremental_refresh_events()
RETURNS void AS $$
DECLARE
    last_id BIGINT;
    max_id BIGINT;
BEGIN
    -- Get watermark
    SELECT last_processed_id INTO last_id 
    FROM mv_watermark WHERE mv_name = 'event_summary';
    
    IF last_id IS NULL THEN last_id := 0; END IF;
    
    -- Get max ID
    SELECT MAX(id) INTO max_id FROM events;
    
    -- Insert new aggregations
    INSERT INTO event_summary (event_type, event_count, last_event_at)
    SELECT event_type, COUNT(*), MAX(created_at)
    FROM events
    WHERE id > last_id AND id <= max_id
    GROUP BY event_type
    ON CONFLICT (event_type) DO UPDATE SET
        event_count = event_summary.event_count + EXCLUDED.event_count,
        last_event_at = GREATEST(event_summary.last_event_at, EXCLUDED.last_event_at);
    
    -- Update watermark
    INSERT INTO mv_watermark VALUES ('event_summary', max_id, NOW())
    ON CONFLICT (mv_name) DO UPDATE SET 
        last_processed_id = max_id,
        last_refresh = NOW();
END;
$$ LANGUAGE plpgsql;
```

---

## Best Practices

### 1. Name Views Clearly

```sql
-- Good naming
CREATE VIEW v_active_users AS ...
CREATE VIEW v_order_details AS ...
CREATE MATERIALIZED VIEW mv_daily_sales AS ...
CREATE MATERIALIZED VIEW mv_customer_lifetime_value AS ...

-- Convention: v_ for views, mv_ for materialized views
```

### 2. Document View Purpose

```sql
COMMENT ON VIEW v_active_users IS 'Active users for login/display purposes. Excludes banned and deleted accounts.';

COMMENT ON MATERIALIZED VIEW mv_daily_sales IS 'Daily sales aggregates. Refreshed hourly. Use for reporting dashboards.';
```

### 3. Consider Dependencies

```sql
-- Check dependencies before dropping
SELECT 
    dependent_ns.nspname AS dependent_schema,
    dependent_view.relname AS dependent_view
FROM pg_depend 
JOIN pg_rewrite ON pg_depend.objid = pg_rewrite.oid 
JOIN pg_class AS dependent_view ON pg_rewrite.ev_class = dependent_view.oid 
JOIN pg_namespace AS dependent_ns ON dependent_view.relnamespace = dependent_ns.oid
WHERE pg_depend.refobjid = 'base_table'::regclass;
```

### 4. Index Materialized Views

```sql
-- Always add indexes for common query patterns
CREATE INDEX idx_mv_date ON mv_sales(sale_date);
CREATE INDEX idx_mv_category ON mv_sales(category);
CREATE UNIQUE INDEX idx_mv_pk ON mv_sales(id);  -- For CONCURRENTLY refresh
```

---

## Practice Exercises

### Exercise 1: Views
1. Create a view joining users, orders, and products
2. Create an updatable view with CHECK OPTION
3. Create a recursive view for hierarchical data

### Exercise 2: Materialized Views
1. Create a materialized view for monthly sales summary
2. Add appropriate indexes
3. Set up a refresh schedule

### Exercise 3: Real-World Scenario
1. Design views for a reporting dashboard
2. Create API views for backward compatibility
3. Implement security views for row/column access control

---

## Summary

In this chapter, you learned:
- ✅ Creating and managing views
- ✅ Updatable views with CHECK OPTION
- ✅ Materialized views for caching
- ✅ Refresh strategies (manual, scheduled, trigger)
- ✅ When to use views vs materialized views
- ✅ Practical patterns and best practices

---

**Next Chapter:** [Functions & Stored Procedures →](./12-Functions-Procedures.md)




