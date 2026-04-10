/**
 * Phoenix Children's Jobs Verifier - ES Module Version
 * No database required - fetch + parse only
 */

import https from 'https';
import http from 'http';
import { JSDOM } from 'jsdom';

// ============= UTILITIES =============

function cleanText(text) {
  if (!text) return '';
  return text
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[\r\n]+/g, ' ');
}

function normalizeJobType(jobType) {
  if (!jobType) return undefined;
  const normalized = jobType.toLowerCase().trim();
  if (normalized.includes('full')) return 'Full-time';
  if (normalized.includes('part')) return 'Part-time';
  if (normalized.includes('contract')) return 'Contract';
  if (normalized.includes('temporary')) return 'Contract';
  if (normalized.includes('per diem')) return 'Per Diem';
  return jobType;
}

function parseLocation(locationRaw) {
  if (!locationRaw) return {};
  const trimmed = locationRaw.trim();
  const parts = trimmed.split(',').map((p) => p.trim());

  let locationCity = parts[0];
  let locationState = undefined;
  let locationPostalCode = undefined;

  if (parts.length >= 2) {
    const statePart = parts[1];
    const stateMatch = statePart.match(/^([A-Za-z\s]+?)\s*(\d{5})?$/);
    if (stateMatch) {
      locationState = stateMatch[1].trim();
      locationPostalCode = stateMatch[2];
    } else {
      locationState = statePart;
    }
  }

  const isRemote =
    locationRaw.toLowerCase().includes('remote') ||
    locationRaw.toLowerCase().includes('virtual');

  const result = {};
  if (locationCity) result.location_city = locationCity;
  if (locationState) result.location_state = locationState;
  if (locationPostalCode) result.location_postal_code = locationPostalCode;
  if (isRemote) result.is_remote = true;

  return result;
}

function extractField(text, fieldName) {
  const lines = text.split('\n');
  for (const line of lines) {
    if (line.includes(fieldName)) {
      const value = (line.split(':')[1] || '').trim();
      return value.substring(0, 200);
    }
  }
  return '';
}

// ============= FETCH WITH RETRY =============

function fetchWithRetry(url, maxRetries = 2, timeout = 30000) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const protocol = url.startsWith('https') ? https : http;

    const tryFetch = () => {
      const timer = setTimeout(() => {
        reject(new Error('Timeout'));
      }, timeout);

      const req = protocol.get(
        url,
        { headers: { 'User-Agent': 'Mozilla/5.0' } },
        (res) => {
          clearTimeout(timer);

          if (res.statusCode !== 200) {
            reject(new Error(`HTTP ${res.statusCode}`));
            return;
          }

          let data = '';
          res.on('data', (chunk) => {
            data += chunk;
          });
          res.on('end', () => {
            resolve(data);
          });
        }
      );

      req.on('error', (error) => {
        clearTimeout(timer);
        attempts++;
        if (attempts <= maxRetries) {
          const delay = Math.pow(2, attempts - 1) * 1000;
          setTimeout(tryFetch, delay);
        } else {
          reject(error);
        }
      });
    };

    tryFetch();
  });
}

// ============= VERIFIER LOGIC =============

async function fetchListingPage() {
  const url = 'https://careers.phoenixchildrens.com/Positions/Nursing-jobs';
  console.log('[Verifier] Fetching listing page...');

  try {
    const html = await fetchWithRetry(url);

    if (!html || html.length === 0) {
      return { success: false, job_ids: [], job_count: 0, error: 'Empty HTML' };
    }

    const dom = new JSDOM(html);
    const doc = dom.window.document;
    const articles = doc.querySelectorAll('article');
    const jobIds = [];

    articles.forEach((article) => {
      const link = article.querySelector('a[href*="/Posting/"]');
      if (link) {
        const href = link.getAttribute('href') || '';
        const match = href.match(/\/Posting\/(\d+)/);
        if (match && match[1]) {
          jobIds.push(match[1]);
        }
      }
    });

    console.log(`[Verifier] Found ${jobIds.length} jobs`);

    return {
      success: jobIds.length > 0,
      job_ids: jobIds,
      job_count: jobIds.length,
    };
  } catch (error) {
    console.error('[Verifier] Listing error:', error.message);
    return {
      success: false,
      job_ids: [],
      job_count: 0,
      error: error.message,
    };
  }
}

async function extractJobDetail(jobId) {
  const url = `https://careers.phoenixchildrens.com/Posting/${jobId}`;
  console.log(`[Verifier] Extracting job ${jobId}...`);

  try {
    const html = await fetchWithRetry(url);

    if (!html) {
      return { success: false, error: 'Empty HTML', fields_extracted: 0 };
    }

    const dom = new JSDOM(html);
    const doc = dom.window.document;

    const titleEl = doc.querySelector('h1') || doc.querySelector('h2');
    const title = titleEl ? cleanText(titleEl.textContent || '') : '';

    if (!title) {
      return { success: false, error: 'No title found', fields_extracted: 0 };
    }

    const bodyText = doc.body.textContent || '';
    const locationRaw = extractField(bodyText, 'Location:');
    const department = extractField(bodyText, 'Department:');
    const employmentType = extractField(bodyText, 'Employment Type:');
    const description = bodyText.substring(0, 2000);
    const locationParts = parseLocation(locationRaw || '');

    const applyButton = doc.querySelector('a[href*="/apply"]');
    const applicationUrl = applyButton
      ? applyButton.getAttribute('href') || url
      : url;

    const data = {
      source_job_id: jobId,
      source_url: url,
      title,
      location_raw: locationRaw || 'Unknown',
      ...locationParts,
      employment_type: normalizeJobType(employmentType),
      apply_url: applicationUrl,
    };

    const fieldsExtracted = Object.values(data).filter(
      (v) => v && v !== 'Unknown'
    ).length;

    return {
      success: true,
      data,
      fields_extracted: fieldsExtracted,
      fields_total: Object.keys(data).length,
    };
  } catch (error) {
    console.error(`[Verifier] Job ${jobId} error:`, error.message);
    return {
      success: false,
      error: error.message,
      fields_extracted: 0,
    };
  }
}

// ============= MAIN VERIFICATION =============

async function runVerification() {
  console.log('\n========== PHOENIX CHILDREN\'S VERIFIER ==========\n');

  const timestamp = new Date().toISOString();
  const listingResult = await fetchListingPage();

  if (!listingResult.success) {
    const report = {
      source_name: 'phoenixchildrens',
      listing_page_url: 'https://careers.phoenixchildrens.com/Positions/Nursing-jobs',
      test_timestamp: timestamp,
      listing_page: { fetched: false, error: listingResult.error },
      sample_extractions: [],
      parser_confidence: { overall: 0 },
      recommendation: 'abort',
      notes: [`Listing page fetch failed: ${listingResult.error}`],
      warnings: [],
    };

    console.log(JSON.stringify(report, null, 2));
    process.exit(2);
    return;
  }

  console.log(`✓ Listing page: ${listingResult.job_count} jobs\n`);

  const jobsToTest = listingResult.job_ids.slice(0, 5);
  const sampleExtractions = [];
  let successCount = 0;

  console.log('Extracting sample jobs...');
  for (const jobId of jobsToTest) {
    const result = await extractJobDetail(jobId);

    if (result.success && result.data) {
      successCount++;
      sampleExtractions.push({
        posting_id: jobId,
        url: result.data.source_url,
        success: true,
        title: result.data.title,
        location_raw: result.data.location_raw,
        location_city: result.data.location_city,
        location_state: result.data.location_state,
        employment_type: result.data.employment_type,
        apply_url: result.data.apply_url,
        fields_extracted: result.fields_extracted,
        confidence:
          ((result.fields_extracted || 0) / (result.fields_total || 10)) * 100,
      });
      console.log(
        `✓ Job ${jobId}: "${result.data.title.substring(0, 40)}..."`
      );
    } else {
      sampleExtractions.push({
        posting_id: jobId,
        url: `https://careers.phoenixchildrens.com/Posting/${jobId}`,
        success: false,
        error: result.error,
        confidence: 0,
      });
      console.log(`✗ Job ${jobId}: ${result.error}`);
    }
  }

  const avgConfidence =
    sampleExtractions.reduce((sum, s) => sum + (s.confidence || 0), 0) /
    sampleExtractions.length;

  const recommendation =
    successCount >= 4 && avgConfidence >= 75
      ? 'proceed'
      : successCount >= 2
        ? 'investigate'
        : 'abort';

  const report = {
    source_name: 'phoenixchildrens',
    listing_page_url: 'https://careers.phoenixchildrens.com/Positions/Nursing-jobs',
    test_timestamp: timestamp,
    listing_page: {
      fetched: listingResult.success,
      job_count: listingResult.job_count,
    },
    sample_extractions: sampleExtractions,
    parser_confidence: {
      title_extraction: successCount === 5 ? 100 : (successCount / 5) * 100,
      location_extraction:
        sampleExtractions.filter((s) => s.location_city).length * 20,
      employment_type_extraction:
        sampleExtractions.filter((s) => s.employment_type).length * 20,
      apply_url_extraction:
        sampleExtractions.filter((s) => s.apply_url).length * 20,
      overall: avgConfidence,
    },
    recommendation,
    notes: [
      `Listing page: ${listingResult.job_count} jobs found`,
      `Samples: ${successCount} of ${sampleExtractions.length} extracted`,
      `Average confidence: ${avgConfidence.toFixed(0)}%`,
    ],
    warnings:
      successCount < 5
        ? [`${5 - successCount} samples failed to extract`]
        : [],
  };

  console.log('\n========== VERIFICATION REPORT ==========\n');
  console.log(JSON.stringify(report, null, 2));

  const exitCode =
    recommendation === 'proceed' ? 0 : recommendation === 'investigate' ? 1 : 2;

  console.log(`\nRecommendation: ${recommendation.toUpperCase()}`);
  console.log(`Exit code: ${exitCode}\n`);

  process.exit(exitCode);
}

runVerification().catch((error) => {
  console.error('Verification failed:', error);
  process.exit(2);
});
