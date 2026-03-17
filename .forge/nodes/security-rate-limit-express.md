# NODE: security-rate-limit-express
## Rate limiting for Express apps

---

## SOLUTION
express-rate-limit

## STACK VARIANT
Express + TypeScript

## DEPENDENCIES
- fix-ts-errors [LOCKED]

## INPUTS REQUIRED
None — configuration hardcoded per security standard

## INSTRUCTIONS

### Step 1 — Install
```bash
npm install express-rate-limit
```

### Step 2 — Create middleware file
Create server/middleware/rate-limit.ts:
```typescript
import rateLimit from 'express-rate-limit';

export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: { error: 'Too many attempts. Try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const apiRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  message: { error: 'Too many requests.' },
  standardHeaders: true,
  legacyHeaders: false,
});
```

### Step 3 — Apply to routes
```typescript
import { authRateLimit, apiRateLimit } from './middleware/rate-limit';

// Auth endpoints
app.post('/api/auth/login', authRateLimit, loginHandler);
app.post('/api/auth/register', authRateLimit, registerHandler);

// All API routes
app.use('/api/', apiRateLimit);
```

### Step 4 — Restrict CORS
```typescript
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.ALLOWED_ORIGIN
    : 'http://localhost:5173',
  credentials: true,
}));
```

Add to .env: `ALLOWED_ORIGIN=https://yourdomain.com`

## VALIDATION
```
1. POST /api/auth/login 6 times rapidly
   → First 5: normal response
   → 6th: 429 Too Many Requests
2. npm run build still passes
```

## LOCKED_BY
- deploy node

## OUTPUT
- Rate limiting on auth endpoints
- Global API rate limiting
- CORS restricted to production domain

## FAILURE MODES

**Failure Mode 1: Blocks legitimate dev testing**
Add `skip: () => process.env.NODE_ENV === 'development'` during dev.
Remove skip before deployment.

**Failure Mode 2: Vercel resets rate limit on each function invocation**
Vercel serverless functions are stateless — rate limit resets per instance.
For Vercel, use Upstash Redis + @upstash/ratelimit instead.
