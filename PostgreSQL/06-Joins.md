# Chapter 6: Joins 🔗

Joins combine rows from two or more tables based on related columns. Understanding joins is essential for working with relational databases.

---

## Sample Data Setup

```sql
-- Create sample tables
CREATE TABLE departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    budget NUMERIC(12,2)
);

CREATE TABLE employees (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    department_id INTEGER REFERENCES departments(id),
    manager_id INTEGER REFERENCES employees(id),
    salary NUMERIC(10,2),
    hire_date DATE DEFAULT CURRENT_DATE
);

CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    department_id INTEGER REFERENCES departments(id),
    budget NUMERIC(12,2),
    start_date DATE,
    end_date DATE
);

CREATE TABLE employee_projects (
    employee_id INTEGER REFERENCES employees(id),
    project_id INTEGER REFERENCES projects(id),
    role VARCHAR(50),
    hours_allocated INTEGER,
    PRIMARY KEY (employee_id, project_id)
);

-- Insert sample data
INSERT INTO departments (name, budget) VALUES
    ('Engineering', 500000),
    ('Marketing', 200000),
    ('Sales', 300000),
    ('HR', 100000),
    ('Research', 400000);

INSERT INTO employees (name, email, department_id, salary) VALUES
    ('Alice Chen', 'alice@company.com', 1, 95000),
    ('Bob Smith', 'bob@company.com', 1, 85000),
    ('Carol White', 'carol@company.com', 2, 75000),
    ('David Brown', 'david@company.com', 3, 70000),
    ('Eva Martinez', 'eva@company.com', 1, 90000),
    ('Frank Wilson', 'frank@company.com', NULL, 65000),  -- No department
    ('Grace Lee', 'grace@company.com', 3, 72000);

-- Set managers
UPDATE employees SET manager_id = 1 WHERE id IN (2, 5);
UPDATE employees SET manager_id = 3 WHERE id = 4;

INSERT INTO projects (name, department_id, budget, start_date, end_date) VALUES
    ('Website Redesign', 1, 50000, '2024-01-01', '2024-06-30'),
    ('Mobile App', 1, 100000, '2024-03-01', '2024-12-31'),
    ('Marketing Campaign', 2, 30000, '2024-02-01', '2024-04-30'),
    ('Sales Training', 3, 15000, '2024-01-15', '2024-02-28'),
    ('AI Research', 5, 200000, '2024-01-01', '2025-12-31');

INSERT INTO employee_projects (employee_id, project_id, role, hours_allocated) VALUES
    (1, 1, 'Lead', 200),
    (1, 2, 'Architect', 100),
    (2, 1, 'Developer', 300),
    (2, 2, 'Developer', 200),
    (3, 3, 'Manager', 150),
    (4, 4, 'Coordinator', 100),
    (5, 2, 'Developer', 250);
```

---

## INNER JOIN

Returns only rows that have matching values in both tables.

```sql
-- Basic INNER JOIN
SELECT 
    e.name AS employee,
    d.name AS department
FROM employees e
INNER JOIN departments d ON e.department_id = d.id;

-- Result: Only employees WITH a department (Frank excluded)
-- Alice Chen     | Engineering
-- Bob Smith      | Engineering
-- Carol White    | Marketing
-- David Brown    | Sales
-- Eva Martinez   | Engineering
-- Grace Lee      | Sales

-- INNER JOIN is the default, these are equivalent:
SELECT e.name, d.name 
FROM employees e 
JOIN departments d ON e.department_id = d.id;

-- Multiple conditions
SELECT e.name, d.name
FROM employees e
INNER JOIN departments d 
    ON e.department_id = d.id 
    AND d.budget > 200000;

-- Multiple tables
SELECT 
    e.name AS employee,
    d.name AS department,
    p.name AS project,
    ep.role
FROM employees e
INNER JOIN departments d ON e.department_id = d.id
INNER JOIN employee_projects ep ON e.id = ep.employee_id
INNER JOIN projects p ON ep.project_id = p.id;

-- Using USING (when column names match)
SELECT e.name, d.name
FROM employees e
INNER JOIN departments d USING (id);  -- ⚠️ This won't work as intended
-- USING works when joining column has same name in both tables

-- Natural JOIN (joins on all matching column names - avoid!)
SELECT * FROM employees NATURAL JOIN departments;  -- Not recommended
```

---

## LEFT JOIN (LEFT OUTER JOIN)

Returns all rows from the left table, with matching rows from right table (NULL if no match).

```sql
-- Basic LEFT JOIN
SELECT 
    e.name AS employee,
    d.name AS department
FROM employees e
LEFT JOIN departments d ON e.department_id = d.id;

-- Result: ALL employees, even those without department
-- Alice Chen     | Engineering
-- Bob Smith      | Engineering
-- Carol White    | Marketing
-- David Brown    | Sales
-- Eva Martinez   | Engineering
-- Frank Wilson   | NULL          <-- No department
-- Grace Lee      | Sales

-- Find employees WITHOUT a department
SELECT e.name
FROM employees e
LEFT JOIN departments d ON e.department_id = d.id
WHERE d.id IS NULL;

-- Multiple LEFT JOINs
SELECT 
    e.name AS employee,
    d.name AS department,
    m.name AS manager
FROM employees e
LEFT JOIN departments d ON e.department_id = d.id
LEFT JOIN employees m ON e.manager_id = m.id;

-- LEFT JOIN with aggregation
SELECT 
    d.name AS department,
    COUNT(e.id) AS employee_count,
    COALESCE(SUM(e.salary), 0) AS total_salary
FROM departments d
LEFT JOIN employees e ON d.id = e.department_id
GROUP BY d.id, d.name
ORDER BY employee_count DESC;

-- Result includes departments with 0 employees
-- Engineering | 3 | 270000
-- Sales       | 2 | 142000
-- Marketing   | 1 | 75000
-- HR          | 0 | 0
-- Research    | 0 | 0
```

---

## RIGHT JOIN (RIGHT OUTER JOIN)

Returns all rows from the right table, with matching rows from left table.

```sql
-- Basic RIGHT JOIN
SELECT 
    e.name AS employee,
    d.name AS department
FROM employees e
RIGHT JOIN departments d ON e.department_id = d.id;

-- Result: ALL departments, even those without employees
-- Alice Chen     | Engineering
-- Bob Smith      | Engineering
-- Eva Martinez   | Engineering
-- Carol White    | Marketing
-- David Brown    | Sales
-- Grace Lee      | Sales
-- NULL           | HR           <-- No employees
-- NULL           | Research     <-- No employees

-- RIGHT JOIN is less common, usually rewritten as LEFT JOIN
-- These are equivalent:
SELECT e.name, d.name
FROM employees e
RIGHT JOIN departments d ON e.department_id = d.id;

SELECT e.name, d.name
FROM departments d
LEFT JOIN employees e ON e.department_id = d.id;
```

---

## FULL OUTER JOIN

Returns all rows from both tables, with NULLs where there's no match.

```sql
-- Basic FULL OUTER JOIN
SELECT 
    e.name AS employee,
    d.name AS department
FROM employees e
FULL OUTER JOIN departments d ON e.department_id = d.id;

-- Result: ALL employees AND all departments
-- Alice Chen     | Engineering
-- Bob Smith      | Engineering
-- Carol White    | Marketing
-- David Brown    | Sales
-- Eva Martinez   | Engineering
-- Frank Wilson   | NULL          <-- Employee without department
-- Grace Lee      | Sales
-- NULL           | HR            <-- Department without employees
-- NULL           | Research      <-- Department without employees

-- Find unmatched rows from both sides
SELECT 
    e.name AS employee,
    d.name AS department
FROM employees e
FULL OUTER JOIN departments d ON e.department_id = d.id
WHERE e.id IS NULL OR d.id IS NULL;

-- FULL OUTER JOIN use case: Data reconciliation
-- Find discrepancies between two data sources
SELECT 
    COALESCE(a.id, b.id) AS id,
    a.value AS source_a,
    b.value AS source_b,
    CASE 
        WHEN a.id IS NULL THEN 'Missing in A'
        WHEN b.id IS NULL THEN 'Missing in B'
        WHEN a.value != b.value THEN 'Mismatch'
        ELSE 'Match'
    END AS status
FROM source_a a
FULL OUTER JOIN source_b b ON a.id = b.id;
```

---

## CROSS JOIN

Returns Cartesian product (every row from first table combined with every row from second table).

```sql
-- Basic CROSS JOIN
SELECT 
    e.name AS employee,
    d.name AS department
FROM employees e
CROSS JOIN departments d;

-- With 7 employees and 5 departments = 35 rows

-- Equivalent syntax
SELECT e.name, d.name
FROM employees e, departments d;

-- Practical use: Generate combinations
-- All possible employee-project assignments
SELECT 
    e.name,
    p.name
FROM employees e
CROSS JOIN projects p
WHERE e.department_id = p.department_id;

-- Generate date ranges
SELECT 
    generate_series(
        '2024-01-01'::date, 
        '2024-01-07'::date, 
        '1 day'::interval
    )::date AS date;

-- Combine with data
SELECT 
    d.date,
    u.name
FROM generate_series('2024-01-01', '2024-01-03', '1 day') AS d(date)
CROSS JOIN (SELECT name FROM employees LIMIT 3) u;
```

---

## SELF JOIN

A table joined to itself. Useful for hierarchical data.

```sql
-- Find employees and their managers
SELECT 
    e.name AS employee,
    e.salary AS employee_salary,
    m.name AS manager,
    m.salary AS manager_salary
FROM employees e
LEFT JOIN employees m ON e.manager_id = m.id;

-- Find employees who earn more than their manager
SELECT 
    e.name AS employee,
    e.salary AS employee_salary,
    m.name AS manager,
    m.salary AS manager_salary
FROM employees e
JOIN employees m ON e.manager_id = m.id
WHERE e.salary > m.salary;

-- Find employees in the same department
SELECT 
    e1.name AS employee1,
    e2.name AS employee2,
    d.name AS department
FROM employees e1
JOIN employees e2 ON e1.department_id = e2.department_id AND e1.id < e2.id
JOIN departments d ON e1.department_id = d.id
ORDER BY department;

-- Hierarchy: Find all reports (direct and indirect)
WITH RECURSIVE employee_hierarchy AS (
    -- Base case: top-level employees (no manager)
    SELECT id, name, manager_id, 1 AS level, ARRAY[name] AS path
    FROM employees
    WHERE manager_id IS NULL
    
    UNION ALL
    
    -- Recursive case: employees with managers
    SELECT e.id, e.name, e.manager_id, h.level + 1, h.path || e.name
    FROM employees e
    JOIN employee_hierarchy h ON e.manager_id = h.id
)
SELECT 
    REPEAT('  ', level - 1) || name AS employee,
    level,
    array_to_string(path, ' > ') AS reporting_chain
FROM employee_hierarchy
ORDER BY path;
```

---

## LATERAL JOIN

Allows subquery to reference columns from preceding tables (like a correlated subquery but as a join).

```sql
-- Find top 2 highest paid employees per department
SELECT 
    d.name AS department,
    top_employees.name AS employee,
    top_employees.salary
FROM departments d
CROSS JOIN LATERAL (
    SELECT e.name, e.salary
    FROM employees e
    WHERE e.department_id = d.id
    ORDER BY e.salary DESC
    LIMIT 2
) top_employees;

-- Without LATERAL, would need window functions
-- This is cleaner and often faster

-- Get latest project for each department
SELECT 
    d.name AS department,
    latest.name AS latest_project,
    latest.start_date
FROM departments d
LEFT JOIN LATERAL (
    SELECT p.name, p.start_date
    FROM projects p
    WHERE p.department_id = d.id
    ORDER BY p.start_date DESC
    LIMIT 1
) latest ON true;

-- Expand arrays with LATERAL
SELECT 
    e.name,
    tag
FROM employees e,
LATERAL unnest(ARRAY['developer', 'senior']::text[]) AS tag
WHERE e.department_id = 1;

-- LATERAL with function that returns set
SELECT 
    e.name,
    ep.*
FROM employees e,
LATERAL (
    SELECT p.name, ep.role, ep.hours_allocated
    FROM employee_projects ep
    JOIN projects p ON ep.project_id = p.id
    WHERE ep.employee_id = e.id
) ep;
```

---

## JOIN Conditions and Operators

### Multiple Join Conditions

```sql
-- AND in join condition
SELECT *
FROM employees e
JOIN departments d 
    ON e.department_id = d.id 
    AND d.budget > 200000;

-- OR in join condition (less common)
SELECT *
FROM employees e
JOIN departments d 
    ON e.department_id = d.id 
    OR e.name LIKE '%' || d.name || '%';
```

### Non-Equality Joins

```sql
-- Range join: Find salary bands
CREATE TABLE salary_bands (
    id SERIAL PRIMARY KEY,
    band_name VARCHAR(50),
    min_salary NUMERIC(10,2),
    max_salary NUMERIC(10,2)
);

INSERT INTO salary_bands (band_name, min_salary, max_salary) VALUES
    ('Entry', 0, 60000),
    ('Junior', 60001, 75000),
    ('Mid', 75001, 90000),
    ('Senior', 90001, 120000);

SELECT 
    e.name,
    e.salary,
    sb.band_name
FROM employees e
JOIN salary_bands sb 
    ON e.salary BETWEEN sb.min_salary AND sb.max_salary;

-- Less than / Greater than joins
-- Find all employees hired before each project started
SELECT 
    e.name AS employee,
    e.hire_date,
    p.name AS project,
    p.start_date
FROM employees e
JOIN projects p ON e.hire_date < p.start_date
ORDER BY p.start_date, e.hire_date;
```

### Anti-Join Pattern

```sql
-- Find records in one table that don't exist in another

-- Method 1: LEFT JOIN + NULL check (most readable)
SELECT e.*
FROM employees e
LEFT JOIN employee_projects ep ON e.id = ep.employee_id
WHERE ep.employee_id IS NULL;

-- Method 2: NOT EXISTS (often fastest)
SELECT e.*
FROM employees e
WHERE NOT EXISTS (
    SELECT 1 FROM employee_projects ep WHERE ep.employee_id = e.id
);

-- Method 3: NOT IN (avoid with NULLs!)
SELECT e.*
FROM employees e
WHERE e.id NOT IN (
    SELECT employee_id FROM employee_projects WHERE employee_id IS NOT NULL
);

-- Find employees not assigned to any project
SELECT e.name
FROM employees e
LEFT JOIN employee_projects ep ON e.id = ep.employee_id
WHERE ep.project_id IS NULL;
```

### Semi-Join Pattern

```sql
-- Find records that have at least one match in another table
-- (without duplicating rows)

-- Method 1: EXISTS (recommended)
SELECT e.*
FROM employees e
WHERE EXISTS (
    SELECT 1 FROM employee_projects ep WHERE ep.employee_id = e.id
);

-- Method 2: IN
SELECT e.*
FROM employees e
WHERE e.id IN (SELECT employee_id FROM employee_projects);

-- Method 3: DISTINCT with JOIN (less efficient)
SELECT DISTINCT e.*
FROM employees e
JOIN employee_projects ep ON e.id = ep.employee_id;
```

---

## JOIN Performance

### Index Usage

```sql
-- Ensure indexes exist on join columns
CREATE INDEX idx_employees_department_id ON employees(department_id);
CREATE INDEX idx_employee_projects_employee_id ON employee_projects(employee_id);
CREATE INDEX idx_employee_projects_project_id ON employee_projects(project_id);

-- Composite index for frequent join + filter patterns
CREATE INDEX idx_emp_dept_salary ON employees(department_id, salary);
```

### EXPLAIN Analysis

```sql
-- Analyze join performance
EXPLAIN ANALYZE
SELECT e.name, d.name
FROM employees e
JOIN departments d ON e.department_id = d.id;

-- Look for:
-- - Join type: Hash Join, Merge Join, Nested Loop
-- - Sequential scans vs Index scans
-- - Estimated vs actual row counts
```

### Join Order Hints

```sql
-- PostgreSQL usually optimizes join order automatically
-- But you can influence it:

-- Reduce search space (for many tables)
SET join_collapse_limit = 8;  -- Default
SET from_collapse_limit = 8;  -- Default

-- For very complex queries, explicit join order might help
-- Use parentheses to control order
SELECT *
FROM (employees e JOIN departments d ON e.department_id = d.id)
JOIN projects p ON d.id = p.department_id;
```

---

## Common Join Patterns

### Master-Detail

```sql
-- Orders with items
SELECT 
    o.id AS order_id,
    o.order_date,
    oi.product_name,
    oi.quantity,
    oi.unit_price,
    oi.quantity * oi.unit_price AS line_total
FROM orders o
JOIN order_items oi ON o.id = oi.order_id
ORDER BY o.id, oi.id;
```

### Many-to-Many

```sql
-- Employees with their projects
SELECT 
    e.name AS employee,
    p.name AS project,
    ep.role,
    ep.hours_allocated
FROM employees e
JOIN employee_projects ep ON e.id = ep.employee_id
JOIN projects p ON ep.project_id = p.id
ORDER BY e.name, p.name;
```

### Aggregation with Join

```sql
-- Department summary
SELECT 
    d.name AS department,
    COUNT(e.id) AS employee_count,
    AVG(e.salary)::NUMERIC(10,2) AS avg_salary,
    SUM(e.salary) AS total_salary
FROM departments d
LEFT JOIN employees e ON d.id = e.department_id
GROUP BY d.id, d.name
ORDER BY total_salary DESC NULLS LAST;

-- Project assignments summary
SELECT 
    p.name AS project,
    COUNT(ep.employee_id) AS team_size,
    SUM(ep.hours_allocated) AS total_hours
FROM projects p
LEFT JOIN employee_projects ep ON p.id = ep.project_id
GROUP BY p.id, p.name
ORDER BY team_size DESC;
```

### Pivot-like Queries

```sql
-- Employee skills matrix
SELECT 
    e.name,
    SUM(CASE WHEN p.department_id = 1 THEN ep.hours_allocated ELSE 0 END) AS eng_hours,
    SUM(CASE WHEN p.department_id = 2 THEN ep.hours_allocated ELSE 0 END) AS mkt_hours,
    SUM(CASE WHEN p.department_id = 3 THEN ep.hours_allocated ELSE 0 END) AS sales_hours
FROM employees e
LEFT JOIN employee_projects ep ON e.id = ep.employee_id
LEFT JOIN projects p ON ep.project_id = p.id
GROUP BY e.id, e.name;
```

---

## Practice Exercises

### Exercise 1: Basic Joins
1. List all employees with their department names
2. Find departments that have no employees
3. List all projects with their department names

### Exercise 2: Complex Joins
1. Find employees who work on multiple projects
2. List employees who don't work on any project
3. Show each project with total allocated hours and team members

### Exercise 3: Self Join
1. List all employees with their manager's name
2. Find employees who earn more than their manager
3. Build a reporting hierarchy showing levels

### Exercise 4: Performance
1. Analyze a join query with EXPLAIN ANALYZE
2. Add appropriate indexes
3. Compare query times before and after

---

## Summary

In this chapter, you learned:
- ✅ INNER JOIN - Matching rows only
- ✅ LEFT/RIGHT JOIN - All from one side, matching from other
- ✅ FULL OUTER JOIN - All rows from both sides
- ✅ CROSS JOIN - Cartesian product
- ✅ SELF JOIN - Table joined to itself
- ✅ LATERAL JOIN - Subquery referencing outer query
- ✅ Anti-join and semi-join patterns
- ✅ Performance considerations

---

**Next Chapter:** [Aggregations & Grouping →](./07-Aggregations-Grouping.md)



