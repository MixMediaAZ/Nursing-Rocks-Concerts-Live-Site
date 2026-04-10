/**
 * Base source interface for job ingestion
 * All sources must implement this interface
 */

import { RawJobData, ListingParseResult, ExtractionResult } from '../types';

export interface IJobSource {
  sourceName: string;
  sourceType: 'ATS' | 'manual' | 'API' | 'scraped';

  /**
   * Fetch and parse listing page
   * Returns list of job IDs/URLs to extract
   */
  fetchListingPage(): Promise<ListingParseResult>;

  /**
   * Extract detailed job information
   */
  extractJobDetail(jobId: string, jobUrl: string): Promise<ExtractionResult>;

  /**
   * Verify source is accessible and parser works
   * Used in verification phase before full ingestion
   */
  verifyParser(sampleJobIds?: string[]): Promise<VerificationResult>;
}

export interface VerificationResult {
  sourceAccessible: boolean;
  parserWorking: boolean;
  samplesExtracted: number;
  samplesTotal: number;
  errors: string[];
  warnings: string[];
  recommendation: 'proceed' | 'investigate' | 'abort';
}

/**
 * Abstract base class for job sources
 * Provides common HTTP utilities
 */
export abstract class JobSource implements IJobSource {
  abstract sourceName: string;
  abstract sourceType: 'ATS' | 'manual' | 'API' | 'scraped';

  protected requestTimeout: number = 30000; // 30 seconds
  protected maxRetries: number = 2;

  abstract fetchListingPage(): Promise<ListingParseResult>;
  abstract extractJobDetail(jobId: string, jobUrl: string): Promise<ExtractionResult>;
  abstract verifyParser(sampleJobIds?: string[]): Promise<VerificationResult>;

  /**
   * Fetch URL with timeout and retry logic
   */
  protected async fetchWithRetry(
    url: string,
    options?: { timeout?: number; retries?: number }
  ): Promise<string> {
    const timeout = options?.timeout || this.requestTimeout;
    const maxRetries = options?.retries ?? this.maxRetries;

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(
            `HTTP ${response.status}: ${response.statusText}`
          );
        }

        return await response.text();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Exponential backoff: 1s, 2s, 4s, etc.
        if (attempt < maxRetries) {
          const delayMs = Math.pow(2, attempt) * 1000;
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }
    }

    throw new Error(
      `Failed to fetch ${url} after ${maxRetries + 1} attempts: ${lastError?.message}`
    );
  }

  /**
   * Normalize email to lowercase and trim
   */
  protected normalizeEmail(email: string): string {
    return email.toLowerCase().trim();
  }

  /**
   * Clean text: trim, remove extra whitespace
   */
  protected cleanText(text?: string): string {
    if (!text) return '';
    return text
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[\r\n]+/g, ' ');
  }
}
