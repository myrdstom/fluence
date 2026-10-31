import { afterEach, describe, expect, test, vi } from "vitest";
import {
  formatDate,
  formatDateRange,
  formatTimeAgo,
  isOverdue,
  localToday,
} from "./dates";

afterEach(() => {
  vi.useRealTimers();
});

describe("localToday", () => {
  test("uses the viewer's local calendar date, zero-padded", () => {
    vi.useFakeTimers({ now: new Date(2026, 0, 5, 23, 30) });
    expect(localToday()).toBe("2026-01-05");
  });
});

describe("formatDate", () => {
  test("never shifts the day, whatever the timezone", () => {
    const expected = new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    }).format(Date.UTC(2026, 0, 1));

    expect(formatDate("2026-01-01")).toBe(expected);
  });
});

describe("formatDateRange", () => {
  test("shows one date when the range is a single day", () => {
    expect(formatDateRange("2026-01-01", "2026-01-01")).toBe(
      formatDate("2026-01-01"),
    );
  });

  test("shows both dates otherwise", () => {
    expect(formatDateRange("2026-01-01", "2026-01-03")).toBe(
      `${formatDate("2026-01-01")} – ${formatDate("2026-01-03")}`,
    );
  });
});

describe("isOverdue", () => {
  const today = new Date(2026, 5, 15, 12);

  test("is true only for active loans past their end date", () => {
    vi.useFakeTimers({ now: today });

    expect(isOverdue({ status: "approved", endDate: "2026-06-14" })).toBe(true);
    expect(isOverdue({ status: "approved", endDate: "2026-06-15" })).toBe(
      false,
    );
    expect(isOverdue({ status: "approved", endDate: "2026-06-16" })).toBe(
      false,
    );
    expect(isOverdue({ status: "returned", endDate: "2026-06-14" })).toBe(
      false,
    );
    expect(isOverdue({ status: "pending", endDate: "2026-06-14" })).toBe(false);
  });
});

describe("formatTimeAgo", () => {
  const relative = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
  const NOW = Date.UTC(2026, 5, 15, 12);
  const MINUTE = 60_000;

  test.each([
    [5 * MINUTE, -5, "minute"],
    [59 * MINUTE, -59, "minute"],
    [60 * MINUTE, -1, "hour"],
    [23 * 60 * MINUTE, -23, "hour"],
    [24 * 60 * MINUTE, -1, "day"],
    [3 * 24 * 60 * MINUTE, -3, "day"],
  ] as const)("formats %d ms ago using the right unit", (ago, value, unit) => {
    expect(formatTimeAgo(NOW - ago, NOW)).toBe(relative.format(value, unit));
  });
});
