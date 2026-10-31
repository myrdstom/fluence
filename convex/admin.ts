import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdmin } from "./lib/auth";

/** All loans. Active ones sort by due date, so the most overdue come first. */
export const listLoans = query({
  args: {
    status: v.union(
      v.literal("approved"),
      v.literal("returned"),
      v.literal("closed"),
    ),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, { status, paginationOpts }) => {
    await requireAdmin(ctx);
    const results = await ctx.db
      .query("borrowRequests")
      .withIndex("by_status_and_endDate", (q) => q.eq("status", status))
      .order(status === "approved" ? "asc" : "desc")
      .paginate(paginationOpts);

    const page = await Promise.all(
      results.page.map(async (loan) => {
        const [lender, borrower] = await Promise.all([
          ctx.db.get("users", loan.ownerId),
          ctx.db.get("users", loan.borrowerId),
        ]);
        return {
          _id: loan._id,
          toolName: loan.toolName,
          startDate: loan.startDate,
          endDate: loan.endDate,
          status: loan.status,
          returnedAt: loan.returnedAt,
          lenderName: lender?.name ?? null,
          borrowerName: borrower?.name ?? null,
        };
      }),
    );
    return { ...results, page };
  },
});

/** Includes email because display names aren't unique and admins must pick the right person. */
export const listUsers = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, { paginationOpts }) => {
    await requireAdmin(ctx);
    const results = await ctx.db
      .query("users")
      .order("desc")
      .paginate(paginationOpts);
    return {
      ...results,
      page: results.page.map((user) => ({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isTrustedLender: user.isTrustedLender,
      })),
    };
  },
});

export const setTrustedLender = mutation({
  args: { userId: v.id("users"), isTrustedLender: v.boolean() },
  handler: async (ctx, { userId, isTrustedLender }) => {
    await requireAdmin(ctx);
    await ctx.db.patch("users", userId, { isTrustedLender });
  },
});

const AUTOMATION_LIMIT = 50;

/** Recent automation runs and failures, so a failed run is never silent. */
export const listAutomation = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const [events, failures] = await Promise.all([
      ctx.db.query("automationEvents").order("desc").take(AUTOMATION_LIMIT),
      ctx.db.query("workflowFailures").order("desc").take(AUTOMATION_LIMIT),
    ]);
    return {
      failures,
      events: await Promise.all(
        events.map(async (event) => {
          const request = await ctx.db.get("borrowRequests", event.requestId);
          return {
            _id: event._id,
            kind: event.kind,
            event: event.event,
            status: event.status,
            attempts: event.attempts,
            lastError: event.lastError,
            occurredAt: event.occurredAt,
            toolName: request?.toolName ?? null,
          };
        }),
      ),
    };
  },
});
