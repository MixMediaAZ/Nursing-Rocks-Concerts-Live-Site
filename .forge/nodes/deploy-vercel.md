# NODE: deploy-vercel
## Production deployment to Vercel

---

## SOLUTION
Vercel CLI + vercel.json configuration

## STACK VARIANT
Any — Next.js, React+Vite, Express

## DEPENDENCIES
- fix-ts-errors [LOCKED]
- security-rate-limit [LOCKED]
- All critical feature nodes [LOCKED]

## INPUTS REQUIRED
- Vercel account + project created
- All environment variables documented
- npm run build passes locally

## INSTRUCTIONS

### Step 1 — Verify build passes locally
```bash
npm run build
```
Must complete with zero errors before proceeding.

### Step 2 — Create vercel.json (Express apps)
```json
{
  "version": 2,
  "builds": [
    { "src": "server/index.ts", "use": "@vercel/node" },
    { "src": "client/dist/**", "use": "@vercel/static" }
  ],
  "routes": [
    { "src": "/api/(.*)", "dest": "server/index.ts" },
    { "src": "/(.*)", "dest": "client/dist/$1" }
  ]
}
```

### Step 3 — Add all environment variables to Vercel
For each variable in .env:
- Go to Vercel dashboard → project → Settings → Environment Variables
- Add each variable for Production environment
- Never commit .env to git

Critical variables to verify:
```
DATABASE_URL
JWT_SECRET (or equivalent auth secret)
STRIPE_SECRET_KEY (if payments)
RESEND_API_KEY (if email)
STRIPE_WEBHOOK_SECRET (if payments)
ALLOWED_ORIGIN (your production domain)
NODE_ENV=production
```

### Step 4 — Deploy
```bash
npx vercel --prod
```

### Step 5 — Verify production
- Visit production URL
- Test auth flow (register + login)
- Test critical user journey end-to-end
- Check Vercel function logs for errors

## VALIDATION
```
1. npm run build → passes locally
2. npx vercel --prod → deploys without error
3. Production URL loads
4. Auth endpoints respond correctly
5. No errors in Vercel function logs
```

## LOCKED_BY
Nothing — terminal node

## OUTPUT
- Live production deployment
- All environment variables set
- Production URL confirmed working

## FAILURE MODES

**Failure Mode 1: Build passes locally but fails on Vercel**
Check Node.js version. Vercel default may differ from local.
Add to package.json: `"engines": { "node": ">=20.x" }`

**Failure Mode 2: Environment variables not found**
Vercel env vars are case-sensitive. Match exactly.
Redeploy after adding new env vars.

**Failure Mode 3: API routes returning 404**
Check vercel.json routes configuration.
Verify server entry point path is correct.

**Failure Mode 4: Serverless function timeout**
Default timeout is 10 seconds.
Long operations (video processing, bulk email) need background jobs.
