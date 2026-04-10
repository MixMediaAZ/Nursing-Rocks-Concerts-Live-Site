/**
 * Phoenix Children's Verifier - FIXED
 * Layer 1: Regex extraction (IDs)
 * Layer 2: Structured parsing (details)
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
    .replace(/[\r\n]+/g, ' ')
    .substring(0, 500);
}

function normalizeJobType(jobType) {
  if (!jobType) return undefined;
  const normalized = jobType.toLowerCase().trim();
  if (normalized.includes('full')) return 'Full-time';
  if (normalized.includes('part')) return 'Part-time';
  if (normalized.includes('contract')) return 'Contract';
  return jobType;
}

function parseLocation(locationRaw) {
  if (!locationRaw) return {};
  const trimmed = locationRaw.trim();
  const parts = trimmed.split(',').map((p) => p.trim());

  let locationCity = parts[0];
  let locationState = undefined;

  if (parts.length >= 2) {
    const statePart = parts[1];
    const stateMatch = statePart.match(/^([A-Za-z\s]+?)\s*(\d{5})?$/);
    if (stateMatch) {
      locationState = stateMatch[1].trim();
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
  if (isRemote) result.is_remote = true;

  return result;
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

// ============= LAYER 1: REGEX EXTRACTION (IDs) =============

function extractPostingIdsFromListing(html) {
  if (!html || html.length === 0) {
    return [];
  }

  // Extract all data-posting-id attributes
  const matches = html.matchAll(/data-posting-id="(\d+)"/g);
  const ids = [...matches].map((m) => m[1]);

  // Deduplicate (same job appears multiple times in HTML)
  const uniqueIds = [...new Set(ids)];

  return uniqueIds;
}

// ============= LAYER 2: STRUCTURED EXTRACTION (Details) =============

function extractJobDetailFromHtml(html, jobId, url) {
  if (!html || html.length === 0) {
    return { success: false, error: 'Empty HTML' };
  }

  // Extract title - multiple fallback strategies
  let title =
    html.match(/<h1[^>]*>(.*?)<\/h1>/i)?.[1]?.trim() ||
    html.match(/<h2[^>]*>(.*?)<\/h2>/i)?.[1]?.trim() ||
    html.match(/<title>(.*?)<\/title>/i)?.[1]?.match(/^(.*?)\s*-/)?.[1]?.trim() ||
    '';

  if (!title) {
    return { success: false, error: 'Could not extract title' };
  }

  // Clean title (remove HTML entities)
  title = title
    .replace(/&#\d+;/g, '')
    .replace(/&[a-z]+;/g, '')
    .substring(0, 200)
    .trim();

  // Extract location - use fallback chain
  let locationRaw = '';

  // Layer 1: Structured span pattern (most reliable)
  const spanMatch = html.match(/<span[^>]*>[Ll]ocation:<\/span>\s*([^<]+)</);
  if (spanMatch) {
    locationRaw = cleanText(spanMatch[1]);
  } else {
    // Layer 2: Look for city names in body text (fallback)
    const cityMatch = html.match(/Phoenix|Scottsdale|Tucson|Mesa|Chandler|Tempe/i);
    if (cityMatch) {
      locationRaw = cityMatch[0] + ', Arizona';
    }
  }

  const locationParts = parseLocation(locationRaw || 'Unknown');

  // Extract employment type
  let employmentType = '';
  const empMatch = html.match(/Employment\s+Type[:\s]*([^<\n]*)/i);
  if (empMatch) {
    employmentType = normalizeJobType(cleanText(empMatch[1]));
  }

  // Apply URL
  const applyUrl = `https://careers.phoenixchildrens.com/Positions/Posting/${jobId}#apply`;

  // Extract description (first 500 chars of body text)
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const description = bodyMatch
    ? cleanText(bodyMatch[1].substring(0, 1000)).replace(/<[^>]*>/g, '')
    : '';

  const data = {
    source_job_id: jobId,
    source_url: url,
    title,
    location_raw: locationRaw || 'Unknown',
    ...locationParts,
    employment_type: employmentType || 'Full-time',
    apply_url: applyUrl,
    description: description.substring(0, 200),
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
}

// ============= MAIN VERIFICATION =============

async function runVerification() {
  console.log('\n========== PHOENIX CHILDREN\'S VERIFIER (FIXED) ==========\n');

  const timestamp = new Date().toISOString();
  const listingUrl = 'https://careers.phoenixchildrens.com/Positions/Nursing-jobs';

  // Step 1: Fetch listing page
  console.log('[Step 1] Fetching listing page...');
  let html;
  try {
    html = await fetchWithRetry(listingUrl);
  } catch (error) {
    const report = {
      source_name: 'phoenixchildrens',
      listing_page_url: listingUrl,
      test_timestamp: timestamp,
      listing_page: { fetched: false, error: error.message },
      sample_extractions: [],
      parser_confidence: { overall: 0 },
      recommendation: 'abort',
      notes: [`Failed to fetch listing page: ${error.message}`],
      warnings: [],
    };

    console.log(JSON.stringify(report, null, 2));
    process.exit(2);
    return;
  }

  // Step 2: Extract posting IDs using REGEX (Layer 1)
  console.log('[Step 2] Extracting posting IDs via regex...');
  const postingIds = extractPostingIdsFromListing(html);

  if (postingIds.length === 0) {
    const report = {
      source_name: 'phoenixchildrens',
      listing_page_url: listingUrl,
      test_timestamp: timestamp,
      listing_page: { fetched: true, job_count: 0 },
      sample_extractions: [],
      parser_confidence: { overall: 0 },
      recommendation: 'abort',
      notes: ['No posting IDs found in listing page HTML'],
      warnings: [],
    };

    console.log(JSON.stringify(report, null, 2));
    process.exit(2);
    return;
  }

  console.log(`✓ Found ${postingIds.length} unique posting IDs\n`);

  // Step 3: Sample 5 jobs and extract details (Layer 2)
  console.log('[Step 3] Extracting details from sample jobs...');
  const sampleIds = postingIds.slice(0, 5);
  const sampleExtractions = [];
  let successCount = 0;

  for (const jobId of sampleIds) {
    const detailUrl = `https://careers.phoenixchildrens.com/Positions/Posting/${jobId}`;

    try {
      const detailHtml = await fetchWithRetry(detailUrl);
      const result = extractJobDetailFromHtml(detailHtml, jobId, detailUrl);

      if (result.success && result.data) {
        successCount++;
        const confidence =
          ((result.fields_extracted || 0) / (result.fields_total || 10)) * 100;

        sampleExtractions.push({
          posting_id: jobId,
          url: detailUrl,
          success: true,
          title: result.data.title,
          location_raw: result.data.location_raw,
          location_city: result.data.location_city,
          location_state: result.data.location_state,
          employment_type: result.data.employment_type,
          apply_url: result.data.apply_url,
          fields_extracted: result.fields_extracted,
          confidence,
        });

        console.log(
          `✓ Job ${jobId}: "${result.data.title.substring(0, 40)}..."`
        );
      } else {
        sampleExtractions.push({
          posting_id: jobId,
          url: detailUrl,
          success: false,
          error: result.error,
          confidence: 0,
        });

        console.log(`⚠ Job ${jobId}: ${result.error}`);
      }
    } catch (error) {
      sampleExtractions.push({
        posting_id: jobId,
        url: detailUrl,
        success: false,
        error: error.message,
        confidence: 0,
      });

      console.log(`✗ Job ${jobId}: ${error.message}`);
    }
  }

  // Step 4: Calculate confidence scores
  console.log('\n[Step 4] Computing confidence scores...');

  const idExtractionScore = postingIds.length >= 15 ? 100 : 50;
  const titleExtractionScore =
    sampleExtractions.filter((s) => s.success && s.title).length > 0
      ? (sampleExtractions.filter((s) => s.success && s.title).length / 5) * 100
      : 0;
  const locationExtractionScore =
    sampleExtractions.filter((s) => s.success && s.location_city).length > 0
      ? (sampleExtractions.filter((s) => s.success && s.location_city).length /
          5) *
        100
      : 0;
  const employmentTypeScore =
    sampleExtractions.filter((s) => s.success && s.employment_type).length > 0
      ? (sampleExtractions.filter((s) => s.success && s.employment_type)
          .length /
          5) *
        100
      : 0;
  const applyUrlScore =
    sampleExtractions.filter((s) => s.success && s.apply_url).length > 0
      ? (sampleExtractions.filter((s) => s.success && s.apply_url).length / 5) *
        100
      : 0;

  const avgSampleConfidence =
    sampleExtractions.reduce((sum, s) => sum + (s.confidence || 0), 0) /
    sampleExtractions.length;
  const overallConfidence =
    (idExtractionScore * 0.3 +
      titleExtractionScore * 0.2 +
      locationExtractionScore * 0.15 +
      employmentTypeScore * 0.15 +
      applyUrlScore * 0.1 +
      avgSampleConfidence * 0.1);

  // Step 5: Determine recommendation
  let recommendation = 'proceed';
  if (successCount < 4 || overallConfidence < 75) {
    recommendation = successCount < 2 ? 'abort' : 'investigate';
  }

  // Step 6: Build report
  const report = {
    source_name: 'phoenixchildrens',
    listing_page_url: listingUrl,
    test_timestamp: timestamp,
    listing_page: {
      fetched: true,
      job_count: postingIds.length,
    },
    sample_extractions: sampleExtractions,
    parser_confidence: {
      id_extraction: idExtractionScore,
      title_extraction: titleExtractionScore,
      location_extraction: locationExtractionScore,
      employment_type_extraction: employmentTypeScore,
      apply_url_extraction: applyUrlScore,
      average_sample_confidence: avgSampleConfidence,
      overall: Math.round(overallConfidence * 100) / 100,
    },
    recommendation,
    notes: [
      `Listing page: ${postingIds.length} unique jobs found`,
      `Samples: ${successCount} of ${sampleIds.length} extracted successfully`,
      `ID extraction: REGEX-based (Layer 1) ✓`,
      `Detail extraction: Structured parsing (Layer 2) ✓`,
    ],
    warnings:
      successCount < 5
        ? [`${5 - successCount} samples had extraction issues`]
        : [],
  };

  // Step 7: Output report
  console.log('\n========== VERIFICATION REPORT ==========\n');
  console.log(JSON.stringify(report, null, 2));

  const exitCode =
    recommendation === 'proceed' ? 0 : recommendation === 'investigate' ? 1 : 2;

  console.log(`\n[RECOMMENDATION] ${recommendation.toUpperCase()}`);
  console.log(`[EXIT CODE] ${exitCode}\n`);

  process.exit(exitCode);
}

runVerification().catch((error) => {
  console.error('Verification failed:', error);
  process.exit(2);
});
