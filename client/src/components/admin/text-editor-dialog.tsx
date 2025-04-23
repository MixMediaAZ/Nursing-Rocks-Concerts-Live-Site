import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface TextEditorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newContent: string) => void;
  elementId?: string | number;
  initialContent?: string;
  title?: string;
  description?: string;
  multiline?: boolean;
}

export function TextEditorDialog({
  isOpen,
  onClose,
  onSave,
  elementId,
  initialContent = '',
  title = 'Edit Text Content',
  description = 'Update the text content for this element.',
  multiline = true
}: TextEditorDialogProps) {
  const [content, setContent] = useState(initialContent);
  const [isSaving, setIsSaving] = useState(false);

  // Reset content when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setContent(initialContent);
    }
  }, [isOpen, initialContent]);

  const handleSave = async () => {
    if (!content.trim()) {
      toast({
        title: 'Content Required',
        description: 'Please enter content before saving',
        variant: 'destructive'
      });
      return;
    }

    setIsSaving(true);
    try {
      // If there's a server-side API for updating text, you can implement it here
      // For now, we'll just update it client-side
      
      // This is where an API call would go if you want to persist to the server
      // const payload = { elementId, content };
      // await apiRequest('POST', '/api/update-text-content', payload);
      
      toast({
        title: 'Content Updated',
        description: 'The text has been successfully updated'
      });
      
      onSave(content);
      
      // Dispatch a custom event similar to image-replaced
      const updateEvent = new CustomEvent('text-updated', { 
        detail: { 
          elementId,
          content,
          timestamp: Date.now()
        } 
      });
      
      // Close dialog and dispatch event
      setTimeout(() => {
        window.dispatchEvent(updateEvent);
        onClose();
      }, 100);
      
    } catch (error) {
      console.error('Error updating text:', error);
      toast({
        title: 'Error Updating Text',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="text-content">Content</Label>
              {multiline ? (
                <Textarea
                  id="text-content"
                  placeholder="Enter text content here..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={8}
                  className="resize-y min-h-[200px]"
                />
              ) : (
                <Input
                  id="text-content"
                  placeholder="Enter text content here..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
              )}
            </div>
          </div>
        </div>
        
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button 
            onClick={handleSave} 
            disabled={isSaving}
          >
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}