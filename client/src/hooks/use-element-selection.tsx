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
  isTextEditorDialogOpen: boolean; 
  textContent: string;
  setSelectedElement: (element: SelectedElement | null) => void;
  clearSelectedElement: () => void;
  openImageReplacementDialog: () => void;
  closeImageReplacementDialog: () => void;
  openTextEditorDialog: (content: string) => void;
  closeTextEditorDialog: () => void;
  updateTextContent: (content: string) => void;
}

export const useElementSelection = create<ElementSelectionState>((set) => ({
  selectedElement: null,
  isImageReplacementDialogOpen: false,
  isTextEditorDialogOpen: false,
  textContent: '',
  
  setSelectedElement: (element) => set({ selectedElement: element }),
  
  clearSelectedElement: () => set({ selectedElement: null }),
  
  openImageReplacementDialog: () => set({ isImageReplacementDialogOpen: true }),
  
  closeImageReplacementDialog: () => set({ isImageReplacementDialogOpen: false }),
  
  openTextEditorDialog: (content: string) => set({ 
    isTextEditorDialogOpen: true,
    textContent: content
  }),
  
  closeTextEditorDialog: () => set({ isTextEditorDialogOpen: false }),
  
  updateTextContent: (content: string) => set({ textContent: content }),
}));