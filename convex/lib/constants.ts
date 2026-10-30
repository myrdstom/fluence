import { v, type Infer } from "convex/values";

export const CATEGORIES = [
  "power_tools",
  "hand_tools",
  "garden",
  "kitchen",
  "camping",
  "other",
] as const;

export const categoryValidator = v.union(
  ...CATEGORIES.map((category) => v.literal(category)),
);
export type Category = Infer<typeof categoryValidator>;

export const conditionValidator = v.union(
  v.literal("new"),
  v.literal("good"),
  v.literal("fair"),
  v.literal("worn"),
);

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
