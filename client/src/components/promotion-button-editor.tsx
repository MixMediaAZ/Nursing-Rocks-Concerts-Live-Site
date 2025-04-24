import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";

interface PromotionButtonEditorProps {
  isOpen: boolean;
  onClose: () => void;
  initialText: string;
  buttonId: string;
  onSave: (text: string) => void;
}

export function PromotionButtonEditor({
  isOpen,
  onClose,
  initialText,
  buttonId,
  onSave,
}: PromotionButtonEditorProps) {
  const [text, setText] = useState(initialText);

  const handleSave = () => {
    onSave(text);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Button Text</DialogTitle>
          <DialogDescription>
            Update the text displayed on this button. The changes will be visible to all users.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor={`${buttonId}-text-input`} className="text-right">
              Text
            </Label>
            <Input
              id={`${buttonId}-text-input`}
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="col-span-3"
              autoFocus
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}