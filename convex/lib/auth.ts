import { ConvexError } from "convex/values";
import type { Doc } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

type Ctx = QueryCtx | MutationCtx;

/** The signed-in user's record, or null if signed out or not yet synced. */
export async function getCurrentUser(ctx: Ctx): Promise<Doc<"users"> | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  return ctx.db
    .query("users")
    .withIndex("by_tokenIdentifier", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier),
    )
    .unique();
}

export async function requireUser(ctx: Ctx): Promise<Doc<"users">> {
  const user = await getCurrentUser(ctx);
  if (!user) throw new ConvexError("Not authenticated");
  return user;
}

export async function requireAdmin(ctx: Ctx): Promise<Doc<"users">> {
  const user = await requireUser(ctx);
  if (user.role !== "admin") throw new ConvexError("Not authorized");
  return user;
}

export function assertToolOwner(user: Doc<"users">, tool: Doc<"tools">) {
  if (tool.ownerId !== user._id) throw new ConvexError("Not authorized");
}

export function assertToolOwnerOrAdmin(user: Doc<"users">, tool: Doc<"tools">) {
  if (tool.ownerId !== user._id && user.role !== "admin") {
    throw new ConvexError("Not authorized");
  }
}
