/**
 * Types for job ingestion system
 * Phase 0/1: Schema and verifier support
 */

// Raw extracted job data from source
export interface RawJobData {
  source_name: string;
  source_job_id: string;
  source_url: string;
  source_type: 'ATS' | 'manual' | 'API' | 'scraped';

  title: string;
  description: string;
  responsibilities?: string;
  requirements?: string;
  benefits?: string;
  location_raw?: string;
  job_type?: string;
  work_arrangement?: string;
  specialty_raw?: string;
  experience_level?: string;
  education_required?: string;
  certification_required?: string[];
  shift_type?: string;
  salary_min?: number;
  salary_max?: number;
  salary_period?: string;
  application_url?: string;
  contact_email?: string;
  posted_date?: Date;
  expiry_date?: Date;
}

// Normalized job data after processing
export interface NormalizedJobData extends RawJobData {
  location_city?: string;
  location_state?: string;
  location_postal_code?: string;
  is_remote?: boolean;
  normalized_specialty_id?: number;
  normalized_role_level?: string;
  source_content_hash: string;
  data_quality_score: number;
  manual_review_required: boolean;
}

// Extraction result from parsing a detail page
export interface ExtractionResult {
  success: boolean;
  data?: RawJobData;
  error?: string;
  raw_html?: string; // For debugging
  fields_extracted?: number;
  fields_total?: number;
}

// Parsing result from listing page
export interface ListingParseResult {
  success: boolean;
  job_ids: string[];
  job_count: number;
  error?: string;
  page_hash?: string;
}

// Verification report output
export interface VerificationReport {
  source_name: string;
  listing_page_url: string;
  test_timestamp: string;

  listing_page: {
    fetched: boolean;
    status_code?: number;
    page_hash?: string;
    job_count: number;
    error?: string;
  };

  sample_extractions: Array<{
    posting_id: string;
    url: string;
    success: boolean;
    title?: string;
    location_raw?: string;
    location_city?: string;
    location_state?: string;
    employment_type?: string;
    apply_url?: string;
    fields_extracted?: number;
    fields_total?: number;
    confidence: number; // 0-100%
    error?: string;
  }>;

  parser_confidence: {
    title_extraction: number; // 0-100%
    location_extraction: number;
    employment_type_extraction: number;
    apply_url_extraction: number;
    overall: number;
  };

  recommendation: 'proceed' | 'investigate' | 'abort';
  notes: string[];
  warnings: string[];
}

// Ingestion run log (database record)
export interface IngestionRunLog {
  id?: number;
  source_name: string;
  started_at: Date;
  completed_at?: Date;
  status: 'pending' | 'success' | 'partial' | 'failed';
  jobs_fetched: number;
  jobs_parsed: number;
  jobs_inserted: number;
  jobs_updated: number;
  jobs_skipped: number;
  jobs_archived: number;
  errors_count: number;
  error_log?: string;
  duration_seconds?: number;
}

// Source page tracking (database record)
export interface SourcePageLog {
  id?: number;
  source_name: string;
  page_url: string;
  page_hash?: string;
  fetched_at: Date;
  job_count?: number;
  status: 'success' | 'no_change' | 'error';
}
