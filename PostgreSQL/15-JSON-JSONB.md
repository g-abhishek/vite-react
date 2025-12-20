# Chapter 15: JSON & JSONB 📋

PostgreSQL has excellent JSON support, making it a powerful choice for semi-structured data alongside traditional relational data.

---

## JSON vs JSONB

| Aspect | JSON | JSONB |
|--------|------|-------|
| Storage | Text (exact copy) | Binary (parsed) |
| Duplicate Keys | Preserves | Last wins |
| Key Order | Preserves | Not preserved |
| Whitespace | Preserves | Removed |
| Insert Speed | Faster | Slower (parsing) |
| Query Speed | Slower | Faster |
| Indexing | No | Yes (GIN) |
| **Recommendation** | Rarely use | **Use this!** |

```sql
-- JSON stores exact text
SELECT '{"b": 1, "a": 2}'::JSON;  -- {"b": 1, "a": 2}

-- JSONB normalizes
SELECT '{"b": 1, "a": 2}'::JSONB; -- {"a": 2, "b": 1} (sorted)

-- JSONB removes duplicates
SELECT '{"a": 1, "a": 2}'::JSONB; -- {"a": 2} (last wins)
```

---

## Creating JSON Data

```sql
-- Table with JSONB column
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200),
    attributes JSONB,
    metadata JSONB DEFAULT '{}'
);

-- Insert JSON data
INSERT INTO products (name, attributes) VALUES
('Laptop', '{"brand": "Dell", "specs": {"ram": 16, "storage": 512}, "colors": ["silver", "black"]}'),
('Phone', '{"brand": "Apple", "specs": {"ram": 8, "storage": 256}, "colors": ["white", "blue", "black"]}'),
('Monitor', '{"brand": "LG", "specs": {"size": 27, "resolution": "4K"}, "features": ["HDR", "USB-C"]}');

-- Using JSON functions
INSERT INTO products (name, attributes) VALUES
('Tablet', jsonb_build_object(
    'brand', 'Samsung',
    'specs', jsonb_build_object('ram', 6, 'storage', 128),
    'colors', jsonb_build_array('silver', 'gold')
));
```

---

## Accessing JSON Data

### Arrow Operators

```sql
-- -> returns JSON
SELECT attributes->'brand' FROM products;              -- "Dell" (with quotes)
SELECT attributes->'specs' FROM products;              -- {"ram": 16, "storage": 512}
SELECT attributes->'specs'->'ram' FROM products;       -- 16 (as JSON number)

-- ->> returns TEXT
SELECT attributes->>'brand' FROM products;             -- Dell (no quotes)
SELECT attributes->'specs'->>'ram' FROM products;      -- 16 (as text)

-- Array access (0-indexed)
SELECT attributes->'colors'->0 FROM products;          -- "silver"
SELECT attributes->'colors'->>0 FROM products;         -- silver

-- Path access
SELECT attributes#>'{specs,ram}' FROM products;        -- 16 (as JSON)
SELECT attributes#>>'{specs,ram}' FROM products;       -- 16 (as text)
SELECT attributes#>'{colors,0}' FROM products;         -- "silver"
```

### Casting JSON Values

```sql
-- Cast to appropriate types
SELECT 
    name,
    (attributes->'specs'->>'ram')::INTEGER AS ram_gb,
    (attributes->'specs'->>'storage')::INTEGER AS storage_gb
FROM products;

-- With COALESCE for missing keys
SELECT 
    name,
    COALESCE((attributes->'specs'->>'ram')::INTEGER, 0) AS ram_gb
FROM products;
```

---

## JSON Operators

### Containment Operators

```sql
-- @> contains
SELECT * FROM products WHERE attributes @> '{"brand": "Dell"}';
SELECT * FROM products WHERE attributes @> '{"specs": {"ram": 16}}';
SELECT * FROM products WHERE attributes->'colors' @> '"silver"';

-- <@ is contained by
SELECT * FROM products 
WHERE '{"brand": "Dell", "category": "Electronics"}' <@ attributes;

-- ? has key
SELECT * FROM products WHERE attributes ? 'brand';
SELECT * FROM products WHERE attributes->'specs' ? 'ram';

-- ?| has any key
SELECT * FROM products WHERE attributes ?| ARRAY['brand', 'category'];

-- ?& has all keys
SELECT * FROM products WHERE attributes ?& ARRAY['brand', 'specs'];
```

### Comparison and Equality

```sql
-- Equality (JSONB only)
SELECT * FROM products 
WHERE attributes->'specs' = '{"ram": 16, "storage": 512}'::JSONB;

-- Note: Order doesn't matter for JSONB comparison
SELECT '{"a":1,"b":2}'::JSONB = '{"b":2,"a":1}'::JSONB;  -- true
```

---

## Modifying JSON

### Add/Update Keys

```sql
-- || concatenation (merge)
UPDATE products 
SET attributes = attributes || '{"warranty": "2 years"}'
WHERE name = 'Laptop';

-- Nested update with jsonb_set
UPDATE products
SET attributes = jsonb_set(attributes, '{specs,ram}', '32')
WHERE name = 'Laptop';

-- jsonb_set parameters: (target, path, new_value, create_missing)
UPDATE products
SET attributes = jsonb_set(attributes, '{specs,cpu}', '"i7"', true)
WHERE name = 'Laptop';

-- Add to array
UPDATE products
SET attributes = jsonb_set(
    attributes, 
    '{colors}', 
    (attributes->'colors') || '"gold"'
)
WHERE name = 'Laptop';

-- Insert at specific position
UPDATE products
SET attributes = jsonb_insert(
    attributes, 
    '{colors, 0}',  -- Insert at position 0
    '"red"'
)
WHERE name = 'Laptop';
```

### Remove Keys

```sql
-- Remove single key
UPDATE products
SET attributes = attributes - 'warranty'
WHERE name = 'Laptop';

-- Remove nested key
UPDATE products
SET attributes = attributes #- '{specs,cpu}'
WHERE name = 'Laptop';

-- Remove from array by index
UPDATE products
SET attributes = attributes - '{colors,0}'  -- Doesn't work this way

-- Remove from array by value
UPDATE products
SET attributes = jsonb_set(
    attributes,
    '{colors}',
    (SELECT jsonb_agg(elem) FROM jsonb_array_elements(attributes->'colors') elem WHERE elem != '"red"')
)
WHERE name = 'Laptop';
```

---

## JSON Functions

### Building JSON

```sql
-- Build object
SELECT jsonb_build_object(
    'name', 'John',
    'age', 30,
    'active', true
);
-- {"age": 30, "name": "John", "active": true}

-- Build array
SELECT jsonb_build_array('a', 'b', 'c', 1, 2, 3);
-- ["a", "b", "c", 1, 2, 3]

-- Convert row to JSON
SELECT row_to_json(users) FROM users;
SELECT to_jsonb(users) FROM users;

-- Convert multiple rows to JSON array
SELECT jsonb_agg(row_to_json(users)) FROM users;
SELECT json_agg(users) FROM users;

-- Aggregate with object
SELECT jsonb_object_agg(name, salary) FROM employees;
-- {"Alice": 50000, "Bob": 60000}
```

### Extracting Data

```sql
-- Get all keys
SELECT jsonb_object_keys(attributes) FROM products;

-- Expand object to rows
SELECT * FROM jsonb_each('{"a": 1, "b": "text"}'::JSONB);
-- key | value
-- a   | 1
-- b   | "text"

SELECT * FROM jsonb_each_text('{"a": 1, "b": "text"}'::JSONB);
-- key | value
-- a   | 1
-- b   | text

-- Expand array to rows
SELECT * FROM jsonb_array_elements('["a", "b", "c"]'::JSONB);
-- value
-- "a"
-- "b"
-- "c"

SELECT * FROM jsonb_array_elements_text('["a", "b", "c"]'::JSONB);
-- value
-- a
-- b
-- c

-- Get array length
SELECT jsonb_array_length('[1,2,3,4,5]'::JSONB);  -- 5

-- Get type
SELECT jsonb_typeof('{"a":1}'::JSONB);  -- object
SELECT jsonb_typeof('[1,2,3]'::JSONB);  -- array
SELECT jsonb_typeof('"hello"'::JSONB);  -- string
SELECT jsonb_typeof('123'::JSONB);      -- number
SELECT jsonb_typeof('true'::JSONB);     -- boolean
SELECT jsonb_typeof('null'::JSONB);     -- null
```

### Path Queries (PostgreSQL 12+)

```sql
-- jsonb_path_query - SQL/JSON path language
SELECT jsonb_path_query(attributes, '$.specs.ram') FROM products;
SELECT jsonb_path_query(attributes, '$.colors[*]') FROM products;

-- jsonb_path_query_array - Returns array
SELECT jsonb_path_query_array(attributes, '$.colors[*]') FROM products;

-- jsonb_path_exists - Check if path exists
SELECT * FROM products 
WHERE jsonb_path_exists(attributes, '$.specs.ram ? (@ > 8)');

-- Complex path queries
SELECT jsonb_path_query(
    attributes, 
    '$.specs.* ? (@ > 100)'
) FROM products;

-- Filter with path
SELECT * FROM products
WHERE jsonb_path_exists(
    attributes,
    '$.colors[*] ? (@ == "silver")'
);
```

---

## Indexing JSONB

### GIN Index (General)

```sql
-- Index entire JSONB column
CREATE INDEX idx_products_attributes ON products USING GIN (attributes);

-- Supports:
-- @> containment
-- ? has key
-- ?| has any key
-- ?& has all keys

-- Example queries using index
SELECT * FROM products WHERE attributes @> '{"brand": "Dell"}';
SELECT * FROM products WHERE attributes ? 'warranty';
```

### GIN with jsonb_path_ops

```sql
-- More compact, faster for @> only
CREATE INDEX idx_products_attr_path ON products 
USING GIN (attributes jsonb_path_ops);

-- Only supports @> containment
SELECT * FROM products WHERE attributes @> '{"brand": "Dell"}';
```

### B-tree Index on Extracted Value

```sql
-- Index specific JSON path as extracted value
CREATE INDEX idx_products_brand ON products ((attributes->>'brand'));

-- Supports equality and comparison
SELECT * FROM products WHERE attributes->>'brand' = 'Dell';
SELECT * FROM products WHERE attributes->>'brand' LIKE 'D%';

-- Functional index for nested value
CREATE INDEX idx_products_ram ON products (((attributes->'specs'->>'ram')::INTEGER));

-- Supports range queries
SELECT * FROM products WHERE (attributes->'specs'->>'ram')::INTEGER > 8;
```

### Expression Index

```sql
-- Index computed values
CREATE INDEX idx_products_colors_count ON products 
((jsonb_array_length(attributes->'colors')));

SELECT * FROM products 
WHERE jsonb_array_length(attributes->'colors') > 2;
```

---

## Practical Examples

### Flexible Schema

```sql
-- E-commerce with variable attributes
CREATE TABLE catalog (
    id SERIAL PRIMARY KEY,
    product_type VARCHAR(50),
    name VARCHAR(200),
    price NUMERIC(10,2),
    attributes JSONB
);

INSERT INTO catalog (product_type, name, price, attributes) VALUES
('laptop', 'MacBook Pro', 2499.99, '{
    "brand": "Apple",
    "screen_size": 14,
    "ram": 16,
    "storage": 512,
    "processor": "M3 Pro"
}'),
('clothing', 'T-Shirt', 29.99, '{
    "brand": "Nike",
    "size": ["S", "M", "L", "XL"],
    "color": "blue",
    "material": "cotton"
}'),
('book', 'PostgreSQL Guide', 49.99, '{
    "author": "John Doe",
    "isbn": "978-3-16-148410-0",
    "pages": 450,
    "format": ["hardcover", "ebook"]
}');

-- Query by product type with specific attributes
SELECT name, price, attributes->>'brand' AS brand
FROM catalog
WHERE product_type = 'laptop'
  AND (attributes->>'ram')::INTEGER >= 16;
```

### Event Storage

```sql
-- Event sourcing pattern
CREATE TABLE events (
    id BIGSERIAL PRIMARY KEY,
    aggregate_id UUID,
    event_type VARCHAR(100),
    payload JSONB,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_events_aggregate ON events(aggregate_id, created_at);
CREATE INDEX idx_events_type ON events(event_type);
CREATE INDEX idx_events_payload ON events USING GIN (payload);

INSERT INTO events (aggregate_id, event_type, payload) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'OrderCreated', '{
    "customer_id": 123,
    "items": [
        {"product_id": 1, "quantity": 2, "price": 29.99},
        {"product_id": 5, "quantity": 1, "price": 149.99}
    ],
    "total": 209.97
}'),
('550e8400-e29b-41d4-a716-446655440000', 'PaymentReceived', '{
    "amount": 209.97,
    "method": "credit_card",
    "transaction_id": "txn_abc123"
}');

-- Query events for an aggregate
SELECT * FROM events 
WHERE aggregate_id = '550e8400-e29b-41d4-a716-446655440000'
ORDER BY created_at;

-- Find all payment events over $100
SELECT * FROM events
WHERE event_type = 'PaymentReceived'
  AND (payload->>'amount')::NUMERIC > 100;
```

### User Preferences

```sql
-- Store user settings as JSONB
CREATE TABLE user_preferences (
    user_id INTEGER PRIMARY KEY REFERENCES users(id),
    preferences JSONB DEFAULT '{
        "theme": "light",
        "notifications": {
            "email": true,
            "push": true,
            "sms": false
        },
        "language": "en"
    }'
);

-- Update specific preference
UPDATE user_preferences
SET preferences = jsonb_set(
    preferences,
    '{notifications,sms}',
    'true'
)
WHERE user_id = 1;

-- Get specific setting
SELECT preferences->>'theme' AS theme,
       preferences->'notifications'->>'email' AS email_notifications
FROM user_preferences
WHERE user_id = 1;

-- Find users with specific settings
SELECT user_id FROM user_preferences
WHERE preferences @> '{"notifications": {"email": true}}';
```

### API Response Storage

```sql
-- Cache API responses
CREATE TABLE api_cache (
    id SERIAL PRIMARY KEY,
    endpoint VARCHAR(500),
    params JSONB,
    response JSONB,
    cached_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX idx_api_cache_lookup 
ON api_cache(endpoint, params);

-- Upsert cache entry
INSERT INTO api_cache (endpoint, params, response, expires_at)
VALUES (
    '/api/weather',
    '{"city": "New York", "units": "metric"}',
    '{"temp": 22, "humidity": 65, "conditions": "sunny"}',
    NOW() + INTERVAL '1 hour'
)
ON CONFLICT (endpoint, params) DO UPDATE SET
    response = EXCLUDED.response,
    cached_at = NOW(),
    expires_at = EXCLUDED.expires_at;

-- Get cached response
SELECT response FROM api_cache
WHERE endpoint = '/api/weather'
  AND params = '{"city": "New York", "units": "metric"}'
  AND expires_at > NOW();
```

### Dynamic Form Data

```sql
-- Store form submissions with variable fields
CREATE TABLE form_submissions (
    id SERIAL PRIMARY KEY,
    form_id INTEGER REFERENCES forms(id),
    submitted_by INTEGER REFERENCES users(id),
    data JSONB,
    submitted_at TIMESTAMPTZ DEFAULT NOW()
);

-- Validate required fields with constraint
ALTER TABLE form_submissions ADD CONSTRAINT required_fields
CHECK (
    data ? 'email' AND
    data ? 'name'
);

-- Query submissions
SELECT 
    id,
    data->>'name' AS name,
    data->>'email' AS email,
    data->'answers' AS survey_answers
FROM form_submissions
WHERE form_id = 1
  AND (data->>'email') LIKE '%@company.com';
```

---

## JSON Schema Validation

PostgreSQL doesn't have built-in JSON Schema validation, but you can implement it:

```sql
-- Simple validation function
CREATE OR REPLACE FUNCTION validate_product_json(data JSONB)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check required fields
    IF NOT (data ? 'brand') THEN
        RAISE EXCEPTION 'Missing required field: brand';
    END IF;
    
    -- Check types
    IF jsonb_typeof(data->'specs') != 'object' THEN
        RAISE EXCEPTION 'specs must be an object';
    END IF;
    
    IF data ? 'colors' AND jsonb_typeof(data->'colors') != 'array' THEN
        RAISE EXCEPTION 'colors must be an array';
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Use in constraint
ALTER TABLE products ADD CONSTRAINT valid_attributes
CHECK (validate_product_json(attributes));
```

---

## Best Practices

### 1. Use JSONB Over JSON

```sql
-- Always use JSONB unless you need exact text preservation
attributes JSONB DEFAULT '{}'
```

### 2. Index Appropriately

```sql
-- For containment queries: GIN
CREATE INDEX idx_attributes ON products USING GIN (attributes);

-- For specific field queries: B-tree on expression
CREATE INDEX idx_brand ON products ((attributes->>'brand'));
```

### 3. Don't Over-use JSON

```sql
-- Bad: Everything in JSON
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    data JSONB  -- customer, items, shipping, billing all in here
);

-- Good: Relational structure with JSON for flexible parts
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id),
    status VARCHAR(20),
    total NUMERIC(10,2),
    metadata JSONB  -- Only flexible/optional data
);
```

### 4. Validate at Application Layer

```sql
-- JSON schema validation is better handled in application code
-- Use database constraints for basic validation only
```

---

## Practice Exercises

### Exercise 1: Basic JSON Operations
1. Create a table with JSONB column
2. Insert data with nested objects and arrays
3. Query using arrow operators

### Exercise 2: JSONB Functions
1. Use jsonb_build_object to construct JSON
2. Extract array elements with jsonb_array_elements
3. Aggregate data into JSON

### Exercise 3: Indexing
1. Create GIN index for containment queries
2. Create expression index for specific field
3. Compare query performance

### Exercise 4: Real-World Scenario
1. Design a schema for product attributes
2. Implement search across JSON fields
3. Build aggregation reports from JSON data

---

## Summary

In this chapter, you learned:
- ✅ JSON vs JSONB differences
- ✅ Arrow operators for accessing data
- ✅ Containment and existence operators
- ✅ Modifying JSON with jsonb_set, ||, -
- ✅ JSON functions for building and extracting
- ✅ Indexing strategies for JSONB
- ✅ Practical use cases and patterns

---

**Next Chapter:** [Advanced Topics →](./16-Advanced-Topics.md)




