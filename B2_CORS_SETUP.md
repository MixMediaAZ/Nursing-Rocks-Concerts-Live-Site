# B2 CORS Configuration Required

## Issue
Videos are failing to load due to CORS (Cross-Origin Resource Sharing) restrictions. Your B2 bucket needs to be configured to allow requests from your development and production domains.

## Solution: Configure B2 Bucket CORS Rules

### Step 1: Log into Backblaze B2
1. Go to https://secure.backblaze.com/
2. Log in to your account
3. Navigate to "Buckets" in the left sidebar
4. Click on your bucket name: `nursing-rocks-videos`

### Step 2: Add CORS Rules
1. Scroll down to the "Bucket Settings" section
2. Find "CORS Rules" and click "Add Rule" or "Edit CORS Rules"
3. Add the following CORS configuration:

```json
[
  {
    "corsRuleName": "allowLocalhost",
    "allowedOrigins": [
      "http://localhost:5000",
      "http://localhost:5006",
      "http://127.0.0.1:5000",
      "http://127.0.0.1:5006"
    ],
    "allowedOperations": [
      "s3_get",
      "s3_head"
    ],
    "allowedHeaders": [
      "*"
    ],
    "exposeHeaders": [],
    "maxAgeSeconds": 3600
  },
  {
    "corsRuleName": "allowProduction",
    "allowedOrigins": [
      "https://nursingrocks.com",
      "https://www.nursingrocks.com",
      "https://your-production-domain.com"
    ],
    "allowedOperations": [
      "s3_get",
      "s3_head"
    ],
    "allowedHeaders": [
      "*"
    ],
    "exposeHeaders": [],
    "maxAgeSeconds": 3600
  }
]
```

**Note**: Replace `https://your-production-domain.com` with your actual production domain(s).

### Step 3: Save and Wait
1. Click "Save" or "Update CORS Rules"
2. Wait 1-2 minutes for changes to propagate
3. Clear your browser cache and reload the page

## Alternative: Using B2 CLI

If you prefer using the command line:

```bash
# Install B2 CLI if not already installed
pip install b2

# Authenticate
b2 authorize-account <applicationKeyId> <applicationKey>

# Set CORS rules
b2 update-bucket --corsRules '[
  {
    "corsRuleName": "allowAll",
    "allowedOrigins": ["*"],
    "allowedOperations": ["s3_get", "s3_head"],
    "allowedHeaders": ["*"],
    "maxAgeSeconds": 3600
  }
]' nursing-rocks-videos allPublic
```

**Warning**: Using `"*"` for `allowedOrigins` allows all domains. This is convenient for development but less secure. Use specific domains for production.

## After Configuring CORS

1. Generate HLS manifests by clicking the "Generate HLS" button in the admin panel
2. Wait for HLS processing to complete
3. Reload the page
4. Videos should now play correctly

## Verification

To verify CORS is working, check the browser console. The error:
```
Access to fetch at 'https://f004.backblazeb2.com/...' has been blocked by CORS policy
```
should disappear after configuring CORS correctly.

