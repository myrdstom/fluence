import { query } from "./_generated/server";

const PUBLIC_LIST_LIMIT = 100;

/** Public and unauthenticated: returns name and category only, never owner details. */
export const listPublic = query({
  args: {},
  handler: async (ctx) => {
    const tools = await ctx.db
      .query("tools")
      .withIndex("by_status", (q) => q.eq("status", "available"))
      .take(PUBLIC_LIST_LIMIT);
    return tools.map(({ _id, name, category }) => ({ _id, name, category }));
  },
});
