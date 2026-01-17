/**
 * Admin authentication utilities
 * Provides adminFetch function for making authenticated admin API requests
 */

/**
 * Fetches admin token from localStorage
 */
function getAdminToken(): string | null {
  return localStorage.getItem('adminToken') || localStorage.getItem('token');
}

/**
 * Makes an authenticated fetch request with admin token
 * Automatically includes Authorization header with Bearer token
 */
export async function adminFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = getAdminToken();

  const headers = new Headers(options.headers);
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Set Content-Type if not already set and body is provided
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // If unauthorized, clear admin token and redirect to admin login
  if (response.status === 401 || response.status === 403) {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('adminPinVerified');
    
    // Only redirect if we're on an admin page
    if (window.location.pathname.startsWith('/admin')) {
      window.location.reload();
    }
  }

  return response;
}
