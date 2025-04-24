import React, { useState, useEffect } from 'react';
import { ElementSelectionOverlay } from './element-selection-overlay';
import { ImageReplacementDialog } from './image-replacement-dialog';
import { TextEditorDialog } from './text-editor-dialog';
import { useAdminEditMode } from '@/hooks/use-admin-edit-mode';
import { useElementSelection } from '@/hooks/use-element-selection';
import { SafeImage } from '../safe-image';
import { queryClient } from '@/lib/queryClient';

interface EditableElementProps {
  type: 'image' | 'text' | 'video' | 'component';
  id?: string | number;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  src?: string;
  alt?: string;
  width?: number;
  height?: number;
  onUpdate?: (newData: any) => void;
  loadingClassName?: string;
  errorClassName?: string;
  placeholder?: React.ReactNode;
}

export function EditableElement({
  type = 'component',
  id,
  children,
  className = '',
  style,
  src,
  alt = '',
  width,
  height,
  onUpdate,
  loadingClassName = 'animate-pulse bg-gray-200',
  errorClassName = 'bg-red-100 border border-red-300',
  placeholder,
}: EditableElementProps) {
  const [isReplacementDialogOpen, setIsReplacementDialogOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(Date.now());
  const adminState = useAdminEditMode();
  const uniqueId = id || `${type}-${Math.random().toString(36).substring(2, 9)}`;
  
  // Set up event listener for image replacement
  useEffect(() => {
    const handleImageReplaced = (event: Event) => {
      if ((event as CustomEvent).detail) {
        const { elementId, originalUrl, newImageId, newImageUrl } = (event as CustomEvent).detail;
        
        // Log the event details for debugging
        console.log(`Image replacement event received:`, (event as CustomEvent).detail);
        console.log(`This element: ID=${id}, src=${src}`);
        
        // Only refresh if this is the element being replaced
        // Check if either the element ID matches or the original URL is part of the src
        const isTargetElement = 
          (id && elementId && id.toString() === elementId.toString()) || 
          (src && originalUrl && src.includes(originalUrl));
          
        if (isTargetElement) {
          console.log(`Element matched for replacement: ID=${id}, originalUrl=${src}, newImageId=${newImageId}, newImageUrl=${newImageUrl}`);
          
          // Invalidate any relevant cache to force refetch
          queryClient.invalidateQueries();
          
          // Force update this component immediately - the image needs to be refreshed
          setRefreshKey(Date.now());
          
          // If we have a new image URL and a callback, trigger it
          if (newImageUrl && onUpdate) {
            console.log(`Updating element with new image URL: ${newImageUrl}`);
            onUpdate({ 
              refreshTimestamp: Date.now(),
              newImageId,
              originalUrl,
              newImageUrl,
              content: newImageUrl // Add content property for consistency with text updates
            });
          } else {
            console.log(`No update callback found or missing new image URL`);
          }
        }
      }
    };
    
    window.addEventListener('image-replaced', handleImageReplaced);
    return () => {
      window.removeEventListener('image-replaced', handleImageReplaced);
    };
  }, [id, src, onUpdate]);

  // Update text content if children changes
  useEffect(() => {
    if (type === 'text' && typeof children === 'string') {
      setTextContent(children);
    }
  }, [children, type]);

  const [isTextEditorOpen, setTextEditorOpen] = useState(false);
  const [textContent, setTextContent] = useState<string | undefined>(
    type === 'text' && typeof children === 'string' ? children : undefined
  );

  const handleEdit = () => {
    // Different edit actions based on element type
    if (type === 'text') {
      setTextEditorOpen(true);
    } else if (type === 'image') {
      handleReplace();
    } else {
      console.log(`Editing ${type} element #${uniqueId}`);
    }
  };
  
  // Handle text updates
  const handleTextSaved = (newText: string) => {
    setTextContent(newText);
    if (onUpdate) {
      onUpdate({ 
        content: newText,
        elementId: uniqueId,
        refreshTimestamp: Date.now()
      });
    }
  };

  const handleReplace = () => {
    setIsReplacementDialogOpen(true);
  };

  const handleImageSelected = (imageId: number) => {
    console.log(`Selected image #${imageId} to replace image #${uniqueId}`);
    // The actual replacement is handled by the dialog component
    setIsReplacementDialogOpen(false);
  };

  // Keep track of the latest image URL to be used for refreshing
  const [currentImageSrc, setCurrentImageSrc] = useState<string | undefined>(src);
  
  // Update currentImageSrc when src prop changes
  useEffect(() => {
    if (src) {
      setCurrentImageSrc(src);
    }
  }, [src]);
  
  // Update image URL from replacement event
  useEffect(() => {
    const handleImageReplaced = (event: Event) => {
      if ((event as CustomEvent).detail) {
        const { elementId, originalUrl, newImageUrl } = (event as CustomEvent).detail;
        
        // Update the image source if this is our element
        if (elementId && id && elementId.toString() === id.toString() && newImageUrl) {
          console.log(`EditableElement setting new image URL: ${newImageUrl}`);
          setCurrentImageSrc(newImageUrl);
        }
      }
    };
    
    window.addEventListener('image-replaced', handleImageReplaced);
    return () => {
      window.removeEventListener('image-replaced', handleImageReplaced);
    };
  }, [id]);
  
  // Render based on element type
  const renderContent = () => {
    switch (type) {
      case 'image':
        return (
          <SafeImage
            src={currentImageSrc || src || ''}
            alt={alt}
            className={className}
            showLoadingIndicator={true}
            fallbackClassName={errorClassName}
            key={`img-${refreshKey}`} // Add key using the refreshKey for forcing re-render
          />
        );
      
      case 'text':
      case 'video':
      case 'component':
      default:
        return children;
    }
  };

  return (
    <>
      <ElementSelectionOverlay
        elementType={type}
        elementId={uniqueId}
        onEdit={handleEdit}
        onReplace={type === 'image' ? handleReplace : undefined}
        originalUrl={type === 'image' ? src : undefined}
      >
        {type === 'text' && textContent !== undefined ? textContent : renderContent()}
      </ElementSelectionOverlay>
      
      {/* Image replacement dialog */}
      {type === 'image' && (
        <ImageReplacementDialog
          isOpen={isReplacementDialogOpen}
          onClose={() => setIsReplacementDialogOpen(false)}
          onSelectImage={handleImageSelected}
          elementId={uniqueId}
          originalUrl={src}
        />
      )}
      
      {/* Text editor dialog */}
      {type === 'text' && (
        <TextEditorDialog
          isOpen={isTextEditorOpen}
          onClose={() => setTextEditorOpen(false)}
          onSave={handleTextSaved}
          elementId={uniqueId}
          initialContent={typeof children === 'string' ? children : ''}
          title="Edit Text Content"
          description="Update the text for this element"
          multiline={true}
        />
      )}
    </>
  );
}