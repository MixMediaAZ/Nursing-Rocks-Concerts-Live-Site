# Nursing Rocks Concerts Live Site 3.0 — TODO

## Status
Main NRCS production site. Has: security fix docs, `api/`, `client/`, `appfinisher/`, `attached_assets/`, `CLOUDFLARE_B2_SETUP.md`.
Multiple security patches applied: `ADMIN_LOGIN_SECURITY_FIXES.md`, `ALL_SECURITY_FIXES_APPLIED.md`.

## ⚠️ HARD DEADLINE: May 16, 2026 — The Walter 2026 (Phoenix, Walter Studios)

## Verification Checklist (Run in this order before May 16)
1. [ ] **Stripe webhook → DB write → sponsor confirmation email** — not confirmed working
2. [ ] **QR ticket claim → Resend delivery → unique QR generation** — not confirmed complete
3. [ ] **Door scanner PWA** — valid scan → check-in flag → duplicate scan rejection
4. [ ] **Auth/access control** — what logged-in nurses can access vs. public
5. [ ] **Sponsor name display** — anonymous flag respected in Partners Roll Call

## Vercel / Neon Hygiene
- [ ] Remove custom domain from old `nursingrocks-30` Vercel project (don't delete — detach domain, rename with `_ARCHIVED_` prefix)
- [ ] Confirm PgBouncer pooled connection string in use (`-pooler` suffix in hostname)
- [ ] Confirm NRSF Foundation donation link is on a permanent domain (not fragile Replit URL)

## Immediate Actions
- [ ] Run `claude-seo.md` audit NOW — 25 days before The Walter
- [ ] 60:30:10 color audit — check site palette before the event
- [ ] Run AppFinisher — surface remaining incomplete nodes
- [ ] Apply DESIGN.md from getdesign.md for UI consistency

## Security (Patches Applied — Confirm Working)
- [ ] Admin login security fixes — confirm 2FA or strong auth is active
- [ ] Cloudflare B2 setup — confirm assets are served via Cloudflare, not direct S3
- [ ] Run FRAMING-AUDIT-PROTOCOL.md on all admin-facing copy

## Post-Walter Opportunities
- Blotato MCP: auto-post event updates to all social platforms from one Claude Code command
- Remotion overnight video: feed raw event footage → Claude Code produces structured Reels by morning
- WordPress migration consideration: marketing/content layer only (QR + Stripe stays on Next.js)

## Stack Reference
Next.js / Neon/PostgreSQL / Drizzle ORM / Stripe / NextAuth / Resend / Vercel / Cloudflare
