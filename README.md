# Developer Assessment & Coding Platform

A production-ready, multi-role REST API for creating **coding / MCQ / written** technical
assessments, inviting candidates, running **server-timed attempts**, evaluating submissions,
and generating results, reports, and analytics.

## 📚 Documentation

| Resource | Link |
|---|---|
| Backend setup, architecture, env vars, deployment | [`server/README.md`](server/README.md) |
| Full REST API reference (enums, DB models, Postman) | [`server/api.md`](server/api.md) |
| Interactive Swagger UI | `http://localhost:5000/api/docs` |
| Postman collection | [`server/docs/postman-collection.json`](server/docs/postman-collection.json) |

## ✨ Features

- **Three roles** — `CANDIDATE`, `RECRUITER`, `ADMIN` with strict authorization.
- **Problem bank** — coding, MCQ, and written problems with test cases, options, tags,
  difficulty, categories, and full-text search.
- **Assessments** — configurable duration, passing score, max attempts, shuffling,
  anti-cheating, and lifecycle `DRAFT → PUBLISHED → ACTIVE → CLOSED → ARCHIVED`.
- **Timed attempts** — the server is the source of truth for the timer; answers are frozen
  on submission or auto-submission at expiry.
- **Evaluation** — automatic MCQ scoring, manual written scoring by recruiters, and a
  sandboxed architecture for coding (the API server never executes candidate code).
- **Results & reports** — per-attempt results, candidate rankings, question performance,
  and company-level analytics (Redis cached).
- **Payments (SSLCommerz)** — recruiters purchase credit packages before publishing;
  verified and idempotent callbacks.
- **Anti-cheating** — proctoring events (tab switch, copy/paste, fullscreen exit, …).
- **Audit logs & soft delete** — every critical operation is recorded; entities use `deletedAt`.
- **Security** — Helmet, CORS, JWT access + refresh rotation, bcrypt, Zod validation,
  rate limiting, and per-resource ownership checks.

## 📁 Repository Structure

```
Developer Assessment/
├── server/                 # Express + TypeScript + Prisma (PostgreSQL) REST API
│   ├── src/                # App, config, middlewares, per-domain modules
│   ├── prisma/             # Migrations + seed script (demo data)
│   ├── docs/               # Swagger spec + Postman collection
│   ├── api.md              # Deep technical API reference
│   └── README.md           # Backend setup & documentation
└── README.md               # ← you are here
```

## 🚀 Quick Start

**Option A — Docker (PostgreSQL + Redis + API):**

```bash
cd server
cp .env.example .env        # set DATABASE_URL, JWT_*_SECRET, ...
docker compose up
```

**Option B — Local development:**

```bash
cd server
npm install
cp .env.example .env
npm run db:migrate          # apply Prisma migrations
npm run db:seed             # demo users, company, problems, assessment, payment package
npm run dev                 # → http://localhost:5000
```

### 🔑 Seed Credentials

| Role | Email | Password |
|---|---|---|
| Admin | `admin@devassess.local` | `Admin123!` |
| Recruiter | `recruiter@techcorp.dev` | `Recruit123!` |
| Candidate | `candidate@devassess.local` | `Candid8te!` |

## 🌐 API Overview

- **Base URL:** `http://localhost:5000` (configurable via `PORT`)
- **API prefix:** `/api/v1`
- **Auth header:** `Authorization: Bearer <accessToken>`
- **Response format (all endpoints):**

```json
{ "success": true, "message": "Operation successful", "data": {} }
{ "success": false, "message": "Something went wrong", "errors": [] }
```

Paginated endpoints also return `meta: { page, limit, total, totalPages }`. Rate limits
apply to login/register, password change, payments, submissions/answers, and invitations.

> 💡 Every route below lives under `http://localhost:5000/api/v1` unless stated otherwise.
> Replace `:id` / `:problemId` / etc. with the real UUIDs returned by create endpoints.

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

## 🧪 Sample JSON Payloads (Test Data)

Copy-paste these bodies to exercise the API. Replace `<uuid>` placeholders with real ids
returned by earlier create endpoints, and send the access token from login as
`Authorization: Bearer <accessToken>`. Passwords below match the seed credentials.

### 1. Register a recruiter

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

### 2. Register a candidate

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

### 3. Login (returns `accessToken` + `refreshToken`)

```http
POST /api/v1/auth/login
```

```json
{ "email": "recruiter@techcorp.dev", "password": "Recruit123!" }
```

### 4. Refresh & logout

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

### 5. Update own profile

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

### 6. Change password

```http
PATCH /api/v1/users/me/password
```

```json
{ "currentPassword": "Recruit123!", "newPassword": "Recruit12345!" }
```

### 7. Create a company

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

### 8. Create an MCQ problem

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

### 9. Create a CODING problem

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

### 10. Create a WRITTEN problem

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

### 11. Search problems

```http
GET /api/v1/problems/search?q=javascript
```

### 12. Create an assessment

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

<!-- NEXT -->