import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CloudinaryVideoPlaylist } from '@/components/cloudinary-video-playlist';
import { CloudinaryIframeVideo } from '@/components/cloudinary-iframe-video';
import { VideoSlideshow } from '@/components/video-slideshow';
import { checkCloudinaryConnection, detectResourceType } from '@/lib/cloudinary';
import { fetchCloudinaryVideos, type CloudinaryResource } from '@/lib/api';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Grid3X3, List, Loader2 } from 'lucide-react';

const VideosPage = () => {
  const [cloudinaryCloudName, setCloudinaryCloudName] = useState<string | undefined>(undefined);
  const [featuredVideoId, setFeaturedVideoId] = useState('Nursing Rocks! Concerts- video/d9wtyh03k0tpfsvflagg');
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');
  const [isConnected, setIsConnected] = useState(false);
  const [allVideoIds, setAllVideoIds] = useState<string[]>([]);
  const [isLoadingVideos, setIsLoadingVideos] = useState(true);
  
  // Check Cloudinary connection when component mounts
  useEffect(() => {
    async function checkConnection() {
      try {
        const result = await checkCloudinaryConnection();
        console.log("Cloudinary connection check:", result);
        
        if (result.connected && result.cloudName) {
          setCloudinaryCloudName(result.cloudName);
          setIsConnected(true);
        } else {
          setIsConnected(false);
        }
      } catch (error) {
        console.error("Error checking Cloudinary connection:", error);
        setIsConnected(false);
      }
    }
    
    checkConnection();
  }, []);
  
  // Fetch all videos from Cloudinary when component mounts or connection status changes
  useEffect(() => {
    if (!isConnected) return;
    
    async function fetchVideos() {
      setIsLoadingVideos(true);
      try {
        // Fetch videos from the Nursing Rocks Cloudinary folder
        const videos = await fetchCloudinaryVideos('Nursing Rocks! Concerts- video');
        
        // Extract public_ids for the video slideshow
        const videoIds = videos.map((video) => video.public_id);
        
        console.log(`Fetched ${videoIds.length} videos from Cloudinary`);
        setAllVideoIds(videoIds);
        
        // Update the featured video if videos are available
        if (videoIds.length > 0) {
          // Find a high-quality video for the feature spot
          const featuredVideo = videos.find((v) => 
            v.width && v.width >= 1280 && v.format === 'mp4'
          ) || videos[0];
          
          if (featuredVideo) {
            setFeaturedVideoId(featuredVideo.public_id);
          }
        }
      } catch (error) {
        console.error('Error fetching videos:', error);
      } finally {
        setIsLoadingVideos(false);
      }
    }
    
    fetchVideos();
  }, [isConnected]);
  
  // Use resource type detection to verify video format
  const videoResourceType = detectResourceType(featuredVideoId);
  
  return (
    <>
      <Helmet>
        <title>Nursing Rocks! Videos | Concert Series</title>
        <meta name="description" content="Watch exclusive videos from the Nursing Rocks Concert Series. Experience the power of music and support for nurses." />
      </Helmet>
      
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">Nursing Rocks! Videos</h1>
            <p className="text-gray-800 dark:text-gray-200 font-medium mt-2">
              We love you nurses....thanks for all you do....we see you. You rock and Nursing Rocks!
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
                <div className="aspect-video w-full">
                  <CloudinaryIframeVideo 
                    publicId={featuredVideoId}
                    className="w-full h-full"
                    autoPlay={true}
                    muted={true}
                    controls={true}
                    loop={true}
                    cloudName={cloudinaryCloudName}
                    resourceType={videoResourceType}
                    fallbackContent={
                      <div className="flex items-center justify-center h-full bg-gray-900 text-gray-400">
                        <span>Featured video unavailable</span>
                      </div>
                    }
                  />
                </div>
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
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold">More Featured Videos</h2>
              <Separator />
              <CloudinaryVideoPlaylist
                folder="Nursing Rocks! Concerts- video"
                limit={4}
                cloudName={cloudinaryCloudName}
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
                  cloudName={cloudinaryCloudName || undefined}
                  autoPlay={true}
                  muted={true}
                  controls={true}
                  interval={15000} // 15 seconds per video
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
              <CloudinaryVideoPlaylist
                folder="Nursing Rocks! Concerts- video"
                limit={12}
                cloudName={cloudinaryCloudName}
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