import { useState, useEffect, useRef, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Edit, 
  Replace, 
  Move, 
  X, 
  Type, 
  Image as ImageIcon, 
  Video, 
  Component,
  PenSquare
} from 'lucide-react';
import { useAdminEditMode } from '@/hooks/use-admin-edit-mode';

interface ElementSelectionOverlayProps {
  children: ReactNode;
  elementType: 'image' | 'text' | 'video' | 'component';
  elementId?: string | number;
  onEdit?: () => void;
  onReplace?: () => void;
  onResize?: () => void;
  onMove?: () => void;
  originalUrl?: string; // For images, the original URL to be replaced
}

export function ElementSelectionOverlay({
  children,
  elementType,
  elementId,
  onEdit,
  onReplace,
  onResize,
  onMove,
  originalUrl,
}: ElementSelectionOverlayProps) {
  const adminState = useAdminEditMode();
  const [isHovered, setIsHovered] = useState(false);
  const [isSelected, setIsSelected] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  // If not in admin mode, just render the children
  if (!adminState.isAdminMode) {
    return <>{children}</>;
  }

  const handleElementClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSelected(!isSelected);
  };

  return (
    <div
      ref={elementRef}
      className={`relative group ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleElementClick}
    >
      {/* The actual content */}
      {children}

      {/* Overlay that appears on hover */}
      {(isHovered || isSelected) && (
        <div 
          className={`absolute inset-0 ${
            isSelected 
              ? 'border-2 border-blue-500 bg-blue-500/10' 
              : 'border border-dashed border-blue-400 bg-blue-300/10 transition-all duration-200'
          } pointer-events-none z-10`}
        />
      )}
      
      {/* Always-visible thin outline in admin mode to show editable elements */}
      {!isHovered && !isSelected && (
        <div className="absolute inset-0 border border-blue-200/30 border-dashed pointer-events-none z-10" />
      )}

      {/* Control buttons that appear when selected */}
      {isSelected && (
        <div className="absolute top-2 right-2 flex space-x-1 z-20">
          {onEdit && (
            <Button 
              variant="default" 
              size="sm" 
              className="bg-blue-500 hover:bg-blue-600 p-1 h-8 w-8"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              title={`Edit ${elementType}`}
            >
              {elementType === 'image' ? <ImageIcon className="h-4 w-4" /> :
               elementType === 'text' ? <PenSquare className="h-4 w-4" /> :
               elementType === 'video' ? <Video className="h-4 w-4" /> :
               <Edit className="h-4 w-4" />}
            </Button>
          )}
          
          {onReplace && (
            <Button 
              variant="default" 
              size="sm" 
              className="bg-purple-500 hover:bg-purple-600 p-1 h-8 w-8"
              onClick={(e) => {
                e.stopPropagation();
                onReplace();
              }}
            >
              <Replace className="h-4 w-4" />
            </Button>
          )}
          
          {onMove && (
            <Button 
              variant="default" 
              size="sm" 
              className="bg-amber-500 hover:bg-amber-600 p-1 h-8 w-8"
              onClick={(e) => {
                e.stopPropagation();
                onMove();
              }}
            >
              <Move className="h-4 w-4" />
            </Button>
          )}
          
          <Button 
            variant="destructive" 
            size="sm" 
            className="p-1 h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              setIsSelected(false);
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Type and ID label when selected */}
      {isSelected && (
        <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded z-20 flex items-center gap-1">
          {elementType === 'image' ? <ImageIcon className="h-3 w-3" /> : 
           elementType === 'text' ? <Type className="h-3 w-3" /> : 
           elementType === 'video' ? <Video className="h-3 w-3" /> : 
           <Component className="h-3 w-3" />}
          <span>
            {elementType === 'image' ? 'Image' : 
             elementType === 'text' ? 'Text' : 
             elementType === 'video' ? 'Video' : 'Component'}
            {elementId && ` #${elementId}`}
          </span>
        </div>
      )}
    </div>
  );
}