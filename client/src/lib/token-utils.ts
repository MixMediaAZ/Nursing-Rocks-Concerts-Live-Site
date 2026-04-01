/**
 * Token Expiration & Management Utilities
 * Handles JWT token lifecycle including expiration tracking and validation
 */

const TOKEN_KEY = "token";
const TOKEN_EXPIRY_KEY = "token_expiry";
const TOKEN_ISSUED_AT_KEY = "token_issued_at";
const TOKEN_EXPIRATION_TIME = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

/**
 * Store token and track expiration time
 * Called after successful login/registration
 */
export function setToken(token: string): void {
  const now = Date.now();
  const expiresAt = now + TOKEN_EXPIRATION_TIME;

  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(TOKEN_ISSUED_AT_KEY, now.toString());
  localStorage.setItem(TOKEN_EXPIRY_KEY, expiresAt.toString());
}

/**
 * Get current token, returns null if expired
 */
export function getToken(): string | null {
  const token = localStorage.getItem(TOKEN_KEY);

  if (!token) {
    return null;
  }

  // Check if token is expired
  if (isTokenExpired()) {
    clearToken();
    return null;
  }

  return token;
}

/**
 * Check if token exists and is not expired
 */
export function isTokenValid(): boolean {
  const token = localStorage.getItem(TOKEN_KEY);
  return !!token && !isTokenExpired();
}

/**
 * Check if token is expired
 */
export function isTokenExpired(): boolean {
  const expiryStr = localStorage.getItem(TOKEN_EXPIRY_KEY);

  if (!expiryStr) {
    return true; // No expiry info, consider expired
  }

  const expiresAt = parseInt(expiryStr, 10);
  const now = Date.now();

  return now > expiresAt;
}

/**
 * Get remaining time in milliseconds
 */
export function getTokenTimeRemaining(): number {
  const expiryStr = localStorage.getItem(TOKEN_EXPIRY_KEY);

  if (!expiryStr) {
    return 0;
  }

  const expiresAt = parseInt(expiryStr, 10);
  const now = Date.now();
  const remaining = expiresAt - now;

  return remaining > 0 ? remaining : 0;
}

/**
 * Get token expiration time as Date object
 */
export function getTokenExpirationDate(): Date | null {
  const expiryStr = localStorage.getItem(TOKEN_EXPIRY_KEY);

  if (!expiryStr) {
    return null;
  }

  return new Date(parseInt(expiryStr, 10));
}

/**
 * Clear all token-related data from localStorage
 */
export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TOKEN_EXPIRY_KEY);
  localStorage.removeItem(TOKEN_ISSUED_AT_KEY);
  localStorage.removeItem("user");
  localStorage.removeItem("isAdmin");
}

/**
 * Check if token is about to expire (within 5 minutes)
 * Useful for showing renewal warnings
 */
export function isTokenExpiringSoon(): boolean {
  const remaining = getTokenTimeRemaining();
  const fiveMinutes = 5 * 60 * 1000;
  return remaining < fiveMinutes && remaining > 0;
}
