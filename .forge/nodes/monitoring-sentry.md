# NODE: monitoring-sentry
## Error tracking via Sentry

---

## SOLUTION
Sentry — sentry.io (free tier available)

## STACK VARIANT
Any — Next.js or Express + React

## DEPENDENCIES
- deploy node [LOCKED]

## INPUTS REQUIRED
- SENTRY_DSN (from sentry.io project settings)
- NEXT_PUBLIC_SENTRY_DSN or VITE_SENTRY_DSN for frontend

## INSTRUCTIONS

### Step 1 — Install
```bash
# Next.js:
npm install @sentry/nextjs

# Express + React:
npm install @sentry/node @sentry/react
```

### Step 2 — Environment variable
```
SENTRY_DSN=https://xxxx@xxxx.ingest.sentry.io/xxxx
VITE_SENTRY_DSN=https://xxxx@xxxx.ingest.sentry.io/xxxx
```

### Step 3 — Server setup (Express)
At the very top of server/index.ts:
```typescript
import * as Sentry from '@sentry/node';
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});
```

Add error handler AFTER all routes:
```typescript
Sentry.setupExpressErrorHandler(app);
```

### Step 4 — Client setup (React)
In main.tsx:
```typescript
import * as Sentry from '@sentry/react';
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  tracesSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});
```

## VALIDATION
```
1. Throw a test error in a route
2. Check Sentry dashboard — error appears within 30 seconds
3. Error includes stack trace and environment
4. Remove test error after validation
```

## LOCKED_BY
Nothing — terminal node

## OUTPUT
- Server errors reported to Sentry
- Client errors reported to Sentry
- Environment tagged correctly

## FAILURE MODES

**Failure Mode 1: Events not appearing**
Check DSN is correct. Verify SENTRY_DSN in production env vars.

**Failure Mode 2: Too many events on free tier**
Set tracesSampleRate to 0.01 (1% of transactions).
Free tier: 5000 errors/month.
