# B2 Direct MP4 Playback - Setup Guide

## Overview

Play videos directly from B2 storage with Cloudflare CDN delivery - simple, reliable, and ~$1/month!

## Step 1: Update Your .env File

Open your `.env` file and make sure you have:

```bash
# Use B2 provider (not cloudflare)
VIDEO_PROVIDER=b2

# B2 Configuration
VIDEO_B2_BUCKET=nursing-rocks-videos
VIDEO_B2_S3_ENDPOINT=https://s3.us-west-004.backblazeb2.com
VIDEO_B2_REGION=us-west-004
VIDEO_B2_ACCESS_KEY_ID=your_key_id
VIDEO_B2_SECRET_ACCESS_KEY=your_secret_key

# CDN Base URL (Cloudflare in front of B2)
VIDEO_CDN_BASE_URL=https://f004.backblazeb2.com/file/nursing-rocks-videos

# Optional: Source prefix for organized storage
VIDEO_SOURCE_PREFIX=source
```

**IMPORTANT:** Make sure `VIDEO_PROVIDER=b2` (not cloudflare)

## Step 2: Restart Development Server

```bash
# Stop the current server (Ctrl+C in terminal)
# Start it again
npm run dev
```

## Step 3: Test Video Playback

1. Go to http://localhost:5000
2. Videos should play directly from B2 via Cloudflare CDN
3. No transcoding needed!
4. No FFmpeg required!

## How It Works

```
MP4 in B2 → Cloudflare CDN → Browser plays directly
```

- **Storage:** Videos stored as MP4 in Backblaze B2
- **Delivery:** Cloudflare CDN caches and delivers (free bandwidth!)
- **Playback:** Browser's native HTML5 video player

## Benefits

✅ **Simple:** No transcoding, no processing  
✅ **Cheap:** ~$1/month for 200GB storage  
✅ **Fast:** Cloudflare CDN delivers globally  
✅ **Reliable:** Standard MP4 playback works everywhere  
✅ **No Software:** No FFmpeg, no Cloudflare Stream subscription  

## Cost Breakdown

**Your Setup:**
- **B2 Storage:** 200GB × $0.005/GB = **$1.00/month**
- **B2 Bandwidth:** First 3× storage is free (600GB free/month)
- **Cloudflare CDN:** Free unlimited bandwidth
- **Total:** ~**$1/month**

vs. Cloudflare Stream: $5-10/month minimum

## Limitations (and why they're OK)

❌ **No adaptive bitrate** - But most users have fast connections now  
❌ **No auto-generated thumbnails** - Can generate once with a simple tool  
❌ **Single quality** - Upload at good quality (1080p, reasonable bitrate)  

✅ **Tradeoff:** 90% of benefits for 10% of the cost!

## Video Upload Guidelines

For best results, upload videos with these settings:

- **Resolution:** 1080p (1920×1080)
- **Format:** MP4 (H.264 video, AAC audio)
- **Bitrate:** 5-8 Mbps (good quality, reasonable file size)
- **Frame rate:** 30 fps

## Troubleshooting

### "Failed to load videos" error

**Check your .env file:**
```bash
# Make sure this says 'b2' not 'cloudflare'
VIDEO_PROVIDER=b2
```

Restart the dev server after changing.

### Videos still not playing

1. **Check B2 CORS settings** (see `B2_CORS_SETUP.md`)
2. **Verify CDN URL** - Make sure `VIDEO_CDN_BASE_URL` matches your B2 bucket's public URL
3. **Check browser console** for specific errors
4. **Test direct URL** - Copy a video URL and paste in browser to see if it loads

### "Missing required env var" error

Make sure all VIDEO_* environment variables are set:
- `VIDEO_PROVIDER=b2`
- `VIDEO_B2_BUCKET`
- `VIDEO_B2_S3_ENDPOINT`
- `VIDEO_B2_ACCESS_KEY_ID`
- `VIDEO_B2_SECRET_ACCESS_KEY`
- `VIDEO_CDN_BASE_URL`

## Admin Features

### Video Approval

1. Go to http://localhost:5000/admin
2. Click "Video Approval" tab
3. See all videos from B2
4. Approve/reject videos for public display

### Sync from Storage

The "Sync from Storage" button refreshes the list from B2 if you've uploaded new videos directly.

## Next Steps

After testing locally:

1. **Deploy to production** - Add same env vars to your production server
2. **Upload videos** - Use the upload feature in the admin panel
3. **Approve videos** - Only approved videos show on the public site

---

**That's it! Simple, cheap, and reliable video hosting! 🎬**

