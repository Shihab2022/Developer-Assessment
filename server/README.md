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
```

## Deploying to Vercel

Vercel runs the API as a **serverless function**, not a long-lived server. `src/server.ts`
(`app.listen()`) is only for Docker/Render/VM. The Vercel function entry point is
**`api/index.ts`**, which exposes the Express app as the function's default export.

Deployment configuration:
- `vercel.json` — builds `api/index.ts` with `@vercel/node` and routes all paths to it.
- `package.json` → `vercel-build` runs `npx prisma generate` during build (the Prisma
  client in `generated/` is gitignored and is created on Vercel's build image).

**Required environment variables in Vercel (Settings → Environment Variables):**

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | ✅ | Must be reachable from Vercel (public Postgres host) |
| `JWT_ACCESS_SECRET` | ✅ | Secret, min 1 char |
| `JWT_REFRESH_SECRET` | ✅ | Secret, min 1 char |
| `NODE_ENV` | ✅ | Set to `production` |
| `CORS_ORIGIN` | — | Comma-separated origins your frontend uses |
| `APP_URL` / `API_URL` | — | Set to the deployed Vercel URL |
| `REDIS_ENABLED` / `REDIS_URL` | — | `false` unless you add an external Redis (Upstash) |
| `SSLCOMMERZ_*` / `CODE_RUNNER_URL` | — | Only if you use those integrations |

Apply migrations before go-live:

```bash
npx prisma migrate deploy   # run locally against the production DATABASE_URL
```

The most common cause of HTTP 500 `FUNCTION_INVOCATION_FAILED` is a function module
that doesn't export a handler, or a missing env var at boot (`src/config/index.ts`
throws if `DATABASE_URL` / JWT secrets are absent).

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

## API Route Reference

All endpoints hang off **`http://localhost:5000/api/v1`**. Protected endpoints require
`Authorization: Bearer <accessToken>`.

**Access legend:** 🔓 Public · 🔐 any authenticated user · 🎓 CANDIDATE · 🧑‍💼 RECRUITER/ADMIN · 🛡️ ADMIN

### Authentication — `/api/v1/auth`

| Method | Endpoint | Description | Access |
|---|---|---|---|
| POST | `/auth/register` | Register a new account (CANDIDATE or RECRUITER) | 🔓 |
| POST | `/auth/login` | Log in → `accessToken` + `refreshToken` | 🔓 |
| POST | `/auth/refresh-token` | Rotate refresh token for a new pair | 🔓 |
| POST | `/auth/logout` | Revoke the refresh token | 🔐 |
| GET | `/auth/me` | Get current user profile | 🔐 |

### Users — `/api/v1/users`

| Method | Endpoint | Description | Access |
|---|---|---|---|
| GET | `/users/me` | Get my profile | 🔐 |
| PATCH | `/users/me` | Update my profile (partial) | 🔐 |
| PATCH | `/users/me/password` | Change password (rate-limited) | 🔐 |
| GET | `/users/me/activity` | My recent activity / audit entries | 🔐 |

### Candidates — `/api/v1/candidates`

| Method | Endpoint | Description | Access |
|---|---|---|---|
| GET | `/candidates/me/attempts` | List my attempts | 🎓 |
| GET | `/candidates/me/results` | List my results | 🎓 |
| GET | `/candidates/invitations` | Invitations sent to me | 🎓 |

### Companies — `/api/v1/companies`

| Method | Endpoint | Description | Access |
|---|---|---|---|
| POST | `/companies` | Create a company | 🧑‍💼 |
| GET | `/companies` | List companies (pagination, search) | 🔐 |
| GET | `/companies/:id` | Get a company by id | 🔐 |
| PATCH | `/companies/:id` | Update a company | 🧑‍💼 |
| DELETE | `/companies/:id` | Soft-delete a company | 🧑‍💼 |
| GET | `/companies/:id/members` | List company members | 🔐 |
| GET | `/companies/:id/analytics` | Company analytics | 🧑‍💼 |
| GET | `/companies/:companyId/candidates` | List a company's candidates | 🧑‍💼 |
| PATCH | `/companies/candidates/:id/status` | Update recruitment status (INVITED…HIRED/REJECTED) | 🧑‍💼 |
| GET | `/companies/:id/reports` | List company-level reports | 🧑‍💼 |
| GET | `/companies/:id/reports/summary` | Company report summary | 🧑‍💼 |

### Problems — `/api/v1/problems`

| Method | Endpoint | Description | Access |
|---|---|---|---|
| POST | `/problems` | Create CODING / MCQ / WRITTEN problem | 🧑‍💼 |
| GET | `/problems` | List problems (filter, sort, paginate) | 🔐 |
| GET | `/problems/search?q=…` | Full-text search | 🔐 |
| GET | `/problems/:id` | Get problem (hidden test cases never exposed) | 🔐 |
| PATCH | `/problems/:id` | Update a problem | 🧑‍💼 |
| DELETE | `/problems/:id` | Soft-delete a problem | 🧑‍💼 |

### Assessments — `/api/v1/assessments`

| Method | Endpoint | Description | Access |
|---|---|---|---|
| POST | `/assessments` | Create an assessment | 🧑‍💼 |
| GET | `/assessments` | List assessments (`?q&status&companyId`) | 🔐 |
| GET | `/assessments/:id` | Get an assessment | 🔐 |
| PATCH | `/assessments/:id` | Update (DRAFT/PUBLISHED only) | 🧑‍💼 |
| DELETE | `/assessments/:id` | Soft-delete | 🧑‍💼 |
| POST | `/assessments/:id/publish` | Publish (DRAFT → PUBLISHED, consumes credit) | 🧑‍💼 |
| POST | `/assessments/:id/close` | Close assessment | 🧑‍💼 |
| POST | `/assessments/:id/duplicate` | Duplicate assessment | 🧑‍💼 |
| POST | `/assessments/:id/archive` | Archive assessment | 🧑‍💼 |
| POST | `/assessments/:id/restore` | Restore archived assessment | 🧑‍💼 |
| POST | `/assessments/:id/recalculate-results` | Recompute all results | 🧑‍💼 |
| GET | `/assessments/:id/candidates/compare` | Compare candidate performance | 🧑‍💼 |
| GET | `/assessments/:id/history` | Status-change history | 🧑‍💼 |
| POST | `/assessments/:id/problems` | Add problem (points, order, section) | 🧑‍💼 |
| GET | `/assessments/:id/problems` | List assessment problems | 🔐 |
| PATCH | `/assessments/:id/problems/:problemId` | Update problem config | 🧑‍💼 |
| DELETE | `/assessments/:id/problems/:problemId` | Remove problem from assessment | 🧑‍💼 |
| GET | `/assessments/:id/report` | Assessment report | 🧑‍💼 |
| GET | `/assessments/:id/report/export.csv` | Export report as CSV | 🧑‍💼 |
| GET | `/assessments/:id/analytics` | Assessment analytics | 🧑‍💼 |
| GET | `/assessments/:id/results` | Results for an assessment | 🧑‍💼 |

### Invitations — `/api/v1`

| Method | Endpoint | Description | Access |
|---|---|---|---|
| POST | `/assessments/:id/invitations` | Invite candidates by email | 🧑‍💼 |
| GET | `/assessments/:id/invitations` | List invitations for an assessment | 🧑‍💼 |
| POST | `/invitations/:id/resend` | Resend invitation email (rate-limited) | 🧑‍💼 |
| POST | `/invitations/:id/accept` | Accept an invitation | 🎓 |
| POST | `/invitations/:id/reject` | Reject an invitation | 🎓 |

### Attempts — `/api/v1`

| Method | Endpoint | Description | Access |
|---|---|---|---|
| POST | `/assessments/:id/attempts/start` | Start a timed attempt | 🎓 |
| GET | `/attempts/:id` | Get attempt details | 🔐 |
| GET | `/attempts/:id/time` | Remaining time (server-authoritative) | 🔐 |
| GET | `/attempts/:id/questions` | Attempt questions (no hidden tests) | 🔐 |
| POST | `/attempts/:id/answers` | Save an answer (MCQ/code/written) | 🎓 |
| PATCH | `/attempts/:id/answers/:answerId` | Update a saved answer | 🎓 |
| POST | `/attempts/:id/submit` | Submit attempt → evaluation + result | 🎓 |
| GET | `/attempts/:id/anti-cheating-report` | Anti-cheating report | 🔐 |
| POST | `/attempts/:id/anti-cheating-events` | Report a proctoring event | 🎓 |
| GET | `/attempts/:id/anti-cheating-events` | List proctoring events | 🔐 |
| GET | `/attempts/:id/submissions` | Submissions for this attempt | 🔐 |
| GET | `/attempts/:id/evaluations` | Evaluations for this attempt | 🔐 |

### Submissions — `/api/v1/submissions`

| Method | Endpoint | Description | Access |
|---|---|---|---|
| POST | `/submissions` | Create a coding submission (rate-limited) | 🎓 |
| GET | `/submissions/:id` | Get a submission | 🔐 |
| POST | `/submissions/:id/evaluate` | Trigger sandbox evaluation | 🧑‍💼 |

### Evaluations — `/api/v1/evaluations`

| Method | Endpoint | Description | Access |
|---|---|---|---|
| GET | `/evaluations/pending` | List pending manual evaluations | 🧑‍💼 |
| POST | `/evaluations/written` | Manually score a written answer | 🧑‍💼 |

### Results — `/api/v1/results`

| Method | Endpoint | Description | Access |
|---|---|---|---|
| GET | `/results/:id` | Get a result (respects `showResults` policy) | 🔐 |
| GET | `/results/:id/skills` | Skill-wise breakdown | 🔐 |

### Assessment Templates — `/api/v1/assessment-templates`

| Method | Endpoint | Description | Access |
|---|---|---|---|
| POST | `/assessment-templates` | Create a reusable template | 🧑‍💼 |
| GET | `/assessment-templates` | List templates | 🔐 |
| GET | `/assessment-templates/:id` | Get a template | 🔐 |
| PATCH | `/assessment-templates/:id` | Update a template | 🧑‍💼 |
| DELETE | `/assessment-templates/:id` | Delete a template | 🧑‍💼 |
| POST | `/assessment-templates/:id/use` | Create an assessment from a template | 🧑‍💼 |

### Notes — `/api/v1/notes`

| Method | Endpoint | Description | Access |
|---|---|---|---|
| POST | `/notes` | Add a note to a candidate | 🧑‍💼 |
| GET | `/notes/candidate/:candidateId` | List a candidate's notes | 🔐 |
| PATCH | `/notes/:noteId` | Update a note | 🧑‍💼 |
| DELETE | `/notes/:noteId` | Delete a note | 🧑‍💼 |

### Notifications — `/api/v1/notifications`

| Method | Endpoint | Description | Access |
|---|---|---|---|
| GET | `/notifications` | List my notifications | 🔐 |
| GET | `/notifications/unread-count` | Unread notification count | 🔐 |
| PATCH | `/notifications/:id/read` | Mark a notification as read | 🔐 |
| POST | `/notifications/read-all` | Mark all notifications as read | 🔐 |

### Dashboard — `/api/v1/dashboard`

| Method | Endpoint | Description | Access |
|---|---|---|---|
| GET | `/dashboard/recruiter` | Recruiter dashboard stats | 🧑‍💼 |
| GET | `/dashboard/candidate` | Candidate dashboard stats | 🎓 |

### Payments — `/api/v1/payments`

| Method | Endpoint | Description | Access |
|---|---|---|---|
| GET | `/payments/packages` | List credit packages | 🔓 |
| POST | `/payments/initiate` | Initiate payment → gateway URL | 🔐 |
| GET/POST | `/payments/success` | SSLCommerz success callback | 🔓 (webhook) |
| GET/POST | `/payments/fail` | SSLCommerz failure callback | 🔓 (webhook) |
| GET/POST | `/payments/cancel` | SSLCommerz cancel callback | 🔓 (webhook) |
| POST | `/payments/ipn` | SSLCommerz IPN (idempotent) | 🔓 (webhook) |
| GET | `/payments` | List my payments | 🔐 |
| GET | `/payments/:id` | Get a payment | 🔐 |

### Admin — `/api/v1/admin` (🛡️ ADMIN only)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/admin/users` | List all users |
| GET | `/admin/users/:id` | Get user details |
| PATCH | `/admin/users/:id/status` | Set ACTIVE / SUSPENDED / DELETED |
| PATCH | `/admin/users/:id/role` | Change role (CANDIDATE / RECRUITER / ADMIN) |
| GET | `/admin/companies` | List all companies |
| GET | `/admin/assessments` | List all assessments |
| GET | `/admin/payments` | List all payments |
| GET | `/admin/problems` | List all problems |
| GET | `/admin/dashboard-stats` | Platform statistics & revenue |
| GET | `/admin/audit-logs` | Query audit logs |

### System

| Method | Endpoint | Description | Access |
|---|---|---|---|
| GET | `/` | Service banner / smoketest | 🔓 |
| GET | `/health` | Health check (when enabled) | 🔓 |
| GET | `/api/docs` | Swagger UI | 🔓 |

## Sample JSON Payloads (Test Data)

Copy-paste these bodies to exercise the API. Replace `<uuid>` placeholders with real ids
returned by earlier create endpoints, and send the access token from login as
`Authorization: Bearer <accessToken>`. Passwords match the seed credentials above.

### Register a recruiter

```http
POST /api/v1/auth/register
Content-Type: application/json
```

```json
{
  "name": "Rina Recruiter",
  "email": "recruiter@techcorp.dev",
  "password": "Recruit123!",
  "role": "RECRUITER",
  "phone": "+8801700000001"
}
```

### Register a candidate

```http
POST /api/v1/auth/register
```

```json
{
  "name": "Cody Candidate",
  "email": "candidate@devassess.local",
  "password": "Candid8te!",
  "role": "CANDIDATE"
}
```

### Login (returns `accessToken` + `refreshToken`)

```http
POST /api/v1/auth/login
```

```json
{ "email": "recruiter@techcorp.dev", "password": "Recruit123!" }
```

### Refresh & logout

```http
POST /api/v1/auth/refresh-token
```

```json
{ "refreshToken": "<refreshToken from login>" }
```

```http
POST /api/v1/auth/logout
```

```json
{ "refreshToken": "<refreshToken from login>" }
```

### Update own profile

```http
PATCH /api/v1/users/me
```

```json
{
  "name": "Rina Recruiter",
  "bio": "Hiring the best backend engineers in Dhaka.",
  "skills": ["nodejs", "express", "postgresql"],
  "experience": 8,
  "jobTitle": "Technical Hiring Manager"
}
```

### Change password

```http
PATCH /api/v1/users/me/password
```

```json
{ "currentPassword": "Recruit123!", "newPassword": "Recruit12345!" }
```

### Create a company

```http
POST /api/v1/companies
```

```json
{
  "name": "TechCorp Solutions",
  "description": "A software company hiring top developers.",
  "website": "https://techcorp.example.com",
  "industry": "Software Development",
  "location": "Dhaka, Bangladesh",
  "size": "50-100"
}
```

### Create an MCQ problem

```http
POST /api/v1/problems
```

```json
{
  "title": "JavaScript Event Loop Basics",
  "description": "Which statement best describes how the JavaScript event loop handles a Promise.then callback?",
  "type": "MCQ",
  "difficulty": "EASY",
  "category": "javascript",
  "points": 5,
  "tags": ["javascript", "async"],
  "options": [
    { "text": "It runs synchronously in the call stack", "isCorrect": false, "order": 0 },
    { "text": "It is queued in the microtask queue and runs after the current stack unwinds", "isCorrect": true, "order": 1 },
    { "text": "It runs on a separate OS thread", "isCorrect": false, "order": 2 },
    { "text": "It runs only after all setTimeout callbacks", "isCorrect": false, "order": 3 }
  ]
}
```

### Create a CODING problem

```http
POST /api/v1/problems
```

```json
{
  "title": "Add Two Numbers",
  "description": "Write a function that reads two integers a and b from stdin and prints their sum to stdout.",
  "type": "CODING",
  "difficulty": "EASY",
  "category": "algorithms",
  "points": 15,
  "timeLimit": 15,
  "memoryLimit": 256,
  "allowedLanguages": ["javascript", "python", "go"],
  "examples": [
    { "input": "1\n2", "output": "3", "explanation": "1 + 2 = 3" }
  ],
  "testCases": [
    { "input": "1\n2", "expectedOutput": "3", "isHidden": false, "order": 0 },
    { "input": "10\n20", "expectedOutput": "30", "isHidden": true, "order": 1 },
    { "input": "-5\n5", "expectedOutput": "0", "isHidden": true, "order": 2 }
  ]
}
```

### Create a WRITTEN problem

```http
POST /api/v1/problems
```

```json
{
  "title": "Explain REST vs GraphQL",
  "description": "Explain the key differences between REST and GraphQL, and when you would choose each.",
  "type": "WRITTEN",
  "difficulty": "MEDIUM",
  "category": "api-design",
  "points": 10,
  "expectedAnswer": "REST exposes resource-oriented endpoints and is a good default...; GraphQL exposes a single flexible endpoint..."
}
```

### Search problems

```http
GET /api/v1/problems/search?q=javascript
```

### Create an assessment

```http
POST /api/v1/assessments
```

```json
{
  "title": "Junior Node.js Developer Assessment",
  "description": "Baseline screening assessment for junior backend engineers.",
  "instructions": "Answer all questions. The timer starts when you start the attempt and the server clock is the source of truth.",
  "durationMinutes": 45,
  "passingScore": 15,
  "startDate": "2026-09-01T00:00:00.000Z",
  "endDate": "2026-12-31T23:59:59.000Z",
  "maxAttempts": 1,
  "shuffleProblems": true,
  "shuffleOptions": false,
  "showResults": true,
  "antiCheatingEnabled": true,
  "showCandidateRanking": true,
  "resultStrategy": "LATEST_SCORE",
  "accessLevel": "INVITATION_ONLY"
}
```

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