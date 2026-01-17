export type VideoProviderId = "b2";

export type VideoResource = {
  /** Provider-neutral ID stored in `approved_videos.public_id` */
  public_id: string;
  /** Stable ID field used by existing UI components */
  asset_id: string;
  /** Typically 'mp4' for source objects, 'hls' for packaged videos */
  format: string;
  resource_type: "video";
  created_at: string;
  bytes: number;
  asset_folder?: string;
  secure_url: string;
  url: string;
  /** Optional playback manifest URL (HLS) */
  hls_url?: string;
  /** Optional poster/thumbnail */
  poster_url?: string;
};

export type CreateUploadUrlResult = {
  url: string;
  key: string;
  bucket: string;
  expiresIn: number;
};

export interface VideoProvider {
  id: VideoProviderId;
  /** List source videos (MP4) available for processing/approval */
  listSourceVideos(opts?: { prefix?: string }): Promise<VideoResource[]>;
  /** Create a presigned upload URL for a new source video */
  createSourceUploadUrl(opts: { contentType: string; filename: string }): Promise<CreateUploadUrlResult>;
  /** Return public playback URL for HLS (master manifest) if it exists */
  getHlsUrl(videoId: string): string;
  /** Return public poster URL (may 404 if not generated yet) */
  getPosterUrl(videoId: string): string;
}


