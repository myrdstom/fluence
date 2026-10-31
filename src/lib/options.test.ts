import { describe, expect, test } from "vitest";
import { findOption } from "./options";

const SIZES = ["small", "large"] as const;

describe("findOption", () => {
  test("returns the option matching the raw value", () => {
    expect(findOption(SIZES, "large")).toBe("large");
  });

  test("returns undefined for a value outside the options", () => {
    expect(findOption(SIZES, "medium")).toBeUndefined();
  });
});
