# Deployment Readiness Checklist
## GitHub Desktop → GitHub → Vercel → Web

### ✅ **1. Git Repository Setup**
- [x] Git repository initialized
- [x] Remote connected to: `https://github.com/MixMediaAZ/Nursing-Rocks-Concerts-Live-Site.git`
- [x] Branch: `main`
- [x] Latest commit synced with remote

### ✅ **2. Required Files for Vercel**
- [x] `vercel.json` - Vercel configuration with build command and rewrites
- [x] `api/index.ts` - Serverless function handler for Express app
- [x] `package.json` - Contains `build` script: `"build": "vite build && esbuild server/index.ts..."`
- [x] `server/vite.ts` - Updated with Vercel-aware static file serving
- [x] `.gitignore` - Excludes `.env`, `node_modules`, `dist`, etc.

### ✅ **3. Build Configuration**
- [x] Build command: `npm run build`
- [x] Output directory: `dist/public` (configured in `vite.config.ts`)
- [x] Serverless function: `api/index.ts` exports default handler
- [x] Static file serving: Configured for Vercel environment

### ⚠️ **4. Environment Variables (Must be set in Vercel Dashboard)**
**Required for deployment:**
- [ ] `DATABASE_URL` - PostgreSQL connection string (Neon)
- [ ] `JWT_SECRET` - Secure random string (min 32 chars)
- [ ] `SESSION_SECRET` - Secure random string (min 32 chars)
- [ ] `VIDEO_B2_BUCKET` - Backblaze B2 bucket name
- [ ] `VIDEO_B2_S3_ENDPOINT` - B2 S3 endpoint URL
- [ ] `VIDEO_B2_REGION` - B2 region (e.g., `us-west-004`)
- [ ] `VIDEO_B2_ACCESS_KEY_ID` - B2 application key ID
- [ ] `VIDEO_B2_SECRET_ACCESS_KEY` - B2 application key secret
- [ ] `VIDEO_CDN_BASE_URL` - Public video CDN URL
- [ ] `VITE_VIDEO_CDN_BASE_URL` - Client-side video CDN URL (must match above)
- [ ] `NODE_ENV=production` - Set to production
- [ ] `ALLOWED_ORIGINS` - Your Vercel domain(s), comma-separated

**Optional:**
- [ ] `STRIPE_SECRET_KEY` - For payments
- [ ] `VITE_STRIPE_PUBLIC_KEY` - For Stripe frontend
- [ ] `CUSTOMCAT_API_KEY` - For merchandise
- [ ] `VERIFICATION_API_KEY` - For nurse license verification

### ✅ **5. Code Changes Ready to Commit**
- [x] `api/index.ts` - New serverless function handler
- [x] `server/vite.ts` - Updated static file serving for Vercel
- [x] `vercel.json` - Vercel configuration file

### 📋 **6. Next Steps**

#### **In GitHub Desktop:**
1. Stage these files:
   - `api/index.ts` (new)
   - `server/vite.ts` (modified)
   - `vercel.json` (new)
2. Commit with message: "Fix Vercel deployment: Add serverless handler and static file serving"
3. Push to GitHub

#### **In Vercel Dashboard:**
1. Go to your project: https://vercel.com/dashboard
2. Navigate to: **Settings → Environment Variables**
3. Add all required environment variables listed above
4. Set `NODE_ENV=production` for Production environment
5. Add your Vercel domain to `ALLOWED_ORIGINS`
6. **Redeploy** (or wait for automatic deployment after push)

#### **Verify Deployment:**
1. After deployment completes, visit your Vercel URL
2. Should see the React app (not raw JavaScript)
3. Check browser console for errors
4. Test API endpoints (e.g., `/api/health` if exists)

### 🔍 **Troubleshooting**

**If you see raw JavaScript instead of HTML:**
- ✅ Fixed: `api/index.ts` now calls `serveStatic(app)`
- ✅ Fixed: `server/vite.ts` now looks for `dist/public` in Vercel environment

**If build fails:**
- Check Vercel build logs
- Verify `package.json` has correct `build` script
- Ensure all dependencies are in `package.json` (not just `devDependencies`)

**If environment variables are missing:**
- Check Vercel Dashboard → Settings → Environment Variables
- Ensure variables are set for **Production** environment
- Restart deployment after adding variables

### 📝 **Notes**
- The `dist` folder is built on Vercel (not committed to git)
- `.env` file is ignored by git (use Vercel environment variables)
- Database migrations should be run manually before first deployment
- See `DEPLOYMENT.md` for detailed deployment instructions
