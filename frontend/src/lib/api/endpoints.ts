/**
 * Single source of truth for every backend path.
 * Base: `/api/v1` (configured on the axios instance).
 */
export const endpoints = {
  health: {
    root: "/",
    health: "/health",
  },

  auth: {
    register: "/auth/register",
    login: "/auth/login",
    refresh: "/auth/refresh-token",
    logout: "/auth/logout",
    me: "/auth/me",
  },

  users: {
    me: "/users/me",
    password: "/users/me/password",
    activity: "/users/me/activity",
  },

  companies: {
    list: "/companies",
    create: "/companies",
    byId: (id: string) => `/companies/${id}`,
    members: (id: string) => `/companies/${id}/members`,
    reports: (id: string) => `/companies/${id}/reports`,
    reportSummary: (id: string) => `/companies/${id}/reports/summary`,
    analytics: (id: string) => `/companies/${id}/analytics`,
    candidates: (id: string) => `/companies/${id}/candidates`,
    candidateStatus: (invitationId: string) => `/companies/candidates/${invitationId}/status`,
  },

  problems: {
    list: "/problems",
    create: "/problems",
    search: "/problems/search",
    byId: (id: string) => `/problems/${id}`,
  },

  assessments: {
    list: "/assessments",
    create: "/assessments",
    byId: (id: string) => `/assessments/${id}`,
    publish: (id: string) => `/assessments/${id}/publish`,
    close: (id: string) => `/assessments/${id}/close`,
    archive: (id: string) => `/assessments/${id}/archive`,
    restore: (id: string) => `/assessments/${id}/restore`,
    duplicate: (id: string) => `/assessments/${id}/duplicate`,
    recalculate: (id: string) => `/assessments/${id}/recalculate-results`,
    history: (id: string) => `/assessments/${id}/history`,
    compare: (id: string) => `/assessments/${id}/candidates/compare`,
    problems: (id: string) => `/assessments/${id}/problems`,
    problem: (id: string, problemId: string) => `/assessments/${id}/problems/${problemId}`,
    invitations: (id: string) => `/assessments/${id}/invitations`,
    results: (id: string) => `/assessments/${id}/results`,
    submissions: (id: string) => `/assessments/${id}/submissions`,
    evaluations: (id: string) => `/assessments/${id}/evaluations`,
    report: (id: string) => `/assessments/${id}/report`,
    reportCsv: (id: string) => `/assessments/${id}/report/export.csv`,
    analytics: (id: string) => `/assessments/${id}/analytics`,
    startAttempt: (id: string) => `/assessments/${id}/attempts/start`,
  },

  invitations: {
    resend: (id: string) => `/invitations/${id}/resend`,
    accept: (id: string) => `/invitations/${id}/accept`,
    reject: (id: string) => `/invitations/${id}/reject`,
    mine: "/candidates/invitations",
  },

  attempts: {
    byId: (id: string) => `/attempts/${id}`,
    time: (id: string) => `/attempts/${id}/time`,
    questions: (id: string) => `/attempts/${id}/questions`,
    answers: (id: string) => `/attempts/${id}/answers`,
    answer: (id: string, answerId: string) => `/attempts/${id}/answers/${answerId}`,
    submit: (id: string) => `/attempts/${id}/submit`,
    submissions: (id: string) => `/attempts/${id}/submissions`,
    evaluations: (id: string) => `/attempts/${id}/evaluations`,
    antiCheatingEvents: (id: string) => `/attempts/${id}/anti-cheating-events`,
    antiCheatingReport: (id: string) => `/attempts/${id}/anti-cheating-report`,
    mine: "/candidates/me/attempts",
  },

  submissions: {
    create: "/submissions",
    byId: (id: string) => `/submissions/${id}`,
    evaluate: (id: string) => `/submissions/${id}/evaluate`,
  },

  evaluations: {
    pending: "/evaluations/pending",
    written: "/evaluations/written",
  },

  results: {
    byId: (id: string) => `/results/${id}`,
    skills: (id: string) => `/results/${id}/skills`,
    mine: "/candidates/me/results",
  },

  payments: {
    packages: "/payments/packages",
    initiate: "/payments/initiate",
    byId: (id: string) => `/payments/${id}`,
    list: "/payments",
  },

  templates: {
    list: "/assessment-templates",
    create: "/assessment-templates",
    byId: (id: string) => `/assessment-templates/${id}`,
    use: (id: string) => `/assessment-templates/${id}/use`,
  },

  notes: {
    create: "/notes",
    byCandidate: (candidateId: string) => `/notes/candidate/${candidateId}`,
    byId: (noteId: string) => `/notes/${noteId}`,
  },

  notifications: {
    list: "/notifications",
    unreadCount: "/notifications/unread-count",
    read: (id: string) => `/notifications/${id}/read`,
    readAll: "/notifications/read-all",
  },

  dashboard: {
    recruiter: "/dashboard/recruiter",
    candidate: "/dashboard/candidate",
  },

  admin: {
    users: "/admin/users",
    user: (id: string) => `/admin/users/${id}`,
    userStatus: (id: string) => `/admin/users/${id}/status`,
    userRole: (id: string) => `/admin/users/${id}/role`,
    companies: "/admin/companies",
    assessments: "/admin/assessments",
    payments: "/admin/payments",
    problems: "/admin/problems",
    dashboardStats: "/admin/dashboard-stats",
    auditLogs: "/admin/audit-logs",
  },
} as const;

export default endpoints;