/** Today's calendar date in the viewer's timezone, as YYYY-MM-DD. */
export function localToday() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

/** Formats in UTC because YYYY-MM-DD parses as UTC, so the day never shifts. */
export function formatDate(date: string) {
  return dateFormatter.format(new Date(date));
}

export function formatDateRange(startDate: string, endDate: string) {
  return startDate === endDate
    ? formatDate(startDate)
    : `${formatDate(startDate)} – ${formatDate(endDate)}`;
}

export function isOverdue(request: { status: string; endDate: string }) {
  return request.status === "approved" && request.endDate < localToday();
}

const relativeFormatter = new Intl.RelativeTimeFormat(undefined, {
  numeric: "auto",
});

/** "2 days ago", "3 hours ago", and so on. */
export function formatTimeAgo(timestamp: number, now: number) {
  const minutes = Math.round((timestamp - now) / 60_000);
  if (Math.abs(minutes) < 60)
    return relativeFormatter.format(minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return relativeFormatter.format(hours, "hour");
  return relativeFormatter.format(Math.round(hours / 24), "day");
}
