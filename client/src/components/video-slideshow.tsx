import React, { useState, useEffect, useCallback, useRef } from 'react';
import { HlsVideo } from "./hls-video";
import { ResponsiveVideoFrame } from "./responsive-video-frame";
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
  muted = false, // Changed: audio on by default
  controls = true,
  interval = 12000, // Default 12 seconds per video
  className = '',
  maxAutoPlays = 3 // Default: play 3 videos then return to thumbnail mode
}: VideoSlideshowProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false); // Start false (thumbnail mode)
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const thumbnailTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Track user's mute preference and interaction state
  const [userIsMuted, setUserIsMuted] = useState(false); // Changed: audio on by default
  const [hasInteracted, setHasInteracted] = useState(false);
  
  // Track play count and activate thumbnail mode after maxAutoPlays
  const [playCount, setPlayCount] = useState(0);
  // Start in thumbnail mode (one large thumbnail, auto-advancing)
  const [thumbnailMode, setThumbnailMode] = useState(true);
  const [selectedVideoIndex, setSelectedVideoIndex] = useState<number | null>(null);
  
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
      .catch((error) => {
        console.error('Error fetching videos:', error);
      });
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
  
  // Auto-advance thumbnails when in thumbnail mode
  useEffect(() => {
    if (thumbnailMode && !isPlaying) {
      thumbnailTimerRef.current = setTimeout(() => {
        nextSlide();
      }, 3000); // Auto-advance thumbnails every 3 seconds
    }
    
    return () => {
      if (thumbnailTimerRef.current) {
        clearTimeout(thumbnailTimerRef.current);
      }
    };
  }, [thumbnailMode, isPlaying, currentIndex, videos.length, nextSlide]);
  
  // Handle thumbnail click - play that video
  const handleThumbnailClick = useCallback((index: number) => {
    setSelectedVideoIndex(index);
    setCurrentIndex(index);
    setThumbnailMode(false);
    setIsPlaying(true);
    setUserIsMuted(false); // Unmuted when user clicks
    setHasInteracted(true);
    setPlayCount(0); // Reset play count when starting new sequence
    devLog(`🎬 Thumbnail clicked: Starting video ${index + 1}`);
  }, []);
  
  // Handle video click for interactive control (pause/play toggle)
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
    if (isPlaying && !thumbnailMode) {
      const newCount = playCount + 1;
      setPlayCount(newCount);
      
      // Return to thumbnail mode after maxAutoPlays
      if (newCount >= maxAutoPlays) {
        setThumbnailMode(true);
        setIsPlaying(false);
        setPlayCount(0); // Reset for next sequence
        devLog(`🖼️ Returned to thumbnail carousel after ${newCount} videos`);
      } else {
        nextSlide();
      }
    }
  }, [isPlaying, thumbnailMode, nextSlide, playCount, maxAutoPlays]);
  
  // Fallback timer for video advancement
  useEffect(() => {
    if (isPlaying && !thumbnailMode) {
      timerRef.current = setTimeout(() => {
        devLog('⏱️ Fallback timer triggered - advancing to next video');
        const newCount = playCount + 1;
        setPlayCount(newCount);
        
        if (newCount >= maxAutoPlays) {
          setThumbnailMode(true);
          setIsPlaying(false);
          setPlayCount(0);
          devLog(`🖼️ Returned to thumbnail carousel after ${newCount} videos`);
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
  }, [isPlaying, thumbnailMode, nextSlide, interval, currentIndex, playCount, maxAutoPlays]);
  
  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        if (thumbnailMode) {
          nextSlide();
        } else {
          nextSlide();
        }
      } else if (e.key === 'ArrowLeft') {
        if (thumbnailMode) {
          prevSlide();
        } else {
          prevSlide();
        }
      } else if (e.key === ' ') {
        if (thumbnailMode) {
          handleThumbnailClick(currentIndex);
        } else {
          setIsPlaying(prev => !prev);
        }
        e.preventDefault();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [nextSlide, prevSlide, thumbnailMode, currentIndex, handleThumbnailClick]);
  
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

  // Thumbnail mode: show one large thumbnail that auto-advances
  if (thumbnailMode) {
    const currentId = videos[currentIndex];
    const videoData = videoUrls[currentId];
    const posterUrl = videoData?.poster;
    
    return (
      <div className={`relative group ${className}`}>
        <div 
          className="w-full rounded-lg overflow-hidden cursor-pointer"
          onClick={() => handleThumbnailClick(currentIndex)}
        >
          <ResponsiveVideoFrame className="rounded-lg">
            {posterUrl ? (
              <img
                src={posterUrl}
                alt={`Video ${currentIndex + 1}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-900">
                <Play className="w-16 h-16 text-white/50" />
              </div>
            )}
          </ResponsiveVideoFrame>
        </div>
        
        {/* Play button overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <div className="bg-white/90 rounded-full p-6">
            <Play className="w-12 h-12 text-black fill-current" />
          </div>
        </div>
        
        {/* Navigation controls */}
        <div className="absolute inset-0 flex items-center justify-between p-4 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <Button 
            variant="secondary" 
            size="icon" 
            className="rounded-full bg-black/50 hover:bg-black/70 text-white pointer-events-auto"
            onClick={(e) => {
              e.stopPropagation();
              prevSlide();
            }}
            aria-label="Previous thumbnail"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          
          <Button 
            variant="secondary" 
            size="icon" 
            className="rounded-full bg-black/50 hover:bg-black/70 text-white pointer-events-auto"
            onClick={(e) => {
              e.stopPropagation();
              nextSlide();
            }}
            aria-label="Next thumbnail"
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
              } transition-colors duration-300 pointer-events-auto`}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(index);
              }}
              aria-label={`Go to video ${index + 1}`}
            />
          ))}
        </div>
      </div>
    );
  }

  // Video playing mode
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

  return (
    <div className={`relative group ${className}`}>
      {/* Current video - key prop forces remount on video change */}
      <div 
        className="w-full rounded-lg overflow-hidden cursor-pointer"
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '100%'
        }}
        onClick={handleVideoClick}
      >
        <ResponsiveVideoFrame className="rounded-lg">
          <HlsVideo
            src={videoUrl}
            poster={posterUrl}
            className="w-full h-full"
            autoPlay={autoPlay}
            muted={userIsMuted}
            controls={controls}
            loop={false}
            objectFit="contain"
            onEnded={handleVideoEnded}
            onError={(error) => {
              devLog("HLS video error:", error);
            }}
            onLoaded={() => {
              devLog("HLS video loaded:", currentId);
            }}
            onVolumeChange={handleVolumeChange}
          />
        </ResponsiveVideoFrame>
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