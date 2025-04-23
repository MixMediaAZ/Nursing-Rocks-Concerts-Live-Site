import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, X, ScreenShare, Text } from 'lucide-react';

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
  const [isMobile, setIsMobile] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Reset content when dialog opens with new initial content
  useEffect(() => {
    if (isOpen) {
      setContent(initialContent);
      
      // Check if we're on a mobile device
      setIsMobile(window.innerWidth < 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
      
      // Focus the input after a slight delay (for mobile keyboards)
      const timer = setTimeout(() => {
        if (multiline && textareaRef.current) {
          textareaRef.current.focus();
        } else if (!multiline && inputRef.current) {
          inputRef.current.focus();
        }
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen, initialContent, multiline]);

  // Handle keyboard events
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Close on Escape
    if (e.key === 'Escape') {
      onClose();
    }
    
    // Save on Ctrl+Enter or Cmd+Enter (for multiline)
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      onSave(content);
      onClose();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(content);
    onClose(); // Close dialog immediately after saving
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={`${isMobile ? 'max-w-[95vw] p-4 sm:p-6' : 'max-w-2xl'} touch-manipulation rounded-lg`}>
        <form onSubmit={handleSubmit}>
          <DialogHeader className={isMobile ? 'mb-2 space-y-1' : ''}>
            <DialogTitle className={isMobile ? 'text-lg' : ''}>
              {title}
              {elementId && <span className="ml-2 text-sm text-blue-500">#{elementId}</span>}
            </DialogTitle>
            <DialogDescription className={isMobile ? 'text-sm' : ''}>
              {description}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="grid w-full gap-2">
              <Label htmlFor="content">Content</Label>
              {multiline ? (
                <Textarea
                  ref={textareaRef}
                  id="content"
                  className="min-h-[150px] touch-manipulation"
                  placeholder="Enter text content here..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  onKeyDown={handleKeyDown}
                  autoCapitalize="sentences"
                  spellCheck={true}
                  autoFocus={!isMobile}
                />
              ) : (
                <Input
                  ref={inputRef}
                  id="content"
                  className="touch-manipulation"
                  placeholder="Enter text content here..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  onKeyDown={handleKeyDown}
                  autoCapitalize="sentences"
                  spellCheck={true}
                  autoFocus={!isMobile}
                />
              )}
              
              {isMobile && (
                <div className="mt-2 flex items-center text-xs text-muted-foreground">
                  <Text className="h-3 w-3 mr-1" />
                  <span>Use the keyboard or tap buttons below to edit text</span>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className={isMobile ? 'flex-col sm:flex-row gap-2 sm:gap-0' : ''}>
            {isMobile && (
              <div className="w-full flex justify-between items-center mb-2 pb-2 border-b text-xs text-muted-foreground">
                <div className="flex items-center">
                  <ScreenShare className="h-3 w-3 mr-1" />
                  <span>Keyboard shortcuts: Esc = Cancel, Ctrl+Enter = Save</span>
                </div>
              </div>
            )}
            
            <Button 
              type="button" 
              variant="outline" 
              className={`touch-manipulation ${isMobile ? 'py-6 text-base w-full' : ''}`}
              onClick={onClose}
            >
              <X className={`${isMobile ? 'h-5 w-5' : 'h-4 w-4'} mr-1`} />
              Cancel
            </Button>
            <Button 
              type="submit"
              className={`bg-blue-500 hover:bg-blue-600 touch-manipulation ${isMobile ? 'py-6 text-base w-full' : ''}`}
            >
              <Save className={`${isMobile ? 'h-5 w-5' : 'h-4 w-4'} mr-1`} />
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}