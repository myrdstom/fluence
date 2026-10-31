import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { api } from "./_generated/api";
import { TOOL_NAME_MAX_LENGTH } from "./lib/constants";
import {
  addAdmin,
  addTool,
  addUser,
  createTest,
  FIRST_PAGE,
} from "./test.helpers";

const TOOL_FIELDS = {
  name: "Rake",
  category: "garden",
  condition: "fair",
  description: "Sturdy.",
} as const;

beforeEach(() => {
  vi.useFakeTimers({ now: new Date("2026-06-15T12:00:00Z") });
});
afterEach(() => {
  vi.useRealTimers();
});

describe("tools.listPublic", () => {
  test("works signed out and returns only name and category", async () => {
    const t = createTest();
    const owner = await addUser(t, "owner");
    await addTool(owner.client, "Drill");

    const [tool, ...rest] = await t.query(api.tools.listPublic, {});

    expect(rest).toEqual([]);
    expect(tool).toEqual({ name: "Drill", category: "power_tools" });
  });

  test("hides tools that are on loan", async () => {
    const t = createTest();
    const owner = await addUser(t, "owner");
    const toolId = await addTool(owner.client);
    await t.run((ctx) => ctx.db.patch("tools", toolId, { status: "on_loan" }));

    expect(await t.query(api.tools.listPublic, {})).toEqual([]);
  });
});

describe("tools.list", () => {
  test("requires sign-in", async () => {
    const t = createTest();
    await expect(
      t.query(api.tools.list, { paginationOpts: FIRST_PAGE }),
    ).rejects.toThrow("Not authenticated");
  });

  test("shows the lender's name and badge but never their email", async () => {
    const t = createTest();
    const owner = await addUser(t, "owner");
    const viewer = await addUser(t, "viewer");
    await addTool(owner.client);
    await t.run((ctx) =>
      ctx.db.patch("users", owner.id, { isTrustedLender: true }),
    );

    const { page } = await viewer.client.query(api.tools.list, {
      paginationOpts: FIRST_PAGE,
    });

    expect(page[0].lender).toEqual({ name: "owner", isTrustedLender: true });
    expect(JSON.stringify(page)).not.toContain("@example.com");
    expect(page[0].isMine).toBe(false);
  });

  test("marks the caller's own tools", async () => {
    const t = createTest();
    const owner = await addUser(t, "owner");
    await addTool(owner.client);

    const { page } = await owner.client.query(api.tools.list, {
      paginationOpts: FIRST_PAGE,
    });

    expect(page[0].isMine).toBe(true);
  });

  test("filters by category", async () => {
    const t = createTest();
    const owner = await addUser(t, "owner");
    await addTool(owner.client, "Drill");
    await owner.client.mutation(api.tools.create, TOOL_FIELDS);

    const { page } = await owner.client.query(api.tools.list, {
      category: "garden",
      paginationOpts: FIRST_PAGE,
    });

    expect(page.map((tool) => tool.name)).toEqual(["Rake"]);
  });
});

describe("tools.listMine", () => {
  test("returns only the caller's tools", async () => {
    const t = createTest();
    const ada = await addUser(t, "ada");
    const bob = await addUser(t, "bob");
    await addTool(ada.client, "Ada's drill");
    await addTool(bob.client, "Bob's drill");

    const { page } = await ada.client.query(api.tools.listMine, {
      paginationOpts: FIRST_PAGE,
    });

    expect(page.map((tool) => tool.name)).toEqual(["Ada's drill"]);
  });
});

describe("tools.create", () => {
  test("requires sign-in", async () => {
    const t = createTest();
    await expect(t.mutation(api.tools.create, TOOL_FIELDS)).rejects.toThrow(
      "Not authenticated",
    );
  });

  test("assigns the caller as owner, starts available, and trims text", async () => {
    const t = createTest();
    const owner = await addUser(t, "owner");

    const toolId = await owner.client.mutation(api.tools.create, {
      ...TOOL_FIELDS,
      name: "  Rake  ",
    });

    const tool = await t.run((ctx) => ctx.db.get("tools", toolId));
    expect(tool).toMatchObject({
      name: "Rake",
      ownerId: owner.id,
      status: "available",
    });
  });

  test("rejects blank and overlong text", async () => {
    const t = createTest();
    const owner = await addUser(t, "owner");

    await expect(
      owner.client.mutation(api.tools.create, { ...TOOL_FIELDS, name: "   " }),
    ).rejects.toThrow("Name is required");
    await expect(
      owner.client.mutation(api.tools.create, {
        ...TOOL_FIELDS,
        name: "x".repeat(TOOL_NAME_MAX_LENGTH + 1),
      }),
    ).rejects.toThrow("characters or fewer");
    await expect(
      owner.client.mutation(api.tools.create, {
        ...TOOL_FIELDS,
        description: " ",
      }),
    ).rejects.toThrow("Description is required");
  });

  test("rejects attempts to set the status or owner", async () => {
    const t = createTest();
    const owner = await addUser(t, "owner");
    const fields: Record<string, unknown> = {
      ...TOOL_FIELDS,
      status: "on_loan",
    };

    await expect(
      owner.client.mutation(
        api.tools.create,
        fields as unknown as typeof TOOL_FIELDS,
      ),
    ).rejects.toThrow();
  });
});

describe("tools.update", () => {
  test("lets the owner edit their tool", async () => {
    const t = createTest();
    const owner = await addUser(t, "owner");
    const toolId = await addTool(owner.client);

    await owner.client.mutation(api.tools.update, { toolId, ...TOOL_FIELDS });

    const tool = await t.run((ctx) => ctx.db.get("tools", toolId));
    expect(tool).toMatchObject(TOOL_FIELDS);
  });

  test("rejects other users, and admins too", async () => {
    const t = createTest();
    const owner = await addUser(t, "owner");
    const stranger = await addUser(t, "stranger");
    const admin = await addAdmin(t, "admin");
    const toolId = await addTool(owner.client);

    for (const { client } of [stranger, admin]) {
      await expect(
        client.mutation(api.tools.update, { toolId, ...TOOL_FIELDS }),
      ).rejects.toThrow("Not authorized");
    }
  });
});

describe("tools.remove", () => {
  test("lets the owner and an admin remove a tool", async () => {
    const t = createTest();
    const owner = await addUser(t, "owner");
    const admin = await addAdmin(t, "admin");
    const first = await addTool(owner.client);
    const second = await addTool(owner.client);

    await owner.client.mutation(api.tools.remove, { toolId: first });
    await admin.client.mutation(api.tools.remove, { toolId: second });

    expect(await t.query(api.tools.listPublic, {})).toEqual([]);
  });

  test("rejects other users", async () => {
    const t = createTest();
    const owner = await addUser(t, "owner");
    const stranger = await addUser(t, "stranger");
    const toolId = await addTool(owner.client);

    await expect(
      stranger.client.mutation(api.tools.remove, { toolId }),
    ).rejects.toThrow("Not authorized");
  });

  test("refuses to let an owner remove a tool on loan", async () => {
    const t = createTest();
    const owner = await addUser(t, "owner");
    const toolId = await addTool(owner.client);
    await t.run((ctx) => ctx.db.patch("tools", toolId, { status: "on_loan" }));

    await expect(
      owner.client.mutation(api.tools.remove, { toolId }),
    ).rejects.toThrow("on loan");
  });

  test("lets an admin remove a tool on loan, closing the loan", async () => {
    const t = createTest();
    const owner = await addUser(t, "owner");
    const borrower = await addUser(t, "borrower");
    const admin = await addAdmin(t, "admin");
    const toolId = await addTool(owner.client, "Drill");
    const requestId = await borrower.client.mutation(api.requests.create, {
      toolId,
      startDate: "2026-06-20",
      endDate: "2026-06-21",
    });
    await owner.client.mutation(api.requests.approve, { requestId });

    await admin.client.mutation(api.tools.remove, { toolId });

    const { page } = await borrower.client.query(api.requests.listMine, {
      paginationOpts: FIRST_PAGE,
    });
    expect(page[0]).toMatchObject({ toolName: "Drill", status: "cancelled" });
    expect(await t.run((ctx) => ctx.db.get("tools", toolId))).toBeNull();
    const events = await t.run((ctx) =>
      ctx.db
        .query("automationEvents")
        .withIndex("by_requestId", (q) => q.eq("requestId", requestId))
        .collect(),
    );
    expect(
      events.find((e) => e.event === "request.cancelled")?.recipientId,
    ).toBe(borrower.id);
  });

  test("cancels pending requests, tells the borrower, and keeps history", async () => {
    const t = createTest();
    const owner = await addUser(t, "owner");
    const borrower = await addUser(t, "borrower");
    const toolId = await addTool(owner.client, "Drill");
    const requestId = await borrower.client.mutation(api.requests.create, {
      toolId,
      startDate: "2026-06-20",
      endDate: "2026-06-21",
    });

    await owner.client.mutation(api.tools.remove, { toolId });

    const { page } = await borrower.client.query(api.requests.listMine, {
      paginationOpts: FIRST_PAGE,
    });
    expect(page[0]).toMatchObject({ toolName: "Drill", status: "cancelled" });
    const events = await t.run((ctx) =>
      ctx.db
        .query("automationEvents")
        .withIndex("by_requestId", (q) => q.eq("requestId", requestId))
        .collect(),
    );
    expect(
      events.find((e) => e.event === "request.cancelled")?.recipientId,
    ).toBe(borrower.id);
  });
});
