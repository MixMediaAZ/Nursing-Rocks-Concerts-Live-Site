import React, { useEffect, useState } from 'react';
import { VideoThumbnail } from "./video-thumbnail";
import { Skeleton } from '@/components/ui/skeleton';
import { detectResourceType } from '@/lib/video-service';

export interface VideoResource {
  public_id: string;
  secure_url: string;
  format: string;
  resource_type: string;
  asset_id: string;
  bytes: number;
  width?: number;
  height?: number;
  created_at: string;
  display_name?: string;
  asset_folder?: string;
  duration?: number;
  hls_url?: string;
  poster_url?: string;
}

export interface VideoPlaylistProps {
  folder?: string;
  limit?: number;
  className?: string;
  videoClassName?: string;
  autoPlay?: boolean;
  muted?: boolean;
  controls?: boolean;
  loop?: boolean;
  title?: string;
  emptyMessage?: React.ReactNode;
  layout?: 'grid' | 'list';
  showDuration?: boolean;
}

/**
 * VideoPlaylist - A component that displays a list of videos from B2 storage
 * Uses the server-side video API to fetch approved videos
 */
export function VideoPlaylist({
  folder,
  limit = 5,
  className = '',
  videoClassName = '',
  autoPlay = false,
  muted = true,
  controls = true,
  loop = false,
  title = 'Nursing Rocks Video',
  emptyMessage = 'No videos available',
  layout = 'grid',
  showDuration = true
}: VideoPlaylistProps) {
  const [videos, setVideos] = useState<VideoResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch videos when component mounts
  useEffect(() => {
    async function fetchVideos() {
      try {
        setLoading(true);
        
        // Fetch videos from server (approval-gated)
        const response = await fetch('/api/videos');
        const data = await response.json();
        
        
        if (data.success && Array.isArray(data.resources)) {
          // If folder is specified, filter videos by folder
          let filteredVideos = data.resources;
          
          if (folder) {
            filteredVideos = filteredVideos.filter((video: any) => 
              video.asset_folder === folder || video.public_id.startsWith(folder + '/')
            );
          }
          
          // Process videos to add additional properties
          const processedVideos = filteredVideos.map((video: VideoResource) => {
            // Detect resource type for each video
            const mediaType = detectResourceType(video.public_id);
            
            // Add a display name if not present
            if (!video.display_name) {
              // Try to extract a name from the public_id
              const nameParts = video.public_id.split('/');
              const lastPart = nameParts[nameParts.length - 1];
              const cleanName = lastPart
                .replace(/[-_]/g, ' ')
                .replace(/\.\w+$/, '')
                .split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(' ');
              
              video.display_name = cleanName || `Video ${video.asset_id.substring(0, 6)}`;
            }
            
            return {
              ...video,
              resource_type: mediaType === 'auto' ? video.resource_type : mediaType
            };
          });
          
          // Limit the number of videos
          const limitedVideos = processedVideos.slice(0, limit);
          
          // All videos are from B2, no filtering needed
          setVideos(limitedVideos);
        } else {
          setError('Failed to fetch videos');
        }
      } catch (err) {
        console.error('Error fetching videos:', err);
        setError('Error loading videos. Please try again later.');
      } finally {
        setLoading(false);
      }
    }
    
    fetchVideos();
  }, [folder, limit]);
  
  // Format duration to mm:ss or hh:mm:ss format
  const formatDuration = (seconds?: number) => {
    if (!seconds) return '00:00';
    
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
  };
  
  // Loading state
  if (loading) {
    return (
      <div className={`grid grid-cols-1 ${layout === 'grid' ? 'md:grid-cols-2' : ''} gap-4 ${className}`}>
        {Array.from({ length: layout === 'grid' ? 4 : 2 }).map((_, i) => (
          <div key={i} className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
            <Skeleton className="absolute inset-0 bg-gray-800/40" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Skeleton className="w-12 h-12 rounded-full bg-gray-700/60" />
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className={`bg-red-900/10 border border-red-900/20 rounded-lg p-4 ${className}`}>
        <p className="text-red-500">{error}</p>
      </div>
    );
  }
  
  // Empty state
  if (videos.length === 0) {
    return (
      <div className={`bg-gray-800/20 border border-gray-800/30 rounded-lg p-4 ${className}`}>
        {emptyMessage}
      </div>
    );
  }
  
  const getVideoUrl = (video: VideoResource) => {
    // Use direct MP4 (secure_url) since HLS manifests may not exist yet
    // This ensures videos play immediately without requiring HLS transcoding
    return video.secure_url || video.url;
  };

  const getPosterUrl = (video: VideoResource) => {
    if (video.poster_url) return video.poster_url;
    const base = (import.meta as any).env?.VITE_VIDEO_CDN_BASE_URL as string | undefined;
    const normalized = base ? base.replace(/\/+$/, "") : "";
    return `${normalized}/poster/${video.public_id}.jpg`;
  };

  // Render videos in grid layout
  if (layout === 'grid') {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${className}`}>
        {videos.map((video, index) => (
          <div key={video.asset_id} className="relative aspect-video bg-black rounded-lg overflow-hidden shadow-md">
            <VideoThumbnail
              videoUrl={getVideoUrl(video)}
              posterUrl={getPosterUrl(video)}
              title={video.display_name || `${title} ${index + 1}`}
              duration={showDuration && video.duration ? formatDuration(video.duration) : undefined}
              className={videoClassName}
              muted={muted}
              controls={controls}
              loop={loop}
              showTitle={true}
              showDuration={showDuration}
            />
          </div>
        ))}
      </div>
    );
  }
  
  // Render videos in list layout
  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {videos.map((video, index) => (
        <div key={video.asset_id} className="flex flex-col md:flex-row gap-4 bg-black/5 dark:bg-black/20 rounded-lg overflow-hidden shadow-md">
          <div className="aspect-video md:w-1/3 bg-black">
            <VideoThumbnail
              videoUrl={getVideoUrl(video)}
              posterUrl={getPosterUrl(video)}
              title={video.display_name || `${title} ${index + 1}`}
              duration={showDuration && video.duration ? formatDuration(video.duration) : undefined}
              className={videoClassName}
              muted={muted}
              controls={controls}
              loop={loop}
              showTitle={false}
              showDuration={false}
            />
          </div>
          <div className="p-4 flex-1 flex flex-col">
            <h3 className="font-semibold mb-2">{video.display_name || `${title} ${index + 1}`}</h3>
            {showDuration && video.duration && (
              <div className="text-sm text-muted-foreground mb-2">
                Duration: {formatDuration(video.duration)}
              </div>
            )}
            <div className="text-sm text-muted-foreground mt-auto">
              {new Date(video.created_at).toLocaleDateString()}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
