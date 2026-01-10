# Pre-Push Checklist ✅

## ✅ **FIXED: Security Issues**
- [x] `.env` files removed from git tracking
- [x] `.gitignore` updated to exclude `.env`, `.env.*`, `node_modules`, `dist`
- [x] Sensitive files will NOT be committed

## ✅ **Ready to Push**
- [x] `vercel.json` - Vercel configuration
- [x] `api/index.ts` - Serverless function handler
- [x] `server/vite.ts` - Updated for Vercel static file serving
- [x] `package.json` - Build scripts configured
- [x] `env.example` - Template for environment variables
- [x] `.gitignore` - Properly configured

## 📋 **Next Steps**

### **1. Commit Changes in GitHub Desktop**
You should see these changes ready to commit:
- `M .gitignore` (modified - now excludes .env files)
- `D .env` (deleted from git - but stays locally)
- `D .env.txt` (deleted from git - but stays locally)

**Commit message suggestion:**
```
Initial commit: Add Vercel deployment configuration

- Add vercel.json with build and rewrite configuration
- Add api/index.ts serverless function handler
- Update server/vite.ts for Vercel static file serving
- Update .gitignore to exclude sensitive files
- Remove .env files from git tracking
```

### **2. Push to GitHub**
- Click "Push origin" in GitHub Desktop
- Verify push succeeds
- Check GitHub repository shows all files

### **3. Connect to Vercel**
1. Go to https://vercel.com
2. Click "Add New Project"
3. Import from GitHub: `MixMediaAZ/Nursing-Rocks-Concerts-Live-Site`
4. Vercel will auto-detect settings from `vercel.json`
5. **IMPORTANT**: Add environment variables in Vercel Dashboard:
   - Go to Project Settings → Environment Variables
   - Add all variables from your local `.env` file
   - Set `NODE_ENV=production` for Production
   - Add your Vercel domain to `ALLOWED_ORIGINS`

### **4. Required Environment Variables for Vercel**
Copy these from your local `.env` to Vercel Dashboard:

**Required:**
- `DATABASE_URL`
- `JWT_SECRET`
- `SESSION_SECRET`
- `VIDEO_B2_S3_ENDPOINT`
- `VIDEO_B2_BUCKET`
- `VIDEO_B2_REGION`
- `VIDEO_B2_ACCESS_KEY_ID`
- `VIDEO_B2_SECRET_ACCESS_KEY`
- `VIDEO_CDN_BASE_URL`
- `VITE_VIDEO_CDN_BASE_URL`
- `NODE_ENV=production`
- `ALLOWED_ORIGINS` (your Vercel domain, e.g., `https://your-project.vercel.app`)

**Optional:**
- `STRIPE_SECRET_KEY`
- `VITE_STRIPE_PUBLIC_KEY`
- `CUSTOMCAT_API_KEY`
- `VERIFICATION_API_KEY`

### **5. Deploy**
- Vercel will automatically deploy after you push
- Check deployment logs for any errors
- Visit your Vercel URL to verify the site loads

## ⚠️ **Important Notes**
- Your local `.env` file will remain (not deleted, just untracked)
- Never commit `.env` files - they contain secrets
- Always set environment variables in Vercel Dashboard, not in code
- The `env.example` file shows what variables are needed

## ✅ **Everything is Ready!**
All files are properly configured. You can safely push to GitHub and connect to Vercel.
