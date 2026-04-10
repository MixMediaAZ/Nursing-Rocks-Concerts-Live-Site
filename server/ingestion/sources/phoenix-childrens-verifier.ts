/**
 * Phoenix Children's Hospital Job Source - VERIFIER ONLY
 * Phase 1: Verify parser works on live posting data
 * Do NOT write to database; output verification report only
 */

import { JSDOM } from 'jsdom';
import { JobSource, VerificationResult } from './base-source';
import {
  RawJobData,
  ListingParseResult,
  ExtractionResult,
  VerificationReport,
} from '../types';
import { parseLocation } from '../normalizer';

export class PhoenixChildrensVerifier extends JobSource {
  sourceName = 'phoenixchildrens';
  sourceType = 'ATS' as const;

  private listingUrl =
    'https://careers.phoenixchildrens.com/Positions/Nursing-jobs';

  /**
   * PHASE 1: Verify listing page is accessible and parseable
   */
  async fetchListingPage(): Promise<ListingParseResult> {
    console.log('[Phoenix Verifier] Fetching listing page...');

    try {
      const html = await this.fetchWithRetry(this.listingUrl);

      if (!html || html.length === 0) {
        return {
          success: false,
          job_ids: [],
          job_count: 0,
          error: 'Empty HTML response',
        };
      }

      // Parse HTML
      const dom = new JSDOM(html);
      const doc = dom.window.document;

      // Extract job IDs from article elements
      const articles = doc.querySelectorAll('article');
      const jobIds: string[] = [];

      articles.forEach(article => {
        // Look for links with job posting IDs in URL
        const link = article.querySelector('a[href*="/Posting/"]');
        if (link) {
          const href = link.getAttribute('href') || '';
          const match = href.match(/\/Posting\/(\d+)/);
          if (match && match[1]) {
            jobIds.push(match[1]);
          }
        }
      });

      console.log(
        `[Phoenix Verifier] Found ${jobIds.length} jobs in listing page`
      );

      return {
        success: jobIds.length > 0,
        job_ids: jobIds,
        job_count: jobIds.length,
        error: jobIds.length === 0 ? 'No job IDs found' : undefined,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('[Phoenix Verifier] Listing page error:', message);

      return {
        success: false,
        job_ids: [],
        job_count: 0,
        error: message,
      };
    }
  }

  /**
   * PHASE 1: Extract single job detail
   */
  async extractJobDetail(jobId: string): Promise<ExtractionResult> {
    const detailUrl = `https://careers.phoenixchildrens.com/Posting/${jobId}`;

    console.log(`[Phoenix Verifier] Extracting job ${jobId}...`);

    try {
      const html = await this.fetchWithRetry(detailUrl);

      if (!html || html.length === 0) {
        return {
          success: false,
          error: 'Empty HTML response',
          raw_html: html,
        };
      }

      const dom = new JSDOM(html);
      const doc = dom.window.document;

      // Extract title (usually in h1 or heading)
      const titleEl = doc.querySelector('h1') || doc.querySelector('h2');
      const title = titleEl ? this.cleanText(titleEl.textContent || '') : '';

      if (!title) {
        return {
          success: false,
          error: 'Could not extract job title',
          raw_html: html,
          fields_extracted: 0,
          fields_total: 5,
        };
      }

      // Extract full body text
      const bodyText = doc.body.textContent || '';

      // Parse text-based fields
      const location_raw = this.extractField(bodyText, 'Location:');
      const department = this.extractField(bodyText, 'Department:');
      const employmentType = this.extractField(bodyText, 'Employment Type:');
      const description = bodyText.substring(0, 2000); // First 2000 chars

      // Parse location
      const locationParts = parseLocation(location_raw || '');

      // Determine apply URL
      const applyButton = doc.querySelector('a[href*="/apply"]');
      const application_url = applyButton
        ? applyButton.getAttribute('href') || detailUrl
        : detailUrl;

      const data: RawJobData = {
        source_name: this.sourceName,
        source_job_id: jobId,
        source_url: detailUrl,
        source_type: this.sourceType,

        title,
        description: this.cleanText(description),
        location_raw: location_raw || 'Unknown',
        specialty_raw: department || 'Nursing',
        job_type: employmentType || 'Full-time',
        application_url,
        contact_email: 'careers@phoenixchildrens.com', // Default
      };

      // Count fields extracted
      const extractedFields = Object.values(data).filter(v => v && v !== 'Unknown')
        .length;

      return {
        success: true,
        data,
        fields_extracted: extractedFields,
        fields_total: Object.keys(data).length,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[Phoenix Verifier] Job ${jobId} error:`, message);

      return {
        success: false,
        error: message,
        fields_extracted: 0,
        fields_total: 5,
      };
    }
  }

  /**
   * Extract field value from text
   * Looks for "FieldName: Value" pattern
   */
  private extractField(text: string, fieldName: string): string {
    const lines = text.split('\n');
    for (const line of lines) {
      if (line.includes(fieldName)) {
        const value = line.split(':')[1]?.trim() || '';
        return value.substring(0, 200); // Limit length
      }
    }
    return '';
  }

  /**
   * PHASE 1: Verify parser works on live data
   */
  async verifyParser(sampleJobIds?: string[]): Promise<VerificationResult> {
    console.log('[Phoenix Verifier] Starting verification...\n');

    const errors: string[] = [];
    const warnings: string[] = [];
    let samplesExtracted = 0;

    // Step 1: Fetch and parse listing page
    console.log('Step 1: Fetching listing page...');
    const listingResult = await this.fetchListingPage();

    if (!listingResult.success) {
      errors.push(`Failed to fetch listing page: ${listingResult.error}`);
      return {
        sourceAccessible: false,
        parserWorking: false,
        samplesExtracted: 0,
        samplesTotal: 0,
        errors,
        warnings,
        recommendation: 'abort',
      };
    }

    console.log(
      `✓ Found ${listingResult.job_count} jobs on listing page\n`
    );

    // Step 2: Extract sample jobs
    console.log('Step 2: Extracting sample job details...');
    const jobsToTest = sampleJobIds || listingResult.job_ids.slice(0, 5);

    const sampleResults = [];

    for (const jobId of jobsToTest) {
      const result = await this.extractJobDetail(jobId);

      if (result.success && result.data) {
        samplesExtracted++;
        sampleResults.push({
          jobId,
          title: result.data.title,
          location: result.data.location_raw,
          success: true,
          fieldsExtracted: result.fields_extracted || 0,
        });
        console.log(
          `✓ Job ${jobId}: "${result.data.title.substring(0, 50)}..."`
        );
      } else {
        sampleResults.push({
          jobId,
          success: false,
          error: result.error,
        });
        console.log(`✗ Job ${jobId}: ${result.error}`);
        warnings.push(`Job ${jobId} extraction failed: ${result.error}`);
      }
    }

    console.log(
      `\nExtracted ${samplesExtracted} of ${jobsToTest.length} samples\n`
    );

    // Determine recommendation
    const extractionRate = (samplesExtracted / jobsToTest.length) * 100;
    let recommendation: VerificationResult['recommendation'] = 'proceed';

    if (extractionRate < 60) {
      recommendation = 'abort';
      errors.push(
        `Low extraction rate: ${extractionRate.toFixed(0)}% (need 70%+)`
      );
    } else if (extractionRate < 80) {
      recommendation = 'investigate';
      warnings.push(
        `Moderate extraction rate: ${extractionRate.toFixed(0)}%. Some jobs may not parse correctly.`
      );
    }

    return {
      sourceAccessible: listingResult.success,
      parserWorking: samplesExtracted > 0,
      samplesExtracted,
      samplesTotal: jobsToTest.length,
      errors,
      warnings,
      recommendation,
    };
  }

  /**
   * Generate human-readable verification report
   */
  async generateReport(): Promise<VerificationReport> {
    const timestamp = new Date().toISOString();
    console.log(`[Phoenix Verifier] Generating report... ${timestamp}\n`);

    // Step 1: Listing page
    const listingResult = await this.fetchListingPage();

    // Step 2: Sample extractions
    const jobIds = listingResult.job_ids.slice(0, 5);
    const sampleExtractions = [];

    for (const jobId of jobIds) {
      const result = await this.extractJobDetail(jobId);

      if (result.success && result.data) {
        const locationParts = parseLocation(
          result.data.location_raw || ''
        );

        sampleExtractions.push({
          posting_id: jobId,
          url: result.data.source_url,
          success: true,
          title: result.data.title,
          location_raw: result.data.location_raw,
          location_city: locationParts.location_city,
          location_state: locationParts.location_state,
          employment_type: result.data.job_type,
          apply_url: result.data.application_url,
          fields_extracted: result.fields_extracted || 0,
          fields_total: result.fields_total || 10,
          confidence: (
            ((result.fields_extracted || 0) / (result.fields_total || 10)) *
            100
          ),
        });
      } else {
        sampleExtractions.push({
          posting_id: jobId,
          url: `https://careers.phoenixchildrens.com/Posting/${jobId}`,
          success: false,
          confidence: 0,
          error: result.error,
        });
      }
    }

    // Calculate confidence scores
    const successCount = sampleExtractions.filter(s => s.success).length;
    const avgConfidence =
      sampleExtractions.reduce(
        (sum, s) => sum + (s.confidence || 0),
        0
      ) / sampleExtractions.length;

    const report: VerificationReport = {
      source_name: this.sourceName,
      listing_page_url: this.listingUrl,
      test_timestamp: timestamp,

      listing_page: {
        fetched: listingResult.success,
        job_count: listingResult.job_count,
        error: listingResult.error,
      },

      sample_extractions: sampleExtractions,

      parser_confidence: {
        title_extraction: successCount === 5 ? 100 : (successCount / 5) * 100,
        location_extraction:
          sampleExtractions.filter(s => s.location_city).length * 20,
        employment_type_extraction:
          sampleExtractions.filter(s => s.employment_type).length * 20,
        apply_url_extraction:
          sampleExtractions.filter(s => s.apply_url).length * 20,
        overall: avgConfidence,
      },

      recommendation:
        successCount >= 3 && avgConfidence >= 75
          ? 'proceed'
          : successCount >= 2
            ? 'investigate'
            : 'abort',

      notes: [
        `Listing page: ${listingResult.job_count} jobs found`,
        `Samples: ${successCount} of ${sampleExtractions.length} extracted successfully`,
        `Average confidence: ${avgConfidence.toFixed(0)}%`,
      ],

      warnings:
        successCount < 5
          ? [
              `${5 - successCount} samples failed to extract. This may indicate HTML structure changes.`,
            ]
          : [],
    };

    return report;
  }
}

/**
 * Standalone verifier entrypoint
 */
export async function runPhoenixVerification() {
  const verifier = new PhoenixChildrensVerifier();

  try {
    const report = await verifier.generateReport();

    console.log('\n========== VERIFICATION REPORT ==========\n');
    console.log(JSON.stringify(report, null, 2));

    const exitCode =
      report.recommendation === 'proceed'
        ? 0
        : report.recommendation === 'investigate'
          ? 1
          : 2;

    console.log(`\nRecommendation: ${report.recommendation.toUpperCase()}`);
    console.log(`Exit code: ${exitCode}\n`);

    process.exit(exitCode);
  } catch (error) {
    console.error('Verification failed:', error);
    process.exit(2);
  }
}

// Run if called directly
if (require.main === module) {
  runPhoenixVerification();
}
