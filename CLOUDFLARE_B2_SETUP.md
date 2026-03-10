# Cloudflare + Backblaze B2 Setup Guide

This guide explains how to set up Cloudflare in front of your Backblaze B2 bucket to reduce bandwidth costs. **Backblaze has a free bandwidth alliance with Cloudflare**, meaning egress from B2 to Cloudflare is FREE.

## Benefits

- **Free egress** from B2 to Cloudflare (saves on B2 Class C API calls)
- **Edge caching** - Videos cached at Cloudflare's global edge network
- **Faster delivery** - Closer to end users
- **DDoS protection** - Built into Cloudflare
- **No code changes required** - Only configuration

## Prerequisites

1. Cloudflare account (free tier works)
2. Domain name (or subdomain) you control
3. Backblaze B2 bucket with videos already uploaded

## Step-by-Step Setup

### 1. Get Your B2 Friendly URL

1. Log into Backblaze B2
2. Go to your bucket settings
3. Find the "Friendly URL" - it looks like:
   ```
   https://f005.backblazeb2.com/file/nursing-rocks-videos/
   ```
4. Copy this URL (without trailing slash for now)

### 2. Create Cloudflare DNS Record

**IMPORTANT**: CNAME targets cannot include paths. We'll use just the domain, then add the path with Transform Rules.

1. Log into Cloudflare dashboard
2. Select your domain (or add it if not already added)
3. Go to **DNS** → **Records**
4. Click **Add record**
5. Configure:
   - **Type**: `CNAME`
   - **Name**: `videos` (or `cdn` or `media` - your choice)
   - **Target**: `f005.backblazeb2.com` (ONLY the domain, NO path - e.g., just `f005.backblazeb2.com`)
   - **Proxy status**: ✅ **Proxied** (orange cloud icon - CRITICAL!)
   - **TTL**: Auto
6. Click **Save**

**Note**: Extract just the domain from your B2 friendly URL. If your URL is `https://f005.backblazeb2.com/file/nursing-rocks-videos/`, use only `f005.backblazeb2.com` as the target.

### 3. Configure Transform Rule (Add B2 Path)

**IMPORTANT**: Since CNAME targets can't include paths, we need to rewrite the request URL to include the B2 bucket path using Cloudflare Transform Rules.

1. In Cloudflare dashboard, go to **Rules** → **Transform Rules** → **Modify Request URL**
2. Click **Create rule**
3. Name: "B2 Path Rewrite"
4. Configure:
   - **When incoming requests match**:
     - Field: `Hostname`
     - Operator: `equals`
     - Value: `videos.yourdomain.com` (your subdomain from step 2)
   - **Then**:
     - **Path**: `Rewrite to dynamic`
     - **Expression**: `concat("/file/nursing-rocks-videos", http.request.uri.path)`
       - **Replace `nursing-rocks-videos` with your actual bucket name**
       - This adds `/file/bucket-name` to the beginning of all request paths
5. Click **Deploy**

**How it works**: 
- Request: `videos.yourdomain.com/poster/video123.webp`
- Transform Rule rewrites to: `f005.backblazeb2.com/file/nursing-rocks-videos/poster/video123.webp`
- Cloudflare proxies the request to B2 with the correct path

**Note**: If your `VIDEO_CDN_BASE_URL` already includes `/file/bucket-name`, you can skip this step and use that full URL in the environment variable. The Transform Rule is only needed if you want a cleaner subdomain without the path.

### 4. Configure Cloudflare Caching Rules

1. In Cloudflare dashboard, go to **Rules** → **Cache Rules**
2. Click **Create rule**
3. Name: "Video Content Caching"
4. Configure:
   - **When incoming requests match**:
     - Field: `URI Path`
     - Operator: `contains`
     - Value: `/file/nursing-rocks-videos/` (your B2 path)
   - **Then**:
     - **Cache status**: `Cache`
     - **Edge TTL**: `1 month` (or `1 year` for static videos)
     - **Browser TTL**: `1 month`
5. Click **Deploy**

### 5. Configure Cloudflare Page Rules (Alternative)

If Cache Rules don't work, use Page Rules:

1. Go to **Rules** → **Page Rules**
2. Click **Create Page Rule**
3. URL pattern: `videos.yourdomain.com/file/*` (adjust to match your setup)
4. Settings:
   - **Cache Level**: `Cache Everything`
   - **Edge Cache TTL**: `1 month`
   - **Browser Cache TTL**: `1 month`
5. Click **Save and Deploy**

### 6. Update Vercel Environment Variable

1. Go to Vercel Dashboard → Your Project → **Settings** → **Environment Variables**
2. Find `VIDEO_CDN_BASE_URL`
3. Update it to your Cloudflare URL (NO `/file/bucket-name` path - Transform Rule handles that):
   ```
   https://videos.yourdomain.com
   ```
   (Replace `videos.yourdomain.com` with your actual subdomain)
   
   **Important**: The Transform Rule (Step 3) will automatically add `/file/nursing-rocks-videos` to all requests, so don't include it in the environment variable.
4. **Important**: Set for **Production**, **Preview**, and **Development** environments
5. Click **Save** for each environment
6. **Redeploy** your Vercel project (or wait for next auto-deploy)

### 7. Verify Setup

1. Wait 5-10 minutes for DNS propagation
2. Test in browser:
   ```
   https://videos.yourdomain.com/file/nursing-rocks-videos/poster/some-video-id.webp
   ```
3. Check Cloudflare Analytics:
   - Go to **Analytics** → **Web Traffic**
   - You should see requests coming through Cloudflare
4. Check response headers:
   - Open browser DevTools → Network tab
   - Look for `CF-Cache-Status: HIT` (means cached)
   - Or `CF-Cache-Status: MISS` (first request, will cache next time)

## Troubleshooting

### Videos Not Loading

- **Check DNS**: Ensure CNAME record is **Proxied** (orange cloud)
- **Check Transform Rule**: Verify the path rewrite rule is active and matches your bucket name
- **Check URL**: Verify `VIDEO_CDN_BASE_URL` matches your Cloudflare subdomain (without `/file/bucket-name`)
- **Wait**: DNS can take up to 24 hours (usually 5-10 minutes)

### CNAME Record Error: "Content for CNAME record is invalid"

This happens if you try to include a path in the CNAME target. **Solution**:
- CNAME target must be ONLY the domain: `f005.backblazeb2.com`
- Use Transform Rules (Step 3) to add the `/file/bucket-name/` path
- Do NOT include `/file/` or bucket name in the CNAME target

### Still Seeing B2 Direct Traffic

- **Check Cloudflare Analytics**: Go to Analytics → Web Traffic
- **Verify CNAME**: Ensure it points to correct B2 domain (domain only, no path)
- **Check Transform Rule**: Ensure path rewrite rule is active and bucket name is correct
- **Check Cache Rules**: Ensure rules are active and matching

### CORS Errors

- **B2 CORS Settings**: Update B2 bucket CORS to allow your Cloudflare domain:
  ```json
  {
    "corsRules": [{
      "corsRuleName": "allowCloudflare",
      "allowedOrigins": [
        "https://videos.yourdomain.com",
        "https://yourdomain.com"
      ],
      "allowedOperations": ["b2_download_file_by_name"],
      "allowedHeaders": ["range", "authorization"],
      "exposeHeaders": ["content-length", "content-range"],
      "maxAgeSeconds": 3600
    }]
  }
  ```

## Cost Savings

- **Before**: Every video request = B2 Class C API call + bandwidth
- **After**: First request = B2 → Cloudflare (FREE), subsequent = Cloudflare cache (FREE)
- **Estimated savings**: 70-90% reduction in B2 costs for video delivery

## Notes

- Cloudflare free tier includes:
  - Unlimited bandwidth
  - DDoS protection
  - SSL certificates
  - Basic caching
- For high traffic, consider Cloudflare Pro ($20/month) for:
  - Better caching rules
  - Image optimization
  - More analytics

## Rollback Plan

If something goes wrong:

1. Revert `VIDEO_CDN_BASE_URL` in Vercel to original B2 URL
2. Redeploy Vercel project
3. Site will work immediately (no DNS wait)

---

**No code changes required** - This is purely configuration. Your existing code will work once the environment variable is updated.
