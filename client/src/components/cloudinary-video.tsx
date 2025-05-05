import { useState, useRef, useEffect } from "react";
import { AdvancedVideo } from "@cloudinary/react";
import { getCloudinaryVideoUrl, getCloudinaryVideoThumbnail } from "@/lib/cloudinary";

interface CloudinaryVideoProps {
  publicId: string;
  className?: string;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  controls?: boolean;
}

export function CloudinaryVideo({
  publicId,
  className = "",
  autoPlay = false,
  loop = false,
  muted = true,
  controls = true,
}: CloudinaryVideoProps) {
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isError, setIsError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const DEFAULT_CLOUD_NAME = "don4sipdk"; // Default cloud name used throughout the site
  
  // Adding empty options object as third parameter to fix typing errors
  const thumbnailUrl = getCloudinaryVideoThumbnail(publicId, DEFAULT_CLOUD_NAME, {});
  const videoUrl = getCloudinaryVideoUrl(publicId, DEFAULT_CLOUD_NAME, {});

  // Toggle play/pause
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(error => {
          console.error("Error playing video:", error);
          setIsError(true);
        });
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Update playing state when video state changes
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleError = () => setIsError(true);

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('error', handleError);
    };
  }, []);

  if (isError) {
    return (
      <div className={`flex items-center justify-center bg-black ${className}`}>
        <div className="text-white text-sm p-4 text-center">
          <p>Video could not be loaded</p>
          <button 
            className="mt-2 bg-primary/80 hover:bg-primary px-2 py-1 rounded text-white/90"
            onClick={() => {
              setIsError(false);
              if (videoRef.current) {
                videoRef.current.load();
              }
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        poster={thumbnailUrl}
        autoPlay={autoPlay}
        loop={loop}
        muted={muted}
        controls={controls}
        playsInline
        onClick={togglePlay}
      >
        <source src={videoUrl} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      
      {!isPlaying && !controls && (
        <div 
          className="absolute inset-0 flex items-center justify-center cursor-pointer bg-black/30"
          onClick={togglePlay}
        >
          <div className="bg-white/20 rounded-full p-4 backdrop-blur-sm">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-8 h-8">
              <path fillRule="evenodd" d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653Z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}