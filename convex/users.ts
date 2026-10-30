import { ConvexError, v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { getCurrentUser } from "./lib/auth";
import { roleValidator } from "./lib/constants";

/** Creates or refreshes the caller's record. Identity comes from the JWT, never from arguments. */
export const store = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Not authenticated");

    const profile = {
      name: identity.name ?? identity.email ?? "Neighbor",
      email: identity.email,
    };
    const existing = await getCurrentUser(ctx);
    if (existing) {
      await ctx.db.patch(existing._id, profile);
      return existing._id;
    }
    return ctx.db.insert("users", {
      ...profile,
      tokenIdentifier: identity.tokenIdentifier,
      role: "user",
      isTrustedLender: false,
    });
  },
});

export const me = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return null;
    return {
      _id: user._id,
      name: user.name,
      role: user.role,
      isTrustedLender: user.isTrustedLender,
    };
  },
});

/** Internal so it cannot be called from a client: `npx convex run users:setRole '{...}'`. */
export const setRole = internalMutation({
  args: { email: v.string(), role: roleValidator },
  handler: async (ctx, { email, role }) => {
    const users = await ctx.db.query("users").collect();
    const matches = users.filter((user) => user.email === email);
    if (matches.length !== 1) {
      throw new ConvexError(`Expected one user for email, found ${matches.length}`);
    }
    await ctx.db.patch(matches[0]._id, { role });
  },
});
