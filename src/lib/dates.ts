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
