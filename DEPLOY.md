# Deploying Updates (Git Desktop / Git)

When you update the site using Git Desktop (pull, merge, or push) and redeploy:

## Environment variables (.env)

Copy `.env.example` to `.env` and set values. **Do not commit `.env`.**

| Variable | When it's needed |
|----------|------------------|
| `DATABASE_URL` | Always (app and DB scripts). |
| `JWT_SECRET` | **Required in production.** In dev, a default is used if missing. In production the server will not start without a secure value. |
| `SESSION_SECRET` | Recommended in production; dev has a fallback. |
| `ADMIN_PIN` | **Required in production** if you use the admin PIN login (`/api/admin/token`). In dev, default `1234567` is used if missing. |
| `ADMIN_PASSWORD_1`, `ADMIN_PASSWORD_2` | **Only when running `npm run db:create-admins`.** The script reads these from the environment (no passwords in code). Set them in `.env` or run: `ADMIN_PASSWORD_1=xxx ADMIN_PASSWORD_2=yyy npm run db:create-admins`. |

**What “missing .env entries” means:**

- **Production:** Set `JWT_SECRET` and `ADMIN_PIN` in your production environment (e.g. Vercel env vars). If they’re not set, production will fail to start (JWT) or admin PIN login will return 503.
- **Creating/updating admins:** When you run `npm run db:create-admins`, set `ADMIN_PASSWORD_1` and `ADMIN_PASSWORD_2` (in `.env` or on the command line). The script exits with an error if either is missing.

## Safe upgrade (recommended steps)

Use this flow to update the site without touching user data:

1. **Pull or merge** your latest changes (e.g. in Git Desktop).
2. **Install dependencies:**  
   `npm install`
3. **Build:**  
   `npm run build`
4. **Deploy** (e.g. push to trigger Vercel, or run your host’s deploy).

Do **not** run seed scripts or `db:push` unless you have a specific reason (e.g. new schema to apply). User accounts, login, dashboard, and tickets are not modified by these steps.

You can also use the safe-upgrade script (see [Scripts](#scripts) below).

---

## User data is not touched

- **User accounts, login, dashboard, tickets, licenses, and all user-related data** live in the **database** (PostgreSQL/Neon), not in the codebase.
- The **build process** (`npm run build`) only compiles the app (frontend + server). It does **not** run any seed scripts, migrations, or database resets.
- Your **DATABASE_URL** (in `.env`, not committed) points to the same database before and after an update. So when you deploy a new build, the same database is used and **all user info persists**.

## What happens when you update

1. You pull/merge changes in Git Desktop (or push to trigger a deploy).
2. The host (e.g. Vercel) runs `npm install` and `npm run build`.
3. New app code and static assets are deployed. The database is **not** modified by the build.
4. Existing users can still log in; dashboard, tickets, and profile data remain as they were.

## Do not run these against production

These scripts **clear or overwrite content data** (events, artists, gallery, store products). They do **not** delete user accounts, but they can wipe site content. **Never run them against your production database** unless you intend to reset that content:

- `node server/seed.js` or `npx tsx server/seed.ts`
- `npx tsx server/seed-nursing-rocks.ts`

They are **not** part of the build or deploy; they only run if you execute them manually.

## Schema updates (optional)

- `npm run db:push` applies Drizzle schema changes to the database. Use it only when you have intentional schema changes (e.g. new columns/tables). It does not wipe user data when used with normal additive schema changes.
- Run `db:push` only when needed and against the correct database (your production `DATABASE_URL`).

## Summary

| Action | User data (login, dashboard, etc.) |
|--------|-----------------------------------|
| Git pull / merge / push | **Unchanged** – not in repo |
| `npm run build` / deploy | **Unchanged** – build does not touch DB |
| `npm run db:push` (additive schema) | **Unchanged** – only schema, not user rows |
| Running seed scripts manually | **Not touched** (seeds don’t delete users) but **don’t run seeds in production** – they clear content |

Your existing user info, login state, and dashboard data **persist across updates** as long as you use the same database and do not run destructive scripts against it.

## Scripts

- **`npm run safe-upgrade`** – Runs `npm install` and `npm run build` only. Use this when updating the codebase; it does not run seeds or database resets and will not touch user data.
