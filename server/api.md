# Developer Assessment & Coding Platform API

Complete REST API documentation for the Developer Assessment & Coding Platform.

## Table of Contents
- [Quick Start](#quick-start)
- [Authentication](#authentication)
- [Response Format](#response-format)
- [Rate Limiting](#rate-limiting)
- [Auth](#auth)
- [Users](#users)
- [Companies](#companies)
- [Problems](#problems)
- [Assessments](#assessments)
- [Assessment Problems](#assessment-problems)
- [Invitations](#invitations)
- [Attempts](#attempts)
- [Anti-Cheating](#anti-cheating)
- [Submissions](#submissions)
- [Evaluations](#evaluations)
- [Results](#results)
- [Reports & Analytics](#reports--analytics)
- [Payments](#payments)
- [Assessment Templates](#assessment-templates)
- [Notes](#notes)
- [Notifications](#notifications)
- [Dashboard](#dashboard)
- [Admin](#admin)
- [Health Check](#health-check)
- [Enums & Status Transitions](#enums--status-transitions)
- [Environment Variables](#environment-variables)
- [Postman Collection](#postman-collection)
- [Database Models](#database-models)


---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set environment variables (copy .env.example)
cp .env.example .env

# 3. Run migrations and seed
npx prisma migrate dev --name init
npm run db:seed

# 4. Start development server
npm run dev

# 5. Run tests
npm test
```

## Authentication

Most endpoints require a Bearer JWT access token:

```
Authorization: Bearer <accessToken>
```

### Token Lifecycle
1. `POST /api/v1/auth/register` — Register as CANDIDATE or RECRUITER
2. `POST /api/v1/auth/login` — Returns `accessToken` (15min) and `refreshToken` (7d)
3. `POST /api/v1/auth/refresh-token` — Uses refreshToken to get new accessToken (rotation: old refreshToken is revoked)
4. `POST /api/v1/auth/logout` — Revokes refresh token

### Password Requirements
- Minimum 8 characters, maximum 72 characters
- Must contain at least one letter and one number

---

## Response Format

All responses use a standardized format.

### Success
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {}
}
```

### Error
```json
{
  "success": false,
  "message": "Something went wrong",
  "errors": []
}
```

### Validation Error (422)
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    { "field": "email", "message": "Invalid email address" }
  ]
}
```

### Pagination Metadata
```json
{
  "success": true,
  "message": "Operation successful",
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

---

## Rate Limiting

Rate limiting is enforced on sensitive endpoints:
- Login & Registration: 5 requests per 15 minutes
- Password changes: 5 requests per 15 minutes
- Payment initiation: 10 requests per minute
- Submissions & answers: 60 requests per minute
- Invitations: 10 requests per hour

Returns `429 Too Many Requests` when exceeded.

---

## Auth

### POST `/api/v1/auth/register`
Register a new account. No authentication required.

**Permissions:** Public (CANDIDATE or RECRUITER)

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "Passw0rd123",
  "role": "CANDIDATE",
  "phone": "+1234567890",
  "companyId": "uuid-optional"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": { "id": "uuid", "name": "John Doe", "email": "john@example.com", "role": "CANDIDATE", "status": "ACTIVE", "companyId": null },
    "accessToken": "jwt-access-token",
    "refreshToken": "jwt-refresh-token"
  }
}
```

### POST `/api/v1/auth/login`
Authenticate and receive tokens.

**Body:** `{ "email": "john@example.com", "password": "Passw0rd123" }`

**Response (200):** Returns `user`, `accessToken`, and `refreshToken`.

### POST `/api/v1/auth/refresh-token`
Exchange refresh token for new access token (rotation: old token revoked).

**Body:** `{ "refreshToken": "{{refreshToken}}" }`

### POST `/api/v1/auth/logout`
Invalidate refresh token. Requires Bearer auth + refresh token in body.

### GET `/api/v1/auth/me`
Get current user profile. Requires Bearer auth.

---

## Users

All endpoints require `Authorization: Bearer {{accessToken}}`.

### GET `/api/v1/users/me`
Get your profile.

### PATCH `/api/v1/users/me`
Update profile (partial). Supported fields: `name`, `phone`, `bio`, `skills`, `experience`, `education`, `profileImageUrl`, `resumeUrl`, `jobTitle`.

### PATCH `/api/v1/users/me/password`
Change password. Requires `currentPassword` and `newPassword` (min 8 chars, 1 letter, 1 number).

### GET `/api/v1/users/me/activity`
Get recent audit log entries for the current user.

---

## Companies

### POST `/api/v1/companies`
Create a company. **Role:** RECRUITER or ADMIN.

**Body:** `{ "name": "TechCorp", "logo": "url", "description": "...", "website": "url", "industry": "...", "location": "...", "size": "..." }`

### GET `/api/v1/companies`
List companies with pagination, search, and filtering.

Query params: `page`, `limit`, `q`, `sortBy`, `sortOrder`

### GET `/api/v1/companies/:id`
Get a company by ID.

### PATCH `/api/v1/companies/:id`
Update company. **Role:** RECRUITER (owner/admin) or ADMIN.

### DELETE `/api/v1/companies/:id`
Soft-delete a company.

### GET `/api/v1/companies/:id/members`
List company members.

### GET `/api/v1/companies/:id/reports`
List company-level reports.

### GET `/api/v1/companies/:id/reports/summary`
Get company report summary (candidate count, average score, pass rate, etc.).

### GET `/api/v1/companies/:id/analytics`
Get company-level analytics. **Role:** RECRUITER (member of the company) or ADMIN.

**Response data:** `companyId`, `companyName`, `totalAssessments`, `totalInvitations`, `completedAssessments`, `passRate`, `averageScore`, `candidateCount`, `totalAttempts`, `creditsConsumed`, `creditsRemaining`, `paymentTotals`.

### GET `/api/v1/companies/:companyId/candidates`
List candidates invited to a company's assessments (paginated). **Role:** RECRUITER or ADMIN.

Query params: `page`, `limit`, `status` (recruitment status), `assessmentId`.

Each row: `invitationId`, `candidateId`, `candidate`, `email`, `assessment`, `recruitmentStatus`, `invitationStatus`, `invitedAt`, `result`.

### PATCH `/api/v1/companies/candidates/:id/status`
Update a candidate's recruitment status by invitation ID. **Role:** RECRUITER or ADMIN.

**Body:** `{ "recruitmentStatus": "SHORTLISTED" }`

**Recruitment statuses:** `INVITED` → `STARTED` → `COMPLETED` → `SHORTLISTED` → `INTERVIEW` → `HIRED`, or `REJECTED`.

---

## Problems

### POST `/api/v1/problems`
Create a problem. **Role:** RECRUITER or ADMIN.

**Problem types:** `CODING`, `MCQ`, `WRITTEN`

**MCQ Body:**
```json
{
  "title": "Question title",
  "description": "Detailed question description",
  "type": "MCQ",
  "difficulty": "EASY",
  "category": "Geography",
  "tags": ["tag1", "tag2"],
  "points": 5,
  "options": [
    { "text": "Option A", "isCorrect": false, "order": 0 },
    { "text": "Option B", "isCorrect": true, "order": 1 }
  ]
}
```

**Coding Body:**
```json
{
  "title": "Two Sum",
  "description": "Problem statement...",
  "type": "CODING",
  "difficulty": "MEDIUM",
  "category": "Algorithms",
  "tags": ["arrays"],
  "points": 15,
  "timeLimit": 2000,
  "memoryLimit": 256,
  "testCases": [
    { "input": "...", "expectedOutput": "...", "isHidden": false, "order": 0 },
    { "input": "...", "expectedOutput": "...", "isHidden": true, "order": 1 }
  ]
}
```

**Written Body:**
```json
{
  "title": "Explain OOP",
  "description": "Detailed prompt...",
  "type": "WRITTEN",
  "difficulty": "MEDIUM",
  "points": 20,
  "expectedAnswer": "Evaluation criteria..."
}
```

### GET `/api/v1/problems`
List problems with pagination, filtering, and sorting.

Query params: `page`, `limit`, `q`, `type`, `difficulty`, `category`, `status`, `tags`, `sortBy`, `sortOrder`

### GET `/api/v1/problems/search?q=javascript`
Search problems by keyword.

### GET `/api/v1/problems/:id`
Get a problem by ID. Hidden test cases are never exposed.

### PATCH `/api/v1/problems/:id`
Update a problem. **Role:** RECRUITER or ADMIN.

### DELETE `/api/v1/problems/:id`
Soft-delete a problem.

---

## Assessments

### POST `/api/v1/assessments`
Create an assessment. **Role:** RECRUITER or ADMIN. Recruiter must belong to a company with sufficient credits.

**Body:**
```json
{
  "title": "JavaScript Interview",
  "description": "Frontend developer assessment",
  "instructions": "Time limit: 60 minutes",
  "durationMinutes": 60,
  "passingScore": 50,
  "startDate": "2024-12-01T00:00:00.000Z",
  "endDate": "2024-12-31T23:59:59.000Z",
  "maxAttempts": 2,
  "shuffleProblems": true,
  "showResults": true,
  "antiCheatingEnabled": true
}
```

### GET `/api/v1/assessments`
List assessments with filtering.

Query: `page`, `limit`, `q`, `status`, `companyId`, `sortBy`, `sortOrder`

### GET `/api/v1/assessments/:id`
Get an assessment by ID.

### PATCH `/api/v1/assessments/:id`
Update an assessment (only in DRAFT or PUBLISHED status). **Role:** RECRUITER (owner/admin) or ADMIN.

### DELETE `/api/v1/assessments/:id`
Soft-delete an assessment.

### POST `/api/v1/assessments/:id/publish`
Transition to PUBLISHED status.

### POST `/api/v1/assessments/:id/close`
Transition to CLOSED status.

### POST `/api/v1/assessments/:id/duplicate`
Create a copy of an assessment (DRAFT status, includes problems, sections, and settings). **Role:** RECRUITER (owner/admin) or ADMIN.

Returns the duplicated assessment (201).

### POST `/api/v1/assessments/:id/archive`
Archive an assessment (DRAFT/PUBLISHED/CLOSED → ARCHIVED). **Role:** RECRUITER (owner/admin) or ADMIN.

### POST `/api/v1/assessments/:id/restore`
Restore an ARCHIVED assessment back to DRAFT. **Role:** RECRUITER (owner/admin) or ADMIN.

### POST `/api/v1/assessments/:id/recalculate-results`
Recompute all results for the assessment from saved attempt answers and evaluations. **Role:** RECRUITER (owner/admin) or ADMIN.

### GET `/api/v1/assessments/:id/candidates/compare`
Compare candidate performance for the assessment. **Role:** RECRUITER or ADMIN.

Query params: `candidateIds` — comma-separated list of candidate user IDs.

### GET `/api/v1/assessments/:id/history`
Get assessment status change history (audit log).

---

## Assessment Problems

### POST `/api/v1/assessments/:id/problems`
Add an existing problem to the assessment. **Role:** RECRUITER (owner/admin) or ADMIN.

**Body:**
```json
{
  "problemId": "uuid",
  "points": 15,
  "isRequired": true,
  "section": "Algorithms",
  "order": 1
}
```
All fields except `problemId` are optional. Returns the `AssessmentProblem` (201).

### GET `/api/v1/assessments/:id/problems`
List problems attached to the assessment (ordered by `order`/`section`).

Query params: `page`, `limit`, `section`, `isRequired`.

### PATCH `/api/v1/assessments/:id/problems/:problemId`
Update an assessment problem's configuration (`points`, `isRequired`, `section`, `order`). **Role:** RECRUITER (owner/admin) or ADMIN. Only allowed while the assessment has no active attempts.

### DELETE `/api/v1/assessments/:id/problems/:problemId`
Remove a problem from the assessment. **Role:** RECRUITER (owner/admin) or ADMIN.

---

## Invitations

### POST `/api/v1/assessments/:id/invitations`
Invite candidates to an assessment. **Role:** RECRUITER or ADMIN.

**Body:**
```json
{
  "candidates": [
    { "email": "candidate1@example.com", "expiresAt": "2024-12-31T23:59:59.000Z" },
    { "email": "candidate2@example.com" }
  ]
}
```

### GET `/api/v1/assessments/:id/invitations`
List invitations for an assessment. Query: `page`, `limit`, `status`.

### POST `/api/v1/invitations/:id/resend`
Resend an invitation email.

### POST `/api/v1/invitations/:id/accept`
Accept an invitation. **Role:** CANDIDATE.

### POST `/api/v1/invitations/:id/reject`
Reject an invitation. **Role:** CANDIDATE.

### GET `/api/v1/candidates/invitations`
List invitations for the current candidate.

**Invitation statuses:** PENDING → ACCEPTED → COMPLETED | PENDING → REJECTED | PENDING → EXPIRED

---

## Attempts

### POST `/api/v1/assessments/:id/attempts/start`
Start a new timed attempt. **Role:** CANDIDATE. Candidate must have an accepted invitation.

Returns attempt with `expiresAt` calculated server-side.

### GET `/api/v1/attempts/:id`
Get attempt details by ID. Ownership enforced.

**Response data:** `id`, `assessment`, `status`, `startedAt`, `expiresAt`, `submittedAt`, `answers` (your saved answers), `score`, `maxScore`.

### GET `/api/v1/attempts/:id/time`
Get the server-authoritative remaining time for an in-progress attempt. **Role:** CANDIDATE (owner), RECRUITER (company), or ADMIN.

**Response data:**
```json
{
  "attemptId": "uuid",
  "status": "IN_PROGRESS",
  "startedAt": "2026-09-01T09:00:00.000Z",
  "expiresAt": "2026-09-01T09:45:00.000Z",
  "submittedAt": null,
  "remainingTimeSeconds": 2700,
  "serverTime": "2026-09-01T09:00:00.000Z"
}
```

### GET `/api/v1/attempts/:id/anti-cheating-report`
Get the anti-cheating summary for an attempt (risk score + event timeline). Ownership enforced.

**Response data:** `attemptId`, `riskScore`, `riskLevel` (`LOW`/`MEDIUM`/`HIGH`), `totalEvents`, `eventCounts` (per type), `uniqueIpCount`, `uniqueDeviceCount`, `sessionCount`, `suspiciousSessions`, `timeline` (event list), and a `note`.

### GET `/api/v1/attempts/:id/questions`
Get all problems/questions for an in-progress attempt. Hidden test cases excluded.

### POST `/api/v1/attempts/:id/answers`
Save an answer (MCQ, written, or coding). **Role:** CANDIDATE.

**Body:**
```json
{
  "problemId": "uuid",
  "answer": { "selectedOptionId": "uuid" },
  "code": "function solution() { ... }",
  "programmingLanguage": "javascript"
}
```

### PATCH `/api/v1/attempts/:id/answers/:answerId`
Update a saved answer (before submission).

### POST `/api/v1/attempts/:id/submit`
Submit the attempt. Triggers automatic evaluation and result calculation.

**Attempt statuses:** NOT_STARTED → IN_PROGRESS → SUBMITTED → EVALUATING → COMPLETED

### GET `/api/v1/candidates/me/attempts`
List the current candidate's attempts. Query: `page`, `limit`, `status`.

---

## Anti-Cheating

### POST `/api/v1/attempts/:id/anti-cheating-events`
Report anti-cheating event. **Role:** CANDIDATE.

**Body:** `{ "eventType": "TAB_SWITCH", "metadata": { "tabUrl": "https://google.com" } }`

### GET `/api/v1/attempts/:id/anti-cheating-events`
List events for an attempt. Owned data stored: event type, timestamp, metadata, IP, user-agent.

**Event types:** TAB_SWITCH, WINDOW_BLUR, WINDOW_FOCUS, FULLSCREEN_EXIT, COPY, PASTE, MULTIPLE_SESSION, SUSPICIOUS_ACTIVITY

---

## Submissions

### POST `/api/v1/submissions`
Create a coding submission for formal evaluation. Rate-limited.

**Body:** `{ "attemptId": "uuid", "problemId": "uuid", "code": "function solution() { ... }", "programmingLanguage": "javascript" }`

### GET `/api/v1/submissions/:id`
Get a submission by ID. Ownership enforced.

### GET `/api/v1/attempts/:id/submissions`
List all submissions for an attempt.

### GET `/api/v1/assessments/:id/submissions`
List submissions for an assessment's attempts. Query: `page`, `limit`, `status`, `problemId`.

### POST `/api/v1/submissions/:id/evaluate`
Trigger evaluation of a submission. **Role:** RECRUITER or ADMIN.

**Statuses:** PENDING → RUNNING → PASSED | FAILED | PARTIAL | ERROR | MANUAL_REVIEW

---

## Evaluations

### GET `/api/v1/evaluations/pending`
List written evaluations that are still pending manual scoring. **Role:** RECRUITER or ADMIN.

Query: `page`, `limit`. Response is paginated and includes the attempt, candidate, problem, and saved written answer.

### POST `/api/v1/evaluations/written`
Manually evaluate a written answer. **Role:** RECRUITER or ADMIN.

**Body:** `{ "attemptId": "uuid", "problemId": "uuid", "score": 18, "feedback": "Good explanation." }`

### GET `/api/v1/attempts/:id/evaluations`
List evaluations for an attempt.

### GET `/api/v1/assessments/:id/evaluations`
List evaluations for an assessment's attempts. Query: `page`, `limit`, `status`.

---

## Results

### GET `/api/v1/results/:id`
Get a result by ID. Ownership enforced; results hidden until `showResults` policy permits.

### GET `/api/v1/candidates/me/results`
List the current candidate's results. Query: `page`, `limit`. Only released results are returned.

### GET `/api/v1/results/:id/skills`
Get a per-skill scoring breakdown for a result. Ownership enforced; respects the `showResults` / `releasedAt` policy for candidates.

**Response data:**
```json
{
  "resultId": "uuid",
  "overallPercentage": 72,
  "passed": true,
  "skills": [
    { "skill": "algorithms", "totalPoints": 30, "earnedPoints": 22, "questions": 3, "percentage": 73 },
    { "skill": "javascript", "totalPoints": 10, "earnedPoints": 10, "questions": 1, "percentage": 100 }
  ]
}
```

### GET `/api/v1/assessments/:id/results`
List results for an assessment (paginated, ordered by `earnedPoints` desc). **Role:** RECRUITER or ADMIN.

Query: `page`, `limit`. Each row includes `candidate` (`id`, `name`, `email`) and the linked `attempt`.

**Result fields:** totalPoints, earnedPoints, percentage, passed, timeTakenSeconds, correctAnswers, incorrectAnswers, items (question-level), evaluationFeedback.

---

## Reports & Analytics

### GET `/api/v1/assessments/:id/report`
Generate assessment report. **Role:** RECRUITER or ADMIN.

Includes: candidate count, completed count, average/highest/lowest score, pass rate, average completion time, question performance, candidate ranking.

### GET `/api/v1/assessments/:id/report/export.csv`
Generate the assessment report as a downloadable CSV file. **Role:** RECRUITER or ADMIN.

Returns `text/csv` with `Content-Disposition: attachment; filename="<assessment-title>.csv"` containing the candidate ranking and per-question scores.

### GET `/api/v1/companies/:id/reports`
List company-level reports.

### GET `/api/v1/companies/:id/reports/summary`
Company report summary.

### GET `/api/v1/assessments/:id/analytics`
Assessment analytics. **Role:** RECRUITER or ADMIN.

Includes: total invitations, started/completed attempts, completion rate, average/median score, pass rate, average time, question performance, most failed questions, performance distribution.

---

## Payments

Payment endpoints use SSLCommerz. Gateway callbacks are **public** (no auth header). In test/mock mode, use the mock gateway URL returned by `/initiate`.

### GET `/api/v1/payments/packages`
List available payment packages (public).

### POST `/api/v1/payments/initiate`
Initiate payment. Requires auth. Rate-limited.

**Body:** `{ "packageId": "uuid", "companyId": "uuid" }`

Returns `gatewayUrl` (or `mockUrl` in mock mode), `payment.id`, and `transactionId`.

### POST `/api/v1/payments/success`
SSLComlerz success callback (public). Verifies transaction with gateway before marking PAID.

### POST `/api/v1/payments/fail`
SSLComlerz failure callback (public).

### POST `/api/v1/payments/cancel`
SSLComlerz cancel callback (public).

### POST `/api/v1/payments/ipn`
SSLComlerz Instant Payment Notification webhook (public). **Idempotent** — safe to retry.

### GET `/api/v1/payments/:id`
Get payment by ID.

### GET `/api/v1/payments`
List payments. Query: `page`, `limit`, `status`.

**Payment statuses:** PENDING → PAID | FAILED | CANCELLED

---

## Admin

All admin endpoints require **ADMIN** role.

### GET `/api/v1/admin/users`
List all users. Query: `page`, `limit`, `q`, `role`, `status`, `sortBy`, `sortOrder`.

### GET `/api/v1/admin/users/:id`
Get user details by ID.

### PATCH `/api/v1/admin/users/:id/status`
Update user status: `ACTIVE`, `SUSPENDED`, or `DELETED`.

### PATCH `/api/v1/admin/users/:id/role`
Change user role: `CANDIDATE`, `RECRUITER`, or `ADMIN`.

### GET `/api/v1/admin/companies`
List all companies (including soft-deleted).

### GET `/api/v1/admin/assessments`
List all assessments across all companies.

### GET `/api/v1/admin/payments`
List all payments with filtering.

### GET `/api/v1/admin/problems`
List all problems.

### GET `/api/v1/admin/dashboard-stats`
Platform statistics: total users, candidates, recruiters, companies, assessments, completed attempts, payments, revenue, active users, suspended users.

### GET `/api/v1/admin/audit-logs`
Query audit logs. Query: `page`, `limit`, `action`, `entityType`, `actorId`.

---

## Assessment Templates

Reusable assessment configurations. All endpoints require auth; write operations require **RECRUITER** or **ADMIN**.

### POST `/api/v1/assessment-templates`
Create a reusable assessment template.

**Body:**
```json
{
  "title": "Junior Backend Baseline",
  "description": "Reusable screen for junior backend roles",
  "durationMinutes": 45,
  "passingScore": 60,
  "maxAttempts": 1,
  "shuffleProblems": true,
  "shuffleOptions": false,
  "showResults": true,
  "antiCheatingEnabled": true,
  "resultStrategy": "LATEST_SCORE",
  "accessLevel": "INVITATION_ONLY",
  "questionConfig": {},
  "skills": ["nodejs", "sql"],
  "difficultyDistribution": {},
  "antiCheatingSettings": {},
  "status": "DRAFT"
}
```

### GET `/api/v1/assessment-templates`
List templates (filtered by company for recruiters). Query: `page`, `limit`, `q`, `status`, `companyId`.

### GET `/api/v1/assessment-templates/:id`
Get a template by ID.

### PATCH `/api/v1/assessment-templates/:id`
Update any template field (partial). **Role:** RECRUITER (company) or ADMIN.

### DELETE `/api/v1/assessment-templates/:id`
Delete a template.

### POST `/api/v1/assessment-templates/:id/use`
Create a new assessment from the template (status `DRAFT`). **Role:** RECRUITER or ADMIN.

**Body (optional):** `{ "title": "My New Assessment", "companyId": "uuid" }`

---

## Notes

Recruiter/ADMIN comments attached to a candidate.

### POST `/api/v1/notes`
Create a note. **Role:** RECRUITER or ADMIN.

**Body:**
```json
{
  "candidateId": "uuid",
  "assessmentId": "uuid-optional",
  "companyId": "uuid-optional",
  "content": "Strong JS fundamentals, recommend for interview.",
  "isPrivate": true
}
```

### GET `/api/v1/notes/candidate/:candidateId`
List notes for a candidate. Query: `page`, `limit`, `assessmentId`.

Privacy: recruiters see public notes + their own private notes; candidates only see notes authored by themselves; admins see all.

### PATCH `/api/v1/notes/:noteId`
Update a note (`content`, `isPrivate`). Author or ADMIN only.

### DELETE `/api/v1/notes/:noteId`
Soft-delete a note. Author or ADMIN only.

---

## Notifications

Per-user in-app notifications. All endpoints are auth-protected and scoped to the current user.

### GET `/api/v1/notifications`
List my notifications. Query: `page`, `limit`, `status` (`UNREAD` | `READ`).

### GET `/api/v1/notifications/unread-count`
Get the unread count: `{ "unreadCount": 3 }`.

### PATCH `/api/v1/notifications/:id/read`
Mark a single notification as read. Owned by the current user.

### POST `/api/v1/notifications/read-all`
Mark all of my notifications as read. Returns `{ "updated": 5 }`.

**Notification types:** `ASSESSMENT_INVITATION`, `ASSESSMENT_COMPLETED`, `RESULT_AVAILABLE`, `PAYMENT_SUCCESS`, `PAYMENT_FAILED`, `ASSESSMENT_EXPIRING`.

---

## Dashboard

Aggregated summaries. Role-scoped.

### GET `/api/v1/dashboard/recruiter`
Recruiter (or ADMIN) dashboard.

**Response:** `summary` (`totalAssessments`, `activeAssessments`, `draftAssessments`, `closedAssessments`, `totalInvitations`, `pendingInvitations`, `acceptedInvitations`, `totalAttempts`, `completedAttempts`, `inProgressAttempts`, `totalResults`, `passedResults`, `passRate`, `completionRate`, `totalProblems`, `activeProblems`, `pendingEvaluations`), `recentAssessments`, `recentResults`.

### GET `/api/v1/dashboard/candidate`
Candidate dashboard.

**Response:** `summary` (`totalInvitations`, `pendingInvitations`, `acceptedInvitations`, `totalAttempts`, `completedAttempts`, `inProgressAttempts`, `totalResults`, `passedResults`, `passRate`), `upcomingAssessments`, `recentResults`.

---

## Health Check

### GET `/`
Service banner / smoke test. No authentication required. Returns a small JSON payload describing the API.

### GET `/health`
Health check endpoint (available when enabled in `app.ts`). No authentication required.

**Response (200):**
```json
{
  "success": true,
  "message": "API is healthy",
  "data": { "status": "ok" }
}
```

### GET `/api/docs`
Interactive Swagger/OpenAPI documentation.

---

## Enums & Lifecycle Transitions

### UserStatus
`ACTIVE` (default) | `SUSPENDED` | `DELETED`

Suspended users cannot access protected resources.

### AssessmentStatus
```
DRAFT → PUBLISHED → ACTIVE → CLOSED → ARCHIVED
```
Invalid transitions (e.g., ARCHIVED → ACTIVE) are rejected. Archived assessments can be restored to `DRAFT`.

### AttemptStatus
```
NOT_STARTED → IN_PROGRESS → SUBMITTED → EVALUATING → COMPLETED
```
Expiration: `IN_PROGRESS → AUTO_SUBMITTED → EVALUATING → COMPLETED`

The server is the source of truth for the timer — client-provided timers are never trusted.

### InvitationStatus
```
PENDING → ACCEPTED → COMPLETED
PENDING → REJECTED
PENDING → EXPIRED
```

### SubmissionStatus
`PENDING` → `RUNNING` → `PASSED` | `FAILED` | `PARTIAL` | `ERROR` | `MANUAL_REVIEW`

### PaymentStatus
```
PENDING → PAID | FAILED | CANCELLED | REFUNDED
```

### ProblemStatus
`DRAFT` (default) | `ACTIVE` | `ARCHIVED`

### ProblemType
`CODING` | `MCQ` | `WRITTEN`

### Difficulty
`EASY` | `MEDIUM` | `HARD`

### Anti-Cheating Event Types
`TAB_SWITCH` | `WINDOW_BLUR` | `WINDOW_FOCUS` | `FULLSCREEN_EXIT` | `COPY` | `PASTE` | `MULTIPLE_SESSION` | `SUSPICIOUS_ACTIVITY`

### CreditTransactionType
`CREDIT` | `DEBIT`

### RecruitmentStatus
`INVITED` → `STARTED` → `COMPLETED` → `SHORTLISTED` → `INTERVIEW` → `HIRED`, or `REJECTED`

### NotificationStatus
`UNREAD` | `READ`

### NotificationType
`ASSESSMENT_INVITATION` | `ASSESSMENT_COMPLETED` | `RESULT_AVAILABLE` | `PAYMENT_SUCCESS` | `PAYMENT_FAILED` | `ASSESSMENT_EXPIRING`

---

## Environment Variables

See `.env.example` for the full list:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_ACCESS_SECRET` | JWT access token secret |
| `JWT_REFRESH_SECRET` | JWT refresh token secret |
| `JWT_ACCESS_EXPIRES_IN` | Access token expiry (default: 15m) |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiry (default: 7d) |
| `BCRYPT_SALT_ROUNDS` | Password hashing salt rounds (default: 10) |
| `REDIS_URL` | Redis connection string (optional) |
| `REDIS_ENABLED` | Enable Redis caching/rate limiting (default: false) |
| `SSLCOMMERZ_STORE_ID` | SSLCommerz store ID |
| `SSLCOMMERZ_STORE_PASSWORD` | SSLCommerz store password |
| `SSLCOMMERZ_IS_LIVE` | Sandbox (`false`) or live (`true`) mode |
| `APP_URL` / `API_URL` | Application base URLs |
| `CORS_ORIGIN` | Comma-separated allowed CORS origins |
| `CODE_RUNNER_URL` | External isolated code-execution service URL (optional) |
| `ALLOW_LOCAL_SANDBOX` | Local vm sandbox for coding eval — **dev only** (default: false) |
| `SEED_*` | Seed credentials (never reuse in production) |

---

## Postman Collection

A complete Postman collection is available at **`docs/postman-collection.json`**.

**Import:** Postman → Import → File → select `docs/postman-collection.json`.

**Environment variables used by the collection** (auto-set by test scripts where noted):

| Variable | Purpose | Auto-set by |
|---|---|---|
| `baseUrl` | API base URL (`http://localhost:5000`) | — |
| `accessToken` | JWT access token | Login / Register |
| `refreshToken` | JWT refresh token | Login / Register |
| `userId` | Current user ID | Login |
| `companyId` | Company ID | Create Company |
| `problemId` | Problem ID | Create Problem |
| `mcqProblemId` | MCQ problem ID | Create MCQ Problem |
| `assessmentId` | Assessment ID | Create Assessment |
| `invitationId` | Invitation ID | Create Invitation |
| `attemptId` | Attempt ID | Start Attempt |
| `answerId` | Attempt answer ID | Save Answer |
| `submissionId` | Submission ID | Create Submission |
| `resultId` | Result ID | — |
| `paymentId` | Payment ID | Initiate Payment |
| `transactionId` | Payment transaction ID | Initiate Payment |

**Folders:** Authentication, Users, Companies, Problems, Assessments, Assessment Problems, Invitations, Attempts, Anti-Cheating, Submissions, Evaluations, Results, Reports & Analytics, Payments, Admin, Health.

**Recommended testing order:** Register/Login → Create Company → Create Problems → Create Assessment → Add Problems → Publish → Invite → (candidate) Accept → Start Attempt → Save Answers → Submit → Evaluate → Results → Report.

---

## Database Models

| Model | Description |
|---|---|
| `User` | User account (CANDIDATE / RECRUITER / ADMIN) with status & soft delete |
| `RefreshToken` | Hashed refresh tokens for rotation & revocation |
| `Company` | Company profile with credit balance |
| `CompanyMember` | Membership linking users to companies (OWNER/ADMIN/MEMBER) |
| `Problem` | Coding / MCQ / Written problem with difficulty, tags, status |
| `ProblemTag` | Tag join table for problems |
| `CodingTestCase` | Input/expected-output pairs (public & hidden) |
| `MCQOption` | Multiple-choice options with correct flag & order |
| `Assessment` | Assessment configuration, lifecycle status, timer, anti-cheat flags |
| `AssessmentProblem` | Assessment↔problem link with points, order, section, required flag |
| `AssessmentTemplate` | Reusable assessment configuration (config, skills, status, scoped to a company) |
| `Invitation` | Candidate invitation with status, expiry & recruitment pipeline status |
| `Attempt` | Timed candidate attempt (server-side `startedAt`/`expiresAt`) |
| `AttemptSession` | Active device/browser sessions per attempt (suspicious = multiple sessions) |
| `AttemptAnswer` | Saved MCQ/written/coding answers per problem |
| `CandidateNote` | Recruiter comment on a candidate (private flag, soft delete) |
| `Notification` | Per-user in-app notification (UNREAD/READ) |
| `Submission` | Coding submission with execution status & metrics |
| `Evaluation` | Per-problem evaluation (MCQ auto / written manual / coding sandbox) |
| `Result` | Final computed result (points, percentage, pass, time taken) |
| `ResultItem` | Per-problem score breakdown |
| `AntiCheatingEvent` | Tab-switch/blur/copy/etc. events with IP & user-agent |
| `Payment` | Payment record with gateway metadata (idempotent callbacks) |
| `PaymentPackage` | Purchasable credit packages |
| `CreditTransaction` | Credit balance changes (CREDIT/DEBIT) |
| `AuditLog` | Audit trail of all critical operations |




