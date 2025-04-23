import { useState } from "react";
import { Gallery } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Edit2 } from "lucide-react";
import { ReplaceImageDialog } from "./replace-image-dialog";

interface ImageReplacementTriggerProps {
  children: React.ReactNode;
  imageData: Gallery;
  triggerPosition?: "top-right" | "bottom-right" | "bottom-left" | "top-left";
  onReplaceComplete?: () => void;
  isAdmin?: boolean;
}

export function ImageReplacementTrigger({
  children,
  imageData,
  triggerPosition = "top-right",
  onReplaceComplete,
  isAdmin = false
}: ImageReplacementTriggerProps) {
  const [isReplaceDialogOpen, setIsReplaceDialogOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  // If not admin, don't show the edit button
  if (!isAdmin) {
    return <>{children}</>;
  }

  // Calculate position classes
  const positionClasses = {
    "top-right": "top-2 right-2",
    "bottom-right": "bottom-2 right-2",
    "bottom-left": "bottom-2 left-2",
    "top-left": "top-2 left-2"
  };
  
  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
      
      {/* Edit overlay */}
      {isHovered && (
        <div className="absolute inset-0 bg-black/30 transition-opacity duration-200">
          <Button
            size="sm"
            variant="default"
            className={`absolute ${positionClasses[triggerPosition]} text-white bg-primary/90 hover:bg-primary/100 z-10`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsReplaceDialogOpen(true);
            }}
          >
            <Edit2 className="w-4 h-4 mr-1" />
            Replace
          </Button>
        </div>
      )}

      {/* Replace dialog */}
      <ReplaceImageDialog
        isOpen={isReplaceDialogOpen}
        onClose={() => setIsReplaceDialogOpen(false)}
        targetImage={imageData}
        onReplaceComplete={() => {
          setIsReplaceDialogOpen(false);
          if (onReplaceComplete) {
            onReplaceComplete();
          }
        }}
      />
    </div>
  );
}