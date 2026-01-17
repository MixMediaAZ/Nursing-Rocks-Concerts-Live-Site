import React, { useState, useEffect, useCallback, useRef } from 'react';
import { HlsVideo } from "./hls-video";
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Play, Wifi, WifiOff } from 'lucide-react';
import { devLog } from '@/lib/dev';

export interface VideoSlideshowProps {
  videos: string[];  // Array of provider-neutral video IDs (b2_*)
  autoPlay?: boolean;
  muted?: boolean;
  controls?: boolean;
  interval?: number; // Time in milliseconds between slides
  className?: string;
  maxAutoPlays?: number; // Maximum number of videos to auto-play before switching to thumbnail mode (default: 3)
}

export function VideoSlideshow({
  videos,
  autoPlay = true,
  muted = true,
  controls = true,
  interval = 12000, // Default 12 seconds per video
  className = '',
  maxAutoPlays = 3 // Default: play 3 videos then switch to thumbnail mode
}: VideoSlideshowProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Track user's mute preference and interaction state
  const [userIsMuted, setUserIsMuted] = useState(true);
  const [hasInteracted, setHasInteracted] = useState(false);
  
  // Data saving: track play count and activate thumbnail mode after maxAutoPlays
  const [playCount, setPlayCount] = useState(0);
  // Load data saver preference from localStorage
  const [dataSaverActive, setDataSaverActive] = useState(() => {
    try {
      const saved = localStorage.getItem('videoDataSaverEnabled');
      return saved === 'true';
    } catch {
      return false;
    }
  });
  const [selectedVideoIndex, setSelectedVideoIndex] = useState<number | null>(null);
  
  // Persist data saver preference to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('videoDataSaverEnabled', String(dataSaverActive));
    } catch {
      // Ignore localStorage errors
    }
  }, [dataSaverActive]);
  
  // Fetch video resources to get direct MP4 URLs (HLS may not exist)
  const [videoUrls, setVideoUrls] = useState<Record<string, {url: string, poster?: string}>>({});
  useEffect(() => {
    fetch('/api/videos')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.resources)) {
          const urlMap: Record<string, {url: string, poster?: string}> = {};
          for (const v of data.resources) {
            urlMap[v.public_id] = { url: v.secure_url || v.url, poster: v.poster_url };
          }
          setVideoUrls(urlMap);
        }
      })
      .catch(() => {});
  }, []);
  
  // Function to go to next slide
  const nextSlide = useCallback(() => {
    setCurrentIndex((prevIndex) => 
      prevIndex === videos.length - 1 ? 0 : prevIndex + 1
    );
  }, [videos.length]);
  
  // Function to go to previous slide
  const prevSlide = useCallback(() => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? videos.length - 1 : prevIndex - 1
    );
  }, [videos.length]);
  
  // Control autoplay
  const toggleAutoplay = useCallback(() => {
    setIsPlaying(prev => !prev);
  }, []);
  
  // Handle video click for interactive control
  const handleVideoClick = useCallback(() => {
    if (!hasInteracted) {
      // First click: start slideshow + unmute
      setIsPlaying(true);
      setUserIsMuted(false);
      setHasInteracted(true);
      devLog('🎬 First click: Starting slideshow and unmuting audio');
    } else {
      // Subsequent clicks: toggle slideshow pause
      setIsPlaying(prev => {
        devLog(`🎬 Toggling slideshow: ${!prev ? 'playing' : 'paused'}`);
        return !prev;
      });
    }
  }, [hasInteracted]);
  
  // Handle volume change from transport controls
  const handleVolumeChange = useCallback((isMuted: boolean) => {
    setUserIsMuted(isMuted);
    devLog(`🔊 Volume changed via controls: ${isMuted ? 'muted' : 'unmuted'}`);
  }, []);
  
  // Handle video completion - advance to next video
  const handleVideoEnded = useCallback(() => {
    devLog('🎬 Video ended, advancing to next');
    if (isPlaying) {
      const newCount = playCount + 1;
      setPlayCount(newCount);
      
      // Activate data saver mode after maxAutoPlays
      if (newCount >= maxAutoPlays) {
        setDataSaverActive(true);
        setIsPlaying(false);
        devLog(`💾 Data saver activated after ${newCount} videos`);
      } else {
        nextSlide();
      }
    }
  }, [isPlaying, nextSlide, playCount, maxAutoPlays]);
  
  // Fallback timer in case video doesn't trigger onEnded (max duration per video)
  useEffect(() => {
    if (isPlaying && !dataSaverActive) {
      timerRef.current = setTimeout(() => {
        devLog('⏱️ Fallback timer triggered - advancing to next video');
        const newCount = playCount + 1;
        setPlayCount(newCount);
        
        // Activate data saver mode after maxAutoPlays
        if (newCount >= maxAutoPlays) {
          setDataSaverActive(true);
          setIsPlaying(false);
          devLog(`💾 Data saver activated after ${newCount} videos`);
        } else {
          nextSlide();
        }
      }, interval);
    }
    
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [isPlaying, nextSlide, interval, currentIndex, playCount, maxAutoPlays, dataSaverActive]);
  
  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        nextSlide();
      } else if (e.key === 'ArrowLeft') {
        prevSlide();
      } else if (e.key === ' ') {
        toggleAutoplay();
        e.preventDefault();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [nextSlide, prevSlide, toggleAutoplay]);
  
  // Handle thumbnail click to resume playback - MUST be before any early returns
  const handleThumbnailClick = useCallback((index: number) => {
    setSelectedVideoIndex(index);
    setCurrentIndex(index);
    setDataSaverActive(false);
    setIsPlaying(true);
    setHasInteracted(true);
  }, []);
  
  // Toggle data saver mode manually
  const toggleDataSaver = useCallback(() => {
    setDataSaverActive(prev => {
      const newValue = !prev;
      if (newValue) {
        setIsPlaying(false);
        setPlayCount(0); // Reset play count when manually enabling
      }
      return newValue;
    });
  }, []);
  
  // Don't render if we have no videos or URLs not yet loaded
  if (videos.length === 0 || Object.keys(videoUrls).length === 0) {
    return (
      <div className={`flex items-center justify-center bg-muted h-64 rounded-lg ${className}`}>
        <div className="text-center">
          <div className="animate-pulse text-muted-foreground mb-2">Loading videos...</div>
          <div className="text-xs text-muted-foreground">Please wait</div>
        </div>
      </div>
    );
  }

  const currentId = videos[currentIndex];
  const videoData = videoUrls[currentId];
  // Use direct MP4 URL (secure_url) - HLS manifests may not exist
  const videoUrl = videoData?.url || "";
  const posterUrl = videoData?.poster;
  
  // Show error state if video URL is missing
  if (!videoUrl && currentId) {
    return (
      <div className={`flex flex-col items-center justify-center bg-muted h-64 rounded-lg ${className}`}>
        <div className="text-center">
          <p className="text-muted-foreground mb-2">Video not available</p>
          <p className="text-xs text-muted-foreground">The video may still be processing</p>
        </div>
      </div>
    );
  }

  // Data saver mode: show thumbnail grid instead of active player
  if (dataSaverActive) {
    return (
      <div className={`relative ${className}`}>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {videos.map((videoId, index) => {
            const vidData = videoUrls[videoId];
            const isSelected = selectedVideoIndex === index;
            
            return (
              <div
                key={videoId}
                className={`relative aspect-video bg-black rounded-lg overflow-hidden cursor-pointer transition-all ${
                  isSelected ? 'ring-2 ring-primary' : 'hover:ring-1 hover:ring-white/50'
                }`}
                onClick={() => handleThumbnailClick(index)}
              >
                {vidData?.poster ? (
                  <img
                    src={vidData.poster}
                    alt={`Video ${index + 1}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-900">
                    <Play className="w-8 h-8 text-white/50" />
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity">
                  <div className="bg-white/90 rounded-full p-3">
                    <Play className="w-6 h-6 text-black fill-current" />
                  </div>
                </div>
                {isSelected && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <div className="text-white text-sm font-medium">Loading...</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className={`relative group ${className}`}>
      {/* Current video - key prop forces remount on video change */}
      <div 
        className="aspect-video w-full bg-black rounded-lg overflow-hidden cursor-pointer"
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '100%'
        }}
        onClick={handleVideoClick}
      >
        <HlsVideo
          src={videoUrl}
          poster={posterUrl}
          className="w-full h-full"
          autoPlay={autoPlay}
          muted={userIsMuted}
          controls={controls}
          loop={false}
          onEnded={handleVideoEnded}
          onError={(error) => devLog("HLS video error:", error)}
          onLoaded={() => devLog("HLS video loaded:", currentId)}
          onVolumeChange={handleVolumeChange}
        />
      </div>
      
      {/* Paused state visual feedback */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
          <Play className="h-16 w-16 text-white opacity-70" />
        </div>
      )}
      
      {/* Navigation controls */}
      <div className="absolute inset-0 flex items-center justify-between p-4 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <Button 
          variant="secondary" 
          size="icon" 
          className="rounded-full bg-black/50 hover:bg-black/70 text-white pointer-events-auto"
          onClick={prevSlide}
          aria-label="Previous video"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        
        <Button 
          variant="secondary" 
          size="icon" 
          className="rounded-full bg-black/50 hover:bg-black/70 text-white pointer-events-auto"
          onClick={nextSlide}
          aria-label="Next video"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
      
      {/* Progress indicators */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
        {videos.map((_, index) => (
          <button
            key={index}
            className={`w-2 h-2 rounded-full ${
              index === currentIndex 
                ? 'bg-white' 
                : 'bg-white/50 hover:bg-white/80'
            } transition-colors duration-300`}
            onClick={() => setCurrentIndex(index)}
            aria-label={`Go to video ${index + 1}`}
          />
        ))}
      </div>
      
    </div>
  );
}