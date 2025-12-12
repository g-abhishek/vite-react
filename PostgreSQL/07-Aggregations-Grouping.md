# Chapter 7: Aggregations & Grouping 📊

Aggregations summarize data across multiple rows. Combined with GROUP BY, they provide powerful data analysis capabilities.

---

## Basic Aggregate Functions

```sql
-- Sample data setup
CREATE TABLE sales (
    id SERIAL PRIMARY KEY,
    product VARCHAR(100),
    category VARCHAR(50),
    region VARCHAR(50),
    salesperson VARCHAR(100),
    quantity INTEGER,
    amount NUMERIC(12,2),
    sale_date DATE
);

INSERT INTO sales (product, category, region, salesperson, quantity, amount, sale_date) VALUES
('Laptop', 'Electronics', 'North', 'Alice', 5, 6250.00, '2024-01-15'),
('Phone', 'Electronics', 'South', 'Bob', 10, 5000.00, '2024-01-16'),
('Desk', 'Furniture', 'North', 'Alice', 3, 900.00, '2024-01-17'),
('Chair', 'Furniture', 'East', 'Carol', 8, 1200.00, '2024-01-18'),
('Laptop', 'Electronics', 'West', 'David', 2, 2500.00, '2024-01-19'),
('Phone', 'Electronics', 'North', 'Alice', 15, 7500.00, '2024-01-20'),
('Monitor', 'Electronics', 'South', 'Bob', 6, 1800.00, '2024-01-21'),
('Desk', 'Furniture', 'West', 'David', 4, 1200.00, '2024-01-22'),
('Laptop', 'Electronics', 'East', 'Carol', 3, 3750.00, '2024-01-23'),
('Chair', 'Furniture', 'North', 'Alice', 12, 1800.00, '2024-01-24');
```

### COUNT

```sql
-- Count all rows
SELECT COUNT(*) FROM sales;  -- 10

-- Count non-NULL values in column
SELECT COUNT(region) FROM sales;

-- Count distinct values
SELECT COUNT(DISTINCT category) FROM sales;  -- 2
SELECT COUNT(DISTINCT product) FROM sales;   -- 5
SELECT COUNT(DISTINCT salesperson) FROM sales;  -- 4

-- Count with condition (PostgreSQL FILTER)
SELECT 
    COUNT(*) AS total_sales,
    COUNT(*) FILTER (WHERE category = 'Electronics') AS electronics_sales,
    COUNT(*) FILTER (WHERE category = 'Furniture') AS furniture_sales
FROM sales;
```

### SUM

```sql
-- Total of all amounts
SELECT SUM(amount) FROM sales;  -- 31900.00

-- Sum with condition
SELECT SUM(amount) FROM sales WHERE category = 'Electronics';  -- 26800.00

-- Sum using FILTER
SELECT 
    SUM(amount) AS total_revenue,
    SUM(amount) FILTER (WHERE region = 'North') AS north_revenue,
    SUM(quantity) AS total_units
FROM sales;

-- Running sum (requires window function, covered in Chapter 9)
```

### AVG

```sql
-- Average amount
SELECT AVG(amount) FROM sales;  -- 3190.00

-- Average with precision
SELECT AVG(amount)::NUMERIC(10,2) FROM sales;  -- 3190.00
SELECT ROUND(AVG(amount), 2) FROM sales;  -- 3190.00

-- Average ignoring NULLs (automatic)
-- To include NULLs as 0, use COALESCE
SELECT AVG(COALESCE(amount, 0)) FROM sales;

-- Weighted average
SELECT SUM(quantity * amount) / SUM(quantity) AS weighted_avg_price FROM sales;
```

### MIN and MAX

```sql
-- Minimum and maximum
SELECT 
    MIN(amount) AS min_sale,
    MAX(amount) AS max_sale,
    MIN(sale_date) AS first_sale,
    MAX(sale_date) AS last_sale
FROM sales;

-- Works with strings (alphabetical order)
SELECT 
    MIN(product) AS first_alphabetically,
    MAX(product) AS last_alphabetically
FROM sales;
```

### Other Aggregates

```sql
-- String aggregation
SELECT STRING_AGG(DISTINCT product, ', ' ORDER BY product) AS products
FROM sales;
-- "Chair, Desk, Laptop, Monitor, Phone"

-- Array aggregation
SELECT ARRAY_AGG(DISTINCT region ORDER BY region) AS regions
FROM sales;
-- {East,North,South,West}

-- Boolean aggregation
SELECT 
    BOOL_AND(amount > 0) AS all_positive,
    BOOL_OR(amount > 5000) AS any_large_sale
FROM sales;

-- Statistical functions
SELECT 
    STDDEV(amount) AS std_deviation,
    VARIANCE(amount) AS variance,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY amount) AS median
FROM sales;
```

---

## GROUP BY

Groups rows that have the same values in specified columns.

```sql
-- Basic GROUP BY
SELECT 
    category,
    COUNT(*) AS sales_count,
    SUM(amount) AS total_revenue
FROM sales
GROUP BY category;
-- Electronics | 6 | 26800.00
-- Furniture   | 4 | 5100.00

-- GROUP BY multiple columns
SELECT 
    category,
    region,
    COUNT(*) AS sales_count,
    SUM(amount) AS total_revenue
FROM sales
GROUP BY category, region
ORDER BY category, region;

-- GROUP BY with expression
SELECT 
    DATE_TRUNC('week', sale_date) AS week,
    SUM(amount) AS weekly_revenue
FROM sales
GROUP BY DATE_TRUNC('week', sale_date)
ORDER BY week;

-- GROUP BY ordinal position
SELECT 
    category,
    region,
    SUM(amount)
FROM sales
GROUP BY 1, 2;  -- GROUP BY first and second columns

-- GROUP BY with alias (PostgreSQL extension)
SELECT 
    category AS cat,
    SUM(amount) AS total
FROM sales
GROUP BY cat;  -- Works in PostgreSQL
```

### GROUP BY Rules

```sql
-- ✗ ERROR: column must appear in GROUP BY or aggregate function
SELECT category, product, SUM(amount)  -- product not in GROUP BY!
FROM sales
GROUP BY category;

-- ✓ Correct: All non-aggregated columns in GROUP BY
SELECT category, product, SUM(amount)
FROM sales
GROUP BY category, product;

-- ✓ Or use aggregate function on product
SELECT category, STRING_AGG(DISTINCT product, ', ') AS products, SUM(amount)
FROM sales
GROUP BY category;
```

---

## HAVING

Filters groups (like WHERE for aggregated data).

```sql
-- Filter groups by aggregate value
SELECT 
    category,
    SUM(amount) AS total_revenue
FROM sales
GROUP BY category
HAVING SUM(amount) > 10000;

-- Multiple HAVING conditions
SELECT 
    salesperson,
    COUNT(*) AS sales_count,
    SUM(amount) AS total_revenue
FROM sales
GROUP BY salesperson
HAVING COUNT(*) >= 2 AND SUM(amount) > 5000;

-- HAVING with aggregate function not in SELECT
SELECT category
FROM sales
GROUP BY category
HAVING AVG(amount) > 2000;
```

### WHERE vs HAVING

```sql
-- WHERE filters rows BEFORE grouping
-- HAVING filters groups AFTER aggregation

-- Example: Total electronics sales by region, only regions > 5000
SELECT 
    region,
    SUM(amount) AS total
FROM sales
WHERE category = 'Electronics'  -- Filter rows first
GROUP BY region
HAVING SUM(amount) > 5000;      -- Then filter groups

-- Order of execution:
-- 1. FROM
-- 2. WHERE (filter rows)
-- 3. GROUP BY (create groups)
-- 4. HAVING (filter groups)
-- 5. SELECT (compute output)
-- 6. ORDER BY
-- 7. LIMIT

-- Common mistake: Using WHERE with aggregate
-- ✗ WHERE SUM(amount) > 5000  -- ERROR!
-- ✓ HAVING SUM(amount) > 5000
```

---

## GROUPING SETS

Multiple groupings in one query.

```sql
-- Instead of UNION ALL of multiple GROUP BYs
SELECT category, NULL AS region, SUM(amount) FROM sales GROUP BY category
UNION ALL
SELECT NULL, region, SUM(amount) FROM sales GROUP BY region
UNION ALL
SELECT NULL, NULL, SUM(amount) FROM sales;

-- Use GROUPING SETS
SELECT 
    category,
    region,
    SUM(amount) AS total
FROM sales
GROUP BY GROUPING SETS (
    (category),
    (region),
    ()  -- Grand total
)
ORDER BY category NULLS FIRST, region NULLS FIRST;

-- Result:
-- NULL        | NULL  | 31900.00  (grand total)
-- Electronics | NULL  | 26800.00  (category total)
-- Furniture   | NULL  | 5100.00   (category total)
-- NULL        | East  | 4950.00   (region total)
-- NULL        | North | 16450.00  (region total)
-- NULL        | South | 6800.00   (region total)
-- NULL        | West  | 3700.00   (region total)

-- GROUPING function to identify super-aggregates
SELECT 
    CASE WHEN GROUPING(category) = 1 THEN 'All Categories' ELSE category END AS category,
    CASE WHEN GROUPING(region) = 1 THEN 'All Regions' ELSE region END AS region,
    SUM(amount) AS total
FROM sales
GROUP BY GROUPING SETS ((category), (region), ())
ORDER BY GROUPING(category), GROUPING(region);
```

---

## ROLLUP

Hierarchical grouping (subtotals and grand total).

```sql
-- ROLLUP creates subtotals for each level
SELECT 
    category,
    region,
    salesperson,
    SUM(amount) AS total
FROM sales
GROUP BY ROLLUP (category, region, salesperson)
ORDER BY category NULLS FIRST, region NULLS FIRST, salesperson NULLS FIRST;

-- Results include:
-- Grand total (all NULL)
-- Category totals (region, salesperson NULL)
-- Category + Region totals (salesperson NULL)
-- Full detail (no NULLs)

-- Partial ROLLUP
SELECT 
    category,
    region,
    SUM(amount) AS total
FROM sales
GROUP BY category, ROLLUP (region)  -- Only roll up region
ORDER BY category, region NULLS FIRST;

-- Result:
-- Electronics | NULL  | 26800.00 (subtotal)
-- Electronics | East  | 3750.00
-- Electronics | North | 13750.00
-- Electronics | South | 6800.00
-- Electronics | West  | 2500.00
-- Furniture   | NULL  | 5100.00  (subtotal)
-- Furniture   | East  | 1200.00
-- Furniture   | North | 2700.00
-- Furniture   | West  | 1200.00
```

---

## CUBE

All possible grouping combinations.

```sql
-- CUBE creates all possible combinations
SELECT 
    category,
    region,
    SUM(amount) AS total
FROM sales
GROUP BY CUBE (category, region)
ORDER BY category NULLS FIRST, region NULLS FIRST;

-- Results include:
-- Grand total (all NULL)
-- Category totals (region NULL)
-- Region totals (category NULL)  <-- Not in ROLLUP!
-- Full detail (no NULLs)

-- CUBE is equivalent to:
GROUP BY GROUPING SETS (
    (),                      -- Grand total
    (category),              -- By category
    (region),                -- By region
    (category, region)       -- By both
)
```

### ROLLUP vs CUBE

```sql
-- ROLLUP (category, region) produces:
-- (category, region), (category), ()

-- CUBE (category, region) produces:
-- (category, region), (category), (region), ()

-- ROLLUP = hierarchical (drill-down from left to right)
-- CUBE = all combinations (multi-dimensional analysis)
```

---

## FILTER Clause

Filter specific rows for each aggregate independently.

```sql
-- Multiple aggregates with different filters
SELECT 
    COUNT(*) AS total_sales,
    COUNT(*) FILTER (WHERE category = 'Electronics') AS electronics_count,
    COUNT(*) FILTER (WHERE category = 'Furniture') AS furniture_count,
    SUM(amount) FILTER (WHERE region = 'North') AS north_revenue,
    SUM(amount) FILTER (WHERE region = 'South') AS south_revenue,
    AVG(amount) FILTER (WHERE quantity >= 5) AS avg_bulk_sale
FROM sales;

-- More readable than CASE expressions
-- Old way:
SELECT 
    SUM(CASE WHEN category = 'Electronics' THEN amount ELSE 0 END) AS electronics_rev,
    SUM(CASE WHEN category = 'Furniture' THEN amount ELSE 0 END) AS furniture_rev
FROM sales;

-- New way (FILTER):
SELECT 
    SUM(amount) FILTER (WHERE category = 'Electronics') AS electronics_rev,
    SUM(amount) FILTER (WHERE category = 'Furniture') AS furniture_rev
FROM sales;

-- FILTER with GROUP BY
SELECT 
    region,
    SUM(amount) AS total,
    SUM(amount) FILTER (WHERE category = 'Electronics') AS electronics,
    SUM(amount) FILTER (WHERE category = 'Furniture') AS furniture
FROM sales
GROUP BY region
ORDER BY total DESC;
```

---

## Practical Examples

### Sales Report

```sql
-- Monthly sales summary
SELECT 
    DATE_TRUNC('month', sale_date) AS month,
    category,
    COUNT(*) AS transactions,
    SUM(quantity) AS units_sold,
    SUM(amount) AS revenue,
    ROUND(AVG(amount), 2) AS avg_transaction
FROM sales
GROUP BY DATE_TRUNC('month', sale_date), category
ORDER BY month, category;
```

### Top N per Group

```sql
-- Top salesperson per category
SELECT DISTINCT ON (category)
    category,
    salesperson,
    SUM(amount) AS total
FROM sales
GROUP BY category, salesperson
ORDER BY category, total DESC;

-- Alternative with window function (Chapter 9)
WITH ranked AS (
    SELECT 
        category,
        salesperson,
        SUM(amount) AS total,
        RANK() OVER (PARTITION BY category ORDER BY SUM(amount) DESC) AS rnk
    FROM sales
    GROUP BY category, salesperson
)
SELECT category, salesperson, total
FROM ranked
WHERE rnk = 1;
```

### Percentage of Total

```sql
-- Each category's percentage of total revenue
SELECT 
    category,
    SUM(amount) AS revenue,
    ROUND(100.0 * SUM(amount) / (SELECT SUM(amount) FROM sales), 2) AS percentage
FROM sales
GROUP BY category;

-- Using window function (more efficient)
SELECT 
    category,
    SUM(amount) AS revenue,
    ROUND(100.0 * SUM(amount) / SUM(SUM(amount)) OVER (), 2) AS percentage
FROM sales
GROUP BY category;
```

### Year-over-Year Comparison

```sql
-- Assuming we have multiple years of data
SELECT 
    DATE_PART('month', sale_date) AS month,
    SUM(amount) FILTER (WHERE DATE_PART('year', sale_date) = 2023) AS revenue_2023,
    SUM(amount) FILTER (WHERE DATE_PART('year', sale_date) = 2024) AS revenue_2024,
    ROUND(100.0 * (
        SUM(amount) FILTER (WHERE DATE_PART('year', sale_date) = 2024) -
        SUM(amount) FILTER (WHERE DATE_PART('year', sale_date) = 2023)
    ) / NULLIF(SUM(amount) FILTER (WHERE DATE_PART('year', sale_date) = 2023), 0), 2) AS yoy_growth
FROM sales
GROUP BY DATE_PART('month', sale_date)
ORDER BY month;
```

### Moving Averages (Preview)

```sql
-- 3-day moving average (uses window functions - Chapter 9)
SELECT 
    sale_date,
    amount,
    ROUND(AVG(amount) OVER (
        ORDER BY sale_date 
        ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
    ), 2) AS moving_avg_3day
FROM sales
ORDER BY sale_date;
```

---

## Aggregation Performance Tips

### Use Appropriate Indexes

```sql
-- Index on grouping columns
CREATE INDEX idx_sales_category ON sales(category);
CREATE INDEX idx_sales_region ON sales(region);

-- Covering index for specific query
CREATE INDEX idx_sales_cat_amt ON sales(category) INCLUDE (amount);
```

### Pre-aggregate Large Tables

```sql
-- Create summary table
CREATE TABLE daily_sales_summary AS
SELECT 
    sale_date,
    category,
    region,
    COUNT(*) AS transaction_count,
    SUM(amount) AS total_amount
FROM sales
GROUP BY sale_date, category, region;

-- Query summary instead of detail
SELECT category, SUM(total_amount)
FROM daily_sales_summary
WHERE sale_date BETWEEN '2024-01-01' AND '2024-12-31'
GROUP BY category;
```

### Approximate Aggregates (PostgreSQL 14+)

```sql
-- For very large tables, approximate counting is faster
-- Install HyperLogLog extension or use approx_count_distinct
-- (Requires contrib modules)
```

---

## Practice Exercises

### Exercise 1: Basic Aggregation
1. Find total revenue and average sale amount
2. Count sales by category
3. Find the highest and lowest sale amounts

### Exercise 2: GROUP BY
1. Revenue by category and region
2. Top 3 salespeople by total revenue
3. Monthly sales trend

### Exercise 3: HAVING
1. Categories with more than 3 sales
2. Regions where average sale > 2000
3. Salespeople with total revenue > 5000

### Exercise 4: Advanced
1. Create a pivot table: categories as rows, regions as columns
2. Calculate each salesperson's percentage of total revenue
3. Find which product sells best in each region

---

## Summary

In this chapter, you learned:
- ✅ Aggregate functions: COUNT, SUM, AVG, MIN, MAX
- ✅ STRING_AGG, ARRAY_AGG, and other aggregates
- ✅ GROUP BY for grouping rows
- ✅ HAVING for filtering groups
- ✅ GROUPING SETS, ROLLUP, and CUBE for multi-level aggregation
- ✅ FILTER clause for conditional aggregation
- ✅ Practical reporting patterns

---

**Next Chapter:** [Subqueries →](./08-Subqueries.md)



