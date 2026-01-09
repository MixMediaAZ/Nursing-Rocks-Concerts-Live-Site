import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Image as ImageIcon, Check, X } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface VideoResource {
  public_id: string;
  url: string;
  secure_url: string;
}

interface ThumbnailGeneratorProps {
  videos: VideoResource[];
}

export function ThumbnailGenerator({ videos }: ThumbnailGeneratorProps) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<{ [key: string]: 'success' | 'error' }>({});

  const generateThumbnail = async (video: VideoResource): Promise<void> => {
    // Server-side thumbnail generation
    const response = await fetch('/api/admin/videos/generate-thumbnail', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
      },
      body: JSON.stringify({
        videoUrl: video.url || video.secure_url,
        videoId: video.public_id,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to generate thumbnail');
    }
  };

  const generateAllThumbnails = async () => {
    setIsGenerating(true);
    setProgress(0);
    setResults({});

    const newResults: { [key: string]: 'success' | 'error' } = {};

    for (let i = 0; i < videos.length; i++) {
      const video = videos[i];
      
      try {
        console.log(`[ThumbnailGen] Processing ${video.public_id}...`);
        
        // Generate thumbnail on server
        await generateThumbnail(video);
        
        newResults[video.public_id] = 'success';
        console.log(`[ThumbnailGen] ✓ Success: ${video.public_id}`);
        
        toast({
          title: 'Thumbnail Generated',
          description: `Created thumbnail for ${video.public_id.split('/').pop()}`,
        });
      } catch (error) {
        console.error(`[ThumbnailGen] ✗ Failed: ${video.public_id}`, error);
        newResults[video.public_id] = 'error';
        
        toast({
          variant: 'destructive',
          title: 'Thumbnail Failed',
          description: `Could not generate thumbnail for ${video.public_id.split('/').pop()}`,
        });
      }

      setProgress(((i + 1) / videos.length) * 100);
      setResults({ ...newResults });
    }

    setIsGenerating(false);
    
    const successCount = Object.values(newResults).filter(r => r === 'success').length;
    const errorCount = Object.values(newResults).filter(r => r === 'error').length;

    toast({
      title: 'Thumbnail Generation Complete',
      description: `Success: ${successCount}, Failed: ${errorCount}`,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          Thumbnail Generator
        </CardTitle>
        <CardDescription>
          Generate thumbnail images from videos at 3 seconds. This will create poster images for all videos.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {videos.length} videos found
          </div>
          <Button
            onClick={generateAllThumbnails}
            disabled={isGenerating || videos.length === 0}
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <ImageIcon className="mr-2 h-4 w-4" />
                Generate All Thumbnails
              </>
            )}
          </Button>
        </div>

        {isGenerating && (
          <div className="space-y-2">
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-muted-foreground text-center">
              {Math.round(progress)}% complete
            </p>
          </div>
        )}

        {Object.keys(results).length > 0 && (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            <p className="text-sm font-medium">Results:</p>
            {videos.map(video => {
              const result = results[video.public_id];
              if (!result) return null;
              
              return (
                <div
                  key={video.public_id}
                  className="flex items-center gap-2 text-sm p-2 rounded bg-muted"
                >
                  {result === 'success' ? (
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                  ) : (
                    <X className="h-4 w-4 text-red-600 flex-shrink-0" />
                  )}
                  <span className="truncate">{video.public_id}</span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

