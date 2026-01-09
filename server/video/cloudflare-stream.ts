/**
 * Cloudflare Stream API client
 * https://developers.cloudflare.com/stream/
 */

function requiredEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return v;
}

export function getCloudflareAccountId(): string {
  return requiredEnv("CLOUDFLARE_ACCOUNT_ID");
}

export function getCloudflareStreamToken(): string {
  return requiredEnv("CLOUDFLARE_STREAM_API_TOKEN");
}

export type CloudflareStreamVideo = {
  uid: string;
  thumbnail: string;
  thumbnailTimestampPct: number;
  readyToStream: boolean;
  status: {
    state: "queued" | "inprogress" | "ready" | "error";
    pctComplete: string;
    errorReasonCode?: string;
    errorReasonText?: string;
  };
  meta: {
    name?: string;
    [key: string]: any;
  };
  created: string;
  modified: string;
  size?: number;
  preview: string;
  allowedOrigins?: string[];
  requireSignedURLs: boolean;
  uploaded: string;
  uploadExpiry: string | null;
  maxSizeBytes?: number;
  maxDurationSeconds?: number;
  duration: number;
  input: {
    width?: number;
    height?: number;
  };
  playback: {
    hls: string;
    dash: string;
  };
  watermark?: {
    uid: string;
  };
};

type CloudflareStreamListResponse = {
  result: CloudflareStreamVideo[];
  success: boolean;
  errors: any[];
  messages: any[];
};

type CloudflareStreamUploadResponse = {
  result: {
    uid: string;
    uploadURL: string;
  };
  success: boolean;
  errors: any[];
  messages: any[];
};

/**
 * List all videos in Cloudflare Stream
 */
export async function listCloudflareVideos(): Promise<CloudflareStreamVideo[]> {
  const accountId = getCloudflareAccountId();
  const token = getCloudflareStreamToken();

  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream`;
  
  const response = await fetch(url, {
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Cloudflare Stream API error: ${response.status} ${errorText}`);
  }

  const data: CloudflareStreamListResponse = await response.json();
  
  if (!data.success) {
    throw new Error(`Cloudflare Stream API failed: ${JSON.stringify(data.errors)}`);
  }

  return data.result;
}

/**
 * Get a single video from Cloudflare Stream
 */
export async function getCloudflareVideo(videoId: string): Promise<CloudflareStreamVideo> {
  const accountId = getCloudflareAccountId();
  const token = getCloudflareStreamToken();

  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/${videoId}`;
  
  const response = await fetch(url, {
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Cloudflare Stream API error: ${response.status} ${errorText}`);
  }

  const data: { result: CloudflareStreamVideo; success: boolean; errors: any[] } = await response.json();
  
  if (!data.success) {
    throw new Error(`Cloudflare Stream API failed: ${JSON.stringify(data.errors)}`);
  }

  return data.result;
}

/**
 * Create a direct upload URL for uploading videos
 */
export async function createCloudflareUploadUrl(opts: {
  maxDurationSeconds?: number;
  metadata?: Record<string, string>;
}): Promise<{ uploadURL: string; uid: string }> {
  const accountId = getCloudflareAccountId();
  const token = getCloudflareStreamToken();

  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/direct_upload`;
  
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      maxDurationSeconds: opts.maxDurationSeconds || 3600, // 1 hour default
      meta: opts.metadata || {},
      requireSignedURLs: false,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Cloudflare Stream upload URL creation failed: ${response.status} ${errorText}`);
  }

  const data: CloudflareStreamUploadResponse = await response.json();
  
  if (!data.success) {
    throw new Error(`Cloudflare Stream API failed: ${JSON.stringify(data.errors)}`);
  }

  return {
    uploadURL: data.result.uploadURL,
    uid: data.result.uid,
  };
}

/**
 * Upload a video from a URL (e.g., from B2)
 */
export async function uploadVideoFromUrl(opts: {
  url: string;
  name?: string;
  metadata?: Record<string, string>;
}): Promise<CloudflareStreamVideo> {
  const accountId = getCloudflareAccountId();
  const token = getCloudflareStreamToken();

  const apiUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/copy`;
  
  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url: opts.url,
      meta: {
        name: opts.name || "Nursing Rocks Video",
        ...opts.metadata,
      },
      requireSignedURLs: false,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Cloudflare Stream upload from URL failed: ${response.status} ${errorText}`);
  }

  const data: { result: CloudflareStreamVideo; success: boolean; errors: any[] } = await response.json();
  
  if (!data.success) {
    throw new Error(`Cloudflare Stream API failed: ${JSON.stringify(data.errors)}`);
  }

  return data.result;
}

/**
 * Delete a video from Cloudflare Stream
 */
export async function deleteCloudflareVideo(videoId: string): Promise<void> {
  const accountId = getCloudflareAccountId();
  const token = getCloudflareStreamToken();

  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/${videoId}`;
  
  const response = await fetch(url, {
    method: "DELETE",
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Cloudflare Stream delete failed: ${response.status} ${errorText}`);
  }
}

