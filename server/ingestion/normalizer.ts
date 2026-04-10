/**
 * Field normalization utilities for job ingestion
 * Standardizes extracted fields for storage and search
 */

import { NormalizedJobData, RawJobData } from './types';
import { generateContentHash } from './hash';

/**
 * Parse location string into city, state, postal code
 * Handles common formats: "City, State", "City, State 12345", etc.
 */
export function parseLocation(location_raw: string): {
  location_city?: string;
  location_state?: string;
  location_postal_code?: string;
} {
  if (!location_raw) {
    return {};
  }

  const trimmed = location_raw.trim();

  // Pattern: "City, State" or "City, State ZIPCODE"
  const parts = trimmed.split(',').map(p => p.trim());

  if (parts.length === 0) {
    return { location_city: trimmed };
  }

  let location_city = parts[0];
  let location_state: string | undefined;
  let location_postal_code: string | undefined;

  if (parts.length >= 2) {
    const statePart = parts[1];
    // Try to extract state and zip: "Arizona 85001" or "AZ 85001"
    const stateMatch = statePart.match(/^([A-Za-z\s]+?)\s*(\d{5})?$/);
    if (stateMatch) {
      location_state = stateMatch[1].trim();
      location_postal_code = stateMatch[2];
    } else {
      location_state = statePart;
    }
  }

  // Detect remote/virtual positions
  const isRemote =
    location_raw.toLowerCase().includes('remote') ||
    location_raw.toLowerCase().includes('virtual') ||
    location_raw.toLowerCase().includes('work from home') ||
    location_raw.toLowerCase().includes('wfh');

  const result: any = {};
  if (location_city) result.location_city = location_city;
  if (location_state) result.location_state = location_state;
  if (location_postal_code) result.location_postal_code = location_postal_code;
  if (isRemote) result.is_remote = true;

  return result;
}

/**
 * Normalize job type to standard categories
 */
export function normalizeJobType(job_type?: string): string | undefined {
  if (!job_type) return undefined;

  const normalized = job_type.toLowerCase().trim();

  if (normalized.includes('full')) return 'Full-time';
  if (normalized.includes('part')) return 'Part-time';
  if (normalized.includes('contract')) return 'Contract';
  if (normalized.includes('temporary') || normalized.includes('temp'))
    return 'Contract';
  if (normalized.includes('per diem')) return 'Per Diem';
  if (normalized.includes('casual')) return 'Per Diem';

  return job_type; // Return original if no match
}

/**
 * Normalize shift type
 */
export function normalizeShift(shift_type?: string): string | undefined {
  if (!shift_type) return undefined;

  const normalized = shift_type.toLowerCase().trim();

  if (normalized.includes('day')) return 'Day Shift';
  if (normalized.includes('night')) return 'Night Shift';
  if (normalized.includes('evening')) return 'Evening Shift';
  if (normalized.includes('rotating') || normalized.includes('rotation'))
    return 'Rotating Shift';
  if (normalized.includes('flex')) return 'Flexible';
  if (normalized.includes('on-call') || normalized.includes('oncall'))
    return 'On-Call';

  return shift_type; // Return original if no match
}

/**
 * Normalize work arrangement
 */
export function normalizeWorkArrangement(
  work_arrangement?: string
): string | undefined {
  if (!work_arrangement) return undefined;

  const normalized = work_arrangement.toLowerCase().trim();

  if (normalized.includes('on-site') || normalized.includes('onsite'))
    return 'On-site';
  if (normalized.includes('remote')) return 'Remote';
  if (normalized.includes('hybrid')) return 'Hybrid';

  return work_arrangement; // Return original if no match
}

/**
 * Parse requirements to extract years of experience
 * Returns minimum years required, if detectable
 */
export function extractYearsExperience(
  requirements?: string
): number | undefined {
  if (!requirements) return undefined;

  // Look for patterns like "2+ years", "3 years experience", etc.
  const match = requirements.match(/(\d+)\s*(?:\+)?\s*(?:years?|yrs?)\s*(?:of\s+)?experience/i);

  if (match) {
    return parseInt(match[1], 10);
  }

  return undefined;
}

/**
 * Extract certifications from requirements
 * Looks for common patterns like "RN", "BSN", "ACLS", etc.
 */
export function extractCertifications(requirements?: string): string[] {
  if (!requirements) return [];

  const certs = new Set<string>();

  // Common nursing certifications
  const patterns = [
    /\bRN\b/gi, // Registered Nurse
    /\bBSN\b/gi, // Bachelor of Science in Nursing
    /\bMSN\b/gi, // Master of Science in Nursing
    /\bACLS\b/gi, // Advanced Cardiac Life Support
    /\bBLS\b/gi, // Basic Life Support
    /\bPALS\b/gi, // Pediatric Advanced Life Support
    /\bNICU\b/gi,
    /\bPICU\b/gi,
    /\bAMLS\b/gi, // Advanced Medical Life Support
    /\bTNCC\b/gi, // Trauma Nursing Core Course
    /\bCRN\b/gi, // Certified Registered Nurse
    /\bCertified\s+[\w\s]+\s+Nurse/gi,
  ];

  patterns.forEach(pattern => {
    const matches = requirements.match(pattern);
    if (matches) {
      matches.forEach(cert => certs.add(cert.toUpperCase()));
    }
  });

  return Array.from(certs);
}

/**
 * Normalize a complete raw job data object
 */
export function normalizeJobData(rawData: RawJobData): NormalizedJobData {
  const normalized: NormalizedJobData = {
    ...rawData,

    // Normalize location
    ...(rawData.location_raw ? parseLocation(rawData.location_raw) : {}),

    // Normalize fields
    job_type: normalizeJobType(rawData.job_type),
    shift_type: normalizeShift(rawData.shift_type),
    work_arrangement: normalizeWorkArrangement(rawData.work_arrangement),

    // Extract certifications if not provided
    certification_required:
      rawData.certification_required &&
      rawData.certification_required.length > 0
        ? rawData.certification_required
        : extractCertifications(rawData.requirements),

    // Generate content hash for deduplication
    source_content_hash: generateContentHash(rawData.description || ''),

    // Calculate data quality score
    data_quality_score: calculateDataQualityScore(rawData),

    // Flag if manual review needed
    manual_review_required: shouldRequireManualReview(rawData),
  };

  return normalized;
}

/**
 * Calculate data quality score (0-100)
 * Based on percentage of important fields filled
 */
function calculateDataQualityScore(data: RawJobData): number {
  const requiredFields = [
    'title',
    'description',
    'location_raw',
    'job_type',
    'requirements',
  ];

  const filledRequired = requiredFields.filter(
    field => (data as any)[field] && (data as any)[field].toString().trim()
  ).length;

  const optionalFields = [
    'responsibilities',
    'benefits',
    'salary_min',
    'salary_max',
    'certification_required',
  ];

  const filledOptional = optionalFields.filter(
    field => (data as any)[field] && (data as any)[field].toString().trim()
  ).length;

  // Weight: 70% required fields, 30% optional fields
  const requiredScore = (filledRequired / requiredFields.length) * 70;
  const optionalScore = (filledOptional / optionalFields.length) * 30;

  return Math.round(requiredScore + optionalScore);
}

/**
 * Determine if job should be flagged for manual review
 */
function shouldRequireManualReview(data: RawJobData): boolean {
  const score = calculateDataQualityScore(data);

  // Flag if quality is low
  if (score < 70) return true;

  // Flag if critical fields are missing
  if (!data.title || !data.description || !data.location_raw) return true;

  // Flag if location cannot be parsed
  const locationParts = parseLocation(data.location_raw || '');
  if (!locationParts.location_city && !locationParts.is_remote) return true;

  return false;
}
