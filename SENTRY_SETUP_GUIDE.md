# Sentry Error Tracking Setup
**Date:** March 19, 2026
**Purpose:** Real-time error monitoring and alerting in production
**Effort:** 1-2 hours (including account setup)

---

## STEP 1: CREATE SENTRY ACCOUNT (Free Tier Available)

1. Go to https://sentry.io
2. Sign up for free account
3. Create new organization: "Nursing Rocks"
4. Create new project:
   - Platform: Express
   - Name: nursing-rocks-concerts
5. Copy your **DSN** (looks like: `https://xxxxx@oxxxxx.ingest.sentry.io/xxxxx`)

---

## STEP 2: INSTALL DEPENDENCIES

```bash
npm install @sentry/node @sentry/tracing
npm install --save-dev @sentry/cli
```

---

## STEP 3: CONFIGURE SERVER (server/index.ts)

Add this at the **TOP** of `server/index.ts` (before other imports):

```typescript
import "dotenv/config";
import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";

// Initialize Sentry
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || "development",
    integrations: [
      nodeProfilingIntegration(),
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.OnUncaughtException(),
      new Sentry.Integrations.OnUnhandledRejection(),
    ],
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    profilesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  });
}

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import path from "path";

const app = express();

// Add Sentry request handler (must be before other middleware)
if (process.env.SENTRY_DSN) {
  app.use(Sentry.Handlers.requestHandler());
  app.use(Sentry.Handlers.tracingHandler());
}

// ... rest of middleware ...

// Add Sentry error handler (must be AFTER other middleware but BEFORE app.listen)
if (process.env.SENTRY_DSN) {
  app.use(Sentry.Handlers.errorHandler());
}

// Error middleware (after Sentry handlers)
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  if (process.env.SENTRY_DSN) {
    Sentry.captureException(err);
  }

  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ message });
  throw err;
});
```

---

## STEP 4: CONFIGURE CLIENT (client/src/main.tsx)

Add this at the **TOP** of `client/src/main.tsx` (before other imports):

```typescript
import * as Sentry from "@sentry/react";
import { BrowserTracing } from "@sentry/tracing";

// Initialize Sentry on client
if (
  import.meta.env.VITE_SENTRY_DSN &&
  import.meta.env.MODE === "production"
) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    integrations: [
      new BrowserTracing(),
      new Sentry.Replay({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });
}

import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Wrap App with Sentry profiler
const SentryApp = Sentry.withProfiler(App);

createRoot(document.getElementById("root")!).render(<SentryApp />);
```

---

## STEP 5: UPDATE ENVIRONMENT VARIABLES

### On Vercel Dashboard:

1. Go to **Settings → Environment Variables**
2. Add:
   ```
   SENTRY_DSN=https://xxxxx@oxxxxx.ingest.sentry.io/xxxxx
   VITE_SENTRY_DSN=https://xxxxx@oxxxxx.ingest.sentry.io/xxxxx
   ```

### Locally (for testing):

Add to `.env`:
```
SENTRY_DSN=https://xxxxx@oxxxxx.ingest.sentry.io/xxxxx
VITE_SENTRY_DSN=https://xxxxx@oxxxxx.ingest.sentry.io/xxxxx
```

---

## STEP 6: REBUILD AND DEPLOY

```bash
# Test locally first
npm run dev

# Build
npm run build

# Push to Vercel (or deploy manually)
git add .
git commit -m "feat: add Sentry error tracking"
git push
```

---

## STEP 7: TEST SENTRY (Optional, for testing only)

Add this test button somewhere in your app (then remove):

```typescript
// Test error endpoint
app.get("/api/test-sentry", (req, res) => {
  throw new Error("Sentry test error - please ignore this");
});

// On client
<button onClick={() => Sentry.captureMessage("Test message from client")}>
  Test Sentry
</button>
```

---

## WHAT SENTRY MONITORS

Once set up, Sentry will track:

✅ **Server-side:**
- Unhandled exceptions
- API errors (500s, etc.)
- Database connection failures
- Rate limiting violations
- Authentication failures

✅ **Client-side:**
- JavaScript errors
- Unhandled promise rejections
- Console errors
- User session replays (on errors)
- Performance metrics

✅ **Alerts:**
- New errors appear
- Error rate increases
- Performance degrades
- Custom alerts (configurable)

---

## DEPLOYMENT CHECKLIST

- [ ] Sentry account created
- [ ] DSN copied
- [ ] `@sentry/node` and `@sentry/react` installed
- [ ] `server/index.ts` configured
- [ ] `client/src/main.tsx` configured
- [ ] Environment variables set on Vercel
- [ ] Code committed and pushed
- [ ] Deployment succeeds
- [ ] Visit Sentry dashboard to confirm events

---

## SENTRY DASHBOARD FEATURES

Once live, you can:

1. **View Errors**
   - All errors in real-time
   - Stack traces
   - Affected users
   - Browser/OS info

2. **Performance**
   - API response times
   - Frontend performance
   - Database query durations

3. **Alerts**
   - Alert on new issues
   - Alert on error spikes
   - Slack/email notifications

4. **Releases**
   - Track errors per deployment
   - Rollback detection
   - Regression alerts

---

## NEXT STEPS

1. **Immediate:** Create Sentry account and get DSN
2. **This session:** Add code to server/index.ts and client/src/main.tsx
3. **Redeploy:** Commit, push, and Vercel auto-deploys
4. **Monitor:** Check Sentry dashboard for errors

---

## COST

- Free tier: Perfect for production
  - 5K events/month
  - Basic alerts
  - 30-day data retention
  - No credit card required

- Paid tier: Starts at $29/month for more events

---

**Recommended: Set this up now while testing API issues (step 2 above showed some API returning 500s). Sentry will help identify the root cause.**

