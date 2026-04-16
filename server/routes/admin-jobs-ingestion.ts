import type { Express, Request, Response } from "express";
import { ingestionPipeline } from "../ingestion/pipeline";
import { ingestionDb } from "../storage/ingestion-db";
import { ingestionScheduler } from "../ingestion/scheduler";

/**
 * Register admin jobs ingestion routes.
 * Requires admin authentication via requireAdminToken middleware.
 */
export function registerAdminJobsIngestionRoutes(
  app: Express,
  requireAdminToken: (req: Request, res: Response, next: any) => void
): void {
  /**
   * POST /api/admin/jobs/sync
   * Trigger a manual ingestion sync for a specific source
   */
  app.post(
    "/api/admin/jobs/sync",
    requireAdminToken,
    async (req: Request, res: Response) => {
      try {
        const { source } = req.body;

        if (!source) {
          return res.status(400).json({ error: "source is required" });
        }

        if (source !== "phoenixchildrens") {
          return res
            .status(400)
            .json({ error: "Invalid source. Only 'phoenixchildrens' is supported." });
        }

        if (ingestionScheduler.isCurrentlyRunning()) {
          return res
            .status(409)
            .json({ error: "Ingestion is already running. Please try again later." });
        }

        // Trigger ingestion asynchronously
        const runPromise = ingestionPipeline.runPhoenixChildrensIngestion();

        // Return immediately with run initiation response
        res.json({
          success: true,
          message: "Ingestion sync triggered",
          source,
          note: "Check /api/admin/jobs/sync/:runId for status updates",
        });

        // Continue running in background
        runPromise.catch((error) => {
          console.error("[Admin API] Ingestion failed:", error);
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error("[Admin API] Sync endpoint error:", message);
        return res.status(500).json({
          error: "Failed to trigger sync",
          message,
        });
      }
    }
  );

  /**
   * GET /api/admin/jobs/sync/:runId
   * Get the status and details of a specific ingestion run
   */
  app.get(
    "/api/admin/jobs/sync/:runId",
    requireAdminToken,
    async (req: Request, res: Response) => {
      try {
        const runId = parseInt(req.params.runId, 10);

        if (isNaN(runId)) {
          return res.status(400).json({ error: "Invalid runId" });
        }

        const run = await ingestionDb.getIngestionRun(runId);

        if (!run) {
          return res.status(404).json({ error: "Run not found" });
        }

        return res.json({
          success: true,
          run: {
            id: run.id,
            source_name: run.source_name,
            status: run.status,
            started_at: run.started_at,
            completed_at: run.completed_at,
            duration_seconds: run.duration_seconds,
            jobs_fetched: run.jobs_fetched,
            jobs_parsed: run.jobs_parsed,
            jobs_inserted: run.jobs_inserted,
            jobs_updated: run.jobs_updated,
            jobs_skipped: run.jobs_skipped,
            jobs_archived: run.jobs_archived,
            errors_count: run.errors_count,
            error_log: run.error_log || [],
          },
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error("[Admin API] Get run endpoint error:", message);
        return res.status(500).json({
          error: "Failed to fetch run details",
          message,
        });
      }
    }
  );

  /**
   * GET /api/admin/jobs/syncs
   * Get recent ingestion runs with optional filtering
   */
  app.get(
    "/api/admin/jobs/syncs",
    requireAdminToken,
    async (req: Request, res: Response) => {
      try {
        const { source = "phoenixchildrens", limit = "20" } = req.query;
        const parsedLimit = Math.min(parseInt(String(limit), 10) || 20, 100);

        if (source !== "phoenixchildrens") {
          return res
            .status(400)
            .json({ error: "Only 'phoenixchildrens' source is supported" });
        }

        const runs = await ingestionDb.getRecentIngestionRuns(
          String(source),
          parsedLimit
        );

        return res.json({
          success: true,
          source,
          count: runs.length,
          runs: runs.map((run) => ({
            id: run.id,
            source_name: run.source_name,
            status: run.status,
            started_at: run.started_at,
            completed_at: run.completed_at,
            duration_seconds: run.duration_seconds,
            jobs_fetched: run.jobs_fetched,
            jobs_parsed: run.jobs_parsed,
            jobs_inserted: run.jobs_inserted,
            jobs_updated: run.jobs_updated,
            jobs_skipped: run.jobs_skipped,
            jobs_archived: run.jobs_archived,
            errors_count: run.errors_count,
          })),
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error("[Admin API] List runs endpoint error:", message);
        return res.status(500).json({
          error: "Failed to fetch runs",
          message,
        });
      }
    }
  );

  /**
   * POST /api/admin/jobs/scheduler/start
   * Start the ingestion scheduler
   */
  app.post(
    "/api/admin/jobs/scheduler/start",
    requireAdminToken,
    async (req: Request, res: Response) => {
      try {
        const { ingestionScheduler } = await import("../ingestion/scheduler");

        if (ingestionScheduler.isSchedulerRunning()) {
          return res.json({
            success: true,
            message: "Scheduler is already running",
          });
        }

        await ingestionScheduler.startIngestionScheduler();

        return res.json({
          success: true,
          message: "Ingestion scheduler started",
          cron: process.env.JOBS_INGESTION_CRON || "0 2 * * *",
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error("[Admin API] Start scheduler error:", message);
        return res.status(500).json({
          error: "Failed to start scheduler",
          message,
        });
      }
    }
  );

  /**
   * POST /api/admin/jobs/scheduler/stop
   * Stop the ingestion scheduler
   */
  app.post(
    "/api/admin/jobs/scheduler/stop",
    requireAdminToken,
    async (req: Request, res: Response) => {
      try {
        const { ingestionScheduler } = await import("../ingestion/scheduler");
        ingestionScheduler.stopIngestionScheduler();

        return res.json({
          success: true,
          message: "Ingestion scheduler stopped",
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error("[Admin API] Stop scheduler error:", message);
        return res.status(500).json({
          error: "Failed to stop scheduler",
          message,
        });
      }
    }
  );

  /**
   * GET /api/admin/jobs/scheduler/status
   * Get current scheduler status
   */
  app.get(
    "/api/admin/jobs/scheduler/status",
    requireAdminToken,
    async (req: Request, res: Response) => {
      try {
        const { ingestionScheduler } = await import("../ingestion/scheduler");
        return res.json({
          success: true,
          scheduler: {
            running: ingestionScheduler.isSchedulerRunning(),
            currentlyProcessing: ingestionScheduler.isCurrentlyRunning(),
            cron: process.env.JOBS_INGESTION_CRON || "0 2 * * *",
            enabled: process.env.JOBS_INGESTION_ENABLED === "true",
            graceDays: parseInt(
              process.env.INGESTION_GRACE_PERIOD_DAYS || "21",
              10
            ),
          },
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error("[Admin API] Scheduler status error:", message);
        return res.status(500).json({
          error: "Failed to get scheduler status",
          message,
        });
      }
    }
  );

  /**
   * GET /api/admin/jobs/ingestion-summary
   * Get a summary of the latest ingestion run and scheduler status
   */
  app.get(
    "/api/admin/jobs/ingestion-summary",
    requireAdminToken,
    async (req: Request, res: Response) => {
      try {
        const { ingestionScheduler } = await import("../ingestion/scheduler");

        // Get latest ingestion run
        const latestRuns = await ingestionDb.getRecentIngestionRuns("phoenixchildrens", 1);
        const latestRun = latestRuns[0] || null;

        // Get scheduler status
        const schedulerStatus = {
          running: ingestionScheduler.isSchedulerRunning(),
          currentlyProcessing: ingestionScheduler.isCurrentlyRunning(),
          cron: process.env.JOBS_INGESTION_CRON || "0 2 * * *",
          enabled: process.env.JOBS_INGESTION_ENABLED === "true",
          graceDays: parseInt(process.env.INGESTION_GRACE_PERIOD_DAYS || "21", 10),
        };

        return res.json({
          success: true,
          latestRun: latestRun
            ? {
                id: latestRun.id,
                status: latestRun.status,
                started_at: latestRun.started_at,
                completed_at: latestRun.completed_at,
                duration_seconds: latestRun.duration_seconds,
                jobs_fetched: latestRun.jobs_fetched,
                jobs_parsed: latestRun.jobs_parsed,
                jobs_inserted: latestRun.jobs_inserted,
                jobs_updated: latestRun.jobs_updated,
                jobs_skipped: latestRun.jobs_skipped,
                jobs_archived: latestRun.jobs_archived,
                errors_count: latestRun.errors_count,
                error_log: (latestRun.error_log || []).slice(0, 5), // First 5 errors
              }
            : null,
          scheduler: schedulerStatus,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error("[Admin API] Ingestion summary error:", message);
        return res.status(500).json({
          error: "Failed to get ingestion summary",
          message,
        });
      }
    }
  );
}
