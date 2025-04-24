import { ReactNode, useEffect, useState } from 'react';
import { useAdminEditMode } from '@/hooks/use-admin-edit-mode';
import { useElementSelection, SelectedElement } from '@/hooks/use-element-selection';
import { ImageReplacementDialog } from './image-replacement-dialog';
import { TextEditorDialog } from './text-editor-dialog';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { X, Edit, Wand, Save, Type, HandIcon, Settings, MousePointer, LayoutDashboard, LogOut } from 'lucide-react';

interface AdminEditingProviderProps {
  children: ReactNode;
}

export function AdminEditingProvider({ children }: AdminEditingProviderProps) {
  const adminState = useAdminEditMode();
  const { 
    selectedElement, 
    isImageReplacementDialogOpen,
    isTextEditorDialogOpen,
    textContent,
    openImageReplacementDialog,
    closeImageReplacementDialog,
    openTextEditorDialog,
    closeTextEditorDialog,
    updateTextContent,
    clearSelectedElement,
    universalSelectionEnabled,
    setUniversalSelectionEnabled,
    setSelectedElement
  } = useElementSelection();
  
  // Track the element that's currently being hovered
  const [hoveredElement, setHoveredElement] = useState<HTMLElement | null>(null);

  // Enable universal selection when admin mode is turned on
  useEffect(() => {
    setUniversalSelectionEnabled(adminState.isAdminMode);
    
    // Clean up any selected elements when admin mode is turned off
    if (!adminState.isAdminMode) {
      clearSelectedElement();
    }
  }, [adminState.isAdminMode, setUniversalSelectionEnabled, clearSelectedElement]);

  // Setup event listeners for universal element selection
  useEffect(() => {
    if (!universalSelectionEnabled) {
      return;
    }
    
    // Add hover highlights to all elements
    const handleMouseOver = (e: MouseEvent) => {
      if (!universalSelectionEnabled) return;
      
      // Don't highlight elements in the admin toolbar
      const target = e.target as HTMLElement;
      if (target.closest('[data-admin-toolbar]')) return;
      
      // Store the hovered element to style it
      setHoveredElement(target);
      
      // Add hover indicator styles
      target.classList.add('admin-hover-highlight');
    };
    
    const handleMouseOut = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      target.classList.remove('admin-hover-highlight');
      
      if (hoveredElement === target) {
        setHoveredElement(null);
      }
    };
    
    // Handle element clicks to select them
    const handleElementClick = (e: MouseEvent) => {
      if (!universalSelectionEnabled) return;
      
      // Don't process clicks on the admin toolbar or dialogs
      const target = e.target as HTMLElement;
      if (
        target.closest('[data-admin-toolbar]') || 
        target.closest('[role="dialog"]') ||
        target.getAttribute('data-admin-action')
      ) return;
      
      // Prevent default behavior to avoid navigation on links
      e.preventDefault();
      e.stopPropagation();
      
      // Determine element type based on tag
      let elementType: SelectedElement['type'] = 'generic';
      if (target.tagName === 'IMG') {
        elementType = 'image';
      } else if (
        target.tagName === 'P' || 
        target.tagName === 'H1' || 
        target.tagName === 'H2' || 
        target.tagName === 'H3' || 
        target.tagName === 'H4' || 
        target.tagName === 'H5' || 
        target.tagName === 'H6' || 
        target.tagName === 'SPAN' || 
        target.tagName === 'DIV'
      ) {
        elementType = 'text';
      } else if (target.tagName === 'VIDEO') {
        elementType = 'video';
      }
      
      // Create a unique ID for this element if not already present
      const elementId = target.id || `editable-element-${Date.now()}`;
      if (!target.id) {
        target.id = elementId;
      }
      
      // Select the element
      setSelectedElement({
        id: elementId,
        type: elementType,
        originalUrl: target.tagName === 'IMG' ? (target as HTMLImageElement).src : undefined,
        element: target,
        metadata: {
          tagName: target.tagName,
          className: target.className,
          textContent: target.textContent
        }
      });
      
      // Open appropriate editor based on element type
      if (elementType === 'image') {
        openImageReplacementDialog();
      } else if (elementType === 'text') {
        openTextEditorDialog(target.textContent || '');
      } else {
        // For generic elements, show a toast indicating selection
        toast({
          title: 'Element Selected',
          description: `Selected ${target.tagName.toLowerCase()} element`,
        });
      }
    };
    
    // Add event listeners to the document
    document.addEventListener('mouseover', handleMouseOver, true);
    document.addEventListener('mouseout', handleMouseOut, true);
    document.addEventListener('click', handleElementClick, true);
    
    // Add CSS for hover highlight
    const style = document.createElement('style');
    style.textContent = `
      .admin-hover-highlight {
        outline: 2px dashed #5D3FD3 !important;
        outline-offset: 2px !important;
        cursor: pointer !important;
        position: relative !important;
      }
      .admin-selected-element {
        outline: 3px solid #5D3FD3 !important;
        outline-offset: 2px !important;
        position: relative !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      // Clean up event listeners and styles
      document.removeEventListener('mouseover', handleMouseOver, true);
      document.removeEventListener('mouseout', handleMouseOut, true);
      document.removeEventListener('click', handleElementClick, true);
      document.head.removeChild(style);
      
      // Remove any remaining highlight classes
      document.querySelectorAll('.admin-hover-highlight').forEach(el => {
        el.classList.remove('admin-hover-highlight');
      });
      document.querySelectorAll('.admin-selected-element').forEach(el => {
        el.classList.remove('admin-selected-element');
      });
    };
  }, [universalSelectionEnabled, hoveredElement, openImageReplacementDialog, openTextEditorDialog, setSelectedElement]);

  // Add selected element highlight
  useEffect(() => {
    // Remove any existing selection highlights
    document.querySelectorAll('.admin-selected-element').forEach(el => {
      el.classList.remove('admin-selected-element');
    });
    
    // Add highlight to the selected element
    if (selectedElement?.element) {
      selectedElement.element.classList.add('admin-selected-element');
    }
    
    return () => {
      if (selectedElement?.element) {
        selectedElement.element.classList.remove('admin-selected-element');
      }
    };
  }, [selectedElement]);

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
      
      {/* Global text editor dialog for text elements */}
      <TextEditorDialog
        isOpen={isTextEditorDialogOpen}
        onClose={closeTextEditorDialog}
        onSave={(newContent) => {
          updateTextContent(newContent);
          closeTextEditorDialog();
          
          if (selectedElement) {
            toast({
              title: 'Text Updated',
              description: 'The selected text has been updated',
            });
          }
          
          clearSelectedElement();
        }}
        elementId={selectedElement?.id}
        initialContent={textContent}
        title="Edit Text Content"
        description="Update the text for this element"
        multiline={true}
      />
      
      {/* Admin mode toolbar - only shown when admin mode is active */}
      {adminState.isAdminMode && (
        <div 
          data-admin-toolbar="true"
          className="fixed bottom-4 left-0 right-0 mx-auto w-max max-w-[95%] overflow-auto bg-white rounded-lg shadow-lg border border-gray-200 px-3 py-2 z-50"
        >
          <div className="flex flex-wrap items-center justify-center gap-2">
            <div className="bg-primary text-white text-xs px-3 py-1 rounded-full flex-shrink-0">
              Element Edit Mode
            </div>
            
            {selectedElement ? (
              <div className="bg-slate-100 text-xs px-3 py-1 rounded-full flex items-center flex-shrink-0">
                <span className="font-medium mr-1">Selected:</span> 
                <span className="bg-white px-2 py-0.5 rounded border text-primary font-mono">
                  {selectedElement.type === 'image' ? 'Image' : 
                   selectedElement.type === 'text' ? 'Text' : 
                   selectedElement.type === 'video' ? 'Video' : 
                   selectedElement.metadata?.tagName || 'Element'}
                </span>
              </div>
            ) : (
              <div className="bg-slate-100 text-xs px-3 py-1 rounded-full flex items-center text-muted-foreground flex-shrink-0">
                <MousePointer className="h-3 w-3 mr-1" /> Click any element to edit
              </div>
            )}
            
            <div className="flex flex-wrap items-center gap-2 mt-2 sm:mt-0">
              {selectedElement && (
                <Button
                  data-admin-action="clear"
                  variant="outline"
                  size="sm"
                  className="h-9 w-[90px]"
                  onClick={() => {
                    clearSelectedElement();
                    toast({
                      title: 'Selection Cleared',
                      description: 'Element selection has been cleared',
                    });
                  }}
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              )}
              
              <Button
                data-admin-action="save"
                variant="outline"
                size="sm"
                className="h-9 w-[90px]"
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
                data-admin-action="dashboard"
                variant="outline"
                size="sm"
                className="h-9 w-[120px]"
                onClick={() => {
                  // Navigate to admin dashboard
                  window.location.href = '/admin';
                  toast({
                    title: 'Returning to Dashboard',
                    description: 'Navigating to admin dashboard...',
                  });
                }}
              >
                <LayoutDashboard className="h-4 w-4 mr-1" />
                Dashboard
              </Button>
              
              <Button
                data-admin-action="logout"
                variant="outline"
                size="sm"
                className="h-9 w-[90px] bg-red-50 text-red-600 hover:bg-red-100 border-red-200"
                onClick={() => {
                  // Perform logout action
                  fetch('/api/admin/logout', { method: 'POST' })
                    .then(() => {
                      // Clear admin mode
                      adminState.setAdminMode(false);
                      clearSelectedElement();
                      // Clear admin token
                      localStorage.removeItem('adminToken');
                      // Navigate home
                      window.location.href = '/';
                      toast({
                        title: 'Logged Out',
                        description: 'You have been logged out of admin mode',
                        variant: 'destructive',
                      });
                    })
                    .catch(err => {
                      console.error('Logout error:', err);
                      toast({
                        title: 'Logout Failed',
                        description: 'There was an error logging out. Please try again.',
                        variant: 'destructive',
                      });
                    });
                }}
              >
                <LogOut className="h-4 w-4 mr-1" />
                Logout
              </Button>
              
              <Button
                data-admin-action="exit"
                variant="destructive"
                size="sm"
                className="h-9 w-[90px]"
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
          </div>
        </div>
      )}
    </>
  );
}