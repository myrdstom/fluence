const MS_PER_DAY = 24 * 60 * 60 * 1000;

function toUtcMs(date: string) {
  return Date.parse(`${date}T00:00:00Z`);
}

/** True for a real calendar date in YYYY-MM-DD form, so 2026-02-31 is rejected. */
export function isCalendarDate(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const ms = toUtcMs(date);
  return !Number.isNaN(ms) && new Date(ms).toISOString().startsWith(date);
}

export function daysBetween(startDate: string, endDate: string) {
  return Math.round((toUtcMs(endDate) - toUtcMs(startDate)) / MS_PER_DAY);
}

export function utcDate(ms: number) {
  return new Date(ms).toISOString().slice(0, 10);
}

/**
 * The earliest date any timezone could still consider "today". Borrowers pick
 * local dates, so comparing with the UTC date alone would reject valid ones.
 */
export function earliestLocalToday(nowMs: number) {
  return utcDate(nowMs - MS_PER_DAY);
}

export function rangesOverlap(
  a: { startDate: string; endDate: string },
  b: { startDate: string; endDate: string },
) {
  return a.startDate <= b.endDate && b.startDate <= a.endDate;
}
