import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { VideoPlaylist } from '@/components/video-playlist';
import { VideoSlideshow } from '@/components/video-slideshow';
import { checkVideoConnection } from '@/lib/video-service';
import { fetchApprovedVideos } from '@/lib/videos';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Grid3X3, List, Loader2 } from 'lucide-react';
import { shuffleArray } from '@/lib/utils';

const VideosPage = () => {
  const [featuredVideoId, setFeaturedVideoId] = useState('Nursing Rocks! Concerts- video/d9wtyh03k0tpfsvflagg');
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');
  const [isConnected, setIsConnected] = useState(false);
  const [allVideoIds, setAllVideoIds] = useState<string[]>([]);
  const [isLoadingVideos, setIsLoadingVideos] = useState(true);
  
  // Check video service connection when component mounts
  useEffect(() => {
    async function checkConnection() {
      try {
        const result = await checkVideoConnection();
        console.log("Video service connection check:", result);
        
        setIsConnected(!!result.connected);
      } catch (error) {
        console.error("Error checking video service connection:", error);
        setIsConnected(false);
      }
    }
    
    checkConnection();
  }, []);
  
  // Fetch all approved videos when component mounts or connection status changes
  useEffect(() => {
    if (!isConnected) return;
    
    async function fetchVideos() {
      setIsLoadingVideos(true);
      try {
        // Fetch approved videos (provider-neutral IDs) from server
        const videoIds = await fetchApprovedVideos();
        const shuffledIds = shuffleArray(videoIds);
        
        console.log(`🎬 Videos Page: Fetched ${videoIds.length} approved videos (shuffled)`);
        setAllVideoIds(shuffledIds);
        
        // Update the featured video if videos are available
        if (videoIds.length > 0) {
          setFeaturedVideoId(videoIds[0]);
        }
      } catch (error) {
        console.error('Error fetching videos:', error);
      } finally {
        setIsLoadingVideos(false);
      }
    }
    
    fetchVideos();
  }, [isConnected]);
  
  return (
    <>
      <Helmet>
        <title>Nursing Rocks! Videos | Concert Series</title>
        <meta name="description" content="Watch exclusive videos from the Nursing Rocks Concert Series. Experience the power of music and support for nurses." />
      </Helmet>
      
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
          <div 
            className="bg-gradient-to-br from-primary/90 to-[hsl(180,65%,35%)] text-white px-4 sm:px-6 md:px-8 py-4 sm:py-6 rounded-xl text-center mx-auto"
            style={{
              border: '4px solid transparent',
              background: 'linear-gradient(135deg, hsl(233, 100%, 27%) 0%, hsl(180, 65%, 35%) 100%) padding-box, linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(0,0,0,0.3) 100%) border-box',
              boxShadow: 'inset 4px 4px 8px rgba(255,255,255,0.3), inset -4px -4px 8px rgba(0,0,0,0.2), 8px 8px 24px rgba(0,0,0,0.25), -4px -4px 12px rgba(255,255,255,0.15)'
            }}
          >
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white drop-shadow-lg" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.4), 0 0 20px rgba(255,255,255,0.3)' }}>
              Nursing Rocks! Videos
            </h1>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl font-semibold mt-3 sm:mt-4 text-white/95" style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.3)' }}>
              We love you nurses....thanks for all you do....we see you.
            </p>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl font-semibold mt-1 sm:mt-2 text-white/95" style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.3)' }}>
              You rock and Nursing Rocks!
            </p>
          </div>
          
          {/* Layout toggle buttons */}
          <div className="flex items-center space-x-2">
            <Button 
              variant={layout === 'grid' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setLayout('grid')}
              className="w-10 h-10 p-0"
            >
              <Grid3X3 size={16} />
            </Button>
            <Button 
              variant={layout === 'list' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setLayout('list')}
              className="w-10 h-10 p-0"
            >
              <List size={16} />
            </Button>
          </div>
        </div>
        
        <Tabs defaultValue="featured" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="featured">Featured Videos</TabsTrigger>
            <TabsTrigger value="all">All Videos</TabsTrigger>
          </TabsList>
          
          <TabsContent value="featured" className="space-y-8">
            {/* Featured Video */}
            <Card className="overflow-hidden border-0 shadow-lg">
              <div className="bg-gradient-to-r from-purple-600 to-pink-500 overflow-hidden whitespace-nowrap relative p-4">
                <div className="animate-marquee inline-block">
                  <span className="text-white font-bold text-xl">
                    We love nurses one and all! Nursing Rocks! &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                  </span>
                </div>
                <div className="animate-marquee2 inline-block absolute top-4">
                  <span className="text-white font-bold text-xl">
                    We love nurses one and all! Nursing Rocks! &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                  </span>
                </div>
              </div>
              <CardContent className="p-0">
                  <VideoSlideshow
                    videos={allVideoIds}
                    autoPlay={true}
                    muted={false}
                    controls={true}
                    interval={20000}
                    maxAutoPlays={3}
                    className="w-full"
                  />
              </CardContent>
            </Card>
            
            {/* Connection status */}
            {!isConnected && (
              <div className="bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-900/50 rounded-md p-4 my-4">
                <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                  We're having trouble connecting to our video service. Some videos may not display correctly.
                </p>
              </div>
            )}
            
            {/* Selected Featured Videos */}
            <div className="space-y-4 border border-gray-300 rounded-lg p-6 bg-white/50 shadow-sm">
              <h2 className="text-2xl font-semibold">More Featured Videos</h2>
              <Separator />
              <div style={{ transform: 'scale(0.5)', transformOrigin: 'top left', width: '200%' }}>
                <VideoPlaylist
                  controls={true}
                  autoPlay={false}
                  muted={true}
                  loop={true}
                  layout={layout}
                  showDuration={true}
                  emptyMessage={
                    <div className="text-center p-8">
                      <p>Featured videos are being prepared. Check back soon!</p>
                    </div>
                  }
                />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="all" className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <h2 className="text-2xl font-semibold">All Nursing Rocks! Videos</h2>
              
              {/* Connection status */}
              {!isConnected && (
                <div className="text-yellow-600 dark:text-yellow-400 text-sm flex items-center">
                  <span className="inline-block w-2 h-2 rounded-full bg-yellow-500 mr-2"></span>
                  Limited connectivity
                </div>
              )}
            </div>
            <Separator />
            
            {/* Video Slideshow Section */}
            <div className="space-y-4 mb-8">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">Video Slideshow</h3>
                <p className="text-sm text-muted-foreground">
                  Auto-advancing slideshow of Nursing Rocks videos
                </p>
              </div>
              {isLoadingVideos ? (
                <div className="bg-muted/20 rounded-lg p-8 text-center flex items-center justify-center">
                  <Loader2 className="w-6 h-6 mr-2 animate-spin text-primary" />
                  <p>Loading videos for slideshow...</p>
                </div>
              ) : allVideoIds.length > 0 ? (
                <VideoSlideshow 
                  videos={allVideoIds}
                  autoPlay={true}
                  muted={false}
                  controls={true}
                  interval={15000} // 15 seconds per video
                  maxAutoPlays={3}
                  className="rounded-xl overflow-hidden shadow-xl border border-muted"
                />
              ) : (
                <div className="bg-muted/20 rounded-lg p-8 text-center">
                  <p>No videos available for slideshow</p>
                </div>
              )}
            </div>
            
            {/* Individual Videos */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Browse All Videos</h3>
              <VideoPlaylist
                limit={12}
                controls={true}
                autoPlay={false}
                muted={true}
                loop={true}
                layout={layout}
                showDuration={true}
                emptyMessage={
                  <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
                    <div className="rounded-full bg-gray-200 dark:bg-gray-800 p-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400">Video gallery is currently being updated</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500">Check back soon for new concert videos!</p>
                  </div>
                }
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};

export default VideosPage;