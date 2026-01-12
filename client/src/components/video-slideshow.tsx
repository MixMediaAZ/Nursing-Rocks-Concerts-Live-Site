import React, { useState, useEffect, useCallback, useRef } from 'react';
import { HlsVideo } from "./hls-video";
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';

export interface VideoSlideshowProps {
  videos: string[];  // Array of provider-neutral video IDs (b2_*)
  autoPlay?: boolean;
  muted?: boolean;
  controls?: boolean;
  interval?: number; // Time in milliseconds between slides
  className?: string;
}

export function VideoSlideshow({
  videos,
  autoPlay = true,
  muted = true,
  controls = true,
  interval = 12000, // Default 12 seconds per video
  className = ''
}: VideoSlideshowProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Track user's mute preference and interaction state
  const [userIsMuted, setUserIsMuted] = useState(true);
  const [hasInteracted, setHasInteracted] = useState(false);
  
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
      console.log('🎬 First click: Starting slideshow and unmuting audio');
    } else {
      // Subsequent clicks: toggle slideshow pause
      setIsPlaying(prev => {
        console.log(`🎬 Toggling slideshow: ${!prev ? 'playing' : 'paused'}`);
        return !prev;
      });
    }
  }, [hasInteracted]);
  
  // Handle volume change from transport controls
  const handleVolumeChange = useCallback((isMuted: boolean) => {
    setUserIsMuted(isMuted);
    console.log(`🔊 Volume changed via controls: ${isMuted ? 'muted' : 'unmuted'}`);
  }, []);
  
  // Handle video completion - advance to next video
  const handleVideoEnded = useCallback(() => {
    console.log('🎬 Video ended, advancing to next');
    if (isPlaying) {
      nextSlide();
    }
  }, [isPlaying, nextSlide]);
  
  // Fallback timer in case video doesn't trigger onEnded (max duration per video)
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setTimeout(() => {
        console.log('⏱️ Fallback timer triggered - advancing to next video');
        nextSlide();
      }, interval);
    }
    
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [isPlaying, nextSlide, interval, currentIndex]);
  
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
  
  // Don't render if we have no videos
  if (videos.length === 0) {
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
  const isB2Video = typeof currentId === "string" && currentId.startsWith("b2_");
  const cdnBase = (import.meta as any).env?.VITE_VIDEO_CDN_BASE_URL as string | undefined;
  const normalizedBase = cdnBase ? cdnBase.replace(/\/+$/, "") : "";
  const manifestUrl = isB2Video ? `${normalizedBase}/hls/${currentId}/master.m3u8` : "";
  const posterUrl = isB2Video ? `${normalizedBase}/poster/${currentId}.jpg` : undefined;

  return (
    <div className={`relative group ${className}`}>
      {/* Current video - key prop forces remount on video change */}
      <div 
        className="aspect-video w-full bg-black rounded-lg overflow-hidden cursor-pointer"
        onClick={handleVideoClick}
      >
        <HlsVideo
          src={manifestUrl}
          poster={posterUrl}
          className="w-full h-full"
          autoPlay={autoPlay}
          muted={userIsMuted}
          controls={controls}
          loop={false}
          onEnded={handleVideoEnded}
          onError={(error) => console.error("HLS video error:", error)}
          onLoaded={() => console.log("HLS video loaded:", currentId)}
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