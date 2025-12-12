# Chapter 13: Triggers ⚡

Triggers automatically execute functions in response to database events (INSERT, UPDATE, DELETE, TRUNCATE).

---

## Trigger Concepts

```
┌─────────────────────────────────────────────────┐
│                   TABLE                          │
│                                                  │
│  INSERT/UPDATE/DELETE ─────┐                     │
│                            ▼                     │
│  ┌──────────────────────────────────────────┐   │
│  │            BEFORE TRIGGER                 │   │
│  │  • Can modify NEW values                  │   │
│  │  • Can prevent operation (RETURN NULL)   │   │
│  └──────────────────────────────────────────┘   │
│                            │                     │
│                            ▼                     │
│  ┌──────────────────────────────────────────┐   │
│  │         ACTUAL OPERATION                  │   │
│  │         (INSERT/UPDATE/DELETE)            │   │
│  └──────────────────────────────────────────┘   │
│                            │                     │
│                            ▼                     │
│  ┌──────────────────────────────────────────┐   │
│  │            AFTER TRIGGER                  │   │
│  │  • Cannot modify values                   │   │
│  │  • Good for logging, notifications       │   │
│  └──────────────────────────────────────────┘   │
│                                                  │
└─────────────────────────────────────────────────┘
```

---

## Creating Triggers

### Basic Trigger Syntax

```sql
-- Step 1: Create trigger function
CREATE OR REPLACE FUNCTION trigger_function_name()
RETURNS TRIGGER AS $$
BEGIN
    -- Trigger logic here
    RETURN NEW;  -- or OLD, or NULL
END;
$$ LANGUAGE plpgsql;

-- Step 2: Create trigger
CREATE TRIGGER trigger_name
    {BEFORE | AFTER | INSTEAD OF} {INSERT | UPDATE | DELETE | TRUNCATE}
    ON table_name
    [FOR EACH {ROW | STATEMENT}]
    [WHEN (condition)]
    EXECUTE FUNCTION trigger_function_name();
```

### Row-Level Triggers

Execute once per affected row.

```sql
-- BEFORE INSERT: Auto-set values
CREATE OR REPLACE FUNCTION set_timestamps()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        NEW.created_at := COALESCE(NEW.created_at, NOW());
    END IF;
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_users_timestamps
    BEFORE INSERT OR UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION set_timestamps();

-- Test
INSERT INTO users (name, email) VALUES ('John', 'john@example.com');
-- created_at and updated_at are automatically set!

UPDATE users SET name = 'John Doe' WHERE id = 1;
-- updated_at is automatically updated!
```

### Statement-Level Triggers

Execute once per SQL statement, regardless of affected rows.

```sql
-- Log all bulk operations
CREATE TABLE operation_log (
    id SERIAL PRIMARY KEY,
    table_name TEXT,
    operation TEXT,
    rows_affected INTEGER,
    executed_by TEXT,
    executed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION log_bulk_operation()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO operation_log (table_name, operation, executed_by)
    VALUES (TG_TABLE_NAME, TG_OP, current_user);
    RETURN NULL;  -- Statement triggers return NULL
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_log_users_operations
    AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH STATEMENT
    EXECUTE FUNCTION log_bulk_operation();
```

---

## Trigger Timing

### BEFORE Triggers

```sql
-- Modify data before it's saved
CREATE OR REPLACE FUNCTION validate_email()
RETURNS TRIGGER AS $$
BEGIN
    -- Normalize email
    NEW.email := LOWER(TRIM(NEW.email));
    
    -- Validate format
    IF NEW.email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
        RAISE EXCEPTION 'Invalid email format: %', NEW.email;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_validate_email
    BEFORE INSERT OR UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION validate_email();

-- Generate slugs
CREATE OR REPLACE FUNCTION generate_slug()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
        NEW.slug := LOWER(REGEXP_REPLACE(NEW.title, '[^a-zA-Z0-9]+', '-', 'g'));
        NEW.slug := TRIM(BOTH '-' FROM NEW.slug);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_generate_slug
    BEFORE INSERT ON posts
    FOR EACH ROW
    EXECUTE FUNCTION generate_slug();
```

### AFTER Triggers

```sql
-- Audit logging
CREATE TABLE audit_log (
    id SERIAL PRIMARY KEY,
    table_name TEXT,
    record_id INTEGER,
    action TEXT,
    old_data JSONB,
    new_data JSONB,
    changed_by TEXT,
    changed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION audit_trigger()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_log (table_name, record_id, action, new_data, changed_by)
        VALUES (TG_TABLE_NAME, NEW.id, 'INSERT', to_jsonb(NEW), current_user);
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_log (table_name, record_id, action, old_data, new_data, changed_by)
        VALUES (TG_TABLE_NAME, NEW.id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW), current_user);
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_log (table_name, record_id, action, old_data, changed_by)
        VALUES (TG_TABLE_NAME, OLD.id, 'DELETE', to_jsonb(OLD), current_user);
        RETURN OLD;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_users_audit
    AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW
    EXECUTE FUNCTION audit_trigger();
```

### INSTEAD OF Triggers (for Views)

```sql
-- Make view updatable
CREATE VIEW user_profiles AS
SELECT u.id, u.name, u.email, p.bio, p.avatar_url
FROM users u
LEFT JOIN profiles p ON u.id = p.user_id;

CREATE OR REPLACE FUNCTION update_user_profile()
RETURNS TRIGGER AS $$
BEGIN
    -- Update users table
    UPDATE users SET name = NEW.name, email = NEW.email WHERE id = NEW.id;
    
    -- Update or insert profile
    INSERT INTO profiles (user_id, bio, avatar_url)
    VALUES (NEW.id, NEW.bio, NEW.avatar_url)
    ON CONFLICT (user_id) DO UPDATE SET
        bio = EXCLUDED.bio,
        avatar_url = EXCLUDED.avatar_url;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_update_user_profile
    INSTEAD OF UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_user_profile();

-- Now this works:
UPDATE user_profiles SET bio = 'New bio' WHERE id = 1;
```

---

## Trigger Variables

```sql
CREATE OR REPLACE FUNCTION debug_trigger()
RETURNS TRIGGER AS $$
BEGIN
    -- Available in all triggers
    RAISE NOTICE 'TG_NAME: %', TG_NAME;        -- Trigger name
    RAISE NOTICE 'TG_WHEN: %', TG_WHEN;        -- BEFORE, AFTER, INSTEAD OF
    RAISE NOTICE 'TG_OP: %', TG_OP;            -- INSERT, UPDATE, DELETE, TRUNCATE
    RAISE NOTICE 'TG_LEVEL: %', TG_LEVEL;      -- ROW or STATEMENT
    RAISE NOTICE 'TG_TABLE_NAME: %', TG_TABLE_NAME;    -- Table name
    RAISE NOTICE 'TG_TABLE_SCHEMA: %', TG_TABLE_SCHEMA; -- Schema name
    RAISE NOTICE 'TG_RELID: %', TG_RELID;      -- Table OID
    
    -- For row-level triggers only
    IF TG_LEVEL = 'ROW' THEN
        IF TG_OP = 'DELETE' THEN
            RAISE NOTICE 'OLD: %', OLD;
            RETURN OLD;
        ELSIF TG_OP = 'INSERT' THEN
            RAISE NOTICE 'NEW: %', NEW;
            RETURN NEW;
        ELSE  -- UPDATE
            RAISE NOTICE 'OLD: %', OLD;
            RAISE NOTICE 'NEW: %', NEW;
            RETURN NEW;
        END IF;
    END IF;
    
    -- For UPDATE triggers
    -- TG_ARGV - Array of trigger arguments
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## Conditional Triggers

### WHEN Clause

```sql
-- Only trigger when specific columns change
CREATE TRIGGER tr_salary_changed
    AFTER UPDATE ON employees
    FOR EACH ROW
    WHEN (OLD.salary IS DISTINCT FROM NEW.salary)
    EXECUTE FUNCTION log_salary_change();

-- Only for specific values
CREATE TRIGGER tr_status_changed_to_shipped
    AFTER UPDATE ON orders
    FOR EACH ROW
    WHEN (NEW.status = 'shipped' AND OLD.status != 'shipped')
    EXECUTE FUNCTION notify_shipping();

-- Complex condition
CREATE TRIGGER tr_significant_update
    AFTER UPDATE ON products
    FOR EACH ROW
    WHEN (
        OLD.price IS DISTINCT FROM NEW.price OR
        OLD.name IS DISTINCT FROM NEW.name
    )
    EXECUTE FUNCTION log_product_change();
```

### UPDATE OF (Specific Columns)

```sql
-- Only trigger when specific columns are updated
CREATE TRIGGER tr_price_changed
    BEFORE UPDATE OF price, discount ON products
    FOR EACH ROW
    EXECUTE FUNCTION validate_price_change();
```

---

## Common Trigger Patterns

### Auto-increment Custom Sequence

```sql
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(20) UNIQUE,
    customer_id INTEGER
);

CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
DECLARE
    year_prefix VARCHAR(4);
    next_seq INTEGER;
BEGIN
    year_prefix := TO_CHAR(NOW(), 'YYYY');
    
    SELECT COALESCE(MAX(SUBSTRING(order_number FROM 6)::INTEGER), 0) + 1
    INTO next_seq
    FROM orders
    WHERE order_number LIKE year_prefix || '-%';
    
    NEW.order_number := year_prefix || '-' || LPAD(next_seq::TEXT, 6, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_generate_order_number
    BEFORE INSERT ON orders
    FOR EACH ROW
    EXECUTE FUNCTION generate_order_number();

-- Result: 2024-000001, 2024-000002, etc.
```

### Maintain Denormalized Data

```sql
-- Keep count in parent table
CREATE OR REPLACE FUNCTION update_order_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE customers SET order_count = order_count + 1 WHERE id = NEW.customer_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE customers SET order_count = order_count - 1 WHERE id = OLD.customer_id;
    ELSIF TG_OP = 'UPDATE' AND OLD.customer_id != NEW.customer_id THEN
        UPDATE customers SET order_count = order_count - 1 WHERE id = OLD.customer_id;
        UPDATE customers SET order_count = order_count + 1 WHERE id = NEW.customer_id;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_update_order_count
    AFTER INSERT OR UPDATE OR DELETE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_order_count();
```

### Soft Delete

```sql
CREATE OR REPLACE FUNCTION soft_delete()
RETURNS TRIGGER AS $$
BEGIN
    -- Instead of deleting, update deleted_at
    UPDATE users SET deleted_at = NOW() WHERE id = OLD.id;
    RETURN NULL;  -- Prevent actual delete
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_soft_delete
    BEFORE DELETE ON users
    FOR EACH ROW
    WHEN (OLD.deleted_at IS NULL)
    EXECUTE FUNCTION soft_delete();

-- DELETE now soft-deletes
DELETE FROM users WHERE id = 1;
-- Row still exists with deleted_at set
```

### History Table

```sql
-- Create history table
CREATE TABLE products_history (
    history_id SERIAL PRIMARY KEY,
    product_id INTEGER,
    name VARCHAR(200),
    price NUMERIC(10,2),
    valid_from TIMESTAMPTZ,
    valid_to TIMESTAMPTZ,
    operation CHAR(1)
);

CREATE OR REPLACE FUNCTION track_product_history()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        -- Close previous version
        UPDATE products_history 
        SET valid_to = NOW()
        WHERE product_id = OLD.id AND valid_to IS NULL;
        
        -- Insert new version
        INSERT INTO products_history (product_id, name, price, valid_from, operation)
        VALUES (NEW.id, NEW.name, NEW.price, NOW(), 'U');
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO products_history (product_id, name, price, valid_from, operation)
        VALUES (NEW.id, NEW.name, NEW.price, NOW(), 'I');
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE products_history 
        SET valid_to = NOW()
        WHERE product_id = OLD.id AND valid_to IS NULL;
        
        INSERT INTO products_history (product_id, name, price, valid_from, valid_to, operation)
        VALUES (OLD.id, OLD.name, OLD.price, NOW(), NOW(), 'D');
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_product_history
    AFTER INSERT OR UPDATE OR DELETE ON products
    FOR EACH ROW
    EXECUTE FUNCTION track_product_history();
```

### Send Notifications

```sql
-- Using PostgreSQL NOTIFY
CREATE OR REPLACE FUNCTION notify_order_created()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM pg_notify(
        'order_created',
        json_build_object(
            'order_id', NEW.id,
            'customer_id', NEW.customer_id,
            'total', NEW.total
        )::text
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_notify_order
    AFTER INSERT ON orders
    FOR EACH ROW
    EXECUTE FUNCTION notify_order_created();

-- Listen in application
-- LISTEN order_created;
```

### Enforce Business Rules

```sql
-- Prevent deletion of active orders
CREATE OR REPLACE FUNCTION prevent_delete_active_order()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status NOT IN ('cancelled', 'completed') THEN
        RAISE EXCEPTION 'Cannot delete order % with status %', OLD.id, OLD.status;
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_prevent_delete
    BEFORE DELETE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION prevent_delete_active_order();

-- Ensure stock availability
CREATE OR REPLACE FUNCTION check_stock()
RETURNS TRIGGER AS $$
DECLARE
    available INTEGER;
BEGIN
    SELECT stock INTO available FROM products WHERE id = NEW.product_id;
    
    IF available < NEW.quantity THEN
        RAISE EXCEPTION 'Insufficient stock for product %: requested %, available %',
            NEW.product_id, NEW.quantity, available;
    END IF;
    
    -- Deduct stock
    UPDATE products SET stock = stock - NEW.quantity WHERE id = NEW.product_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_check_stock
    BEFORE INSERT ON order_items
    FOR EACH ROW
    EXECUTE FUNCTION check_stock();
```

---

## Managing Triggers

```sql
-- List triggers
\dS table_name

-- Or query
SELECT 
    tgname AS trigger_name,
    tgenabled AS enabled,
    pg_get_triggerdef(oid) AS definition
FROM pg_trigger
WHERE tgrelid = 'table_name'::regclass;

-- Enable/disable trigger
ALTER TABLE users DISABLE TRIGGER tr_users_audit;
ALTER TABLE users ENABLE TRIGGER tr_users_audit;

-- Disable all triggers on table
ALTER TABLE users DISABLE TRIGGER ALL;
ALTER TABLE users ENABLE TRIGGER ALL;

-- Disable only user triggers (not system triggers like FK constraints)
ALTER TABLE users DISABLE TRIGGER USER;

-- Drop trigger
DROP TRIGGER tr_users_audit ON users;
DROP TRIGGER IF EXISTS tr_users_audit ON users;

-- Rename trigger
ALTER TRIGGER tr_old_name ON users RENAME TO tr_new_name;
```

---

## Trigger Execution Order

```sql
-- Multiple triggers on same table/event execute alphabetically by name
-- Prefix with numbers to control order:

CREATE TRIGGER a01_validate_data ...  -- Runs first
CREATE TRIGGER a02_set_defaults ...   -- Runs second
CREATE TRIGGER a03_log_changes ...    -- Runs third

-- Each trigger's RETURN value is passed to the next trigger
-- If any BEFORE trigger returns NULL, operation is cancelled
```

---

## Event Triggers

Triggers on database-level events (DDL operations).

```sql
-- Log DDL commands
CREATE OR REPLACE FUNCTION log_ddl_commands()
RETURNS event_trigger AS $$
BEGIN
    INSERT INTO ddl_log (event, tag, command)
    SELECT 
        TG_EVENT,
        TG_TAG,
        current_query();
END;
$$ LANGUAGE plpgsql;

CREATE EVENT TRIGGER tr_log_ddl
    ON ddl_command_end
    EXECUTE FUNCTION log_ddl_commands();

-- Prevent table drops
CREATE OR REPLACE FUNCTION prevent_table_drop()
RETURNS event_trigger AS $$
DECLARE
    obj RECORD;
BEGIN
    FOR obj IN SELECT * FROM pg_event_trigger_dropped_objects() LOOP
        IF obj.object_type = 'table' THEN
            RAISE EXCEPTION 'Dropping tables is not allowed';
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

CREATE EVENT TRIGGER tr_prevent_drop
    ON sql_drop
    EXECUTE FUNCTION prevent_table_drop();

-- Event trigger types:
-- ddl_command_start   - Before DDL command
-- ddl_command_end     - After DDL command
-- table_rewrite       - Before table rewrite
-- sql_drop            - When objects are dropped
```

---

## Performance Considerations

```sql
-- 1. Keep trigger functions fast
-- Avoid complex queries, external calls

-- 2. Use WHEN clause to limit execution
CREATE TRIGGER tr_only_when_needed
    AFTER UPDATE ON orders
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION handle_status_change();

-- 3. Consider statement-level for bulk operations
-- Instead of firing per row

-- 4. Disable triggers during bulk loads
ALTER TABLE large_table DISABLE TRIGGER ALL;
-- ... bulk load ...
ALTER TABLE large_table ENABLE TRIGGER ALL;

-- 5. Check trigger impact with EXPLAIN ANALYZE
-- Triggers don't show directly but affect timing
```

---

## Practice Exercises

### Exercise 1: Basic Triggers
1. Create a trigger to auto-update `updated_at` timestamp
2. Create a trigger to validate email format
3. Create a trigger to generate a UUID before insert

### Exercise 2: Audit Triggers
1. Create a complete audit trail for a table
2. Store who changed what and when
3. Track only specific column changes

### Exercise 3: Business Logic
1. Maintain a running balance in accounts table
2. Implement cascading soft delete
3. Enforce maximum order limit per customer

### Exercise 4: Complex Scenarios
1. Implement temporal tables (history tracking)
2. Create a trigger that calls external API (via pg_notify)
3. Build a change data capture system

---

## Summary

In this chapter, you learned:
- ✅ Trigger concepts: BEFORE, AFTER, INSTEAD OF
- ✅ Row-level vs statement-level triggers
- ✅ Trigger variables (TG_OP, NEW, OLD, etc.)
- ✅ Conditional triggers with WHEN clause
- ✅ Common patterns: audit, history, validation
- ✅ Event triggers for DDL operations
- ✅ Performance considerations

---

**Next Chapter:** [Transactions & ACID →](./14-Transactions-ACID.md)



