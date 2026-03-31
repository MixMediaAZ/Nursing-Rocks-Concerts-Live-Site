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

  // SAFETY FIX: Handle unauthorized/forbidden responses (token revoked or expired)
  if (response.status === 401 || response.status === 403) {
    // Call server logout endpoint to clean up blacklist
    if (token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
        });
      } catch (err) {
        // Silently fail - server endpoint might not be available
      }
    }

    // Clear all admin authentication
    localStorage.removeItem('adminToken');
    localStorage.removeItem('token');
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('adminPinVerified');
    localStorage.removeItem('user');

    // Only redirect if we're on an admin page
    if (window.location.pathname.startsWith('/admin')) {
      window.location.reload();
    }
  }

  return response;
}
