import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import crypto from "crypto";
import config from "./config";
import { rootRouter } from "./routes";
import { notFound, testingRoute } from "./middlewares/notFound";
import { globalErrorHandler } from "./middlewares/globalErrorHandler";
import { generalRateLimiter } from "./middlewares/rateLimiter";
import { prisma } from "./lib/prisma";
import { getRedis, redisEnabled } from "./lib/redis";

const app = express();

// ---------- Security ----------
app.use(helmet());
app.use(
  cors({
    origin: config.cors_origin ? config.cors_origin.split(",") : true,
    credentials: true,
  }),
);
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));
app.use(cookieParser());
app.set("trust proxy", 1);

// ---------- Request correlation ----------
app.use(((req, res, next) => {
  const requestId = (req.headers["x-request-id"] as string) || crypto.randomUUID();
  req.headers["x-request-id"] = requestId;
  res.setHeader("X-Request-Id", requestId);
  (req as express.Request & { requestId?: string }).requestId = requestId;
  next();
}) as express.RequestHandler);

// ---------- Request logging (structured, no secrets) ----------
app.use(((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const durationMs = Date.now() - start;
    const user = (req as express.Request & { user?: { id?: string } }).user;
    console.info(
      JSON.stringify({
        requestId: req.headers["x-request-id"],
        method: req.method,
        path: req.originalUrl,
        statusCode: res.statusCode,
        durationMs,
        userId: user?.id ?? null,
      }),
    );
  });
  next();
}) as express.RequestHandler);

// ---------- Rate limiting ----------
app.use("/api/v1", generalRateLimiter);

// ---------- Routes ----------
app.get("/", testingRoute);

app.get("/health", async (_req, res) => {
  let database = "disconnected";
  try {
    await prisma.$queryRaw`SELECT 1`;
    database = "connected";
  } catch {
    database = "disconnected";
  }

  let redis = "disabled";
  if (redisEnabled()) {
    const client = getRedis();
    if (client && client.status === "ready") {
      redis = "connected";
    } else {
      redis = "disconnected";
    }
  }

  const healthy = database === "connected";
  res.status(healthy ? 200 : 503).json({
    success: healthy,
    message: healthy ? "API is healthy" : "API is degraded",
    data: {
      status: healthy ? "ok" : "degraded",
      database,
      redis,
    },
  });
});

app.use("/api/v1", rootRouter);

// ---------- 404 ----------
app.use(notFound);

// ---------- Global error handler ----------
app.use(globalErrorHandler);

export default app;
