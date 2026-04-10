/**
 * Hash utilities for job ingestion
 * SHA256 for content deduplication
 */

import { createHash } from 'crypto';

/**
 * Generate SHA256 hash of job description for deduplication
 * Uses only the description field to detect content changes
 */
export function generateContentHash(description: string): string {
  if (!description) {
    return '';
  }

  // Normalize whitespace and case for consistent hashing
  const normalized = description
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

  return createHash('sha256')
    .update(normalized, 'utf8')
    .digest('hex');
}

/**
 * Generate SHA256 hash of entire job posting for comparison
 * Includes title, description, location, requirements
 */
export function generateFullPostingHash(
  title: string,
  description: string,
  location: string
): string {
  const combined = `${title}|${description}|${location}`
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

  return createHash('sha256')
    .update(combined, 'utf8')
    .digest('hex');
}

/**
 * Generate SHA256 hash of HTML page content
 * Used to detect when listing page structure changes
 */
export function generatePageHash(htmlContent: string): string {
  if (!htmlContent) {
    return '';
  }

  // Remove whitespace-only lines and comments for stable hashing
  const cleaned = htmlContent
    .replace(/<!--[\s\S]*?-->/g, '') // Remove HTML comments
    .replace(/>\s+</g, '><') // Remove whitespace between tags
    .replace(/\s{2,}/g, ' ') // Collapse multiple spaces
    .trim();

  return createHash('sha256')
    .update(cleaned, 'utf8')
    .digest('hex');
}
