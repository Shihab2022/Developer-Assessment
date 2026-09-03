import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import config from "./config";
import { rootRouter } from "./routes";
import { notFound, testingRoute } from "./middlewares/notFound";
import { globalErrorHandler } from "./middlewares/globalErrorHandler";
import { generalRateLimiter } from "./middlewares/rateLimiter";

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

// ---------- Rate limiting ----------
app.use("/api/v1", generalRateLimiter);

// ---------- Routes ----------
app.get("/", testingRoute);

app.get("/health", (_req, res) => {
  res.json({
    success: true,
    message: "API is healthy",
    data: { status: "ok" },
  });
});

app.use("/api/v1", rootRouter);

// ---------- 404 ----------
app.use(notFound);

// ---------- Global error handler ----------
app.use(globalErrorHandler);

export default app;