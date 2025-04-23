import React, { useState } from 'react';
import { EditableElement, EditableText } from '@/components/admin';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { SafeImage } from '@/components/safe-image';
import { useAdminEditMode } from '@/hooks/use-admin-edit-mode';

/**
 * Demo component to showcase the different editable elements
 */
export function EditableContentDemo() {
  const { isAdminMode, setAdminMode } = useAdminEditMode();
  const [heading, setHeading] = useState('Editable Heading');
  const [paragraph, setParagraph] = useState('This is an editable paragraph. Click the edit button when in admin mode to change this text.');
  const [imageSrc, setImageSrc] = useState('/uploads/demo-image.jpg');

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Editable Content Demo</h2>
        <Button 
          variant={isAdminMode ? "default" : "outline"}
          onClick={() => setAdminMode(!isAdminMode)}
          className={isAdminMode ? "bg-blue-500 hover:bg-blue-600" : ""}
        >
          {isAdminMode ? 'Exit Admin Mode' : 'Enter Admin Mode'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>
              <EditableText 
                id="demo-heading" 
                onUpdate={(data) => setHeading(data.content)}
              >
                {heading}
              </EditableText>
            </CardTitle>
            <CardDescription>
              Editable Text Example
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EditableText 
              id="demo-paragraph" 
              className="text-gray-600"
              onUpdate={(data) => setParagraph(data.content)}
            >
              {paragraph}
            </EditableText>
          </CardContent>
          <CardFooter>
            <p className="text-xs text-gray-400">Click to edit in admin mode</p>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Editable Image Example</CardTitle>
            <CardDescription>
              Images can be replaced with gallery items
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EditableElement
              type="image"
              id="demo-image"
              src={imageSrc}
              alt="Demo image"
              className="w-full h-48 object-cover rounded-md"
              onUpdate={(data) => {
                if (data.newImageId) {
                  // In a real application, we would fetch the new image URL
                  console.log(`Image updated to ID: ${data.newImageId}`);
                  // For demo purposes, we'll just pretend it was updated
                  setImageSrc(`/uploads/demo-image-${Date.now()}.jpg?id=${data.newImageId}`);
                }
              }}
            />
          </CardContent>
          <CardFooter>
            <p className="text-xs text-gray-400">Click to replace in admin mode</p>
          </CardFooter>
        </Card>
      </div>

      <div className="mt-8 p-4 bg-gray-100 rounded-lg">
        <h3 className="font-medium mb-2">Instructions:</h3>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li>Toggle admin mode using the button above</li>
          <li>When in admin mode, elements will show a blue outline on hover</li>
          <li>Click on an element to select it for editing</li>
          <li>Text elements can be edited with the text editor</li>
          <li>Images can be replaced with items from the gallery</li>
        </ul>
      </div>
    </div>
  );
}