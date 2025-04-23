import React, { useState, useEffect } from 'react';
import { ElementSelectionOverlay } from './element-selection-overlay';
import { ImageReplacementDialog } from './image-replacement-dialog';
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
  const { isAdminMode } = useAdminEditMode();
  const uniqueId = id || `${type}-${Math.random().toString(36).substring(2, 9)}`;
  
  // Set up event listener for image replacement
  useEffect(() => {
    const handleImageReplaced = (event: Event) => {
      if ((event as CustomEvent).detail) {
        const { elementId, originalUrl } = (event as CustomEvent).detail;
        
        // Only refresh if this is the element being replaced
        const isTargetElement = 
          (id && elementId && id.toString() === elementId.toString()) || 
          (src && originalUrl && src === originalUrl);
          
        if (isTargetElement) {
          // Invalidate any relevant cache to force refetch
          queryClient.invalidateQueries();
          
          // Force a refresh on this component
          if (onUpdate) {
            onUpdate({ refreshTimestamp: Date.now() });
          }
        }
      }
    };
    
    window.addEventListener('image-replaced', handleImageReplaced);
    return () => {
      window.removeEventListener('image-replaced', handleImageReplaced);
    };
  }, [id, src, onUpdate]);

  const handleEdit = () => {
    // Edit functionality depends on the element type
    console.log(`Editing ${type} element #${uniqueId}`);
  };

  const handleReplace = () => {
    setIsReplacementDialogOpen(true);
  };

  const handleImageSelected = (imageId: number) => {
    console.log(`Selected image #${imageId} to replace image #${uniqueId}`);
    // The actual replacement is handled by the dialog component
    setIsReplacementDialogOpen(false);
  };

  // Render based on element type
  const renderContent = () => {
    switch (type) {
      case 'image':
        return (
          <SafeImage
            src={src || ''}
            alt={alt}
            className={className}
            style={style}
            width={width}
            height={height}
            loadingClassName={loadingClassName}
            errorClassName={errorClassName}
            placeholder={placeholder}
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
        {renderContent()}
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
    </>
  );
}