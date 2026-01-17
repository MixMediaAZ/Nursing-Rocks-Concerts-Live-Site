import type { VideoProvider, VideoProviderId } from "./provider";
import { createB2VideoProvider } from "./b2-provider";

export function getVideoProviderId(): VideoProviderId {
  return "b2";
}

export function getVideoProvider(): VideoProvider {
  return createB2VideoProvider();
}


