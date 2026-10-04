/**
 * Authored DevOps question bank (Docker, Kubernetes, MongoDB, PostgreSQL,
 * Redis). Compact tuple form expanded into `BankQuestion` records by
 * `scripts/build-question-banks.mjs devops`.
 *
 * Tuple shape: [topic, difficulty, prompt, [A, B, C, D], correctIndex, explanation]
 * Difficulty → level: EASY → L1, MEDIUM → L2, HARD → L3.
 */

export const DEVOPS_LEVELS = [
  { id: "L1", label: "Fundamental" },
  { id: "L2", label: "Intermediate" },
  { id: "L3", label: "Advanced" },
];

export const DEVOPS_LABEL = "DevOps";
export const DEVOPS_DESCRIPTION =
  "Delivery-stack MCQ: Docker & Kubernetes, MongoDB, PostgreSQL, Redis and the CI/CD pipelines that glue them together.";

export const DEVOPS_QUESTIONS = [
  // ---------------------------------------------------------------- Docker
  ["Docker", "EASY", "What does `docker run -d nginx` do differently from `docker run nginx`?",
    ["It runs nginx with an interactive terminal attached", "It runs nginx detached in the background so the shell returns immediately", "It disables nginx networking", "It rebuilds the image before running"],
    1, "The `-d` flag runs the container detached. Without it the container's logs stream into the terminal and the shell stays attached until the container exits."],

  ["Docker", "EASY", "A Dockerfile line reads `COPY package.json ./`. When does that layer rebuild?",
    ["On every docker build, unconditionally", "Only when package.json or the build context changes — otherwise the cached layer is reused", "Only when the image tag changes", "Whenever the base image is pulled"],
    1, "Docker caches layers in order, so copying the manifest before the source keeps the expensive install layer valid while only application code changes."],

  ["Docker", "EASY", "Which command shows only the containers currently running?",
    ["docker ps", "docker ps -a", "docker images", "docker top"],
    0, "`docker ps` lists running containers; `docker ps -a` also includes stopped ones. `docker images` lists images, not containers."],

  ["Docker", "EASY", "In a Dockerfile, what is the difference between `CMD` and `ENTRYPOINT`?",
    ["They are identical aliases", "ENTRYPOINT defines the executable while CMD supplies default arguments that can be overridden at run time", "CMD runs at build time and ENTRYPOINT at run time", "ENTRYPOINT only works on Windows images"],
    1, "`ENTRYPOINT` pins the executable; `CMD` provides defaults that `docker run <image> <args>` can override on the command line."],

  ["Docker", "EASY", "What problem does `docker compose up` solve?",
    ["It compiles Go binaries for containers", "It starts every service in a compose file (app, database, cache) with one command", "It scans images for vulnerabilities", "It rotates container log files"],
    1, "Compose reads a declarative compose.yaml and brings the whole multi-container stack up together with shared networking."],

  ["Docker", "MEDIUM", "An image is 1.4 GB and CI bandwidth is the bottleneck. Which change shrinks it most?",
    ["Switch the final stage to a slim/distroless base and use a multi-stage build", "Add more COPY layers", "Run apt-get upgrade in the final stage", "Disable layer caching"],
    0, "Most bytes come from the base image and build-only tooling. A multi-stage build copies just the artifact into a minimal runtime image."],

  ["Docker", "MEDIUM", "A container must reach another service in the same compose file. How does it address it?",
    ["By its container ID", "By the service name from compose.yaml, which Compose registers as a DNS name", "By localhost of the host machine", "By a hardcoded IP address"],
    1, "Compose creates a user-defined network and registers each service under its service name, so `postgres:5432` just works."],

  ["Docker", "MEDIUM", "Why does a `RUN rm -rf /var/cache` line NOT shrink the final image?",
    ["rm is unavailable during docker build", "Docker ignores deletions", "Each instruction is a layer — the deleted bytes remain in the earlier layer", "The cache is recreated automatically"],
    2, "Layers are additive; deleting later only hides the bytes. Clean up inside the same RUN, or discard the whole layer with a multi-stage build."],

  ["Docker", "MEDIUM", "What does the `HEALTHCHECK` instruction do for a container?",
    ["Reports build status to Docker Hub", "Runs a periodic command and marks the container healthy or unhealthy so orchestrators can route around failures", "Auto-restarts the container when it exits", "Encrypts the container filesystem"],
    1, "HEALTHCHECK lets the runtime probe the process. Compose uses it for `service_healthy` dependencies, and Kubernetes covers the same ground with its own probes."],

  ["Docker", "MEDIUM", "Which build flag forces every Dockerfile instruction to re-run?",
    ["--no-cache", "--fresh", "--force", "--rebuild"],
    0, "`docker build --no-cache` bypasses the layer cache, the standard fix when a stale cache produces a broken image."],

  ["Docker", "MEDIUM", "Where should a production API key live so it never bakes into an image layer?",
    ["As an ARG in the Dockerfile", "As an ENV set at build time", "Injected at run time via a secret, env var or the orchestrator's secret store", "In a COPY'd .env file"],
    2, "Anything written at build time (ARG, ENV, COPY) persists in image history. Secrets belong to the run-time environment."],

  ["Docker", "HARD", "Which construct most reliably waits for postgres before starting the app in compose?",
    ["depends_on without conditions", "A healthcheck plus depends_on: condition: service_healthy", "sleep 30 in the app entrypoint", "Restarting the app every 10 seconds"],
    1, "Plain depends_on only orders container creation, not readiness. The healthcheck condition waits until postgres actually accepts connections."],

  ["Docker", "HARD", "In CI the npm dependency layer rebuilds although package.json is unchanged. Most likely cause?",
    ["npm ci is inherently uncached", "The base image was re-pulled", "package-lock.json is copied later than package.json, so the cache invalidates at that instruction", "Docker cache is disabled for node images"],
    2, "Cache invalidates at the first changed instruction. Copy both manifest files (and nothing else) before running the install so the layer stays hot."],

  ["Docker", "HARD", "What does `docker compose up --scale api=3` actually give you?",
    ["Three separate networks, one per replica", "Three replicas sharing the service DNS name so queries round-robin across them", "A Kubernetes deployment", "Three hosts instead of one"],
    1, "Scaling in Compose creates more containers for the service; they all register under the same DNS name, giving simple load balancing."],

  // ------------------------------------------------------------ Kubernetes
  ["Kubernetes", "EASY", "What is the smallest deployable unit in Kubernetes?",
    ["A node", "A pod", "A deployment", "A namespace"],
    1, "A pod wraps one or more containers that share a network namespace and volumes; deployments and services operate *on* pods."],

  ["Kubernetes", "EASY", "Which resource exposes a set of pods to traffic inside the cluster?",
    ["ConfigMap", "Service", "Secret", "PersistentVolumeClaim"],
    1, "A Service provides a stable virtual IP and DNS name in front of pods, which are ephemeral and get new IPs whenever they restart."],

  ["Kubernetes", "EASY", "What does `kubectl rollout undo deployment/api` do?",
    ["Deletes the deployment", "Rolls the deployment back to its previous revision", "Pauses all traffic", "Upgrades kubectl"],
    1, "Rollout undo reverts to the last recorded ReplicaSet revision — the fastest recovery from a bad release."],

  ["Kubernetes", "MEDIUM", "A pod's liveness probe fails ~40 seconds after start. What should be configured?",
    ["A higher CPU limit", "initialDelaySeconds so the probe waits until the application finishes booting", "A readiness probe instead", "A nodeSelector"],
    1, "Liveness probes firing before boot completes cause restart loops. initialDelaySeconds (or a startupProbe) covers slow starts; readiness decides when traffic is sent."],

  ["Kubernetes", "MEDIUM", "Which object holds non-sensitive configuration the pod reads as environment variables?",
    ["Secret", "ConfigMap", "PersistentVolumeClaim", "Ingress"],
    1, "ConfigMaps carry configuration, mounted as files or injected via envFrom. Secrets are the counterpart for credentials."],

  ["Kubernetes", "MEDIUM", "How do you keep three replicas off the same node?",
    ["Node labels only", "podAntiAffinity rules", "A ConfigMap flag", "Increasing maxSurge"],
    1, "Anti-affinity makes the scheduler spread replicas across nodes — required or preferred depending on how strictly the HA policy must hold."],

  ["Kubernetes", "MEDIUM", "What does a `readinessProbe` control?",
    ["How long the container may run", "Whether the pod is added to the Service endpoints and receives traffic", "How often logs are flushed", "Which image version is pulled"],
    1, "Readiness gates traffic: failing pods are removed from Service endpoints while the container keeps running and the liveness probe keeps it alive."],

  ["Kubernetes", "HARD", "A Deployment sets maxUnavailable=0, maxSurge=100%. What happens on a bad release?",
    ["Capacity drops to zero", "A replacement pod starts before any old pod is removed, so capacity is preserved while the rollout proceeds", "The API server rejects the rollout", "Pods restart in place"],
    1, "maxSurge starts the new pod first and maxUnavailable=0 keeps old replicas serving; the swap happens only when the new pod is ready."],

  ["Kubernetes", "HARD", "On what does a Horizontal Pod Autoscaler base its decisions by default?",
    ["Node CPU", "Average pod CPU utilisation against a configured target", "Disk I/O", "Network throughput"],
    1, "HPA computes average pod CPU (other metrics require the custom-metrics adapter) and adjusts replicas to hit the target utilisation."],

  ["Kubernetes", "HARD", "Why is a hostPath volume usually discouraged for shared application data?",
    ["It breaks NFS", "Data is tied to one node — it disappears if the pod is rescheduled elsewhere and exposes the node's files", "It requires root only", "It disables probes"],
    1, "hostPath is node-local and leaks host paths into containers. A PVC backed by a proper StorageClass is the portable, durable answer."],

  // -------------------------------------------------------------- MongoDB
  ["MongoDB", "EASY", "What is the closest MongoDB analogue of a SQL table?",
    ["A document", "A collection", "An index", "A shard"],
    1, "Collections group documents; a single BSON document plays the role a row plays in SQL."],

  ["MongoDB", "EASY", "Which field is indexed automatically on every collection?",
    ["_id", "createdAt", "All fields", "None — indexes are always created manually"],
    0, "MongoDB auto-creates a unique index on `_id`, guaranteeing a fast primary lookup for every document."],

  ["MongoDB", "EASY", "By default, what happens when you iterate a large `find()` cursor?",
    ["Every match is loaded into memory immediately", "Documents stream in batches, so huge result sets can be processed without buffering them", "Only the first document is returned", "The query blocks until it times out"],
    1, "Cursors fetch batches (101 documents by default), which keeps memory bounded while you iterate."],

  ["MongoDB", "MEDIUM", "Orders must be grouped by status and summed by amount. Which aggregation pair does that?",
    ["$match then $group", "$find then $sort", "$lookup only", "$project only"],
    0, "`$match` filters early so indexes apply, and `$group` performs the grouping and summation — `$group` is the aggregating stage."],

  ["MongoDB", "MEDIUM", "Why does `db.users.updateOne({ _id: 1 }, { name: \"Ann\" })` fail?",
    ["updateOne needs a query filter", "The update document must use operators such as $set — a bare document is treated as a replacement", "Users cannot be updated", "_id must be a string"],
    1, "Replacement documents are only valid with `replaceOne`. `updateOne` requires update operators like `$set` or `$inc`."],

  ["MongoDB", "MEDIUM", "Which index best supports `find({ status: 1 }).sort({ createdAt: -1 })`?",
    ["An index on createdAt alone", "A compound index { status: 1, createdAt: -1 }", "Two single-field indexes", "No index is needed"],
    1, "The equality prefix plus descending sort index returns results already in order, avoiding MongoDB's 32 MB in-memory sort limit."],

  ["MongoDB", "MEDIUM", "How do `primaryPreferred` and `secondary` read preferences differ?",
    ["They are identical", "secondary always reads replicas (possibly stale); primaryPreferred prefers the primary and falls back to replicas", "primaryPreferred ignores the primary", "Both forbid replica reads"],
    1, "secondary spreads read load but may serve stale data; primaryPreferred only touches replicas when the primary is unavailable."],

  ["MongoDB", "HARD", "What does write concern `w: majority` guarantee?",
    ["Writes skip the journal", "The write is acknowledged after a majority of voting nodes have persisted it, so it survives a later failover", "Every replica acks synchronously", "Writes fail on the primary"],
    1, "majority waits until more than half the voting set has the write — a deliberate durability-over-latency trade."],

  ["MongoDB", "HARD", "A single document hits the 16 MB cap because every order item is embedded. What is the fix?",
    ["Raise the limit with a config flag", "Move items into a child collection and reference them from the parent", "Store overflow in GridFS", "Compress the document"],
    1, "16 MB is a hard BSON limit; unbounded one-to-many data belongs in its own collection keyed by the parent id."],

  ["MongoDB", "HARD", "Why do inserts skew onto one shard after sharding on a monotonically increasing _id?",
    ["Sharding disables _id indexes", "New keys always land in the last chunk, concentrating writes instead of spreading them", "ObjectIds cannot be hashed", "Replicas absorb the writes"],
    1, "Rising keys funnel every insert into the newest chunk; a hashed or otherwise randomised shard key spreads the load."],

  // ----------------------------------------------------------- PostgreSQL
  ["PostgreSQL", "EASY", "Which clause filters rows *before* GROUP BY runs?",
    ["HAVING", "WHERE", "ORDER BY", "DISTINCT"],
    1, "`WHERE` filters individual rows before aggregation; `HAVING` filters the aggregated groups afterwards."],

  ["PostgreSQL", "EASY", "What does `a INNER JOIN b ON a.id = b.id` return?",
    ["Every row from both tables", "Only rows where the condition matches on both sides", "Only rows from a", "All rows including unmatched"],
    1, "An inner join keeps matching pairs only; unmatched rows from either side are dropped (a FULL OUTER JOIN would keep them)."],

  ["PostgreSQL", "EASY", "Which keyword locks the rows a SELECT reads until the transaction ends?",
    ["UNIQUE", "FOR UPDATE", "CHECK", "REFERENCES"],
    1, "`SELECT ... FOR UPDATE` row-locks the result so concurrent writers wait — the standard defence against lost updates."],

  ["PostgreSQL", "EASY", "What is the difference between CHAR(n) and VARCHAR(n) for a name column?",
    ["None", "CHAR pads with spaces to the fixed length, VARCHAR stores only the actual characters", "VARCHAR is always faster", "CHAR supports Unicode, VARCHAR does not"],
    1, "CHAR(n) space-pads to exactly n characters, which surprises equality checks; VARCHAR(n) stores only what you insert."],

  ["PostgreSQL", "MEDIUM", "Why can `WHERE lower(email) = 'ann@x.com'` skip a plain index on email?",
    ["Function calls are banned in WHERE", "The predicate is an expression while the index covers the raw column — index lower(email) instead", "PostgreSQL cannot index functions at all", "email cannot be indexed"],
    1, "An index scan must match the expression: `CREATE INDEX ON users (lower(email))` lets the planner use it."],

  ["PostgreSQL", "MEDIUM", "What does VACUUM accomplish that DELETE alone does not?",
    ["Truncates the table", "Reclaims dead tuples, refreshes visibility maps and prevents transaction ID wraparound", "Rebuilds every index", "Commits the transaction"],
    1, "DELETE only marks rows dead; vacuum reclaims space, updates statistics and enables index-only scans via the visibility map."],

  ["PostgreSQL", "MEDIUM", "Which tool reveals that a correlated subquery runs once per outer row?",
    ["EXPLAIN ANALYZE", "SHOW ALL", "VACUUM VERBOSE", "pg_stat_reset()"],
    0, "`EXPLAIN ANALYZE` executes the query and reports loops per plan node, exposing a nested loop whose inner query executes N times."],

  ["PostgreSQL", "MEDIUM", "A query returns rows in a different order on each run. Which clause makes it deterministic?",
    ["DISTINCT", "ORDER BY", "GROUP BY", "HAVING"],
    1, "Without ORDER BY the plan is free to return parallel or hash order; ORDER BY pins the sequence."],

  ["PostgreSQL", "HARD", "A yearly DELETE on a 200M-row table runs for minutes and bloats the table. Best fix?",
    ["Add LIMIT 1000", "Delete in small batches so locks stay short and autovacuum can reclaim incrementally", "Wrap it in one long transaction", "Disable autovacuum"],
    1, "Batched deletes keep lock times and WAL bursts small and let vacuum keep up instead of producing one giant dead-tuple spike."],

  ["PostgreSQL", "HARD", "Which index type suits append-ordered time-series ranges and stays tiny?",
    ["GIN", "BRIN", "Partial B-tree", "Expression index"],
    1, "BRIN stores min/max per block range, so for naturally ordered data like timestamps it is orders of magnitude smaller than a B-tree."],

  // ---------------------------------------------------------------- Redis
  ["Redis", "EASY", "Why is Redis usually faster than a relational database?",
    ["It executes SQL", "The dataset lives in memory and commands run in a single event loop without lock contention", "It stores data on SSD only", "It uses columnar storage"],
    1, "In-memory storage plus a single-threaded command loop means no lock contention between clients — the source of Redis's latency."],

  ["Redis", "EASY", "Which structure fits a leaderboard ordered by score?",
    ["List", "Sorted set (ZSET)", "Bitmap", "String"],
    1, "Sorted sets keep members ordered by score, giving O(log N) rank and range queries — exactly what a leaderboard needs."],

  ["Redis", "EASY", "Which command performs an atomic increment?",
    ["INCR key", "SET key key+1", "APPEND key 1", "LPUSH key 1"],
    0, "`INCR` is atomic, creates the key when missing, and is the building block for counters and rate limits."],

  ["Redis", "EASY", "How do you give a key a 60-second lifetime?",
    ["EXPIRE key 60", "SET key 60", "TTL key 60", "PERSIST key 60"],
    0, "`EXPIRE key 60` sets a TTL in seconds; `SET key v EX 60` does it in one atomic command."],

  ["Redis", "MEDIUM", "What is the difference between RDB and AOF persistence?",
    ["RDB appends writes, AOF snapshots", "RDB takes periodic snapshots while AOF appends writes — AOF loses less data but grows larger", "They are the same format", "RDB requires a replica"],
    1, "RDB gives compact point-in-time snapshots; AOF replays an append log (fsync everysec by default) trading size for durability."],

  ["Redis", "MEDIUM", "How does Redis Cluster route a key?",
    ["Hash modulo the node count", "CRC16(key) mod 16384 mapped through hash-slot ownership", "Random assignment", "By key prefix"],
    1, "CRC16(key) % 16384 picks one of 16384 hash slots, and each slot lives on exactly one primary — node moves keep slots stable."],

  ["Redis", "MEDIUM", "What problem does `SET mylock <token> NX PX 5000` solve?",
    ["It caches five keys at once", "It creates a lock that expires after 5 seconds if the holder crashes", "It replicates the key to five nodes", "It sets a bulk TTL"],
    1, "NX makes the set only-if-absent (one winner) and PX bounds the lock so a dead holder can never block others forever."],

  ["Redis", "HARD", "Which distributed-lock release pattern is safe?",
    ["DEL mylock from any client", "Read the token, then release only when it still matches (compare-and-delete, ideally as a Lua script)", "Never delete the key", "EXPIRE mylock 0"],
    1, "Between an owner's check and delete, the lock may have expired and been re-acquired; the token check (atomically in Lua) prevents deleting someone else's lock."],

  ["Redis", "HARD", "maxmemory is reached with `maxmemory-policy noeviction`. What happens on the next write?",
    ["Writes silently overwrite old keys", "Writes fail with OOM errors until memory is freed or a policy is configured", "Redis automatically flushes everything", "Only reads fail"],
    1, "noeviction keeps every key and refuses new writes once full — an outage unless you configure an LRU/LFU policy or add capacity."],
];
