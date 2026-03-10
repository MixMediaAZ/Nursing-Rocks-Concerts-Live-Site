type VideoListResponse = {
  success: boolean;
  resources: any[];
  total: number;
};

let cachedResponse: VideoListResponse | null = null;
let cachedAt = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;

export async function fetchVideoListCached(): Promise<VideoListResponse> {
  const now = Date.now();
  if (cachedResponse && now - cachedAt < CACHE_TTL_MS) {
    return cachedResponse;
  }

  const response = await fetch("/api/videos");
  const data = (await response.json()) as VideoListResponse;

  if (data?.success) {
    cachedResponse = data;
    cachedAt = now;
  }

  return data;
}

export function clearVideoListCache() {
  cachedResponse = null;
  cachedAt = 0;
}
