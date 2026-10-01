import type { InterviewTopic } from "./types";

export const nodejsTopic: InterviewTopic = {
  id: "nodejs",
  label: "Node.js",
  description: "Runtime internals, streams, scaling, persistence, security and observability.",
  questions: [
    {
      key: "node-event-loop",
      topic: "Runtime",
      difficulty: "MEDIUM",
      prompt:
        "Describe the Node.js event loop phases and libuv's role. When does blocking the loop actually hurt, and how do you detect it?",
      hints: [
        "Phases: timers, pending callbacks, poll, check (setImmediate), close handlers.",
        "`process.nextTick` and promise microtasks run between phases, before I/O.",
        "Detect with event-loop lag metrics, flamegraphs, and CPU profiling of sync work.",
      ],
      keywords: ["event loop", "libuv", "phases", "nextTick", "microtask", "blocking", "event loop lag"],
      model:
        "Node delegates I/O to libuv; each loop iteration processes timers, pending callbacks, the poll phase, `setImmediate` and close handlers, with microtasks draining between them. Blocking means long synchronous CPU work starves all I/O. I detect it with event-loop-lag metrics and CPU flamegraphs.",
    },
    {
      key: "node-streams",
      topic: "Streams & I/O",
      difficulty: "MEDIUM",
      prompt:
        "Explain streams and backpressure in Node. How would you copy a 5 GB file or stream a CSV export to an HTTP response safely?",
      hints: [
        "`pipeline()` connects streams and propagates errors and backpressure automatically.",
        "Writing faster than the consumer can read buffers memory unless you respect the write return value.",
        "Avoid loading the whole payload into memory with `readFile`/JSON.",
      ],
      keywords: ["stream", "backpressure", "pipeline", "highWaterMark", "chunk", "memory footprint"],
      model:
        "Streams process data in chunks and signal backpressure when an internal buffer is full, so `write()` returns false until drainage. I use `stream.pipeline` (or `pipeline` from `node:stream/promises`) to connect a read stream, transform and HTTP response so errors and backpressure are handled and memory stays flat.",
    },
    {
      key: "node-scaling",
      topic: "Scaling",
      difficulty: "HARD",
      prompt:
        "A CPU-heavy route saturates one core. Compare `cluster`, worker threads and offloading to a queue — when do you choose each?",
      hints: [
        "`cluster` forks processes, each with its own memory, sharing the same port.",
        "Worker threads share memory space and suit CPU-bound JS without process overhead.",
        "Externalising to a queue/worker service keeps the API responsive and enables retries.",
      ],
      keywords: ["cluster", "worker_threads", "CPU bound", "queue", "horizontal scaling", "shared memory"],
      model:
        "For pure CPU work inside one service I use worker threads with a pool; for more throughput per machine I use `cluster`/PM2 across cores; for long or bursty jobs (video, code execution, AI) I offload to a queue and dedicated workers so request latency stays predictable.",
    },
    {
      key: "node-async-errors",
      topic: "Error handling",
      difficulty: "MEDIUM",
      prompt:
        "How do you handle errors in async Node code so the process never crashes unexpectedly, and what do you do with `unhandledRejection`?",
      hints: [
        "Wrap async handlers so rejections reach the error middleware; never leave floating promises.",
        "Guard short-lived worker processes with circuit breakers, timeouts and retries.",
        "Log, alert and exit gracefully rather than continuing in an unknown state.",
      ],
      keywords: ["unhandledRejection", "async error", "floating promise", "timeout", "graceful exit", "logging"],
      model:
        "Every async route is wrapped so rejections hit centralized error middleware, and no promise is left unawaited. Timeouts and retries bound external calls. On `unhandledRejection` I log with context, alert, and restart the process deliberately instead of running in an undefined state.",
    },
    {
      key: "node-security",
      topic: "Security",
      difficulty: "MEDIUM",
      prompt:
        "What does a secure Express API setup look like — authentication, input validation, headers, rate limiting and secrets?",
      hints: [
        "Validate every input with a schema at the edge; never trust client data.",
        "Short-lived access tokens plus rotating refresh tokens, hashed and revocable.",
        "Helmet/CORS allow-lists, rate limits, least-privilege DB credentials, secrets in the platform vault.",
      ],
      keywords: ["validation", "JWT", "refresh token", "helmet", "CORS", "rate limit", "least privilege", "secrets"],
      model:
        "I validate all input with schemas, hash passwords with bcrypt, use short-lived access tokens and rotating refresh tokens stored as hashes, set Helmet headers, restrict CORS to known origins, rate-limit sensitive routes, and keep credentials in a vault with least-privilege DB users.",
    },
    {
      key: "node-persistence",
      topic: "Data access",
      difficulty: "MEDIUM",
      prompt:
        "How do you access a relational database from Node safely — connection pooling, the N+1 problem, and transactions?",
      hints: [
        "The pool size must match the DB and the number of instances, otherwise you exhaust connections.",
        "N+1 appears when you loop over rows and query children one by one.",
        "Use transactions with a defined isolation level for multi-write operations.",
      ],
      keywords: ["connection pool", "N+1", "transaction", "isolation", "ORM", "query plan", "index"],
      model:
        "I size pools per instance with the database limit in mind, avoid N+1 by batching/joining or ORM `include`, and wrap multi-write operations in transactions with an appropriate isolation level. Queries are verified with `EXPLAIN` and supported by indexes.",
    },
    {
      key: "node-caching",
      topic: "Caching",
      difficulty: "MEDIUM",
      prompt:
        "Design a caching layer for a read-heavy API. Where do you cache, how do you invalidate, and how do you avoid stampedes?",
      hints: [
        "Layers: CDN/HTTP caches, in-process memory, Redis, database materialised views.",
        "Invalidate on write events or use short TTLs with versioned keys.",
        "Stampede protection: jittered TTLs, single-flight locks, stale-while-revalidate.",
      ],
      keywords: ["cache layer", "TTL", "invalidation", "Redis", "stampede", "stale-while-revalidate", "versioned key"],
      model:
        "I cache at the layer closest to the reader: HTTP/CDN for public responses, Redis for shared expensive reads, in-process memo for hot reference data. Keys are versioned, TTLs jittered, writes invalidate explicitly, and single-flight locks plus stale-while-revalidate protect against stampedes.",
    },
    {
      key: "node-observability",
      topic: "Observability",
      difficulty: "MEDIUM",
      prompt:
        "What do you log, measure and trace in a production Node service, and how do you keep the logs useful without leaking secrets?",
      hints: [
        "Structured JSON logs with request ids, correlation ids, latency and status.",
        "RED/USE metrics; golden signals; traces across service boundaries.",
        "Redact tokens, passwords and personal data before they are written.",
      ],
      keywords: ["structured logging", "correlation id", "metrics", "latency", "tracing", "redaction", "alerting"],
      model:
        "Structured JSON logs with a request/correlation id, method, path, status and duration; metrics for rate/errors/duration plus saturation; distributed traces across services. Secrets and PII are redacted at the logger, and alerts fire on error-rate and latency SLOs rather than raw noise.",
    },
    {
      key: "node-testing",
      topic: "Testing",
      difficulty: "EASY",
      prompt:
        "Describe your testing pyramid for a Node API. What do you unit test, what do you run as integration tests, and how do you keep them fast?",
      hints: [
        "Unit test business logic and pure helpers; integration test routes against a real (containerised) DB.",
        "Prefer supertest-style HTTP tests over heavy mocking.",
        "Isolate tests, reset state per suite, and run them in parallel in CI.",
      ],
      keywords: ["unit test", "integration test", "supertest", "test database", "CI", "isolation", "fixtures"],
      model:
        "Unit tests cover services and pure logic; integration tests exercise the HTTP layer with supertest against a disposable database (Testcontainers/Docker) with per-suite fixtures. Network calls are stubbed, and CI runs the suite in parallel with coverage thresholds.",
    },
    {
      key: "node-architecture",
      topic: "Architecture",
      difficulty: "HARD",
      prompt:
        "How do you design a Node backend so it can be deployed and restarted safely — configuration, graceful shutdown, and zero-downtime deploys?",
      hints: [
        "All config validated at boot; fail fast on missing or invalid values.",
        "Graceful shutdown: stop accepting connections, drain in-flight requests, close DB/Redis clients.",
        "Readiness/liveness probes and migrations decoupled from startup.",
      ],
      keywords: ["graceful shutdown", "config validation", "readiness probe", "drain", "zero downtime", "migration strategy"],
      model:
        "Config is validated at boot with a schema so the process fails fast. On SIGTERM I stop accepting new connections, drain in-flight requests with a timeout, then close DB/Redis/pool clients. Probes mark readiness, and migrations run as a separate, backward-compatible step before rollout.",
    },
  ],
};
