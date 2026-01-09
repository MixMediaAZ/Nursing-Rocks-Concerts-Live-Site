import path from "path";
import {
  createPresignedPutUrl,
  getB2Bucket,
  listB2Objects,
  manifestUrlForVideoId,
  posterUrlForVideoId,
  publicUrlForKey,
  stableVideoIdFromKey,
} from "./b2-s3";
import type { VideoProvider, VideoResource } from "./provider";

function getSourcePrefix(): string {
  const p = process.env.VIDEO_SOURCE_PREFIX;
  if (!p) return "";
  return p.replace(/\/+$/, "");
}

function joinPrefix(prefix: string, key: string) {
  if (!prefix) return key.replace(/^\/+/, "");
  return `${prefix}/${key.replace(/^\/+/, "")}`;
}

export function createB2VideoProvider(): VideoProvider {
  return {
    id: "b2",

    async listSourceVideos(opts) {
      const prefix = opts?.prefix ?? getSourcePrefix();
      const objects = await listB2Objects(prefix || undefined);

      const resources: VideoResource[] = objects
        .filter((o) => o.key.toLowerCase().endsWith(".mp4"))
        .map((o) => {
          const videoId = stableVideoIdFromKey(o.key);
          const mp4Url = publicUrlForKey(o.key); // Direct MP4 URL for playback
          const created_at = o.lastModified || new Date(0).toISOString();
          const bytes = o.size ?? 0;
          return {
            public_id: videoId,
            asset_id: videoId,
            format: "mp4",
            resource_type: "video",
            created_at,
            bytes,
            url: mp4Url, // Direct MP4 URL (primary)
            secure_url: mp4Url, // Same as url
            asset_folder: prefix || null || undefined,
            hls_url: manifestUrlForVideoId(videoId), // Optional HLS (may not exist)
            poster_url: posterUrlForVideoId(videoId), // Optional poster (may not exist)
          };
        });

      // Newest first (Cloudinary-like ordering)
      resources.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
      return resources;
    },

    async createSourceUploadUrl(opts) {
      // Put new uploads under `VIDEO_SOURCE_PREFIX/thanks/` (or just `thanks/` if no prefix)
      const safeName = opts.filename.replace(/[^\w.\-() ]+/g, "_");
      const key = joinPrefix(getSourcePrefix(), path.posix.join("thanks", `${Date.now()}_${safeName}`));
      const presigned = await createPresignedPutUrl({ key, contentType: opts.contentType });
      return presigned;
    },

    getHlsUrl(videoId: string) {
      // HLS is optional - return manifest URL but it may not exist
      return manifestUrlForVideoId(videoId);
    },

    getPosterUrl(videoId: string) {
      // Poster is optional - return URL but it may not exist
      return posterUrlForVideoId(videoId);
    },
  };
}


