import { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

const UploadUtilityPage = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
  
  return (
    <>
      <Helmet>
        <title>Upload Utility | Nursing Rocks</title>
      </Helmet>
      
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Upload Utility</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Upload City Background Image</CardTitle>
              <CardDescription>
                Upload JPG images to the city backgrounds folder
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="file-upload">Select Image (JPG)</Label>
                  <Input 
                    id="file-upload"
                    type="file" 
                    accept="image/jpeg,image/jpg"
                    onChange={handleFileChange}
                    className="cursor-pointer"
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
          
          <Card>
            <CardHeader>
              <CardTitle>Uploaded Files</CardTitle>
              <CardDescription>
                Recently uploaded files will appear here
              </CardDescription>
            </CardHeader>
            <CardContent>
              {uploadedFiles.length > 0 ? (
                <ul className="space-y-2">
                  {uploadedFiles.map((path, index) => (
                    <li key={index} className="p-2 bg-gray-100 dark:bg-gray-800 rounded">
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
        
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Usage Instructions</h2>
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
    </>
  );
};

export default UploadUtilityPage;