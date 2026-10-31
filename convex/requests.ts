import { paginationOptsValidator } from "convex/server";
import { ConvexError, v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { mutation, query, type QueryCtx } from "./_generated/server";
import { requireUser } from "./lib/auth";
import { setRequestStatus } from "./lib/borrowRequests";
import { MAX_LOAN_DAYS } from "./lib/constants";
import { enqueueRequestNotification } from "./lib/notifications";
import {
  daysBetween,
  earliestLocalToday,
  isCalendarDate,
  rangesOverlap,
} from "./lib/dates";

const OPEN_REQUESTS_LIMIT = 50;
const ACTIVITY_LIMIT = 3;

async function getRequestOrThrow(
  ctx: QueryCtx,
  requestId: Id<"borrowRequests">,
) {
  const request = await ctx.db.get("borrowRequests", requestId);
  if (!request) throw new ConvexError("Request not found");
  return request;
}

function assertOwner(user: Doc<"users">, request: Doc<"borrowRequests">) {
  if (request.ownerId !== user._id) throw new ConvexError("Not authorized");
}

/**
 * Shapes a request for one party. The other party's email is only shared while
 * a loan is active, when the two of them need to arrange the handover.
 */
async function toRequestView(
  ctx: QueryCtx,
  request: Doc<"borrowRequests">,
  otherPartyId: Id<"users">,
) {
  const otherParty = await ctx.db.get("users", otherPartyId);
  const activity = await ctx.db
    .query("automationEvents")
    .withIndex("by_requestId", (q) => q.eq("requestId", request._id))
    .order("desc")
    .take(ACTIVITY_LIMIT);
  return {
    activity: activity.map(({ _id, kind, status, occurredAt }) => ({
      _id,
      kind,
      status,
      occurredAt,
    })),
    _id: request._id,
    _creationTime: request._creationTime,
    toolName: request.toolName,
    startDate: request.startDate,
    endDate: request.endDate,
    status: request.status,
    returnedAt: request.returnedAt,
    otherParty: otherParty
      ? {
          name: otherParty.name,
          isTrustedLender: otherParty.isTrustedLender,
          email: request.status === "approved" ? otherParty.email : undefined,
        }
      : null,
  };
}

export const create = mutation({
  args: {
    toolId: v.id("tools"),
    startDate: v.string(),
    endDate: v.string(),
  },
  handler: async (ctx, { toolId, startDate, endDate }) => {
    const user = await requireUser(ctx);

    const tool = await ctx.db.get("tools", toolId);
    if (!tool) throw new ConvexError("Tool not found");
    if (tool.ownerId === user._id) {
      throw new ConvexError("You can't borrow your own tool");
    }
    if (tool.status !== "available") {
      throw new ConvexError("This tool is on loan right now");
    }

    if (!isCalendarDate(startDate) || !isCalendarDate(endDate)) {
      throw new ConvexError("Please choose valid dates");
    }
    if (startDate > endDate) {
      throw new ConvexError("The end date can't be before the start date");
    }
    if (startDate < earliestLocalToday(Date.now())) {
      throw new ConvexError("The start date can't be in the past");
    }
    if (daysBetween(startDate, endDate) > MAX_LOAN_DAYS) {
      throw new ConvexError(`Loans can last up to ${MAX_LOAN_DAYS} days`);
    }

    const existing = await ctx.db
      .query("borrowRequests")
      .withIndex("by_borrowerId_and_toolId_and_status", (q) =>
        q
          .eq("borrowerId", user._id)
          .eq("toolId", toolId)
          .eq("status", "pending"),
      )
      .first();
    if (existing) {
      throw new ConvexError("You already have a pending request for this tool");
    }

    const request = {
      toolId,
      borrowerId: user._id,
      ownerId: tool.ownerId,
      toolName: tool.name,
      startDate,
      endDate,
      status: "pending" as const,
    };
    const requestId = await ctx.db.insert("borrowRequests", request);
    await enqueueRequestNotification(
      ctx,
      { ...request, _id: requestId },
      "request.created",
      "owner",
    );
    return requestId;
  },
});

/** The caller's own borrowing, newest first. */
export const listMine = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, { paginationOpts }) => {
    const user = await requireUser(ctx);
    const results = await ctx.db
      .query("borrowRequests")
      .withIndex("by_borrowerId", (q) => q.eq("borrowerId", user._id))
      .order("desc")
      .paginate(paginationOpts);
    return {
      ...results,
      page: await Promise.all(
        results.page.map((request) =>
          toRequestView(ctx, request, request.ownerId),
        ),
      ),
    };
  },
});

/** Requests on the caller's tools that still need attention. */
export const listIncomingOpen = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const byStatus = (status: "pending" | "approved") =>
      ctx.db
        .query("borrowRequests")
        .withIndex("by_ownerId_and_status", (q) =>
          q.eq("ownerId", user._id).eq("status", status),
        )
        .take(OPEN_REQUESTS_LIMIT);
    const [pending, active] = await Promise.all([
      byStatus("pending"),
      byStatus("approved"),
    ]);
    const toViews = (requests: Doc<"borrowRequests">[]) =>
      Promise.all(
        requests.map((request) =>
          toRequestView(ctx, request, request.borrowerId),
        ),
      );
    return { pending: await toViews(pending), active: await toViews(active) };
  },
});

/** Finished requests on the caller's tools, newest first. */
export const listIncomingHistory = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, { paginationOpts }) => {
    const user = await requireUser(ctx);
    const results = await ctx.db
      .query("borrowRequests")
      .withIndex("by_ownerId", (q) => q.eq("ownerId", user._id))
      .order("desc")
      .filter((q) =>
        q.and(
          q.neq(q.field("status"), "pending"),
          q.neq(q.field("status"), "approved"),
        ),
      )
      .paginate(paginationOpts);
    return {
      ...results,
      page: await Promise.all(
        results.page.map((request) =>
          toRequestView(ctx, request, request.borrowerId),
        ),
      ),
    };
  },
});

/**
 * A tool has one active loan at a time, and is reserved from approval until it
 * comes back. Pending requests for overlapping dates can no longer be met, so
 * they are declined here; the rest stay pending for after the return.
 */
export const approve = mutation({
  args: { requestId: v.id("borrowRequests") },
  handler: async (ctx, { requestId }) => {
    const user = await requireUser(ctx);
    const request = await getRequestOrThrow(ctx, requestId);
    assertOwner(user, request);

    const tool = await ctx.db.get("tools", request.toolId);
    if (!tool) throw new ConvexError("Tool not found");
    if (tool.status !== "available") {
      throw new ConvexError("This tool is already on loan");
    }
    if (request.endDate < earliestLocalToday(Date.now())) {
      throw new ConvexError("This request's dates have passed");
    }

    await setRequestStatus(ctx, request, "approved");
    await ctx.db.patch("tools", tool._id, { status: "on_loan" });

    const otherPending = ctx.db
      .query("borrowRequests")
      .withIndex("by_toolId_and_status", (q) =>
        q.eq("toolId", tool._id).eq("status", "pending"),
      );
    for await (const other of otherPending) {
      if (other._id !== requestId && rangesOverlap(request, other)) {
        await setRequestStatus(ctx, other, "declined");
      }
    }
  },
});

export const decline = mutation({
  args: { requestId: v.id("borrowRequests") },
  handler: async (ctx, { requestId }) => {
    const user = await requireUser(ctx);
    const request = await getRequestOrThrow(ctx, requestId);
    assertOwner(user, request);
    await setRequestStatus(ctx, request, "declined");
  },
});

export const cancel = mutation({
  args: { requestId: v.id("borrowRequests") },
  handler: async (ctx, { requestId }) => {
    const user = await requireUser(ctx);
    const request = await getRequestOrThrow(ctx, requestId);
    if (request.borrowerId !== user._id) {
      throw new ConvexError("Not authorized");
    }
    await setRequestStatus(ctx, request, "cancelled");
  },
});

/** Lender only: they are the one who can confirm the tool actually came back. */
export const markReturned = mutation({
  args: { requestId: v.id("borrowRequests") },
  handler: async (ctx, { requestId }) => {
    const user = await requireUser(ctx);
    const request = await getRequestOrThrow(ctx, requestId);
    assertOwner(user, request);
    await setRequestStatus(ctx, request, "returned");
    const tool = await ctx.db.get("tools", request.toolId);
    if (tool) await ctx.db.patch("tools", tool._id, { status: "available" });
  },
});
