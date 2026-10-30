import { v } from "convex/values";

export const CATEGORY_LABELS = {
  power_tools: "Power tools",
  hand_tools: "Hand tools",
  garden: "Garden",
  kitchen: "Kitchen",
  camping: "Camping",
  other: "Other",
} as const;
export type Category = keyof typeof CATEGORY_LABELS;
export const CATEGORIES = Object.keys(CATEGORY_LABELS) as Category[];

export const categoryValidator = v.union(
  v.literal("power_tools"),
  v.literal("hand_tools"),
  v.literal("garden"),
  v.literal("kitchen"),
  v.literal("camping"),
  v.literal("other"),
);

export const CONDITION_LABELS = {
  new: "New",
  good: "Good",
  fair: "Fair",
  worn: "Worn",
} as const;
export type Condition = keyof typeof CONDITION_LABELS;
export const CONDITIONS = Object.keys(CONDITION_LABELS) as Condition[];

export const conditionValidator = v.union(
  v.literal("new"),
  v.literal("good"),
  v.literal("fair"),
  v.literal("worn"),
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
  v.literal("sent"),
  v.literal("failed"),
);
