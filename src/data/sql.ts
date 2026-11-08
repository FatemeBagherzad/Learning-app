import type { Sheet } from '../types'

const sql: Sheet = {
  id: 'sql',
  label: 'SQL',
  lang: 'sql',
  accent: '#7e22ce',
  sections: [
    {
      title: 'SELECT basics',
      blurb: 'Written in this order, but the database runs FROM → WHERE → GROUP BY → SELECT → ORDER BY.',
      snippets: [
        {
          code: `SELECT * FROM users;
SELECT name, email FROM users;
SELECT name AS full_name FROM users;        -- rename a column
SELECT DISTINCT country FROM users;         -- unique values
SELECT price * quantity AS total FROM orders;
SELECT COUNT(*) FROM users;`,
        },
        {
          note: 'Full shape of a query',
          code: `SELECT   column_list
FROM     table
JOIN     other ON other.id = table.other_id
WHERE    condition          -- filters rows
GROUP BY column
HAVING   condition          -- filters groups
ORDER BY column DESC
LIMIT    10 OFFSET 20;`,
        },
      ],
    },
    {
      title: 'WHERE & operators',
      snippets: [
        {
          code: `SELECT * FROM users
WHERE age >= 18
  AND country = 'CA'
  AND (role = 'admin' OR role = 'owner');

WHERE age BETWEEN 18 AND 65        -- inclusive
WHERE country IN ('CA', 'US')
WHERE country NOT IN ('CA')
WHERE name LIKE 'A%'               -- starts with A  (_ = one character)
WHERE name ILIKE '%ada%'           -- case-insensitive (Postgres)
WHERE deleted_at IS NULL           -- never  = NULL
WHERE NOT active;`,
        },
      ],
    },
    {
      title: 'ORDER BY & LIMIT',
      snippets: [
        {
          code: `SELECT * FROM users ORDER BY created_at DESC;
SELECT * FROM users ORDER BY country ASC, name ASC;
SELECT * FROM users ORDER BY last_login DESC NULLS LAST;

SELECT * FROM users LIMIT 10;              -- first 10
SELECT * FROM users LIMIT 10 OFFSET 20;    -- page 3 of 10 per page`,
        },
      ],
    },
    {
      title: 'Aggregates & GROUP BY',
      snippets: [
        {
          code: `SELECT COUNT(*), SUM(total), AVG(total), MIN(total), MAX(total)
FROM orders;

SELECT country, COUNT(*) AS people
FROM users
GROUP BY country
ORDER BY people DESC;

-- every selected column is either grouped or aggregated
SELECT user_id, COUNT(*) AS orders, SUM(total) AS spend
FROM orders
GROUP BY user_id
HAVING SUM(total) > 1000;        -- HAVING filters groups, WHERE filters rows`,
        },
        {
          note: 'COUNT(*) vs COUNT(column)',
          code: `COUNT(*)              -- all rows
COUNT(email)          -- rows where email IS NOT NULL
COUNT(DISTINCT city)  -- unique non-null values`,
        },
      ],
    },
    {
      title: 'JOINs',
      blurb: 'INNER keeps only matches. LEFT keeps every row of the left table, matched or not.',
      snippets: [
        {
          code: `SELECT u.name, o.total
FROM users u
JOIN orders o ON o.user_id = u.id;          -- INNER JOIN

SELECT u.name, o.total
FROM users u
LEFT JOIN orders o ON o.user_id = u.id;     -- users with no order: total is NULL

RIGHT JOIN   -- mirror of LEFT
FULL JOIN    -- everything from both sides
CROSS JOIN   -- every combination`,
        },
        {
          note: 'Find rows with no match',
          code: `SELECT u.*
FROM users u
LEFT JOIN orders o ON o.user_id = u.id
WHERE o.id IS NULL;              -- users who never ordered`,
        },
        {
          note: 'Join + aggregate',
          code: `SELECT u.name, COUNT(o.id) AS orders
FROM users u
LEFT JOIN orders o ON o.user_id = u.id
GROUP BY u.id, u.name
ORDER BY orders DESC;`,
        },
      ],
    },
    {
      title: 'Subqueries & CTEs',
      snippets: [
        {
          code: `-- subquery in WHERE
SELECT * FROM users
WHERE id IN (SELECT user_id FROM orders WHERE total > 500);

-- subquery as a value
SELECT name,
       (SELECT COUNT(*) FROM orders o WHERE o.user_id = u.id) AS orders
FROM users u;

-- EXISTS: usually faster than IN for big sets
SELECT * FROM users u
WHERE EXISTS (SELECT 1 FROM orders o WHERE o.user_id = u.id);`,
        },
        {
          note: 'CTE — a named subquery, much easier to read',
          code: `WITH big_spenders AS (
  SELECT user_id, SUM(total) AS spend
  FROM orders
  GROUP BY user_id
  HAVING SUM(total) > 1000
)
SELECT u.name, b.spend
FROM big_spenders b
JOIN users u ON u.id = b.user_id
ORDER BY b.spend DESC;`,
        },
      ],
    },
    {
      title: 'Window functions',
      blurb: 'Aggregate without collapsing the rows — a running total, a rank, the previous row.',
      snippets: [
        {
          code: `SELECT name, total,
       SUM(total) OVER ()                       AS grand_total,
       SUM(total) OVER (ORDER BY created_at)    AS running_total,
       AVG(total) OVER (PARTITION BY user_id)   AS avg_for_user
FROM orders;

SELECT name, total,
       ROW_NUMBER() OVER (ORDER BY total DESC) AS position,
       RANK()       OVER (ORDER BY total DESC) AS rank_with_ties,
       LAG(total)   OVER (ORDER BY created_at) AS previous_total
FROM orders;`,
        },
        {
          note: 'Top N per group — the classic interview question',
          code: `WITH ranked AS (
  SELECT *, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY total DESC) AS rn
  FROM orders
)
SELECT * FROM ranked WHERE rn <= 3;`,
        },
      ],
    },
    {
      title: 'INSERT, UPDATE, DELETE',
      snippets: [
        {
          code: `INSERT INTO users (name, email) VALUES ('Ada', 'a@b.c');

INSERT INTO users (name, email) VALUES
  ('Ada', 'a@b.c'),
  ('Grace', 'g@b.c');

INSERT INTO users (name) VALUES ('Ada') RETURNING id;   -- Postgres`,
        },
        {
          note: 'Always write the WHERE first',
          code: `UPDATE users SET active = FALSE WHERE last_login < '2025-01-01';
UPDATE users SET name = 'Ada', updated_at = NOW() WHERE id = 7;

DELETE FROM users WHERE id = 7;
DELETE FROM sessions WHERE expires_at < NOW();

-- no WHERE = every row. Check with SELECT first:
SELECT COUNT(*) FROM users WHERE last_login < '2025-01-01';`,
        },
        {
          note: 'Upsert',
          code: `INSERT INTO settings (user_id, theme) VALUES (1, 'dark')
ON CONFLICT (user_id)
DO UPDATE SET theme = EXCLUDED.theme;`,
        },
      ],
    },
    {
      title: 'Tables & types',
      snippets: [
        {
          code: `CREATE TABLE users (
  id          SERIAL PRIMARY KEY,         -- AUTO_INCREMENT in MySQL
  email       VARCHAR(255) NOT NULL UNIQUE,
  name        TEXT,
  age         INTEGER CHECK (age >= 0),
  active      BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE orders (
  id       SERIAL PRIMARY KEY,
  user_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  total    NUMERIC(10, 2) NOT NULL
);`,
        },
        {
          note: 'Changing a table',
          code: `ALTER TABLE users ADD COLUMN phone TEXT;
ALTER TABLE users DROP COLUMN phone;
ALTER TABLE users RENAME COLUMN name TO full_name;
ALTER TABLE users ALTER COLUMN age SET NOT NULL;
DROP TABLE users;              -- gone, with all its rows`,
        },
      ],
    },
    {
      title: 'NULL handling',
      blurb: 'NULL means "unknown". It is never equal to anything, not even to another NULL.',
      snippets: [
        {
          code: `WHERE email IS NULL
WHERE email IS NOT NULL
-- WHERE email = NULL  never matches anything

COALESCE(nickname, name, 'anonymous')   -- first value that is not NULL
NULLIF(count, 0)                        -- NULL when count is 0 (safe division)
SELECT total / NULLIF(quantity, 0) FROM orders;

-- NULL sorts last by default in Postgres DESC; be explicit if it matters
ORDER BY last_login DESC NULLS LAST;`,
        },
      ],
    },
    {
      title: 'CASE',
      snippets: [
        {
          code: `SELECT name,
       CASE
         WHEN age < 18 THEN 'minor'
         WHEN age < 65 THEN 'adult'
         ELSE 'senior'
       END AS bracket
FROM users;

-- count conditionally
SELECT
  COUNT(*) FILTER (WHERE active) AS active_users,     -- Postgres
  SUM(CASE WHEN active THEN 1 ELSE 0 END) AS active_anywhere
FROM users;`,
        },
      ],
    },
    {
      title: 'Strings & dates',
      snippets: [
        {
          code: `UPPER(name), LOWER(name), LENGTH(name), TRIM(name)
CONCAT(first, ' ', last)      -- or  first || ' ' || last  in Postgres
SUBSTRING(name FROM 1 FOR 3)
REPLACE(phone, '-', '')
CAST(age AS TEXT)             -- or  age::TEXT  in Postgres`,
        },
        {
          code: `NOW(), CURRENT_DATE
created_at::DATE                             -- strip the time (Postgres)
EXTRACT(YEAR FROM created_at)
DATE_TRUNC('month', created_at)              -- group by month
created_at >= NOW() - INTERVAL '7 days'      -- last week

SELECT DATE_TRUNC('month', created_at) AS month, COUNT(*)
FROM orders
GROUP BY month
ORDER BY month;`,
        },
      ],
    },
    {
      title: 'UNION & set operations',
      snippets: [
        {
          code: `SELECT name FROM customers
UNION                 -- removes duplicates
SELECT name FROM suppliers;

SELECT name FROM customers
UNION ALL             -- keeps duplicates, faster
SELECT name FROM suppliers;

INTERSECT   -- rows in both
EXCEPT      -- rows in the first but not the second

-- both sides need the same number of columns, in compatible types`,
        },
      ],
    },
    {
      title: 'Indexes & speed',
      snippets: [
        {
          code: `CREATE INDEX idx_orders_user ON orders(user_id);
CREATE UNIQUE INDEX idx_users_email ON users(email);
CREATE INDEX idx_orders_user_date ON orders(user_id, created_at);  -- order matters
DROP INDEX idx_orders_user;

EXPLAIN ANALYZE SELECT ... ;    -- see what the database actually does`,
        },
        {
          note: 'Rules of thumb',
          code: `-- index the columns you JOIN on and filter by
-- an index does not help if you wrap the column in a function:
WHERE LOWER(email) = 'a@b.c'        -- index on email unused
WHERE email = LOWER('A@B.C')        -- index used

-- SELECT only the columns you need; SELECT * is lazy and slow
-- LIMIT without ORDER BY gives you arbitrary rows`,
        },
      ],
    },
    {
      title: 'Transactions',
      snippets: [
        {
          code: `BEGIN;
  UPDATE accounts SET balance = balance - 100 WHERE id = 1;
  UPDATE accounts SET balance = balance + 100 WHERE id = 2;
COMMIT;        -- both happened

-- something looked wrong:
ROLLBACK;      -- neither happened`,
        },
      ],
    },
    {
      title: 'Handy patterns',
      snippets: [
        {
          note: 'Find duplicates',
          code: `SELECT email, COUNT(*)
FROM users
GROUP BY email
HAVING COUNT(*) > 1;`,
        },
        {
          note: 'Second highest value',
          code: `SELECT MAX(total) FROM orders
WHERE total < (SELECT MAX(total) FROM orders);`,
        },
        {
          note: 'Monthly report',
          code: `SELECT DATE_TRUNC('month', created_at) AS month,
       COUNT(*)      AS orders,
       SUM(total)    AS revenue,
       ROUND(AVG(total), 2) AS avg_order
FROM orders
WHERE created_at >= NOW() - INTERVAL '1 year'
GROUP BY month
ORDER BY month;`,
        },
        {
          note: 'Copy rows into another table',
          code: `INSERT INTO archive_orders
SELECT * FROM orders WHERE created_at < '2025-01-01';`,
        },
      ],
    },
  ],
}

export default sql
