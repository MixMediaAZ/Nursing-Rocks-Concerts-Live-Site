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
  objectFit?: 'contain' | 'cover'; // How video fills container
  paused?: boolean; // External pause control
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
  objectFit = 'cover', // Default to 'cover' for better visual appearance
  paused = false,
  onEnded,
  onError,
  onLoaded,
  onVolumeChange,
}: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [hasError, setHasError] = useState(false);
  const [detectedObjectFit, setDetectedObjectFit] = useState<'cover' | 'contain'>(objectFit);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Priority 1: Direct MP4 playback (most common, most reliable)
    if (src.endsWith('.mp4')) {
      console.log("[Video] Using direct MP4 playback:", src);
      video.src = src;
      return;
    }

    // Priority 2: Native HLS support (Safari / iOS)
    if (src.endsWith('.m3u8') && video.canPlayType("application/vnd.apple.mpegurl")) {
      console.log("[Video] Using native HLS playback:", src);
      video.src = src;
      return;
    }

    // Priority 3: HLS.js for browsers that need it
    if (src.endsWith('.m3u8') && Hls.isSupported()) {
      console.log("[Video] Using HLS.js playback:", src);
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
      });
      hls.loadSource(src);
      hls.attachMedia(video);

      hls.on(Hls.Events.ERROR, (_evt, data) => {
        console.error("[HLS] HLS.js error:", {
          src,
          type: data?.type,
          details: data?.details,
          fatal: data?.fatal,
        });
        if (!data?.fatal) return;
        setHasError(true);
        onError?.(data?.details || "HLS playback error");
        try {
          hls.destroy();
        } catch {
          // ignore
        }
      });

      return () => {
        try {
          hls.destroy();
        } catch {
          // ignore
        }
      };
    }

    // Fallback: Try direct playback
    console.log("[Video] Using fallback direct playback:", src);
    video.src = src;
  }, [src, onError]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedData = () => {
      // Auto-detect portrait vs landscape videos and adjust object-fit accordingly
      if (video && video.videoWidth > 0 && video.videoHeight > 0) {
        const aspectRatio = video.videoWidth / video.videoHeight;
        // Portrait videos (height > width, aspect ratio < 1) should use 'contain' to avoid cropping
        // Landscape videos (width > height, aspect ratio > 1) can use 'cover' for better fill
        const shouldUseContain = aspectRatio < 1;
        setDetectedObjectFit(shouldUseContain ? 'contain' : objectFit);
      }
      onLoaded?.();
    };
    const handleEnded = () => onEnded?.();
    const handleError = (e: Event) => {
      const target = e.target as HTMLVideoElement;
      console.error("[HLS] Video element error:", {
        src,
        error: target?.error,
        networkState: target?.networkState,
        readyState: target?.readyState,
      });
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

  // Handle external pause control
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    
    if (paused) {
      video.pause();
    } else if (autoPlay && !video.paused) {
      // Only resume if autoPlay is true and video was playing
      video.play().catch((err) => {
        console.warn("[Video] Auto-play prevented:", err);
      });
    }
  }, [paused, autoPlay]);

  // Sync muted prop with video element
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    
    if (video.muted !== muted) {
      video.muted = muted;
    }
  }, [muted, src]);

  if (hasError) {
    return <div className={`flex items-center justify-center bg-black text-white text-sm ${className}`}>Video unavailable</div>;
  }

  return (
    <video
      ref={videoRef}
      className={`w-full h-full ${detectedObjectFit === 'cover' ? 'object-cover' : 'object-contain'} ${className}`}
      autoPlay={autoPlay}
      muted={muted}
      controls={controls}
      controlsList={controls ? "nodownload" : undefined}
      loop={loop}
      playsInline
      preload="metadata"
      poster={poster}
      crossOrigin="anonymous"
      style={{ zIndex: 1, position: 'relative' }}
    />
  );
}


