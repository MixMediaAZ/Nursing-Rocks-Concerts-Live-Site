import { useCallback } from 'react';

/**
 * A custom hook for handling navigation in the application
 * This bypasses wouter and uses direct browser navigation
 */
export function useNavigation() {
  /**
   * Navigate to a specific route using browser history API
   */
  const navigateTo = useCallback((path: string) => {
    // Use browser's history API for navigation
    window.history.pushState({}, '', path);
    
    // Dispatch a popstate event to notify the application of the navigation
    window.dispatchEvent(new PopStateEvent('popstate', { state: {} }));
    
    // Force a page reload as a fallback if the popstate event doesn't trigger properly
    setTimeout(() => {
      window.location.href = path;
    }, 100);
  }, []);

  return { navigateTo };
}