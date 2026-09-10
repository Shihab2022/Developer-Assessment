export const swaggerDocument = {
  openapi: "3.0.3",
  info: {
    title: "Developer Assessment & Coding Platform API",
    description:
      "Backend REST API for a multi-role developer assessment platform.\n\n## Authentication\nUse `POST /api/v1/auth/login` to obtain an access token, then send it as:\n\n`Authorization: Bearer <accessToken>`\n\n## Roles\n- **CANDIDATE** - register, take assessments, submit answers, view own results.\n- **RECRUITER** - manage company, problems, assessments, invitations, evaluations, reports, payments.\n- **ADMIN** - manage users, companies, platform statistics, audit logs.",
    version: "1.0.0",
  },
  servers: [{ url: "http://localhost:5000/api/v1", description: "Local development" }],
  tags: [
    { name: "Auth" },
    { name: "Users" },
    { name: "Companies" },
    { name: "Problems" },
    { name: "Assessments" },
    { name: "Invitations" },
    { name: "Attempts" },
    { name: "Submissions" },
    { name: "Evaluations" },
    { name: "Results" },
    { name: "Reports" },
    { name: "Analytics" },
    { name: "Anti-Cheating" },
    { name: "Payments" },
    { name: "AssessmentTemplates" },
    { name: "Notes" },
    { name: "Notifications" },
    { name: "Dashboard" },
    { name: "Admin" },
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
    schemas: {
      Success: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          message: { type: "string" },
          data: {},
        },
      },
      Error: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          message: { type: "string" },
          errors: {
            type: "array",
            items: {
              type: "object",
              properties: {
                field: { type: "string" },
                message: { type: "string" },
              },
            },
          },
        },
      },
      Meta: {
        type: "object",
        properties: {
          page: { type: "integer", example: 1 },
          limit: { type: "integer", example: 10 },
          total: { type: "integer", example: 100 },
          totalPages: { type: "integer", example: 10 },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {},
};
Object.assign(swaggerDocument.paths, {
  "/auth/register": {
    post: {
      tags: ["Auth"],
      summary: "Register a new account (CANDIDATE or RECRUITER)",
      security: [],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["name", "email", "password"],
              properties: {
                name: { type: "string", example: "John Doe" },
                email: { type: "string", format: "email" },
                password: {
                  type: "string",
                  description: "Min 8 chars, 1 letter, 1 number",
                  example: "Passw0rd123",
                },
                role: {
                  type: "string",
                  enum: ["CANDIDATE", "RECRUITER"],
                  default: "CANDIDATE",
                },
                phone: { type: "string" },
                companyId: {
                  type: "string",
                  format: "uuid",
                  description: "Required when role=RECRUITER",
                },
              },
            },
          },
        },
      },
      responses: {
        "201": {
          description: "Registered",
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/Success" } },
          },
        },
        "409": { description: "Email already registered" },
        "422": { description: "Validation failed" },
      },
    },
  },
  "/auth/login": {
    post: {
      tags: ["Auth"],
      summary: "Login with email and password",
      security: [],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["email", "password"],
              properties: {
                email: { type: "string", format: "email" },
                password: { type: "string" },
              },
            },
          },
        },
      },
      responses: {
        "200": { description: "Logged in. Returns accessToken + refreshToken." },
        "401": { description: "Invalid credentials" },
        "403": { description: "Account suspended" },
        "429": { description: "Too many attempts" },
      },
    },
  },
  "/auth/refresh-token": {
    post: {
      tags: ["Auth"],
      summary: "Rotate refresh token and obtain a new access token",
      security: [],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["refreshToken"],
              properties: { refreshToken: { type: "string" } },
            },
          },
        },
      },
      responses: {
        "200": { description: "New tokens issued" },
        "401": { description: "Invalid/revoked/expired refresh token" },
      },
    },
  },
  "/auth/logout": {
    post: {
      tags: ["Auth"],
      summary: "Revoke the provided refresh token",
      security: [],
      requestBody: {
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: { refreshToken: { type: "string" } },
            },
          },
        },
      },
      responses: { "200": { description: "Logged out" } },
    },
  },
  "/auth/me": {
    get: {
      tags: ["Auth"],
      summary: "Get the authenticated user's profile",
      responses: {
        "200": { description: "Current user" },
        "401": { description: "Unauthorized" },
      },
    },
  },
});
Object.assign(swaggerDocument.paths, {
  "/users/me": {
    get: {
      tags: ["Users"],
      summary: "Get my profile",
      responses: { "200": { description: "Profile" } },
    },
    patch: {
      tags: ["Users"],
      summary: "Update my profile",
      requestBody: {
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                name: { type: "string" },
                phone: { type: "string" },
                bio: { type: "string" },
                skills: { type: "array", items: { type: "string" } },
                experience: { type: "integer" },
                education: {},
                profileImageUrl: { type: "string", format: "uri" },
                resumeUrl: { type: "string", format: "uri" },
                jobTitle: { type: "string" },
              },
            },
          },
        },
      },
      responses: { "200": { description: "Updated profile" } },
    },
  },
  "/users/me/password": {
    patch: {
      tags: ["Users"],
      summary: "Change my password",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["currentPassword", "newPassword"],
              properties: {
                currentPassword: { type: "string" },
                newPassword: { type: "string" },
              },
            },
          },
        },
      },
      responses: {
        "200": { description: "Password changed" },
        "400": { description: "Wrong current password" },
      },
    },
  },
  "/users/me/activity": {
    get: {
      tags: ["Users"],
      summary: "My recent activity (audit trail)",
      responses: { "200": { description: "Activity list" } },
    },
  },
  "/companies": {
    post: {
      tags: ["Companies"],
      summary: "Create a company (RECRUITER)",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["name"],
              properties: {
                name: { type: "string" },
                logo: { type: "string", format: "uri" },
                description: { type: "string" },
                website: { type: "string", format: "uri" },
                industry: { type: "string" },
                location: { type: "string" },
                size: { type: "string" },
              },
            },
          },
        },
      },
      responses: { "201": { description: "Company created" } },
    },
    get: {
      tags: ["Companies"],
      summary: "List/search companies",
      parameters: [
        { name: "q", in: "query", schema: { type: "string" } },
        { name: "page", in: "query", schema: { type: "integer", default: 1 } },
        { name: "limit", in: "query", schema: { type: "integer", default: 10 } },
      ],
      responses: { "200": { description: "Paginated companies" } },
    },
  },
  "/companies/{id}": {
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        schema: { type: "string", format: "uuid" },
      },
    ],
    get: {
      tags: ["Companies"],
      summary: "Get company by id (members only)",
      responses: {
        "200": { description: "Company" },
        "403": { description: "No access" },
      },
    },
    patch: {
      tags: ["Companies"],
      summary: "Update company (OWNER/ADMIN)",
      responses: { "200": { description: "Updated" } },
    },
    delete: {
      tags: ["Companies"],
      summary: "Soft-delete company (OWNER)",
      responses: { "200": { description: "Deleted" } },
    },
  },
  "/companies/{id}/members": {
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        schema: { type: "string", format: "uuid" },
      },
    ],
    get: {
      tags: ["Companies"],
      summary: "List company members",
      responses: { "200": { description: "Members" } },
    },
  },
  "/companies/{id}/reports": {
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        schema: { type: "string", format: "uuid" },
      },
    ],
    get: {
      tags: ["Reports"],
      summary: "List assessment reports for a company",
      responses: { "200": { description: "Paginated assessment summaries" } },
    },
  },
  "/companies/{id}/reports/summary": {
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        schema: { type: "string", format: "uuid" },
      },
    ],
    get: {
      tags: ["Reports"],
      summary: "Company report summary (candidate count, average score, pass rate)",
    },
  },
});
Object.assign(swaggerDocument.paths, {
  "/companies/{id}/analytics": {
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        schema: { type: "string", format: "uuid" },
      },
    ],
    get: {
      tags: ["Companies"],
      summary:
        "Company analytics: assessments, invitations, pass rate, average score, credits",
    },
  },
  "/companies/{companyId}/candidates": {
    parameters: [
      {
        name: "companyId",
        in: "path",
        required: true,
        schema: { type: "string", format: "uuid" },
      },
    ],
    get: {
      tags: ["Companies"],
      summary:
        "List a company's invited candidates (with recruitment status and result)",
      parameters: [
        { name: "page", in: "query", schema: { type: "integer" } },
        { name: "limit", in: "query", schema: { type: "integer" } },
        { name: "status", in: "query", schema: { type: "string" } },
        {
          name: "assessmentId",
          in: "query",
          schema: { type: "string", format: "uuid" },
        },
      ],
    },
  },
  "/companies/candidates/{id}/status": {
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        schema: { type: "string", format: "uuid" },
        description: "Invitation ID",
      },
    ],
    patch: {
      tags: ["Companies"],
      summary: "Update a candidate's recruitment status (RECRUITER/ADMIN)",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["recruitmentStatus"],
              properties: {
                recruitmentStatus: {
                  type: "string",
                  enum: [
                    "INVITED",
                    "STARTED",
                    "COMPLETED",
                    "SHORTLISTED",
                    "INTERVIEW",
                    "HIRED",
                    "REJECTED",
                  ],
                },
              },
            },
          },
        },
      },
    },
  },
});
Object.assign(swaggerDocument.paths, {
  "/problems": {
    post: {
      tags: ["Problems"],
      summary: "Create a problem (CODING | MCQ | WRITTEN)",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["title", "description", "type"],
              properties: {
                title: { type: "string" },
                description: { type: "string" },
                type: { type: "string", enum: ["CODING", "MCQ", "WRITTEN"] },
                difficulty: { type: "string", enum: ["EASY", "MEDIUM", "HARD"] },
                category: { type: "string" },
                points: { type: "integer", default: 10 },
                tags: { type: "array", items: { type: "string" } },
                status: { type: "string", enum: ["DRAFT", "ACTIVE", "ARCHIVED"] },
                expectedAnswer: { description: "Required for WRITTEN" },
                testCases: {
                  type: "array",
                  description:
                    "Required for CODING. Hidden cases are never exposed to candidates.",
                  items: {
                    type: "object",
                    properties: {
                      input: { type: "string" },
                      expectedOutput: { type: "string" },
                      isHidden: { type: "boolean" },
                      order: { type: "integer" },
                    },
                  },
                },
                options: {
                  type: "array",
                  description: "Required for MCQ. Exactly one isCorrect=true.",
                  items: {
                    type: "object",
                    properties: {
                      text: { type: "string" },
                      isCorrect: { type: "boolean" },
                      order: { type: "integer" },
                    },
                  },
                },
              },
            },
          },
        },
      },
      responses: {
        "201": { description: "Problem created" },
        "422": { description: "Validation failed" },
      },
    },
    get: {
      tags: ["Problems"],
      summary: "List problems with filters, sorting and pagination",
      parameters: [
        { name: "page", in: "query", schema: { type: "integer" } },
        { name: "limit", in: "query", schema: { type: "integer" } },
        {
          name: "type",
          in: "query",
          schema: { type: "string", enum: ["CODING", "MCQ", "WRITTEN"] },
        },
        {
          name: "difficulty",
          in: "query",
          schema: { type: "string", enum: ["EASY", "MEDIUM", "HARD"] },
        },
        { name: "category", in: "query", schema: { type: "string" } },
        { name: "status", in: "query", schema: { type: "string" } },
        {
          name: "tags",
          in: "query",
          schema: { type: "string" },
          description: "Comma separated",
        },
        { name: "q", in: "query", schema: { type: "string" } },
        { name: "sortBy", in: "query", schema: { type: "string" } },
        {
          name: "sortOrder",
          in: "query",
          schema: { type: "string", enum: ["asc", "desc"] },
        },
      ],
      responses: { "200": { description: "Paginated problems" } },
    },
  },
  "/problems/search": {
    get: {
      tags: ["Problems"],
      summary: "Search across title/description/category/tags",
      parameters: [
        { name: "q", in: "query", required: true, schema: { type: "string" } },
        { name: "page", in: "query", schema: { type: "integer" } },
        { name: "limit", in: "query", schema: { type: "integer" } },
      ],
      responses: { "200": { description: "Search results" } },
    },
  },
  "/problems/{id}": {
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        schema: { type: "string", format: "uuid" },
      },
    ],
    get: {
      tags: ["Problems"],
      summary:
        "Get a problem. Candidates receive a sanitized view (no hidden test cases, no correct options).",
      responses: {
        "200": { description: "Problem" },
        "404": { description: "Not found" },
      },
    },
    patch: { tags: ["Problems"], summary: "Update a problem" },
    delete: { tags: ["Problems"], summary: "Soft-delete a problem" },
  },
});
Object.assign(swaggerDocument.paths, {
  "/assessments": {
    post: {
      tags: ["Assessments"],
      summary: "Create an assessment",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["title", "durationMinutes"],
              properties: {
                title: { type: "string" },
                description: { type: "string" },
                instructions: { type: "string" },
                durationMinutes: { type: "integer", minimum: 5, maximum: 1440 },
                passingScore: { type: "integer", default: 0 },
                startDate: { type: "string", format: "date-time", nullable: true },
                endDate: { type: "string", format: "date-time", nullable: true },
                maxAttempts: { type: "integer", default: 1 },
                shuffleProblems: { type: "boolean", default: false },
                showResults: { type: "boolean", default: true },
                antiCheatingEnabled: { type: "boolean", default: true },
              },
            },
          },
        },
      },
      responses: { "201": { description: "Assessment created" } },
    },
    get: {
      tags: ["Assessments"],
      summary:
        "List assessments (recruiter sees own company; candidates see published/active)",
      parameters: [
        { name: "page", in: "query", schema: { type: "integer" } },
        { name: "limit", in: "query", schema: { type: "integer" } },
        { name: "status", in: "query", schema: { type: "string" } },
        { name: "q", in: "query", schema: { type: "string" } },
        { name: "sortBy", in: "query", schema: { type: "string" } },
        {
          name: "sortOrder",
          in: "query",
          schema: { type: "string", enum: ["asc", "desc"] },
        },
      ],
      responses: { "200": { description: "Paginated assessments" } },
    },
  },
  "/assessments/{id}": {
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        schema: { type: "string", format: "uuid" },
      },
    ],
    get: { tags: ["Assessments"], summary: "Get assessment details" },
    patch: {
      tags: ["Assessments"],
      summary: "Update assessment (restricted once attempts exist)",
    },
    delete: { tags: ["Assessments"], summary: "Soft-delete assessment" },
  },
  "/assessments/{id}/publish": {
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        schema: { type: "string", format: "uuid" },
      },
    ],
    post: {
      tags: ["Assessments"],
      summary: "Publish assessment (consumes 1 company credit)",
      responses: {
        "200": { description: "Published" },
        "402": { description: "Insufficient credits" },
        "409": { description: "Invalid status transition" },
      },
    },
  },
  "/assessments/{id}/close": {
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        schema: { type: "string", format: "uuid" },
      },
    ],
    post: { tags: ["Assessments"], summary: "Close assessment" },
  },
  "/assessments/{id}/history": {
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        schema: { type: "string", format: "uuid" },
      },
    ],
    get: { tags: ["Assessments"], summary: "Attempt history for the assessment" },
  },
  "/assessments/{id}/problems": {
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        schema: { type: "string", format: "uuid" },
      },
    ],
    post: {
      tags: ["Assessments"],
      summary: "Add a problem to the assessment",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["problemId"],
              properties: {
                problemId: { type: "string", format: "uuid" },
                points: { type: "integer" },
                isRequired: { type: "boolean" },
                section: { type: "string" },
                order: { type: "integer" },
              },
            },
          },
        },
      },
      responses: {
        "201": { description: "Problem added" },
        "409": { description: "Duplicate or attempts active" },
      },
    },
    get: { tags: ["Assessments"], summary: "List assessment problems (ordered)" },
  },
  "/assessments/{id}/problems/{problemId}": {
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        schema: { type: "string", format: "uuid" },
      },
      {
        name: "problemId",
        in: "path",
        required: true,
        schema: { type: "string", format: "uuid" },
      },
    ],
    patch: {
      tags: ["Assessments"],
      summary: "Update order/points/section of a problem",
    },
    delete: { tags: ["Assessments"], summary: "Remove problem from assessment" },
  },
});
Object.assign(swaggerDocument.paths, {
  "/assessments/{id}/duplicate": {
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        schema: { type: "string", format: "uuid" },
      },
    ],
    post: {
      tags: ["Assessments"],
      summary: "Duplicate an assessment (DRAFT copy with problems, sections, settings)",
    },
  },
  "/assessments/{id}/archive": {
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        schema: { type: "string", format: "uuid" },
      },
    ],
    post: { tags: ["Assessments"], summary: "Archive an assessment (→ ARCHIVED)" },
  },
  "/assessments/{id}/restore": {
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        schema: { type: "string", format: "uuid" },
      },
    ],
    post: {
      tags: ["Assessments"],
      summary: "Restore an archived assessment (→ DRAFT)",
    },
  },
  "/assessments/{id}/recalculate-results": {
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        schema: { type: "string", format: "uuid" },
      },
    ],
    post: {
      tags: ["Assessments"],
      summary: "Recompute all results for the assessment (RECRUITER/ADMIN)",
    },
  },
  "/assessments/{id}/candidates/compare": {
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        schema: { type: "string", format: "uuid" },
      },
      {
        name: "candidateIds",
        in: "query",
        required: true,
        schema: { type: "string" },
        description: "Comma-separated candidate user IDs",
      },
    ],
    get: {
      tags: ["Assessments"],
      summary: "Compare candidate performance side-by-side (RECRUITER/ADMIN)",
    },
  },
});
Object.assign(swaggerDocument.paths, {
  "/assessments/{id}/invitations": {
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        schema: { type: "string", format: "uuid" },
      },
    ],
    post: {
      tags: ["Invitations"],
      summary: "Invite candidates (prevents duplicates)",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["candidates"],
              properties: {
                candidates: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      email: { type: "string", format: "email" },
                      expiresAt: { type: "string", format: "date-time" },
                    },
                  },
                },
              },
            },
          },
        },
      },
      responses: {
        "201": { description: "Invitations created" },
        "409": { description: "Duplicate invitation" },
      },
    },
    get: {
      tags: ["Invitations"],
      summary: "List invitations for the assessment",
      parameters: [
        { name: "page", in: "query", schema: { type: "integer" } },
        { name: "limit", in: "query", schema: { type: "integer" } },
        { name: "status", in: "query", schema: { type: "string" } },
      ],
      responses: { "200": { description: "Paginated invitations" } },
    },
  },
  "/invitations/{id}/resend": {
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        schema: { type: "string", format: "uuid" },
      },
    ],
    post: { tags: ["Invitations"], summary: "Resend/regenerate an invitation" },
  },
  "/invitations/{id}/accept": {
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        schema: { type: "string", format: "uuid" },
      },
    ],
    post: { tags: ["Invitations"], summary: "Candidate accepts an invitation" },
  },
  "/invitations/{id}/reject": {
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        schema: { type: "string", format: "uuid" },
      },
    ],
    post: { tags: ["Invitations"], summary: "Candidate rejects an invitation" },
  },
  "/candidates/invitations": {
    get: {
      tags: ["Invitations"],
      summary: "List my invitations (CANDIDATE)",
      parameters: [
        { name: "page", in: "query", schema: { type: "integer" } },
        { name: "limit", in: "query", schema: { type: "integer" } },
        { name: "status", in: "query", schema: { type: "string" } },
      ],
      responses: { "200": { description: "Paginated invitations" } },
    },
  },
  "/assessments/{id}/attempts/start": {
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        schema: { type: "string", format: "uuid" },
      },
    ],
    post: {
      tags: ["Attempts"],
      summary: "Start a timed attempt (server is the source of truth for the timer)",
      description:
        "Validates invitation, assessment window, max attempts and expiry. Creates the attempt with expiresAt = now + durationMinutes.",
      responses: {
        "201": { description: "Attempt started" },
        "403": { description: "Not invited" },
        "409": { description: "Max attempts reached / assessment not open" },
      },
    },
  },
  "/attempts/{id}": {
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        schema: { type: "string", format: "uuid" },
      },
    ],
    get: {
      tags: ["Attempts"],
      summary: "Get attempt (owner, recruiter of the company, or admin)",
    },
  },
  "/attempts/{id}/time": {
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        schema: { type: "string", format: "uuid" },
      },
    ],
    get: {
      tags: ["Attempts"],
      summary:
        "Get server-authoritative remaining time (server clock is the source of truth)",
    },
  },
  "/attempts/{id}/anti-cheating-report": {
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        schema: { type: "string", format: "uuid" },
      },
    ],
    get: {
      tags: ["Anti-Cheating"],
      summary:
        "Anti-cheating report: risk score, level, event counts, sessions and timeline",
    },
  },
  "/attempts/{id}/questions": {
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        schema: { type: "string", format: "uuid" },
      },
    ],
    get: {
      tags: ["Attempts"],
      summary:
        "Get the questions for this attempt (sanitized: no hidden test cases or correct answers)",
    },
  },
  "/attempts/{id}/answers": {
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        schema: { type: "string", format: "uuid" },
      },
    ],
    post: {
      tags: ["Attempts"],
      summary: "Save an answer (MCQ/written/coding draft)",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["problemId"],
              properties: {
                problemId: { type: "string", format: "uuid" },
                answer: {
                  description:
                    "MCQ: {selectedOptionId} or {selectedOptionIndex}. Written: {text}",
                  example: { selectedOptionId: "uuid" },
                },
                code: { type: "string" },
                programmingLanguage: {
                  type: "string",
                  enum: [
                    "javascript",
                    "python",
                    "java",
                    "cpp",
                    "typescript",
                    "go",
                    "rust",
                  ],
                },
              },
            },
          },
        },
      },
      responses: {
        "201": { description: "Answer saved" },
        "409": { description: "Attempt ended" },
      },
    },
  },
  "/attempts/{id}/answers/{answerId}": {
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        schema: { type: "string", format: "uuid" },
      },
      {
        name: "answerId",
        in: "path",
        required: true,
        schema: { type: "string", format: "uuid" },
      },
    ],
    patch: { tags: ["Attempts"], summary: "Update a saved answer" },
  },
  "/attempts/{id}/submit": {
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        schema: { type: "string", format: "uuid" },
      },
    ],
    post: {
      tags: ["Attempts"],
      summary: "Submit the attempt (idempotent, race-safe)",
      description:
        "Marks SUBMITTED (or AUTO_SUBMITTED when past expiresAt). Triggers automatic MCQ evaluation and result calculation.",
      responses: { "200": { description: "Submitted" } },
    },
  },
  "/candidates/me/attempts": {
    get: {
      tags: ["Attempts"],
      summary: "My attempt history (CANDIDATE)",
      responses: { "200": { description: "Paginated attempts" } },
    },
  },
});
Object.assign(swaggerDocument.paths, {
  "/submissions": {
    post: {
      tags: ["Submissions"],
      summary: "Create a code submission for a CODING problem in my attempt",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["attemptId", "problemId", "code", "programmingLanguage"],
              properties: {
                attemptId: { type: "string", format: "uuid" },
                problemId: { type: "string", format: "uuid" },
                code: { type: "string" },
                programmingLanguage: { type: "string" },
              },
            },
          },
        },
      },
      responses: {
        "201": { description: "Submission created (status PENDING)" },
        "409": { description: "Already processing / attempt ended" },
      },
    },
  },
  "/submissions/{id}": {
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        schema: { type: "string", format: "uuid" },
      },
    ],
    get: { tags: ["Submissions"], summary: "Get a submission" },
  },
  "/submissions/{id}/evaluate": {
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        schema: { type: "string", format: "uuid" },
      },
    ],
    post: {
      tags: ["Submissions"],
      summary: "Run evaluation for a submission (RECRUITER/ADMIN)",
      description:
        "Dispatches code to the sandboxed code runner (never executed inside the API server) and records per-test-case results.",
      responses: { "200": { description: "Evaluated" } },
    },
  },
  "/attempts/{id}/submissions": {
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        schema: { type: "string", format: "uuid" },
      },
    ],
    get: { tags: ["Submissions"], summary: "List submissions for an attempt" },
  },
  "/assessments/{id}/submissions": {
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        schema: { type: "string", format: "uuid" },
      },
    ],
    get: {
      tags: ["Submissions"],
      summary: "List submissions across an assessment's attempts (RECRUITER/ADMIN)",
      parameters: [
        { name: "page", in: "query", schema: { type: "integer" } },
        { name: "limit", in: "query", schema: { type: "integer" } },
        { name: "status", in: "query", schema: { type: "string" } },
        { name: "problemId", in: "query", schema: { type: "string", format: "uuid" } },
      ],
    },
  },
  "/evaluations/pending": {
    get: {
      tags: ["Evaluations"],
      summary: "List written evaluations pending manual scoring (RECRUITER/ADMIN)",
      parameters: [
        { name: "page", in: "query", schema: { type: "integer" } },
        { name: "limit", in: "query", schema: { type: "integer" } },
      ],
    },
  },
  "/evaluations/written": {
    post: {
      tags: ["Evaluations"],
      summary: "Manually score a WRITTEN answer (RECRUITER/ADMIN)",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["attemptId", "problemId", "score"],
              properties: {
                attemptId: { type: "string", format: "uuid" },
                problemId: { type: "string", format: "uuid" },
                score: { type: "integer" },
                feedback: { type: "string" },
              },
            },
          },
        },
      },
      responses: { "200": { description: "Evaluated; recalculated result returned" } },
    },
  },
  "/attempts/{id}/evaluations": {
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        schema: { type: "string", format: "uuid" },
      },
    ],
    get: { tags: ["Evaluations"], summary: "List evaluations for an attempt" },
  },
  "/assessments/{id}/evaluations": {
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        schema: { type: "string", format: "uuid" },
      },
    ],
    get: {
      tags: ["Evaluations"],
      summary: "List evaluations across an assessment's attempts (RECRUITER/ADMIN)",
      parameters: [
        { name: "page", in: "query", schema: { type: "integer" } },
        { name: "limit", in: "query", schema: { type: "integer" } },
        { name: "status", in: "query", schema: { type: "string" } },
      ],
    },
  },
  "/results/{id}": {
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        schema: { type: "string", format: "uuid" },
      },
    ],
    get: {
      tags: ["Results"],
      summary: "Get a result (candidates only when released)",
      responses: {
        "200": { description: "Result with per-question items" },
        "403": { description: "Not released" },
      },
    },
  },
  "/results/{id}/skills": {
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        schema: { type: "string", format: "uuid" },
      },
    ],
    get: {
      tags: ["Results"],
      summary: "Per-skill score breakdown for a result",
    },
  },
  "/candidates/me/results": {
    get: { tags: ["Results"], summary: "My results (CANDIDATE)" },
  },
  "/assessments/{id}/results": {
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        schema: { type: "string", format: "uuid" },
      },
    ],
    get: {
      tags: ["Results"],
      summary: "All results for an assessment (RECRUITER/ADMIN)",
    },
  },
  "/assessments/{id}/report": {
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        schema: { type: "string", format: "uuid" },
      },
    ],
    get: {
      tags: ["Reports"],
      summary: "Generate a detailed assessment report (cached 10 min)",
    },
  },
  "/assessments/{id}/report/export.csv": {
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        schema: { type: "string", format: "uuid" },
      },
    ],
    get: {
      tags: ["Reports"],
      summary: "Download the assessment report as a CSV file (RECRUITER/ADMIN)",
      responses: { "200": { description: "text/csv attachment" } },
    },
  },
  "/assessments/{id}/analytics": {
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        schema: { type: "string", format: "uuid" },
      },
    ],
    get: {
      tags: ["Analytics"],
      summary: "Assessment analytics (cached 5 min, invalidated on result changes)",
    },
  },
  "/attempts/{id}/anti-cheating-events": {
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        schema: { type: "string", format: "uuid" },
      },
    ],
    post: {
      tags: ["Anti-Cheating"],
      summary: "Record a proctoring event",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["eventType"],
              properties: {
                eventType: {
                  type: "string",
                  enum: [
                    "TAB_SWITCH",
                    "WINDOW_BLUR",
                    "WINDOW_FOCUS",
                    "FULLSCREEN_EXIT",
                    "COPY",
                    "PASTE",
                    "MULTIPLE_SESSION",
                    "SUSPICIOUS_ACTIVITY",
                  ],
                },
                metadata: {},
              },
            },
          },
        },
      },
      responses: {
        "201": { description: "Event recorded (IP + user-agent captured server-side)" },
      },
    },
    get: { tags: ["Anti-Cheating"], summary: "List proctoring events for the attempt" },
  },
});
Object.assign(swaggerDocument.paths, {
  "/payments/packages": {
    get: {
      tags: ["Payments"],
      summary: "List available credit packages",
      security: [],
    },
  },
  "/payments/initiate": {
    post: {
      tags: ["Payments"],
      summary: "Initiate an SSLCommerz payment for a credit package",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["packageId"],
              properties: {
                packageId: { type: "string", format: "uuid" },
                companyId: { type: "string", format: "uuid" },
              },
            },
          },
        },
      },
      responses: {
        "201": { description: "Returns payment + gatewayUrl for redirect" },
        "502": { description: "Gateway unreachable" },
      },
    },
  },
  "/payments/success": {
    post: {
      tags: ["Payments"],
      summary:
        "Gateway success callback (verifies with SSLCommerz before marking PAID; idempotent)",
      security: [],
      parameters: [{ name: "tran_id", in: "query", schema: { type: "string" } }],
      responses: {
        "200": { description: "Payment marked PAID and credits granted" },
        "502": { description: "Verification failed" },
      },
    },
  },
  "/payments/fail": {
    post: { tags: ["Payments"], summary: "Gateway failure callback", security: [] },
  },
  "/payments/cancel": {
    post: { tags: ["Payments"], summary: "Gateway cancel callback", security: [] },
  },
  "/payments/ipn": {
    post: {
      tags: ["Payments"],
      summary: "IPN callback from SSLCommerz (verified + idempotent)",
      security: [],
      responses: { "200": { description: "IPN processed" } },
    },
  },
  "/payments": {
    get: {
      tags: ["Payments"],
      summary: "List my payments (recruiter: company payments)",
    },
  },
  "/payments/{id}": {
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        schema: { type: "string", format: "uuid" },
      },
    ],
    get: { tags: ["Payments"], summary: "Get payment details" },
  },
  "/assessment-templates": {
    post: {
      tags: ["AssessmentTemplates"],
      summary: "Create a reusable assessment template (RECRUITER/ADMIN)",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["title", "durationMinutes"],
              properties: {
                title: { type: "string" },
                description: { type: "string" },
                durationMinutes: { type: "integer", minimum: 5, maximum: 1440 },
                passingScore: { type: "integer" },
                maxAttempts: { type: "integer" },
                shuffleProblems: { type: "boolean" },
                shuffleOptions: { type: "boolean" },
                showResults: { type: "boolean" },
                antiCheatingEnabled: { type: "boolean" },
                resultStrategy: {
                  type: "string",
                  enum: ["BEST_SCORE", "LATEST_SCORE", "FIRST_SCORE"],
                },
                accessLevel: {
                  type: "string",
                  enum: ["PUBLIC", "PRIVATE", "INVITATION_ONLY", "ACCESS_CODE"],
                },
                questionConfig: {},
                skills: { type: "array", items: { type: "string" } },
                difficultyDistribution: {},
                antiCheatingSettings: {},
                companyId: { type: "string", format: "uuid" },
                status: { type: "string", enum: ["DRAFT", "ACTIVE", "ARCHIVED"] },
              },
            },
          },
        },
      },
    },
    get: {
      tags: ["AssessmentTemplates"],
      summary: "List assessment templates",
      parameters: [
        { name: "page", in: "query", schema: { type: "integer" } },
        { name: "limit", in: "query", schema: { type: "integer" } },
        { name: "q", in: "query", schema: { type: "string" } },
        { name: "status", in: "query", schema: { type: "string" } },
        { name: "companyId", in: "query", schema: { type: "string", format: "uuid" } },
      ],
    },
  },
  "/assessment-templates/{id}": {
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        schema: { type: "string", format: "uuid" },
      },
    ],
    get: { tags: ["AssessmentTemplates"], summary: "Get a template" },
    patch: { tags: ["AssessmentTemplates"], summary: "Update a template" },
    delete: { tags: ["AssessmentTemplates"], summary: "Delete a template" },
  },
  "/assessment-templates/{id}/use": {
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        schema: { type: "string", format: "uuid" },
      },
    ],
    post: {
      tags: ["AssessmentTemplates"],
      summary: "Create an assessment from the template",
      requestBody: {
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                title: { type: "string" },
                companyId: { type: "string", format: "uuid" },
              },
            },
          },
        },
      },
    },
  },
  "/notes": {
    post: {
      tags: ["Notes"],
      summary: "Add a note to a candidate (RECRUITER/ADMIN)",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["candidateId", "content"],
              properties: {
                candidateId: { type: "string", format: "uuid" },
                assessmentId: { type: "string", format: "uuid" },
                companyId: { type: "string", format: "uuid" },
                content: { type: "string" },
                isPrivate: { type: "boolean" },
              },
            },
          },
        },
      },
    },
  },
  "/notes/candidate/{candidateId}": {
    parameters: [
      {
        name: "candidateId",
        in: "path",
        required: true,
        schema: { type: "string", format: "uuid" },
      },
    ],
    get: {
      tags: ["Notes"],
      summary: "List a candidate's notes",
      parameters: [
        { name: "page", in: "query", schema: { type: "integer" } },
        { name: "limit", in: "query", schema: { type: "integer" } },
        {
          name: "assessmentId",
          in: "query",
          schema: { type: "string", format: "uuid" },
        },
      ],
    },
  },
  "/notes/{noteId}": {
    parameters: [
      {
        name: "noteId",
        in: "path",
        required: true,
        schema: { type: "string", format: "uuid" },
      },
    ],
    patch: { tags: ["Notes"], summary: "Update a note (author or ADMIN)" },
    delete: { tags: ["Notes"], summary: "Delete a note (author or ADMIN)" },
  },
  "/notifications": {
    get: {
      tags: ["Notifications"],
      summary: "List my notifications",
      parameters: [
        { name: "page", in: "query", schema: { type: "integer" } },
        { name: "limit", in: "query", schema: { type: "integer" } },
        {
          name: "status",
          in: "query",
          schema: { type: "string", enum: ["UNREAD", "READ"] },
        },
      ],
    },
  },
  "/notifications/unread-count": {
    get: { tags: ["Notifications"], summary: "Unread notification count" },
  },
  "/notifications/{id}/read": {
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        schema: { type: "string", format: "uuid" },
      },
    ],
    patch: { tags: ["Notifications"], summary: "Mark a notification as read" },
  },
  "/notifications/read-all": {
    post: { tags: ["Notifications"], summary: "Mark all of my notifications as read" },
  },
  "/dashboard/recruiter": {
    get: { tags: ["Dashboard"], summary: "Recruiter/Admin aggregate dashboard" },
  },
  "/dashboard/candidate": {
    get: { tags: ["Dashboard"], summary: "Candidate aggregate dashboard" },
  },
  "/admin/users": {
    get: {
      tags: ["Admin"],
      summary: "List users with filters (ADMIN)",
      parameters: [
        { name: "page", in: "query", schema: { type: "integer" } },
        { name: "limit", in: "query", schema: { type: "integer" } },
        { name: "q", in: "query", schema: { type: "string" } },
        {
          name: "role",
          in: "query",
          schema: { type: "string", enum: ["CANDIDATE", "RECRUITER", "ADMIN"] },
        },
        {
          name: "status",
          in: "query",
          schema: { type: "string", enum: ["ACTIVE", "SUSPENDED", "DELETED"] },
        },
      ],
    },
  },
  "/admin/users/{id}": {
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        schema: { type: "string", format: "uuid" },
      },
    ],
    get: { tags: ["Admin"], summary: "Get user details (ADMIN)" },
  },
  "/admin/users/{id}/status": {
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        schema: { type: "string", format: "uuid" },
      },
    ],
    patch: {
      tags: ["Admin"],
      summary: "Suspend/activate/delete a user",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["status"],
              properties: {
                status: { type: "string", enum: ["ACTIVE", "SUSPENDED", "DELETED"] },
              },
            },
          },
        },
      },
    },
  },
  "/admin/users/{id}/role": {
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        schema: { type: "string", format: "uuid" },
      },
    ],
    patch: {
      tags: ["Admin"],
      summary: "Change a user's role",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["role"],
              properties: {
                role: { type: "string", enum: ["CANDIDATE", "RECRUITER", "ADMIN"] },
              },
            },
          },
        },
      },
    },
  },
  "/admin/companies": {
    get: { tags: ["Admin"], summary: "List all companies (ADMIN)" },
  },
  "/admin/assessments": {
    get: { tags: ["Admin"], summary: "List all assessments (ADMIN)" },
  },
  "/admin/payments": { get: { tags: ["Admin"], summary: "List all payments (ADMIN)" } },
  "/admin/problems": { get: { tags: ["Admin"], summary: "List all problems (ADMIN)" } },
  "/admin/dashboard-stats": {
    get: {
      tags: ["Admin"],
      summary:
        "Platform statistics: users, candidates, recruiters, companies, assessments, attempts, revenue",
    },
  },
  "/admin/audit-logs": {
    get: {
      tags: ["Admin"],
      summary: "Query audit logs",
      parameters: [
        { name: "page", in: "query", schema: { type: "integer" } },
        { name: "limit", in: "query", schema: { type: "integer" } },
        { name: "action", in: "query", schema: { type: "string" } },
        { name: "entityType", in: "query", schema: { type: "string" } },
        { name: "actorId", in: "query", schema: { type: "string", format: "uuid" } },
      ],
    },
  },
});

export default swaggerDocument;
