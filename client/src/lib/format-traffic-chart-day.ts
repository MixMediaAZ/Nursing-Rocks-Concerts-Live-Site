/**
 * Format YYYY-MM-DD from traffic APIs as a stable calendar label.
 * Uses UTC so the weekday/month/day always match the API string (not the viewer's TZ).
 */
export function formatTrafficChartDayLabel(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00.000Z`).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}
