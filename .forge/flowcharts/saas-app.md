# FLOWCHART: SaaS Application
## Generic template — adapt node order to specific requirements

---

## STANDARD BUILD ORDER

```
[1]  fix-ts-errors              ← if TypeScript errors exist
      ↓
[2]  security-rate-limit        ← always before public launch
      ↓
[3]  auth                       ← Clerk (Next.js) or Passport+JWT (Express)
      ↓
[4]  db                         ← Prisma+Neon (Next.js) or Drizzle+Neon (Express)
      ↓
[5]  email                      ← Resend (default)
      ↓
[6]  payments                   ← Stripe (if monetized)
      ↓
[7]  storage                    ← R2 or S3 (if file uploads needed)
      ↓
[8]  core-feature-1             ← primary app function
      ↓
[9]  core-feature-2
      ↓
[10] user-dashboard
      ↓
[11] admin-dashboard
      ↓
[12] email-sequences            ← onboarding, notifications
      ↓
[13] deploy                     ← Vercel
      ↓
[14] monitoring-sentry          ← post-launch
      ↓
[15] testing                    ← post-launch
```

---

## BRANCH CONDITIONS

### Auth Branch
```
IF Next.js stack → auth-clerk.md
IF Express stack → auth-passport-jwt.md
IF Supabase stack → auth-supabase.md
```

### Payment Branch
```
IF monetized → include payments-stripe.md after auth
IF free tier only → skip payments node
IF marketplace → use payments-stripe-connect.md
```

### Storage Branch
```
IF file uploads needed → include storage node after db
IF no file uploads → skip storage node
```

---

## ACTOR MAP TEMPLATE
Replace with actual actors for specific project.

```
END USER
  → registers / logs in
  → uses core feature
  → manages own data in dashboard

ADMIN
  → manages all users
  → views analytics
  → configures app settings
  → manages content
```

---

## MINIMUM VIABLE BUILD
Nodes required before first user can use the app:
1, 2, 3, 4, 5, core-feature-1, user-dashboard, deploy

Everything else is iteration.
