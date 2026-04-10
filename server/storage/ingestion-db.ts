import { eq, and, or, desc, isNull, ne, gte, sql } from "drizzle-orm";
import { db, pool } from "../db";
import {
  jobListings,
  jobIngestionRuns,
  jobSourcePages,
  jobSpecialties,
  jobTags,
  jobTagMap,
  InsertJobListing,
  JobListing,
} from "@shared/schema";

export interface IngestionRunPayload {
  source_name: string;
  source_type: string;
  jobs_fetched: number;
  jobs_parsed: number;
  jobs_inserted: number;
  jobs_updated: number;
  jobs_skipped: number;
  jobs_archived: number;
  errors_count: number;
  status: "success" | "partial" | "failed";
  error_log: string[];
  page_hash?: string;
  job_count?: number;
  started_at: Date;
  completed_at: Date;
  duration_seconds: number;
}

export interface SourcePagePayload {
  source_name: string;
  listing_page_url: string;
  page_hash: string;
  job_count: number;
  fetched_at: Date;
}

export interface SourceJobData {
  source_name: string;
  source_job_id: string;
  source_url: string;
  source_type: string;
  source_content_hash: string;
  title: string;
  description: string;
  employer_id?: number;
  job_type: string;
  location: string;
  location_raw?: string;
  location_city?: string;
  location_state?: string;
  location_postal_code?: string;
  is_remote?: boolean;
  application_url: string;
  requirements?: string;
  benefits?: string;
  specialty?: string;
  experience_level?: string;
  work_arrangement?: string;
  shift_type?: string;
  data_quality_score?: number;
  manual_review_required?: boolean;
}

export class IngestionDatabase {
  async createIngestionRun(sourceName: string): Promise<number> {
    const [run] = await db
      .insert(jobIngestionRuns)
      .values({
        source_name: sourceName,
        status: "in_progress",
        started_at: new Date(),
      })
      .returning();

    if (!run || !run.id) {
      throw new Error("Failed to create ingestion run");
    }

    return run.id;
  }

  async completeIngestionRun(
    runId: number,
    payload: IngestionRunPayload
  ): Promise<void> {
    await db
      .update(jobIngestionRuns)
      .set({
        status: payload.status,
        jobs_fetched: payload.jobs_fetched,
        jobs_parsed: payload.jobs_parsed,
        jobs_inserted: payload.jobs_inserted,
        jobs_updated: payload.jobs_updated,
        jobs_skipped: payload.jobs_skipped,
        jobs_archived: payload.jobs_archived,
        errors_count: payload.errors_count,
        error_log: payload.error_log,
        completed_at: payload.completed_at,
        duration_seconds: payload.duration_seconds,
      })
      .where(eq(jobIngestionRuns.id, runId));
  }

  async recordSourcePageFetch(payload: SourcePagePayload): Promise<void> {
    // Upsert - update if exists, insert if not
    const existing = await db
      .select()
      .from(jobSourcePages)
      .where(
        and(
          eq(jobSourcePages.source_name, payload.source_name),
          eq(jobSourcePages.page_url, payload.listing_page_url)
        )
      );

    if (existing.length > 0) {
      await db
        .update(jobSourcePages)
        .set({
          page_hash: payload.page_hash,
          job_count: payload.job_count,
          fetched_at: payload.fetched_at,
        })
        .where(
          and(
            eq(jobSourcePages.source_name, payload.source_name),
            eq(jobSourcePages.page_url, payload.listing_page_url)
          )
        );
    } else {
      await db.insert(jobSourcePages).values({
        source_name: payload.source_name,
        page_url: payload.listing_page_url,
        page_hash: payload.page_hash,
        job_count: payload.job_count,
        fetched_at: payload.fetched_at,
      });
    }
  }

  async findExistingJobBySource(
    sourceName: string,
    sourceJobId: string
  ): Promise<JobListing | null> {
    const [job] = await db
      .select()
      .from(jobListings)
      .where(
        and(
          eq(jobListings.source_name, sourceName),
          eq(jobListings.source_job_id, sourceJobId)
        )
      );

    return job || null;
  }

  async findPossibleDuplicateByHash(
    sourceName: string,
    contentHash: string
  ): Promise<JobListing | null> {
    const [job] = await db
      .select()
      .from(jobListings)
      .where(
        and(
          eq(jobListings.source_name, sourceName),
          eq(jobListings.source_content_hash, contentHash),
          eq(jobListings.is_active, true)
        )
      );

    return job || null;
  }

  async insertJob(
    data: SourceJobData,
    ingestionRunId: number
  ): Promise<JobListing> {
    const now = new Date();

    const insertData: InsertJobListing = {
      title: data.title,
      description: data.description,
      employer_id: data.employer_id || 1, // Default to ID 1 if not provided
      job_type: data.job_type,
      location: data.location,
      location_raw: data.location_raw,
      location_city: data.location_city,
      location_state: data.location_state,
      location_postal_code: data.location_postal_code,
      is_remote: data.is_remote,
      specialty: data.specialty || "Nursing",
      work_arrangement: data.work_arrangement || "On-site",
      experience_level: data.experience_level || "Mid",
      application_url: data.application_url,
      requirements: data.requirements,
      benefits: data.benefits,
      is_active: true,
      is_approved: false,
      posted_date: now,
      source_name: data.source_name,
      source_job_id: data.source_job_id,
      source_url: data.source_url,
      source_type: data.source_type,
      source_content_hash: data.source_content_hash,
      first_seen_at: now,
      last_seen_at: now,
      last_synced_at: now,
      sync_status: "active",
      data_quality_score: data.data_quality_score || 75,
      manual_review_required: data.manual_review_required || false,
    };

    const [job] = await db
      .insert(jobListings)
      .values(insertData)
      .returning();

    if (!job) {
      throw new Error("Failed to insert job");
    }

    return job;
  }

  async updateJob(
    jobId: number,
    data: Partial<SourceJobData>,
    ingestionRunId: number
  ): Promise<void> {
    const now = new Date();

    const updateData: Record<string, any> = {
      last_seen_at: now,
      last_synced_at: now,
    };

    if (data.title) updateData.title = data.title;
    if (data.description) updateData.description = data.description;
    if (data.location) updateData.location = data.location;
    if (data.location_raw) updateData.location_raw = data.location_raw;
    if (data.location_city) updateData.location_city = data.location_city;
    if (data.location_state) updateData.location_state = data.location_state;
    if (data.job_type) updateData.job_type = data.job_type;
    if (data.application_url)
      updateData.application_url = data.application_url;
    if (data.requirements) updateData.requirements = data.requirements;
    if (data.benefits) updateData.benefits = data.benefits;
    if (data.data_quality_score !== undefined)
      updateData.data_quality_score = data.data_quality_score;

    await db.update(jobListings).set(updateData).where(eq(jobListings.id, jobId));
  }

  async markJobsSeen(sourceName: string, sourceJobIds: string[]): Promise<void> {
    const now = new Date();

    // Update all jobs from this source that were in this batch
    await db
      .update(jobListings)
      .set({
        last_seen_at: now,
        sync_status: "active",
      })
      .where(
        and(
          eq(jobListings.source_name, sourceName),
          eq(jobListings.is_active, true),
          sql`${jobListings.source_job_id} = ANY(${sourceJobIds})`
        )
      );
  }

  async archiveStaleJobs(
    sourceName: string,
    graceDays: number = 21
  ): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - graceDays);

    // Mark as inactive (archive) all active jobs from this source not seen since grace period
    // Only archive jobs that have a valid last_seen_at timestamp
    const result = await db
      .update(jobListings)
      .set({
        is_active: false,
        sync_status: "archived",
      })
      .where(
        and(
          eq(jobListings.source_name, sourceName),
          eq(jobListings.is_active, true),
          sql`${jobListings.last_seen_at} IS NOT NULL`,
          gte(cutoffDate, jobListings.last_seen_at)
        )
      )
      .returning();

    return result.length;
  }

  async getIngestionRun(runId: number): Promise<any> {
    const [run] = await db
      .select()
      .from(jobIngestionRuns)
      .where(eq(jobIngestionRuns.id, runId));

    return run || null;
  }

  async getRecentIngestionRuns(
    sourceName: string,
    limit: number = 20
  ): Promise<any[]> {
    return await db
      .select()
      .from(jobIngestionRuns)
      .where(eq(jobIngestionRuns.source_name, sourceName))
      .orderBy(desc(jobIngestionRuns.created_at))
      .limit(limit);
  }
}

export const ingestionDb = new IngestionDatabase();
