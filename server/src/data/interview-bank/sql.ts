import type { InterviewTopic } from "./types";

export const sqlTopic: InterviewTopic = {
  id: "sql",
  label: "SQL / PostgreSQL",
  description: "Query design, indexing, transactions, modelling and performance tuning.",
  questions: [
    {
      key: "sql-joins",
      topic: "Query design",
      difficulty: "EASY",
      prompt:
        "Compare INNER, LEFT, RIGHT and FULL joins, and explain when a correlated subquery is clearer than a join.",
      hints: [
        "The join type decides what happens to unmatched rows, not the filter clause.",
        "Putting a filter on the right table in `WHERE` silently turns a LEFT JOIN into an INNER JOIN.",
        "Correlated subqueries read well for exists/not-exists checks and anti-joins.",
      ],
      keywords: ["inner join", "left join", "unmatched rows", "correlated subquery", "exists", "anti join", "filter placement"],
      model:
        "INNER keeps only matched rows, LEFT/RIGHT keep unmatched rows from one side (with NULLs), FULL keeps both. A right-table predicate in `WHERE` nullifies a LEFT JOIN; it belongs in the `ON` clause. `EXISTS`/`NOT EXISTS` subqueries are often clearer and safer for existence and anti-join checks.",
    },
    {
      key: "sql-indexing",
      topic: "Indexes",
      difficulty: "MEDIUM",
      prompt:
        "How do indexes work in PostgreSQL, what makes a composite index usable, and how do you know whether an index is being used?",
      hints: [
        "B-tree indexes support equality and range scans on a left-to-right prefix.",
        "Column order matters: equality columns first, then the range/sort column.",
        "Use `EXPLAIN (ANALYZE, BUFFERS)` and watch for Seq Scan versus Index Scan.",
      ],
      keywords: ["B-tree", "composite index", "selectivity", "covering index", "EXPLAIN ANALYZE", "seq scan", "cardinality"],
      model:
        "B-tree indexes let the planner find ranges without scanning the table. A composite index is usable only for a left prefix of its columns, so I order equality predicates first and the sort/range column last. I verify with `EXPLAIN (ANALYZE, BUFFERS)`, checking estimates against actual rows and looking for sequential scans on selective filters.",
    },
    {
      key: "sql-transactions",
      topic: "Transactions",
      difficulty: "HARD",
      prompt:
        "Explain ACID and the isolation levels. Which anomalies does `READ COMMITTED` allow, and how do you fix a lost update?",
      hints: [
        "Levels: READ UNCOMMITTED, READ COMMITTED, REPEATABLE READ, SERIALIZABLE.",
        "PostgreSQL's READ COMMITTED allows non-repeatable reads and write skew.",
        "Lost updates are fixed with `SELECT ... FOR UPDATE`, atomic updates or a higher isolation level.",
      ],
      keywords: ["ACID", "isolation level", "read committed", "repeatable read", "write skew", "lost update", "SELECT FOR UPDATE"],
      model:
        "ACID guarantees atomicity, consistency, isolation and durability. PostgreSQL's READ COMMITTED permits non-repeatable reads: two concurrent read-modify-write cycles lose an update. I fix it with `SELECT ... FOR UPDATE`, a single atomic `UPDATE ... SET x = x + 1`, optimistic versioning, or REPEATABLE READ/SERIALIZABLE when justified.",
    },
    {
      key: "sql-window",
      topic: "Analytics",
      difficulty: "MEDIUM",
      prompt:
        "What are window functions, and how would you return each candidate's latest attempt plus their rank within an assessment?",
      hints: [
        "`OVER (PARTITION BY ... ORDER BY ...)` computes per-group without collapsing rows.",
        "`ROW_NUMBER`/`RANK`/`DENSE_RANK` differ in how they treat ties.",
        "Filter the window result in an outer query or a CTE — window functions run after WHERE.",
      ],
      keywords: ["window function", "partition by", "row_number", "rank", "CTE", "ties", "latest per group"],
      model:
        "Window functions evaluate per partition without collapsing rows: `ROW_NUMBER() OVER (PARTITION BY candidate_id ORDER BY created_at DESC)` in a CTE picks the latest attempt, and `RANK() OVER (PARTITION BY assessment_id ORDER BY score DESC)` ranks it. Because window functions run after filtering, I select from the CTE and filter there.",
    },
    {
      key: "sql-modelling",
      topic: "Data modelling",
      difficulty: "MEDIUM",
      prompt:
        "How do you decide between normalised and denormalised schemas, and how would you model a many-to-many relationship with extra attributes?",
      hints: [
        "Normalise for integrity and write correctness; denormalise for read performance.",
        "Many-to-many with attributes needs a join entity with its own primary key.",
        "Consider generated columns, materialised views or summary tables for heavy reads.",
      ],
      keywords: ["normalisation", "denormalisation", "join table", "composite key", "integrity", "materialised view", "redundancy"],
      model:
        "I normalise the transactional core to keep one source of truth and denormalise deliberately where read patterns demand it — summary tables, generated columns or materialised views that can be refreshed. A many-to-many with attributes becomes an association table (e.g. `assessment_problem(assessment_id, problem_id, points, order)`).",
    },
    {
      key: "sql-pagination",
      topic: "Performance",
      difficulty: "MEDIUM",
      prompt:
        "Why does `OFFSET 100000 LIMIT 20` get slow, and what pagination strategy would you use instead?",
      hints: [
        "The database still reads and discards all skipped rows.",
        "Keyset (seek) pagination filters on the last seen key and uses the index.",
        "Also mention stable sort keys and counting costs on large tables.",
      ],
      keywords: ["offset", "keyset pagination", "seek method", "stable sort", "index", "deep pagination", "count"],
      model:
        "OFFSET makes the engine produce and throw away every skipped row, so deep pages degrade linearly. Keyset pagination (`WHERE (created_at, id) < (?, ?) ORDER BY created_at DESC, id DESC LIMIT 20`) uses the index and stays constant-time; I keep a stable unique tiebreaker and avoid exact counts on huge tables.",
    },
    {
      key: "sql-locking",
      topic: "Concurrency",
      difficulty: "HARD",
      prompt:
        "How do row locks and deadlocks work in PostgreSQL, and how do you design code that avoids deadlocks in a busy API?",
      hints: [
        "Locks are acquired on rows/objects and held until commit or rollback.",
        "Deadlocks come from inconsistent lock ordering between concurrent transactions.",
        "Keep transactions short; lock rows in a deterministic order.",
      ],
      keywords: ["row lock", "deadlock", "lock ordering", "short transaction", "advisory lock", "blocking", "retry"],
      model:
        "PostgreSQL takes row/table locks that live until commit, so a blocked statement waits and can deadlock if two transactions lock the same rows in opposite orders. I keep transactions short, always touch rows in a consistent order, prefer single-statement updates or advisory locks for coordination, and retry on serialization failures.",
    },
    {
      key: "sql-aggregation",
      topic: "Analytics",
      difficulty: "MEDIUM",
      prompt:
        "Explain `GROUP BY`, `HAVING`, aggregate functions and `FILTER`. How do you compute a percentage of passes per assessment in one query?",
      hints: [
        "`WHERE` filters rows before aggregation; `HAVING` filters groups after.",
        "`FILTER (WHERE ...)` applies a condition to one aggregate only.",
        "Guard against division by zero with `NULLIF`.",
      ],
      keywords: ["group by", "having", "aggregate", "FILTER", "COUNT", "NULLIF", "percentage"],
      model:
        "`GROUP BY` collapses rows into groups, `WHERE` filters before it and `HAVING` after. Conditional aggregation with `FILTER (WHERE passed)` counts passes: `100.0 * COUNT(*) FILTER (WHERE passed) / NULLIF(COUNT(*), 0)`. I add indexes/partitioning when the aggregate scans a large table.",
    },
    {
      key: "sql-migrations",
      topic: "Schema evolution",
      difficulty: "MEDIUM",
      prompt:
        "How do you safely evolve a busy database schema — adding columns, renaming tables, backfilling data and adding indexes?",
      hints: [
        "Prefer additive, backward-compatible steps that old and new code both tolerate.",
        "Add nullable columns, backfill in batches, then enforce constraints.",
        "Use `CREATE INDEX CONCURRENTLY` and lock timeouts to avoid long table locks.",
      ],
      keywords: ["backward compatible migration", "backfill", "CREATE INDEX CONCURRENTLY", "lock timeout", "expand and contract", "NOT NULL"],
      model:
        "I use expand/contract: add the new nullable column or table, deploy code that writes both, backfill in batches, add constraints (validated separately), then drop the old structure in a later release. Indexes are created concurrently with a lock timeout, and migrations are reviewed for lock duration.",
    },
    {
      key: "sql-orm",
      topic: "ORM interaction",
      difficulty: "MEDIUM",
      prompt:
        "An ORM-backed endpoint issues hundreds of queries per request. How do you find and fix it without discarding the ORM?",
      hints: [
        "Enable query logging and count queries per request; N+1 is the usual culprit.",
        "Use eager loading/`include`/joins or batch loaders instead of per-row lookups.",
        "Drop to raw SQL for reporting queries that the ORM generates badly.",
      ],
      keywords: ["ORM", "N+1", "query logging", "eager loading", "include", "batch loader", "raw SQL"],
      model:
        "I log and count queries per request to confirm N+1, then fix it with eager loading, join-based selection or a batch loader. Reporting queries that the ORM renders poorly are hand-written SQL, still executed inside a read-only transaction.",
    },
  ],
};
