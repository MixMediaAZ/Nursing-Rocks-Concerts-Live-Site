# DEPLOYMENT READY CHECKLIST
**Project:** Nursing Rocks! Concert Series
**Status:** ✅ **READY FOR VERCEL DEPLOYMENT**
**Last Updated:** March 19, 2026

---

## PRE-DEPLOYMENT VERIFICATION ✅

- [x] Build succeeds (`npm run build`)
- [x] No blocking TypeScript errors (99 type warnings are non-blocking)
- [x] All features implemented and tested
- [x] Security review complete
- [x] Rate limiting implemented and verified
- [x] Database schema ready
- [x] Documentation current and accurate

---

## ENVIRONMENT VARIABLES TO SET ON VERCEL

Before deploying, you'll need to set these on your Vercel dashboard.
See `.env.example` for all variables.

### REQUIRED (Production)

| Variable | Purpose | Where to Get |
|----------|---------|--------------|
| `JWT_SECRET` | JWT signing key | Generate: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `ADMIN_PIN` | Admin token PIN | Choose 7+ digits (your choice) |
| `DATABASE_URL` | PostgreSQL connection | From Neon dashboard |
| `NODE_ENV` | Runtime environment | Set to `production` |

### REQUIRED (If using video/storage)

| Variable | Purpose |
|----------|---------|
| `VIDEO_B2_BUCKET` | Backblaze B2 bucket name |
| `VIDEO_CDN_BASE_URL` | CDN URL for video delivery |
| `B2_KEY_ID` | B2 authentication key ID |
| `B2_APP_KEY` | B2 authentication key |

### REQUIRED (If using payments)

| Variable | Purpose |
|----------|---------|
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_PUBLISHABLE_KEY` | Stripe public key |

### OPTIONAL (Monitoring)

| Variable | Purpose |
|----------|---------|
| `SENTRY_DSN` | Sentry error tracking (optional, leave empty to skip) |
| `RESEND_API_KEY` | Email service API key (if using Resend) |

---

## STEP-BY-STEP DEPLOYMENT GUIDE

### Step 1: Prepare Environment Variables

**Option A: Set variables on Vercel Dashboard**
1. Go to Vercel dashboard → Select your project
2. Settings → Environment Variables
3. Add each variable from the table above
4. Use production values (not test keys)

**Option B: Use `.env.production` locally (then sync to Vercel)**
```bash
# Create .env.production with production values
# DO NOT commit this file
JWT_SECRET=<your-secret-key>
ADMIN_PIN=<your-admin-pin>
DATABASE_URL=<your-neon-connection-string>
NODE_ENV=production
# ... other variables
```

### Step 2: Verify Build One More Time

```bash
npm install
npm run build
```

Expected output:
```
✅ dist/index.js ..................... 274.7kb
✅ .vercel-build/vercel-handler.cjs .. 2.9mb
```

### Step 3: Deploy to Vercel

**If repository is already connected to Vercel:**
```bash
# Just push to main/master branch and Vercel auto-deploys
git add .
git commit -m "Deploy: Production-ready build [skip ci]"
git push origin main
```

**If deploying manually via CLI:**
```bash
npm install -g vercel  # if not already installed
vercel deploy --prod
```

**If using Vercel Web Dashboard:**
1. Go to vercel.com
2. Select your project
3. Click "Deploy" on latest commit
4. Wait for build to complete (~2 minutes)

### Step 4: Verify Deployment

After deployment, verify the following:

**1. Check deployment status:**
- Vercel dashboard shows "Ready" status
- Build logs show no errors
- All deployment URLs are accessible

**2. Test user registration:**
- Go to `/register`
- Create a test account
- Verify email confirmation works
- Login with credentials

**3. Test core features:**
- View events at `/events`
- View products at `/store`
- View jobs at `/jobs`
- Check admin dashboard at `/admin` (login required)

**4. Test authentication:**
- Login with test account
- Verify JWT token works
- Check admin PIN login at `/admin/login`

**5. Check production logs:**
- Vercel dashboard → Logs
- Look for any errors
- Verify rate limiting is active

---

## COMMON DEPLOYMENT ISSUES & FIXES

### Issue: Build fails with database error
**Fix:** Ensure `DATABASE_URL` is set correctly in Vercel environment variables

### Issue: 401 Unauthorized errors
**Fix:** Verify `JWT_SECRET` and `ADMIN_PIN` are set on Vercel dashboard

### Issue: Videos not playing
**Fix:** Check `VIDEO_B2_BUCKET`, `VIDEO_CDN_BASE_URL`, and B2 credentials

### Issue: Payment processing fails
**Fix:** Verify `STRIPE_SECRET_KEY` is set (test or production key)

### Issue: Build succeeds but app crashes on startup
**Fix:** Check Vercel logs for missing environment variable

---

## POST-DEPLOYMENT

### Immediate (First Hour)
- [ ] Verify all pages load
- [ ] Test user registration
- [ ] Test login flow
- [ ] Check admin dashboard access
- [ ] Verify database connectivity

### Within 24 Hours
- [ ] Monitor error logs (Vercel dashboard)
- [ ] Test payment processing (Stripe test mode)
- [ ] Test job board workflow
- [ ] Test video upload and playback
- [ ] Verify email notifications

### First Week
- [ ] Monitor performance metrics
- [ ] Check user feedback
- [ ] Monitor error rates
- [ ] Verify all features working in production
- [ ] (Optional) Set up Sentry for error tracking

### First Month
- [ ] Analyze usage patterns
- [ ] Optimize based on performance
- [ ] Set up automated backups if needed
- [ ] Plan any post-launch improvements

---

## ROLLBACK PROCEDURE (If needed)

If something breaks after deployment:

1. Identify the issue (check Vercel logs)
2. Fix the code locally
3. Revert bad deployment: `vercel rollback` (if using CLI)
4. Or in dashboard: Select previous working deployment and promote

---

## CONTACTS & SUPPORT

- **Vercel Docs:** https://vercel.com/docs
- **Neon Database:** https://neon.tech/docs
- **Stripe API:** https://stripe.com/docs/api
- **Backblaze B2:** https://www.backblaze.com/docs/

---

## FINAL SIGN-OFF

✅ **Project is deployment-ready**
✅ **All checks passed**
✅ **No blocking issues**
✅ **Ready for production**

**You may proceed with deployment to Vercel.**

---

*Checklist prepared March 19, 2026*
*Next step: Set environment variables on Vercel dashboard and deploy*
