import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AdminImage } from '@/components/admin-image';
import { Gallery } from '@shared/schema';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';

export default function DemoReplacePage() {
  // Demo state to mock admin permissions
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Fetch a couple of sample images to demonstrate replacement
  const { data: galleryData, isLoading } = useQuery<Gallery[] | {rows: Gallery[]}>({
    queryKey: ['/api/gallery']
  });
  
  // Handle different API response structures
  const images = useMemo(() => {
    if (!galleryData) return [];
    
    let result: Gallery[] = [];
    if (Array.isArray(galleryData)) {
      result = galleryData;
    } else if (typeof galleryData === 'object' && 'rows' in galleryData && Array.isArray(galleryData.rows)) {
      result = galleryData.rows;
    }
    
    return result.slice(0, 5); // Only take the first 5 images
  }, [galleryData]);
  
  // Get two sample images for the demo
  const sampleImage1 = images[0];
  const sampleImage2 = images[1];
  
  const handleRefresh = () => {
    window.location.reload();
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  if (!sampleImage1 || !sampleImage2) {
    return (
      <div className="container py-8 mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Demo: Image Replacement</CardTitle>
            <CardDescription>
              No gallery images available. Please upload some images first.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container py-8 mx-auto">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Demo: Image Replacement</CardTitle>
              <CardDescription>
                This demo shows how to replace images on the live site with others from the gallery
              </CardDescription>
            </div>
            <div className="flex gap-4">
              <Button 
                variant={isAdmin ? "default" : "outline"}
                onClick={() => setIsAdmin(prev => !prev)}
              >
                {isAdmin ? "Admin Mode: ON" : "Admin Mode: OFF"}
              </Button>
              <Button variant="outline" onClick={handleRefresh}>
                Refresh Demo
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="flex flex-col gap-8">
            <div>
              <h3 className="text-lg font-medium mb-4">Instructions</h3>
              <ol className="list-decimal pl-5 space-y-2">
                <li>Toggle "Admin Mode" to ON to see the replace button on hover</li>
                <li>Hover over any image to see the replace button</li>
                <li>Click "Replace" to open the gallery selection</li>
                <li>Select any image from the gallery to replace the current image</li>
                <li>The system will automatically resize the new image to match the original dimensions</li>
              </ol>
            </div>
            
            <Separator />
            
            <Tabs defaultValue="cards">
              <TabsList>
                <TabsTrigger value="cards">Card Layout</TabsTrigger>
                <TabsTrigger value="hero">Hero Layout</TabsTrigger>
                <TabsTrigger value="mixed">Mixed Layout</TabsTrigger>
              </TabsList>
              
              <TabsContent value="cards" className="pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Demo Card 1 */}
                  <Card>
                    <div className="aspect-video overflow-hidden rounded-t-lg relative">
                      <AdminImage 
                        imageData={sampleImage1}
                        isAdmin={isAdmin}
                        className="w-full h-full object-cover"
                        alt="Demo image 1"
                      />
                    </div>
                    <CardHeader>
                      <CardTitle>Replaceable Concert Image</CardTitle>
                      <CardDescription>
                        Hover over this image when admin mode is on to see the replace button
                      </CardDescription>
                    </CardHeader>
                  </Card>
                  
                  {/* Demo Card 2 */}
                  <Card>
                    <div className="aspect-video overflow-hidden rounded-t-lg relative">
                      <AdminImage 
                        imageData={sampleImage2}
                        isAdmin={isAdmin}
                        className="w-full h-full object-cover"
                        alt="Demo image 2"
                      />
                    </div>
                    <CardHeader>
                      <CardTitle>Another Replaceable Image</CardTitle>
                      <CardDescription>
                        This image can also be replaced with any gallery image
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="hero" className="pt-4">
                <div className="space-y-6">
                  <div className="relative aspect-[21/9] rounded-lg overflow-hidden">
                    <AdminImage 
                      imageData={sampleImage1}
                      isAdmin={isAdmin}
                      className="w-full h-full object-cover"
                      alt="Hero image"
                      triggerPosition="bottom-right"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-8">
                      <h2 className="text-3xl font-bold text-white mb-2">Hero Banner</h2>
                      <p className="text-white/80 max-w-xl">
                        Replaceable hero images maintain their aspect ratio when replaced.
                        The replacement image will be automatically resized to match.
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="mixed" className="pt-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 bg-slate-50 rounded-lg p-6 flex flex-col md:flex-row gap-6 items-center">
                    <div className="w-full md:w-1/3 aspect-square rounded-lg overflow-hidden">
                      <AdminImage 
                        imageData={sampleImage1}
                        isAdmin={isAdmin}
                        className="w-full h-full object-cover"
                        alt="Featured product"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-2">Featured Product</h3>
                      <p className="text-slate-600 mb-4">
                        This product image can be replaced while maintaining its square aspect ratio.
                      </p>
                      <div className="flex gap-2">
                        <Button variant="default" size="sm">Buy Now</Button>
                        <Button variant="outline" size="sm">Learn More</Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-slate-50 rounded-lg overflow-hidden flex flex-col">
                    <div className="aspect-[4/3] relative">
                      <AdminImage 
                        imageData={sampleImage2}
                        isAdmin={isAdmin}
                        className="w-full h-full object-cover"
                        alt="Related product"
                      />
                    </div>
                    <div className="p-4">
                      <h4 className="font-medium">Related Item</h4>
                      <p className="text-sm text-slate-500">This 4:3 image is also replaceable</p>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}