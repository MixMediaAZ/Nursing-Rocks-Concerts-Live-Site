import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, Check, X, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { HlsVideo } from '@/components/hls-video';

interface ManualThumbnailCaptureProps {
  videoUrl: string;
  videoId: string;
  posterUrl?: string;
  onSuccess?: () => void;
}

export function ManualThumbnailCapture({
  videoUrl,
  videoId,
  posterUrl,
  onSuccess,
}: ManualThumbnailCaptureProps) {
  const { toast } = useToast();
  const [isCapturing, setIsCapturing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const captureCurrentFrame = async () => {
    const videoElement = videoRef.current;
    
    if (!videoElement) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Video element not found',
      });
      return;
    }

    try {
      // Create canvas and capture frame
      const canvas = document.createElement('canvas');
      canvas.width = videoElement.videoWidth || 1280;
      canvas.height = videoElement.videoHeight || 720;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Could not get canvas context');
      }

      // Draw current video frame
      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
      
      // Convert to data URL for preview
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setCapturedImage(dataUrl);
      setShowPreview(true);

    } catch (error) {
      console.error('Error capturing frame:', error);
      toast({
        variant: 'destructive',
        title: 'Capture Failed',
        description: error instanceof Error ? error.message : 'Could not capture frame',
      });
    }
  };

  const uploadThumbnail = async () => {
    if (!capturedImage) return;

    setIsCapturing(true);
    try {
      // Convert data URL to blob
      const response = await fetch(capturedImage);
      const blob = await response.blob();
      
      // Create form data
      const formData = new FormData();
      formData.append('thumbnail', blob, `${videoId}.jpg`);
      formData.append('videoId', videoId);

      // Upload to server
      const uploadResponse = await fetch('/api/admin/videos/upload-thumbnail', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        },
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Upload failed');
      }

      toast({
        title: 'Success!',
        description: 'Thumbnail saved successfully',
      });

      setShowPreview(false);
      setCapturedImage(null);
      onSuccess?.();
    } catch (error) {
      console.error('Error uploading thumbnail:', error);
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description: error instanceof Error ? error.message : 'Could not upload thumbnail',
      });
    } finally {
      setIsCapturing(false);
    }
  };

  const getVideoRef = (element: HTMLVideoElement | null) => {
    if (element) {
      // Wait for the video element to be ready
      const checkVideo = () => {
        const video = element.querySelector('video');
        if (video) {
          videoRef.current = video;
        }
      };
      
      // Check immediately and after a short delay
      checkVideo();
      setTimeout(checkVideo, 500);
    }
  };

  return (
    <div className="space-y-4">
      {/* Video Player */}
      <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
        <div ref={getVideoRef as any}>
          <HlsVideo
            src={videoUrl}
            poster={posterUrl}
            className="w-full h-full"
            autoPlay={false}
            muted={true}
            controls={true}
            loop={false}
          />
        </div>
      </div>

      {/* Capture Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
        <p className="text-sm text-blue-800">
          <strong>How to capture:</strong> Play the video, pause at a good frame, then click "Capture Current Frame"
        </p>
      </div>

      {/* Capture Button */}
      <div className="flex gap-2">
        <Button
          onClick={captureCurrentFrame}
          disabled={isCapturing || showPreview}
          className="flex-1"
        >
          <Camera className="mr-2 h-4 w-4" />
          Capture Current Frame
        </Button>
      </div>

      {/* Preview & Confirm */}
      {showPreview && capturedImage && (
        <div className="space-y-3 p-4 bg-gray-50 rounded-lg border">
          <p className="text-sm font-medium">Preview Thumbnail:</p>
          <img
            src={capturedImage}
            alt="Thumbnail preview"
            className="w-full rounded-md border"
          />
          <div className="flex gap-2">
            <Button
              onClick={uploadThumbnail}
              disabled={isCapturing}
              className="flex-1"
            >
              {isCapturing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Save Thumbnail
                </>
              )}
            </Button>
            <Button
              onClick={() => {
                setShowPreview(false);
                setCapturedImage(null);
              }}
              disabled={isCapturing}
              variant="outline"
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

