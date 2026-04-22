/**
 * Calendar buckets for site traffic (visits + registration counts on /admin).
 * Defaults to America/Phoenix so "today" and the 7-day chart match US Mountain Time
 * for nursingrocksconcerts.com (avoids UTC "tomorrow" in US evenings).
 */
export const SITE_TRAFFIC_TIMEZONE = process.env.SITE_TRAFFIC_TIMEZONE || "America/Phoenix";

export function getDateKeyInTimeZone(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const y = parts.find((p) => p.type === "year")?.value ?? "1970";
  const m = parts.find((p) => p.type === "month")?.value ?? "01";
  const d = parts.find((p) => p.type === "day")?.value ?? "01";
  return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

export function getSiteTrafficDateKey(now: Date = new Date()): string {
  return getDateKeyInTimeZone(now, SITE_TRAFFIC_TIMEZONE);
}

/**
 * Rolling calendar days in site TZ, oldest first. 24h steps are safe for Phoenix (no DST).
 */
export function getSiteTrafficRollingDateKeys(count: number): string[] {
  const keys: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const t = new Date(Date.now() - i * 86400000);
    keys.push(getDateKeyInTimeZone(t, SITE_TRAFFIC_TIMEZONE));
  }
  return keys;
}

/**
 * UTC range for filtering `users.created_at` to one site-calendar day.
 * Precise for America/Phoenix (MST = UTC−7). Other zones fall back to UTC midnight–end.
 */
export function getUtcRangeForSiteTrafficCalendarDate(dateStr: string): { start: Date; end: Date } {
  if (SITE_TRAFFIC_TIMEZONE === "America/Phoenix") {
    const [y, m, d] = dateStr.split("-").map(Number);
    const start = new Date(Date.UTC(y, m - 1, d, 7, 0, 0, 0));
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);
    return { start, end };
  }
  const start = new Date(`${dateStr}T00:00:00.000Z`);
  const end = new Date(`${dateStr}T23:59:59.999Z`);
  return { start, end };
}
