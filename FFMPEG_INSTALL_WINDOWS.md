# Install FFmpeg on Windows

## Why You Need This
HLS video processing requires FFmpeg to transcode MP4 files into HLS format. Without it, the "Generate HLS" button will fail.

## Quick Install (Recommended - Using Chocolatey)

If you have Chocolatey package manager:

```powershell
# Run PowerShell as Administrator
choco install ffmpeg
```

## Manual Install (If no Chocolatey)

### Step 1: Download FFmpeg
1. Go to https://www.gyan.dev/ffmpeg/builds/
2. Download **ffmpeg-release-essentials.zip** (not the full build)
3. Extract the ZIP file to `C:\ffmpeg`

### Step 2: Add to PATH
1. Press `Win + X` and select "System"
2. Click "Advanced system settings"
3. Click "Environment Variables"
4. Under "System variables", find and select "Path"
5. Click "Edit"
6. Click "New"
7. Add: `C:\ffmpeg\bin`
8. Click "OK" on all dialogs

### Step 3: Verify Installation
Open a **NEW** PowerShell window (important!) and run:

```powershell
ffmpeg -version
```

You should see FFmpeg version information. If you get "command not found", restart your computer and try again.

### Step 4: Restart Development Server
After installing FFmpeg, **restart your development server** for it to detect FFmpeg.

## Test HLS Processing

Once FFmpeg is installed:

1. Restart your development server (stop and start it)
2. Go to http://localhost:5000/admin
3. Click "Video Approval" tab
4. Click "Generate HLS" button
5. Check the server console for detailed "[HLS Packager]" logs
6. Processing should complete successfully

## Troubleshooting

**Error: "ffmpeg not found"**
- Make sure you added `C:\ffmpeg\bin` to PATH (not `C:\ffmpeg`)
- Restart your terminal/PowerShell
- Restart your development server
- Try running `ffmpeg -version` in a new terminal

**Error: "Command failed: ffmpeg..."**
- Check server console logs for specific FFmpeg error
- Video file might be corrupted
- Not enough disk space in temp directory

**Still not working?**
- Copy the full error message from the server console
- Share it for more specific help


