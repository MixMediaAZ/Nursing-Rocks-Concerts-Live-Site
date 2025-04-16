import { useState, useEffect } from 'react';
import { MediaAsset } from '@shared/schema';
import { mediaService } from '@/lib/mediaService';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Image, FileVideo, FileAudio, File, RefreshCw } from 'lucide-react';

interface MediaLibraryProps {
  onSelect?: (asset: MediaAsset) => void;
  filter?: 'all' | 'image' | 'video' | 'audio' | 'document' | 'other';
  className?: string;
}

/**
 * A component for browsing and selecting media from the library
 */
export function MediaLibrary({
  onSelect,
  filter = 'all',
  className = '',
}: MediaLibraryProps) {
  const [selectedTab, setSelectedTab] = useState(filter === 'all' ? 'image' : filter);
  
  // Fetch media assets from the server
  const { data: assets = [], isLoading } = useQuery({
    queryKey: ['/api/media'],
    queryFn: () => mediaService.getMediaList(),
  });
  
  // Filter assets by type
  const filteredAssets = filter === 'all' 
    ? assets 
    : assets.filter(asset => asset.type === filter);
  
  // Filter assets by selected tab
  const tabFilteredAssets = selectedTab === 'all'
    ? filteredAssets
    : filteredAssets.filter(asset => asset.type === selectedTab);
  
  // Handle media selection
  const handleSelect = (asset: MediaAsset) => {
    if (onSelect) {
      onSelect(asset);
    }
  };
  
  // Get icon for media type
  const getTypeIcon = (type: 'image' | 'video' | 'audio' | 'document' | 'other') => {
    switch (type) {
      case 'image':
        return <Image className="h-4 w-4" />;
      case 'video':
        return <FileVideo className="h-4 w-4" />;
      case 'audio':
        return <FileAudio className="h-4 w-4" />;
      case 'document':
        return <File className="h-4 w-4" />;
      default:
        return <File className="h-4 w-4" />;
    }
  };
  
  return (
    <div className={`border rounded-md ${className}`}>
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="w-full grid grid-cols-5">
          <TabsTrigger value="all" className="text-xs flex gap-1 items-center">
            All
          </TabsTrigger>
          <TabsTrigger value="image" className="text-xs flex gap-1 items-center">
            <Image className="h-3 w-3" />
            Images
          </TabsTrigger>
          <TabsTrigger value="video" className="text-xs flex gap-1 items-center">
            <FileVideo className="h-3 w-3" />
            Videos
          </TabsTrigger>
          <TabsTrigger value="audio" className="text-xs flex gap-1 items-center">
            <FileAudio className="h-3 w-3" />
            Audio
          </TabsTrigger>
          <TabsTrigger value="document" className="text-xs flex gap-1 items-center">
            <File className="h-3 w-3" />
            Docs
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="p-0">
          <MediaGrid assets={tabFilteredAssets} onSelect={handleSelect} isLoading={isLoading} />
        </TabsContent>
        <TabsContent value="image" className="p-0">
          <MediaGrid assets={tabFilteredAssets} onSelect={handleSelect} isLoading={isLoading} />
        </TabsContent>
        <TabsContent value="video" className="p-0">
          <MediaGrid assets={tabFilteredAssets} onSelect={handleSelect} isLoading={isLoading} />
        </TabsContent>
        <TabsContent value="audio" className="p-0">
          <MediaGrid assets={tabFilteredAssets} onSelect={handleSelect} isLoading={isLoading} />
        </TabsContent>
        <TabsContent value="document" className="p-0">
          <MediaGrid assets={tabFilteredAssets} onSelect={handleSelect} isLoading={isLoading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface MediaGridProps {
  assets: MediaAsset[];
  onSelect?: (asset: MediaAsset) => void;
  isLoading?: boolean;
}

function MediaGrid({ assets, onSelect, isLoading = false }: MediaGridProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-6 h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="mt-2 text-sm text-muted-foreground">Loading media assets...</p>
      </div>
    );
  }

  if (assets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-6 h-64">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-muted-foreground/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p className="mt-2 text-sm text-muted-foreground">No media found</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-64 p-2">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {assets.map((asset) => (
          <Button
            key={asset.id}
            variant="ghost"
            className="p-0 h-auto flex flex-col items-stretch"
            onClick={() => onSelect && onSelect(asset)}
          >
            <div className="aspect-square w-full relative bg-muted overflow-hidden rounded-md">
              {asset.type === 'image' ? (
                <img 
                  src={asset.path} 
                  alt={asset.alt || 'Image'} 
                  className="absolute w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full w-full">
                  {asset.type === 'video' ? (
                    <FileVideo className="h-8 w-8 text-muted-foreground/70" />
                  ) : asset.type === 'audio' ? (
                    <FileAudio className="h-8 w-8 text-muted-foreground/70" />
                  ) : (
                    <File className="h-8 w-8 text-muted-foreground/70" />
                  )}
                </div>
              )}
            </div>
            <div className="w-full pt-1 px-1">
              <p className="text-xs truncate text-start">{asset.title || asset.filename}</p>
            </div>
          </Button>
        ))}
      </div>
    </ScrollArea>
  );
}