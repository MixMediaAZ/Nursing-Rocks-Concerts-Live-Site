# Thumbnail Generator - Quick Guide

## Problem

Video thumbnails show black screens with play buttons because poster images don't exist in B2 yet.

## Solution

**Browser-based thumbnail generator** that:
- Extracts frames from videos at 3 seconds
- No FFmpeg installation required
- Works directly in your browser
- Automatically uploads to B2

## How to Use

### 1. Go to Admin Dashboard
Navigate to: http://localhost:5000/admin

### 2. Click "Video Approval" Tab
You'll see a new card at the top: **"Thumbnail Generator"**

### 3. Click "Generate All Thumbnails"
The tool will:
- Load each video in the browser
- Seek to 3 seconds (or 10% of duration, whichever is smaller)
- Capture a frame
- Convert to JPEG
- Upload to B2 at `/poster/{video_id}.jpg`

### 4. Wait for Completion
You'll see:
- Progress bar showing percentage complete
- Success/error status for each video
- Toast notifications for each completed thumbnail

### 5. Refresh Your Pages
After generation completes:
- Hard refresh pages (`Ctrl + Shift + R`)
- Thumbnails will now show instead of black screens!

## What It Does

### Technical Process

1. **Loads Video** - Creates hidden video element
2. **Seeks to 3s** - Positions playhead at 3 seconds
3. **Captures Frame** - Draws video frame to canvas
4. **Converts to JPEG** - 85% quality, optimized size
5. **Uploads to B2** - Saves to `/poster/` folder

### B2 Storage Structure

```
nursing-rocks-videos/
├── video1.mp4          ← Original videos
├── video2.mp4
├── poster/
│   ├── b2_abc123.jpg   ← Generated thumbnails
│   ├── b2_def456.jpg
│   └── b2_ghi789.jpg
```

### Poster URL Format

```
https://f004.backblazeb2.com/file/nursing-rocks-videos/poster/{video_id}.jpg
```

## Benefits

✅ **No Software Installation** - Runs in browser  
✅ **Automatic Upload** - Uploads directly to B2  
✅ **High Quality** - JPEG 85% quality  
✅ **Smart Timing** - 3s or 10% of duration  
✅ **Batch Processing** - Handles all videos at once  
✅ **Progress Tracking** - See real-time progress  
✅ **Error Handling** - Continues if one video fails  

## Requirements

### Browser Requirements
- Modern browser (Chrome, Edge, Firefox, Safari)
- Must support:
  - HTML5 Video
  - Canvas API
  - Fetch API
  - Blob/File API

### CORS Configuration
Your B2 bucket must allow CORS (already configured in B2_CORS_SETUP.md):
- Allows video loading from localhost
- Required for canvas to capture frames

### Video Format
- MP4 format (H.264 codec)
- Accessible via HTTP/HTTPS
- Publicly readable or CORS-enabled

## Troubleshooting

### "Failed to load video"
**Cause:** CORS issue or video not accessible  
**Fix:** Check B2 CORS settings (see B2_CORS_SETUP.md)

### "Could not get canvas context"
**Cause:** Browser doesn't support canvas  
**Fix:** Use a modern browser (Chrome/Edge recommended)

### Black thumbnail generated
**Cause:** Video might start with black frame  
**Fix:** Thumbnails are captured at 3s to avoid this, but some videos might have black at 3s

### Slow generation
**Cause:** Large videos take time to load  
**Fix:** Normal behavior - each video needs to load enough data to seek to 3s

## After Generation

### View Results
1. Go to Videos page: http://localhost:5000/videos
2. All thumbnails should show video frames
3. No more black screens!

### If Still Black
1. Hard refresh: `Ctrl + Shift + R`
2. Clear browser cache
3. Check console for errors
4. Verify thumbnails uploaded to B2 (check B2 dashboard)

## Manual Alternative

If the generator doesn't work, you can manually create thumbnails:

### Using FFmpeg (Desktop)
```bash
# Extract frame at 3 seconds
ffmpeg -i video.mp4 -ss 00:00:03 -vframes 1 -q:v 2 thumbnail.jpg

# Upload to B2 using B2 CLI or web interface
# Save as: poster/{video_id}.jpg
```

### Using Online Tools
1. Use online video editor (Kapwing, Clideo, etc.)
2. Extract frame at 3 seconds
3. Download as JPEG
4. Upload to B2 at `poster/{video_id}.jpg`

## Performance

### Generation Speed
- ~5-10 seconds per video
- Depends on video size and internet speed
- 6 videos = ~1 minute total

### Thumbnail Size
- ~50-200KB per thumbnail (JPEG)
- Much smaller than video files
- Fast to load on pages

### Storage Cost
- Thumbnails: ~1MB total for 6 videos
- Negligible B2 storage cost
- ~$0.000005/month for thumbnails

## Best Practices

1. **Run once after uploading new videos**
2. **Re-run if you replace videos**
3. **Check results before closing admin panel**
4. **Keep browser tab active during generation**
5. **Don't close tab until 100% complete**

## Component Details

### Client Component
`client/src/components/admin/thumbnail-generator.tsx`
- React component with progress tracking
- Uses HTML5 video + canvas
- Uploads via fetch API

### Server Endpoint
`/api/admin/videos/upload-thumbnail`
- Receives JPEG blob from browser
- Uploads to B2 using S3 SDK
- Returns success/error status

---

**Ready to generate thumbnails! Go to Admin → Video Approval and click "Generate All Thumbnails"!** 🎬✨

