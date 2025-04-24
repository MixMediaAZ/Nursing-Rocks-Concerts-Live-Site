import { ReactNode, useEffect, useState } from 'react';
import { useAdminEditMode } from '@/hooks/use-admin-edit-mode';
import { useElementSelection, SelectedElement } from '@/hooks/use-element-selection';
import { ImageReplacementDialog } from './image-replacement-dialog';
import { TextEditorDialog, TextSaveOptions } from './text-editor-dialog';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { X, Edit, Wand, Save, Type, HandIcon, Settings, MousePointer, LayoutDashboard, LogOut, Plus } from 'lucide-react';

// Helper function to apply styles to HTML elements
function applyStylesToElement(element: HTMLElement | undefined, styles: TextSaveOptions['styles']) {
  if (!element || !styles) return;
  
  if (styles.color) element.style.color = styles.color;
  if (styles.fontSize) element.style.fontSize = styles.fontSize;
  if (styles.fontWeight) element.style.fontWeight = styles.fontWeight;
  if (styles.fontStyle) element.style.fontStyle = styles.fontStyle;
  if (styles.textDecoration) element.style.textDecoration = styles.textDecoration;
  if (styles.textAlign) element.style.textAlign = styles.textAlign;
  if (styles.margin) element.style.margin = styles.margin;
  if (styles.padding) element.style.padding = styles.padding;
}

interface AdminEditingProviderProps {
  children: ReactNode;
}

export function AdminEditingProvider({ children }: AdminEditingProviderProps) {
  const adminState = useAdminEditMode();
  const { 
    selectedElement, 
    isImageReplacementDialogOpen,
    isTextEditorDialogOpen,
    isCreatingNewText,
    textContent,
    openImageReplacementDialog,
    closeImageReplacementDialog,
    openTextEditorDialog,
    openNewTextDialog,
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
      let target = e.target as HTMLElement;
      if (
        target.closest('[data-admin-toolbar]') || 
        target.closest('[role="dialog"]') ||
        target.getAttribute('data-admin-action')
      ) return;
      
      // Prevent default behavior to avoid navigation on links
      e.preventDefault();
      e.stopPropagation();
      
      // Special handling for SPAN elements inside buttons or links
      // If the clicked element is a SPAN inside a BUTTON or A, select the parent instead
      if (target.tagName === 'SPAN') {
        const parentButton = target.closest('BUTTON');
        const parentLink = target.closest('A');
        
        if (parentButton) {
          console.log('Selecting parent button instead of span');
          target = parentButton as HTMLElement;
        } else if (parentLink) {
          console.log('Selecting parent link instead of span');
          target = parentLink as HTMLElement;
        }
      }
      
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
        target.tagName === 'DIV' ||
        target.tagName === 'BUTTON' ||
        target.tagName === 'A'
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
        // For buttons, we need to handle innerText differently to properly capture the text
        let content = '';
        
        if (target.tagName === 'BUTTON' || target.tagName === 'A') {
          // For buttons and links, directly use innerText to get the visible text
          content = target.innerText;
          console.log(`Extracted button/link text: "${content}" from ${target.tagName}`);
        } else {
          // For other elements, use innerHTML to preserve formatting for editing
          // First convert <br> tags to newlines for textarea input
          content = target.innerHTML
            .replace(/<br\s*\/?>/gi, '\n') // Replace <br> tags with newlines
            .replace(/&lt;/g, '<')         // Replace &lt; with <
            .replace(/&gt;/g, '>')         // Replace &gt; with >
            .replace(/&nbsp;/g, ' ')       // Replace &nbsp; with spaces
            .replace(/&amp;/g, '&');       // Replace &amp; with &
        }
          
        openTextEditorDialog(content);
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
    const styleId = 'admin-highlight-style';
    let styleElement = document.getElementById(styleId) as HTMLStyleElement;
    
    // Only create the style if it doesn't already exist
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleId;
      styleElement.textContent = `
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
      document.head.appendChild(styleElement);
    }
    
    return () => {
      // Clean up event listeners and styles
      document.removeEventListener('mouseover', handleMouseOver, true);
      document.removeEventListener('mouseout', handleMouseOut, true);
      document.removeEventListener('click', handleElementClick, true);
      
      // Safely remove the style element if it exists and is a child of document.head
      try {
        const styleToRemove = document.getElementById(styleId);
        if (styleToRemove && document.head.contains(styleToRemove)) {
          document.head.removeChild(styleToRemove);
        }
      } catch (error) {
        // Ignore errors from style element removal
        console.warn('Failed to remove style element, it may have already been removed');
      }
      
      // Remove any remaining highlight classes - use try/catch to prevent errors
      try {
        document.querySelectorAll('.admin-hover-highlight').forEach(el => {
          el.classList.remove('admin-hover-highlight');
        });
        document.querySelectorAll('.admin-selected-element').forEach(el => {
          el.classList.remove('admin-selected-element');
        });
      } catch (error) {
        console.warn('Failed to remove highlight classes from elements');
      }
    };
  }, [universalSelectionEnabled, hoveredElement, openImageReplacementDialog, openTextEditorDialog, setSelectedElement]);

  // Add selected element highlight
  useEffect(() => {
    try {
      // Remove any existing selection highlights
      document.querySelectorAll('.admin-selected-element').forEach(el => {
        el.classList.remove('admin-selected-element');
      });
      
      // Add highlight to the selected element
      if (selectedElement?.element) {
        selectedElement.element.classList.add('admin-selected-element');
      }
    } catch (error) {
      console.warn('Error managing element highlights:', error);
    }
    
    return () => {
      try {
        if (selectedElement?.element) {
          selectedElement.element.classList.remove('admin-selected-element');
        }
      } catch (error) {
        console.warn('Error cleaning up element highlights:', error);
      }
    };
  }, [selectedElement]);

  // Listen for keyboard shortcuts
  useEffect(() => {
    if (!adminState.isAdminMode) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      try {
        // Escape key exits admin mode
        if (e.key === 'Escape') {
          adminState.setAdminMode(false);
          toast({
            title: 'Admin Mode Disabled',
            description: 'Exited element editing mode',
          });
        }
      } catch (error) {
        console.warn('Error handling keyboard shortcut:', error);
      }
    };

    try {
      window.addEventListener('keydown', handleKeyDown);
    } catch (error) {
      console.warn('Error setting up keyboard listener:', error);
    }
    
    return () => {
      try {
        window.removeEventListener('keydown', handleKeyDown);
      } catch (error) {
        console.warn('Error removing keyboard listener:', error);
      }
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
        onSave={(newContent, options) => {
          updateTextContent(newContent);
          closeTextEditorDialog();
          
          if (isCreatingNewText) {
            // Create new text element logic
            const targetElement = selectedElement?.element;
            if (targetElement && options) {
              // Create the new element
              const newElement = document.createElement(options.elementType || 'p');
              
              // Sanitize and format content for HTML insertion
              const sanitizedContent = newContent
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/&lt;br&gt;/g, '<br>') // Allow <br> tags
                .replace(/\n/g, '<br>');       // Convert newlines to <br>
                
              newElement.innerHTML = sanitizedContent;
              newElement.id = `editable-element-${Date.now()}`;
              
              // Apply styling if provided
              if (options.styles) {
                applyStylesToElement(newElement, options.styles);
              }
              
              // Insert the element according to the specified location
              if (options.insertLocation === 'before') {
                targetElement.parentNode?.insertBefore(newElement, targetElement);
              } else if (options.insertLocation === 'after') {
                targetElement.parentNode?.insertBefore(newElement, targetElement.nextSibling);
              } else if (options.insertLocation === 'append') {
                targetElement.appendChild(newElement);
              } else if (options.insertLocation === 'prepend') {
                targetElement.insertBefore(newElement, targetElement.firstChild);
              }
              
              toast({
                title: 'Text Element Created',
                description: `Added new ${options.elementType || 'paragraph'} element`,
              });
            }
          } else if (selectedElement) {
            // Update existing text
            if (selectedElement.element) {
              try {
                // Handle buttons and links differently than other elements
                if (selectedElement.element.tagName === 'BUTTON' || selectedElement.element.tagName === 'A') {
                  // For buttons and links, we need to carefully update the text without disrupting other elements
                  console.log(`Updating ${selectedElement.element.tagName} text to: "${newContent}"`);

                  // Check if the button contains a SPAN that holds the text - common pattern
                  const spanElements = selectedElement.element.querySelectorAll('span');
                  if (spanElements.length === 1) {
                    // Found exactly one span, probably the text container
                    console.log('Found a span inside the button, updating it directly');
                    // Use requestAnimationFrame to reduce flicker
                    requestAnimationFrame(() => {
                      spanElements[0].textContent = newContent;
                    });
                    return; // Exit early, we've handled the update
                  }

                  // If we don't have a span element, continue with standard approach
                  // Store a reference to all non-text nodes (icons, etc.)
                  const nonTextNodes = [];
                  const fragment = document.createDocumentFragment();
                  
                  // First, clone all non-text nodes to preserve them
                  for (let i = 0; i < selectedElement.element.childNodes.length; i++) {
                    const node = selectedElement.element.childNodes[i];
                    if (node.nodeType !== Node.TEXT_NODE) {
                      nonTextNodes.push(node.cloneNode(true));
                    }
                  }
                  
                  // Use requestAnimationFrame for both approaches to reduce flicker
                  requestAnimationFrame(() => {
                    // Two approaches based on complexity
                    if (nonTextNodes.length === 0) {
                      // Simple case: button only contains text
                      selectedElement.element.textContent = newContent;
                    } else {
                      // Complex case: button has icons or other elements
                      
                      // 1. Remove all current content while saving the references
                      while (selectedElement.element.firstChild) {
                        selectedElement.element.removeChild(selectedElement.element.firstChild);
                      }
                      
                      // 2. Analyze the original element structure to determine where text was
                      // For simplicity, we'll insert text at the beginning if there was no text node before
                      fragment.appendChild(document.createTextNode(newContent));
                      
                      // 3. Add back all the non-text nodes in their original positions
                      // This is a simplified approach - we're appending all non-text nodes after the text
                      nonTextNodes.forEach(node => {
                        fragment.appendChild(node);
                      });
                      
                      // 4. Apply all changes at once to minimize reflows/repaints
                      selectedElement.element.appendChild(fragment);
                    }
                  });
                } else {
                  // For other elements, use innerHTML with sanitization
                  // But apply it in a way that minimizes flicker
                  const sanitizedContent = newContent
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/&lt;br&gt;/g, '<br>') // Allow <br> tags
                    .replace(/\n/g, '<br>'); // Convert newlines to <br>
                  
                  // Create a temporary container with the new content
                  const tempContainer = document.createElement('div');
                  tempContainer.innerHTML = sanitizedContent;
                  
                  // Batch updates using requestAnimationFrame to reduce flicker
                  requestAnimationFrame(() => {
                    // Apply the content in a single operation
                    selectedElement.element.innerHTML = sanitizedContent;
                    
                    // Force a repaint to ensure content is displayed correctly
                    if (selectedElement && selectedElement.element) {
                      void selectedElement.element.offsetHeight;
                    }
                  });
                }
                
                // Apply styling if provided - for all element types
                // But defer it to the next animation frame to prevent flicker
                if (options?.styles && selectedElement?.element) {
                  // Use a slight delay to ensure content is stable before styling
                  requestAnimationFrame(() => {
                    if (selectedElement?.element) {
                      applyStylesToElement(selectedElement.element, options.styles);
                    }
                  });
                }
              } catch (error) {
                console.error("Error updating element text:", error);
                toast({
                  title: 'Error Updating Text',
                  description: 'There was a problem updating the text. Please try again.',
                  variant: 'destructive',
                });
              }
            }
            
            toast({
              title: 'Text Updated',
              description: 'The selected text has been updated',
            });
          }
          
          clearSelectedElement();
        }}
        elementId={selectedElement?.id}
        initialContent={textContent}
        title={isCreatingNewText ? "Add New Text" : "Edit Text Content"}
        description={isCreatingNewText ? "Create a new text element" : "Update the text for this element"}
        multiline={true}
        isCreatingNew={isCreatingNewText}
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
              <Button
                data-admin-action="add-text"
                variant="outline"
                size="sm"
                className="h-9"
                onClick={() => {
                  if (selectedElement) {
                    // If an element is selected, use it as the target for inserting the new text
                    openNewTextDialog();
                  } else {
                    toast({
                      title: 'Select an Element First',
                      description: 'Please select an element to add text relative to it',
                      variant: 'destructive',
                    });
                  }
                }}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Text
              </Button>
              
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
                    .then((response) => {
                      if (!response.ok) {
                        throw new Error('Logout request failed');
                      }
                      // Clear admin mode
                      adminState.setAdminMode(false);
                      clearSelectedElement();
                      // Clear all admin-related local storage items
                      localStorage.removeItem('adminToken');
                      localStorage.removeItem('isAdmin');
                      localStorage.removeItem('adminPinVerified');
                      localStorage.removeItem('editMode');
                      
                      toast({
                        title: 'Logged Out',
                        description: 'You have been logged out of admin mode',
                      });
                      
                      // Reload the page to ensure all admin components are reset
                      window.location.reload();
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