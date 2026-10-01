import type { InterviewTopic } from "./types";

export const javaTopic: InterviewTopic = {
  id: "java",
  label: "Java",
  description: "JVM behaviour, collections, concurrency, Spring, persistence and testing.",
  questions: [
    {
      key: "java-memory-gc",
      topic: "JVM & memory",
      difficulty: "HARD",
      prompt:
        "How does the JVM memory model divide the heap, and how do you diagnose an application that pauses for seconds under load?",
      hints: [
        "Young generation (Eden + survivor spaces) handles short-lived objects; old generation holds long-lived ones.",
        "GC pauses depend on the collector: Serial/Parallel vs G1/ZGC/Shenandoah.",
        "Diagnose with GC logs, `jstat`, heap dumps, Java Flight Recorder and allocation profiling.",
      ],
      keywords: ["heap", "young generation", "old generation", "garbage collector", "G1", "ZGC", "pause time", "heap dump"],
      model:
        "New objects are allocated in Eden, survive survivor spaces and eventually promote to the old generation. Long pauses usually mean promotion pressure, oversized heaps for the collector, or a full GC triggered by a leak. I read GC logs and JFR, take a heap dump, then tune the collector/heap or fix the retention bug.",
    },
    {
      key: "java-collections",
      topic: "Collections",
      difficulty: "MEDIUM",
      prompt:
        "Compare `ArrayList`, `LinkedList`, `HashMap` and `TreeMap`. What are the contracts for `equals`/`hashCode` and what happens when you break them?",
      hints: [
        "Array-backed lists win on random access; linked lists rarely win in practice.",
        "`HashMap` needs consistent `equals`/`hashCode`; mutable keys corrupt buckets.",
        "`TreeMap` is sorted by `Comparable`/`Comparator` with O(log n) operations.",
      ],
      keywords: ["ArrayList", "LinkedList", "HashMap", "TreeMap", "equals", "hashCode", "Big-O", "mutable key"],
      model:
        "`ArrayList` gives O(1) random access and is the default; `LinkedList` only helps at the head/tail. `HashMap` is O(1) average and depends on a stable `hashCode`/`equals` pair, otherwise lookups silently miss; mutable keys in hash-based collections are a bug. `TreeMap` adds ordering at O(log n).",
    },
    {
      key: "java-concurrency",
      topic: "Concurrency",
      difficulty: "HARD",
      prompt:
        "Explain the Java concurrency toolbox — threads, executors, `synchronized` vs `ReentrantLock`, atomics, `CompletableFuture` — and how you avoid deadlocks.",
      hints: [
        "Prefer executors/thread pools and higher-level utilities over raw threads.",
        "`synchronized` is simple; `ReentrantLock` adds try-lock, fairness and timeouts.",
        "Avoid deadlock by consistent lock ordering, timeouts and confinement/immutability.",
      ],
      keywords: ["executor", "thread pool", "synchronized", "ReentrantLock", "atomic", "CompletableFuture", "deadlock", "volatile"],
      model:
        "I use bounded thread pools/executors rather than raw threads, prefer immutability and message passing, and use `synchronized` for simple mutual exclusion, locks with timeouts for finer control, atomics for counters and `CompletableFuture` for async composition. Deadlocks are avoided with a global lock ordering and tryLock timeouts.",
    },
    {
      key: "java-spring",
      topic: "Spring",
      difficulty: "MEDIUM",
      prompt:
        "Explain dependency injection and bean scopes in Spring. Why does calling a `@Transactional` method from the same class silently do nothing?",
      hints: [
        "Spring creates proxies around beans to apply AOP (transactions, security, caching).",
        "Self-invocation bypasses the proxy because the call never leaves the object.",
        "Fixes: inject self, extract a collaborator, or use `TransactionTemplate`/AspectJ weaving.",
      ],
      keywords: ["dependency injection", "bean scope", "proxy", "AOP", "transactional", "self-invocation", "singleton"],
      model:
        "Spring wires collaborating beans and wraps annotated beans in proxies for AOP. Default scope is singleton. Self-invocation skips the proxy so `@Transactional`/`@Cacheable` never apply; the fix is to call through another bean, inject the proxy or use `TransactionTemplate`.",
    },
    {
      key: "java-jpa",
      topic: "Persistence",
      difficulty: "HARD",
      prompt:
        "How do you avoid the N+1 problem with JPA/Hibernate, and how do you reason about lazy loading, fetching strategies and transaction boundaries?",
      hints: [
        "Lazy associations loaded inside a loop produce one query per row.",
        "Fixes: `join fetch`, entity graphs, batch fetching, or DTO projections with an explicit query.",
        "Open-Session-In-View hides the problem and makes query counts unpredictable.",
      ],
      keywords: ["JPA", "Hibernate", "N+1", "lazy loading", "join fetch", "entity graph", "DTO projection", "transaction"],
      model:
        "N+1 comes from iterating entities and touching lazy associations. I fix it with `join fetch`/entity graphs, batch fetching, or a DTO projection that selects exactly what the API needs. I keep transaction boundaries at the service layer and avoid Open-Session-In-View so query counts stay explicit.",
    },
    {
      key: "java-exceptions",
      topic: "Error handling",
      difficulty: "MEDIUM",
      prompt:
        "Checked versus unchecked exceptions — what is your policy, and how do you design error handling across layers in a Java service?",
      hints: [
        "Checked exceptions force handling at compile time but pollute signatures.",
        "Domain errors as unchecked exceptions translated to HTTP/problem details at the edge.",
        "Never swallow: log once with context, then wrap or rethrow.",
      ],
      keywords: ["checked exception", "unchecked exception", "domain error", "exception translation", "ControllerAdvice", "logging"],
      model:
        "I use unchecked exceptions for domain and programming errors, keep them out of service signatures, and translate them to HTTP responses with `@ControllerAdvice`/problem details. Checked exceptions are reserved for genuinely recoverable, caller-actionable I/O. Logging happens once, with correlation ids.",
    },
    {
      key: "java-streams",
      topic: "Functional Java",
      difficulty: "MEDIUM",
      prompt:
        "When are streams and lambdas the right tool, and what are the pitfalls — performance, parallelism and readability?",
      hints: [
        "Streams express transformations and reduce loop boilerplate; simple loops can still be clearer.",
        "Do not use `parallelStream` on blocking or shared mutable work; the common pool is shared.",
        "`Optional` is for return types, not fields or parameters.",
      ],
      keywords: ["stream", "lambda", "Optional", "parallel stream", "fork join", "readability", "side effects"],
      model:
        "Streams suit pipelines of pure transformations and reductions; loops stay clearer for complex control flow or early exits. `parallelStream` uses a shared common pool and hurts with blocking I/O or shared state, so I avoid it. `Optional` is a return-type idiom, not a field type.",
    },
    {
      key: "java-testing",
      topic: "Testing",
      difficulty: "MEDIUM",
      prompt:
        "Describe your Java testing strategy: JUnit structure, mocking, integration tests with real infrastructure, and how you test persistence.",
      hints: [
        "Arrange-act-assert with parameterised tests for edge cases.",
        "Mockito for collaborators at the boundary; avoid mocking data structures.",
        "Testcontainers gives real PostgreSQL/Kafka in integration tests.",
      ],
      keywords: ["JUnit", "Mockito", "Testcontainers", "parameterised test", "integration test", "persistence test", "coverage"],
      model:
        "Unit tests cover services with Mockito collaborators and parameterised edge cases; integration tests use Testcontainers for real PostgreSQL/Kafka and assert through the repository layer; end-to-end tests hit the HTTP API. Surefire/Failsafe split unit from integration in CI.",
    },
    {
      key: "java-performance",
      topic: "Performance",
      difficulty: "HARD",
      prompt:
        "A Java service slows down after each deployment. How do you investigate systematically, and what are the usual root causes?",
      hints: [
        "Start with metrics and logs, then JFR/async-profiler for CPU and allocation hotspots.",
        "Common causes: leaking caches/collections, chatty DB access, unbounded thread pools, lock contention.",
        "Only micro-benchmark with JMH after you understand the workload.",
      ],
      keywords: ["JFR", "async-profiler", "heap leak", "lock contention", "connection pool", "JMH", "regression"],
      model:
        "I compare metrics before/after the deploy (latency percentiles, GC time, thread counts, pool saturation), then profile with JFR or async-profiler. Typical culprits are unbounded static caches, connection-pool exhaustion, chatty persistence and lock contention. Fixes are verified with JMH for micro and load tests for macro behaviour.",
    },
  ],
};
