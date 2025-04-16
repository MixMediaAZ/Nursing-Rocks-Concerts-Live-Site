import { MediaAsset } from '@shared/schema';
import { Image, FileVideo, FileAudio, File } from 'lucide-react';

interface MediaDisplayProps {
  asset: MediaAsset;
  className?: string;
  showControls?: boolean;
  displayType?: 'preview' | 'full';
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * A component for displaying different types of media assets
 */
export function MediaDisplay({
  asset,
  className = '',
  showControls = true,
  displayType = 'full',
  onLoad,
  onError,
}: MediaDisplayProps) {
  // Render different content based on media type
  const renderMedia = () => {
    switch (asset.type) {
      case 'image':
        return (
          <img
            src={asset.path}
            alt={asset.alt || 'Image'}
            className={`${displayType === 'preview' ? 'object-cover w-full h-full' : 'max-w-full'}`}
            onLoad={onLoad}
            onError={onError}
          />
        );
        
      case 'video':
        return (
          <video
            src={asset.path}
            controls={showControls}
            className={`${displayType === 'preview' ? 'object-cover w-full h-full' : 'max-w-full'}`}
            onLoadedData={onLoad}
            onError={onError}
          >
            Your browser does not support the video tag.
          </video>
        );
        
      case 'audio':
        return (
          <div className="flex flex-col">
            <div className={`${displayType === 'preview' ? 'hidden' : ''}`}>
              <FileAudio className="h-12 w-12 mx-auto mb-2 text-primary/70" />
              <h3 className="text-center text-sm mb-2">{asset.title || asset.filename}</h3>
            </div>
            <audio
              src={asset.path}
              controls={showControls}
              className="w-full"
              onLoadedData={onLoad}
              onError={onError}
            >
              Your browser does not support the audio tag.
            </audio>
          </div>
        );
        
      case 'document':
        // For documents, we can't preview them directly, so we'll show an icon and link
        return (
          <div className="flex flex-col items-center">
            <File className="h-16 w-16 text-primary/70 mb-2" />
            <h3 className="text-center text-sm mb-2">{asset.title || asset.filename}</h3>
            <a
              href={asset.path}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1 bg-primary text-primary-foreground rounded-md text-sm"
              onClick={() => onLoad && onLoad()}
            >
              View Document
            </a>
          </div>
        );
        
      default:
        // For unknown types, just show an icon and link
        return (
          <div className="flex flex-col items-center">
            <File className="h-16 w-16 text-muted-foreground mb-2" />
            <h3 className="text-center text-sm mb-2">{asset.title || asset.filename}</h3>
            <a
              href={asset.path}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1 bg-primary text-primary-foreground rounded-md text-sm"
              onClick={() => onLoad && onLoad()}
            >
              Download File
            </a>
          </div>
        );
    }
  };
  
  // For preview mode (smaller display), add a container with specific dimensions
  if (displayType === 'preview') {
    return (
      <div className={`relative overflow-hidden ${className}`}>
        {renderMedia()}
      </div>
    );
  }
  
  // For full display mode, just render the media
  return (
    <div className={className}>
      {renderMedia()}
    </div>
  );
}

/**
 * A component for displaying an audio player with custom styling
 */
export function AudioPlayer({
  asset,
  className = '',
  showTitle = true,
  compact = false,
}: {
  asset: MediaAsset;
  className?: string;
  showTitle?: boolean;
  compact?: boolean;
}) {
  if (asset.type !== 'audio') {
    return (
      <div className="text-sm text-muted-foreground py-2 px-3 bg-muted/50 rounded-md">
        This is not an audio asset.
      </div>
    );
  }
  
  return (
    <div className={`${className} ${compact ? 'flex items-center' : ''}`}>
      {showTitle && (
        <div className={`${compact ? 'mr-3 flex-shrink-0' : 'mb-2'}`}>
          <div className="flex items-center">
            <FileAudio className={`${compact ? 'h-5 w-5' : 'h-6 w-6'} text-primary mr-2`} />
            <span className={`font-medium ${compact ? 'text-sm' : ''}`}>
              {asset.title || asset.filename}
            </span>
          </div>
        </div>
      )}
      <audio
        src={asset.path}
        controls
        className="w-full"
      >
        Your browser does not support the audio tag.
      </audio>
    </div>
  );
}

/**
 * A component for displaying a video player with custom styling
 */
export function VideoPlayer({
  asset,
  className = '',
  showTitle = true,
}: {
  asset: MediaAsset;
  className?: string;
  showTitle?: boolean;
}) {
  if (asset.type !== 'video') {
    return (
      <div className="text-sm text-muted-foreground py-2 px-3 bg-muted/50 rounded-md">
        This is not a video asset.
      </div>
    );
  }
  
  return (
    <div className={className}>
      {showTitle && (
        <div className="mb-2">
          <div className="flex items-center">
            <FileVideo className="h-6 w-6 text-primary mr-2" />
            <span className="font-medium">{asset.title || asset.filename}</span>
          </div>
        </div>
      )}
      <div className="relative rounded-md overflow-hidden">
        <video
          src={asset.path}
          controls
          className="w-full"
        >
          Your browser does not support the video tag.
        </video>
      </div>
    </div>
  );
}