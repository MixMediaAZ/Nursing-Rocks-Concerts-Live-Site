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
      <div className="medical-bg rounded-lg px-6 py-8 mb-8">
        <h1 className="text-3xl font-bold text-center">
          <span className="bg-clip-text text-transparent nurse-gradient">
            Clinical Media Management
          </span>
        </h1>
        <p className="text-center text-muted-foreground mt-2">
          Organize and manage <span className="heartbeat-animation">medical media resources</span> for the Nursing Rocks Concert Series
        </p>
      </div>
      
      <Tabs defaultValue="media" className="w-full">
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 rounded-full overflow-hidden">
          <TabsTrigger value="media" className="data-[state=active]:bg-primary data-[state=active]:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <circle cx="8.5" cy="8.5" r="1.5"></circle>
              <polyline points="21 15 16 10 5 21"></polyline>
            </svg>
            Media Library
          </TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:bg-primary data-[state=active]:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
            Settings
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="media" className="mt-6">
          <Card className="medical-card">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
              <div className="flex items-center">
                <div className="p-2 bg-primary rounded-full mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="12" y1="18" x2="12" y2="12"></line>
                    <line x1="9" y1="15" x2="15" y2="15"></line>
                  </svg>
                </div>
                <div>
                  <CardTitle>Medical Media Resources</CardTitle>
                  <CardDescription>
                    Upload, organize, and manage media files for the Nursing Rocks platform
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Alert className="mb-6 border-l-4 border-l-primary bg-primary/5">
                <AlertCircle className="h-4 w-4 text-primary" />
                <AlertTitle>Clinical Administrator Access</AlertTitle>
                <AlertDescription>
                  This section requires administrator privileges. Some functionality may be limited based on your access level.
                </AlertDescription>
              </Alert>
              
              <MediaManager 
                onSelect={(asset) => setSelectedAsset(asset)}
              />
              
              {selectedAsset && (
                <div className="mt-6 p-4 border rounded-md bg-primary/5">
                  <h3 className="font-medium mb-2 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 9v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7"></path>
                      <path d="m14 2 5 5-5 5"></path>
                      <path d="M9 15h5"></path>
                    </svg>
                    Selected Resource: {selectedAsset.title || selectedAsset.filename}
                  </h3>
                  <pre className="text-xs bg-white p-3 rounded-md overflow-auto max-h-40 border">
                    {JSON.stringify(selectedAsset, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="settings" className="mt-6">
          <Card className="medical-card">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
              <div className="flex items-center">
                <div className="p-2 bg-primary rounded-full mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                </div>
                <div>
                  <CardTitle>Clinical System Settings</CardTitle>
                  <CardDescription>
                    Manage global configuration for the Nursing Rocks Concert Series platform
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="p-8 text-center border border-dashed rounded-md bg-primary/5">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-primary/40 mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 12h20"></path>
                  <path d="M12 2v20"></path>
                </svg>
                <p className="text-muted-foreground font-medium">
                  Clinical settings administration module coming soon
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  System update scheduled for next maintenance window
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}