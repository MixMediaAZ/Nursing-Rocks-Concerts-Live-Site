import { useEffect } from 'react';

interface AuthRedirectProps {
  redirectTo: string;
  checkAuth?: boolean; // If true, redirects to redirectTo if authenticated
}

/**
 * A utility component that checks authentication status and redirects accordingly
 * If checkAuth is true, redirects to redirectTo if authenticated
 * If checkAuth is false (default), redirects to redirectTo if NOT authenticated
 */
export function AuthRedirect({ redirectTo, checkAuth = false }: AuthRedirectProps) {
  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    const isAuthenticated = !!(token && user);
    
    // If checkAuth is true, redirect if authenticated
    // If checkAuth is false, redirect if not authenticated
    if ((checkAuth && isAuthenticated) || (!checkAuth && !isAuthenticated)) {
      console.log(`Redirecting to ${redirectTo} - Auth state: ${isAuthenticated}`);
      window.location.href = redirectTo;
    }
  }, [redirectTo, checkAuth]);
  
  return null;
}