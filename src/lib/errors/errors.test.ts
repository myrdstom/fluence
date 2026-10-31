import { ConvexError } from "convex/values";
import { describe, expect, test } from "vitest";
import { getErrorMessage } from "./errors";

const GENERIC = "Something went wrong. Please try again.";

describe("getErrorMessage", () => {
  test("shows messages the backend chose to expose", () => {
    expect(getErrorMessage(new ConvexError("Tool not found"))).toBe(
      "Tool not found",
    );
  });

  test("hides everything else, which may contain internal details", () => {
    expect(getErrorMessage(new Error("database exploded"))).toBe(GENERIC);
    expect(getErrorMessage(new ConvexError({ code: 500 }))).toBe(GENERIC);
    expect(getErrorMessage("oops")).toBe(GENERIC);
    expect(getErrorMessage(undefined)).toBe(GENERIC);
  });
});
