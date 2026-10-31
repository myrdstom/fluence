import { describe, expect, test } from "vitest";
import {
  daysBetween,
  earliestLocalToday,
  isCalendarDate,
  rangesOverlap,
  utcDate,
} from "./dates";

describe("isCalendarDate", () => {
  test.each(["2026-01-31", "2028-02-29"])("accepts %s", (date) => {
    expect(isCalendarDate(date)).toBe(true);
  });

  test.each([
    "2026-02-31",
    "2027-02-29",
    "2026-13-01",
    "2026-1-1",
    "26-01-01",
    "2026-01-01T00:00:00Z",
    "",
    "tomorrow",
  ])("rejects %j", (date) => {
    expect(isCalendarDate(date)).toBe(false);
  });
});

describe("daysBetween", () => {
  test("counts whole days, including across months", () => {
    expect(daysBetween("2026-01-30", "2026-02-02")).toBe(3);
    expect(daysBetween("2026-01-30", "2026-01-30")).toBe(0);
    expect(daysBetween("2026-02-02", "2026-01-30")).toBe(-3);
  });
});

describe("earliestLocalToday", () => {
  test("is the day before the UTC date, to allow for timezones behind UTC", () => {
    const now = Date.parse("2026-06-15T02:00:00Z");

    expect(utcDate(now)).toBe("2026-06-15");
    expect(earliestLocalToday(now)).toBe("2026-06-14");
  });
});

describe("rangesOverlap", () => {
  const range = { startDate: "2026-06-10", endDate: "2026-06-15" };

  test.each([
    ["inside", "2026-06-11", "2026-06-12"],
    ["around", "2026-06-01", "2026-06-30"],
    ["across the start", "2026-06-05", "2026-06-10"],
    ["across the end", "2026-06-15", "2026-06-20"],
  ])("detects a range %s", (_label, startDate, endDate) => {
    expect(rangesOverlap(range, { startDate, endDate })).toBe(true);
  });

  test.each([
    ["before", "2026-06-01", "2026-06-09"],
    ["after", "2026-06-16", "2026-06-20"],
  ])("allows a range %s", (_label, startDate, endDate) => {
    expect(rangesOverlap(range, { startDate, endDate })).toBe(false);
  });
});
