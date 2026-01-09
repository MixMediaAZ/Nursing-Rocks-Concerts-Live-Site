# Cloudflare Stream Setup Guide

## What We Just Implemented

✅ Cloudflare Stream video provider  
✅ Automatic video transcoding (no FFmpeg needed!)  
✅ Migration tool to move videos from B2 to Cloudflare  
✅ Admin UI with "Migrate to Cloudflare" button  

## Setup Steps

### 1. Add Cloudflare Credentials to .env

Open your `.env` file and add these lines:

```bash
# Cloudflare Stream Configuration
CLOUDFLARE_ACCOUNT_ID=your_account_id_here
CLOUDFLARE_STREAM_API_TOKEN=your_api_token_here
VIDEO_PROVIDER=cloudflare
```

**Replace:**
- `your_account_id_here` - Your Cloudflare Account ID
- `your_api_token_here` - The API token you just created

**Keep your existing B2 settings** (needed for migration):
```bash
# B2 Configuration (keep for migration)
VIDEO_B2_BUCKET=nursing-rocks-videos
VIDEO_B2_S3_ENDPOINT=https://s3.us-west-004.backblazeb2.com
VIDEO_B2_ACCESS_KEY_ID=your_key
VIDEO_B2_SECRET_ACCESS_KEY=your_secret
VIDEO_CDN_BASE_URL=https://f004.backblazeb2.com/file/nursing-rocks-videos
```

### 2. Restart Development Server

```bash
# Stop the current server (Ctrl+C)
# Start it again
npm run dev
```

### 3. Migrate Videos from B2 to Cloudflare

1. Go to http://localhost:5000/admin
2. Click on "Video Approval" tab
3. Click the orange **"Migrate to Cloudflare"** button
4. Wait 2-5 minutes for migration to complete
5. You'll see a success message: "Migrated 6 videos to Cloudflare Stream"

### 4. Test Video Playback

1. Go to http://localhost:5000 (home page)
2. Videos should now play in the hero slideshow
3. No CORS errors!
4. No "Video unavailable" messages!

## How It Works

### Migration Process

```
B2 MP4 Files → Cloudflare Stream API → Automatic Transcoding → Ready to Stream
```

1. **Reads MP4s from B2**: Gets your existing video files
2. **Uploads to Cloudflare**: Sends URLs to Cloudflare Stream API
3. **Auto-transcoding**: Cloudflare converts to multiple formats/bitrates
4. **Instant playback**: Videos are ready in 1-2 minutes

### Video Delivery

- **Adaptive bitrate**: Automatically adjusts quality based on connection
- **Global CDN**: Fast delivery worldwide
- **HLS & DASH**: Works on all devices (iOS, Android, desktop)
- **Thumbnails**: Auto-generated at multiple timestamps

## Benefits vs. B2 + FFmpeg

| Feature | B2 + FFmpeg | Cloudflare Stream |
|---------|-------------|-------------------|
| Setup | Complex | Simple |
| FFmpeg required | Yes | No |
| Works on Windows | Needs install | Yes |
| Transcoding | Manual | Automatic |
| CORS setup | Manual | Built-in |
| Adaptive bitrate | Manual | Automatic |
| Thumbnails | Manual | Automatic |
| Analytics | No | Yes |
| Cost | Storage only | $0.25/month (for 6 videos) |

## Pricing

**Cloudflare Stream:**
- $5 per 1,000 minutes stored
- $1 per 1,000 minutes delivered

**Your current usage (6 videos, ~30 mins):**
- Storage: $0.15/month
- Delivery (100 views): $0.10/month
- **Total: ~$0.25/month**

## Troubleshooting

### "Missing required env var: CLOUDFLARE_ACCOUNT_ID"
- Make sure you added both `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_STREAM_API_TOKEN` to `.env`
- Restart the development server

### "Cloudflare Stream API error: 401"
- Your API token might be invalid
- Go back to Cloudflare dashboard and create a new token
- Make sure it has "Stream: Edit" permissions

### "Migration failed"
- Check that B2 CORS is still configured (videos need to be publicly accessible for migration)
- Check server console for detailed error messages
- You can retry the migration - it won't duplicate videos

### Videos still not playing after migration
- Wait 2-3 minutes for Cloudflare to finish transcoding
- Check browser console for errors
- Verify `VIDEO_PROVIDER=cloudflare` is set in `.env`

## Next Steps

After migration is complete:

1. **Test thoroughly**: Make sure all videos play correctly
2. **Update production**: Add same env vars to your production environment
3. **Optional**: Keep B2 as backup, or delete old files to save costs

## Support

If you encounter issues:
1. Check server console logs for detailed error messages
2. Verify all environment variables are set correctly
3. Make sure you restarted the server after adding env vars

