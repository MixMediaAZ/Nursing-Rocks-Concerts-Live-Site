import type { VideoProvider, VideoResource, CreateUploadUrlResult } from "./provider";
import {
  listCloudflareVideos,
  createCloudflareUploadUrl,
  type CloudflareStreamVideo,
} from "./cloudflare-stream";

/**
 * Convert Cloudflare Stream video to VideoResource format
 */
function toVideoResource(video: CloudflareStreamVideo): VideoResource {
  return {
    public_id: video.uid,
    asset_id: video.uid,
    format: "stream",
    resource_type: "video",
    created_at: video.created,
    bytes: video.size || 0,
    url: video.playback.hls,
    secure_url: video.playback.hls,
    hls_url: video.playback.hls,
    poster_url: video.thumbnail,
    asset_folder: video.meta.folder,
  };
}

export function createCloudflareStreamProvider(): VideoProvider {
  return {
    id: "cloudflare",

    async listSourceVideos() {
      const videos = await listCloudflareVideos();
      
      // Filter to only ready videos
      const readyVideos = videos.filter(v => v.readyToStream && v.status.state === "ready");
      
      const resources: VideoResource[] = readyVideos.map(toVideoResource);
      
      // Newest first (Cloudinary-like ordering)
      resources.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
      
      return resources;
    },

    async createSourceUploadUrl(opts) {
      const { uploadURL, uid } = await createCloudflareUploadUrl({
        maxDurationSeconds: 3600, // 1 hour max
        metadata: {
          filename: opts.filename,
          uploadedAt: new Date().toISOString(),
        },
      });

      return {
        url: uploadURL,
        key: uid,
        bucket: "cloudflare-stream",
        expiresIn: 3600,
      };
    },

    getHlsUrl(videoId: string) {
      // Cloudflare Stream HLS URL format
      return `https://customer-${process.env.CLOUDFLARE_ACCOUNT_ID?.substring(0, 16)}.cloudflarestream.com/${videoId}/manifest/video.m3u8`;
    },

    getPosterUrl(videoId: string) {
      // Cloudflare Stream thumbnail URL format
      return `https://customer-${process.env.CLOUDFLARE_ACCOUNT_ID?.substring(0, 16)}.cloudflarestream.com/${videoId}/thumbnails/thumbnail.jpg`;
    },
  };
}

