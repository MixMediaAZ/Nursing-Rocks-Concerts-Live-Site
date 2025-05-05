import React, { useEffect, useState } from 'react';
import { CloudinaryIframeVideo } from './cloudinary-iframe-video';
import { Skeleton } from '@/components/ui/skeleton';
import { checkCloudinaryConnection, detectResourceType, getCloudinaryVideoThumbnail } from '@/lib/cloudinary';

export interface CloudinaryResource {
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
}

export interface CloudinaryVideoPlaylistProps {
  folder?: string;
  limit?: number;
  className?: string;
  videoClassName?: string;
  cloudName?: string | null;
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
 * CloudinaryVideoPlaylist - A component that displays a list of videos from a Cloudinary folder
 * Uses the server-side Cloudinary API to fetch videos
 */
export function CloudinaryVideoPlaylist({
  folder,
  limit = 5,
  className = '',
  videoClassName = '',
  cloudName: propCloudName,
  autoPlay = false,
  muted = true,
  controls = true,
  loop = false,
  title = 'Nursing Rocks Video',
  emptyMessage = 'No videos available',
  layout = 'grid',
  showDuration = true
}: CloudinaryVideoPlaylistProps) {
  const [videos, setVideos] = useState<CloudinaryResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cloudinaryCloudName, setCloudinaryCloudName] = useState<string | null>(propCloudName || null);
  
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
  
  // Fetch videos when component mounts or cloud name changes
  useEffect(() => {
    if (!cloudinaryCloudName) return;
    
    async function fetchVideos() {
      try {
        setLoading(true);
        
        // Fetch videos from server
        const response = await fetch('/api/cloudinary/videos');
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
          const processedVideos = filteredVideos.map((video: CloudinaryResource) => {
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
          
          setVideos(limitedVideos);
        } else {
          setError('Failed to fetch videos from Cloudinary');
        }
      } catch (err) {
        console.error('Error fetching Cloudinary videos:', err);
        setError('Error loading videos. Please try again later.');
      } finally {
        setLoading(false);
      }
    }
    
    fetchVideos();
  }, [folder, limit, cloudinaryCloudName]);
  
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
  
  // Render videos in grid layout
  if (layout === 'grid') {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${className}`}>
        {videos.map((video, index) => (
          <div key={video.asset_id} className="relative aspect-video bg-black rounded-lg overflow-hidden shadow-md">
            <CloudinaryIframeVideo
              publicId={video.public_id}
              className={`w-full h-full ${videoClassName}`}
              autoPlay={index === 0 && autoPlay}
              muted={muted}
              controls={controls}
              loop={loop}
              cloudName={cloudinaryCloudName}
              resourceType={video.resource_type as any}
              title={video.display_name || `${title} ${index + 1}`}
              fallbackContent={
                <div className="flex items-center justify-center h-full bg-gray-900 text-gray-400">
                  <span>Video unavailable</span>
                </div>
              }
            />
            <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-2">
              <div className="flex justify-between items-center">
                <div className="text-white text-xs truncate">
                  {video.display_name || `${title} ${index + 1}`}
                </div>
                {showDuration && video.duration && (
                  <div className="text-white/80 text-xs">
                    {formatDuration(video.duration)}
                  </div>
                )}
              </div>
            </div>
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
            <CloudinaryIframeVideo
              publicId={video.public_id}
              className={`w-full h-full ${videoClassName}`}
              autoPlay={index === 0 && autoPlay}
              muted={muted}
              controls={controls}
              loop={loop}
              cloudName={cloudinaryCloudName}
              resourceType={video.resource_type as any}
              title={video.display_name || `${title} ${index + 1}`}
              fallbackContent={
                <div className="flex items-center justify-center h-full bg-gray-900 text-gray-400">
                  <span>Video unavailable</span>
                </div>
              }
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