# Developer Assessment & Coding Platform — Backend

A production-ready, multi-role REST API for creating technical assessments, managing
coding/MCQ/written problems, inviting candidates, running timed attempts, evaluating
submissions, and generating reports.

## Features

- **Three roles** — `CANDIDATE`, `RECRUITER`, `ADMIN` with strict authorization.
- **Problem bank** — coding, MCQ, and written problems with test cases, options, tags,
  difficulty, categories, and full-text search.
- **Assessments** — configurable duration, passing score, max attempts, shuffling,
  anti-cheating, and a governed lifecycle: `DRAFT → PUBLISHED → ACTIVE → CLOSED → ARCHIVED`.
- **Timed attempts** — the server is the source of truth for the timer; answers are
  frozen on submission or auto-submission at expiry.
- **Evaluation** — automatic MCQ scoring, manual written scoring by recruiters, and a
  sandboxed architecture for coding evaluation (the API server never executes candidate
  code).
- **Results & reports** — per-attempt results, candidate rankings, question performance,
  and company-level analytics, with Redis caching.
- **Payments (SSLCommerz)** — recruiters purchase credit packages before publishing;
  callbacks are verified and idempotent.
- **Anti-cheating** — proctoring events (tab switch, copy/paste, fullscreen exit, …)
  with server-captured IP and user-agent.
- **Audit logs** — every critical operation is recorded.
- **Soft delete** — all major entities use `deletedAt`.
- **Security** — Helmet, CORS, JWT access + refresh tokens with rotation, bcrypt hashing,
  Zod validation, rate limiting, and ownership checks.

## Architecture

```
src/
├── app.ts / server.ts        # Express app, security middleware, graceful shutdown
├── config/                   # Zod-validated environment configuration
├── helpers/                  # ApiError hierarchy, catchAsync, JWT, response, pagination
├── lib/                      # Prisma client, Redis, audit logger, code runner sandbox
├── middlewares/              # auth (JWT + role), validate (Zod), rate limit, error handler
├── modules/                  # One folder per domain
│   └── <domain>/
│       ├── <domain>.controller.ts
│       ├── <domain>.service.ts

## Installation

```bash
cd server
npm install
```

## Environment Variables

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

| Variable | Description |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | JWT signing secrets |
| `JWT_ACCESS_EXPIRES_IN` / `JWT_REFRESH_EXPIRES_IN` | Token expiry (e.g. `15m`, `7d`) |
| `BCRYPT_SALT_ROUNDS` | Password hashing cost |
| `REDIS_URL` / `REDIS_ENABLED` | Optional Redis for caching |
| `SSLCOMMERZ_STORE_ID` / `SSLCOMMERZ_STORE_PASSWORD` | SSLCommerz credentials |
| `SSLCOMMERZ_IS_LIVE` | `false` for sandbox |
| `CODE_RUNNER_URL` | Remote isolated code execution service (optional) |
| `ALLOW_LOCAL_SANDBOX` | Enable local Node `vm` fallback for dev only (`true`/`false`) |
| `SEED_*` | Local/dev seed credentials |

## Database Setup

```bash
npm run db:migrate     # create and apply migrations
npm run db:seed        # seed admin, recruiter, candidate, company, problems, assessment
npm run db:studio      # open Prisma Studio
```

## Development

```bash
npm run dev            # tsx watch src/server.ts
```

## Production Build

```bash
npm run build          # tsup → dist/server.mjs

## Authentication Flow

1. `POST /api/v1/auth/register` — create an account (candidate or recruiter).
2. `POST /api/v1/auth/login` — receive an `accessToken` and `refreshToken`.
3. Send `Authorization: Bearer <accessToken>` on protected routes.
4. `POST /api/v1/auth/refresh-token` — rotate the refresh token pair.
5. `POST /api/v1/auth/logout` — revoke the refresh token.

## Assessment Lifecycle

```
DRAFT → PUBLISHED (consumes 1 company credit) → ACTIVE → CLOSED → ARCHIVED
```

- Only published/active assessments can be started by invited candidates.
- Publishing from a non-draft state returns `409`.
- Assessments with active attempts reject unsafe modifications (`409`).

## Attempt Lifecycle

```
NOT_STARTED → IN_PROGRESS → SUBMITTED → COMPLETED
                            ↘ AUTO_SUBMITTED (timer expiry) → COMPLETED
```

The server clock is authoritative; client timers are never trusted.

## Payment Flow

```
Recruiter → POST /payments/initiate → SSLCommerz gateway
         ← success/fail/cancel/ipn callbacks (verified + idempotent)
         → company credits granted
```

Callbacks verify the transaction with SSLCommerz before granting credits and are fully
idempotent (duplicate callbacks do not double-credit).

## Role Permissions

### CANDIDATE
Register, manage profile, view invitations, accept/reject, start/save/submit attempts,
view released results and own history.

### RECRUITER
Manage company, create/publish assessments, build problem bank, invite candidates,
evaluate written answers, view results/reports/analytics, purchase credits.

### ADMIN
Manage users/companies/problems/assessments, suspend/activate users, view platform
stats, payments, and audit logs.

## Standard Response Format

```json
{ "success": true, "message": "Operation successful", "data": {} }
{ "success": false, "message": "Something went wrong", "errors": [] }
```

Paginated responses include `meta: { page, limit, total, totalPages }`.

## Security Considerations

- Password hashes, JWT secrets, refresh tokens, and payment credentials are never exposed.
- Hidden coding test cases are never returned to candidates.
- Arbitrary candidate code is never executed inside the API server — it is dispatched to
  an isolated runner (`CODE_RUNNER_URL`), with a restricted local `vm` fallback for dev.
- All inputs are validated with Zod; Prisma prevents SQL injection.
- Rate limiting protects auth, payment, submission, and invitation endpoints.

## Deployment (Render)

1. Create a PostgreSQL database and a Redis instance on Render.
2. Set all environment variables (production secrets — never commit `.env`).
3. Build command: `npm run build`
4. Start command: `npm run db:deploy && npm start`
5. Health check path: `/health`

## Render Deployment Readiness

- Production build via `tsup` → `dist/server.mjs`.
- Graceful shutdown on `SIGTERM` (closes Prisma + Redis).
- `PORT` is read from the environment.
- Migrations run via `prisma migrate deploy`.
- CORS origin is configurable via `CORS_ORIGIN`.
- No secrets are baked into the Docker image.

## API Count

50+ meaningful, database-backed endpoints across Auth, Users, Companies, Problems,
Assessments (+ problems), Invitations, Attempts (+ answers, anti-cheating), Submissions,
Evaluations, Results, Reports, Analytics, Payments, and Admin.

## License

MIT
npm start              # node dist/server.mjs
```

## Testing

```bash
npm test               # Vitest + Supertest (runs against your DATABASE_URL)
npm run typecheck      # tsc --noEmit
npm run lint
npm run format
```

Tests require `DATABASE_URL` and (optionally) `REDIS_URL`. Admin accounts can only be
self-registered when `NODE_ENV=test`.

## Docker

```bash
docker compose up      # API + PostgreSQL + Redis
```

The API container runs migrations, seeds, and starts the dev server automatically.

## API Documentation

- **Swagger UI:** `http://localhost:5000/api/docs`
- **Postman:** import `docs/postman-collection.json`
- **REST reference:** see [`api.md`](api.md) — full endpoint reference, enums, env vars & DB models
- **Health check:** `GET /health`
│       ├── <domain>.routes.ts
│       ├── <domain>.validation.ts
│       └── <domain>.types.ts
├── routes/index.ts           # Mounts every module under /api/v1
├── types/                    # Shared TypeScript types
└── docs/                     # Swagger spec + Postman collection
```

Controllers are thin; services hold business logic; Prisma transactions guard critical
multi-step operations.

## Tech Stack

- **Runtime:** Node.js + TypeScript
- **Framework:** Express.js
- **Database:** PostgreSQL (Prisma ORM + migrations)
- **Validation:** Zod
- **Auth:** JWT (access + refresh with rotation) + bcrypt
- **Caching:** Redis (optional; analytics/reports)
- **Docs:** Swagger/OpenAPI at `/api/docs` + Postman collection
- **Payments:** SSLCommerz
- **Code quality:** ESLint + Prettier
- **Testing:** Vitest + Supertest