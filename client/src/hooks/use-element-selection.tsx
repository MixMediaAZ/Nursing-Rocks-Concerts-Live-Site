import { create } from 'zustand';

interface SelectedElement {
  id: string | number;
  type: 'image' | 'text' | 'video' | 'component';
  originalUrl?: string;
  dimensions?: {
    width?: number;
    height?: number;
  };
  metadata?: Record<string, any>;
}

interface ElementSelectionState {
  selectedElement: SelectedElement | null;
  isImageReplacementDialogOpen: boolean;
  setSelectedElement: (element: SelectedElement | null) => void;
  clearSelectedElement: () => void;
  openImageReplacementDialog: () => void;
  closeImageReplacementDialog: () => void;
}

export const useElementSelection = create<ElementSelectionState>((set) => ({
  selectedElement: null,
  isImageReplacementDialogOpen: false,
  
  setSelectedElement: (element) => set({ selectedElement: element }),
  
  clearSelectedElement: () => set({ selectedElement: null }),
  
  openImageReplacementDialog: () => set({ isImageReplacementDialogOpen: true }),
  
  closeImageReplacementDialog: () => set({ isImageReplacementDialogOpen: false }),
}));