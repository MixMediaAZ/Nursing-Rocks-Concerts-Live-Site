# Nursing Rocks Concerts Live Site

## Quick Start

### Local Development
```bash
# 1. Install dependencies
npm install

# 2. Set up env vars
cp env.example .env
# Edit .env with your actual values

# 3. Run migrations (safe to re-run)
node run-migrations.js

# 4. Start dev server
npm run dev
```

Visit http://localhost:5000

### Deploy to Vercel (Full-stack)
- Build Command: `npm run build`
- Output Directory: `dist/public`
- Install Command: `npm install`
- API: deployed as a Vercel Serverless Function at `/api/*`

See `DEPLOYMENT.md` for the exact step-by-step procedure and required environment variables.

## Keeping the repo clean (important)

### Secrets / API keys
- **Never** put API keys in source code or commit them to git.
- Put secrets in a local `.env` file (ignored by git) or in your hosting provider’s environment variables.

This project expects these variables (server-side):
- `CUSTOMCAT_API_KEY`
- `DATABASE_URL`
- `JWT_SECRET`
- `SESSION_SECRET`
- `STRIPE_SECRET_KEY`
- `VIDEO_B2_BUCKET`
- `VIDEO_B2_S3_ENDPOINT`
- `VIDEO_B2_REGION`
- `VIDEO_B2_ACCESS_KEY_ID`
- `VIDEO_B2_SECRET_ACCESS_KEY`
- `VIDEO_CDN_BASE_URL`
- `VITE_VIDEO_CDN_BASE_URL` (client-side)
- `VERIFICATION_API_KEY` (only if you use nurse verification)

An example file is provided as `env.example` (copy it to `.env` and fill in values).

### Files intentionally NOT kept in git
These are local/cached data files and should not be committed:
- `products.json`
- `response.json`

These are reference-only notes and are ignored:
- `attached_assets/Pasted-*.txt`
- `attached_assets/*.zip`

Note: `attached_assets/` **is used by the app** (assets are imported via the `@assets` alias), so do not delete that folder—only the ignored note files are considered optional.


