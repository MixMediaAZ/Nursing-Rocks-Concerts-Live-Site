import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "path";
import { log } from "./logger";

export function createApp() {
  const app = express();

  // Basic production hardening (safe defaults)
  app.use(
    helmet({
      // Avoid breaking existing inline scripts/styles; can be tightened later.
      contentSecurityPolicy: false,
    }),
  );

  const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  app.use(
    cors((req, callback) => {
      const origin = req.header("Origin");
      const host = req.header("Host");

      const isSameOrigin =
        !!origin &&
        !!host &&
        (origin === `http://${host}` || origin === `https://${host}`);

      const allowByList = !!origin && allowedOrigins.includes(origin);

      // If ALLOWED_ORIGINS is configured, allow same-origin + allowlist.
      // If not configured, allow by default (safe for single-origin deployments).
      const allowOrigin =
        !origin || isSameOrigin || allowByList || allowedOrigins.length === 0;

      callback(null, {
        origin: allowOrigin,
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
      });
    }),
  );

  // Rate limiting (API only)
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many requests. Please try again later." },
  });

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many login attempts. Please try again later." },
  });

  app.use("/api", apiLimiter);
  app.use("/api/auth/login", authLimiter);
  app.use("/api/auth/register", authLimiter);
  app.use("/api/auth/register-employer", authLimiter);

  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  // Serve uploads directory for media files (note: Vercel filesystem is ephemeral)
  app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

  // API logging (trimmed)
  app.use((req, res, next) => {
    const start = Date.now();
    const requestPath = req.path;
    let capturedJsonResponse: Record<string, any> | undefined = undefined;

    const originalResJson = res.json;
    res.json = function (bodyJson, ...args) {
      capturedJsonResponse = bodyJson;
      return originalResJson.apply(res, [bodyJson, ...args]);
    };

    res.on("finish", () => {
      const duration = Date.now() - start;
      if (requestPath.startsWith("/api")) {
        let logLine = `${req.method} ${requestPath} ${res.statusCode} in ${duration}ms`;
        if (capturedJsonResponse) {
          logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
        }

        if (logLine.length > 80) {
          logLine = logLine.slice(0, 79) + "…";
        }

        log(logLine);
      }
    });

    next();
  });

  return app;
}
