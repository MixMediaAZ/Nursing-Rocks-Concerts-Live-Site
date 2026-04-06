import { db } from './db';
import { eq, and, lt, gt, not, sql } from 'drizzle-orm';
import { events, tickets, jobListings, jobAlerts, nurseProfiles, users } from '@shared/schema';
import { sendJobAlertEmail, sendEventReminderEmail, JobAlertEmailData, EventReminderEmailData } from './email';
import { storage } from './storage';

/**
 * Email Scheduler - Automatically sends job alerts and event reminders
 * Can be run on a schedule (e.g., every hour) or triggered manually
 */

interface EmailLog {
  id?: number;
  emailType: 'job_alert' | 'event_reminder';
  recipientEmail: string;
  recipientId: number;
  eventOrJobId: number;
  sentAt: Date;
  status: 'sent' | 'failed';
  error?: string;
}

const emailLogs: EmailLog[] = [];
const MAX_EMAIL_LOG_ENTRIES = 5000;
const EMAIL_RATE_LIMIT_PER_RUN = Math.max(1, parseInt(process.env.EMAIL_SCHEDULER_MAX_PER_RUN || '250', 10) || 250);
const EMAIL_DEDUP_KEY = 'EMAIL_SCHEDULER_DEDUP_V1';
const EMAIL_DEDUP_TTL_MS = 14 * 24 * 60 * 60 * 1000;
const EMAIL_DEDUP_MAX_ENTRIES = 10000;

type EmailDedupRecord = Record<string, number>;

function appendEmailLog(entry: EmailLog): void {
  emailLogs.push(entry);
  if (emailLogs.length > MAX_EMAIL_LOG_ENTRIES) {
    emailLogs.splice(0, emailLogs.length - MAX_EMAIL_LOG_ENTRIES);
  }
}

function buildDedupKey(emailType: EmailLog['emailType'], recipientId: number, eventOrJobId: number): string {
  return `${emailType}:${recipientId}:${eventOrJobId}`;
}

async function loadEmailDedupState(): Promise<EmailDedupRecord> {
  try {
    const setting = await storage.getAppSettingByKey(EMAIL_DEDUP_KEY);
    if (!setting?.value) return {};
    const parsed = JSON.parse(setting.value);
    if (!parsed || typeof parsed !== 'object') return {};
    return parsed as EmailDedupRecord;
  } catch (error) {
    console.error('[EMAIL SCHEDULER] Failed to load dedup state:', error);
    return {};
  }
}

async function persistEmailDedupState(state: EmailDedupRecord): Promise<void> {
  try {
    await storage.createOrUpdateAppSetting(
      EMAIL_DEDUP_KEY,
      JSON.stringify(state),
      'Persistent dedup state for scheduled email sends',
      true
    );
  } catch (error) {
    console.error('[EMAIL SCHEDULER] Failed to persist dedup state:', error);
  }
}

function pruneEmailDedupState(state: EmailDedupRecord): EmailDedupRecord {
  const now = Date.now();
  const activeEntries = Object.entries(state)
    .filter(([, expiresAt]) => typeof expiresAt === 'number' && expiresAt > now)
    .sort((a, b) => b[1] - a[1])
    .slice(0, EMAIL_DEDUP_MAX_ENTRIES);
  return Object.fromEntries(activeEntries);
}

/**
 * Send job alerts to nurses matching job requirements
 * Checks if nurse hasn't already received alert for this job
 */
export async function sendJobAlerts(): Promise<{ success: number; failed: number; message: string }> {
  try {
    console.log('[EMAIL SCHEDULER] Starting job alert sending...');
    let successCount = 0;
    let failedCount = 0;
    let sentThisRun = 0;
    let dedupState = pruneEmailDedupState(await loadEmailDedupState());

    // Get all active job listings
    const activeJobs = await db.select().from(jobListings).where(
      and(
        eq(jobListings.is_approved, true),
        eq(jobListings.is_active, true),
        gt(jobListings.posted_date, sql`NOW() - INTERVAL '7 days'`) // Only recent jobs
      )
    );

    if (activeJobs.length === 0) {
      return { success: 0, failed: 0, message: 'No active job listings found' };
    }

    // For each job, find matching nurses
    for (const job of activeJobs) {
      try {
        // Get all nurses with job alerts enabled
        const allNursesWithAlerts = await db.select({
          userId: nurseProfiles.user_id,
          specialties: nurseProfiles.specialties,
          email: users.email,
          firstName: users.first_name,
          lastName: users.last_name,
        })
          .from(nurseProfiles)
          .innerJoin(users, eq(nurseProfiles.user_id, users.id))
          .innerJoin(jobAlerts, eq(jobAlerts.user_id, nurseProfiles.user_id))
          .where(eq(jobAlerts.is_active, true));

        // Filter by specialty match in JS (alert.specialties is an array)
        const nursesWithAlerts = allNursesWithAlerts.filter(nurse => {
          if (!nurse.specialties || nurse.specialties.length === 0) return true;
          return nurse.specialties.includes(job.specialty);
        });

        // Send alert to each matching nurse
        for (const nurse of nursesWithAlerts) {
          if (sentThisRun >= EMAIL_RATE_LIMIT_PER_RUN) {
            console.warn(`[EMAIL SCHEDULER] Job alert send cap reached (${EMAIL_RATE_LIMIT_PER_RUN}). Stopping current run.`);
            break;
          }

          // Check if already sent
          const dedupKey = buildDedupKey('job_alert', nurse.userId, job.id);
          const alreadySent = Boolean(dedupState[dedupKey]);

          if (alreadySent) {
            console.log(`[EMAIL SCHEDULER] Job alert already sent to ${nurse.email} for job ${job.id}`);
            continue;
          }

          try {
            const jobUrl = `${process.env.APP_URL || 'https://nursingrocks.com'}/jobs/${job.id}`;

            const emailData: JobAlertEmailData = {
              nurseName: `${nurse.firstName} ${nurse.lastName}`,
              userEmail: nurse.email,
              jobTitle: job.title,
              employer: job.title, // Assuming employer name is in title, ideally fetch from employers table
              specialty: job.specialty,
              location: job.location || 'Location TBD',
              salary: job.salary_min && job.salary_max
                ? `$${Number(job.salary_min).toLocaleString()}-$${Number(job.salary_max).toLocaleString()}`
                : undefined,
              jobUrl,
            };

            const result = await sendJobAlertEmail(emailData);

            if (result.success) {
              appendEmailLog({
                emailType: 'job_alert',
                recipientEmail: nurse.email,
                recipientId: nurse.userId,
                eventOrJobId: job.id,
                sentAt: new Date(),
                status: 'sent',
              });
              dedupState[dedupKey] = Date.now() + EMAIL_DEDUP_TTL_MS;
              sentThisRun++;
              successCount++;
            } else {
              appendEmailLog({
                emailType: 'job_alert',
                recipientEmail: nurse.email,
                recipientId: nurse.userId,
                eventOrJobId: job.id,
                sentAt: new Date(),
                status: 'failed',
                error: result.error,
              });
              failedCount++;
            }
          } catch (error) {
            console.error(`[EMAIL SCHEDULER] Error sending job alert to ${nurse.email}:`, error);
            failedCount++;
          }
        }
      } catch (error) {
        console.error(`[EMAIL SCHEDULER] Error processing job ${job.id}:`, error);
        failedCount++;
      }
    }

    console.log(`[EMAIL SCHEDULER] Job alerts completed. Sent: ${successCount}, Failed: ${failedCount}`);
    dedupState = pruneEmailDedupState(dedupState);
    await persistEmailDedupState(dedupState);
    return {
      success: successCount,
      failed: failedCount,
      message: `Job alerts sent to ${successCount} nurses (${failedCount} failed)`,
    };
  } catch (error) {
    console.error('[EMAIL SCHEDULER] Error in sendJobAlerts:', error);
    return { success: 0, failed: 1, message: 'Error sending job alerts' };
  }
}

/**
 * Send event reminder emails 3 days before event
 */
export async function sendEventReminders(): Promise<{ success: number; failed: number; message: string }> {
  try {
    console.log('[EMAIL SCHEDULER] Starting event reminder sending...');
    let successCount = 0;
    let failedCount = 0;
    let sentThisRun = 0;
    let dedupState = pruneEmailDedupState(await loadEmailDedupState());

    // Calculate date range for events 3 days from now
    const threeDaysFromNow = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    const oneDayBeforeThat = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);

    // Get events happening in 3 days (select only columns that exist in DB)
    const upcomingEvents = await db.select({
      id: events.id,
      title: events.title,
      date: events.date,
      start_time: events.start_time,
      location: events.location,
    }).from(events).where(
      and(
        gt(events.date, oneDayBeforeThat),
        lt(events.date, threeDaysFromNow)
      )
    );

    if (upcomingEvents.length === 0) {
      return { success: 0, failed: 0, message: 'No upcoming events in 3-day window' };
    }

    // For each event, send reminders to all ticket holders
    for (const event of upcomingEvents) {
      try {
        // Get all tickets for this event
        const eventTickets = await db.select({
          ticketId: tickets.id,
          ticketCode: tickets.ticket_code,
          userId: tickets.user_id,
          email: users.email,
          firstName: users.first_name,
          lastName: users.last_name,
        })
          .from(tickets)
          .innerJoin(users, eq(tickets.user_id, users.id))
          .where(
            and(
              eq(tickets.event_id, event.id),
              eq(tickets.is_used, false) // Only remind for unused tickets
            )
          );

        // Send reminder to each ticket holder
        for (const ticket of eventTickets) {
          if (sentThisRun >= EMAIL_RATE_LIMIT_PER_RUN) {
            console.warn(`[EMAIL SCHEDULER] Event reminder send cap reached (${EMAIL_RATE_LIMIT_PER_RUN}). Stopping current run.`);
            break;
          }

          // Check if already sent
          const dedupKey = buildDedupKey('event_reminder', ticket.userId, event.id);
          const alreadySent = Boolean(dedupState[dedupKey]);

          if (alreadySent) {
            console.log(`[EMAIL SCHEDULER] Event reminder already sent to ${ticket.email} for event ${event.id}`);
            continue;
          }

          try {
            const eventDate = new Date(event.date);
            const formattedDate = eventDate.toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            });

            const daysUntil = Math.ceil(
              (eventDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
            );

            const emailData: EventReminderEmailData = {
              nurseName: `${ticket.firstName} ${ticket.lastName}`,
              userEmail: ticket.email,
              eventTitle: event.title,
              eventDate: formattedDate,
              eventTime: event.start_time || 'TBD',
              eventLocation: event.location,
              ticketCode: ticket.ticketCode,
              daysUntilEvent: daysUntil,
            };

            const result = await sendEventReminderEmail(emailData);

            if (result.success) {
              appendEmailLog({
                emailType: 'event_reminder',
                recipientEmail: ticket.email,
                recipientId: ticket.userId,
                eventOrJobId: event.id,
                sentAt: new Date(),
                status: 'sent',
              });
              dedupState[dedupKey] = Date.now() + EMAIL_DEDUP_TTL_MS;
              sentThisRun++;
              successCount++;
            } else {
              appendEmailLog({
                emailType: 'event_reminder',
                recipientEmail: ticket.email,
                recipientId: ticket.userId,
                eventOrJobId: event.id,
                sentAt: new Date(),
                status: 'failed',
                error: result.error,
              });
              failedCount++;
            }
          } catch (error) {
            console.error(`[EMAIL SCHEDULER] Error sending event reminder to ${ticket.email}:`, error);
            failedCount++;
          }
        }
      } catch (error) {
        console.error(`[EMAIL SCHEDULER] Error processing event ${event.id}:`, error);
        failedCount++;
      }
    }

    console.log(`[EMAIL SCHEDULER] Event reminders completed. Sent: ${successCount}, Failed: ${failedCount}`);
    dedupState = pruneEmailDedupState(dedupState);
    await persistEmailDedupState(dedupState);
    return {
      success: successCount,
      failed: failedCount,
      message: `Event reminders sent to ${successCount} nurses (${failedCount} failed)`,
    };
  } catch (error) {
    console.error('[EMAIL SCHEDULER] Error in sendEventReminders:', error);
    return { success: 0, failed: 1, message: 'Error sending event reminders' };
  }
}

/**
 * Run all scheduled email tasks
 * Can be called by cron job, API endpoint, or startup
 */
export async function runAllEmailSchedules(): Promise<{ jobAlerts: any; eventReminders: any }> {
  console.log('[EMAIL SCHEDULER] Running all scheduled email tasks...');

  const jobAlerts = await sendJobAlerts();
  const eventReminders = await sendEventReminders();

  console.log('[EMAIL SCHEDULER] All scheduled tasks completed');

  return { jobAlerts, eventReminders };
}

/**
 * Get email schedule status and logs
 */
export function getEmailScheduleStatus() {
  return {
    totalEmailsLogged: emailLogs.length,
    successfulEmails: emailLogs.filter(log => log.status === 'sent').length,
    failedEmails: emailLogs.filter(log => log.status === 'failed').length,
    lastLogs: emailLogs.slice(-10), // Last 10 email logs
  };
}
