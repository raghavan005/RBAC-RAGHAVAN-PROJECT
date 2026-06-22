import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import swaggerUi from "swagger-ui-express";

import { swaggerSpec } from "./config/swagger";
import { errorHandler } from "./middleware/errorHandler";

import authRoutes from "./routes/auth";
import memberRoutes from "./routes/members";
import auditLogRoutes from "./routes/auditLogs";

const app = express();

// ── Security ──────────────────────────────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? "http://localhost:3000")
  .split(",")
  .map((o) => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin ${origin} not allowed`));
      }
    },
    credentials: true,
  })
);

// ── Rate limiting ──────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== "test") {
  app.use(
    "/api/auth",
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 30,
      message: { error: "Too many requests, please try again later." },
      standardHeaders: true,
      legacyHeaders: false,
    })
  );
}

// ── Body parsing ───────────────────────────────────────────────────────────────
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ── Logging ───────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

// ── Swagger docs ───────────────────────────────────────────────────────────────
app.use(
  "/api/docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, { customSiteTitle: "RBAC API Docs" })
);

// ── Routes ─────────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/members", memberRoutes);
app.use("/api/audit-logs", auditLogRoutes);

// ── 404 handler ────────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// ── Global error handler ───────────────────────────────────────────────────────
app.use(errorHandler);

export { app };
