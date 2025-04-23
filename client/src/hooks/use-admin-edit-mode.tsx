import { useState, useEffect } from 'react';

/**
 * Hook to detect if the site is in admin edit mode
 * Returns a boolean indicating if admin edit mode is active
 */
export function useAdminEditMode() {
  const [isEditMode, setIsEditMode] = useState(false);
  
  useEffect(() => {
    // Check localStorage for edit mode flags
    const adminStatus = localStorage.getItem("isAdmin") === "true";
    const editModeActive = localStorage.getItem("editMode") === "true";
    
    setIsEditMode(adminStatus && editModeActive);
    
    // Listen for changes in localStorage
    const handleStorageChange = () => {
      const adminStatus = localStorage.getItem("isAdmin") === "true";
      const editModeActive = localStorage.getItem("editMode") === "true";
      setIsEditMode(adminStatus && editModeActive);
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);
  
  return isEditMode;
}