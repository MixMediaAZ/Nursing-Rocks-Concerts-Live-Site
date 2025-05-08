import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CloudinaryVideoPlaylist } from '@/components/cloudinary-video-playlist';
import { CloudinaryIframeVideo } from '@/components/cloudinary-iframe-video';
import { checkCloudinaryConnection, detectResourceType } from '@/lib/cloudinary';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Grid3X3, List } from 'lucide-react';

const VideosPage = () => {
  const [cloudinaryCloudName, setCloudinaryCloudName] = useState<string | null>(null);
  const [featuredVideoId, setFeaturedVideoId] = useState('Nursing Rocks! Concerts- video/d9wtyh03k0tpfsvflagg');
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');
  const [isConnected, setIsConnected] = useState(false);
  
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
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              Experience the magic of our concerts supporting nurses across the country
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
              <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-500 text-white">
                <CardTitle>Featured Performance</CardTitle>
                <CardDescription className="text-white text-opacity-80">
                  Highlights from our recent Nursing Rocks concert
                </CardDescription>
              </CardHeader>
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
            <CloudinaryVideoPlaylist
              folder="Nursing Rocks! Concerts- video"
              limit={12}
              cloudName={cloudinaryCloudName}
              controls={true}
              autoPlay={false}
              muted={true}
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
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};

export default VideosPage;