import dotenv from "dotenv";
import path from "path";
import { z } from "zod";

dotenv.config({ path: path.join(process.cwd(), ".env") });

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(5000),
  DATABASE_URL: z.string().min(1),
  BCRYPT_SALT_ROUNDS: z.coerce.number().default(10),
  JWT_ACCESS_SECRET: z.string().min(1),
  JWT_REFRESH_SECRET: z.string().min(1),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
  REDIS_URL: z.string().optional(),
  REDIS_ENABLED: z
    .string()
    .optional()
    .transform((v) => v === "true"),
  CORS_ORIGIN: z.string().optional(),
  APP_URL: z.string().default("http://localhost:5000"),
  API_URL: z.string().default("http://localhost:5000"),
  SSLCOMMERZ_STORE_ID: z.string().optional(),
  SSLCOMMERZ_STORE_PASSWORD: z.string().optional(),
  SSLCOMMERZ_IS_LIVE: z
    .string()
    .optional()
    .transform((v) => v === "true"),
  SSLCOMMERZ_PAYMENT_API: z.string().optional(),
  SSLCOMMERZ_VALIDATION_API: z.string().optional(),
  SSLCOMMERZ_SUCCESS_URL: z.string().optional(),
  SSLCOMMERZ_FAIL_URL: z.string().optional(),
  SSLCOMMERZ_CANCEL_URL: z.string().optional(),
  ADMIN_EMAIL: z.string().optional(),
  ADMIN_PASSWORD: z.string().optional(),
  CODE_RUNNER_URL: z.string().url().optional(),
  ALLOW_LOCAL_SANDBOX: z
    .string()
    .optional()
    .transform((v) => v === "true"),
  // ---- AI interview review (optional: falls back to the built-in rubric engine) ----
  AI_API_KEY: z.string().optional(),
  AI_BASE_URL: z.string().url().default("https://api.openai.com/v1"),
  AI_MODEL: z.string().default("gpt-4o-mini"),
  AI_TIMEOUT_MS: z.coerce.number().default(45000),
  AI_ENABLED: z
    .string()
    .optional()
    .transform((v) => v !== "false"),
  // ---- Video interview defaults ----
  INTERVIEW_QUESTION_TIME_SECONDS: z.coerce.number().default(300),
  INTERVIEW_MAX_UPLOAD_MB: z.coerce.number().default(12),
  INTERVIEW_SESSION_TTL_HOURS: z.coerce.number().default(72),
  FRONTEND_URL: z.string().optional(),
  // ---- Email delivery (Google / Gmail SMTP) ----
  SMTP_HOST: z.string().default("smtp.gmail.com"),
  SMTP_PORT: z.coerce.number().default(465),
  /** Implicit TLS — true for port 465, false for 587 (STARTTLS). */
  SMTP_SECURE: z
    .string()
    .optional()
    .transform((v) => (v === undefined ? true : v !== "false")),
  SMTP_USERNAME: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  MAIL_FROM: z.string().optional(),
  /** Set to "false" to disable outbound email entirely (registration auto-verifies). */
  MAIL_ENABLED: z.string().optional(),
  EMAIL_VERIFICATION_EXPIRES_IN_HOURS: z.coerce.number().default(24),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
  throw new Error(`Invalid environment variables:\n${issues.join("\n")}`);
}

const env = parsed.data;

export default {
  node_env: env.NODE_ENV,
  port: env.PORT,
  database_url: env.DATABASE_URL,
  bcrypt_salt_rounds: env.BCRYPT_SALT_ROUNDS,
  jwt: {
    access_secret: env.JWT_ACCESS_SECRET,
    refresh_secret: env.JWT_REFRESH_SECRET,
    access_expires_in: env.JWT_ACCESS_EXPIRES_IN,
    refresh_expires_in: env.JWT_REFRESH_EXPIRES_IN,
  },
  redis: {
    url: env.REDIS_URL,
    enabled: env.REDIS_ENABLED,
  },
  cors_origin: env.CORS_ORIGIN,
  app_url: env.APP_URL,
  api_url: env.API_URL,
  sslcommerz: {
    store_id: env.SSLCOMMERZ_STORE_ID || process.env.STORE_ID || "",
    store_password: env.SSLCOMMERZ_STORE_PASSWORD || process.env.STORE_PASS || "",
    is_live: env.SSLCOMMERZ_IS_LIVE,
    payment_api:
      env.SSLCOMMERZ_PAYMENT_API ||
      process.env.SSL_PAYMENT_API ||
      "https://sandbox.sslcommerz.com/gwprocess/v4/api.php",
    validation_api:
      env.SSLCOMMERZ_VALIDATION_API ||
      process.env.SSL_VALIDATION_API ||
      "https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php?wsdl",
    success_url: env.SSLCOMMERZ_SUCCESS_URL || process.env.SUCCESS_URL || "",
    fail_url: env.SSLCOMMERZ_FAIL_URL || process.env.FAIL_URL || "",
    cancel_url: env.SSLCOMMERZ_CANCEL_URL || process.env.CANCEL_URL || "",
  },
  admin: {
    email: env.ADMIN_EMAIL || process.env.ADMIN_EMAIL,
    password: env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD,
  },
  code_runner_url: env.CODE_RUNNER_URL || process.env.CODE_RUNNER_URL || null,
  allow_local_sandbox:
    env.ALLOW_LOCAL_SANDBOX || process.env.ALLOW_LOCAL_SANDBOX === "true",
  ai: {
    /** The LLM provider is used only when a key is present and AI_ENABLED !== "false". */
    enabled: Boolean(env.AI_API_KEY) && env.AI_ENABLED,
    api_key: env.AI_API_KEY ?? null,
    base_url: env.AI_BASE_URL.replace(/\/+$/, ""),
    model: env.AI_MODEL,
    timeout_ms: env.AI_TIMEOUT_MS,
  },
  interview: {
    default_question_time_seconds: env.INTERVIEW_QUESTION_TIME_SECONDS,
    max_upload_mb: env.INTERVIEW_MAX_UPLOAD_MB,
    session_ttl_hours: env.INTERVIEW_SESSION_TTL_HOURS,
    /** Public base URL used to build candidate interview links. */
    link_base_url:
      env.FRONTEND_URL ||
      process.env.FRONT_END_BASE_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000",
  },
  /** Public base URL used to build candidate links (email confirmations, invitations). */
  frontend_url:
    env.FRONTEND_URL ||
    process.env.FRONT_END_BASE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000",
  mail: {
    /** Enabled only when credentials exist, unless explicitly disabled. */
    enabled:
      env.MAIL_ENABLED !== "false" && Boolean(env.SMTP_USERNAME && env.SMTP_PASSWORD),
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    username: env.SMTP_USERNAME ?? null,
    password: env.SMTP_PASSWORD ?? null,
    from:
      env.MAIL_FROM ||
      (env.SMTP_USERNAME ? `SkillGauge <${env.SMTP_USERNAME}>` : "SkillGauge <no-reply@skillgauge.local>"),
    verification_expires_hours: env.EMAIL_VERIFICATION_EXPIRES_IN_HOURS,
  },
  isProduction: env.NODE_ENV === "production",
};
