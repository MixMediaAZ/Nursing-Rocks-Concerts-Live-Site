import React, { useState, useEffect, useCallback, useRef } from 'react';
import { CloudinaryIframeVideo } from './cloudinary-iframe-video';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { checkCloudinaryConnection } from '@/lib/cloudinary';

export interface VideoSlideshowProps {
  videos: string[];  // Array of video public IDs
  cloudName?: string;
  autoPlay?: boolean;
  muted?: boolean;
  controls?: boolean;
  interval?: number; // Time in milliseconds between slides
  className?: string;
}

export function VideoSlideshow({
  videos,
  cloudName: propCloudName,
  autoPlay = true,
  muted = true,
  controls = true,
  interval = 12000, // Default 12 seconds per video
  className = ''
}: VideoSlideshowProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [cloudinaryCloudName, setCloudinaryCloudName] = useState<string | null>(propCloudName || null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Get cloud name when component mounts
  useEffect(() => {
    if (propCloudName) {
      setCloudinaryCloudName(propCloudName);
      return;
    }
    
    async function getCloudName() {
      try {
        const result = await checkCloudinaryConnection();
        if (result.connected && result.cloudName) {
          setCloudinaryCloudName(result.cloudName);
        }
      } catch (error) {
        console.error('Error checking Cloudinary connection:', error);
      }
    }
    
    getCloudName();
  }, [propCloudName]);
  
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
  
  // Set up and clear timer based on play state
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        nextSlide();
      }, interval);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isPlaying, nextSlide, interval]);
  
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
  
  // Don't render if we have no videos or cloud name
  if (videos.length === 0 || !cloudinaryCloudName) {
    return (
      <div className={`flex items-center justify-center bg-muted h-64 rounded-lg ${className}`}>
        {!cloudinaryCloudName ? 'Loading...' : 'No videos available'}
      </div>
    );
  }
  
  return (
    <div className={`relative group ${className}`}>
      {/* Current video */}
      <div className="aspect-video w-full bg-black rounded-lg overflow-hidden">
        <CloudinaryIframeVideo
          publicId={videos[currentIndex]}
          className="w-full h-full"
          autoPlay={autoPlay}
          muted={muted}
          controls={controls}
          loop={false}  // Don't loop individual videos
          cloudName={cloudinaryCloudName}
          fallbackContent={
            <div className="flex items-center justify-center h-full bg-gray-900 text-gray-400">
              <span>Video unavailable</span>
            </div>
          }
        />
      </div>
      
      {/* Navigation controls */}
      <div className="absolute inset-0 flex items-center justify-between p-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button 
          variant="secondary" 
          size="icon" 
          className="rounded-full bg-black/50 hover:bg-black/70 text-white"
          onClick={prevSlide}
          aria-label="Previous video"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        
        <Button 
          variant="secondary" 
          size="icon" 
          className="rounded-full bg-black/50 hover:bg-black/70 text-white"
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