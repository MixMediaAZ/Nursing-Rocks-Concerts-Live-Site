import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface PromotionButtonEditorProps {
  isOpen: boolean;
  onClose: () => void;
  initialText: string;
  buttonId: string;
  onSave: (newText: string) => void;
}

export function PromotionButtonEditor({
  isOpen,
  onClose,
  initialText,
  buttonId,
  onSave
}: PromotionButtonEditorProps) {
  const [text, setText] = useState(initialText);
  const { toast } = useToast();

  // Reset text when dialog opens with new initial text
  useEffect(() => {
    if (isOpen) {
      setText(initialText);
    }
  }, [isOpen, initialText]);

  const handleSave = () => {
    try {
      // Directly update the button text by ID
      const buttonElement = document.getElementById(buttonId);
      const textSpanId = buttonId === 'comfortSocksButton' ? 'comfortSocksText' : 'tshirtText';
      const textSpan = document.getElementById(textSpanId);
      
      if (textSpan) {
        // Update the span text
        textSpan.textContent = text;
        console.log(`Successfully updated ${textSpanId} to: "${text}"`);
      } else if (buttonElement) {
        // Fallback to updating button directly
        const existingSpans = buttonElement.querySelectorAll('span');
        if (existingSpans.length > 0) {
          existingSpans[existingSpans.length - 1].textContent = text;
        } else {
          // Last resort - clear and rebuild button
          const iconElement = buttonElement.querySelector('svg');
          buttonElement.innerHTML = '';
          
          if (iconElement) {
            buttonElement.appendChild(iconElement.cloneNode(true));
          }
          
          const newSpan = document.createElement('span');
          newSpan.className = 'text-center';
          newSpan.textContent = text;
          buttonElement.appendChild(newSpan);
        }
      } else {
        throw new Error(`Button element with ID ${buttonId} not found`);
      }
      
      // Notify parent component
      onSave(text);
      
      // Show success message
      toast({
        title: 'Button Text Updated',
        description: `The button text has been changed to "${text}"`,
      });
      
      // Close the dialog
      onClose();
    } catch (error) {
      console.error('Error updating button text:', error);
      toast({
        title: 'Error',
        description: 'There was a problem updating the button text.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Button Text</DialogTitle>
          <DialogDescription>
            Update the text displayed on the promotion button.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col space-y-4 py-4">
          <Input
            id="button-text-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter button text"
            className="col-span-3"
          />
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}