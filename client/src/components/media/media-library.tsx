import { useState, useEffect } from 'react';
import { 
  MediaAsset, 
  createMediaAsset, 
  registerAsset, 
  getAllAssets, 
  getAssetsByType 
} from '@/lib/assetLoader';
import { SafeImage } from './image-display';
import { VideoDisplay } from './video-display';
import { AudioDisplay } from './audio-display';
import { DocumentDisplay } from './document-display';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

interface MediaLibraryProps {
  onSelect?: (asset: MediaAsset) => void;
  filter?: 'all' | 'image' | 'video' | 'audio' | 'document';
  className?: string;
}

/**
 * A component for displaying and selecting from available media assets
 */
export function MediaLibrary({
  onSelect,
  filter = 'all',
  className = '',
}: MediaLibraryProps) {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [filteredAssets, setFilteredAssets] = useState<MediaAsset[]>([]);
  const [activeFilter, setActiveFilter] = useState<MediaLibraryProps['filter']>(filter);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Load all available assets
  useEffect(() => {
    setAssets(getAllAssets());
  }, []);

  // Filter assets based on activeFilter and searchQuery
  useEffect(() => {
    let filtered = assets;
    
    // Apply type filter
    if (activeFilter !== 'all') {
      filtered = getAssetsByType(activeFilter);
    }
    
    // Apply search filter if query exists
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(asset => 
        asset.title?.toLowerCase().includes(query) || 
        asset.description?.toLowerCase().includes(query) ||
        asset.path.toLowerCase().includes(query)
      );
    }
    
    setFilteredAssets(filtered);
  }, [assets, activeFilter, searchQuery]);

  // Handler for selecting an asset
  const handleSelect = (asset: MediaAsset) => {
    if (onSelect) {
      onSelect(asset);
    }
  };

  return (
    <div className={`border rounded-md ${className}`}>
      <div className="p-4 border-b">
        <h2 className="text-xl font-semibold mb-4">Media Library</h2>
        
        {/* Search and filter controls */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-grow">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search media assets..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Tabs 
            value={activeFilter} 
            onValueChange={(value) => setActiveFilter(value as MediaLibraryProps['filter'])}
            className="w-full sm:w-auto"
          >
            <TabsList className="w-full grid grid-cols-5">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="image">Images</TabsTrigger>
              <TabsTrigger value="video">Videos</TabsTrigger>
              <TabsTrigger value="audio">Audio</TabsTrigger>
              <TabsTrigger value="document">Docs</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>
      
      {/* Media grid */}
      <div className="p-4 overflow-y-auto max-h-[500px]">
        {filteredAssets.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredAssets.map((asset) => (
              <div 
                key={asset.id} 
                className="border rounded-md overflow-hidden cursor-pointer hover:border-primary transition-colors"
                onClick={() => handleSelect(asset)}
              >
                <MediaItem asset={asset} />
                <div className="p-2">
                  <h3 className="text-sm font-medium truncate">{asset.title || asset.path.split('/').pop()}</h3>
                  <p className="text-xs text-muted-foreground">{asset.type}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No media assets found</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper component to render the preview of a media asset
function MediaItem({ asset }: { asset: MediaAsset }) {
  switch (asset.type) {
    case 'image':
      return (
        <div className="aspect-square bg-muted">
          <SafeImage
            src={asset.path}
            alt={asset.alt || 'Image'}
            className="w-full h-full object-cover"
          />
        </div>
      );
    case 'video':
      return (
        <div className="aspect-video bg-muted">
          <VideoDisplay
            src={asset.path}
            title={asset.title}
            className="w-full h-full"
            controls={false}
          />
        </div>
      );
    case 'audio':
      return (
        <div className="aspect-square bg-muted flex items-center justify-center p-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-muted-foreground/50" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
          </svg>
        </div>
      );
    case 'document':
      return (
        <div className="aspect-square bg-muted flex items-center justify-center p-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-muted-foreground/50" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
          </svg>
        </div>
      );
    default:
      return (
        <div className="aspect-square bg-muted flex items-center justify-center p-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-muted-foreground/50" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd" />
          </svg>
        </div>
      );
  }
}

// Export a function to register new media assets
export function registerMediaAssets(assetPaths: Array<string | Partial<MediaAsset>>) {
  assetPaths.forEach(asset => {
    if (typeof asset === 'string') {
      // Create and register asset from path string
      const mediaAsset = createMediaAsset(asset);
      registerAsset(mediaAsset);
    } else if (typeof asset === 'object' && asset.path) {
      // Create and register asset from partial asset object
      const mediaAsset = createMediaAsset(
        asset.path,
        asset.id,
        {
          alt: asset.alt,
          title: asset.title,
          description: asset.description,
          metadata: asset.metadata,
        }
      );
      registerAsset(mediaAsset);
    }
  });
}