# Video Setup Guide - B2 Video System

## ✅ Simplification Complete

The video system has been successfully simplified to use **only Backblaze B2** for all video operations.

### Changes Made:
- ✅ Renamed `CloudinaryVideoPlaylist` → `VideoPlaylist`
- ✅ Renamed `client/src/lib/cloudinary.ts` → `client/src/lib/video-service.ts`
- ✅ Removed all Cloudinary references from code and comments
- ✅ Removed unnecessary B2 filtering (all videos are B2 now)
- ✅ Cleaned up variable names throughout the codebase

---

## 🎬 How to Get Videos Working

### Step 1: Verify B2 Configuration

Make sure these environment variables are set (in `.env` file):

```bash
# Video Provider
VIDEO_PROVIDER=b2

# B2 Bucket Configuration
VIDEO_B2_BUCKET=your-bucket-name
VIDEO_B2_S3_ENDPOINT=https://s3.us-west-004.backblazeb2.com
VIDEO_B2_REGION=us-west-004
VIDEO_B2_ACCESS_KEY_ID=your_b2_key_id
VIDEO_B2_SECRET_ACCESS_KEY=your_b2_application_key

# CDN URLs (for video playback)
VIDEO_CDN_BASE_URL=https://your-cdn-url.com
VITE_VIDEO_CDN_BASE_URL=https://your-cdn-url.com

# Optional: Organize videos in B2 bucket
VIDEO_SOURCE_PREFIX=source
VIDEO_HLS_PREFIX=hls
VIDEO_POSTER_PREFIX=poster
```

### Step 2: Upload Videos to B2

**Option A: Upload via the `/thanks` page**
- Users can upload videos through the "Upload your video of appreciation" page
- Videos are automatically uploaded to B2 with presigned URLs
- They go into the `{VIDEO_SOURCE_PREFIX}/thanks/` folder

**Option B: Upload directly to B2**
- Use the B2 web interface or CLI to upload MP4 files
- Place them in the bucket under the `VIDEO_SOURCE_PREFIX` path (e.g., `source/`)

### Step 3: Sync Videos to Database

1. **Login as admin** at `/admin`
2. **Go to Video Approval** section
3. **Click "Sync from Storage"** button
   - This scans your B2 bucket for MP4 files
   - Creates database records for each video
   - Videos start as "unapproved" (hidden from public)

### Step 4: Approve Videos

1. In the **Video Approval** admin panel:
   - Preview videos by clicking the thumbnail
   - Click **"Approve"** to make videos visible to users
   - Videos appear on:
     - Home page hero slideshow
     - `/videos` page

### Step 5: HLS Transcoding (Optional but Recommended)

For better streaming performance, convert MP4s to HLS format:

**Option A: Automatic (on upload)**
- Videos uploaded via `/thanks` page are automatically queued for HLS packaging
- Processing happens in the background

**Option B: Manual backfill**
- Use the admin API endpoint: `POST /api/admin/videos/hls/backfill`
- This converts existing MP4s to multi-bitrate HLS streams
- Requires `ffmpeg` installed on the server

---

## 🔍 Troubleshooting "Video unavailable"

### Issue: No videos showing on site

**Possible causes:**

1. **No approved videos**
   - Solution: Go to `/admin` → Video Approval → Approve some videos

2. **B2 bucket is empty**
   - Solution: Upload MP4 files to your B2 bucket

3. **Videos not synced**
   - Solution: Click "Sync from Storage" in admin panel

4. **B2 configuration error**
   - Check browser console for errors
   - Verify environment variables are set correctly
   - Test B2 connection: `GET /api/videos/status`

5. **HLS files not generated**
   - Videos might be MP4-only (still works but less optimal)
   - Run HLS backfill to generate streaming files

### Check API Response

Open browser console and run:
```javascript
fetch('/api/videos')
  .then(r => r.json())
  .then(data => console.log('Videos:', data))
```

**Expected response:**
```json
{
  "success": true,
  "resources": [
    {
      "public_id": "b2_abc123...",
      "asset_id": "b2_abc123...",
      "format": "mp4",
      "resource_type": "video",
      "hls_url": "https://your-cdn.com/hls/b2_abc123.../master.m3u8",
      "poster_url": "https://your-cdn.com/poster/b2_abc123....jpg",
      ...
    }
  ],
  "total": 1
}
```

**If `resources` is empty:**
- No approved videos exist yet
- Follow steps 2-4 above

**If you get an error:**
- Check B2 credentials
- Verify bucket permissions
- Check server logs for details

---

## 📁 Video File Organization in B2

```
your-bucket/
├── source/              # Original MP4 uploads (VIDEO_SOURCE_PREFIX)
│   ├── thanks/          # User submissions from /thanks page
│   │   ├── 1234567890_video1.mp4
│   │   └── 1234567891_video2.mp4
│   └── other-videos.mp4
├── hls/                 # HLS streaming files (VIDEO_HLS_PREFIX)
│   ├── b2_abc123.../
│   │   ├── master.m3u8
│   │   ├── v0/
│   │   │   ├── index.m3u8
│   │   │   └── seg_*.ts
│   │   └── v1/
│   │       ├── index.m3u8
│   │       └── seg_*.ts
│   └── b2_def456.../
│       └── ...
└── poster/              # Video thumbnails (VIDEO_POSTER_PREFIX)
    ├── b2_abc123....jpg
    └── b2_def456....jpg
```

---

## 🎯 Quick Start Checklist

- [ ] Set B2 environment variables in `.env`
- [ ] Upload at least one MP4 to B2 bucket
- [ ] Login to `/admin`
- [ ] Click "Sync from Storage" in Video Approval
- [ ] Approve at least one video
- [ ] Visit home page or `/videos` to see videos playing
- [ ] (Optional) Run HLS backfill for better streaming

---

## 🚀 Production Deployment

### Vercel Configuration

The app is configured for Vercel deployment. Make sure:

1. **Environment variables** are set in Vercel dashboard
2. **B2 bucket** has CORS configured for your domain
3. **CDN URL** points to your B2 bucket (or Cloudflare in front of B2)

### CORS Configuration for B2

Add this CORS rule to your B2 bucket:

```json
[
  {
    "corsRuleName": "allowWebAccess",
    "allowedOrigins": [
      "https://your-domain.com",
      "http://localhost:5000"
    ],
    "allowedOperations": [
      "b2_download_file_by_name",
      "b2_download_file_by_id"
    ],
    "allowedHeaders": ["*"],
    "exposeHeaders": ["x-bz-content-sha1"],
    "maxAgeSeconds": 3600
  }
]
```

---

## 📞 Need Help?

If videos still aren't working:

1. Check browser console for errors
2. Check server logs for B2 connection issues
3. Verify B2 bucket permissions
4. Test API endpoints manually:
   - `GET /api/videos/status` - Check B2 connection
   - `GET /api/videos` - List approved videos
   - `GET /api/admin/videos` (with auth) - List all videos

The system is now fully B2-based and ready to use! 🎉

