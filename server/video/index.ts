import type { VideoProvider, VideoProviderId } from "./provider";
import { createB2VideoProvider } from "./b2-provider";
import { createCloudflareStreamProvider } from "./cloudflare-provider";

export function getVideoProviderId(): VideoProviderId {
  const provider = process.env.VIDEO_PROVIDER?.toLowerCase();
  if (provider === "cloudflare") return "cloudflare";
  return "b2"; // default to B2 for backwards compatibility
}

export function getVideoProvider(): VideoProvider {
  const providerId = getVideoProviderId();
  
  switch (providerId) {
    case "cloudflare":
      return createCloudflareStreamProvider();
    case "b2":
      return createB2VideoProvider();
    default:
      return createB2VideoProvider();
  }
}


