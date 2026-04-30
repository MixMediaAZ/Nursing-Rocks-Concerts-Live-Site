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
  const readState = () =>
    typeof window !== 'undefined' &&
    window.localStorage.getItem("isAdmin") === "true" &&
    window.localStorage.getItem("editMode") === "true";

  // Sync Zustand state when FloatingAdminControl writes to localStorage
  if (typeof window !== 'undefined') {
    const sync = () => set({ isAdminMode: readState() });
    window.addEventListener('admin-mode-changed', sync);
    window.addEventListener('storage', sync);
  }

  return {
    isAdminMode: readState(),

    setAdminMode: (mode) => {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem("editMode", mode ? "true" : "false");
        window.dispatchEvent(new Event('admin-mode-changed'));
      }
      set({ isAdminMode: mode });
    },

    toggleAdminMode: () => set((state) => {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem("editMode", state.isAdminMode ? "false" : "true");
        window.dispatchEvent(new Event('admin-mode-changed'));
      }
      return { isAdminMode: !state.isAdminMode };
    }),
  };
});