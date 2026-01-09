/**
 * Admin authentication utility
 * Handles admin token generation and refresh
 */

const ADMIN_PIN = "1234567"; // Same as backend

export async function getValidAdminToken(): Promise<string | null> {
  // Try to get existing token
  const existingToken = localStorage.getItem('adminToken') || localStorage.getItem('token');
  
  if (existingToken) {
    // Test if token is valid
    try {
      const testResponse = await fetch('/api/admin/videos', {
        method: 'HEAD',
        headers: {
          'Authorization': `Bearer ${existingToken}`,
        },
      });
      
      if (testResponse.ok || testResponse.status === 200) {
        return existingToken;
      }
    } catch (e) {
      console.log('[admin-auth] Token validation failed, will refresh');
    }
  }
  
  // Token is invalid or missing, generate new one using PIN
  try {
    console.log('[admin-auth] Generating new admin token with PIN...');
    const response = await fetch('/api/admin/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ pin: ADMIN_PIN }),
    });
    
    if (!response.ok) {
      console.error('[admin-auth] Failed to generate admin token, status:', response.status);
      return null;
    }
    
    const data = await response.json();
    
    // Store the new token
    localStorage.setItem('adminToken', data.token);
    localStorage.setItem('token', data.token);
    localStorage.setItem('isAdmin', 'true');
    
    console.log('[admin-auth] ✓ Successfully generated and stored new admin token');
    return data.token;
  } catch (error) {
    console.error('[admin-auth] Error generating admin token:', error);
    return null;
  }
}

/**
 * Make an authenticated admin API request with automatic token refresh
 */
export async function adminFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = await getValidAdminToken();
  
  if (!token) {
    throw new Error('Failed to obtain valid admin token');
  }
  
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
    },
  });
}

