import { create } from 'zustand';

interface AdminEditModeState {
  isAdminMode: boolean;
  setAdminMode: (mode: boolean) => void;
  toggleAdminMode: () => void;
}

/**
 * Hook to detect and control admin edit mode
 * Returns state and functions to control admin mode
 */
export const useAdminEditMode = create<AdminEditModeState>((set) => {
  // Initialize from localStorage if available
  const initialAdminStatus = typeof window !== 'undefined' && window.localStorage.getItem("isAdmin") === "true";
  const initialEditMode = typeof window !== 'undefined' && window.localStorage.getItem("editMode") === "true";
  const initialState = initialAdminStatus && initialEditMode;
  
  return {
    isAdminMode: initialState,
    
    setAdminMode: (mode) => {
      // Update localStorage
      if (typeof window !== 'undefined') {
        window.localStorage.setItem("editMode", mode ? "true" : "false");
        
        // Broadcast the change for other components
        window.dispatchEvent(new Event('admin-mode-changed'));
      }
      
      set({ isAdminMode: mode });
    },
    
    toggleAdminMode: () => set((state) => {
      // Update localStorage
      if (typeof window !== 'undefined') {
        window.localStorage.setItem("editMode", state.isAdminMode ? "false" : "true");
        
        // Broadcast the change for other components
        window.dispatchEvent(new Event('admin-mode-changed'));
      }
      
      return { isAdminMode: !state.isAdminMode };
    }),
  };
});