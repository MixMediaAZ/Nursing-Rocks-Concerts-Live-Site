import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import path from "path";

const app = express();
// #region agent log
fetch('http://127.0.0.1:7253/ingest/a70d3c4c-5483-4936-8dc1-1a2a5745df39',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'server/index.ts:startup',message:'Process startup',data:{pid:process.pid,cwd:process.cwd(),nodeEnv:process.env.NODE_ENV,appEnv:app.get('env')},timestamp:Date.now(),sessionId:'debug-session',runId:'local-port-5000',hypothesisId:'A,B'})}).catch(()=>{});
// #endregion
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve uploads directory for media files
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

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
  // #region agent log
  fetch('http://127.0.0.1:7253/ingest/a70d3c4c-5483-4936-8dc1-1a2a5745df39',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'server/index.ts:main',message:'Boot sequence entered',data:{pid:process.pid,appEnv:app.get('env'),nodeEnv:process.env.NODE_ENV},timestamp:Date.now(),sessionId:'debug-session',runId:'local-port-5000',hypothesisId:'B,C'})}).catch(()=>{});
  // #endregion
  const server = await registerRoutes(app);

  // Helps diagnose bind errors like EADDRINUSE and whether we accidentally call listen twice.
  server.on("error", (err: any) => {
    // #region agent log
    fetch('http://127.0.0.1:7253/ingest/a70d3c4c-5483-4936-8dc1-1a2a5745df39',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'server/index.ts:server.on(error)',message:'Server listen error event',data:{pid:process.pid,code:err?.code,message:err?.message,address:err?.address,port:err?.port,syscall:err?.syscall,isListening:(server as any)?.listening},timestamp:Date.now(),sessionId:'debug-session',runId:'local-port-5000',hypothesisId:'A,B,C,D'})}).catch(()=>{});
    // #endregion
    console.error("[server] listen error:", err);
  });

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  const appEnv = app.get("env");
  const nodeEnv = process.env.NODE_ENV;
  // #region agent log
  // (debug log removed)
  // #endregion
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
  // #region agent log
  fetch('http://127.0.0.1:7253/ingest/a70d3c4c-5483-4936-8dc1-1a2a5745df39',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'server/index.ts:listen',message:'About to call server.listen',data:{pid:process.pid,port,host:'0.0.0.0',isListening:(server as any)?.listening},timestamp:Date.now(),sessionId:'debug-session',runId:'local-port-5000',hypothesisId:'A,B,C'})}).catch(()=>{});
  // #endregion
  server.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
    // #region agent log
    fetch('http://127.0.0.1:7253/ingest/a70d3c4c-5483-4936-8dc1-1a2a5745df39',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'server/index.ts:listen',message:'server.listen callback (listening)',data:{pid:process.pid,port,host:'0.0.0.0',isListening:(server as any)?.listening},timestamp:Date.now(),sessionId:'debug-session',runId:'local-port-5000',hypothesisId:'A,C'})}).catch(()=>{});
    // #endregion
  });
})();
