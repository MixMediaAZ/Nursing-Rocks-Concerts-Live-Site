import { phoenixChildrens } from "./sources/phoenix-childrens";
import { ingestionDb, SourceJobData } from "../storage/ingestion-db";
import { deduplicator } from "./deduplicator";
import { normalizeJobData } from "./normalizer";
import { generateContentHash } from "./hash";

interface PipelineOptions {
  graceDays?: number;
  concurrencyLimit?: number;
  dryRun?: boolean;
}

interface PipelineResult {
  runId: number;
  status: "success" | "partial" | "failed";
  jobsFetched: number;
  jobsParsed: number;
  jobsInserted: number;
  jobsUpdated: number;
  jobsSkipped: number;
  jobsArchived: number;
  errorsCount: number;
  errors: string[];
  durationSeconds: number;
}

export class IngestionPipeline {
  private readonly SOURCE_NAME = "phoenixchildrens";
  private readonly SOURCE_TYPE = "scraped";
  private readonly DEFAULT_GRACE_DAYS = 21;
  private readonly DEFAULT_CONCURRENCY_LIMIT = 3;

  async runPhoenixChildrensIngestion(
    options: PipelineOptions = {}
  ): Promise<PipelineResult> {
    const startTime = Date.now();
    const graceDays = options.graceDays || this.DEFAULT_GRACE_DAYS;
    const concurrencyLimit =
      options.concurrencyLimit || this.DEFAULT_CONCURRENCY_LIMIT;
    const dryRun = options.dryRun || false;

    let runId: number;
    const errors: string[] = [];
    let jobsFetched = 0;
    let jobsParsed = 0;
    let jobsInserted = 0;
    let jobsUpdated = 0;
    let jobsSkipped = 0;
    let jobsArchived = 0;

    try {
      // Step 1: Create ingestion run record
      console.log("[Pipeline] Creating ingestion run...");
      runId = await ingestionDb.createIngestionRun(this.SOURCE_NAME);
      console.log(`[Pipeline] Run ID: ${runId}`);

      // Step 2: Fetch listing page
      console.log("[Pipeline] Fetching listing page...");
      const listingResult = await phoenixChildrens.fetchListingPage();

      if (!listingResult.success || listingResult.postingIds.length === 0) {
        const error =
          listingResult.error || "No posting IDs found in listing page";
        console.error(`[Pipeline] Listing fetch failed: ${error}`);
        errors.push(error);

        // Complete run as failed
        await ingestionDb.completeIngestionRun(runId, {
          source_name: this.SOURCE_NAME,
          source_type: this.SOURCE_TYPE,
          jobs_fetched: 0,
          jobs_parsed: 0,
          jobs_inserted: 0,
          jobs_updated: 0,
          jobs_skipped: 0,
          jobs_archived: 0,
          errors_count: errors.length,
          status: "failed",
          error_log: errors,
          started_at: new Date(startTime),
          completed_at: new Date(),
          duration_seconds: Math.floor((Date.now() - startTime) / 1000),
        });

        return {
          runId,
          status: "failed",
          jobsFetched: 0,
          jobsParsed: 0,
          jobsInserted: 0,
          jobsUpdated: 0,
          jobsSkipped: 0,
          jobsArchived: 0,
          errorsCount: errors.length,
          errors,
          durationSeconds: Math.floor((Date.now() - startTime) / 1000),
        };
      }

      jobsFetched = listingResult.postingIds.length;
      console.log(`[Pipeline] Found ${jobsFetched} job postings`);

      // Record source page fetch
      await ingestionDb.recordSourcePageFetch({
        source_name: this.SOURCE_NAME,
        listing_page_url: "https://careers.phoenixchildrens.com/Positions/Nursing-jobs",
        page_hash: listingResult.pageHash,
        job_count: listingResult.jobCount,
        fetched_at: new Date(),
      });

      // Step 3: Fetch detail pages with concurrency limit
      console.log(
        `[Pipeline] Fetching detail pages (concurrency: ${concurrencyLimit})...`
      );
      const seenPostingIds: string[] = [];
      const jobsToProcess: SourceJobData[] = [];

      for (let i = 0; i < listingResult.postingIds.length; i += concurrencyLimit) {
        const batch = listingResult.postingIds.slice(
          i,
          i + concurrencyLimit
        );
        const batchResults = await Promise.all(
          batch.map((id) => phoenixChildrens.fetchJobDetail(id))
        );

        for (const result of batchResults) {
          if (result.success && result.data) {
            try {
              // Normalize job data
              const normalized = normalizeJobData({
                title: result.data.title,
                description: result.data.description,
                location_raw: result.data.location_raw,
                employment_type: result.data.employment_type,
                source_job_id: result.data.source_job_id,
                source_url: result.data.source_url,
                requirements: result.data.requirements,
              });

              if (normalized) {
                jobsParsed++;

                // Compute content hash from stable fields (title + source_id + url, not descriptions)
                // This avoids false positives from slight description variations
                const contentHash = generateContentHash(
                  `${this.SOURCE_NAME}|${result.data.source_job_id}|${result.data.source_url}|${normalized.title}`
                );

                const sourceJobData: SourceJobData = {
                  source_name: this.SOURCE_NAME,
                  source_type: this.SOURCE_TYPE,
                  source_job_id: result.data.source_job_id,
                  source_url: result.data.source_url,
                  source_content_hash: contentHash,
                  title: normalized.title,
                  description: normalized.description,
                  job_type: normalized.employment_type || "Full-time",
                  location: normalized.location_raw || "Unknown",
                  location_raw: normalized.location_raw,
                  location_city: normalized.location_city,
                  location_state: normalized.location_state,
                  is_remote: normalized.is_remote,
                  application_url: `https://careers.phoenixchildrens.com/Positions/Posting/${result.data.source_job_id}#apply`,
                  requirements: result.data.requirements,
                  work_arrangement: normalized.work_arrangement || "On-site",
                  specialty: "Nursing",
                  experience_level: "Mid",
                  data_quality_score: normalized.data_quality_score || 75,
                  manual_review_required: normalized.manual_review_required,
                };

                jobsToProcess.push(sourceJobData);
                seenPostingIds.push(result.data.source_job_id);
              }
            } catch (err) {
              const message =
                err instanceof Error ? err.message : String(err);
              errors.push(
                `Failed to normalize job ${result.data.source_job_id}: ${message}`
              );
              console.error(
                `[Pipeline] Normalization error for job ${result.data.source_job_id}: ${message}`
              );
            }
          } else {
            const message = result.error || "Unknown error";
            errors.push(message);
            console.warn(`[Pipeline] Detail fetch failed: ${message}`);
          }
        }

        // Throttle between batches to avoid rate limiting
        if (i + concurrencyLimit < listingResult.postingIds.length) {
          await new Promise((resolve) => setTimeout(resolve, 300));
        }
      }

      console.log(`[Pipeline] Parsed ${jobsParsed} job details`);

      // Step 4: Deduplicate and insert/update
      console.log("[Pipeline] Deduplicating and upserting jobs...");
      for (const jobData of jobsToProcess) {
        try {
          // Resolve dedupe action
          const dedupeResult = await deduplicator.resolveDuplicate({
            source_name: jobData.source_name,
            source_job_id: jobData.source_job_id,
            source_url: jobData.source_url,
            source_content_hash: jobData.source_content_hash,
            title: jobData.title,
            location_raw: jobData.location_raw,
          });

          if (!dryRun) {
            if (dedupeResult.action === "insert") {
              await ingestionDb.insertJob(jobData, runId);
              jobsInserted++;
              console.log(
                `[Pipeline] Inserted job ${jobData.source_job_id}: ${jobData.title}`
              );
            } else if (dedupeResult.action === "update") {
              if (dedupeResult.jobId) {
                await ingestionDb.updateJob(
                  dedupeResult.jobId,
                  jobData,
                  runId
                );
                jobsUpdated++;
                console.log(
                  `[Pipeline] Updated job ${jobData.source_job_id}: ${jobData.title}`
                );
              }
            } else if (dedupeResult.action === "flag_duplicate") {
              jobsSkipped++;
              console.log(
                `[Pipeline] Flagged duplicate (job ${jobData.source_job_id}): ${dedupeResult.reason}`
              );
            } else {
              jobsSkipped++;
            }
          } else {
            // Dry run - just count
            if (dedupeResult.action === "insert") jobsInserted++;
            else if (dedupeResult.action === "update") jobsUpdated++;
            else jobsSkipped++;
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          errors.push(
            `Failed to process job ${jobData.source_job_id}: ${message}`
          );
          console.error(
            `[Pipeline] Job processing error for ${jobData.source_job_id}: ${message}`
          );
        }
      }

      // Step 5: Mark all seen jobs in this run
      if (!dryRun && seenPostingIds.length > 0) {
        await ingestionDb.markJobsSeen(this.SOURCE_NAME, seenPostingIds);
      }

      // Step 6: Archive stale jobs
      console.log(
        `[Pipeline] Archiving stale jobs (grace period: ${graceDays} days)...`
      );
      if (!dryRun) {
        jobsArchived = await ingestionDb.archiveStaleJobs(
          this.SOURCE_NAME,
          graceDays
        );
        console.log(`[Pipeline] Archived ${jobsArchived} stale jobs`);
      }

      // Step 7: Complete ingestion run
      const status =
        errors.length === 0
          ? "success"
          : jobsParsed > 0
            ? "partial"
            : "failed";

      if (!dryRun) {
        await ingestionDb.completeIngestionRun(runId, {
          source_name: this.SOURCE_NAME,
          source_type: this.SOURCE_TYPE,
          jobs_fetched: jobsFetched,
          jobs_parsed: jobsParsed,
          jobs_inserted: jobsInserted,
          jobs_updated: jobsUpdated,
          jobs_skipped: jobsSkipped,
          jobs_archived: jobsArchived,
          errors_count: errors.length,
          status,
          error_log: errors,
          started_at: new Date(startTime),
          completed_at: new Date(),
          duration_seconds: Math.floor((Date.now() - startTime) / 1000),
        });
      }

      console.log(`[Pipeline] Run completed with status: ${status}`);

      return {
        runId,
        status,
        jobsFetched,
        jobsParsed,
        jobsInserted,
        jobsUpdated,
        jobsSkipped,
        jobsArchived,
        errorsCount: errors.length,
        errors,
        durationSeconds: Math.floor((Date.now() - startTime) / 1000),
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[Pipeline] Fatal error: ${message}`);

      // Try to mark run as failed even on catastrophic error
      try {
        if (runId) {
          await ingestionDb.completeIngestionRun(runId, {
            source_name: this.SOURCE_NAME,
            source_type: this.SOURCE_TYPE,
            jobs_fetched: jobsFetched,
            jobs_parsed: jobsParsed,
            jobs_inserted: jobsInserted,
            jobs_updated: jobsUpdated,
            jobs_skipped: jobsSkipped,
            jobs_archived: jobsArchived,
            errors_count: errors.length + 1,
            status: "failed",
            error_log: [...errors, message],
            started_at: new Date(startTime),
            completed_at: new Date(),
            duration_seconds: Math.floor((Date.now() - startTime) / 1000),
          });
        }
      } catch (completeErr) {
        console.error("Failed to mark run as failed:", completeErr);
      }

      throw err;
    }
  }
}

export const ingestionPipeline = new IngestionPipeline();
