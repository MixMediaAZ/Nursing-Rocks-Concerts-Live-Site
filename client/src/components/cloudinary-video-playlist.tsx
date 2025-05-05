import React, { useEffect, useState } from 'react';
import { CloudinaryIframeVideo } from './cloudinary-iframe-video';
import { Skeleton } from '@/components/ui/skeleton';

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
  emptyMessage = 'No videos available'
}: CloudinaryVideoPlaylistProps) {
  const [videos, setVideos] = useState<CloudinaryResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cloudinaryCloudName, setCloudinaryCloudName] = useState<string | null>(propCloudName || null);
  
  // Fetch videos when component mounts
  useEffect(() => {
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
          
          // Limit the number of videos
          filteredVideos = filteredVideos.slice(0, limit);
          
          // Store the cloud name from the response if available
          if (data.cloudName && !cloudinaryCloudName) {
            setCloudinaryCloudName(data.cloudName);
          }
          
          setVideos(filteredVideos);
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
  
  // Loading state
  if (loading) {
    return (
      <div className={`grid grid-cols-1 gap-4 ${className}`}>
        {Array.from({ length: 2 }).map((_, i) => (
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
  
  // Render videos
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
            title={video.display_name || `${title} ${index + 1}`}
            fallbackContent={
              <div className="flex items-center justify-center h-full bg-gray-900 text-gray-400">
                <span>Video unavailable</span>
              </div>
            }
          />
          {video.display_name && (
            <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-2 text-white text-xs truncate">
              {video.display_name}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}