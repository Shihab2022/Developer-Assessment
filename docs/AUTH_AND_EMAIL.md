# Authentication, Roles & Email Flows

This document explains how registration, login, email confirmation, company
management and the candidate **exam-invitation** flow work end to end — including
the emails that are sent and the endpoints behind each step.

> Related reading: [`README.md`](../README.md) (overview) ·
> [`server/README.md`](../server/README.md) (backend setup & env vars) ·
> [`server/api.md`](../server/api.md) (full API reference)

---

## 1. Roles

The platform has **four** roles:

| Role | Who | Can do |
|---|---|---|
| `CANDIDATE` | Anyone taking an assessment | Register, accept invitations, start/submit exams, view their own results |
| `RECRUITER` | A hiring member of a company | Everything a company member can do: create problems/assessments, invite candidates, review results |
| `COMPANY` | The **owner** of a company | Creates the company at signup, receives the friendly join code, and **controls/invites the other recruiters**. In the API it behaves exactly like a `RECRUITER` scoped to its own company |
| `ADMIN` | Platform administrator | Cross-company access, user/role management, audit logs |

### How `COMPANY` is implemented

`COMPANY` is a real value in the `UserRole` enum, so it is what the login and
`GET /auth/me` endpoints return to the UI (the frontend uses it to show the
extra company/team controls).

Internally, `server/src/middlewares/auth.ts` **normalizes `COMPANY` → `RECRUITER`**
when building `req.user`. That means every existing `auth("RECRUITER", "ADMIN")`
route guard and every company-scoped query automatically works for a company
owner — without duplicating role checks — while the real role is still reported
to the client.

Company-specific privileges (inviting/removing recruiters, changing team roles)
additionally check the caller's **`CompanyMember` role** (`OWNER` / `ADMIN`), so a
plain recruiter cannot manage the team.

---

## 2. Registration pages (separate per role)

Registration is split into dedicated, purpose-built screens:

| Route | Role | Key fields |
|---|---|---|
| `/register` | – | Role chooser (candidate / recruiter / company) |
| `/register/candidate` | `CANDIDATE` | Full name, email, password |
| `/register/recruiter` | `RECRUITER` | Full name, work email, **Company join code**, password |
| `/register/company` | `COMPANY` | Company name, your name, work email, password |

Every screen:

* has its own **icon** (GraduationCap / Briefcase / Building2) and a **brand
  image** (`BrandMark`, plus `/icon-512.png` on the login panel);
* uses a **shared `AuthShell`** whose logo (icon + product name) is a link that
  goes to the **home page**, or straight to the user's **dashboard** when a
  session already exists;
* includes the **password eye toggle** (see §3).

> The recruiter screen reads `?companyCode=` and `?email=` from the query string
> so an invitation email can pre-fill both fields. It also reads `?next=` so a
> candidate can be returned to the exact page (e.g. the exam) after signing in.

---

## 3. Password visibility (eye icon)

`frontend/src/components/ui/PasswordInput.tsx` is a reusable field that toggles
between `type="password"` and `type="text"` using an `Eye` / `EyeOff` button.

It is used on **login** and **all three registration screens**. The toggle is a
real `<button>` with `aria-label` + `aria-pressed`, and `tabIndex={-1}` so it
does not interrupt the tab order of the form.

---

## 4. Email confirmation on registration

**Requirement:** *after registering, a confirmation email is sent, and the user
can only log in once the address is confirmed.*

### What happens

```
POST /api/v1/auth/register
        │
        ├─ email already exists?            → 409 CONFLICT
        ├─ role = ADMIN?                    → 403 (admins can't self-register)
        ├─ role = COMPANY  → creates the company + join code + OWNER membership
        ├─ role = RECRUITER → resolves company by join code
        │
        ├─ writes the user  (emailVerified = false)
        ├─ creates a single-use hashed VerificationToken (EMAIL_VERIFICATION)
        └─ sends the confirmation email (nodemailer → Google SMTP)
                └─ response: { requiresVerification: true, user, companyCode }

GET  .../verify-email?token=...   (link in the email)
        └─ POST /api/v1/auth/verify-email  { token }
                └─ marks emailVerified = true, consumes the token

POST /api/v1/auth/login
        └─ email not confirmed → 403 "Please confirm your email address before
           signing in. Check your inbox for the confirmation link."
```

* The raw token is **never stored** — only its SHA-256 hash
  (`server/src/modules/auth/auth.service.ts`).
* Tokens expire after `EMAIL_VERIFICATION_EXPIRES_IN_HOURS` (default 24 h) and
  are single-use.
* `POST /api/v1/auth/resend-verification` invalidates outstanding tokens and
  sends a new link. It **never reveals whether the account exists** (it always
  answers the same way).

### Frontend

| Route | Purpose |
|---|---|
| `/verify-email?token=…` | Confirms automatically on load, then shows a success/failure state with a "Continue to sign in" button |
| Registration screens | After submit they switch to a **"Confirm your email"** screen (`CheckInbox`) with a *Resend confirmation email* button and a link to sign in |
| `/login` | If the API returns **403**, an amber panel appears: *"Email not confirmed yet"* + a one-click *Resend the confirmation email* |

### Graceful degradation (no SMTP configured)

If `SMTP_USERNAME`/`SMTP_PASSWORD` are missing **or** `MAIL_ENABLED=false`:

* `config.mail.enabled` is `false`;
* registration **auto-verifies** the address and returns a live session
  (`requiresVerification: false`, plus `accessToken`/`refreshToken`);
* login is not blocked.

This keeps local development working offline while the production behaviour
stays exactly as described above.

---

## 5. Configuring Google SMTP (nodemailer)

The backend ships `nodemailer` (`server/src/lib/mailer.ts`). Add these to
`server/.env` (see `server/.env.example`):

```bash
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=465            # 465 = implicit TLS; use 587 + SMTP_SECURE=false for STARTTLS
SMTP_SECURE="true"
SMTP_USERNAME="you@gmail.com"
SMTP_PASSWORD="xxxx xxxx xxxx xxxx"   # 16-character Gmail App Password
MAIL_FROM="SkillGauge <you@gmail.com>" # optional; defaults to SkillGauge <SMTP_USERNAME>
MAIL_ENABLED="true"
EMAIL_VERIFICATION_EXPIRES_IN_HOURS=24
```

**Getting a Gmail App Password (free):**

1. Turn on 2-Step Verification for the Google Account.
2. Google Account → **Security** → **App passwords**.
3. Create one named e.g. "SkillGauge SMTP" → Google returns a 16-character
   password. Paste it into `SMTP_PASSWORD`.

> Your normal Google password will **not** work when 2-Step Verification is on.

Sending **never throws** into the request path: `sendMail()` logs
`mail.send_failed` and returns `false`, so registration/invitation/submission
still succeed even if Gmail is unreachable.

---

## 6. Company join code (replaces the raw company UUID)

A recruiter joining a company no longer types a UUID. Every company now has a
short, human-friendly **`code`** (e.g. `ACMERO-F65C0A`) generated on creation:

* `Company.code` — unique, nullable column (`server/prisma/schema.prisma`).
* `POST /auth/register` accepts **`companyCode`** (friendly) and still accepts the
  legacy `companyId` for backwards compatibility.
* Recruiters paste the code on `/register/recruiter`; the API resolves it to the
  company, attaches `companyId`, and creates a `CompanyMember` row.
* The owner can copy the code from **Recruiter → Company → Team & recruiters**.

---

## 7. The company owner: invite & control recruiters

`COMPANY` owners (and anyone with the `OWNER`/`ADMIN` company-member role) manage
their recruiters from **Recruiter → Company → Team & recruiters**:

| Action | Endpoint | Notes |
|---|---|---|
| List members | `GET /api/v1/companies/:id/members` | Any company member |
| Invite a recruiter | `POST /api/v1/companies/:id/members` | `{ email, name?, role? }` — emails them the join code. If the email already has an account it is promoted to `RECRUITER` and added directly |
| Change a member's role | `PATCH /api/v1/companies/:id/members/:userId` | `{ role: "OWNER"｜"ADMIN"｜"MEMBER" }` — the owner cannot be demoted |
| Remove a member | `DELETE /api/v1/companies/:id/members/:userId` | The owner cannot be removed |

Inviting an **existing account** adds the membership immediately; inviting a
**new email** sends an email containing the company join code and a link to
`/register/recruiter?companyCode=…&email=…` with the form pre-filled.

---

## 8. Recruiter invites a candidate → email with the exam link

```
POST /api/v1/assessments/:id/invitations        (RECRUITER / COMPANY / ADMIN)
   { "candidates": [ { "email": "candidate@example.com" }, … ] }
        │
        ├─ one Invitation row per email  (unique per assessment + email)
        ├─ generates a per-candidate token
        └─ emails the candidate:
              subject: "<Company> invited you to an assessment"
              link:    <FRONTEND_URL>/invitations/join?token=<token>

POST /api/v1/invitations/:id/resend   → re-sends the same link
```

The email is rendered by `buildInvitationEmail()` in
`server/src/lib/mailer.ts` and includes the assessment title, company, duration
and (optionally) an expiry date.

---

## 9. Candidate clicks the link → login/register → start the exam

The email link opens **`/invitations/join?token=…`** (frontend page
`frontend/src/app/invitations/join/page.tsx`):

```
/invitations/join?token=…
        │
        ├─ GET /api/v1/invitations/token/:token      (public, no auth)
        │      → assessment summary + invited email + usable flag
        │
        ├─ not signed in?
        │      → "Sign in"  ( /login?next=/invitations/join?token=… )
        │      → "Register as a candidate" ( /register/candidate?next=… )
        │        (if email confirmation is on, the user confirms, signs in,
        │         and is returned to this same page via `next`)
        │
        ├─ signed in with the WRONG email?
        │      → prompt to switch account
        │
        └─ signed in with the invited email?
               → POST /api/v1/invitations/token/:token/accept   (CANDIDATE)
               → POST /api/v1/assessments/:id/attempts/start    (CANDIDATE)
               → redirect to /candidate/attempts/<attemptId>
```

**The invitation is bound to the email address** — `accept` rejects a signed-in
user whose email differs from the invited address (this is the "make sure the
email is in that company's candidate email list" guarantee).

### One attempt per email — permanently

`alreadyAttempted` is computed by counting attempts whose **candidate email**
matches the invited email:

```ts
prisma.attempt.count({
  where: { assessmentId, candidate: { email: { equals: invitedEmail, mode: "insensitive" } } },
});
```

Because the count is by email (not by account), a student who has started the
exam **cannot take it again with that Gmail address**, even from a second
account. The same check runs again inside `POST /assessments/:id/attempts/start`,
which also enforces `assessment.maxAttempts` (default 1) — a second start
returns **409 `Maximum attempts (1) reached for this assessment`**.

---

## 10. Finishing the exam → result stored + result email

```
POST /api/v1/attempts/:id/submit        (CANDIDATE)
        │
        ├─ freezes the answers, auto-scores MCQ
        ├─ recalculateResult() → Result row  (points, %, passed, releasedAt)
        ├─ deliverResult():
        │     ├─ Invitation.status = COMPLETED  (completedAt)
        │     ├─ creates a RESULT_AVAILABLE Notification
        │     └─ if showResults → buildResultEmail() → nodemailer
        └─ response: { attempt, result }
```

`deliverResult()` lives in `server/src/modules/attempts/attempts.service.ts`.
The result email shows the percentage, points and PASS/FAIL badge and links to
`/candidate/results`. Like all other sends it is wrapped so a mail failure can
never break the submission.

**Emails sent by the platform** (`server/src/lib/mailer.ts`):

| Template | Trigger |
|---|---|
| `buildVerificationEmail` | Registration / resend-verification |
| `buildRecruiterInviteEmail` | Owner invites a recruiter (contains the join code) |
| `buildInvitationEmail` | Recruiter invites a candidate (contains the exam link) |
| `buildResultEmail` | Candidate submits an assessment |

---

## 11. Endpoint reference (new / changed)

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `POST` | `/auth/register` | public | Register `CANDIDATE` / `RECRUITER` / `COMPANY` (+ `companyName`, `companyCode`) |
| `POST` | `/auth/login` | public | Blocked with **403** until the email is confirmed |
| `POST` | `/auth/verify-email` | public | Consume the confirmation token |
| `POST` | `/auth/resend-verification` | public | Send a fresh confirmation link |
| `POST` | `/companies` | `RECRUITER`/`COMPANY`/`ADMIN` | Create a company (auto-generates `code`) |
| `GET` | `/companies/:id/members` | any member | List team |
| `POST` | `/companies/:id/members` | owner/admin | Invite a recruiter by email |
| `PATCH` | `/companies/:id/members/:userId` | owner/admin | Change a member role |
| `DELETE` | `/companies/:id/members/:userId` | owner/admin | Remove a member |
| `GET` | `/invitations/token/:token` | public | Resolve an exam link |
| `POST` | `/invitations/token/:token/accept` | `CANDIDATE` | Accept the exam link |
| `POST` | `/assessments/:id/invitations` | `RECRUITER`/`COMPANY`/`ADMIN` | Invite candidates (emails the link) |

---

## 12. Database changes

Migration: `server/prisma/migrations/20261001120000_company_role_email_verification/`

| Change | Detail |
|---|---|
| `UserRole` enum | added `COMPANY` |
| `User` | `emailVerified BOOLEAN DEFAULT false`, `emailVerifiedAt TIMESTAMP` |
| `Company` | `code TEXT UNIQUE` (nullable) |
| `VerificationToken` | new model (`userId`, `tokenHash`, `type`, `expiresAt`, `usedAt`) |
| `VerificationTokenType` | new enum (`EMAIL_VERIFICATION`, `PASSWORD_RESET`) |

Apply it with:

```bash
cd server
npx prisma migrate deploy      # or: npm run db:migrate
npx prisma generate
```

---

## 13. Try it locally (2 minutes)

```bash
# 1. backend
cd server && npm install && npm run db:seed && npm run dev      # :5000

# 2. frontend
cd ../frontend && npm install && npm run dev                    # :3000
```

1. Open <http://localhost:3000/register/company>, register a company and copy the
   **join code** shown on the confirmation screen.
2. Confirm the email (or, with no SMTP configured, you are signed in directly).
3. Register a recruiter at `/register/recruiter` with that code.
4. As the recruiter, invite a candidate → the candidate receives the exam link.
5. Open `/invitations/join?token=…` (the seeded demo link is
   `/invitations/join?token=demo-candidate-token-0001`), sign in as the invited
   candidate and start the exam.
6. Submit → the result is stored, the candidate gets a result email, and starting
   the same exam again is refused.

### Seeded demo data

| Role | Email | Password |
|---|---|---|
| Recruiter | `recruiter@techcorp.dev` | `Recruit123!` |
| Candidate | `candidate@skillgauge.local` | `Candid8te!` |
| Admin | `admin@skillgauge.local` | `Admin123!` |

* Seed company join code: **`TECHCOR-0001`**
* Seed exam link: `/invitations/join?token=demo-candidate-token-0001`

> Create a **company owner** yourself at `/register/company` — the owner is the
> account that receives the join code and manages the recruiters.




