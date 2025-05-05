import { useState, useRef, useEffect } from "react";
import { getCloudinaryVideoUrl, getCloudinaryVideoThumbnail, fetchVideosFromFolder } from "@/lib/cloudinary";

// Define the folder path
const CLOUDINARY_FOLDER = "cb3d4ab33a890ee80495dc141b4e7f8640";

interface CloudinaryVideoPlaylistProps {
  className?: string;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  controls?: boolean;
  showPlaylistIndicator?: boolean;
}

export function CloudinaryVideoPlaylist({
  className = "",
  autoPlay = true,
  loop = true,
  muted = false,
  controls = true,
  showPlaylistIndicator = true,
}: CloudinaryVideoPlaylistProps) {
  // State for video list and current position
  const [videos, setVideos] = useState<string[]>([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true); // Always start playing
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Fetch videos from Cloudinary folder
  useEffect(() => {
    async function loadVideos() {
      setIsLoading(true);
      try {
        const videoList = await fetchVideosFromFolder(CLOUDINARY_FOLDER);
        if (videoList.length > 0) {
          setVideos(videoList);
          setIsError(false);
        } else {
          // If no videos found, use fallback videos
          setVideos(["Nursing_Rocks_Concerts", "NR_Promo_Video", "NR_Highlights"]);
          console.warn("No videos found in folder, using fallback videos");
        }
      } catch (error) {
        console.error("Error loading videos:", error);
        // Use fallback videos on error
        setVideos(["Nursing_Rocks_Concerts", "NR_Promo_Video", "NR_Highlights"]);
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadVideos();
  }, []);
  
  // Get the current video's publicId with folder path
  const currentVideo = videos[currentVideoIndex] || "Nursing_Rocks_Concerts";
  const currentVideoPublicId = `${CLOUDINARY_FOLDER}/${currentVideo}`;
  const thumbnailUrl = getCloudinaryVideoThumbnail(currentVideoPublicId);
  const videoUrl = getCloudinaryVideoUrl(currentVideoPublicId);

  // Function to advance to the next video
  const playNextVideo = () => {
    if (videos.length === 0) return;
    const nextIndex = (currentVideoIndex + 1) % videos.length;
    setCurrentVideoIndex(nextIndex);
    // Reset error state when switching videos
    setIsError(false);
  };

  // Function to go to previous video
  const playPreviousVideo = () => {
    if (videos.length === 0) return;
    const prevIndex = (currentVideoIndex - 1 + videos.length) % videos.length;
    setCurrentVideoIndex(prevIndex);
    // Reset error state when switching videos
    setIsError(false);
  };

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

  // Handle video ended event
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleEnded = () => {
      playNextVideo();
      // Auto-play the next video if not paused
      if (isPlaying && video) {
        setTimeout(() => {
          video.play().catch(err => {
            console.error("Error auto-playing next video:", err);
            setIsError(true);
          });
        }, 500); // Small delay to allow the new source to load
      }
    };

    video.addEventListener('ended', handleEnded);
    return () => {
      video.removeEventListener('ended', handleEnded);
    };
  }, [currentVideoIndex, isPlaying]);

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

  // Auto-play the video after source changes
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    
    // When video source changes, reset error state
    setIsError(false);
    
    // Force video to load and play for all videos
    setTimeout(() => {
      video.load();
      video.play().catch(err => {
        console.error("Error auto-playing video after source change:", err);
        setIsError(true);
      });
    }, 100); // Small delay to ensure DOM updates
  }, [currentVideoIndex]);
  
  // Force initial video playback when component mounts
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    
    setTimeout(() => {
      video.play().catch(err => {
        console.error("Error with initial video auto-play:", err);
      });
    }, 500);
  }, []);

  if (isError) {
    return (
      <div className={`flex items-center justify-center bg-black ${className}`}>
        <div className="text-white text-sm p-4 text-center">
          <p>Video could not be loaded</p>
          <div className="flex space-x-2 mt-2 justify-center">
            <button 
              className="bg-primary/80 hover:bg-primary px-2 py-1 rounded text-white/90"
              onClick={() => {
                setIsError(false);
                if (videoRef.current) {
                  videoRef.current.load();
                  videoRef.current.play().catch(err => console.error(err));
                }
              }}
            >
              Retry
            </button>
            <button 
              className="bg-primary/80 hover:bg-primary px-2 py-1 rounded text-white/90"
              onClick={playNextVideo}
            >
              Next Video
            </button>
          </div>
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
        loop={false} // We handle our own looping for the playlist
        muted={muted}
        controls={controls}
        playsInline
        onClick={!controls ? togglePlay : undefined}
      >
        <source src={videoUrl} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      
      {/* Playlist navigation controls - only visible when controls are hidden */}
      {!controls && (
        <div className="absolute bottom-4 right-4 flex space-x-2">
          <button 
            className="bg-white/20 rounded-full p-2 backdrop-blur-sm hover:bg-white/30 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              playPreviousVideo();
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-5 h-5">
              <path d="M9.195 18.44c1.25.713 2.805-.19 2.805-1.629v-2.34l6.945 3.968c1.25.714 2.805-.188 2.805-1.628V8.688c0-1.44-1.555-2.342-2.805-1.628L12 11.03v-2.34c0-1.44-1.555-2.343-2.805-1.629l-7.108 4.062c-1.26.72-1.26 2.536 0 3.256l7.108 4.061z" />
            </svg>
          </button>
          
          <button 
            className="bg-white/20 rounded-full p-2 backdrop-blur-sm hover:bg-white/30 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              togglePlay();
            }}
          >
            {isPlaying ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-5 h-5">
                <path fillRule="evenodd" d="M6.75 5.25a.75.75 0 01.75-.75H9a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H7.5a.75.75 0 01-.75-.75V5.25zm7.5 0A.75.75 0 0115 4.5h1.5a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H15a.75.75 0 01-.75-.75V5.25z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-5 h-5">
                <path fillRule="evenodd" d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
              </svg>
            )}
          </button>
          
          <button 
            className="bg-white/20 rounded-full p-2 backdrop-blur-sm hover:bg-white/30 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              playNextVideo();
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-5 h-5">
              <path d="M5.055 7.06c-1.25-.714-2.805.189-2.805 1.628v8.123c0 1.44 1.555 2.342 2.805 1.628L12 14.471v2.34c0 1.44 1.555 2.342 2.805 1.628l7.108-4.061c1.26-.72 1.26-2.536 0-3.256L14.805 7.06C13.555 6.346 12 7.25 12 8.688v2.34L5.055 7.06z" />
            </svg>
          </button>
        </div>
      )}
      
      {/* Playlist indicator dots */}
      {showPlaylistIndicator && videos.length > 1 && (
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
          {videos.map((_, index: number) => (
            <button
              key={index}
              className={`w-2 h-2 rounded-full ${
                index === currentVideoIndex
                  ? 'bg-white'
                  : 'bg-white/40'
              }`}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentVideoIndex(index);
              }}
              aria-label={`Video ${index + 1}`}
            />
          ))}
        </div>
      )}
      
      {/* Play Indicator - Only show when paused and controls are hidden */}
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