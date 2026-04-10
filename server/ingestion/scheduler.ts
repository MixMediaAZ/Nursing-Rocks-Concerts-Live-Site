import { ingestionPipeline } from "./pipeline";

interface SchedulerOptions {
  enabled?: boolean;
  cronExpression?: string;
  graceDays?: number;
}

export class IngestionScheduler {
  private task: any = null;
  private isRunning = false;

  async startIngestionScheduler(options: SchedulerOptions = {}): Promise<void> {
    // Check if scheduler is enabled via env var
    const enabled = options.enabled !== false &&
      (process.env.JOBS_INGESTION_ENABLED === "true" ||
        process.env.JOBS_INGESTION_ENABLED === "1");

    if (!enabled) {
      console.log("[Scheduler] Jobs ingestion disabled (JOBS_INGESTION_ENABLED not set)");
      return;
    }

    // Dynamically import node-cron (not needed in Vercel serverless)
    const cron = await import("node-cron");

    // Get cron expression from options or env
    const cronExpression =
      options.cronExpression || process.env.JOBS_INGESTION_CRON || "0 2 * * *";

    // Get grace days from options or env
    const graceDays =
      options.graceDays ||
      parseInt(process.env.INGESTION_GRACE_PERIOD_DAYS || "21", 10);

    try {
      // Validate cron expression
      if (!cron.validate(cronExpression)) {
        throw new Error(`Invalid cron expression: ${cronExpression}`);
      }

      // Schedule the task
      this.task = cron.schedule(cronExpression, async () => {
        if (this.isRunning) {
          console.warn("[Scheduler] Ingestion already running, skipping this execution");
          return;
        }

        this.isRunning = true;
        try {
          console.log("[Scheduler] Starting scheduled Phoenix Children's ingestion...");
          const result = await ingestionPipeline.runPhoenixChildrensIngestion({
            graceDays,
          });

          console.log("[Scheduler] Ingestion completed:");
          console.log(`  - Status: ${result.status}`);
          console.log(`  - Jobs fetched: ${result.jobsFetched}`);
          console.log(`  - Jobs parsed: ${result.jobsParsed}`);
          console.log(`  - Jobs inserted: ${result.jobsInserted}`);
          console.log(`  - Jobs updated: ${result.jobsUpdated}`);
          console.log(`  - Jobs skipped: ${result.jobsSkipped}`);
          console.log(`  - Jobs archived: ${result.jobsArchived}`);
          console.log(`  - Duration: ${result.durationSeconds}s`);

          if (result.errors.length > 0) {
            console.warn(`  - Errors: ${result.errors.length}`);
            result.errors.slice(0, 5).forEach((err) => console.warn(`    - ${err}`));
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          console.error(`[Scheduler] Ingestion failed: ${message}`);
        } finally {
          this.isRunning = false;
        }
      });

      console.log(`[Scheduler] Jobs ingestion scheduled at: ${cronExpression}`);
      console.log(`[Scheduler] Grace period for stale jobs: ${graceDays} days`);
      console.log("[Scheduler] Run /api/admin/jobs/scheduler/start to begin immediately");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[Scheduler] Failed to start scheduler: ${message}`);
      throw error;
    }
  }

  stopIngestionScheduler(): void {
    if (this.task) {
      this.task.stop();
      this.task = null;
      console.log("[Scheduler] Jobs ingestion scheduler stopped");
    }
  }

  isSchedulerRunning(): boolean {
    return this.task !== null;
  }

  async triggerManualRun(graceDays?: number): Promise<void> {
    if (this.isRunning) {
      throw new Error("Ingestion already running");
    }

    this.isRunning = true;
    try {
      await ingestionPipeline.runPhoenixChildrensIngestion({ graceDays });
    } finally {
      this.isRunning = false;
    }
  }

  isCurrentlyRunning(): boolean {
    return this.isRunning;
  }
}

export const ingestionScheduler = new IngestionScheduler();
