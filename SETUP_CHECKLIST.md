# Setup Checklist for Nursing Rocks v2.0

## ✅ Quick Setup Guide

Follow these steps to get your copied project running:

---

## Step 1: Navigate to Project
```powershell
cd "C:\Users\Dave\Downloads\Nursing-Rocks-Concerts-Live-Site v1.0\Nursing-Rocks-Concerts-Live-Site - 2.0"
```

---

## Step 2: Install Dependencies (5-10 minutes)
```powershell
npm install
```

**What this does:**
- Downloads ~500MB of NPM packages
- Creates `node_modules/` folder
- Installs all dependencies from `package.json`

**Expected output:**
```
added 1234 packages in 5m
```

---

## Step 3: Verify Environment Variables

Check that `.env` file exists and contains:

```bash
# Database
DATABASE_URL=postgresql://...

# Session
SESSION_SECRET=...

# Video - Backblaze B2
VIDEO_PROVIDER=b2
VIDEO_B2_BUCKET=nursing-rocks-videos
VIDEO_B2_S3_ENDPOINT=https://s3.us-west-004.backblazeb2.com
VIDEO_B2_REGION=us-west-004
VIDEO_B2_ACCESS_KEY_ID=...
VIDEO_B2_SECRET_ACCESS_KEY=...
VIDEO_CDN_BASE_URL=https://...
VITE_VIDEO_CDN_BASE_URL=https://...

# Optional
VIDEO_SOURCE_PREFIX=source
VIDEO_HLS_PREFIX=hls
VIDEO_POSTER_PREFIX=poster
```

**If `.env` is missing any values:**
- Copy from `.env.example`
- Fill in your actual credentials

---

## Step 4: Build the Project (2-3 minutes)
```powershell
npm run build
```

**What this does:**
- Compiles TypeScript to JavaScript
- Bundles frontend with Vite
- Creates `dist/` folder (~200MB)
- Optimizes assets for production

**Expected output:**
```
vite v7.3.0 building client environment for production...
✓ built in 1m 28s
```

---

## Step 5: Test Locally
```powershell
npm run dev
```

**What this does:**
- Starts development server on http://localhost:5000
- Enables hot-reload for development
- Connects to your database

**Open browser:**
- Visit: http://localhost:5000
- Test homepage loads
- Test video pages
- Test admin panel at /admin

---

## Step 6: Run Database Migrations (if needed)

If this is a fresh database:
```powershell
node run-migrations.js
```

**What this does:**
- Creates all database tables
- Sets up schema
- Runs all migration files

---

## 🎬 Video System Setup

After basic setup, configure videos:

1. **Upload videos to B2 bucket**
   - Use B2 web interface or CLI
   - Place MP4 files in bucket

2. **Login to admin panel**
   - Go to http://localhost:5000/admin
   - Use admin credentials

3. **Sync videos from B2**
   - Go to Video Approval section
   - Click "Sync from Storage"
   - This scans B2 and adds videos to database

4. **Approve videos**
   - Review videos in admin panel
   - Click "Approve" to make them public
   - Videos will appear on homepage and /videos page

See `VIDEO_SETUP_GUIDE.md` for detailed video setup instructions.

---

## 📦 Moving to Another Drive

Once setup is complete, you can move the entire folder:

```powershell
# Example: Move to D: drive
Move-Item -Path "C:\Users\Dave\Downloads\Nursing-Rocks-Concerts-Live-Site v1.0\Nursing-Rocks-Concerts-Live-Site - 2.0" -Destination "D:\Projects\Nursing-Rocks"
```

**After moving:**
1. Update your IDE workspace path
2. No need to reinstall - `node_modules` moves with the folder
3. Update any absolute paths in configs (if any)

---

## 🚀 Production Deployment

### Deploy to Vercel:
```powershell
# Install Vercel CLI (if not installed)
npm install -g vercel

# Deploy
vercel
```

### Or push to GitHub and connect Vercel:
1. Initialize git: `git init`
2. Add remote: `git remote add origin <your-repo-url>`
3. Push: `git push -u origin main`
4. Connect Vercel to GitHub repo
5. Set environment variables in Vercel dashboard

---

## ✅ Verification Checklist

Before deploying, verify:

- [ ] `npm install` completed successfully
- [ ] `npm run build` completed without errors
- [ ] `.env` file has all required variables
- [ ] Local dev server runs: `npm run dev`
- [ ] Homepage loads at http://localhost:5000
- [ ] Admin panel accessible at /admin
- [ ] Database migrations ran successfully
- [ ] B2 credentials are correct
- [ ] Videos sync from B2 (if using videos)

---

## 🐛 Troubleshooting

### Issue: npm install fails
**Solution:** 
- Delete `node_modules` and `package-lock.json`
- Run `npm install` again
- Check Node.js version (should be 18+)

### Issue: Build fails
**Solution:**
- Check for TypeScript errors: `npm run typecheck`
- Review build logs for specific errors
- Ensure all dependencies installed

### Issue: Videos not showing
**Solution:**
- Check B2 credentials in `.env`
- Verify videos are synced: Go to /admin → Video Approval
- Approve videos in admin panel
- Check browser console for errors
- See `VIDEO_SETUP_GUIDE.md`

### Issue: Database connection error
**Solution:**
- Verify `DATABASE_URL` in `.env`
- Check database is running
- Run migrations: `node run-migrations.js`

---

## 📚 Documentation Files

- `README.md` - Project overview
- `VIDEO_SETUP_GUIDE.md` - Video system setup (NEW!)
- `COPY_VERIFICATION.md` - Copy verification report
- `DEPLOYMENT.md` - Deployment guide
- `PRODUCTION_READINESS.md` - Production checklist
- `EMPLOYER_SYSTEM_DEPLOYMENT.md` - Employer features

---

## 🎯 Quick Commands Reference

```powershell
# Install dependencies
npm install

# Build for production
npm run build

# Run development server
npm run dev

# Run database migrations
node run-migrations.js

# Type checking
npm run typecheck

# Deploy to Vercel
vercel
```

---

## ✨ What's Included in v2.0

This version includes:
- ✅ Complete source code (client + server)
- ✅ All configuration files
- ✅ Database migrations
- ✅ Assets and media
- ✅ Environment variables
- ✅ B2 video system (simplified)
- ✅ Documentation
- ✅ Deployment configs

**Ready to run after `npm install` and `npm run build`!**

---

**Need help?** Check the documentation files or review the verification report in `COPY_VERIFICATION.md`.

