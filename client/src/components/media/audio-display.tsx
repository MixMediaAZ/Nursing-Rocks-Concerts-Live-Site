import { useState, useRef, useEffect } from 'react';

interface AudioDisplayProps {
  src: string;
  type?: string;
  title?: string;
  artist?: string;
  coverImage?: string;
  className?: string;
  autoPlay?: boolean;
  loop?: boolean;
  controls?: boolean;
  onError?: () => void;
}

/**
 * A component for safely displaying audio content with error handling
 */
export function AudioDisplay({
  src,
  type,
  title,
  artist,
  coverImage,
  className = '',
  autoPlay = false,
  loop = false,
  controls = true,
  onError,
  ...props
}: AudioDisplayProps & Omit<React.AudioHTMLAttributes<HTMLAudioElement>, 'src'>) {
  const [error, setError] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Determine the audio MIME type if not provided
  const audioType = type || (() => {
    const extension = src.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'mp3': return 'audio/mpeg';
      case 'ogg': return 'audio/ogg';
      case 'wav': return 'audio/wav';
      case 'm4a': return 'audio/m4a';
      default: return 'audio/mpeg';
    }
  })();

  useEffect(() => {
    setIsLoading(true);
    setError(false);
    
    // Listen for audio loading status
    const audio = audioRef.current;
    if (audio) {
      const handleCanPlay = () => {
        setIsLoading(false);
      };
      
      const handleError = () => {
        setError(true);
        setIsLoading(false);
        if (onError) onError();
      };
      
      audio.addEventListener('canplay', handleCanPlay);
      audio.addEventListener('error', handleError);
      
      return () => {
        audio.removeEventListener('canplay', handleCanPlay);
        audio.removeEventListener('error', handleError);
      };
    }
  }, [src, onError]);

  return (
    <div className={`flex flex-col ${className}`}>
      {/* Cover Art */}
      {coverImage && (
        <div className="mb-3 relative">
          <img 
            src={coverImage} 
            alt={`Cover art for ${title || 'audio track'}`} 
            className="w-full h-auto aspect-square object-cover rounded-md"
          />
          {isLoading && (
            <div className="absolute inset-0 bg-muted/50 flex items-center justify-center rounded-md">
              <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          )}
        </div>
      )}
      
      {/* Audio Info */}
      {(title || artist) && (
        <div className="mb-2">
          {title && <h3 className="font-medium text-base">{title}</h3>}
          {artist && <p className="text-sm text-muted-foreground">{artist}</p>}
        </div>
      )}
      
      {/* Audio Player */}
      {error ? (
        <div className="bg-muted/30 border border-muted-foreground/20 rounded-md p-3 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mx-auto text-muted-foreground/70" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <p className="mt-1 text-xs text-muted-foreground">Failed to load audio</p>
        </div>
      ) : (
        <audio
          ref={audioRef}
          className="w-full"
          autoPlay={autoPlay}
          loop={loop}
          controls={controls}
          {...props}
        >
          <source src={src} type={audioType} />
          Your browser does not support the audio element.
        </audio>
      )}
    </div>
  );
}