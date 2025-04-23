import { ReactNode, useEffect } from 'react';
import { useAdminEditMode } from '@/hooks/use-admin-edit-mode';
import { useElementSelection } from '@/hooks/use-element-selection';
import { ImageReplacementDialog } from './image-replacement-dialog';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { X, Edit, Wand, Save } from 'lucide-react';

interface AdminEditingProviderProps {
  children: ReactNode;
}

export function AdminEditingProvider({ children }: AdminEditingProviderProps) {
  const adminState = useAdminEditMode();
  const { 
    selectedElement, 
    isImageReplacementDialogOpen,
    openImageReplacementDialog,
    closeImageReplacementDialog,
    clearSelectedElement
  } = useElementSelection();

  // Listen for keyboard shortcuts
  useEffect(() => {
    if (!adminState.isAdminMode) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape key exits admin mode
      if (e.key === 'Escape') {
        adminState.setAdminMode(false);
        toast({
          title: 'Admin Mode Disabled',
          description: 'Exited element editing mode',
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [adminState]);

  const handleImageSelected = (imageId: number) => {
    if (!selectedElement) return;
    
    // The actual replacement logic is handled in the dialog component
    toast({
      title: 'Image replaced',
      description: 'The selected element has been updated',
    });
    
    clearSelectedElement();
    closeImageReplacementDialog();
  };

  return (
    <>
      {children}
      
      {/* Global image replacement dialog for elements selected through the useElementSelection hook */}
      <ImageReplacementDialog
        isOpen={isImageReplacementDialogOpen}
        onClose={closeImageReplacementDialog}
        onSelectImage={handleImageSelected}
        elementId={selectedElement?.id}
        originalUrl={selectedElement?.originalUrl}
      />
      
      {/* Admin mode toolbar - only shown when admin mode is active */}
      {adminState.isAdminMode && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white rounded-full shadow-lg border border-gray-200 p-2 z-50 flex items-center gap-2">
          <div className="bg-blue-500 text-white text-xs px-3 py-1 rounded-full">
            Element Edit Mode
          </div>
          
          <Button
            variant="outline"
            size="sm"
            className="h-9 px-3"
            onClick={() => {
              toast({
                title: 'Changes Saved',
                description: 'Your edits have been saved',
              });
            }}
          >
            <Save className="h-4 w-4 mr-1" />
            Save
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="h-9 px-3"
            onClick={() => {
              adminState.setAdminMode(false);
              clearSelectedElement();
              toast({
                title: 'Admin Mode Disabled',
                description: 'Exited element editing mode',
              });
            }}
          >
            <X className="h-4 w-4 mr-1" />
            Exit
          </Button>
        </div>
      )}
    </>
  );
}