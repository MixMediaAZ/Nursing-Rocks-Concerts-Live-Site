import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CloudinaryVideoPlaylist } from '@/components/cloudinary-video-playlist';
import { CloudinaryIframeVideo } from '@/components/cloudinary-iframe-video';
import { checkCloudinaryConnection } from '@/lib/cloudinary';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';

const VideosPage = () => {
  const [cloudinaryCloudName, setCloudinaryCloudName] = useState<string | null>(null);
  const [featuredVideoId, setFeaturedVideoId] = useState('Nursing Rocks! Concerts- video/d9wtyh03k0tpfsvflagg');
  
  // Check Cloudinary connection when component mounts
  useEffect(() => {
    async function checkConnection() {
      try {
        const result = await checkCloudinaryConnection();
        console.log("Cloudinary connection check:", result);
        
        if (result.cloudName) {
          setCloudinaryCloudName(result.cloudName);
        }
      } catch (error) {
        console.error("Error checking Cloudinary connection:", error);
      }
    }
    
    checkConnection();
  }, []);
  
  return (
    <>
      <Helmet>
        <title>Videos | Nursing Rocks Concert Series</title>
        <meta name="description" content="Watch exclusive videos from the Nursing Rocks Concert Series. Experience the power of music and support for nurses." />
      </Helmet>
      
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <h1 className="text-3xl md:text-4xl font-bold mb-2 text-center">Concert Videos</h1>
        <p className="text-center text-gray-500 dark:text-gray-400 mb-8">
          Experience the magic of our concerts supporting nurses across the country
        </p>
        
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
                    loop={false}
                    cloudName={cloudinaryCloudName}
                    fallbackContent={
                      <div className="flex items-center justify-center h-full bg-gray-900 text-gray-400">
                        <span>Featured video unavailable</span>
                      </div>
                    }
                  />
                </div>
              </CardContent>
            </Card>
            
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
                emptyMessage={
                  <div className="text-center p-8">
                    <p>Featured videos are being prepared. Check back soon!</p>
                  </div>
                }
              />
            </div>
          </TabsContent>
          
          <TabsContent value="all" className="space-y-8">
            <h2 className="text-2xl font-semibold">All Concert Videos</h2>
            <Separator />
            <CloudinaryVideoPlaylist
              folder="Nursing Rocks! Concerts- video"
              limit={12}
              cloudName={cloudinaryCloudName}
              controls={true}
              autoPlay={false}
              muted={true}
              emptyMessage={
                <div className="text-center p-8">
                  <p>Video gallery is currently being updated. Check back soon!</p>
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