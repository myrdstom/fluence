import { paginationOptsValidator } from "convex/server";
import { ConvexError, v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { mutation, query, type QueryCtx } from "./_generated/server";
import {
  assertToolOwner,
  assertToolOwnerOrAdmin,
  requireUser,
} from "./lib/auth";
import { setRequestStatus } from "./lib/borrowRequests";
import {
  categoryValidator,
  conditionValidator,
  TOOL_DESCRIPTION_MAX_LENGTH,
  TOOL_NAME_MAX_LENGTH,
} from "./lib/constants";

const PUBLIC_LIST_LIMIT = 100;

const toolFields = {
  name: v.string(),
  category: categoryValidator,
  condition: conditionValidator,
  description: v.string(),
};

function normalizeText(value: string, label: string, maxLength: number) {
  const text = value.trim();
  if (text.length === 0) throw new ConvexError(`${label} is required`);
  if (text.length > maxLength) {
    throw new ConvexError(`${label} must be ${maxLength} characters or fewer`);
  }
  return text;
}

function normalizeToolText(input: { name: string; description: string }) {
  return {
    name: normalizeText(input.name, "Name", TOOL_NAME_MAX_LENGTH),
    description: normalizeText(
      input.description,
      "Description",
      TOOL_DESCRIPTION_MAX_LENGTH,
    ),
  };
}

async function getToolOrThrow(ctx: QueryCtx, toolId: Id<"tools">) {
  const tool = await ctx.db.get("tools", toolId);
  if (!tool) throw new ConvexError("Tool not found");
  return tool;
}

/** Public and unauthenticated: returns name and category only, never owner details. */
export const listPublic = query({
  args: {},
  handler: async (ctx) => {
    const tools = await ctx.db
      .query("tools")
      .withIndex("by_status", (q) => q.eq("status", "available"))
      .order("desc")
      .take(PUBLIC_LIST_LIMIT);
    return tools.map(({ _id, name, category }) => ({ _id, name, category }));
  },
});

/** Signed-in browse view. Exposes the lender's display name and badge, never their email. */
export const list = query({
  args: {
    category: v.optional(categoryValidator),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, { category, paginationOpts }) => {
    const user = await requireUser(ctx);

    const results = await (category
      ? ctx.db
          .query("tools")
          .withIndex("by_category", (q) => q.eq("category", category))
          .order("desc")
          .paginate(paginationOpts)
      : ctx.db.query("tools").order("desc").paginate(paginationOpts));

    const ownerIds = [...new Set(results.page.map((tool) => tool.ownerId))];
    const owners = await Promise.all(
      ownerIds.map((ownerId) => ctx.db.get("users", ownerId)),
    );
    const ownersById = new Map(
      owners
        .filter((owner): owner is Doc<"users"> => owner !== null)
        .map((owner) => [owner._id, owner]),
    );

    const page = await Promise.all(
      results.page.map(async (tool) => {
        const owner = ownersById.get(tool.ownerId);
        const myPendingRequest = await ctx.db
          .query("borrowRequests")
          .withIndex("by_borrowerId_and_toolId_and_status", (q) =>
            q
              .eq("borrowerId", user._id)
              .eq("toolId", tool._id)
              .eq("status", "pending"),
          )
          .first();
        return {
          _id: tool._id,
          name: tool.name,
          category: tool.category,
          condition: tool.condition,
          description: tool.description,
          status: tool.status,
          isMine: tool.ownerId === user._id,
          hasPendingRequest: myPendingRequest !== null,
          lender: owner
            ? { name: owner.name, isTrustedLender: owner.isTrustedLender }
            : null,
        };
      }),
    );

    return { ...results, page };
  },
});

export const listMine = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, { paginationOpts }) => {
    const user = await requireUser(ctx);
    return ctx.db
      .query("tools")
      .withIndex("by_ownerId", (q) => q.eq("ownerId", user._id))
      .order("desc")
      .paginate(paginationOpts);
  },
});

export const create = mutation({
  args: toolFields,
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    return ctx.db.insert("tools", {
      ...args,
      ...normalizeToolText(args),
      ownerId: user._id,
      status: "available",
    });
  },
});

export const update = mutation({
  args: { toolId: v.id("tools"), ...toolFields },
  handler: async (ctx, { toolId, ...fields }) => {
    const user = await requireUser(ctx);
    const tool = await getToolOrThrow(ctx, toolId);
    assertToolOwner(user, tool);
    await ctx.db.patch("tools", toolId, {
      ...fields,
      ...normalizeToolText(fields),
    });
  },
});

export const remove = mutation({
  args: { toolId: v.id("tools") },
  handler: async (ctx, { toolId }) => {
    const user = await requireUser(ctx);
    const tool = await getToolOrThrow(ctx, toolId);
    assertToolOwnerOrAdmin(user, tool);
    if (tool.status === "on_loan") {
      throw new ConvexError("This tool is on loan. Mark it returned first.");
    }
    const pendingRequests = ctx.db
      .query("borrowRequests")
      .withIndex("by_toolId_and_status", (q) =>
        q.eq("toolId", toolId).eq("status", "pending"),
      );
    for await (const request of pendingRequests) {
      // The borrower needs to know, since they didn't cancel it themselves.
      await setRequestStatus(ctx, request, "cancelled", "borrower");
    }
    await ctx.db.delete("tools", toolId);
  },
});
