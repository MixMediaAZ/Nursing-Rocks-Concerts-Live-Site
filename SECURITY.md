# Security Review

This document summarizes identified security issues and recommended mitigations.

**Recently addressed (without changing behavior for correct setups):** Admin script now reads passwords from `ADMIN_PASSWORD_1` / `ADMIN_PASSWORD_2`. JWT requires `JWT_SECRET` in production. Admin token requires `ADMIN_PIN` in production and no longer logs PIN data. CustomCat no longer logs API key. Settings treat `CUSTOMCAT_API_KEY` as always sensitive. See Summary table for status.

---

## Fixed

### 1. IDOR in store orders (fixed)
- **Route:** `GET /api/store/orders/user/:userId` (uses `requireAuth`).
- **Issue:** For JWT-authenticated users, `req.user` is set by session-auth with `.id` only, while the route checked `req.user.userId`. That check was effectively `userId !== undefined`, so any logged-in user could request another user’s orders by changing the URL parameter.
- **Fix:** Resolve current user as `(req as any).user?.userId ?? (req as any).user?.id`, require it to be non-null, and enforce `userId === currentUserId || user is admin` before returning orders.

---

## High priority (recommended fixes)

### 2. Plaintext passwords in repo
- **Location:** `scripts/create-admin-users.js`
- **Issue:** Admin passwords are hardcoded (`HomeRunBall1!`, `HeadPop123!`). Anyone with repo access can see them; if the script was run, those accounts use known passwords.
- **Recommendation:** Remove passwords from the script. Use environment variables (e.g. `ADMIN_USER_1_PASSWORD`) or a one-time setup that reads from a secret store or prompt. Add `scripts/create-admin-users.js` to `.gitignore` if it will contain secrets, or use a template and document that passwords must be supplied at run time.

### 3. JWT secret fallback in production
- **Location:** `server/jwt.ts` — `const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret_key_nursing_rocks'`
- **Issue:** If `JWT_SECRET` is not set (e.g. misconfiguration), the app uses a fixed dev secret. In production an attacker could forge valid JWTs.
- **Recommendation:** In production (`NODE_ENV === 'production'`), refuse to start if `JWT_SECRET` is missing or equals the dev fallback. Use a long, random secret and rotate it if compromised.

### 4. Admin PIN default and logging
- **Location:** `server/routes.ts` — `POST /api/admin/token`
- **Issue:**  
  - Default PIN is `"1234567"` when `ADMIN_PIN` is not set.  
  - Debug logging logs partial PIN and “pinMatch”, which can leak information in logs.
- **Recommendation:**  
  - Do not default `ADMIN_PIN` in production; require it to be set.  
  - Remove or severely restrict PIN-related logging (no PIN characters, no match result).  
  - Consider rate limiting this endpoint to reduce brute-force risk.

---

## Medium priority

### 5. CustomCat API key in logs
- **Location:** `server/customcat-api.ts` — logs API key length and first/last 4 characters.
- **Issue:** Partial API key in logs can aid an attacker and may violate key handling policies.
- **Recommendation:** Remove or mask all API key content in logs (e.g. log only “CustomCat API key present” or “length: N” without any characters).

### 6. Sensitive settings access
- **Location:** `GET /api/settings/:key`
- **Issue:** Sensitive settings are protected only when `setting.is_sensitive === true`. If `CUSTOMCAT_API_KEY` (or similar) was ever created with `is_sensitive: false`, it could be returned to unauthenticated or non-admin callers.
- **Recommendation:** Ensure all API keys and secrets are stored with `is_sensitive: true`. Consider defaulting to treating unknown keys as sensitive, or maintaining an explicit allowlist of non-sensitive keys.

### 7. No rate limiting on auth endpoints
- **Locations:** `POST /api/auth/login`, `POST /api/admin/token`
- **Issue:** No rate limiting allows brute-force attempts on passwords and admin PIN.
- **Recommendation:** Add rate limiting (e.g. per IP and/or per identifier) and optionally account lockout or backoff after repeated failures.

---

## Lower priority / hardening

### 8. Admin status in localStorage
- **Location:** Client stores `isAdmin` (and similar) in `localStorage` and uses it for UI (e.g. showing admin links).
- **Note:** Authorization is enforced server-side via JWT and `requireAdminToken`/`isUserAdmin(req)`. Spoofing `localStorage` only affects what the UI shows, not what the API allows.
- **Recommendation:** Optional: avoid storing admin flag in localStorage; derive “is admin” from a dedicated auth-status or me endpoint that returns minimal claims, so the client never trusts a standalone admin flag.

### 9. CORS and CSP
- **Recommendation:** Confirm CORS is restricted to intended origins in production. Add Content-Security-Policy headers to reduce XSS impact if a vulnerability is introduced later.

### 10. Dependency and supply chain
- **Recommendation:** Run `npm audit` (or equivalent) regularly, keep dependencies updated, and consider pinning versions and reviewing lockfile changes.

---

## Summary

| Item                         | Severity  | Status    |
|-----------------------------|-----------|-----------|
| IDOR store orders by userId | High      | Fixed     |
| Passwords in create-admin script | High | Addressed |
| JWT_SECRET fallback         | High      | Addressed |
| Admin PIN default & logging | High      | Addressed |
| CustomCat key in logs       | Medium    | Addressed |
| Sensitive settings          | Medium    | Addressed |
| Rate limiting (auth)        | Medium    | Open      |
| localStorage admin flag     | Low       | Optional  |
| CORS / CSP                  | Low       | Optional  |
