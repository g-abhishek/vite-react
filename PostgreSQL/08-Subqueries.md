# Chapter 8: Subqueries & CTEs 🔍

Subqueries (nested queries) and Common Table Expressions (CTEs) allow you to build complex queries from simpler components.

---

## What is a Subquery?

A subquery is a query nested inside another query. It can appear in SELECT, FROM, WHERE, or HAVING clauses.

```sql
-- Simple example: Find employees earning above average
SELECT name, salary
FROM employees
WHERE salary > (SELECT AVG(salary) FROM employees);
```

---

## Scalar Subqueries

Return a single value (one row, one column).

```sql
-- In SELECT clause
SELECT 
    name,
    salary,
    (SELECT AVG(salary) FROM employees) AS avg_salary,
    salary - (SELECT AVG(salary) FROM employees) AS diff_from_avg
FROM employees;

-- In WHERE clause
SELECT name, salary
FROM employees
WHERE salary = (SELECT MAX(salary) FROM employees);

-- In HAVING clause
SELECT department_id, AVG(salary) AS dept_avg
FROM employees
GROUP BY department_id
HAVING AVG(salary) > (SELECT AVG(salary) FROM employees);

-- Scalar subquery must return exactly ONE value
-- ✗ ERROR if subquery returns multiple rows
SELECT name FROM employees WHERE salary = (SELECT salary FROM employees);
```

### Correlated Scalar Subquery

References columns from the outer query.

```sql
-- Find employees earning more than their department's average
SELECT e.name, e.salary, e.department_id
FROM employees e
WHERE e.salary > (
    SELECT AVG(salary) 
    FROM employees 
    WHERE department_id = e.department_id
);

-- Get department name in SELECT
SELECT 
    e.name,
    e.salary,
    (SELECT d.name FROM departments d WHERE d.id = e.department_id) AS dept_name
FROM employees e;
```

---

## Subqueries in FROM (Derived Tables)

Treat subquery result as a table.

```sql
-- Basic derived table
SELECT avg_salaries.department_id, avg_salaries.avg_sal
FROM (
    SELECT department_id, AVG(salary) AS avg_sal
    FROM employees
    GROUP BY department_id
) AS avg_salaries
WHERE avg_salaries.avg_sal > 50000;

-- Join with derived table
SELECT e.name, e.salary, dept_stats.avg_salary
FROM employees e
JOIN (
    SELECT department_id, AVG(salary) AS avg_salary
    FROM employees
    GROUP BY department_id
) dept_stats ON e.department_id = dept_stats.department_id
WHERE e.salary > dept_stats.avg_salary;

-- Multiple derived tables
SELECT 
    h.department_id,
    h.highest_salary,
    l.lowest_salary
FROM (
    SELECT department_id, MAX(salary) AS highest_salary
    FROM employees
    GROUP BY department_id
) h
JOIN (
    SELECT department_id, MIN(salary) AS lowest_salary
    FROM employees
    GROUP BY department_id
) l ON h.department_id = l.department_id;
```

---

## Subqueries in WHERE

### IN Operator

```sql
-- Find employees in Engineering or Sales departments
SELECT name, department_id
FROM employees
WHERE department_id IN (
    SELECT id FROM departments WHERE name IN ('Engineering', 'Sales')
);

-- Find products that have been ordered
SELECT name FROM products
WHERE id IN (SELECT DISTINCT product_id FROM order_items);

-- NOT IN (careful with NULLs!)
SELECT name FROM products
WHERE id NOT IN (
    SELECT product_id FROM order_items 
    WHERE product_id IS NOT NULL  -- Important!
);
```

### EXISTS Operator

Checks if subquery returns any rows (often faster than IN).

```sql
-- Find customers who have placed orders
SELECT c.name
FROM customers c
WHERE EXISTS (
    SELECT 1 FROM orders o WHERE o.customer_id = c.id
);

-- Find customers who have NOT placed orders
SELECT c.name
FROM customers c
WHERE NOT EXISTS (
    SELECT 1 FROM orders o WHERE o.customer_id = c.id
);

-- EXISTS vs IN performance
-- EXISTS stops at first match (short-circuits)
-- EXISTS handles NULLs better
-- Use EXISTS for large subquery results
-- Use IN for small lists of values

-- EXISTS with correlated subquery
SELECT d.name
FROM departments d
WHERE EXISTS (
    SELECT 1 
    FROM employees e 
    WHERE e.department_id = d.id AND e.salary > 100000
);
```

### ANY / SOME Operator

```sql
-- Salary greater than ANY salary in department 1
SELECT name, salary
FROM employees
WHERE salary > ANY (
    SELECT salary FROM employees WHERE department_id = 1
);

-- Equivalent to:
WHERE salary > (SELECT MIN(salary) FROM employees WHERE department_id = 1)

-- = ANY is equivalent to IN
SELECT name FROM employees
WHERE department_id = ANY (SELECT id FROM departments WHERE budget > 200000);
```

### ALL Operator

```sql
-- Salary greater than ALL salaries in department 1
SELECT name, salary
FROM employees
WHERE salary > ALL (
    SELECT salary FROM employees WHERE department_id = 1
);

-- Equivalent to:
WHERE salary > (SELECT MAX(salary) FROM employees WHERE department_id = 1)

-- <> ALL is equivalent to NOT IN
SELECT name FROM employees
WHERE department_id <> ALL (SELECT id FROM departments WHERE budget < 100000);
```

---

## Common Table Expressions (CTEs)

CTEs define temporary named result sets. More readable than nested subqueries.

### Basic CTE

```sql
-- WITH clause defines the CTE
WITH high_earners AS (
    SELECT name, salary, department_id
    FROM employees
    WHERE salary > 80000
)
SELECT * FROM high_earners;

-- CTE with join
WITH dept_summary AS (
    SELECT 
        department_id,
        COUNT(*) AS emp_count,
        AVG(salary) AS avg_salary
    FROM employees
    GROUP BY department_id
)
SELECT 
    d.name AS department,
    ds.emp_count,
    ds.avg_salary
FROM departments d
JOIN dept_summary ds ON d.id = ds.department_id
ORDER BY ds.avg_salary DESC;
```

### Multiple CTEs

```sql
-- Chain multiple CTEs
WITH 
    dept_totals AS (
        SELECT 
            department_id,
            SUM(salary) AS total_salary
        FROM employees
        GROUP BY department_id
    ),
    top_depts AS (
        SELECT department_id
        FROM dept_totals
        WHERE total_salary > 200000
    )
SELECT e.name, e.salary
FROM employees e
WHERE e.department_id IN (SELECT department_id FROM top_depts);

-- CTEs can reference previous CTEs
WITH 
    raw_data AS (
        SELECT * FROM sales WHERE sale_date >= '2024-01-01'
    ),
    aggregated AS (
        SELECT category, SUM(amount) AS total
        FROM raw_data
        GROUP BY category
    ),
    ranked AS (
        SELECT 
            category, 
            total,
            RANK() OVER (ORDER BY total DESC) AS rnk
        FROM aggregated
    )
SELECT * FROM ranked WHERE rnk <= 3;
```

### CTE vs Subquery

```sql
-- Subquery (harder to read)
SELECT e.name, e.salary
FROM employees e
WHERE e.department_id IN (
    SELECT department_id
    FROM (
        SELECT department_id, SUM(salary) AS total
        FROM employees
        GROUP BY department_id
    ) totals
    WHERE total > 200000
);

-- CTE (easier to read and maintain)
WITH dept_totals AS (
    SELECT department_id, SUM(salary) AS total
    FROM employees
    GROUP BY department_id
)
SELECT e.name, e.salary
FROM employees e
WHERE e.department_id IN (
    SELECT department_id FROM dept_totals WHERE total > 200000
);

-- Benefits of CTEs:
-- 1. Improved readability
-- 2. Can reference multiple times
-- 3. Self-documenting with descriptive names
-- 4. Easier to debug and maintain
```

---

## Recursive CTEs

For hierarchical or graph data.

### Basic Recursion

```sql
-- Generate number sequence
WITH RECURSIVE numbers AS (
    -- Base case (anchor)
    SELECT 1 AS n
    
    UNION ALL
    
    -- Recursive case
    SELECT n + 1 FROM numbers WHERE n < 10
)
SELECT * FROM numbers;
-- 1, 2, 3, 4, 5, 6, 7, 8, 9, 10

-- Generate date series
WITH RECURSIVE dates AS (
    SELECT DATE '2024-01-01' AS d
    UNION ALL
    SELECT d + INTERVAL '1 day' FROM dates WHERE d < '2024-01-31'
)
SELECT d::DATE FROM dates;
```

### Organizational Hierarchy

```sql
-- Employee reporting structure
CREATE TABLE employees (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    manager_id INTEGER REFERENCES employees(id)
);

-- Find all reports under a manager (direct and indirect)
WITH RECURSIVE reports AS (
    -- Base case: direct reports
    SELECT id, name, manager_id, 1 AS level
    FROM employees
    WHERE manager_id = 1  -- Manager ID
    
    UNION ALL
    
    -- Recursive: reports of reports
    SELECT e.id, e.name, e.manager_id, r.level + 1
    FROM employees e
    JOIN reports r ON e.manager_id = r.id
)
SELECT 
    REPEAT('  ', level - 1) || name AS employee,
    level
FROM reports
ORDER BY level, name;

-- Build reporting path
WITH RECURSIVE hierarchy AS (
    SELECT 
        id, 
        name, 
        manager_id, 
        ARRAY[name] AS path,
        1 AS depth
    FROM employees
    WHERE manager_id IS NULL  -- Start from CEO
    
    UNION ALL
    
    SELECT 
        e.id, 
        e.name, 
        e.manager_id, 
        h.path || e.name,
        h.depth + 1
    FROM employees e
    JOIN hierarchy h ON e.manager_id = h.id
)
SELECT 
    name,
    depth,
    array_to_string(path, ' → ') AS reporting_chain
FROM hierarchy
ORDER BY path;
```

### Category Tree

```sql
-- Nested categories
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    parent_id INTEGER REFERENCES categories(id)
);

INSERT INTO categories (name, parent_id) VALUES
    ('Electronics', NULL),
    ('Computers', 1),
    ('Laptops', 2),
    ('Desktops', 2),
    ('Phones', 1),
    ('Smartphones', 5);

-- Get all descendants of a category
WITH RECURSIVE cat_tree AS (
    SELECT id, name, parent_id, 0 AS level
    FROM categories
    WHERE id = 1  -- Starting category
    
    UNION ALL
    
    SELECT c.id, c.name, c.parent_id, ct.level + 1
    FROM categories c
    JOIN cat_tree ct ON c.parent_id = ct.id
)
SELECT 
    REPEAT('  ', level) || name AS category,
    level
FROM cat_tree
ORDER BY level, name;

-- Get path from root to each category
WITH RECURSIVE cat_path AS (
    SELECT id, name, parent_id, name::TEXT AS path
    FROM categories
    WHERE parent_id IS NULL
    
    UNION ALL
    
    SELECT c.id, c.name, c.parent_id, cp.path || ' > ' || c.name
    FROM categories c
    JOIN cat_path cp ON c.parent_id = cp.id
)
SELECT name, path FROM cat_path;
```

### Graph Traversal

```sql
-- Find all connections (friends of friends)
CREATE TABLE friendships (
    person1_id INTEGER,
    person2_id INTEGER,
    PRIMARY KEY (person1_id, person2_id)
);

-- Find all people connected to person 1 within 3 degrees
WITH RECURSIVE connections AS (
    SELECT person2_id AS person_id, 1 AS degree
    FROM friendships
    WHERE person1_id = 1
    
    UNION
    
    SELECT 
        CASE WHEN f.person1_id = c.person_id THEN f.person2_id ELSE f.person1_id END,
        c.degree + 1
    FROM friendships f
    JOIN connections c ON f.person1_id = c.person_id OR f.person2_id = c.person_id
    WHERE c.degree < 3
)
SELECT DISTINCT person_id, MIN(degree) AS shortest_path
FROM connections
WHERE person_id != 1
GROUP BY person_id;
```

### Cycle Detection

```sql
-- Prevent infinite loops in recursive CTEs
WITH RECURSIVE hierarchy AS (
    SELECT 
        id, 
        name, 
        manager_id,
        ARRAY[id] AS visited,  -- Track visited nodes
        false AS has_cycle
    FROM employees
    WHERE manager_id IS NULL
    
    UNION ALL
    
    SELECT 
        e.id, 
        e.name, 
        e.manager_id,
        h.visited || e.id,
        e.id = ANY(h.visited)  -- Detect cycle
    FROM employees e
    JOIN hierarchy h ON e.manager_id = h.id
    WHERE NOT e.id = ANY(h.visited)  -- Don't revisit
)
SELECT * FROM hierarchy WHERE NOT has_cycle;

-- PostgreSQL 14+ has built-in cycle detection
WITH RECURSIVE hierarchy AS (
    SELECT id, name, manager_id
    FROM employees
    WHERE manager_id IS NULL
    
    UNION ALL
    
    SELECT e.id, e.name, e.manager_id
    FROM employees e
    JOIN hierarchy h ON e.manager_id = h.id
)
CYCLE id SET is_cycle USING path  -- Built-in cycle detection
SELECT * FROM hierarchy WHERE NOT is_cycle;
```

---

## Materialized CTEs

By default, PostgreSQL may inline CTEs. Use MATERIALIZED to force computation once.

```sql
-- Force CTE to be computed once
WITH expensive_query AS MATERIALIZED (
    SELECT id, complex_calculation(data) AS result
    FROM large_table
)
SELECT * FROM expensive_query WHERE result > 100
UNION ALL
SELECT * FROM expensive_query WHERE result < -100;

-- Force CTE to be inlined (merged into main query)
WITH simple_filter AS NOT MATERIALIZED (
    SELECT * FROM employees WHERE department_id = 1
)
SELECT * FROM simple_filter WHERE salary > 50000;

-- When to use MATERIALIZED:
-- 1. CTE is used multiple times
-- 2. CTE result is small
-- 3. Want to prevent query planner from inlining

-- When to use NOT MATERIALIZED (or default):
-- 1. CTE is used once
-- 2. Better if planner can see through CTE for optimization
```

---

## Practical Examples

### Running Totals

```sql
-- Calculate running total with CTE
WITH daily_sales AS (
    SELECT 
        sale_date,
        SUM(amount) AS daily_total
    FROM sales
    GROUP BY sale_date
)
SELECT 
    sale_date,
    daily_total,
    SUM(daily_total) OVER (ORDER BY sale_date) AS running_total
FROM daily_sales
ORDER BY sale_date;
```

### Data Transformation

```sql
-- Pivot data using CTEs
WITH category_sales AS (
    SELECT 
        DATE_TRUNC('month', sale_date) AS month,
        category,
        SUM(amount) AS total
    FROM sales
    GROUP BY DATE_TRUNC('month', sale_date), category
)
SELECT 
    month,
    SUM(CASE WHEN category = 'Electronics' THEN total ELSE 0 END) AS electronics,
    SUM(CASE WHEN category = 'Furniture' THEN total ELSE 0 END) AS furniture,
    SUM(total) AS total
FROM category_sales
GROUP BY month
ORDER BY month;
```

### Gap Analysis

```sql
-- Find missing sequence numbers
WITH all_numbers AS (
    SELECT generate_series(
        (SELECT MIN(order_number) FROM orders),
        (SELECT MAX(order_number) FROM orders)
    ) AS num
),
existing AS (
    SELECT order_number FROM orders
)
SELECT num AS missing_order_number
FROM all_numbers
WHERE num NOT IN (SELECT order_number FROM existing);
```

### Bill of Materials (BOM)

```sql
-- Product components with quantities
CREATE TABLE components (
    product_id INTEGER,
    component_id INTEGER,
    quantity INTEGER,
    PRIMARY KEY (product_id, component_id)
);

-- Calculate total components needed
WITH RECURSIVE bom AS (
    -- Direct components
    SELECT 
        product_id AS root_product,
        component_id,
        quantity,
        1 AS level
    FROM components
    WHERE product_id = 100  -- Target product
    
    UNION ALL
    
    -- Sub-components
    SELECT 
        b.root_product,
        c.component_id,
        b.quantity * c.quantity,  -- Multiply quantities
        b.level + 1
    FROM bom b
    JOIN components c ON b.component_id = c.product_id
    WHERE b.level < 10  -- Prevent infinite recursion
)
SELECT 
    component_id,
    SUM(quantity) AS total_needed
FROM bom
GROUP BY component_id
ORDER BY component_id;
```

---

## Subquery Performance Tips

### Use EXISTS Instead of IN

```sql
-- Slower for large subqueries
SELECT * FROM orders WHERE customer_id IN (SELECT id FROM customers WHERE country = 'USA');

-- Faster with EXISTS
SELECT * FROM orders o WHERE EXISTS (
    SELECT 1 FROM customers c WHERE c.id = o.customer_id AND c.country = 'USA'
);
```

### Avoid Correlated Subqueries When Possible

```sql
-- Slow: Executes subquery for each row
SELECT 
    e.name,
    (SELECT d.name FROM departments d WHERE d.id = e.department_id) AS dept
FROM employees e;

-- Fast: Use JOIN instead
SELECT e.name, d.name AS dept
FROM employees e
LEFT JOIN departments d ON e.department_id = d.id;
```

### Use CTEs for Readability, Not Performance

```sql
-- CTEs are not always faster
-- PostgreSQL may not optimize across CTE boundaries
-- Consider using subqueries or joins for performance-critical queries
```

---

## Practice Exercises

### Exercise 1: Basic Subqueries
1. Find employees earning above average
2. List departments with more than 5 employees
3. Find products ordered more than 10 times

### Exercise 2: CTEs
1. Rewrite a complex query using CTEs
2. Calculate percentage of total for each category
3. Create a sales report with subtotals

### Exercise 3: Recursive CTEs
1. Build an org chart from employee data
2. Generate a date calendar for 2024
3. Find all categories under "Electronics"

### Exercise 4: Performance
1. Compare EXISTS vs IN performance
2. Optimize a correlated subquery
3. Analyze a CTE query plan

---

## Summary

In this chapter, you learned:
- ✅ Scalar subqueries in SELECT, WHERE, HAVING
- ✅ Derived tables (subqueries in FROM)
- ✅ EXISTS, IN, ANY, ALL operators
- ✅ Common Table Expressions (CTEs)
- ✅ Recursive CTEs for hierarchical data
- ✅ Cycle detection in recursion
- ✅ MATERIALIZED vs NOT MATERIALIZED CTEs
- ✅ Performance considerations

---

**Next Chapter:** [Window Functions →](./09-Window-Functions.md)




