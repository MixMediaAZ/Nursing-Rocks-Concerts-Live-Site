import { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, Upload, Image, Check } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const UploadUtilityPage = () => {
  const [file, setFile] = useState<File | null>(null);
  const [files, setFiles] = useState<FileList | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const { toast } = useToast();

  const handleSingleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleMultipleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles(e.target.files);
    }
  };

  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a file to upload",
        variant: "destructive"
      });
      return;
    }
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('destination', 'city_backgrounds');
    
    setUploading(true);
    
    try {
      const response = await fetch('/api/upload/city-background', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: "Upload successful",
          description: `File ${data.filename} has been uploaded successfully!`,
        });
        
        setUploadedFiles(prev => [...prev, data.path]);
        setFile(null);
        // Reset the file input
        const fileInput = document.getElementById('file-upload') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      } else {
        throw new Error(data.message || 'Upload failed');
      }
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "An error occurred during upload",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };
  
  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!files || files.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select files to upload",
        variant: "destructive"
      });
      return;
    }
    
    setUploading(true);
    
    // Instead of using bulk endpoint, upload files individually to avoid multer issues
    try {
      const uploadedPaths: string[] = [];
      let successCount = 0;
      let errorCount = 0;
      
      // Process each file individually
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const singleFormData = new FormData();
        singleFormData.append('file', file);
        singleFormData.append('destination', 'city_backgrounds');
        
        try {
          // Use the single file upload endpoint which is working
          const response = await fetch('/api/upload/city-background', {
            method: 'POST',
            body: singleFormData,
          });
          
          const result = await response.json();
          
          if (response.ok) {
            successCount++;
            uploadedPaths.push(result.path);
          } else {
            errorCount++;
            console.error(`Error uploading file ${file.name}: ${result.message}`);
          }
        } catch (fileError) {
          errorCount++;
          console.error(`Error uploading file ${file.name}:`, fileError);
        }
      }
      
      // Update UI based on overall results
      if (successCount > 0) {
        toast({
          title: "Upload completed",
          description: `Successfully uploaded ${successCount} files${errorCount > 0 ? `, failed to upload ${errorCount} files` : ''}`,
          variant: errorCount > 0 ? "destructive" : "default",
        });
        
        // Add all successful paths to the list
        setUploadedFiles(prev => [...prev, ...uploadedPaths]);
        setFiles(null);
        // Reset the file input
        const fileInput = document.getElementById('files-upload') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      } else {
        throw new Error("All file uploads failed");
      }
    } catch (error) {
      toast({
        title: "Bulk upload failed",
        description: error instanceof Error ? error.message : "An error occurred during upload",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };
  
  return (
    <>
      <Helmet>
        <title>Upload Utility | Nursing Rocks</title>
      </Helmet>
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Upload Utility</h1>
          <p className="text-gray-500 mt-2 md:mt-0">
            Upload JPG images to city backgrounds folder
          </p>
        </div>

        <Alert className="mb-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-900/50">
          <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertTitle>Upload Instructions</AlertTitle>
          <AlertDescription>
            Images will be stored in the <code>/public/assets/city_backgrounds</code> folder and can be referenced in your code as shown in the examples below.
          </AlertDescription>
        </Alert>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Tabs defaultValue="single" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="single">Single Upload</TabsTrigger>
                <TabsTrigger value="bulk">Bulk Upload</TabsTrigger>
              </TabsList>
              
              <TabsContent value="single" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Upload size={18} />
                      Upload Single JPG Image
                    </CardTitle>
                    <CardDescription>
                      Upload an individual JPG image to the city backgrounds folder
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSingleSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="file-upload">Select Image (JPG)</Label>
                        <Input 
                          id="file-upload"
                          type="file" 
                          accept="image/jpeg,image/jpg"
                          onChange={handleSingleFileChange}
                          className="cursor-pointer"
                          disabled={uploading}
                        />
                      </div>
                      
                      <Button 
                        type="submit" 
                        disabled={!file || uploading}
                        className="w-full"
                      >
                        {uploading ? 'Uploading...' : 'Upload Image'}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="bulk" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Image size={18} />
                      Bulk Upload JPG Images
                    </CardTitle>
                    <CardDescription>
                      Upload multiple JPG images at once (up to 20 files)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleBulkSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="files-upload">Select Multiple Images (JPG)</Label>
                        <Input 
                          id="files-upload"
                          type="file" 
                          accept="image/jpeg,image/jpg"
                          onChange={handleMultipleFileChange}
                          multiple
                          className="cursor-pointer"
                          disabled={uploading}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          {files ? `${files.length} files selected` : 'No files selected'}
                        </p>
                      </div>
                      
                      <Button 
                        type="submit" 
                        disabled={!files || files.length === 0 || uploading}
                        className="w-full"
                      >
                        {uploading ? 'Uploading...' : 'Upload All Images'}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
            
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4">Usage Examples</h2>
              <Card>
                <CardContent className="pt-6">
                  <p className="mb-2">To use the uploaded images in your code:</p>
                  <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-sm overflow-x-auto">
                    {'// In CSS\nbackground-image: url(\'/assets/city_backgrounds/your-file-name.jpg\');\n\n// In React with import\nimport cityImage from \'@assets/city_backgrounds/your-file-name.jpg\';'}
                  </pre>
                </CardContent>
              </Card>
            </div>
          </div>
          
          <div className="lg:col-span-1">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Check size={18} />
                  Uploaded Files
                </CardTitle>
                <CardDescription>
                  Recently uploaded files
                </CardDescription>
                <Separator />
              </CardHeader>
              <CardContent className="max-h-[500px] overflow-y-auto">
                {uploadedFiles.length > 0 ? (
                  <ul className="space-y-2">
                    {uploadedFiles.map((path, index) => (
                      <li key={index} className="p-2 bg-gray-100 dark:bg-gray-800 rounded text-sm">
                        {path}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No files uploaded yet
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};

export default UploadUtilityPage;