import { useEffect, useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Video, Check, X, RefreshCw, Eye, Camera, Trash2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { HlsVideo } from "@/components/hls-video";
import { VideoThumbnail } from "@/components/video-thumbnail";
import { adminFetch } from "@/lib/admin-auth";
import { ManualThumbnailCapture } from "./manual-thumbnail-capture";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ProviderVideo {
  public_id: string;
  format: string;
  resource_type: string;
  duration?: number;
  created_at: string;
  bytes: number;
  url: string;
  secure_url: string;
  asset_folder?: string;
  hls_url?: string;
  poster_url?: string;
}

interface ApprovedVideo {
  id: number;
  public_id: string;
  folder: string | null;
  approved: boolean;
  approved_by: number | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
  admin_notes: string | null;
}

export default function VideoApproval() {
  const { toast } = useToast();
  const [selectedVideo, setSelectedVideo] = useState<ProviderVideo | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [showNotesDialog, setShowNotesDialog] = useState(false);
  const [previewVideo, setPreviewVideo] = useState<ProviderVideo | null>(null);
  const [capturingThumbnail, setCapturingThumbnail] = useState<string | null>(null);
  const [pendingVideoId, setPendingVideoId] = useState<string | null>(null);
  
  const queryClient = useQueryClient();
  
  const getCdnBase = () => {
    const base = (import.meta as any).env?.VITE_VIDEO_CDN_BASE_URL as string | undefined;
    return base ? base.replace(/\/+$/, "") : "";
  };

  const getPosterUrl = (video: ProviderVideo) => {
    if (video.poster_url) return video.poster_url;
    const base = getCdnBase();
    return `${base}/poster/${video.public_id}.jpg`;
  };

  const getHlsUrl = (video: ProviderVideo) => {
    if (video.hls_url) return video.hls_url;
    const base = getCdnBase();
    return `${base}/hls/${video.public_id}/master.m3u8`;
  };
  
  // Format file size
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };
  
  // Format duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Fetch approved videos from database
  const { data: approvedVideos, isLoading: isLoadingApproved, error: approvedError, refetch: refetchApproved } = useQuery<ApprovedVideo[]>({
    queryKey: ['/api/admin/videos'],
    queryFn: async () => {
      const response = await adminFetch('/api/admin/videos');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to fetch approved videos');
      }
      const data = await response.json();
      return data;
    },
  });

  // Fetch all videos from the active provider (unfiltered for admin view)
  const {
    data: providerData,
    isLoading: isLoadingProvider,
    error: providerError,
    refetch: refetchProvider,
  } = useQuery({
    queryKey: ['/api/videos', { all: true }],
    queryFn: async () => {
      // (debug log removed)
      // Fetch videos through server API endpoint with all=true parameter for admin
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      const response = await fetch('/api/videos?all=true', {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : undefined,
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[VideoApproval] Failed to fetch videos:', errorData);
        throw new Error(errorData.message || 'Failed to fetch videos');
      }
      const data = await response.json();
      // (debug log removed)
      return data;
    },
  });

  // Sync videos mutation
  const syncMutation = useMutation({
    mutationFn: async () => {
      const response = await adminFetch('/api/admin/videos/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });
      if (!response.ok) throw new Error('Failed to sync videos');
      return response.json();
    },
    onSuccess: async (data) => {
      // Sync explicitly requested by user - refetch is expected
      await Promise.all([
        refetchApproved(),
        refetchProvider()
      ]);
      
      toast({
        title: 'Videos Synced',
        description: `Synced ${data.synced} new videos. Page will refresh.`,
      });
    },
    onError: () => {
        toast({
          title: 'Sync Failed',
          description: 'Could not sync videos from storage',
          variant: 'destructive',
        });
      },
    });

  // Removed HLS and Cloudflare migration features - using direct MP4 playback from B2

  // Approve video mutation
  const approveMutation = useMutation({
    mutationFn: async ({ public_id, admin_notes }: { public_id: string; admin_notes?: string }) => {
      // (debug log removed)
      setPendingVideoId(public_id);
      // (debug log removed)
      const response = await adminFetch('/api/admin/videos/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ public_id, admin_notes }),
      });
      // (debug log removed)
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[VideoApproval] Approval failed:', errorData);
        throw new Error(errorData.message || 'Failed to approve video');
      }
      return response.json();
    },
    onSuccess: async (data, variables) => {
      // #region agent log
      // (debug log removed)
      fetch('http://127.0.0.1:7253/ingest/a70d3c4c-5483-4936-8dc1-1a2a5745df39',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'video-approval.tsx:196',message:'APPROVE onSuccess START',data:{public_id:variables.public_id,hasNotes:!!variables.admin_notes},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1,H5'})}).catch(()=>{});
      // #endregion
      setPendingVideoId(null);
      
      // Update React Query cache (persists across remounts)
      // #region agent log
      // (debug log removed)
      fetch('http://127.0.0.1:7253/ingest/a70d3c4c-5483-4936-8dc1-1a2a5745df39',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'video-approval.tsx:200',message:'BEFORE queryClient.setQueryData',data:{public_id:variables.public_id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H3,H4'})}).catch(()=>{});
      // #endregion
      
      queryClient.setQueryData<ApprovedVideo[]>(['/api/admin/videos'], (old = []) => {
        const exists = old.find(v => v.public_id === variables.public_id);
        if (exists) {
          return old.map(v => v.public_id === variables.public_id 
            ? { ...v, approved: true, admin_notes: variables.admin_notes || v.admin_notes } 
            : v);
        } else {
          const newEntry: ApprovedVideo = {
            id: Date.now(),
            public_id: variables.public_id,
            folder: null,
            approved: true,
            approved_by: null,
            approved_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            admin_notes: variables.admin_notes || null,
          };
          return [...old, newEntry];
        }
      });
      
      // #region agent log
      // (debug log removed)
      fetch('http://127.0.0.1:7253/ingest/a70d3c4c-5483-4936-8dc1-1a2a5745df39',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'video-approval.tsx:204',message:'AFTER queryClient.setQueryData',data:{public_id:variables.public_id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H3,H4'})}).catch(()=>{});
      // #endregion
      
      toast({
        title: 'Video Approved',
        description: 'Video is now visible to users',
      });
      // #region agent log
      // (debug log removed)
      fetch('http://127.0.0.1:7253/ingest/a70d3c4c-5483-4936-8dc1-1a2a5745df39',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'video-approval.tsx:209',message:'BEFORE dialog state changes',data:{showNotesDialog,hasSelectedVideo:!!selectedVideo},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H4'})}).catch(()=>{});
      // #endregion
      setShowNotesDialog(false);
      setSelectedVideo(null);
      setAdminNotes('');
      // #region agent log
      // (debug log removed)
      fetch('http://127.0.0.1:7253/ingest/a70d3c4c-5483-4936-8dc1-1a2a5745df39',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'video-approval.tsx:212',message:'APPROVE onSuccess END',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1,H5'})}).catch(()=>{});
      // #endregion
    },
    onError: (error: Error) => {
      setPendingVideoId(null);
      toast({
        title: 'Approval Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Unapprove video mutation
  const unapproveMutation = useMutation({
    mutationFn: async (public_id: string) => {
      setPendingVideoId(public_id);
      const response = await adminFetch('/api/admin/videos/unapprove', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ public_id }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to unapprove video');
      }
      return response.json();
    },
    onSuccess: async (data, variables) => {
      // #region agent log
      fetch('http://127.0.0.1:7253/ingest/a70d3c4c-5483-4936-8dc1-1a2a5745df39',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'video-approval.tsx:255',message:'UNAPPROVE onSuccess START',data:{public_id:variables},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1,H5'})}).catch(()=>{});
      // #endregion
      setPendingVideoId(null);
      
      // Update React Query cache (persists across remounts)
      queryClient.setQueryData<ApprovedVideo[]>(['/api/admin/videos'], (old = []) => {
        return old.map(v => v.public_id === variables ? { ...v, approved: false } : v);
      });
      
      toast({
        title: 'Video Unapproved',
        description: 'Video is now hidden from users',
      });
      // #region agent log
      fetch('http://127.0.0.1:7253/ingest/a70d3c4c-5483-4936-8dc1-1a2a5745df39',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'video-approval.tsx:266',message:'UNAPPROVE onSuccess END',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1,H5'})}).catch(()=>{});
      // #endregion
    },
    onError: (error: Error) => {
      setPendingVideoId(null);
      toast({
        title: 'Unapproval Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Delete video from dashboard mutation
  const deleteMutation = useMutation({
    mutationFn: async (public_id: string) => {
      // #region agent log
      // (debug log removed)
      // #endregion
      setPendingVideoId(public_id);
      const response = await adminFetch('/api/admin/videos/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ public_id }),
      });
      // #region agent log
      // (debug log removed)
      // #endregion
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        // #region agent log
        // (debug log removed)
        // #endregion
        throw new Error(errorData.message || 'Failed to delete video');
      }
      return response.json();
    },
    onSuccess: async (data, variables) => {
      // #region agent log
      // (debug log removed)
      // #endregion
      setPendingVideoId(null);
      
      // Remove from both caches (approvedVideos and provider data)
      queryClient.setQueryData<ApprovedVideo[]>(['/api/admin/videos'], (old = []) => {
        return old.filter(v => v.public_id !== variables);
      });
      
      // Also remove from provider data cache so it disappears from the list
      queryClient.setQueryData<any>(['/api/videos', { all: true }], (old: any) => {
        if (!old?.resources) return old;
        return {
          ...old,
          resources: old.resources.filter((v: any) => v.public_id !== variables),
          total: old.total - 1,
        };
      });
      
      toast({
        title: 'Video Removed',
        description: 'Video removed from dashboard (file kept on server)',
      });
    },
    onError: (error: Error) => {
      // #region agent log
      // (debug log removed)
      // #endregion
      setPendingVideoId(null);
      toast({
        title: 'Delete Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleApprove = (public_id: string, withNotes = false) => {
    if (withNotes) {
      const video = approvedVideos?.find(v => v.public_id === public_id);
      setSelectedVideo({ public_id } as ProviderVideo);
      setShowNotesDialog(true);
    } else {
      approveMutation.mutate({ public_id });
    }
  };

  const handleUnapprove = (public_id: string) => {
    unapproveMutation.mutate(public_id);
  };

  const handleSaveNotes = () => {
    if (selectedVideo) {
      approveMutation.mutate({ 
        public_id: selectedVideo.public_id, 
        admin_notes: adminNotes || undefined 
      });
    }
  };

  const handleCaptureInline = async (e: React.MouseEvent, video: ProviderVideo) => {
    e.preventDefault();
    e.stopPropagation();
    // #region agent log
    fetch('http://127.0.0.1:7253/ingest/a70d3c4c-5483-4936-8dc1-1a2a5745df39',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'video-approval.tsx:308',message:'CAPTURE THUMBNAIL START',data:{public_id:video.public_id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1,H5'})}).catch(()=>{});
    // #endregion
    setCapturingThumbnail(video.public_id);
    
    try {
      // Find the container with the specific video ID
      const container = document.querySelector(`[data-video-id="${video.public_id}"]`);
      
      if (!container) {
        throw new Error('Video container not found.');
      }
      
      // Find the video element within this container
      const targetVideo = container.querySelector('video') as HTMLVideoElement;
      
      if (!targetVideo) {
        throw new Error('Video element not found. Please click the thumbnail to load the video first.');
      }
      
      // Pause the video to freeze playback for capture
      targetVideo.pause();
      
      // Check if video is loaded and has valid dimensions
      if (targetVideo.videoWidth === 0 || targetVideo.videoHeight === 0) {
        throw new Error('Video not loaded yet. Please click the thumbnail to play the video first.');
      }
      
      // Create canvas and capture frame
      const canvas = document.createElement('canvas');
      canvas.width = targetVideo.videoWidth || 1280;
      canvas.height = targetVideo.videoHeight || 720;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Could not get canvas context');
      }
      
      // Draw current video frame
      ctx.drawImage(targetVideo, 0, 0, canvas.width, canvas.height);
      
      // Convert to blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => {
          if (b) resolve(b);
          else reject(new Error('Failed to create blob'));
        }, 'image/jpeg', 0.85);
      });
      
      // Upload to server
      const formData = new FormData();
      formData.append('thumbnail', blob, `${video.public_id}.jpg`);
      formData.append('videoId', video.public_id);
      
      const response = await fetch('/api/admin/videos/upload-thumbnail', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        },
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      
      toast({
        title: 'Thumbnail Saved!',
        description: `Thumbnail captured for ${video.public_id.split('/').pop()}`,
      });
      
      // #region agent log
      fetch('http://127.0.0.1:7253/ingest/a70d3c4c-5483-4936-8dc1-1a2a5745df39',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'video-approval.tsx:376',message:'CAPTURE THUMBNAIL SUCCESS',data:{public_id:video.public_id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1,H5'})}).catch(()=>{});
      // #endregion
      
      // Don't refetch - stay on page and keep videos playing
    } catch (error) {
      console.error('Error capturing thumbnail:', error);
      toast({
        variant: 'destructive',
        title: 'Capture Failed',
        description: error instanceof Error ? error.message : 'Could not capture thumbnail',
      });
    } finally {
      setCapturingThumbnail(null);
      // #region agent log
      fetch('http://127.0.0.1:7253/ingest/a70d3c4c-5483-4936-8dc1-1a2a5745df39',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'video-approval.tsx:392',message:'CAPTURE THUMBNAIL END (finally)',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1,H5'})}).catch(()=>{});
      // #endregion
    }
  };

  const isApproved = (public_id: string) => {
    return approvedVideos?.some(v => v.public_id === public_id && v.approved) || false;
  };
  
  // Check if video exists in database (approved or unapproved)
  const isInDatabase = (public_id: string) => {
    return approvedVideos?.some(v => v.public_id === public_id) || false;
  };

  const getVideoNotes = (public_id: string) => {
    return approvedVideos?.find(v => v.public_id === public_id)?.admin_notes || '';
  };

  // Just use raw provider resources - don't bake approval into array to avoid re-renders
  const allVideos = useMemo(() => {
    if (!providerData?.resources) return [];
    
  // (debug log removed)
    
    // Return raw resources - approval will be checked at render time
    return providerData.resources;
  }, [providerData?.resources]);

  // (debug log removed)

  if (isLoadingProvider) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2 text-muted-foreground">Loading videos...</span>
      </div>
    );
  }

  if (providerError) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <X className="h-12 w-12 text-destructive" />
        <p className="text-destructive">Failed to load videos</p>
        <p className="text-sm text-muted-foreground">{(providerError as Error).message}</p>
        <Button type="button" onClick={() => refetchProvider()} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" /> Retry
        </Button>
      </div>
    );
  }

  // Show warning if approved videos failed to load but continue with provider videos
  if (approvedError) {
    console.warn('[VideoApproval] Failed to load approval status:', approvedError);
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-2xl font-bold">Video Approval</CardTitle>
          <Button
            type="button"
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
            variant="outline"
          >
            {syncMutation.isPending ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Syncing...</>
            ) : (
              <><RefreshCw className="mr-2 h-4 w-4" /> Sync from Storage</>
            )}
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-6">
            Approve videos to make them visible on the site. Click "Sync from Storage" to discover new uploads in Backblaze B2.
          </p>

          {approvedError && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
                ⚠️ Warning: Could not load approval status from database. Videos will appear as unapproved until this is resolved.
              </p>
            </div>
          )}

          {isLoadingApproved && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md flex items-center">
              <Loader2 className="h-4 w-4 animate-spin mr-2 text-blue-600" />
              <p className="text-sm text-blue-800">Loading approval status...</p>
            </div>
          )}

          {allVideos && allVideos.length === 0 ? (
            <div className="text-center py-12">
              <Video className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No videos found in storage.</p>
              <p className="text-xs text-muted-foreground">Make sure your Backblaze bucket contains videos (or check VIDEO_SOURCE_PREFIX).</p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Found {allVideos.length} video(s) • {allVideos.filter((v: any) => isApproved(v.public_id)).length} approved
              </p>
              {allVideos?.map((video: any) => (
                <div
                  key={video.public_id}
                  className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start gap-4 flex-1">
                    {/* Video Thumbnail Preview */}
                    <div 
                      className="relative flex-shrink-0 w-[200px] h-[150px]"
                      data-video-id={video.public_id}
                    >
                      <VideoThumbnail
                        videoUrl={video.url || video.secure_url}
                        posterUrl={getPosterUrl(video)}
                        title={video.public_id.split('/').pop()}
                        showTitle={false}
                        showDuration={false}
                        className="w-full h-full rounded-md"
                        muted={true}
                        controls={true}
                        loop={false}
                      />
                    </div>
                    
                    {/* Video Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{video.public_id.split('/').pop()}</p>
                      <p className="text-sm text-muted-foreground truncate mb-2">{video.public_id}</p>
                      
                      {/* Video Metadata */}
                      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                        {video.duration && (
                          <span className="flex items-center gap-1">
                            <Video className="h-3 w-3" />
                            {formatDuration(video.duration)}
                          </span>
                        )}
                        {video.bytes && (
                          <span>{formatBytes(video.bytes)}</span>
                        )}
                        {video.created_at && (
                          <span>{new Date(video.created_at).toLocaleDateString()}</span>
                        )}
                      </div>
                      
                      {getVideoNotes(video.public_id) && (
                        <p className="text-xs text-muted-foreground mt-2 italic">
                          Note: {getVideoNotes(video.public_id)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* Capture Thumbnail Button */}
                    <Button
                      size="sm"
                      variant="outline"
                      type="button"
                      onClick={(e) => handleCaptureInline(e, video)}
                      disabled={capturingThumbnail === video.public_id}
                      className="flex items-center gap-1"
                    >
                      {capturingThumbnail === video.public_id ? (
                        <><Loader2 className="h-4 w-4 animate-spin" /> Capturing...</>
                      ) : (
                        <><Camera className="h-4 w-4" /> Capture</>
                      )}
                    </Button>
                    
                    {/* Preview Button */}
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setPreviewVideo(video)}
                      className="flex items-center gap-1"
                    >
                      <Eye className="h-4 w-4" />
                      <span>Preview</span>
                    </Button>
                    
                    {isApproved(video.public_id) ? (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 text-green-600">
                          <Check className="h-4 w-4" />
                          <span className="text-sm font-medium">Approved</span>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          type="button"
                          onClick={() => handleUnapprove(video.public_id)}
                          disabled={pendingVideoId === video.public_id}
                        >
                          {pendingVideoId === video.public_id ? (
                            <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Processing...</>
                          ) : (
                            <><X className="h-4 w-4 mr-1" /> Unapprove</>
                          )}
                        </Button>
                        {isInDatabase(video.public_id) && (
                          <Button
                            size="sm"
                            variant="destructive"
                            type="button"
                            onClick={() => deleteMutation.mutate(video.public_id)}
                            disabled={pendingVideoId === video.public_id}
                          >
                            {pendingVideoId === video.public_id ? (
                              <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Deleting...</>
                            ) : (
                              <><Trash2 className="h-4 w-4 mr-1" /> Delete</>
                            )}
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 text-yellow-600">
                          <X className="h-4 w-4" />
                          <span className="text-sm font-medium">Pending</span>
                        </div>
                        <Button
                          size="sm"
                          type="button"
                          onClick={() => handleApprove(video.public_id)}
                          disabled={pendingVideoId === video.public_id}
                        >
                          {pendingVideoId === video.public_id ? (
                            <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Processing...</>
                          ) : (
                            <><Check className="h-4 w-4 mr-1" /> Approve</>
                          )}
                        </Button>
                        {isInDatabase(video.public_id) && (
                          <Button
                            size="sm"
                            variant="destructive"
                            type="button"
                            onClick={() => deleteMutation.mutate(video.public_id)}
                            disabled={pendingVideoId === video.public_id}
                          >
                            {pendingVideoId === video.public_id ? (
                              <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Deleting...</>
                            ) : (
                              <><Trash2 className="h-4 w-4 mr-1" /> Delete</>
                            )}
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Video Preview Dialog */}
      <Dialog open={!!previewVideo} onOpenChange={(open) => !open && setPreviewVideo(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{previewVideo?.public_id.split('/').pop()}</DialogTitle>
            <DialogDescription>
              Play video, pause at a good frame, then click "Capture Current Frame" to create thumbnail
            </DialogDescription>
          </DialogHeader>
          {previewVideo && (
            <div className="space-y-4">
              {/* Manual Thumbnail Capture */}
              <ManualThumbnailCapture
                videoUrl={previewVideo.url || previewVideo.secure_url}
                videoId={previewVideo.public_id}
                posterUrl={getPosterUrl(previewVideo)}
                onSuccess={() => {
                  toast({
                    title: 'Thumbnail Saved',
                    description: 'Thumbnail has been updated for this video',
                  });
                  // Don't refetch to avoid disrupting workflow
                }}
              />
              
              {/* Video Metadata */}
              <div className="grid grid-cols-2 gap-4 text-sm pt-4 border-t">
                <div>
                  <span className="font-medium">Public ID:</span>
                  <p className="text-muted-foreground break-all">{previewVideo.public_id}</p>
                </div>
                {previewVideo.duration && (
                  <div>
                    <span className="font-medium">Duration:</span>
                    <p className="text-muted-foreground">{formatDuration(previewVideo.duration)}</p>
                  </div>
                )}
                {previewVideo.bytes && (
                  <div>
                    <span className="font-medium">Size:</span>
                    <p className="text-muted-foreground">{formatBytes(previewVideo.bytes)}</p>
                  </div>
                )}
                {previewVideo.created_at && (
                  <div>
                    <span className="font-medium">Uploaded:</span>
                    <p className="text-muted-foreground">{new Date(previewVideo.created_at).toLocaleString()}</p>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setPreviewVideo(null)}>
              Close
            </Button>
            {previewVideo && !isApproved(previewVideo.public_id) && (
              <Button 
                type="button"
                onClick={() => {
                  handleApprove(previewVideo.public_id);
                  setPreviewVideo(null);
                }}
                disabled={pendingVideoId === previewVideo.public_id}
              >
                <Check className="h-4 w-4 mr-1" />
                Approve Video
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Notes Dialog */}
      <Dialog open={showNotesDialog} onOpenChange={setShowNotesDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Admin Notes</DialogTitle>
            <DialogDescription>
              Add optional notes about this video approval (internal only)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Enter any notes about this video..."
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowNotesDialog(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSaveNotes} disabled={approveMutation.isPending}>
              {approveMutation.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Approving...</>
              ) : (
                'Approve Video'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

