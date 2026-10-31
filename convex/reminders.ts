import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";
import { daysBetween } from "./lib/dates/dates";

function reminderKey(requestId: string, reminderDate: string) {
  return `overdue_reminder:${requestId}:${reminderDate}`;
}

/**
 * One page of overdue loans with no sent reminder on this date. Paged so a large
 * backlog can't hide newer loans behind the oldest ones.
 *
 * Returns only what a reminder needs: no lender details and no notes. A borrower
 * with no email stays in the list with a null address, so the workflow reports
 * that reminder as failed. idempotencyKey lets a provider drop a repeat if a send
 * succeeded but its write-back didn't.
 */
export const listOverdue = internalQuery({
  args: { today: v.string(), paginationOpts: paginationOptsValidator },
  handler: async (ctx, { today, paginationOpts }) => {
    const results = await ctx.db
      .query("borrowRequests")
      .withIndex("by_status_and_endDate", (q) =>
        q.eq("status", "approved").lt("endDate", today),
      )
      .paginate(paginationOpts);

    const overdue = await Promise.all(
      results.page.map(async (loan) => {
        const idempotencyKey = reminderKey(loan._id, today);
        const reminder = await ctx.db
          .query("automationEvents")
          .withIndex("by_idempotencyKey", (q) =>
            q.eq("idempotencyKey", idempotencyKey),
          )
          .unique();
        if (reminder?.status === "sent") return null;
        const borrower = await ctx.db.get("users", loan.borrowerId);
        return {
          loanId: loan._id,
          idempotencyKey,
          toolName: loan.toolName,
          dueDate: loan.endDate,
          daysOverdue: daysBetween(loan.endDate, today),
          borrower: {
            name: borrower?.name ?? null,
            email: borrower?.email ?? null,
          },
        };
      }),
    );
    return { ...results, page: overdue.filter((loan) => loan !== null) };
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
