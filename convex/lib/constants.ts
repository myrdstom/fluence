import { v } from "convex/values";

export const CATEGORIES = [
  "power_tools",
  "hand_tools",
  "garden",
  "kitchen",
  "camping",
  "other",
] as const;
export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_LABELS: Record<Category, string> = {
  power_tools: "Power tools",
  hand_tools: "Hand tools",
  garden: "Garden",
  kitchen: "Kitchen",
  camping: "Camping",
  other: "Other",
};

export const categoryValidator = v.union(
  ...CATEGORIES.map((category) => v.literal(category)),
);

export const CONDITIONS = ["new", "good", "fair", "worn"] as const;
export type Condition = (typeof CONDITIONS)[number];

export const CONDITION_LABELS: Record<Condition, string> = {
  new: "New",
  good: "Good",
  fair: "Fair",
  worn: "Worn",
};

export const conditionValidator = v.union(
  ...CONDITIONS.map((condition) => v.literal(condition)),
);

export const TOOL_NAME_MAX_LENGTH = 80;
export const TOOL_DESCRIPTION_MAX_LENGTH = 500;

/** Longest loan a borrower can request, to keep tools circulating. */
export const MAX_LOAN_DAYS = 90;

export const roleValidator = v.union(v.literal("user"), v.literal("admin"));

export const toolStatusValidator = v.union(
  v.literal("available"),
  v.literal("on_loan"),
);

/**
 * pending -> approved -> returned
 * pending -> declined | cancelled
 * approved -> cancelled, only when an admin removes the listing
 * An approved request is an active loan; a loan is not a separate table.
 */
export const requestStatusValidator = v.union(
  v.literal("pending"),
  v.literal("approved"),
  v.literal("declined"),
  v.literal("cancelled"),
  v.literal("returned"),
);

export const automationKindValidator = v.union(
  v.literal("request_notification"),
  v.literal("overdue_reminder"),
);

export const automationStatusValidator = v.union(
  v.literal("pending"),
  v.literal("sent"),
  v.literal("failed"),
);
