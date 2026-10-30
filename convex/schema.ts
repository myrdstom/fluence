import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import {
  automationKindValidator,
  automationStatusValidator,
  categoryValidator,
  conditionValidator,
  requestStatusValidator,
  roleValidator,
  toolStatusValidator,
} from "./lib/constants";

export default defineSchema({
  users: defineTable({
    tokenIdentifier: v.string(),
    name: v.string(),
    email: v.optional(v.string()),
    role: roleValidator,
    isTrustedLender: v.boolean(),
  }).index("by_token", ["tokenIdentifier"]),

  tools: defineTable({
    ownerId: v.id("users"),
    name: v.string(),
    category: categoryValidator,
    condition: conditionValidator,
    description: v.string(),
    status: toolStatusValidator,
  })
    .index("by_owner", ["ownerId"])
    .index("by_status", ["status"])
    .index("by_category_status", ["category", "status"]),

  borrowRequests: defineTable({
    toolId: v.id("tools"),
    borrowerId: v.id("users"),
    // Denormalized from the tool so "incoming requests" needs no join.
    ownerId: v.id("users"),
    // Calendar dates as YYYY-MM-DD: they sort lexically and carry no timezone.
    startDate: v.string(),
    endDate: v.string(),
    status: requestStatusValidator,
    returnedAt: v.optional(v.number()),
  })
    .index("by_borrower", ["borrowerId"])
    .index("by_owner_status", ["ownerId", "status"])
    .index("by_tool_status", ["toolId", "status"])
    .index("by_status_endDate", ["status", "endDate"]),

  automationEvents: defineTable({
    requestId: v.id("borrowRequests"),
    kind: automationKindValidator,
    status: automationStatusValidator,
    // Unique per logical event, so n8n retries cannot create duplicates.
    idempotencyKey: v.string(),
    occurredAt: v.number(),
  })
    .index("by_idempotency_key", ["idempotencyKey"])
    .index("by_request", ["requestId"]),
});
