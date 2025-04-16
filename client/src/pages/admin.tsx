import { useState } from 'react';
import { MediaManager } from '@/components/media-manager';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export default function AdminPage() {
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  
  return (
    <div className="container mx-auto py-8 space-y-6">
      <h1 className="text-3xl font-bold text-center mb-8">
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
          Admin Dashboard
        </span>
      </h1>
      
      <Tabs defaultValue="media" className="w-full">
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
          <TabsTrigger value="media">Media Manager</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="media" className="mt-6">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Media Management</CardTitle>
              <CardDescription>
                Upload, organize, and manage your media files for the site
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Admin access required</AlertTitle>
                <AlertDescription>
                  You need admin rights to make permanent changes. Some features might be limited.
                </AlertDescription>
              </Alert>
              
              <MediaManager 
                onSelect={(asset) => setSelectedAsset(asset)}
              />
              
              {selectedAsset && (
                <div className="mt-6 p-4 border rounded-md">
                  <h3 className="font-medium mb-2">Selected Asset: {selectedAsset.title || selectedAsset.filename}</h3>
                  <pre className="text-xs bg-muted p-2 rounded-md overflow-auto max-h-40">
                    {JSON.stringify(selectedAsset, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="settings" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Site Settings</CardTitle>
              <CardDescription>
                Manage global settings for the Nursing Rocks Concert Series website
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                Settings administration is coming soon...
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}