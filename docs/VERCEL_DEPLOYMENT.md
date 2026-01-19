# Vercel Deployment Criteria (Express + Vite + Neon + B2)

This project is **not** Next.js/NextAuth. It is an Express API + Vite SPA with
JWT auth, Neon Postgres, and Backblaze B2 for video storage. The items below are
the **only** requirements needed for this stack in Vercel.

## Required Environment Variables

Set these in **Vercel → Project → Settings → Environment Variables**
for **Production**, **Preview**, and **Development**.

- `DATABASE_URL` (Neon Postgres connection string)
- `JWT_SECRET` (32+ chars; used for JWT auth)
- `SESSION_SECRET` (32+ chars; session fallback)
- `VIDEO_B2_ACCESS_KEY_ID`
- `VIDEO_B2_SECRET_ACCESS_KEY`
- `VIDEO_B2_BUCKET`
- `VIDEO_B2_S3_ENDPOINT` (e.g. `https://s3.us-west-004.backblazeb2.com`)
- `VIDEO_B2_REGION` (e.g. `us-west-004`)
- `VIDEO_CDN_BASE_URL` (public CDN base URL for videos)

## Optional Environment Variables

Only set these if you use the corresponding features:

- `VIDEO_SOURCE_PREFIX`
- `VIDEO_HLS_PREFIX`
- `VIDEO_POSTER_PREFIX`
- `STRIPE_SECRET_KEY`
- `ALLOWED_ORIGINS` (comma-separated origins)

## Vercel Settings

- Build command: `npm run build`
- Output directory: `dist/public`
- Serverless handler: `api/index.ts`
- SPA rewrites: non-API routes should serve `/index.html`

## Authentication Behavior

- Login uses JWT (`/api/auth/login`).
- `Authorization: Bearer <token>` is used for protected API routes.
- Session auth is **fallback only**; JWT is the primary mechanism.

## Video Storage (Backblaze B2)

- CORS must allow the deployed domain:
  - `Access-Control-Allow-Origin: https://yourdomain.com`
  - `Access-Control-Allow-Methods: GET, HEAD`
  - `Access-Control-Allow-Headers: Range`
- Video URLs must be HTTPS and use `VIDEO_CDN_BASE_URL`.

## Quick Validation Checklist

- `GET /api/health` returns 200 (if implemented)
- `GET /api/auth/status` returns 200 (should not 500)
- `POST /api/auth/login` returns 200 with `{ token, user }`
- `GET /api/videos/status` returns 200 and includes `cdnBaseUrl`

## Common Causes of 500s

- Missing `DATABASE_URL`
- Missing `VIDEO_CDN_BASE_URL`
- Missing B2 credentials
- Serverless handler not built as CJS (`.vercel-build/vercel-handler.cjs`)
