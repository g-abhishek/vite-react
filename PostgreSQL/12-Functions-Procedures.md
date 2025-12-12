# Chapter 12: Functions & Stored Procedures ⚙️

PL/pgSQL (Procedural Language/PostgreSQL) lets you write server-side logic with SQL and procedural constructs.

---

## Functions vs Procedures

| Aspect | Function | Procedure |
|--------|----------|-----------|
| Returns | Must return value | No return (or OUT params) |
| Called with | SELECT, expressions | CALL statement |
| Transactions | Cannot control | Can COMMIT/ROLLBACK |
| Use case | Computations, queries | Batch operations, ETL |

---

## Creating Functions

### Basic Function Syntax

```sql
CREATE [OR REPLACE] FUNCTION function_name(parameters)
RETURNS return_type
AS $$
    -- Function body
$$ LANGUAGE plpgsql;
```

### Simple Functions

```sql
-- Function with no parameters
CREATE OR REPLACE FUNCTION get_current_year()
RETURNS INTEGER AS $$
BEGIN
    RETURN EXTRACT(YEAR FROM CURRENT_DATE);
END;
$$ LANGUAGE plpgsql;

SELECT get_current_year();  -- 2024

-- Function with parameters
CREATE OR REPLACE FUNCTION calculate_tax(amount NUMERIC, rate NUMERIC DEFAULT 0.1)
RETURNS NUMERIC AS $$
BEGIN
    RETURN amount * rate;
END;
$$ LANGUAGE plpgsql;

SELECT calculate_tax(100);        -- 10.00
SELECT calculate_tax(100, 0.15);  -- 15.00

-- Function with named parameters
SELECT calculate_tax(rate => 0.08, amount => 500);  -- 40.00
```

### SQL Functions (Simpler)

```sql
-- For simple queries, use SQL language
CREATE OR REPLACE FUNCTION get_user_count()
RETURNS BIGINT AS $$
    SELECT COUNT(*) FROM users;
$$ LANGUAGE sql;

-- SQL function with parameters
CREATE OR REPLACE FUNCTION get_user_by_id(user_id INTEGER)
RETURNS TABLE(id INTEGER, name VARCHAR, email VARCHAR) AS $$
    SELECT id, name, email FROM users WHERE id = user_id;
$$ LANGUAGE sql;

SELECT * FROM get_user_by_id(1);
```

---

## Variables and Data Types

### Declaring Variables

```sql
CREATE OR REPLACE FUNCTION variable_demo()
RETURNS TEXT AS $$
DECLARE
    -- Explicit type
    counter INTEGER := 0;
    total NUMERIC(10,2);
    user_name VARCHAR(100);
    
    -- Using %TYPE (copies type from column)
    email users.email%TYPE;
    
    -- Using %ROWTYPE (copies entire row structure)
    user_record users%ROWTYPE;
    
    -- Record (generic row type)
    some_row RECORD;
    
    -- Array
    scores INTEGER[] := ARRAY[1, 2, 3];
    
    -- Constant
    TAX_RATE CONSTANT NUMERIC := 0.1;
BEGIN
    -- Assignments
    counter := counter + 1;
    total := 100.50;
    user_name := 'John';
    
    RETURN user_name;
END;
$$ LANGUAGE plpgsql;
```

### Using Query Results

```sql
CREATE OR REPLACE FUNCTION get_user_info(p_id INTEGER)
RETURNS TEXT AS $$
DECLARE
    v_name VARCHAR;
    v_email VARCHAR;
    v_user users%ROWTYPE;
BEGIN
    -- Single value
    SELECT name INTO v_name FROM users WHERE id = p_id;
    
    -- Multiple values
    SELECT name, email INTO v_name, v_email 
    FROM users WHERE id = p_id;
    
    -- Entire row
    SELECT * INTO v_user FROM users WHERE id = p_id;
    
    -- Check if row found
    IF NOT FOUND THEN
        RETURN 'User not found';
    END IF;
    
    RETURN v_user.name || ' <' || v_user.email || '>';
END;
$$ LANGUAGE plpgsql;

SELECT get_user_info(1);
```

---

## Control Structures

### IF-THEN-ELSE

```sql
CREATE OR REPLACE FUNCTION get_price_category(price NUMERIC)
RETURNS VARCHAR AS $$
BEGIN
    IF price < 50 THEN
        RETURN 'Budget';
    ELSIF price < 200 THEN
        RETURN 'Mid-range';
    ELSIF price < 1000 THEN
        RETURN 'Premium';
    ELSE
        RETURN 'Luxury';
    END IF;
END;
$$ LANGUAGE plpgsql;

SELECT get_price_category(75);  -- Mid-range
```

### CASE

```sql
CREATE OR REPLACE FUNCTION get_day_type(d DATE)
RETURNS VARCHAR AS $$
DECLARE
    day_num INTEGER;
BEGIN
    day_num := EXTRACT(DOW FROM d);
    
    RETURN CASE day_num
        WHEN 0 THEN 'Sunday'
        WHEN 6 THEN 'Saturday'
        ELSE 'Weekday'
    END;
END;
$$ LANGUAGE plpgsql;

-- Or searched CASE
CREATE OR REPLACE FUNCTION get_grade(score INTEGER)
RETURNS CHAR AS $$
BEGIN
    RETURN CASE
        WHEN score >= 90 THEN 'A'
        WHEN score >= 80 THEN 'B'
        WHEN score >= 70 THEN 'C'
        WHEN score >= 60 THEN 'D'
        ELSE 'F'
    END;
END;
$$ LANGUAGE plpgsql;
```

### Loops

```sql
-- Simple LOOP
CREATE OR REPLACE FUNCTION count_to_n(n INTEGER)
RETURNS TEXT AS $$
DECLARE
    i INTEGER := 1;
    result TEXT := '';
BEGIN
    LOOP
        result := result || i || ' ';
        i := i + 1;
        EXIT WHEN i > n;  -- Exit condition
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- WHILE loop
CREATE OR REPLACE FUNCTION factorial(n INTEGER)
RETURNS BIGINT AS $$
DECLARE
    result BIGINT := 1;
    i INTEGER := n;
BEGIN
    WHILE i > 1 LOOP
        result := result * i;
        i := i - 1;
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- FOR loop (integer range)
CREATE OR REPLACE FUNCTION sum_to_n(n INTEGER)
RETURNS BIGINT AS $$
DECLARE
    total BIGINT := 0;
BEGIN
    FOR i IN 1..n LOOP
        total := total + i;
    END LOOP;
    RETURN total;
END;
$$ LANGUAGE plpgsql;

-- FOR loop with step
FOR i IN REVERSE 10..1 BY 2 LOOP  -- 10, 8, 6, 4, 2
    -- ...
END LOOP;

-- FOR loop over query results
CREATE OR REPLACE FUNCTION list_users()
RETURNS TEXT AS $$
DECLARE
    rec RECORD;
    result TEXT := '';
BEGIN
    FOR rec IN SELECT id, name FROM users ORDER BY id LOOP
        result := result || rec.id || ': ' || rec.name || E'\n';
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- FOREACH for arrays
CREATE OR REPLACE FUNCTION array_sum(arr INTEGER[])
RETURNS INTEGER AS $$
DECLARE
    total INTEGER := 0;
    val INTEGER;
BEGIN
    FOREACH val IN ARRAY arr LOOP
        total := total + val;
    END LOOP;
    RETURN total;
END;
$$ LANGUAGE plpgsql;
```

### Loop Control

```sql
CREATE OR REPLACE FUNCTION loop_control_demo()
RETURNS TEXT AS $$
DECLARE
    result TEXT := '';
BEGIN
    <<outer_loop>>
    FOR i IN 1..5 LOOP
        FOR j IN 1..5 LOOP
            IF j = 3 THEN
                CONTINUE;  -- Skip rest of this iteration
            END IF;
            IF i = 4 THEN
                EXIT outer_loop;  -- Exit named loop
            END IF;
            result := result || i || '-' || j || ' ';
        END LOOP;
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;
```

---

## Returning Data

### Returning Single Value

```sql
CREATE OR REPLACE FUNCTION get_user_count()
RETURNS BIGINT AS $$
BEGIN
    RETURN (SELECT COUNT(*) FROM users);
END;
$$ LANGUAGE plpgsql;
```

### Returning Row

```sql
-- Using RETURNS TABLE
CREATE OR REPLACE FUNCTION get_user_details(p_id INTEGER)
RETURNS TABLE(user_id INTEGER, user_name VARCHAR, user_email VARCHAR) AS $$
BEGIN
    RETURN QUERY
    SELECT id, name, email FROM users WHERE id = p_id;
END;
$$ LANGUAGE plpgsql;

SELECT * FROM get_user_details(1);

-- Using OUT parameters
CREATE OR REPLACE FUNCTION get_user_info(
    p_id INTEGER,
    OUT o_name VARCHAR,
    OUT o_email VARCHAR
) AS $$
BEGIN
    SELECT name, email INTO o_name, o_email
    FROM users WHERE id = p_id;
END;
$$ LANGUAGE plpgsql;

SELECT * FROM get_user_info(1);
```

### Returning Multiple Rows

```sql
-- Using RETURNS SETOF
CREATE OR REPLACE FUNCTION get_active_users()
RETURNS SETOF users AS $$
BEGIN
    RETURN QUERY SELECT * FROM users WHERE is_active = true;
END;
$$ LANGUAGE plpgsql;

SELECT * FROM get_active_users();

-- Using RETURNS TABLE (more flexible)
CREATE OR REPLACE FUNCTION search_products(search_term TEXT)
RETURNS TABLE(id INTEGER, name VARCHAR, price NUMERIC) AS $$
BEGIN
    RETURN QUERY
    SELECT p.id, p.name, p.price
    FROM products p
    WHERE p.name ILIKE '%' || search_term || '%';
END;
$$ LANGUAGE plpgsql;

SELECT * FROM search_products('laptop');

-- Returning rows one at a time
CREATE OR REPLACE FUNCTION generate_dates(start_date DATE, end_date DATE)
RETURNS SETOF DATE AS $$
DECLARE
    current_date DATE := start_date;
BEGIN
    WHILE current_date <= end_date LOOP
        RETURN NEXT current_date;  -- Returns one row
        current_date := current_date + 1;
    END LOOP;
    RETURN;  -- Done
END;
$$ LANGUAGE plpgsql;

SELECT * FROM generate_dates('2024-01-01', '2024-01-10');
```

---

## Exception Handling

```sql
CREATE OR REPLACE FUNCTION safe_divide(a NUMERIC, b NUMERIC)
RETURNS NUMERIC AS $$
BEGIN
    RETURN a / b;
EXCEPTION
    WHEN division_by_zero THEN
        RAISE NOTICE 'Division by zero, returning NULL';
        RETURN NULL;
    WHEN OTHERS THEN
        RAISE NOTICE 'Error: %', SQLERRM;
        RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Common exceptions:
-- division_by_zero
-- unique_violation
-- foreign_key_violation
-- not_null_violation
-- check_violation
-- no_data_found
-- too_many_rows

-- Full exception handling
CREATE OR REPLACE FUNCTION insert_user(p_email VARCHAR)
RETURNS INTEGER AS $$
DECLARE
    new_id INTEGER;
BEGIN
    INSERT INTO users (email) VALUES (p_email) RETURNING id INTO new_id;
    RETURN new_id;
EXCEPTION
    WHEN unique_violation THEN
        RAISE EXCEPTION 'Email % already exists', p_email
            USING ERRCODE = 'P0001';
    WHEN not_null_violation THEN
        RAISE EXCEPTION 'Email cannot be null'
            USING ERRCODE = 'P0002';
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Unexpected error: %', SQLERRM
            USING ERRCODE = 'P0003';
END;
$$ LANGUAGE plpgsql;
```

### RAISE Statements

```sql
CREATE OR REPLACE FUNCTION validate_age(age INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
    -- Logging levels
    RAISE DEBUG 'Checking age: %', age;
    RAISE LOG 'Processing age validation';
    RAISE INFO 'Age value is %', age;
    RAISE NOTICE 'Validating age...';
    RAISE WARNING 'Age seems unusual: %', age;
    
    IF age < 0 THEN
        RAISE EXCEPTION 'Age cannot be negative: %', age;
    END IF;
    
    IF age > 150 THEN
        RAISE EXCEPTION 'Invalid age: %', age
            USING HINT = 'Age should be between 0 and 150',
                  ERRCODE = 'P0001';
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Custom exceptions
DO $$
BEGIN
    RAISE EXCEPTION USING
        MESSAGE = 'Custom error',
        DETAIL = 'More details here',
        HINT = 'Try doing something else',
        ERRCODE = 'P0100';
END;
$$;
```

---

## Stored Procedures

```sql
-- Create procedure (PostgreSQL 11+)
CREATE OR REPLACE PROCEDURE process_orders(batch_size INTEGER)
LANGUAGE plpgsql
AS $$
DECLARE
    processed INTEGER := 0;
    rec RECORD;
BEGIN
    FOR rec IN 
        SELECT id FROM orders 
        WHERE status = 'pending' 
        LIMIT batch_size 
        FOR UPDATE
    LOOP
        UPDATE orders SET status = 'processing' WHERE id = rec.id;
        processed := processed + 1;
        
        -- Commit every 100 records
        IF processed % 100 = 0 THEN
            COMMIT;
            RAISE NOTICE 'Processed % orders', processed;
        END IF;
    END LOOP;
    
    COMMIT;
    RAISE NOTICE 'Total processed: %', processed;
END;
$$;

-- Call procedure
CALL process_orders(1000);

-- Procedure with OUT parameters
CREATE OR REPLACE PROCEDURE get_stats(
    OUT total_users INTEGER,
    OUT active_users INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
    SELECT COUNT(*) INTO total_users FROM users;
    SELECT COUNT(*) INTO active_users FROM users WHERE is_active = true;
END;
$$;

CALL get_stats(NULL, NULL);
```

### Procedure Transaction Control

```sql
CREATE OR REPLACE PROCEDURE transfer_funds(
    from_account INTEGER,
    to_account INTEGER,
    amount NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
    -- Debit
    UPDATE accounts SET balance = balance - amount 
    WHERE id = from_account;
    
    IF NOT FOUND THEN
        ROLLBACK;
        RAISE EXCEPTION 'Source account not found';
    END IF;
    
    -- Credit
    UPDATE accounts SET balance = balance + amount 
    WHERE id = to_account;
    
    IF NOT FOUND THEN
        ROLLBACK;
        RAISE EXCEPTION 'Destination account not found';
    END IF;
    
    COMMIT;
END;
$$;

CALL transfer_funds(1, 2, 100.00);
```

---

## Dynamic SQL

### EXECUTE Statement

```sql
CREATE OR REPLACE FUNCTION dynamic_query(table_name TEXT, column_name TEXT)
RETURNS BIGINT AS $$
DECLARE
    result BIGINT;
BEGIN
    -- ⚠️ Vulnerable to SQL injection!
    EXECUTE 'SELECT COUNT(' || column_name || ') FROM ' || table_name
    INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Safe version using format() and identifiers
CREATE OR REPLACE FUNCTION safe_dynamic_query(table_name TEXT, column_name TEXT)
RETURNS BIGINT AS $$
DECLARE
    result BIGINT;
BEGIN
    EXECUTE format('SELECT COUNT(%I) FROM %I', column_name, table_name)
    INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- format() placeholders:
-- %s - string (as-is, unsafe!)
-- %I - identifier (escaped for use as table/column name)
-- %L - literal (escaped for use as string literal)

-- Dynamic INSERT
CREATE OR REPLACE FUNCTION dynamic_insert(
    table_name TEXT,
    data JSONB
)
RETURNS BIGINT AS $$
DECLARE
    columns TEXT;
    values TEXT;
    result BIGINT;
BEGIN
    SELECT 
        string_agg(quote_ident(key), ', '),
        string_agg(quote_literal(value), ', ')
    INTO columns, values
    FROM jsonb_each_text(data);
    
    EXECUTE format(
        'INSERT INTO %I (%s) VALUES (%s) RETURNING id',
        table_name, columns, values
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

SELECT dynamic_insert('users', '{"name": "John", "email": "john@example.com"}');
```

### Using Prepared Statements

```sql
CREATE OR REPLACE FUNCTION prepared_query_example()
RETURNS SETOF users AS $$
BEGIN
    PREPARE user_query (INTEGER) AS
        SELECT * FROM users WHERE id = $1;
    
    RETURN QUERY EXECUTE 'EXECUTE user_query($1)' USING 1;
    
    DEALLOCATE user_query;
END;
$$ LANGUAGE plpgsql;
```

---

## Function Options

```sql
CREATE OR REPLACE FUNCTION example_function()
RETURNS INTEGER
AS $$
BEGIN
    RETURN 1;
END;
$$ LANGUAGE plpgsql

-- Volatility (affects query planning)
IMMUTABLE      -- Same input always returns same output, no side effects
STABLE         -- Same output within single query, no side effects
VOLATILE       -- Can return different results, may have side effects (default)

-- Security
SECURITY DEFINER   -- Runs with function owner's privileges
SECURITY INVOKER   -- Runs with caller's privileges (default)

-- Cost hint for planner
COST 100           -- Relative cost estimate (default 100 for plpgsql)
ROWS 1000          -- Estimated rows for set-returning functions

-- Null handling
RETURNS NULL ON NULL INPUT  -- Return NULL if any argument is NULL
CALLED ON NULL INPUT        -- Function handles NULLs (default)
STRICT                      -- Same as RETURNS NULL ON NULL INPUT

-- Parallelism (PostgreSQL 10+)
PARALLEL UNSAFE    -- Cannot run in parallel (default for plpgsql)
PARALLEL SAFE      -- Safe to run in parallel
PARALLEL RESTRICTED -- Can be called in parallel mode but not parallel leader

-- Full example
CREATE OR REPLACE FUNCTION calculate_discount(
    price NUMERIC,
    discount_pct NUMERIC
)
RETURNS NUMERIC
LANGUAGE plpgsql
IMMUTABLE
STRICT
PARALLEL SAFE
COST 10
AS $$
BEGIN
    RETURN price * (1 - discount_pct);
END;
$$;
```

---

## Practical Examples

### Audit Function

```sql
CREATE OR REPLACE FUNCTION audit_changes()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_log (
        table_name, action, old_data, new_data, changed_by, changed_at
    ) VALUES (
        TG_TABLE_NAME,
        TG_OP,
        CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD)::JSONB ELSE NULL END,
        CASE WHEN TG_OP != 'DELETE' THEN row_to_json(NEW)::JSONB ELSE NULL END,
        current_user,
        NOW()
    );
    
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;
```

### Pagination Function

```sql
CREATE OR REPLACE FUNCTION paginate_table(
    p_table TEXT,
    p_page INTEGER DEFAULT 1,
    p_per_page INTEGER DEFAULT 20,
    p_order_by TEXT DEFAULT 'id',
    p_order_dir TEXT DEFAULT 'ASC'
)
RETURNS TABLE(data JSONB, total_count BIGINT, total_pages INTEGER) AS $$
DECLARE
    v_offset INTEGER;
    v_total BIGINT;
    v_pages INTEGER;
BEGIN
    v_offset := (p_page - 1) * p_per_page;
    
    -- Get total count
    EXECUTE format('SELECT COUNT(*) FROM %I', p_table) INTO v_total;
    v_pages := CEIL(v_total::NUMERIC / p_per_page);
    
    -- Return results
    RETURN QUERY EXECUTE format(
        'SELECT jsonb_agg(row_to_json(t)::JSONB), %L::BIGINT, %L::INTEGER
         FROM (SELECT * FROM %I ORDER BY %I %s LIMIT %L OFFSET %L) t',
        v_total, v_pages, p_table, p_order_by, p_order_dir, p_per_page, v_offset
    );
END;
$$ LANGUAGE plpgsql;

SELECT * FROM paginate_table('users', 1, 10, 'created_at', 'DESC');
```

### Bulk Upsert Function

```sql
CREATE OR REPLACE FUNCTION bulk_upsert_products(products JSONB)
RETURNS TABLE(inserted INTEGER, updated INTEGER) AS $$
DECLARE
    v_inserted INTEGER := 0;
    v_updated INTEGER := 0;
    product JSONB;
BEGIN
    FOR product IN SELECT * FROM jsonb_array_elements(products) LOOP
        INSERT INTO products (sku, name, price)
        VALUES (
            product->>'sku',
            product->>'name',
            (product->>'price')::NUMERIC
        )
        ON CONFLICT (sku) DO UPDATE SET
            name = EXCLUDED.name,
            price = EXCLUDED.price,
            updated_at = NOW()
        RETURNING (xmax = 0) INTO STRICT v_inserted;
        
        IF v_inserted THEN
            v_inserted := v_inserted + 1;
        ELSE
            v_updated := v_updated + 1;
        END IF;
    END LOOP;
    
    RETURN QUERY SELECT v_inserted, v_updated;
END;
$$ LANGUAGE plpgsql;
```

---

## Managing Functions

```sql
-- List functions
\df
\df+ public.*

-- View function definition
\sf function_name

-- Or query
SELECT pg_get_functiondef('function_name'::regproc);

-- Drop function
DROP FUNCTION function_name(parameter_types);
DROP FUNCTION IF EXISTS function_name(INTEGER, TEXT);

-- Grant/revoke
GRANT EXECUTE ON FUNCTION function_name(parameter_types) TO role_name;
REVOKE EXECUTE ON FUNCTION function_name(parameter_types) FROM PUBLIC;
```

---

## Practice Exercises

### Exercise 1: Basic Functions
1. Create a function to calculate BMI
2. Create a function to format phone numbers
3. Create a function returning table of date ranges

### Exercise 2: Control Structures
1. Create a function with multiple conditions
2. Create a function using loops to generate data
3. Create a function with exception handling

### Exercise 3: Procedures
1. Create a batch processing procedure
2. Create a data cleanup procedure with commits
3. Create a reporting procedure with OUT parameters

---

## Summary

In this chapter, you learned:
- ✅ Creating functions and procedures
- ✅ Variables, types, and %TYPE/%ROWTYPE
- ✅ Control structures: IF, CASE, loops
- ✅ Returning values, rows, and sets
- ✅ Exception handling with RAISE
- ✅ Dynamic SQL with EXECUTE
- ✅ Function options and security

---

**Next Chapter:** [Triggers →](./13-Triggers.md)



