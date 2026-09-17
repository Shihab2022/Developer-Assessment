import {
  ANTI_CHEAT_EVENT_TYPES,
  ASSESSMENT_STATUSES,
  PROBLEM_TYPES,
  PROGRAMMING_LANGUAGES,
  ROLES,
  type BadgeTone,
} from "./constants";

/**
 * Landing-page content.
 *
 * Every string the marketing page renders lives here so copy can be edited
 * without touching layout code. Counts are derived from the real backend enums
 * in `constants.ts` rather than being invented marketing figures.
 */

/* -------------------------------------------------------------------- nav */

export interface LandingNavLink {
  href: string;
  label: string;
}

export const LANDING_NAV: LandingNavLink[] = [
  { href: "#exams", label: "Exams" },
  { href: "#practice", label: "Practice" },
  { href: "#playground", label: "Playground" },
  { href: "#competitions", label: "Competitions" },
  { href: "#question-bank", label: "Question bank" },
  { href: "#faq", label: "FAQ" },
];

/* ------------------------------------------------------------------ stats */

export interface LandingStat {
  value: string;
  label: string;
  hint: string;
}

/** Capability counts pulled from the enums the API actually enforces. */
export const LANDING_STATS: LandingStat[] = [
  {
    value: `${PROGRAMMING_LANGUAGES.length}`,
    label: "Languages in the runner",
    hint: "JavaScript, TypeScript, Python, SQL, HTML, CSS and more",
  },
  {
    value: `${PROBLEM_TYPES.length}`,
    label: "Question formats",
    hint: "Coding, multiple-choice and written answers",
  },
  {
    value: `${ASSESSMENT_STATUSES.length}`,
    label: "Lifecycle states",
    hint: "Draft, published, active, closed, archived",
  },
  {
    value: `${ANTI_CHEAT_EVENT_TYPES.length}`,
    label: "Proctoring signals",
    hint: "Tab switches, focus loss, copy / paste, fullscreen exits",
  },
  {
    value: `${ROLES.length}`,
    label: "Workspace roles",
    hint: "Candidate, recruiter or institute, administrator",
  },
];

/* ---------------------------------------------------------------- pillars */

export interface LandingPillar {
  /** Anchor id — the deep-dive section and the card grid both use it. */
  id: string;
  eyebrow: string;
  title: string;
  blurb: string;
  /** lucide-react icon name, resolved by the rendering component. */
  icon: string;
  tone: BadgeTone;
  bullets: string[];
  cta: { label: string; href: string };
}

export const LANDING_PILLARS: LandingPillar[] = [
  {
    id: "exams",
    eyebrow: "Technology exams",
    title: "Sit a real exam for the stack you claim",
    blurb:
      "Pick a technology — HTML, CSS, JavaScript, TypeScript, Python or SQL — and take a timed, auto-graded exam drawn from that skill's question pool.",
    icon: "ClipboardList",
    tone: "indigo",
    bullets: [
      "Papers across markup, styling, scripting, backend and databases",
      "Server-timed attempts — the clock is authoritative, not the browser tab",
      "Instant MCQ scoring and automatic submit when time runs out",
      "Retake rules per exam: attempt limit plus best / latest / first score",
      "Result page with a per-question breakdown and a shareable scorecard",
    ],
    cta: { label: "Browse exams", href: "/exams" },
  },
  {
    id: "practice",
    eyebrow: "Practice arena",
    title: "Practice with grading that actually means something",
    blurb:
      "Work through a curated problem bank: solve in the editor, submit, and get judged against the visible examples and the hidden test cases.",
    icon: "Code2",
    tone: "green",
    bullets: [
      "Filter by technology, difficulty (easy / medium / hard) and tags",
      "Three formats: coding challenges, MCQ drills and written answers",
      "Visible sample cases plus hidden cases that decide the verdict",
      "Every submission is stored, so attempts and languages compare cleanly",
      "Points and difficulty tiers keep progress measurable, not vibes",
    ],
    cta: { label: "Start practising", href: "/register" },
  },
  {
    id: "playground",
    eyebrow: "Online compiler",
    title: "Bring your own code and just run it",
    blurb:
      "A scratchpad for everything that is not part of an assessment: write JavaScript, TypeScript, Python, SQL, HTML or CSS and read the output without installing a toolchain.",
    icon: "Terminal",
    tone: "blue",
    bullets: [
      `${PROGRAMMING_LANGUAGES.length} languages and syntax modes behind one dropdown`,
      "Monaco editor with highlighting, indentation and familiar shortcuts",
      "stdout, stderr and exit status shown next to the code — no tab juggling",
      "HTML and CSS render in a live preview pane so styling work is visible too",
      "Share a snippet with a teammate to make debugging a conversation",
    ],
    cta: { label: "Open the playground", href: "/register" },
  },
  {
    id: "competitions",
    eyebrow: "Competitions",
    title: "Host your own contest, start to finish",
    blurb:
      "Companies, universities and coding clubs run time-boxed competitions here: build the paper, invite the field, watch the leaderboard settle, export the results.",
    icon: "Trophy",
    tone: "amber",
    bullets: [
      "Publish in minutes: duration, open window, pass mark, attempt policy",
      "Invite by email, access code, public link or bulk candidate import",
      "Ranking table with configurable visibility and a scored leaderboard",
      "Anti-cheating signals recorded per attempt for post-contest review",
      "CSV export plus per-question performance analytics for the panel",
    ],
    cta: { label: "Host a competition", href: "/register" },
  },
  {
    id: "question-bank",
    eyebrow: "Question bank & authoring",
    title: "Use our questions, or write your own",
    blurb:
      "Reuse the curated bank or author private questions, and keep them reusable across every exam, contest and hiring round your team runs.",
    icon: "Library",
    tone: "violet",
    bullets: [
      "Author coding, MCQ and written questions with points, difficulty, tags",
      "Attach test cases, sample I/O, allowed languages, time and memory limits",
      "Full-text search across your private bank and the shared library",
      "Save complete papers as templates and duplicate them freely",
      "Draft privately, publish when the paper is ready — no accidental leaks",
    ],
    cta: { label: "Build your first paper", href: "/register" },
  },
  {
    id: "insights",
    eyebrow: "Trust & insight",
    title: "Proctoring, analytics and an auditable trail",
    blurb:
      "Every attempt is timed, monitored and scored, and every critical action is logged — so a result from this platform is something you can stand behind.",
    icon: "ShieldCheck",
    tone: "red",
    bullets: [
      `${ANTI_CHEAT_EVENT_TYPES.length} proctoring event types with a per-attempt risk score`,
      "Company-level analytics so reporting is repeatable, not re-invented",
      "Candidate rankings, question performance and skill breakdowns",
      "Role-based access, audit logs and soft deletes on critical entities",
      "Notifications keep candidates, reviewers and admins in sync",
    ],
    cta: { label: "See how it works", href: "#how-it-works" },
  },
];

export const LANDING_PILLARS_BY_ID: Record<string, LandingPillar> = Object.fromEntries(
  LANDING_PILLARS.map((pillar) => [pillar.id, pillar]),
);

/** Look up a pillar's copy (falls back to the first pillar). */
export function pillarById(id: string): LandingPillar {
  return LANDING_PILLARS_BY_ID[id] ?? LANDING_PILLARS[0]!;
}

/* ----------------------------------------------------------------- tracks */

export interface LandingTrackGroup {
  category: string;
  description: string;
  items: string[];
}

/** Technologies a candidate can be examined or tested on today. */
export const LANDING_TRACKS: LandingTrackGroup[] = [
  {
    category: "Markup & styling",
    description: "Semantics, accessibility and layout before the framework layer.",
    items: ["HTML5", "CSS3", "Flexbox & Grid", "Responsive design", "Tailwind CSS"],
  },
  {
    category: "JavaScript & TypeScript",
    description: "Language fundamentals, the DOM, async patterns and the type system.",
    items: ["JavaScript", "TypeScript", "DOM & events", "Promises & async", "ESM & bundling"],
  },
  {
    category: "Backend & databases",
    description: "Servers, data modelling and the queries that hold an app together.",
    items: ["Node.js", "Express", "REST API design", "SQL", "PostgreSQL", "MongoDB"],
  },
  {
    category: "Frameworks & tooling",
    description: "Component thinking, testing and the delivery pipeline around it.",
    items: ["React", "Next.js", "Prisma", "Testing", "Git & CI"],
  },
  {
    category: "Fundamentals",
    description: "The reasoning layer that survives every framework rewrite.",
    items: ["Data structures", "Algorithms", "Complexity", "Debugging", "Clean code"],
  },
];

/* ------------------------------------------------------------- playground */

export interface PlaygroundDemo {
  /** Matches a `value` in `PROGRAMMING_LANGUAGES`. */
  language: string;
  label: string;
  /** File name shown in the editor tab strip. */
  file: string;
  code: string[];
  output: string[];
  /** Run duration shown in the preview status bar. */
  elapsed: string;
}

/** Preview snippets for the marketing code panel (rendered, never executed). */
export const PLAYGROUND_DEMOS: PlaygroundDemo[] = [
  {
    language: "javascript",
    label: "JavaScript",
    file: "solution.js",
    code: [
      "function twoSum(nums, target) {",
      "  const seen = new Map();",
      "  for (let i = 0; i < nums.length; i++) {",
      "    const need = target - nums[i];",
      "    if (seen.has(need)) return [seen.get(need), i];",
      "    seen.set(nums[i], i);",
      "  }",
      "  return [];",
      "}",
      "console.log(twoSum([2, 7, 11, 15], 9));",
    ],
    output: ["> [0, 1]", "exit 0 · 42 ms"],
    elapsed: "42 ms",
  },
  {
    language: "typescript",
    label: "TypeScript",
    file: "solution.ts",
    code: [
      "type User = { id: string; role: 'ADMIN' | 'CANDIDATE' };",
      "",
      "function groupByRole(users: User[]) {",
      "  return users.reduce<Record<string, number>>((acc, user) => {",
      "    acc[user.role] = (acc[user.role] ?? 0) + 1;",
      "    return acc;",
      "  }, {});",
      "}",
      "console.log(groupByRole([{ id: '1', role: 'ADMIN' }]));",
    ],
    output: ["> { ADMIN: 1 }", "type-checked with tsc · exit 0"],
    elapsed: "1.2 s",
  },
  {
    language: "python",
    label: "Python",
    file: "solution.py",
    code: [
      "def longest_unique_substring(text: str) -> int:",
      "    last, start, best = {}, 0, 0",
      "    for i, char in enumerate(text):",
      "        start = max(start, last.get(char, -1) + 1)",
      "        last[char] = i",
      "        best = max(best, i - start + 1)",
      "    return best",
      "",
      "print(longest_unique_substring('abcabcbb'))",
    ],
    output: ["> 3", "exit 0 · 78 ms"],
    elapsed: "78 ms",
  },
  {
    language: "sql",
    label: "SQL",
    file: "report.sql",
    code: [
      "SELECT",
      "  p.category,",
      "  COUNT(*)               AS solved,",
      "  ROUND(AVG(s.score), 1) AS avg_score",
      "FROM submissions s",
      "JOIN problems p ON p.id = s.problem_id",
      "WHERE s.status = 'PASSED'",
      "GROUP BY p.category",
      "ORDER BY solved DESC;",
    ],
    output: [
      "category   | solved | avg_score",
      "algorithms |    128 |      87.4",
      "javascript |     96 |      81.2",
      "2 rows · 12 ms",
    ],
    elapsed: "12 ms",
  },
  {
    language: "html",
    label: "HTML",
    file: "index.html",
    code: [
      "<!DOCTYPE html>",
      "<html lang=\"en\">",
      "  <body>",
      "    <main class=\"card\">",
      "      <h1>Hello, candidate</h1>",
      "      <p>Rendered in the live preview pane.</p>",
      "    </main>",
      "  </body>",
      "</html>",
    ],
    output: ["✓ DOM rendered in the preview pane", "no console errors"],
    elapsed: "—",
  },
  {
    language: "css",
    label: "CSS",
    file: "styles.css",
    code: [
      ".card {",
      "  display: grid;",
      "  gap: 0.5rem;",
      "  padding: 1.5rem;",
      "  border-radius: 1rem;",
      "  background: linear-gradient(135deg, indigo, skyblue);",
      "  color: white;",
      "}",
    ],
    output: ["✓ stylesheet applied to the preview pane", "computed border-radius: 16px"],
    elapsed: "—",
  },
];

/* ---------------------------------------------------------- how it works */

export interface LandingStep {
  step: string;
  title: string;
  description: string;
  icon: string;
}

export const LANDING_STEPS: LandingStep[] = [
  {
    step: "01",
    title: "Create a workspace",
    description:
      "Register as a candidate to practise and sit exams, or as a company / institute to host assessments and competitions.",
    icon: "UserPlus",
  },
  {
    step: "02",
    title: "Assemble the paper",
    description:
      "Take questions from the shared bank or author your own — coding, MCQ and written — then set duration, pass mark and attempt limits.",
    icon: "FilePlus2",
  },
  {
    step: "03",
    title: "Invite the field",
    description:
      "Send email invitations, hand out an access code or publish a public link. Candidates are notified the moment they are invited.",
    icon: "MailPlus",
  },
  {
    step: "04",
    title: "Run it, timed and proctored",
    description:
      "The server owns the clock, answers freeze at submission or expiry, and proctoring signals are recorded throughout the attempt.",
    icon: "Timer",
  },
  {
    step: "05",
    title: "Score, rank, export",
    description:
      "MCQ and coding answers are evaluated automatically, written answers are reviewed by your team, then results export as CSV with analytics.",
    icon: "BarChart3",
  },
];

/* ------------------------------------------------------------- audiences */

export interface LandingAudience {
  id: string;
  label: string;
  headline: string;
  description: string;
  bullets: string[];
  cta: { label: string; href: string };
}

export const LANDING_AUDIENCES: LandingAudience[] = [
  {
    id: "companies",
    label: "Companies",
    headline: "Hiring rounds that scale past the take-home",
    description:
      "Stand up a screening round or a full hiring drive and compare every candidate on the same paper.",
    bullets: [
      "Screen candidates with a timed technical round you can reuse next quarter",
      "Shortlist on score, rank and skill breakdown instead of gut feel",
      "Keep question quality honest with per-question difficulty analytics",
      "Add the whole panel as company members with owner, admin or member roles",
      "Print-ready reports for hiring managers and audit trails for compliance",
    ],
    cta: { label: "Start hiring", href: "/register" },
  },
  {
    id: "institutes",
    label: "Institutes",
    headline: "Classroom exams and coding clubs in one place",
    description:
      "Run semester tests, lab practicals and inter-college contests on the same question bank your students practise on.",
    bullets: [
      "Bulk-invite a cohort and track who started, finished or went quiet",
      "Set an open window so a whole section can sit the paper together",
      "Give students a practice arena so they rehearse before the graded exam",
      "Publish departmental leaderboards to make contests worth showing up for",
      "Export cohort results for moderation and accreditation files",
    ],
    cta: { label: "Set up a classroom", href: "/register" },
  },
  {
    id: "candidates",
    label: "Candidates",
    headline: "Prove the skill, not the résumé",
    description:
      "Practise daily, sit real exams and collect scorecards you can share with anyone who asks for proof.",
    bullets: [
      "Free-form practice across every supported technology, at your own pace",
      "Mock exams under the same server-timed conditions as the real thing",
      "Feedback that tells you which questions failed and where the time went",
      "A profile showing problems solved, exam scores and contest ranks",
      "Shareable scorecards so a recruiter sees evidence on the first read",
    ],
    cta: { label: "Create a profile", href: "/register" },
  },
];

/* --------------------------------------------------- extra capabilities */

export interface LandingCapability {
  title: string;
  description: string;
  icon: string;
}

/** Ideas beyond the six pillars that the platform already supports. */
export const LANDING_CAPABILITIES: LandingCapability[] = [
  {
    title: "Certificates & scorecards",
    description:
      "Every completed exam produces a result page with a score, a pass or fail verdict and a printable breakdown.",
    icon: "Award",
  },
  {
    title: "Leaderboards & rankings",
    description:
      "Contests and exams can expose a ranking table, so participants see exactly where they stand.",
    icon: "ListOrdered",
  },
  {
    title: "Reusable paper templates",
    description:
      "Save a paper as a template once, then spin up a fresh assessment from it for every new round.",
    icon: "LayoutTemplate",
  },
  {
    title: "Bulk invites & recruiter notes",
    description:
      "Invite a whole cohort in one action, then keep private notes against each candidate.",
    icon: "Users",
  },
  {
    title: "Credits & transparent billing",
    description:
      "Top up a company balance with a package; every credit movement is recorded as a transaction.",
    icon: "Coins",
  },
  {
    title: "Notifications for everyone",
    description:
      "Invitations, completions, published results and expiring assessments all raise in-app notifications.",
    icon: "Bell",
  },
];

/* -------------------------------------------------------------------- faq */

export interface LandingFaq {
  question: string;
  answer: string;
}

export const LANDING_FAQ: LandingFaq[] = [
  {
    question: "Do I need an account to practise or sit an exam?",
    answer:
      "Yes. An account is what keeps your submissions, attempt history and results together — that history is the point of the platform. Registration is free for candidates.",
  },
  {
    question: "Which technologies can I be assessed on?",
    answer:
      "Whatever the question bank covers: HTML, CSS, JavaScript, TypeScript, Python, SQL, Node.js and API design, alongside computer-science fundamentals such as data structures, algorithms and complexity.",
  },
  {
    question: "Which languages can I actually run in the online compiler?",
    answer: `The editor and runner support ${PROGRAMMING_LANGUAGES.map((lang) => lang.label).join(
      ", ",
    )}. Code is submitted to the execution sandbox for supported runtimes, while HTML and CSS render in a live preview pane instead.`,
  },
  {
    question: "Can a company bring its own questions, or must it use the shared bank?",
    answer:
      "Both. Build a paper entirely from the curated bank, entirely from your private questions, or mix the two. Private questions and templates stay scoped to your company workspace.",
  },
  {
    question: "How does a competition work for an institute or a company?",
    answer:
      "Create the assessment, attach the questions, then set the duration and opening window. Invite participants by email, access code or public link, and publish. The platform handles the timer, the evaluation, the leaderboard and the CSV export.",
  },
  {
    question: "What happens if a candidate loses their connection mid-exam?",
    answer:
      "The server is the source of truth for the clock, so answers already saved survive. Attempts submit automatically when the timer expires, and proctoring events record what happened for later review.",
  },
  {
    question: "How does proctoring work — does it block the attempt?",
    answer:
      "Proctoring records signals rather than blocking: tab switches, window blur, copy and paste, fullscreen exits, multiple sessions and other suspicious activity are logged per attempt with a risk score your reviewers can inspect.",
  },
  {
    question: "Can several people on my team share one workspace?",
    answer:
      "Yes. A company workspace supports owner, admin and member roles, so recruiters share the problem bank, assessments and candidate pipeline while administrators keep control.",
  },
];

/* ---------------------------------------------------------------- footer */

export interface LandingFooterGroup {
  title: string;
  links: { label: string; href: string }[];
}

export const LANDING_FOOTER_GROUPS: LandingFooterGroup[] = [
   {
    title: "Learn",
    links: [
      { label: "Technology exams", href: "/exams" },
      { label: "Practice arena", href: "#practice" },
      { label: "Online compiler", href: "#playground" },
      { label: "FAQ", href: "#faq" },
    ],
  },
  {
    title: "Host",
    links: [
      { label: "Competitions", href: "#competitions" },
      { label: "Question bank", href: "#question-bank" },
      { label: "How it works", href: "#how-it-works" },
      { label: "Sign in", href: "/login" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Create an account", href: "/register" },
      { label: "Candidate workspace", href: "/login" },
      { label: "Recruiter workspace", href: "/login" },
      { label: "Institute workspace", href: "/login" },
    ],
  },
];