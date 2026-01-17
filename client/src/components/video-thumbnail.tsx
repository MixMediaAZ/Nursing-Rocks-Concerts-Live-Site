import React, { useState, useEffect, useRef } from 'react';
import { Play } from 'lucide-react';
import { HlsVideo } from './hls-video';

interface VideoThumbnailProps {
  videoUrl: string;
  posterUrl?: string;
  title?: string;
  duration?: string;
  className?: string;
  muted?: boolean;
  controls?: boolean;
  loop?: boolean;
  paused?: boolean; // External pause control
  autoPlayTrigger?: number; // When changed, triggers auto-play
  onVolumeChange?: (isMuted: boolean) => void; // Callback when user toggles mute/unmute
  onEnded?: () => void; // Callback when video ends
  showTitle?: boolean;
  showDuration?: boolean;
}

/**
 * VideoThumbnail - Shows a poster image with play button overlay
 * Only loads and plays the video when user clicks
 * Saves bandwidth and improves page load performance
 */
export function VideoThumbnail({
  videoUrl,
  posterUrl,
  title,
  duration,
  className = '',
  muted = true,
  controls = true,
  loop = false,
  paused = false,
  autoPlayTrigger,
  onVolumeChange,
  onEnded,
  showTitle = true,
  showDuration = true,
}: VideoThumbnailProps) {
  const containerRef = useRef<HTMLButtonElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Only load poster image once visible in viewport (saves data when many thumbnails are off-screen).
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    if (isVisible) return;

    const obs = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          setIsVisible(true);
          try {
            obs.disconnect();
          } catch {
            // ignore
          }
        }
      },
      { threshold: 0.1, rootMargin: "50px" },
    );

    obs.observe(el);
    return () => {
      try {
        obs.disconnect();
      } catch {
        // ignore
      }
    };
  }, [isVisible]);
  
  // Auto-play trigger: when autoPlayTrigger changes, start playing
  useEffect(() => {
    if (autoPlayTrigger !== undefined && autoPlayTrigger > 0 && !isPlaying) {
      setIsPlaying(true);
    }
  }, [autoPlayTrigger, isPlaying]);
  
  console.log('[VideoThumbnail] Rendering thumbnail:', { title, posterUrl, isPlaying });

  // If user clicked play, show the actual video player
  if (isPlaying) {
    return (
      <div className="relative w-full h-full beveled-video-frame">
        <HlsVideo
          src={videoUrl}
          poster={posterUrl}
          className={`w-full h-full ${className}`}
          autoPlay={true}
          muted={muted}
          controls={controls}
          loop={loop}
          paused={paused}
          onVolumeChange={onVolumeChange}
          onEnded={onEnded}
          objectFit="cover"
        />
      </div>
    );
  }

  // Show thumbnail with play button overlay
  return (
    <button
      type="button"
      ref={containerRef}
      className={`relative w-full h-full bg-black cursor-pointer group border-0 p-0 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black/30 ${className}`}
      onClick={() => setIsPlaying(true)}
      aria-label={title ? `Play ${title}` : "Play video"}
    >
      {/* Poster Image */}
      {isVisible && posterUrl && !imageError ? (
        <img
          src={posterUrl}
          alt={title || 'Video thumbnail'}
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
          loading="lazy"
        />
      ) : (
        // Fallback if no poster or image failed to load
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
          <div className="text-white/50 text-center">
            <Play className="w-16 h-16 mx-auto mb-2" />
            <p className="text-sm">Click to play</p>
          </div>
        </div>
      )}

      {/* Play Button Overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <div className="bg-white/90 rounded-full p-4 transform group-hover:scale-110 transition-transform duration-200">
          <Play className="w-8 h-8 text-black fill-current" />
        </div>
      </div>

      {/* Always visible play button for mobile (no hover) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none md:hidden">
        <div className="bg-black/60 rounded-full p-3">
          <Play className="w-6 h-6 text-white fill-current" />
        </div>
      </div>

      {/* Video Info Overlay */}
      {(showTitle || showDuration) && (title || duration) && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
          {showTitle && title && (
            <div className="beveled-text inline-block px-2 py-1 text-sm font-medium truncate">
              {title}
            </div>
          )}
          {showDuration && duration && (
            <div className="beveled-text inline-block px-2 py-1 text-xs mt-1">
              {duration}
            </div>
          )}
        </div>
      )}
    </button>
  );
}

