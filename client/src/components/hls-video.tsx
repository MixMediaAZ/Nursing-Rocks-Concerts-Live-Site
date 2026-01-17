import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";

type Props = {
  src: string; // master.m3u8
  className?: string;
  autoPlay?: boolean;
  muted?: boolean;
  controls?: boolean;
  loop?: boolean;
  poster?: string;
  onEnded?: () => void;
  onError?: (error: string) => void;
  onLoaded?: () => void;
  onVolumeChange?: (isMuted: boolean) => void;
};

export function HlsVideo({
  src,
  className = "",
  autoPlay = false,
  muted = true,
  controls = true,
  loop = false,
  poster,
  onEnded,
  onError,
  onLoaded,
  onVolumeChange,
}: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    const isNativeHLS = video.canPlayType("application/vnd.apple.mpegurl");
    const isHlsSupported = Hls.isSupported();

    // native HLS (Safari / iOS)
    if (isNativeHLS) {
      video.src = src;
      return;
    }

    if (!isHlsSupported) {
      video.src = src;
      return;
    }

    const hls = new Hls({
      // conservative defaults for stability
      enableWorker: true,
      lowLatencyMode: false,
    });
    
    hls.loadSource(src);
    hls.attachMedia(video);

    hls.on(Hls.Events.ERROR, (_evt, data) => {
      if (!data?.fatal) return;
      setHasError(true);
      onError?.(data?.details || "HLS playback error");
      try {
        hls.destroy();
      } catch {
        // ignore
      }
    });

    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      // Manifest parsed successfully
    });

    return () => {
      try {
        hls.destroy();
      } catch {
        // ignore
      }
    };
  }, [src, onError]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedData = () => {
      onLoaded?.();
    };
    const handleEnded = () => onEnded?.();
    const handleError = (e: Event) => {
      setHasError(true);
      onError?.("Failed to load video");
    };
    const handleVolume = () => onVolumeChange?.(video.muted);

    video.addEventListener("loadeddata", handleLoadedData);
    video.addEventListener("ended", handleEnded);
    video.addEventListener("error", handleError);
    video.addEventListener("volumechange", handleVolume);
    return () => {
      video.removeEventListener("loadeddata", handleLoadedData);
      video.removeEventListener("ended", handleEnded);
      video.removeEventListener("error", handleError);
      video.removeEventListener("volumechange", handleVolume);
    };
  }, [onLoaded, onEnded, onError, onVolumeChange, src]);

  if (hasError) {
    return (
      <div className={`flex flex-col items-center justify-center bg-black text-white text-sm p-4 ${className}`}>
        <p className="mb-2">Video unavailable</p>
        <button
          onClick={() => {
            setHasError(false);
            // Force reload by updating src
            if (videoRef.current) {
              videoRef.current.load();
            }
          }}
          className="text-xs underline hover:no-underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <video
      ref={videoRef}
      className={`w-full h-full object-contain ${className}`}
      autoPlay={autoPlay}
      muted={muted}
      controls={controls}
      loop={loop}
      playsInline
      preload="metadata"
      poster={poster}
      controlsList="nodownload"
      style={{
        maxWidth: '100%',
        maxHeight: '100%',
        width: 'auto',
        height: 'auto'
      }}
    />
  );
}
