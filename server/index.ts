import "dotenv/config";
import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { ingestionScheduler } from "./ingestion/scheduler";
import path from "path";

// Initialize Sentry
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || "development",
    integrations: [
      nodeProfilingIntegration(),
    ],
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    profilesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  });
}

const app = express();

// Sentry v10 handles request/tracing automatically

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Serve uploads directory for media files
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Serve public assets directory (for city backgrounds, etc.)
app.use('/assets', express.static(path.join(process.cwd(), 'public', 'assets')));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
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

(async () => {
  const server = await registerRoutes(app);

  // Initialize jobs ingestion scheduler (only in production if explicitly enabled)
  if (process.env.NODE_ENV === 'production' && process.env.JOBS_INGESTION_ENABLED === 'true') {
    try {
      await ingestionScheduler.startIngestionScheduler();
    } catch (error) {
      console.warn("[ingestion] Scheduler initialization warning:", error instanceof Error ? error.message : error);
      // Scheduler failure is not fatal - jobs can still be triggered manually via API
    }
  } else if (process.env.JOBS_INGESTION_ENABLED === 'true' && process.env.NODE_ENV !== 'production') {
    log("[ingestion] Scheduler disabled in development (set NODE_ENV=production to enable)");
  }

  // Helps diagnose bind errors like EADDRINUSE and whether we accidentally call listen twice.
  server.on("error", (err: any) => {
    console.error("[server] listen error:", err);
  });

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // Sentry error handler is not needed in v10

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  const appEnv = app.get("env");
  if (appEnv === "development") {
    log("Starting Vite dev server...");
    await setupVite(app, server);
    log("Vite dev server started");
  } else {
    log("Serving static files from dist/public...");
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
  });
})();
