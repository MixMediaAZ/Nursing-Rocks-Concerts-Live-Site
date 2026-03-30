import { useState } from 'react';
import { AdminImage } from './admin-image';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Gallery } from '@shared/schema';

export function DemoImageReplacement() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [refreshKey, setRefreshKey] = useState(Date.now());
  
  // Sample images for demonstration
  const demoImages: Gallery[] = [
    {
      id: 1,
      image_url: "/uploads/gallery/sample-1.jpg",
      thumbnail_url: "/uploads/gallery/sample-1-thumb.jpg",
      alt_text: "Concert Image 1",
      event_id: null,
      folder_id: null,
      media_type: "image",
      file_size: null,
      dimensions: null,
      duration: null,
      sort_order: 0,
      created_at: null,
      updated_at: null,
      z_index: 0,
      tags: null,
      metadata: null,
    },
    {
      id: 2,
      image_url: "/uploads/gallery/sample-2.jpg",
      thumbnail_url: "/uploads/gallery/sample-2-thumb.jpg",
      alt_text: "Concert Image 2",
      event_id: null,
      folder_id: null,
      media_type: "image",
      file_size: null,
      dimensions: null,
      duration: null,
      sort_order: 1,
      created_at: null,
      updated_at: null,
      z_index: 0,
      tags: null,
      metadata: null,
    },
    {
      id: 3, 
      image_url: "/uploads/gallery/sample-3.jpg",
      thumbnail_url: "/uploads/gallery/sample-3-thumb.jpg",
      alt_text: "Concert Image 3",
      event_id: null,
      folder_id: null,
      media_type: "image",
      file_size: null,
      dimensions: null,
      duration: null,
      sort_order: 2,
      created_at: null,
      updated_at: null,
      z_index: 0,
      tags: null,
      metadata: null,
    }
  ];
  
  // Manually refresh images (for demonstration purposes)
  const refreshImages = () => {
    setRefreshKey(Date.now());
  };
  
  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Image Replacement Demo</CardTitle>
          <CardDescription>
            Toggle admin mode to enable image replacement functionality. Hover over images to see the replace button.
          </CardDescription>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="admin-mode"
              checked={isAdmin}
              onCheckedChange={setIsAdmin}
            />
            <Label htmlFor="admin-mode">Admin Mode {isAdmin ? 'Enabled' : 'Disabled'}</Label>
          </div>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="grid">
            <TabsList className="mb-4">
              <TabsTrigger value="grid">Grid Layout</TabsTrigger>
              <TabsTrigger value="single">Single Image</TabsTrigger>
            </TabsList>
            
            <TabsContent value="grid">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {demoImages.map((image) => (
                  <div key={`${image.id}-${refreshKey}`} className="relative">
                    <AdminImage
                      imageData={image}
                      className="w-full h-64 object-cover rounded-md"
                      isAdmin={isAdmin}
                    />
                    <div className="mt-2 text-sm text-center text-gray-500">
                      {image.alt_text}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="single">
              <div className="max-w-xl mx-auto">
                <AdminImage
                  imageData={demoImages[0]}
                  className="w-full h-96 object-cover rounded-md"
                  isAdmin={isAdmin}
                />
                <div className="mt-2 text-center text-gray-500">
                  {demoImages[0].alt_text}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        
        <CardFooter>
          <button
            onClick={refreshImages}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Refresh Images
          </button>
        </CardFooter>
      </Card>
    </div>
  );
}
