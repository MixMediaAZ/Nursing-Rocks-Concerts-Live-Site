# Nursing Rocks Concert Series - Deployment Guide

## Pre-Deployment Checklist

### 1. Environment Variables
Create a `.env` file with the following required variables (see `env.example` for reference):

**Required:**
- `DATABASE_URL` - PostgreSQL connection string (Neon serverless)
- `JWT_SECRET` - Secure random string for JWT token signing
- `SESSION_SECRET` - Secure random string for session management
- `VIDEO_B2_BUCKET` - Backblaze B2 bucket name (S3-compatible)
- `VIDEO_B2_S3_ENDPOINT` - Backblaze S3 endpoint (e.g. `https://s3.us-west-004.backblazeb2.com`)
- `VIDEO_B2_REGION` - Backblaze region (e.g. `us-west-004`)
- `VIDEO_B2_ACCESS_KEY_ID` - Backblaze application key ID
- `VIDEO_B2_SECRET_ACCESS_KEY` - Backblaze application key
- `VIDEO_CDN_BASE_URL` - Public base URL for video delivery (B2 public or Cloudflare hostname)
- `VITE_VIDEO_CDN_BASE_URL` - Client-side base URL (must match `VIDEO_CDN_BASE_URL`)

**Optional:**
- `STRIPE_SECRET_KEY` - For payment processing
- `STRIPE_PUBLISHABLE_KEY` - For Stripe frontend integration
- `CUSTOMCAT_API_KEY` - For merchandise integration
- `CUSTOMCAT_API_SECRET` - For merchandise integration
- `PORT` - Server port (default: 5000)

### 2. Database Setup

#### Production database migrations (recommended)
This project uses **SQL migrations** in `migrations/` and a safe migration runner that tracks what has already been applied.

```bash
# 1) Ensure DATABASE_URL is set (production DB connection string)
#    Example:
#    export DATABASE_URL="postgresql://..."
#
# 2) Run all migrations (safe to re-run; uses schema_migrations tracking)
node run-migrations.js
```

Notes:
- This will apply `migrations/000_create_migration_tracking.sql` and `migrations/001_base_schema.sql` first, then any existing incremental migrations.
- If you previously used `npm run db:push`, keep using migrations going forward for production safety/auditability.

#### Run Pending Migrations
```bash
# User suspension migration (if not already run)
npx tsx migrations/run-user-suspension-migration.js

# Job approval migration (if not already run)
npx tsx migrations/run-job-approval-migration.js

# Or use Drizzle Kit
npm run db:push
```

#### Create Admin Account
After deployment, create an admin account via the registration page, then manually update the database:
```sql
UPDATE users SET is_admin = true, is_verified = true WHERE email = 'youradmin@email.com';
```

Or use the existing admin account:
- Email: `MixMediaAZ@gmail.com`
- Password: `HomeRun1!`

### 3. Video Setup (Backblaze B2 + HLS)

1. Upload MP4 videos to Backblaze B2 (recommended under `source/` prefix)
2. Log in as admin
3. Navigate to Admin Dashboard → Approval tab
4. Click \"Sync\" to import all candidate videos from B2
5. Run HLS backfill (admin endpoint): `POST /api/admin/videos/hls/backfill`
6. Approve videos for public display

### 4. Build and Start

#### Development
```bash
npm install
npm run dev
```

#### Production
```bash
# Install dependencies
npm install

# Build the application
npm run build

# Start the production server
npm start
```

## Production Deployment Options

### Option 1: Replit
1. Import project to Replit
2. Configure secrets (environment variables) in Replit
3. Click "Run" - Replit will handle the build automatically

### Option 2: Traditional VPS (DigitalOcean, AWS, etc.)
```bash
# Clone repository
git clone <repository-url>
cd Nursing-Rocks-Concerts-Live-Site

# Install dependencies
npm install

# Create .env file
cp env.example .env
# Edit .env with your values

# Build
npm run build

# Start with PM2 (recommended)
npm install -g pm2
pm2 start dist/index.js --name "nursing-rocks"
pm2 save
pm2 startup

# Or use systemd
sudo nano /etc/systemd/system/nursing-rocks.service
```

Example systemd service:
```ini
[Unit]
Description=Nursing Rocks Concert Series
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/nursing-rocks
ExecStart=/usr/bin/node dist/index.js
Restart=on-failure
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

### Option 3: Docker
```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 5000

CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t nursing-rocks .
docker run -d -p 5000:5000 --env-file .env nursing-rocks
```

### Option 4: Vercel (Full-stack)
This project can be deployed to Vercel as **full-stack**:
- The React SPA is served from `dist/public` (built by Vite)
- The Express API is served via a Vercel Serverless Function at `/api/*`

#### Step 1: Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```

#### Step 2: Create Neon database + run migrations
1. Create a Postgres database in Neon.
2. Copy your Neon `DATABASE_URL`.
3. Run migrations from your machine (safe to re-run; tracked in `schema_migrations`):

```bash
DATABASE_URL="your-neon-connection-string" node run-migrations.js
```

#### Step 3: Create Vercel project
1. In Vercel, import your GitHub repo
2. Configure:
   - Build Command: `npm run build`
   - Output Directory: `dist/public`
   - Install Command: `npm install`

#### Step 4: Set Vercel environment variables
Set these in **Production** and **Preview**:
- `DATABASE_URL`
- `JWT_SECRET`
- `SESSION_SECRET`
- `VIDEO_B2_BUCKET`
- `VIDEO_B2_S3_ENDPOINT`
- `VIDEO_B2_REGION`
- `VIDEO_B2_ACCESS_KEY_ID`
- `VIDEO_B2_SECRET_ACCESS_KEY`
- `VIDEO_CDN_BASE_URL`
- `VITE_VIDEO_CDN_BASE_URL`
- `NODE_ENV=production`
- `ALLOWED_ORIGINS=https://<your-vercel-domain>` (add custom domain too if you use one)

Deploy.

#### Step 5: Post-deploy admin setup
1. Register or sign in as admin.
2. Approve videos:
   - Admin Dashboard → Approval tab
   - Sync videos
   - Approve videos for public playback

## Post-Deployment Tasks

### 1. Test Critical Flows
- [ ] User registration and login
- [ ] Admin login and dashboard access
- [ ] Video player functionality (home and videos pages)
- [ ] License verification submission
- [ ] Admin video approval workflow
- [ ] Admin license approval workflow
- [ ] Gallery image upload
- [ ] Jobs board functionality

### 2. Configure SSL/TLS
For production, ensure HTTPS is enabled:
- Use Let's Encrypt with Certbot
- Configure reverse proxy (Nginx/Apache)
- Update CORS settings if needed

### 3. Performance Optimization
- Enable caching for video HLS segments (Cloudflare recommended)
- Configure CDN for static assets
- Set up database connection pooling
- Enable Vite build optimizations (already configured)

### 4. Monitoring
Set up monitoring for:
- Server health
- Database connections
- API response times
- Error logging

## Database Schema

The application uses the following main tables:
- `users` - User accounts with admin and verification flags
- `nurse_licenses` - License verification submissions
- `approved_videos` - Video approval tracking
- `gallery` - Image gallery
- `events` - Concert events
- `job_listings` - Jobs board with approval workflow
- `tickets` - Ticket management
- `subscribers` - Newsletter subscribers

## Security Considerations

1. **Environment Variables**: Never commit `.env` to version control
2. **JWT Secret**: Use a strong, random secret (minimum 64 characters)
3. **Database**: Use SSL connections for production database
4. **CORS**: Configure `ALLOWED_ORIGINS` for production domains
5. **Rate Limiting**: Consider adding rate limiting for API endpoints
6. **File Uploads**: Validate file types and sizes

## Troubleshooting

### Videos Not Playing
- Check B2 env vars in `.env` and that `VITE_VIDEO_CDN_BASE_URL` points at your public video hostname
- Ensure HLS has been generated (admin backfill endpoint)
- Verify videos are approved in Admin Dashboard → Approval tab
- Check browser console for errors

### Admin Dashboard Not Accessible
- Verify user has `is_admin = true` in database
- Check JWT token is valid
- Clear browser localStorage and login again

### Database Connection Errors
- Verify `DATABASE_URL` is correct
- Check Neon serverless database is active
- Ensure IP allowlist is configured (if applicable)

### License Verification Not Working
- Check admin has approved licenses in Licenses tab
- Verify user is authenticated
- Check database schema includes all required fields

## Support

For issues or questions:
- Email: NursingRocksConcerts@gmail.com
- Check server logs for detailed error messages
- Review browser console for frontend errors

## Version Information

- Node.js: 20.x or higher
- PostgreSQL: Compatible with Neon Serverless
- React: 18.3.1
- Vite: 7.3.0

