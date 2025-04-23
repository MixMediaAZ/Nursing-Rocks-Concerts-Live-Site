import { useState, useEffect, useRef, ReactNode, useCallback } from 'react';
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
  PenSquare,
  Fingerprint,
  MousePointer,
  ZoomIn
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
  const [showTip, setShowTip] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [pressHoldActive, setPressHoldActive] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);
  const longPressTimerRef = useRef<number | null>(null);

  // Handle click outside to deselect element
  const handleClickOutside = useCallback((e: MouseEvent | TouchEvent) => {
    if (!elementRef.current || !isSelected) return;
    
    // Check if the click/touch was on the element or its controls
    const target = e.target as Node;
    if (!elementRef.current.contains(target) && 
        !document.querySelector('.selection-controls')?.contains(target)) {
      setIsSelected(false);
    }
  }, [isSelected]);

  // Detect mobile device
  useEffect(() => {
    const detectMobile = () => {
      const isMobileDevice = window.innerWidth < 768 || 
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(isMobileDevice);
      
      // Show tip on first hover for mobile users
      if (isMobileDevice && !isSelected && !showTip && isHovered) {
        setShowTip(true);
        // Auto-hide tip after 4 seconds
        const tipTimer = setTimeout(() => setShowTip(false), 4000);
        return () => clearTimeout(tipTimer);
      }
    };
    
    detectMobile();
    window.addEventListener('resize', detectMobile);
    return () => window.removeEventListener('resize', detectMobile);
  }, [isHovered, isSelected, showTip]);
  
  // Add and remove click outside listener
  useEffect(() => {
    if (isSelected) {
      // Add both mouse and touch event listeners for cross-platform support
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      
      // Clear any pending long press timers
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
    };
  }, [isSelected, handleClickOutside]);

  // If not in admin mode, just render the children
  if (!adminState.isAdminMode) {
    return <>{children}</>;
  }

  const handleElementClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    setIsSelected(!isSelected);
    // Hide the helper tip if it's showing
    if (showTip) setShowTip(false);
  };
  
  // Improved touch handling for mobile devices
  const handleTouchStart = (e: React.TouchEvent) => {
    // Prevent default only for mobile devices to avoid unwanted scrolling
    if (isMobile) e.preventDefault();
    
    // Only show hover effect on touch, don't trigger selection yet
    if (!isHovered) {
      setIsHovered(true);
      setPressHoldActive(true);
      
      // Touch press and hold functionality (for mobile use 700ms, desktop 500ms)
      longPressTimerRef.current = window.setTimeout(() => {
        handleElementClick(e);
        setPressHoldActive(false);
      }, isMobile ? 700 : 500) as unknown as number;
      
      // For mobile, show the helper tip
      if (isMobile && !isSelected && !showTip) {
        setShowTip(true);
        // Auto-hide tip after 4 seconds
        setTimeout(() => setShowTip(false), 4000);
      }
    }
  };
  
  const handleTouchEnd = (e: React.TouchEvent) => {
    // Cancel the press and hold timer
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    
    setPressHoldActive(false);
    
    // On mobile, require long press to select
    // On desktop, allow tap to select
    if (!isMobile && !isSelected) {
      handleElementClick(e);
    }
  };

  return (
    <div
      ref={elementRef}
      className={`relative group ${isSelected ? 'ring-2 ring-blue-500' : ''} touch-manipulation`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={!isMobile ? handleElementClick : undefined}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={() => {
        if (longPressTimerRef.current) {
          clearTimeout(longPressTimerRef.current);
          longPressTimerRef.current = null;
        }
        setPressHoldActive(false);
      }}
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
        <div 
          ref={controlsRef}
          className={`selection-controls absolute top-2 right-2 flex ${isMobile ? 'space-x-2' : 'space-x-1'} z-20`}
          onClick={(e) => e.stopPropagation()} 
          onTouchStart={(e) => e.stopPropagation()}
        >
          {onEdit && (
            <Button 
              variant="default" 
              size={isMobile ? "default" : "sm"} 
              className={`bg-blue-500 hover:bg-blue-600 ${isMobile ? 'p-2 h-10 w-10' : 'p-1 h-8 w-8'} touch-manipulation active:scale-95`}
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              onTouchStart={(e) => {
                e.stopPropagation();
              }}
              title={`Edit ${elementType}`}
            >
              {elementType === 'image' ? <ImageIcon className={isMobile ? "h-5 w-5" : "h-4 w-4"} /> :
               elementType === 'text' ? <PenSquare className={isMobile ? "h-5 w-5" : "h-4 w-4"} /> :
               elementType === 'video' ? <Video className={isMobile ? "h-5 w-5" : "h-4 w-4"} /> :
               <Edit className={isMobile ? "h-5 w-5" : "h-4 w-4"} />}
            </Button>
          )}
          
          {onReplace && (
            <Button 
              variant="default" 
              size={isMobile ? "default" : "sm"} 
              className={`bg-purple-500 hover:bg-purple-600 ${isMobile ? 'p-2 h-10 w-10' : 'p-1 h-8 w-8'} touch-manipulation active:scale-95`}
              onClick={(e) => {
                e.stopPropagation();
                onReplace();
              }}
              onTouchStart={(e) => {
                e.stopPropagation();
              }}
              title="Replace element"
            >
              <Replace className={isMobile ? "h-5 w-5" : "h-4 w-4"} />
            </Button>
          )}
          
          {onMove && (
            <Button 
              variant="default" 
              size={isMobile ? "default" : "sm"} 
              className={`bg-amber-500 hover:bg-amber-600 ${isMobile ? 'p-2 h-10 w-10' : 'p-1 h-8 w-8'} touch-manipulation active:scale-95`}
              onClick={(e) => {
                e.stopPropagation();
                onMove();
              }}
              onTouchStart={(e) => {
                e.stopPropagation();
              }}
              title="Move element"
            >
              <Move className={isMobile ? "h-5 w-5" : "h-4 w-4"} />
            </Button>
          )}
          
          <Button 
            variant="destructive" 
            size={isMobile ? "default" : "sm"} 
            className={`${isMobile ? 'p-2 h-10 w-10' : 'p-1 h-8 w-8'} touch-manipulation active:scale-95`}
            onClick={(e) => {
              e.stopPropagation();
              setIsSelected(false);
            }}
            onTouchStart={(e) => {
              e.stopPropagation();
            }}
            title="Close selection"
          >
            <X className={isMobile ? "h-5 w-5" : "h-4 w-4"} />
          </Button>
        </div>
      )}

      {/* Type and ID label when selected */}
      {isSelected && (
        <div 
          className={`selection-controls absolute top-2 left-2 bg-blue-500 text-white ${
            isMobile ? 'text-sm px-3 py-2' : 'text-xs sm:text-sm px-2 py-1'
          } rounded-md z-20 flex items-center gap-1.5 shadow-md touch-manipulation`}
          onClick={(e) => e.stopPropagation()} 
          onTouchStart={(e) => e.stopPropagation()}
        >
          {elementType === 'image' ? 
            <ImageIcon className={isMobile ? "h-4 w-4" : "h-3 w-3 sm:h-4 sm:w-4"} /> : 
           elementType === 'text' ? 
            <Type className={isMobile ? "h-4 w-4" : "h-3 w-3 sm:h-4 sm:w-4"} /> : 
           elementType === 'video' ? 
            <Video className={isMobile ? "h-4 w-4" : "h-3 w-3 sm:h-4 sm:w-4"} /> : 
            <Component className={isMobile ? "h-4 w-4" : "h-3 w-3 sm:h-4 sm:w-4"} />
          }
          <span className="whitespace-nowrap font-medium">
            {elementType === 'image' ? 'Image' : 
             elementType === 'text' ? 'Text' : 
             elementType === 'video' ? 'Video' : 'Component'}
            {elementId && <span className="font-normal">{` #${elementId}`}</span>}
          </span>
          
          {/* Mobile-only helper text */}
          {isMobile && (
            <ZoomIn className="h-3.5 w-3.5 ml-1 text-blue-100" />
          )}
        </div>
      )}
      
      {/* Touch helper tooltip for mobile */}
      {showTip && isMobile && !isSelected && (
        <div className="selection-controls absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white text-xs rounded-lg p-3 z-30 shadow-lg max-w-[85%] text-center">
          <div className="flex flex-col items-center gap-2">
            <Fingerprint className="h-6 w-6" />
            <span className="font-medium">Touch and hold to edit this {elementType}</span>
            <div className="text-[10px] text-blue-100 mt-1">
              Press longer to select • Tap elsewhere to cancel
            </div>
            {pressHoldActive && (
              <div className="h-1 bg-blue-300 rounded-full mt-1 w-full overflow-hidden">
                <div className="h-full bg-white animate-progress-bar"></div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Touch feedback during press-and-hold */}
      {pressHoldActive && !showTip && !isSelected && (
        <div className="absolute inset-0 bg-blue-500/5 pointer-events-none z-10 flex items-center justify-center">
          <div className="bg-blue-500/20 rounded-full p-4 animate-pulse">
            <Fingerprint className="h-6 w-6 text-blue-600" />
          </div>
        </div>
      )}
    </div>
  );
}