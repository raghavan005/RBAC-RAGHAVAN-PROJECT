import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import swaggerUi from "swagger-ui-express";
import csrf from "csurf";

import { swaggerSpec } from "./config/swagger";
import { errorHandler } from "./middleware/errorHandler";

import authRoutes from "./routes/auth";
import memberRoutes from "./routes/members";
import auditLogRoutes from "./routes/auditLogs";

const app = express();

// ── Security Headers ──────────────────────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "same-site" }, // More restrictive
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"], // For Swagger UI
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true
    }
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

// ── Body parsing (before CSRF) ────────────────────────────────────────────────
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ── CSRF Protection ──────────────────────────────────────────────────────────
const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict"
  }
});

// Apply CSRF to all routes except GET and OPTIONS
app.use((req, res, next) => {
  if (req.method === 'GET' || req.method === 'OPTIONS' || req.path.startsWith('/api/docs')) {
    return next();
  }
  csrfProtection(req, res, next);
});

// CSRF token endpoint
app.get('/api/csrf-token', csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// ── Rate limiting ──────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== "test") {
  // Auth endpoints - more restrictive
  app.use(
    "/api/auth",
    rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 20, // Reduced from 30
      message: { error: "Too many authentication attempts, please try again later." },
      standardHeaders: true,
      legacyHeaders: false,
    })
  );

  // Member endpoints - moderate
  app.use(
    "/api/members",
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100,
      message: { error: "Too many requests, please try again later." },
      standardHeaders: true,
      legacyHeaders: false,
    })
  );

  // Audit logs - read-only, more generous
  app.use(
    "/api/audit-logs",
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 200,
      message: { error: "Too many requests, please try again later." },
      standardHeaders: true,
      legacyHeaders: false,
    })
  );
}

// ── Logging ───────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== "test") {
  app.use(morgan("combined")); // More detailed logging for security
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
