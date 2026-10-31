import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";
import { daysBetween } from "./lib/dates";

/** One run's worth. Anything beyond this is picked up by the next run. */
const OVERDUE_BATCH_SIZE = 100;

function reminderKey(requestId: string, reminderDate: string) {
  return `overdue_reminder:${requestId}:${reminderDate}`;
}

/**
 * Overdue loans not yet reminded on this date, so a re-run can't remind twice.
 * Returns only what a reminder needs: no lender details and no notes.
 */
export const listOverdue = internalQuery({
  args: { today: v.string() },
  handler: async (ctx, { today }) => {
    const loans = await ctx.db
      .query("borrowRequests")
      .withIndex("by_status_and_endDate", (q) =>
        q.eq("status", "approved").lt("endDate", today),
      )
      .take(OVERDUE_BATCH_SIZE);

    const overdue = await Promise.all(
      loans.map(async (loan) => {
        const reminder = await ctx.db
          .query("automationEvents")
          .withIndex("by_idempotencyKey", (q) =>
            q.eq("idempotencyKey", reminderKey(loan._id, today)),
          )
          .unique();
        if (reminder?.status === "sent") return null;
        const borrower = await ctx.db.get("users", loan.borrowerId);
        if (!borrower?.email) return null;
        return {
          loanId: loan._id,
          toolName: loan.toolName,
          dueDate: loan.endDate,
          daysOverdue: daysBetween(loan.endDate, today),
          borrower: { name: borrower.name, email: borrower.email },
        };
      }),
    );
    return overdue.filter((loan) => loan !== null);
  },
});

/** Safe to retry: the same loan and date always resolve to one record. */
export const recordReminder = internalMutation({
  args: {
    loanId: v.string(),
    reminderDate: v.string(),
    status: v.union(v.literal("sent"), v.literal("failed")),
  },
  handler: async (ctx, { loanId, reminderDate, status }) => {
    const requestId = ctx.db.normalizeId("borrowRequests", loanId);
    const loan = requestId && (await ctx.db.get("borrowRequests", requestId));
    if (!loan) return { outcome: "not_found" as const };

    const idempotencyKey = reminderKey(loan._id, reminderDate);
    const existing = await ctx.db
      .query("automationEvents")
      .withIndex("by_idempotencyKey", (q) =>
        q.eq("idempotencyKey", idempotencyKey),
      )
      .unique();

    if (!existing) {
      await ctx.db.insert("automationEvents", {
        requestId: loan._id,
        kind: "overdue_reminder",
        status,
        idempotencyKey,
        occurredAt: Date.now(),
      });
      return { outcome: "recorded" as const };
    }
    // A later success replaces a failure, but a failure never undoes a sent reminder.
    if (existing.status === "failed" && status === "sent") {
      await ctx.db.patch("automationEvents", existing._id, {
        status,
        occurredAt: Date.now(),
      });
      return { outcome: "recorded" as const };
    }
    return { outcome: "duplicate" as const };
  },
});

export const recordWorkflowFailure = internalMutation({
  args: {
    executionId: v.string(),
    workflowName: v.string(),
    nodeName: v.string(),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("workflowFailures")
      .withIndex("by_executionId", (q) => q.eq("executionId", args.executionId))
      .unique();
    if (existing) return { outcome: "duplicate" as const };
    await ctx.db.insert("workflowFailures", {
      ...args,
      occurredAt: Date.now(),
    });
    return { outcome: "recorded" as const };
  },
});
