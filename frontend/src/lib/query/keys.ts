/**
 * Centralised React Query key factory.
 * Keeping keys here makes invalidation predictable across mutations.
 */
export const qk = {
  auth: {
    me: ["auth", "me"] as const,
  },
  users: {
    me: ["users", "me"] as const,
    activity: (page?: number) => ["users", "me", "activity", page ?? 1] as const,
  },
  companies: {
    all: ["companies"] as const,
    list: (params?: unknown) => ["companies", "list", params ?? {}] as const,
    detail: (id: string) => ["companies", "detail", id] as const,
    members: (id: string) => ["companies", "members", id] as const,
    analytics: (id: string) => ["companies", "analytics", id] as const,
    reports: (id: string, params?: unknown) => ["companies", "reports", id, params ?? {}] as const,
    reportSummary: (id: string) => ["companies", "report-summary", id] as const,
    candidates: (id: string, params?: unknown) => ["companies", "candidates", id, params ?? {}] as const,
  },
  problems: {
    all: ["problems"] as const,
    list: (params?: unknown) => ["problems", "list", params ?? {}] as const,
    search: (q: string, params?: unknown) => ["problems", "search", q, params ?? {}] as const,
    detail: (id: string) => ["problems", "detail", id] as const,
  },
  assessments: {
    all: ["assessments"] as const,
    list: (params?: unknown) => ["assessments", "list", params ?? {}] as const,
    detail: (id: string) => ["assessments", "detail", id] as const,
    problems: (id: string, params?: unknown) => ["assessments", "problems", id, params ?? {}] as const,
    invitations: (id: string, params?: unknown) => ["assessments", "invitations", id, params ?? {}] as const,
    results: (id: string, params?: unknown) => ["assessments", "results", id, params ?? {}] as const,
    submissions: (id: string, params?: unknown) => ["assessments", "submissions", id, params ?? {}] as const,
    evaluations: (id: string, params?: unknown) => ["assessments", "evaluations", id, params ?? {}] as const,
    history: (id: string) => ["assessments", "history", id] as const,
    report: (id: string) => ["assessments", "report", id] as const,
    analytics: (id: string) => ["assessments", "analytics", id] as const,
    compare: (id: string, ids: string) => ["assessments", "compare", id, ids] as const,
  },
  invitations: {
    mine: (params?: unknown) => ["invitations", "mine", params ?? {}] as const,
  },
  attempts: {
    all: ["attempts"] as const,
    mine: (params?: unknown) => ["attempts", "mine", params ?? {}] as const,
    detail: (id: string) => ["attempts", "detail", id] as const,
    time: (id: string) => ["attempts", "time", id] as const,
    questions: (id: string) => ["attempts", "questions", id] as const,
    submissions: (id: string) => ["attempts", "submissions", id] as const,
    evaluations: (id: string) => ["attempts", "evaluations", id] as const,
    antiCheatEvents: (id: string, params?: unknown) => ["attempts", "anti-cheat-events", id, params ?? {}] as const,
    antiCheatReport: (id: string) => ["attempts", "anti-cheat-report", id] as const,
  },
  submissions: {
    detail: (id: string) => ["submissions", "detail", id] as const,
  },
  evaluations: {
    pending: (params?: unknown) => ["evaluations", "pending", params ?? {}] as const,
  },
  results: {
    all: ["results"] as const,
    mine: (params?: unknown) => ["results", "mine", params ?? {}] as const,
    detail: (id: string) => ["results", "detail", id] as const,
    skills: (id: string) => ["results", "skills", id] as const,
  },
  payments: {
    packages: ["payments", "packages"] as const,
    list: (params?: unknown) => ["payments", "list", params ?? {}] as const,
    detail: (id: string) => ["payments", "detail", id] as const,
  },
  templates: {
    all: ["templates"] as const,
    list: (params?: unknown) => ["templates", "list", params ?? {}] as const,
    detail: (id: string) => ["templates", "detail", id] as const,
  },
  notes: {
    byCandidate: (candidateId: string, params?: unknown) =>
      ["notes", candidateId, params ?? {}] as const,
  },
  notifications: {
    all: ["notifications"] as const,
    list: (params?: unknown) => ["notifications", "list", params ?? {}] as const,
    unreadCount: ["notifications", "unread-count"] as const,
  },
  dashboard: {
    recruiter: ["dashboard", "recruiter"] as const,
    candidate: ["dashboard", "candidate"] as const,
  },
  admin: {
    stats: ["admin", "stats"] as const,
    users: (params?: unknown) => ["admin", "users", params ?? {}] as const,
    user: (id: string) => ["admin", "user", id] as const,
    companies: (params?: unknown) => ["admin", "companies", params ?? {}] as const,
    assessments: (params?: unknown) => ["admin", "assessments", params ?? {}] as const,
    problems: (params?: unknown) => ["admin", "problems", params ?? {}] as const,
    payments: (params?: unknown) => ["admin", "payments", params ?? {}] as const,
    auditLogs: (params?: unknown) => ["admin", "audit-logs", params ?? {}] as const,
  },
} as const;