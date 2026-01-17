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
