/**
 * Helper to get optimized poster URLs with WebP preference and JPG fallback
 * Reduces bandwidth by preferring smaller WebP format when available
 */

/**
 * Get poster URL with WebP preference and JPG fallback
 * @param publicId - Video public ID
 * @param existingPosterUrl - If poster_url already exists from API, use it
 * @returns Object with webp and jpg URLs, and a function to get the best available
 */
export function getOptimizedPosterUrl(
  publicId: string,
  existingPosterUrl?: string
): {
  webpUrl: string;
  jpgUrl: string;
  getUrl: () => string;
} {
  // If we already have a poster URL from the API, use it as-is
  if (existingPosterUrl) {
    return {
      webpUrl: existingPosterUrl,
      jpgUrl: existingPosterUrl,
      getUrl: () => existingPosterUrl,
    };
  }

  // Construct poster URLs from CDN base
  const base = (import.meta as any).env?.VITE_VIDEO_CDN_BASE_URL as string | undefined;
  const normalized = base ? base.replace(/\/+$/, "") : "";

  // Try WebP first (smaller file size), fallback to JPG
  const webpUrl = `${normalized}/poster/${publicId}.webp`;
  const jpgUrl = `${normalized}/poster/${publicId}.jpg`;

  // Return a function that tries WebP first, but we'll handle fallback in the component
  return {
    webpUrl,
    jpgUrl,
    getUrl: () => webpUrl, // Default to WebP, component will handle fallback
  };
}
