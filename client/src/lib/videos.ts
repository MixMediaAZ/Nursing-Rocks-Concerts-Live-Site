export interface VideoResource {
  public_id: string;
  asset_id: string;
  format: string;
  resource_type: string;
  created_at: string;
  bytes: number;
  url: string; // Direct playback URL (MP4 or HLS)
  secure_url: string;
  hls_url?: string;
  poster_url?: string;
  asset_folder?: string;
}

export async function fetchApprovedVideos(folder?: string): Promise<string[]> {
  try {
    const url = folder ? `/api/videos?folder=${encodeURIComponent(folder)}` : "/api/videos";
    const resp = await fetch(url);
    if (!resp.ok) return [];
    const data = await resp.json().catch(() => ({}));
    const resources = Array.isArray(data?.resources) ? data.resources : [];
    return resources.map((r: any) => r.public_id).filter((id: any) => typeof id === "string");
  } catch (e) {
    console.error("Error fetching approved videos:", e);
    return [];
  }
}

export async function fetchApprovedVideoResources(folder?: string): Promise<VideoResource[]> {
  try {
    const url = folder ? `/api/videos?folder=${encodeURIComponent(folder)}` : "/api/videos";
    const resp = await fetch(url);
    if (!resp.ok) return [];
    const data = await resp.json().catch(() => ({}));
    const resources = Array.isArray(data?.resources) ? data.resources : [];
    return resources;
  } catch (e) {
    console.error("Error fetching approved video resources:", e);
    return [];
  }
}


