import { Request, Response } from 'express';
import { runAllEmailSchedules } from './email-scheduler';

/**
 * Cron Job Handlers for Vercel
 * These endpoints can be triggered by:
 * 1. Vercel Cron (vercel.json configuration)
 * 2. External services (EasyCron, cron-job.org, etc.)
 * 3. Manual trigger via admin dashboard
 */

interface CronResult {
  success: boolean;
  timestamp: string;
  duration: string;
  jobAlerts?: { success: number; failed: number; message: string };
  eventReminders?: { success: number; failed: number; message: string };
  errors?: string[];
}

/**
 * Hourly cron job to send job alerts
 * Run via: GET /api/cron/job-alerts
 * Frequency: Every hour
 */
export async function handleJobAlertsCron(req: Request, res: Response) {
  const startTime = Date.now();
  const results: CronResult = {
    success: true,
    timestamp: new Date().toISOString(),
    duration: '',
    errors: [],
  };

  try {
    console.log('[CRON] Starting hourly job alerts at', results.timestamp);

    // Verify this is a valid cron request
    // In production, check for Vercel's X-Vercel-Cron header or API key
    const cronSecret = process.env.CRON_SECRET;
    const providedSecret = req.headers['x-cron-secret'] || req.query.secret;

    if (cronSecret && providedSecret !== cronSecret) {
      console.warn('[CRON] Invalid cron secret provided');
      return res.status(401).json({
        success: false,
        message: 'Unauthorized cron request',
        timestamp: results.timestamp,
      });
    }

    // Run email schedules
    const emailResults = await runAllEmailSchedules();
    results.jobAlerts = emailResults.jobAlerts;
    results.eventReminders = emailResults.eventReminders;

    const duration = Date.now() - startTime;
    results.duration = `${duration}ms`;

    console.log('[CRON] Job alerts completed:', {
      jobAlerts: emailResults.jobAlerts,
      eventReminders: emailResults.eventReminders,
      duration: results.duration,
    });

    res.status(200).json(results);
  } catch (error) {
    console.error('[CRON] Error in job alerts cron:', error);
    results.success = false;
    results.errors = [error instanceof Error ? error.message : 'Unknown error'];

    const duration = Date.now() - startTime;
    results.duration = `${duration}ms`;

    res.status(500).json(results);
  }
}

/**
 * Daily cron job to send event reminders
 * Run via: GET /api/cron/event-reminders
 * Frequency: Once daily (9 AM)
 */
export async function handleEventRemindersCron(req: Request, res: Response) {
  const startTime = Date.now();
  const results: CronResult = {
    success: true,
    timestamp: new Date().toISOString(),
    duration: '',
    errors: [],
  };

  try {
    console.log('[CRON] Starting daily event reminders at', results.timestamp);

    // Verify this is a valid cron request
    const cronSecret = process.env.CRON_SECRET;
    const providedSecret = req.headers['x-cron-secret'] || req.query.secret;

    if (cronSecret && providedSecret !== cronSecret) {
      console.warn('[CRON] Invalid cron secret provided');
      return res.status(401).json({
        success: false,
        message: 'Unauthorized cron request',
        timestamp: results.timestamp,
      });
    }

    // Run email schedules
    const emailResults = await runAllEmailSchedules();
    results.jobAlerts = emailResults.jobAlerts;
    results.eventReminders = emailResults.eventReminders;

    const duration = Date.now() - startTime;
    results.duration = `${duration}ms`;

    console.log('[CRON] Event reminders completed:', {
      jobAlerts: emailResults.jobAlerts,
      eventReminders: emailResults.eventReminders,
      duration: results.duration,
    });

    res.status(200).json(results);
  } catch (error) {
    console.error('[CRON] Error in event reminders cron:', error);
    results.success = false;
    results.errors = [error instanceof Error ? error.message : 'Unknown error'];

    const duration = Date.now() - startTime;
    results.duration = `${duration}ms`;

    res.status(500).json(results);
  }
}

/**
 * Health check endpoint for cron jobs
 * Verifies that email service is configured and working
 */
export async function handleCronHealth(req: Request, res: Response) {
  try {
    const resendConfigured = !!process.env.RESEND_API_KEY;
    const cronSecretConfigured = !!process.env.CRON_SECRET;

    res.status(200).json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        resend: resendConfigured ? 'configured' : 'not configured',
        cronSecurity: cronSecretConfigured ? 'configured' : 'not configured',
      },
      endpoints: {
        jobAlerts: '/api/cron/job-alerts',
        eventReminders: '/api/cron/event-reminders',
        health: '/api/cron/health',
      },
      documentation: {
        setup: 'Add CRON_SECRET to environment variables for security',
        jobAlerts: 'Runs hourly to send job alerts matching nurse profiles',
        eventReminders: 'Runs daily to send 3-day event reminders',
        vercelConfig: 'Add "crons" array to vercel.json for Vercel cron support',
      },
    });
  } catch (error) {
    console.error('[CRON] Error in health check:', error);
    res.status(500).json({
      success: false,
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
