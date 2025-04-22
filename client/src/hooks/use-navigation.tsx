import { useCallback } from 'react';

/**
 * A custom hook for handling navigation in the application
 * This uses direct browser navigation for consistency across platforms
 */
export function useNavigation() {
  /**
   * Navigate to a specific route using direct browser navigation
   * This is more reliable than using wouter's setLocation or window.history
   * and ensures consistent behavior across platforms and browsers
   */
  const navigateTo = useCallback((path: string) => {
    // Use direct navigation for consistency
    window.location.href = path;
  }, []);

  return { navigateTo };
}