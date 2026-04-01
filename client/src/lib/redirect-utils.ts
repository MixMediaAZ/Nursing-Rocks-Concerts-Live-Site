/**
 * Redirect URL Validation Utilities
 * Prevents open redirect vulnerabilities and dangerous redirects
 */

/**
 * Validate that a redirect URL is safe
 * Only allows relative paths to same-origin URLs
 * Prevents:
 * - Absolute URLs (http://evil.com)
 * - Protocol-relative URLs (//evil.com)
 * - Data URLs (data:...)
 * - Javascript URLs (javascript:...)
 * - Wildcard or parent directory traversal
 */
export function isSafeRedirect(path: string | null | undefined): path is string {
  if (!path || typeof path !== "string") {
    return false;
  }

  // Must start with / (relative path)
  if (!path.startsWith("/")) {
    return false;
  }

  // Cannot start with // (protocol-relative)
  if (path.startsWith("//")) {
    return false;
  }

  // Cannot contain :// (absolute URLs with scheme)
  if (path.includes("://")) {
    return false;
  }

  // Cannot start with javascript: or data: or other dangerous schemes
  const lowerPath = path.toLowerCase();
  if (
    lowerPath.startsWith("javascript:") ||
    lowerPath.startsWith("data:") ||
    lowerPath.startsWith("vbscript:") ||
    lowerPath.startsWith("file:")
  ) {
    return false;
  }

  // Check for suspicious patterns
  // Allow hash fragments and query strings but not much else
  try {
    // Try to parse as URL with a base to see if there's an issue
    const url = new URL(path, "http://localhost");
    // If it parsed successfully, check the pathname is as expected
    return url.pathname === path || url.pathname === "/" + path.substring(1);
  } catch {
    // If URL parsing fails, it's probably a relative path which is OK
    // Just verify basic structure
    return !path.includes("\n") && !path.includes("\r") && !path.includes("\0");
  }
}

/**
 * Get safe redirect URL with fallback
 * @param path - Proposed redirect path
 * @param fallback - Default path if redirect is unsafe
 */
export function getSafeRedirectUrl(path: string | null | undefined, fallback: string = "/"): string {
  return isSafeRedirect(path) ? path : fallback;
}
