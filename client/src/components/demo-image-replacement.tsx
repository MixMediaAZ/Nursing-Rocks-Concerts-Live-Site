import { useState } from 'react';
import { AdminImage } from './admin-image';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export function DemoImageReplacement() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [refreshKey, setRefreshKey] = useState(Date.now());
  
  // Sample images for demonstration
  const demoImages = [
    {
      id: 1,
      src: "/uploads/gallery/sample-1.jpg",
      alt: "Concert Image 1",
      className: "w-full h-64 object-cover rounded-md"
    },
    {
      id: 2,
      src: "/uploads/gallery/sample-2.jpg",
      alt: "Concert Image 2",
      className: "w-full h-64 object-cover rounded-md"
    },
    {
      id: 3, 
      src: "/uploads/gallery/sample-3.jpg",
      alt: "Concert Image 3",
      className: "w-full h-64 object-cover rounded-md"
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
                      src={image.src}
                      alt={image.alt}
                      className={image.className}
                      showLoadingIndicator={true}
                      isAdmin={isAdmin}
                      imageId={image.id}
                    />
                    <div className="mt-2 text-sm text-center text-gray-500">
                      {image.alt}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="single">
              <div className="max-w-xl mx-auto">
                <AdminImage
                  src={demoImages[0].src}
                  alt={demoImages[0].alt}
                  className="w-full h-96 object-cover rounded-md"
                  showLoadingIndicator={true}
                  isAdmin={isAdmin}
                  imageId={demoImages[0].id}
                />
                <div className="mt-2 text-center text-gray-500">
                  {demoImages[0].alt}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        
        <CardFooter>
          <p className="text-sm text-gray-500 mb-4">
            When admin mode is enabled, hover over the images to see the replacement option. 
            Click "Replace" to open the gallery selection dialog.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}