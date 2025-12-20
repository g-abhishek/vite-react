# Chapter 9: Window Functions 🪟

Window functions perform calculations across a set of rows related to the current row, without collapsing them into a single result like GROUP BY does.

---

## What Are Window Functions?

```sql
-- GROUP BY: Collapses rows into groups
SELECT department_id, AVG(salary) FROM employees GROUP BY department_id;
-- Returns one row per department

-- Window function: Keeps all rows, adds computed column
SELECT 
    name,
    department_id,
    salary,
    AVG(salary) OVER (PARTITION BY department_id) AS dept_avg
FROM employees;
-- Returns all employees with their department's average

-- Key insight: Window functions don't reduce row count
```

---

## Basic Syntax

```sql
function_name(arguments) OVER (
    [PARTITION BY columns]     -- Optional: Group rows into partitions
    [ORDER BY columns]         -- Optional: Sort rows within partition
    [frame_clause]             -- Optional: Define row range
)
```

---

## Sample Data Setup

```sql
CREATE TABLE sales_data (
    id SERIAL PRIMARY KEY,
    salesperson VARCHAR(50),
    region VARCHAR(20),
    sale_date DATE,
    amount NUMERIC(10,2)
);

INSERT INTO sales_data (salesperson, region, sale_date, amount) VALUES
('Alice', 'North', '2024-01-01', 1000),
('Alice', 'North', '2024-01-15', 1500),
('Alice', 'North', '2024-02-01', 1200),
('Bob', 'North', '2024-01-05', 800),
('Bob', 'North', '2024-01-20', 900),
('Bob', 'North', '2024-02-10', 1100),
('Carol', 'South', '2024-01-03', 1300),
('Carol', 'South', '2024-01-18', 1400),
('Carol', 'South', '2024-02-05', 1600),
('David', 'South', '2024-01-10', 700),
('David', 'South', '2024-02-15', 950);
```

---

## Ranking Functions

### ROW_NUMBER()

Assigns unique sequential numbers to rows.

```sql
-- Simple row numbering
SELECT 
    id,
    salesperson,
    amount,
    ROW_NUMBER() OVER (ORDER BY amount DESC) AS rank
FROM sales_data;

-- Row number within partition
SELECT 
    salesperson,
    region,
    amount,
    ROW_NUMBER() OVER (PARTITION BY region ORDER BY amount DESC) AS region_rank
FROM sales_data;

-- Use case: Top N per group
WITH ranked AS (
    SELECT 
        *,
        ROW_NUMBER() OVER (PARTITION BY region ORDER BY amount DESC) AS rn
    FROM sales_data
)
SELECT * FROM ranked WHERE rn <= 2;  -- Top 2 per region
```

### RANK()

Same rank for ties, gaps after ties.

```sql
SELECT 
    salesperson,
    amount,
    RANK() OVER (ORDER BY amount DESC) AS rank
FROM sales_data;

-- Example results:
-- Alice | 1600 | 1
-- Carol | 1500 | 2
-- Carol | 1400 | 3
-- If there were two 1500s: 1, 2, 2, 4 (gap at 3)
```

### DENSE_RANK()

Same rank for ties, no gaps.

```sql
SELECT 
    salesperson,
    amount,
    DENSE_RANK() OVER (ORDER BY amount DESC) AS dense_rank
FROM sales_data;

-- If there were two 1500s: 1, 2, 2, 3 (no gap)
```

### NTILE()

Divides rows into N equal buckets.

```sql
-- Divide into quartiles
SELECT 
    salesperson,
    amount,
    NTILE(4) OVER (ORDER BY amount DESC) AS quartile
FROM sales_data;

-- Use case: Performance buckets
SELECT 
    salesperson,
    SUM(amount) AS total_sales,
    CASE NTILE(3) OVER (ORDER BY SUM(amount) DESC)
        WHEN 1 THEN 'Top Performer'
        WHEN 2 THEN 'Average'
        WHEN 3 THEN 'Needs Improvement'
    END AS performance_tier
FROM sales_data
GROUP BY salesperson;
```

### Comparison

```sql
SELECT 
    salesperson,
    amount,
    ROW_NUMBER() OVER (ORDER BY amount DESC) AS row_num,    -- 1, 2, 3, 4, 5...
    RANK() OVER (ORDER BY amount DESC) AS rank,            -- 1, 2, 2, 4, 5... (gaps)
    DENSE_RANK() OVER (ORDER BY amount DESC) AS dense_rank -- 1, 2, 2, 3, 4... (no gaps)
FROM sales_data;
```

---

## Aggregate Window Functions

All aggregate functions can be used as window functions.

```sql
-- Running aggregates
SELECT 
    sale_date,
    salesperson,
    amount,
    SUM(amount) OVER (ORDER BY sale_date) AS running_total,
    AVG(amount) OVER (ORDER BY sale_date) AS running_avg,
    COUNT(*) OVER (ORDER BY sale_date) AS running_count
FROM sales_data
ORDER BY sale_date;

-- Partitioned aggregates
SELECT 
    salesperson,
    region,
    amount,
    SUM(amount) OVER (PARTITION BY salesperson) AS person_total,
    SUM(amount) OVER (PARTITION BY region) AS region_total,
    SUM(amount) OVER () AS grand_total
FROM sales_data;

-- Percentage calculations
SELECT 
    salesperson,
    region,
    amount,
    ROUND(100.0 * amount / SUM(amount) OVER (PARTITION BY region), 2) AS pct_of_region,
    ROUND(100.0 * amount / SUM(amount) OVER (), 2) AS pct_of_total
FROM sales_data;
```

---

## Value Functions

### LAG() and LEAD()

Access previous or next row values.

```sql
-- Compare with previous row
SELECT 
    sale_date,
    salesperson,
    amount,
    LAG(amount) OVER (ORDER BY sale_date) AS prev_amount,
    amount - LAG(amount) OVER (ORDER BY sale_date) AS change
FROM sales_data
ORDER BY sale_date;

-- Compare with next row
SELECT 
    sale_date,
    amount,
    LEAD(amount) OVER (ORDER BY sale_date) AS next_amount
FROM sales_data;

-- With offset and default
SELECT 
    sale_date,
    amount,
    LAG(amount, 2, 0) OVER (ORDER BY sale_date) AS two_back,  -- 2 rows back, default 0
    LEAD(amount, 1, NULL) OVER (ORDER BY sale_date) AS next_one
FROM sales_data;

-- Partitioned LAG
SELECT 
    salesperson,
    sale_date,
    amount,
    LAG(amount) OVER (PARTITION BY salesperson ORDER BY sale_date) AS prev_sale
FROM sales_data;

-- Calculate month-over-month growth
WITH monthly AS (
    SELECT 
        DATE_TRUNC('month', sale_date) AS month,
        SUM(amount) AS total
    FROM sales_data
    GROUP BY DATE_TRUNC('month', sale_date)
)
SELECT 
    month,
    total,
    LAG(total) OVER (ORDER BY month) AS prev_month,
    ROUND(100.0 * (total - LAG(total) OVER (ORDER BY month)) / LAG(total) OVER (ORDER BY month), 2) AS growth_pct
FROM monthly;
```

### FIRST_VALUE() and LAST_VALUE()

```sql
-- Get first and last values in partition
SELECT 
    salesperson,
    sale_date,
    amount,
    FIRST_VALUE(amount) OVER (PARTITION BY salesperson ORDER BY sale_date) AS first_sale,
    LAST_VALUE(amount) OVER (
        PARTITION BY salesperson 
        ORDER BY sale_date 
        RANGE BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
    ) AS last_sale
FROM sales_data;

-- Note: LAST_VALUE needs explicit frame to see all rows
-- Default frame only includes current and preceding rows
```

### NTH_VALUE()

Get the Nth value in the window.

```sql
SELECT 
    salesperson,
    sale_date,
    amount,
    NTH_VALUE(amount, 2) OVER (
        PARTITION BY salesperson 
        ORDER BY sale_date
        RANGE BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
    ) AS second_sale
FROM sales_data;
```

---

## Window Frame Clause

Defines which rows are included in the window.

### Frame Syntax

```sql
function OVER (
    ORDER BY col
    [ROWS | RANGE | GROUPS] BETWEEN start AND end
)

-- Start/End options:
-- UNBOUNDED PRECEDING  - First row of partition
-- n PRECEDING          - n rows before current
-- CURRENT ROW          - Current row
-- n FOLLOWING          - n rows after current
-- UNBOUNDED FOLLOWING  - Last row of partition
```

### ROWS vs RANGE vs GROUPS

```sql
-- ROWS: Physical row count
SELECT 
    sale_date,
    amount,
    SUM(amount) OVER (ORDER BY sale_date ROWS BETWEEN 2 PRECEDING AND CURRENT ROW) AS sum_3_rows
FROM sales_data;

-- RANGE: Logical value range (same values grouped)
SELECT 
    sale_date,
    amount,
    SUM(amount) OVER (ORDER BY sale_date RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS running_total
FROM sales_data;

-- GROUPS: Groups of rows with same ORDER BY value
SELECT 
    sale_date,
    amount,
    SUM(amount) OVER (ORDER BY sale_date GROUPS BETWEEN 1 PRECEDING AND CURRENT ROW) AS sum_2_groups
FROM sales_data;
```

### Practical Frame Examples

```sql
-- Moving average (last 3 rows)
SELECT 
    sale_date,
    amount,
    ROUND(AVG(amount) OVER (
        ORDER BY sale_date 
        ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
    ), 2) AS moving_avg_3
FROM sales_data;

-- Centered moving average (1 before, current, 1 after)
SELECT 
    sale_date,
    amount,
    ROUND(AVG(amount) OVER (
        ORDER BY sale_date 
        ROWS BETWEEN 1 PRECEDING AND 1 FOLLOWING
    ), 2) AS centered_avg
FROM sales_data;

-- Sum from start to current (running total)
SELECT 
    sale_date,
    amount,
    SUM(amount) OVER (
        ORDER BY sale_date 
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) AS running_total
FROM sales_data;

-- Sum of entire partition
SELECT 
    salesperson,
    amount,
    SUM(amount) OVER (
        PARTITION BY salesperson 
        ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
    ) AS total_for_person
FROM sales_data;
```

---

## WINDOW Clause (Named Windows)

Define reusable window specifications.

```sql
-- Without named window (repetitive)
SELECT 
    sale_date,
    amount,
    SUM(amount) OVER (PARTITION BY region ORDER BY sale_date),
    AVG(amount) OVER (PARTITION BY region ORDER BY sale_date),
    MAX(amount) OVER (PARTITION BY region ORDER BY sale_date)
FROM sales_data;

-- With named window (cleaner)
SELECT 
    sale_date,
    amount,
    SUM(amount) OVER w AS running_sum,
    AVG(amount) OVER w AS running_avg,
    MAX(amount) OVER w AS running_max
FROM sales_data
WINDOW w AS (PARTITION BY region ORDER BY sale_date);

-- Multiple named windows
SELECT 
    salesperson,
    region,
    amount,
    SUM(amount) OVER by_person AS person_total,
    SUM(amount) OVER by_region AS region_total,
    ROW_NUMBER() OVER by_region_ranked AS region_rank
FROM sales_data
WINDOW 
    by_person AS (PARTITION BY salesperson),
    by_region AS (PARTITION BY region),
    by_region_ranked AS (PARTITION BY region ORDER BY amount DESC);

-- Extend named window
SELECT 
    sale_date,
    amount,
    SUM(amount) OVER (w ORDER BY sale_date) AS running_total
FROM sales_data
WINDOW w AS (PARTITION BY region);
```

---

## Practical Examples

### Running Totals and Balances

```sql
-- Bank account balance
CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    account_id INTEGER,
    transaction_date DATE,
    amount NUMERIC(10,2)  -- Positive = deposit, negative = withdrawal
);

SELECT 
    account_id,
    transaction_date,
    amount,
    SUM(amount) OVER (
        PARTITION BY account_id 
        ORDER BY transaction_date 
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) AS balance
FROM transactions;
```

### Gap Analysis

```sql
-- Find gaps in sequential IDs
WITH numbered AS (
    SELECT 
        id,
        ROW_NUMBER() OVER (ORDER BY id) AS expected_pos
    FROM orders
)
SELECT id, expected_pos, id - expected_pos AS gap_indicator
FROM numbered
WHERE id != expected_pos;
```

### Time-Based Comparisons

```sql
-- Year-over-year comparison
WITH monthly_sales AS (
    SELECT 
        DATE_TRUNC('month', sale_date) AS month,
        SUM(amount) AS total
    FROM sales_data
    GROUP BY DATE_TRUNC('month', sale_date)
)
SELECT 
    month,
    total,
    LAG(total, 12) OVER (ORDER BY month) AS same_month_last_year,
    ROUND(100.0 * (total - LAG(total, 12) OVER (ORDER BY month)) / 
          NULLIF(LAG(total, 12) OVER (ORDER BY month), 0), 2) AS yoy_growth
FROM monthly_sales;
```

### Top N Per Group

```sql
-- Top 3 sales per region
WITH ranked AS (
    SELECT 
        *,
        ROW_NUMBER() OVER (PARTITION BY region ORDER BY amount DESC) AS rn
    FROM sales_data
)
SELECT region, salesperson, amount
FROM ranked
WHERE rn <= 3;

-- Alternative: DISTINCT ON (PostgreSQL specific)
SELECT DISTINCT ON (region) region, salesperson, amount
FROM sales_data
ORDER BY region, amount DESC;
```

### Median Calculation

```sql
-- Calculate median using PERCENTILE_CONT
SELECT 
    region,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY amount) AS median_amount
FROM sales_data
GROUP BY region;

-- Or using window functions
WITH ranked AS (
    SELECT 
        region,
        amount,
        ROW_NUMBER() OVER (PARTITION BY region ORDER BY amount) AS rn,
        COUNT(*) OVER (PARTITION BY region) AS cnt
    FROM sales_data
)
SELECT 
    region,
    AVG(amount) AS median
FROM ranked
WHERE rn IN (cnt/2, cnt/2 + 1, (cnt+1)/2)
GROUP BY region;
```

### Cumulative Distribution

```sql
-- Show cumulative percentage
SELECT 
    salesperson,
    amount,
    SUM(amount) OVER (ORDER BY amount DESC) AS running_total,
    ROUND(100.0 * SUM(amount) OVER (ORDER BY amount DESC) / SUM(amount) OVER (), 2) AS cumulative_pct
FROM (
    SELECT salesperson, SUM(amount) AS amount
    FROM sales_data
    GROUP BY salesperson
) t;

-- Using CUME_DIST
SELECT 
    salesperson,
    amount,
    ROUND(CUME_DIST() OVER (ORDER BY amount) * 100, 2) AS percentile
FROM sales_data;

-- Using PERCENT_RANK
SELECT 
    salesperson,
    amount,
    ROUND(PERCENT_RANK() OVER (ORDER BY amount) * 100, 2) AS percent_rank
FROM sales_data;
```

### Session Analysis

```sql
-- Identify sessions (30-minute gap = new session)
CREATE TABLE page_views (
    user_id INTEGER,
    viewed_at TIMESTAMP,
    page VARCHAR(200)
);

WITH time_gaps AS (
    SELECT 
        *,
        viewed_at - LAG(viewed_at) OVER (PARTITION BY user_id ORDER BY viewed_at) AS gap
    FROM page_views
),
session_starts AS (
    SELECT 
        *,
        CASE WHEN gap IS NULL OR gap > INTERVAL '30 minutes' THEN 1 ELSE 0 END AS is_new_session
    FROM time_gaps
)
SELECT 
    *,
    SUM(is_new_session) OVER (PARTITION BY user_id ORDER BY viewed_at) AS session_id
FROM session_starts;
```

### Deduplication

```sql
-- Keep only the latest record per user
WITH ranked AS (
    SELECT 
        *,
        ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY updated_at DESC) AS rn
    FROM user_profiles
)
DELETE FROM user_profiles
WHERE id IN (SELECT id FROM ranked WHERE rn > 1);

-- Or for SELECT
SELECT * FROM (
    SELECT 
        *,
        ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY updated_at DESC) AS rn
    FROM user_profiles
) t
WHERE rn = 1;
```

---

## Performance Considerations

### Index for ORDER BY

```sql
-- Window functions benefit from indexes on ORDER BY columns
CREATE INDEX idx_sales_date ON sales_data(sale_date);
CREATE INDEX idx_sales_region_date ON sales_data(region, sale_date);

-- Composite index for PARTITION BY + ORDER BY
CREATE INDEX idx_sales_region_amount ON sales_data(region, amount DESC);
```

### Limit Partitions

```sql
-- Process specific partitions only
SELECT *
FROM (
    SELECT 
        *,
        ROW_NUMBER() OVER (PARTITION BY region ORDER BY amount DESC) AS rn
    FROM sales_data
    WHERE region = 'North'  -- Filter early
) t
WHERE rn <= 3;
```

### Use EXPLAIN ANALYZE

```sql
EXPLAIN ANALYZE
SELECT 
    salesperson,
    SUM(amount) OVER (ORDER BY sale_date)
FROM sales_data;

-- Look for:
-- WindowAgg nodes
-- Sort operations
-- Index usage
```

---

## Practice Exercises

### Exercise 1: Ranking
1. Rank employees by salary within each department
2. Find top 3 products by revenue
3. Assign customers to quartiles by total spend

### Exercise 2: Running Calculations
1. Calculate running total of sales
2. Create 7-day moving average
3. Calculate cumulative percentage

### Exercise 3: Comparisons
1. Compare each sale to previous sale
2. Find the difference from department average
3. Calculate month-over-month growth

### Exercise 4: Complex Analysis
1. Find consecutive days with sales > $1000
2. Identify first and last purchase per customer
3. Calculate retention cohorts

---

## Summary

In this chapter, you learned:
- ✅ Ranking functions: ROW_NUMBER, RANK, DENSE_RANK, NTILE
- ✅ Aggregate window functions: SUM, AVG, COUNT with OVER
- ✅ Value functions: LAG, LEAD, FIRST_VALUE, LAST_VALUE
- ✅ Window frame clauses: ROWS, RANGE, GROUPS
- ✅ Named windows with WINDOW clause
- ✅ Practical use cases: running totals, moving averages, rankings

---

**Next Chapter:** [Indexes & Performance →](./10-Indexes-Performance.md)




