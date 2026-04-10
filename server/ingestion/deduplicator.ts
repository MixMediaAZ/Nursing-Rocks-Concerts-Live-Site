import { ingestionDb } from "../storage/ingestion-db";

export type DedupeAction = "insert" | "update" | "skip" | "flag_duplicate";

export interface DedupeResult {
  action: DedupeAction;
  jobId?: number; // Set if action is update or flag_duplicate
  reason: string;
  isDuplicate: boolean;
}

export class Deduplicator {
  /**
   * Resolve if a job should be inserted, updated, or skipped.
   * Uses hard dedupe first (source_name + source_job_id),
   * then soft dedupe (content_hash within same source).
   *
   * Hash is computed from stable fields to avoid false positives:
   * source_name + source_job_id + source_url + title
   * (NOT description or location, which vary)
   */
  async resolveDuplicate(normalizedJob: {
    source_name: string;
    source_job_id: string;
    source_url: string;
    source_content_hash: string;
    title: string;
    location_raw?: string;
  }): Promise<DedupeResult> {
    // HARD DEDUPE: Check if this exact source + ID combination exists
    const existingBySource = await ingestionDb.findExistingJobBySource(
      normalizedJob.source_name,
      normalizedJob.source_job_id
    );

    if (existingBySource) {
      // Job already exists with this source + ID
      // Action: update it (refresh the data)
      return {
        action: "update",
        jobId: existingBySource.id,
        reason: `Hard dedupe match: source=${normalizedJob.source_name}, source_job_id=${normalizedJob.source_job_id}`,
        isDuplicate: false, // It's an existing entry, not a duplicate
      };
    }

    // SOFT DEDUPE: Check if content_hash already exists within this source
    const existingByHash = await ingestionDb.findPossibleDuplicateByHash(
      normalizedJob.source_name,
      normalizedJob.source_content_hash
    );

    if (existingByHash) {
      // Same content hash found but different source_job_id
      // This is a duplicate listing reposted with a new ID (happens on career sites)
      // Action: flag for manual review (don't auto-skip or auto-merge)
      return {
        action: "flag_duplicate",
        jobId: existingByHash.id,
        reason: `Soft dedupe match: content_hash collision with job_id=${existingByHash.id}, different source_job_id. Possible repost of same position.`,
        isDuplicate: true,
      };
    }

    // No duplicate found
    // Action: insert new job
    return {
      action: "insert",
      reason: "No duplicate detected",
      isDuplicate: false,
    };
  }
}

export const deduplicator = new Deduplicator();
