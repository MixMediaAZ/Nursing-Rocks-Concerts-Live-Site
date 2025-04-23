import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, X } from 'lucide-react';

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
  title = 'Edit Text',
  description = 'Update the text content',
  multiline = true
}: TextEditorDialogProps) {
  const [content, setContent] = useState(initialContent);
  
  // Reset content when dialog opens with new initial content
  useEffect(() => {
    if (isOpen) {
      setContent(initialContent);
    }
  }, [isOpen, initialContent]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(content);
    onClose(); // Close dialog immediately after saving
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>
              {description}
              {elementId && <span className="ml-1 text-blue-500">#{elementId}</span>}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="grid w-full gap-2">
              <Label htmlFor="content">Content</Label>
              {multiline ? (
                <Textarea
                  id="content"
                  className="min-h-[150px]"
                  placeholder="Enter text content here..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  autoFocus
                />
              ) : (
                <Input
                  id="content"
                  placeholder="Enter text content here..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  autoFocus
                />
              )}
            </div>
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
            >
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
            <Button 
              type="submit"
              className="bg-blue-500 hover:bg-blue-600"
            >
              <Save className="h-4 w-4 mr-1" />
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}