import type { InterviewTopic } from "./types";

export const pythonTopic: InterviewTopic = {
  id: "python",
  label: "Python",
  description: "Language semantics, concurrency, typing, data processing and testing.",
  questions: [
    {
      key: "py-gil",
      topic: "Concurrency",
      difficulty: "HARD",
      prompt:
        "Explain the GIL. What does it mean for CPU-bound versus I/O-bound work, and how do you scale each in Python?",
      hints: [
        "Only one thread executes Python bytecode at a time, but C extensions can release the GIL.",
        "I/O-bound work scales with threads or asyncio because threads release the GIL while waiting.",
        "CPU-bound work needs multiprocessing or native extensions (NumPy, Cython, Rust).",
      ],
      keywords: ["GIL", "threading", "asyncio", "multiprocessing", "I/O bound", "CPU bound", "process pool"],
      model:
        "The GIL serialises Python bytecode execution, so threads help I/O-bound work (they release the lock while waiting) but not CPU-bound work. For CPU-bound parallelism I use `multiprocessing`/`concurrent.futures.ProcessPoolExecutor` or move the hot loop into a native library. Free-threaded builds are starting to change this.",
    },
    {
      key: "py-generators",
      topic: "Iterators & memory",
      difficulty: "MEDIUM",
      prompt:
        "How do generators and `yield` change memory behaviour, and how would you process a 20 GB log file line by line?",
      hints: [
        "Generators produce values lazily, keeping only the current state.",
        "Compose pipelines of generator functions instead of building intermediate lists.",
        "Watch out for accidental materialisation with `list()`, `sorted()` or `len()`.",
      ],
      keywords: ["generator", "yield", "lazy evaluation", "streaming", "memory", "pipeline"],
      model:
        "Generators are lazy iterators that hold one item of state, so a streaming pipeline over a 20 GB file never materialises it. I chain generator functions for parsing/filtering/aggregation and avoid calling `list()` or `sorted()` on unbounded input.",
    },
    {
      key: "py-decorators",
      topic: "Language features",
      difficulty: "MEDIUM",
      prompt:
        "Explain decorators and context managers. Show where each is the right tool (retries, timing, transactions, resource cleanup).",
      hints: [
        "A decorator is a function that takes and returns a function; add `functools.wraps` to preserve metadata.",
        "Context managers (`with`) guarantee cleanup even on exceptions.",
        "Decorators wrap behaviour; context managers scope a resource or transaction.",
      ],
      keywords: ["decorator", "context manager", "functools.wraps", "with statement", "resource cleanup", "retry"],
      model:
        "Decorators wrap callables to add cross-cutting behaviour — retry, timing, auth, caching — and should preserve metadata with `functools.wraps`. Context managers guarantee deterministic acquisition/release, ideal for files, locks, DB sessions and transactions.",
    },
    {
      key: "py-typing",
      topic: "Typing & validation",
      difficulty: "MEDIUM",
      prompt:
        "How do type hints, mypy/pyright and runtime validation (Pydantic) fit together in a production Python service?",
      hints: [
        "Hints are static documentation checked by type checkers, not enforced at runtime.",
        "Runtime validation is required at system boundaries (HTTP, queues, config).",
        "Pydantic can derive runtime models from typed declarations and coerce/validate input.",
      ],
      keywords: ["type hints", "mypy", "pyright", "Pydantic", "runtime validation", "boundary", "schema"],
      model:
        "Type hints plus a checker (mypy/pyright in CI) catch whole classes of bugs statically, but they are erased at runtime. Anything crossing a boundary — HTTP payloads, env vars, queue messages — is validated at runtime with Pydantic/dataclasses so bad data fails fast with a clear error.",
    },
    {
      key: "py-asyncio",
      topic: "Asyncio",
      difficulty: "MEDIUM",
      prompt:
        "When is `asyncio` the right choice in Python, and what mistakes do developers make that make async code slower than sync code?",
      hints: [
        "Async shines with many concurrent I/O waits, not with CPU work.",
        "Blocking calls (`requests`, heavy file I/O, time.sleep) inside a coroutine freeze the loop.",
        "Concurrency vs parallelism: use `asyncio.gather` with limits and timeouts.",
      ],
      keywords: ["asyncio", "coroutine", "await", "event loop", "blocking call", "gather", "timeout"],
      model:
        "`asyncio` is for high-concurrency I/O. The classic mistake is calling blocking libraries inside a coroutine, which stalls the single-threaded loop; that needs async-native clients or `run_in_executor`. I bound concurrency with semaphores/task groups and always set timeouts.",
    },
    {
      key: "py-data",
      topic: "Data processing",
      difficulty: "MEDIUM",
      prompt:
        "You need to aggregate 50 million rows of CSV data nightly. How do you choose between pandas, NumPy, Polars or plain Python, and how do you keep memory under control?",
      hints: [
        "Measure the format: columnar Parquet + chunked reads beat CSV for repeated runs.",
        "Vectorised operations in pandas/Polars/NumPy avoid per-row Python overhead.",
        "Use dtype downcasting, categoricals, chunking/streaming and out-of-core execution.",
      ],
      keywords: ["pandas", "Polars", "NumPy", "vectorisation", "chunking", "dtype", "Parquet"],
      model:
        "I convert the source to Parquet and process in chunks or with an out-of-core/columnar engine (Polars) when the working set exceeds RAM. Vectorised expressions replace row loops, dtypes are downcast and categoricals used for repeated strings, and I never load the whole file as objects.",
    },
    {
      key: "py-testing",
      topic: "Testing",
      difficulty: "EASY",
      prompt:
        "Describe your pytest setup: fixtures, parametrisation, mocking strategy and how you keep the suite fast.",
      hints: [
        "Fixtures define reusable setup with explicit scopes; `conftest.py` shares them repo-wide.",
        "`parametrize` replaces copy-pasted tests and documents edge cases.",
        "Mock at the boundary (HTTP/DB/time) and prefer fakes for internal collaborators.",
      ],
      keywords: ["pytest", "fixture", "parametrize", "mocking", "scope", "boundary", "coverage"],
      model:
        "I use fixtures with tight scopes for setup, `parametrize` for edge cases, and patch only external boundaries (HTTP, time, storage) with fakes for internal collaborators. Fast unit tests dominate; slower integration tests are marked and run separately in CI.",
    },
    {
      key: "py-exceptions",
      topic: "Error handling",
      difficulty: "MEDIUM",
      prompt:
        "How do you design exception handling in Python — custom exception hierarchies, retries, and what you never do with bare `except`?",
      hints: [
        "Catch only what you can handle; never swallow with `except: pass`.",
        "Define domain exceptions so callers can react, and chain with `raise ... from err`.",
        "Retry only idempotent operations, with backoff and jitter.",
      ],
      keywords: ["exception hierarchy", "raise from", "retry", "idempotent", "backoff", "logging", "bare except"],
      model:
        "I define a small domain exception hierarchy, catch specific types where I can genuinely recover, re-raise with `raise X from err` to preserve context, and log once at the boundary. Retries apply only to idempotent calls, with exponential backoff plus jitter.",
    },
    {
      key: "py-performance",
      topic: "Performance",
      difficulty: "HARD",
      prompt:
        "A Python service has a slow endpoint. How do you profile it, and what are your most common optimisation wins?",
      hints: [
        "Profile before optimising: `cProfile`/`py-spy` for CPU, `tracemalloc`/memray for memory, and DB query timing.",
        "Frequent wins: N+1 queries, missing indexes, repeated work, per-row loops.",
        "Consider caching, batching, connection pooling, and moving hot paths to native code.",
      ],
      keywords: ["cProfile", "py-spy", "profiling", "N+1", "caching", "batching", "algorithmic complexity"],
      model:
        "I measure with `py-spy`/`cProfile` and DB timing, then attack the biggest cost first — usually N+1 queries, missing indexes or an O(n²) loop. Wins come from batching, caching, connection pooling and vectorising or porting the hot inner loop to native code.",
    },
  ],
};
