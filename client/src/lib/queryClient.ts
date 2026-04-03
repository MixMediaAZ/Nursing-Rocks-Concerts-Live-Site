import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { isTokenExpired, clearToken } from "./token-utils";

async function throwIfResNotOk(res: Response) {
  // Handle 401 Unauthorized - token expired or invalid
  if (res.status === 401) {
    // Clear token and redirect to login
    if (typeof window !== "undefined") {
      clearToken();
      // Only redirect if not already on login page
      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login?expired=true";
      }
    }
    throw new Error("Unauthorized - session expired");
  }

  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

/**
 * Make authenticated API requests with automatic token handling
 * Checks for token expiration before making request
 * Handles 401 responses by clearing token and redirecting to login
 */
export async function apiRequest(
  method: string,
  url: string,
  options?: Omit<RequestInit, 'method'>
): Promise<Response> {
  // Check if token is expired before making request
  // Skip this check for auth endpoints (login/register/password-reset) where we don't have a token yet
  const isAuthEndpoint = url.includes("/api/auth/") || url.includes("/api/reset-password");
  if (typeof window !== "undefined" && !isAuthEndpoint && isTokenExpired()) {
    clearToken();
    if (!window.location.pathname.includes("/login")) {
      window.location.href = "/login?expired=true";
    }
    throw new Error("Token expired - please log in again");
  }

  const headers = new Headers(options?.headers || {});

  // Add auth token if available
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(url, {
    method,
    credentials: "include",
    ...options,
    headers,
  });

  // Handle auth errors
  if (res.status === 401) {
    if (typeof window !== "undefined") {
      clearToken();
      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login?expired=true";
      }
    }
  }

  return res;
}

/** Returns headers with Bearer token when user is logged in (e.g. for JWT-only auth). */
export function getAuthHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Check token expiration before query
    if (isTokenExpired()) {
      clearToken();
      if (typeof window !== "undefined" && !window.location.pathname.includes("/login")) {
        window.location.href = "/login?expired=true";
      }
      throw new Error("Token expired");
    }

    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
      headers,
    });

    // Handle 401 responses
    if (res.status === 401) {
      if (typeof window !== "undefined") {
        clearToken();
        if (!window.location.pathname.includes("/login")) {
          window.location.href = "/login?expired=true";
        }
      }
    }

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
      // Respect Cache-Control headers from server
      gcTime: 5 * 60 * 1000, // Keep unused data for 5 minutes before garbage collection
    },
    mutations: {
      retry: false,
    },
  },
});
