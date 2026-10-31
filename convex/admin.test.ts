import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { api } from "./_generated/api";
import {
  addAdmin,
  addTool,
  addUser,
  createTest,
  FIRST_PAGE,
} from "./test.helpers";

const DATES = { startDate: "2026-06-20", endDate: "2026-06-25" };

beforeEach(() => {
  vi.useFakeTimers({ now: new Date("2026-06-15T12:00:00Z") });
});
afterEach(() => {
  vi.useRealTimers();
});

describe("admin access", () => {
  test("rejects regular users and signed-out callers everywhere", async () => {
    const t = createTest();
    const user = await addUser(t, "user");
    const args = { paginationOpts: FIRST_PAGE };
    const trust = { userId: user.id, isTrustedLender: true };

    await expect(
      user.client.query(api.admin.listLoans, { status: "approved", ...args }),
    ).rejects.toThrow("Not authorized");
    await expect(user.client.query(api.admin.listUsers, args)).rejects.toThrow(
      "Not authorized",
    );
    await expect(
      user.client.query(api.admin.listAutomation, {}),
    ).rejects.toThrow("Not authorized");
    await expect(
      user.client.mutation(api.admin.setTrustedLender, trust),
    ).rejects.toThrow("Not authorized");

    await expect(t.query(api.admin.listUsers, args)).rejects.toThrow(
      "Not authenticated",
    );
    await expect(t.mutation(api.admin.setTrustedLender, trust)).rejects.toThrow(
      "Not authenticated",
    );
  });
});

describe("admin.listLoans", () => {
  test("separates active and returned loans, with names but no emails", async () => {
    const t = createTest();
    const admin = await addAdmin(t, "admin");
    const owner = await addUser(t, "owner");
    const borrower = await addUser(t, "borrower");
    const activeTool = await addTool(owner.client, "Active");
    const returnedTool = await addTool(owner.client, "Returned");

    const active = await borrower.client.mutation(api.requests.create, {
      toolId: activeTool,
      ...DATES,
    });
    const returned = await borrower.client.mutation(api.requests.create, {
      toolId: returnedTool,
      ...DATES,
    });
    await owner.client.mutation(api.requests.approve, { requestId: active });
    await owner.client.mutation(api.requests.approve, { requestId: returned });
    await owner.client.mutation(api.requests.markReturned, {
      requestId: returned,
    });

    const activeLoans = await admin.client.query(api.admin.listLoans, {
      status: "approved",
      paginationOpts: FIRST_PAGE,
    });
    const returnedLoans = await admin.client.query(api.admin.listLoans, {
      status: "returned",
      paginationOpts: FIRST_PAGE,
    });

    expect(activeLoans.page).toEqual([
      expect.objectContaining({
        toolName: "Active",
        lenderName: "owner",
        borrowerName: "borrower",
      }),
    ]);
    expect(returnedLoans.page.map((loan) => loan.toolName)).toEqual([
      "Returned",
    ]);
    expect(JSON.stringify(activeLoans.page)).not.toContain("@example.com");
  });

  test("orders active loans by due date, most overdue first", async () => {
    const t = createTest();
    const admin = await addAdmin(t, "admin");
    const owner = await addUser(t, "owner");
    const borrower = await addUser(t, "borrower");
    const later = await addTool(owner.client, "Later");
    const sooner = await addTool(owner.client, "Sooner");

    for (const [toolId, endDate] of [
      [later, "2026-07-01"],
      [sooner, "2026-06-18"],
    ] as const) {
      const requestId = await borrower.client.mutation(api.requests.create, {
        toolId,
        startDate: "2026-06-16",
        endDate,
      });
      await owner.client.mutation(api.requests.approve, { requestId });
    }

    const { page } = await admin.client.query(api.admin.listLoans, {
      status: "approved",
      paginationOpts: FIRST_PAGE,
    });

    expect(page.map((loan) => loan.toolName)).toEqual(["Sooner", "Later"]);
  });
});

describe("admin.setTrustedLender", () => {
  test("sets and clears the badge", async () => {
    const t = createTest();
    const admin = await addAdmin(t, "admin");
    const lender = await addUser(t, "lender");
    const setTrusted = (isTrustedLender: boolean) =>
      admin.client.mutation(api.admin.setTrustedLender, {
        userId: lender.id,
        isTrustedLender,
      });

    await setTrusted(true);
    expect(await lender.client.query(api.users.me, {})).toMatchObject({
      isTrustedLender: true,
    });

    await setTrusted(false);
    expect(await lender.client.query(api.users.me, {})).toMatchObject({
      isTrustedLender: false,
    });
  });
});

describe("admin.listAutomation", () => {
  test("shows delivery events and workflow failures", async () => {
    const t = createTest();
    const admin = await addAdmin(t, "admin");
    const owner = await addUser(t, "owner");
    const borrower = await addUser(t, "borrower");
    const toolId = await addTool(owner.client, "Drill");
    await borrower.client.mutation(api.requests.create, { toolId, ...DATES });
    await t.run((ctx) =>
      ctx.db.insert("workflowFailures", {
        executionId: "1",
        workflowName: "Reminders",
        nodeName: "Fetch",
        message: "Timed out",
        occurredAt: Date.now(),
      }),
    );

    const { events, failures } = await admin.client.query(
      api.admin.listAutomation,
      {},
    );

    expect(events).toEqual([
      expect.objectContaining({
        toolName: "Drill",
        event: "request.created",
        status: "pending",
      }),
    ]);
    expect(failures).toEqual([
      expect.objectContaining({ workflowName: "Reminders" }),
    ]);
    expect(JSON.stringify(events)).not.toContain("@example.com");
  });
});
