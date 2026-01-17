# Vercel Deployment Guide

This document outlines the steps and requirements for deploying this application to Vercel.

## Prerequisites

1. A Vercel account
2. All environment variables configured (see `.env.example`)
3. Database provisioned (Neon PostgreSQL recommended)
4. Backblaze B2 account for video storage

## Environment Variables

Set the following environment variables in your Vercel project settings:

### Required Variables

- `DATABASE_URL` - PostgreSQL connection string (Neon serverless compatible)
- `JWT_SECRET` - Secret key for JWT token signing
- `SESSION_SECRET` - Secret key for session management
- `VIDEO_B2_S3_ENDPOINT` - Backblaze B2 S3-compatible endpoint
- `VIDEO_B2_ACCESS_KEY_ID` - Backblaze B2 access key
- `VIDEO_B2_SECRET_ACCESS_KEY` - Backblaze B2 secret key
- `VIDEO_B2_BUCKET_NAME` - Backblaze B2 bucket name
- `VIDEO_B2_CDN_BASE_URL` - CDN URL for video delivery

### Optional Variables

- `STRIPE_SECRET_KEY` - Stripe API key for payments
- `VERIFICATION_API_KEY` - License verification API key
- `CUSTOMCAT_API_KEY` - CustomCat product sync API key
- `ADMIN_PIN` - Admin access PIN
- `ALLOWED_ORIGINS` - Comma-separated list of allowed CORS origins
- `VIDEO_B2_REGION` - B2 region (default: us-west-004)
- `VIDEO_SOURCE_PREFIX` - Video source prefix (default: source)
- `VIDEO_HLS_PREFIX` - HLS manifest prefix (default: hls)
- `VIDEO_POSTER_PREFIX` - Poster image prefix (default: poster)

## Build Configuration

The project is configured with:
- **Build Command**: `npm run build`
- **Output Directory**: `dist/public`
- **Install Command**: `npm install`
- **Node Version**: 20.x or higher

## Deployment Steps

1. **Connect Repository**
   - Link your GitHub/GitLab/Bitbucket repository to Vercel
   - Or use Vercel CLI: `vercel`

2. **Configure Environment Variables**
   - Go to Project Settings → Environment Variables
   - Add all required variables from `.env.example`
   - Set them for Production, Preview, and Development environments as needed

3. **Deploy**
   - Push to your main branch (auto-deploy)
   - Or manually deploy via Vercel dashboard
   - Or use CLI: `vercel --prod`

4. **Verify Deployment**
   - Check build logs for any errors
   - Test API endpoints at `https://your-domain.vercel.app/api/health`
   - Test frontend at `https://your-domain.vercel.app`

## API Routes

All API routes are handled by the serverless function at `api/index.ts`, which:
- Imports the pre-bundled handler from `dist/vercel-handler.js`
- Handles all `/api/*` routes
- Serves the SPA for all other routes

## Static Assets

- Static files are served from `dist/public`
- Uploads directory is ephemeral (use external storage for persistent files)
- Images should be stored in Backblaze B2 or similar

## Database

- Uses Neon serverless PostgreSQL
- Connection pooling is handled automatically
- Migrations should be run manually or via CI/CD

## Performance

- Function timeout: 30 seconds
- Function memory: 1024 MB
- Static assets cached for 1 year
- HTML/JSON cached with must-revalidate

## Troubleshooting

### Build Failures
- Check Node.js version (must be 20.x+)
- Verify all dependencies are in `package.json`
- Check build logs for specific errors

### Runtime Errors
- Check function logs in Vercel dashboard
- Verify all environment variables are set
- Ensure database is accessible from Vercel

### API Errors
- Check CORS configuration
- Verify `ALLOWED_ORIGINS` includes your domain
- Check authentication tokens

## Additional Notes

- The `uploads/` directory is ephemeral - use external storage
- Session storage should use a database-backed session store
- Video processing may require longer timeouts for large files
- Consider using Vercel Edge Functions for high-traffic endpoints
