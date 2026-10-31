import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import {
  addAdmin,
  addTool,
  addUser,
  createTest,
  FIRST_PAGE,
  type TestConvex,
} from "./test.helpers";

// Fixed so date rules are deterministic. "Today" is 2026-06-15 UTC.
beforeEach(() => {
  vi.useFakeTimers({ now: new Date("2026-06-15T12:00:00Z") });
});
afterEach(() => {
  vi.useRealTimers();
});

const DATES = { startDate: "2026-06-20", endDate: "2026-06-25" };

/** An owner with a tool, a borrower, and a stranger. */
async function setup() {
  const t = createTest();
  const owner = await addUser(t, "owner");
  const borrower = await addUser(t, "borrower");
  const stranger = await addUser(t, "stranger");
  const toolId = await addTool(owner.client, "Drill");
  return { t, owner, borrower, stranger, toolId };
}

function getRequest(t: TestConvex, id: Id<"borrowRequests">) {
  return t.run((ctx) => ctx.db.get("borrowRequests", id));
}

function getTool(t: TestConvex, id: Id<"tools">) {
  return t.run((ctx) => ctx.db.get("tools", id));
}

function getEvents(t: TestConvex, requestId: Id<"borrowRequests">) {
  return t.run((ctx) =>
    ctx.db
      .query("automationEvents")
      .withIndex("by_requestId", (q) => q.eq("requestId", requestId))
      .collect(),
  );
}

describe("requests.create", () => {
  test("creates a pending request and notifies the owner", async () => {
    const { t, owner, borrower, toolId } = await setup();

    const id = await borrower.client.mutation(api.requests.create, {
      toolId,
      ...DATES,
    });

    expect(await getRequest(t, id)).toMatchObject({
      status: "pending",
      borrowerId: borrower.id,
      ownerId: owner.id,
      toolName: "Drill",
    });
    const [event, ...rest] = await getEvents(t, id);
    expect(rest).toEqual([]);
    expect(event).toMatchObject({
      kind: "request_notification",
      event: "request.created",
      recipientId: owner.id,
      status: "pending",
    });
  });

  test("requires sign-in", async () => {
    const { t, toolId } = await setup();
    await expect(
      t.mutation(api.requests.create, { toolId, ...DATES }),
    ).rejects.toThrow("Not authenticated");
  });

  test("rejects borrowing your own tool", async () => {
    const { owner, toolId } = await setup();
    await expect(
      owner.client.mutation(api.requests.create, { toolId, ...DATES }),
    ).rejects.toThrow("your own tool");
  });

  test("rejects a tool that is on loan", async () => {
    const { t, borrower, toolId } = await setup();
    await t.run((ctx) => ctx.db.patch("tools", toolId, { status: "on_loan" }));

    await expect(
      borrower.client.mutation(api.requests.create, { toolId, ...DATES }),
    ).rejects.toThrow("on loan");
  });

  test.each([
    ["an impossible date", "2026-02-31", "2026-03-01", "valid dates"],
    ["a malformed date", "soon", "2026-06-25", "valid dates"],
    ["an end before the start", "2026-06-25", "2026-06-20", "before the start"],
    ["a start in the past", "2026-06-01", "2026-06-25", "in the past"],
    ["a loan over 90 days", "2026-06-20", "2026-10-01", "up to 90 days"],
  ])("rejects %s", async (_label, startDate, endDate, message) => {
    const { borrower, toolId } = await setup();
    await expect(
      borrower.client.mutation(api.requests.create, {
        toolId,
        startDate,
        endDate,
      }),
    ).rejects.toThrow(message);
  });

  test("allows the UTC day before, for borrowers behind UTC", async () => {
    const { borrower, toolId } = await setup();
    await expect(
      borrower.client.mutation(api.requests.create, {
        toolId,
        startDate: "2026-06-14",
        endDate: "2026-06-16",
      }),
    ).resolves.toBeDefined();
  });

  test("rejects a second pending request for the same tool", async () => {
    const { borrower, toolId } = await setup();
    await borrower.client.mutation(api.requests.create, { toolId, ...DATES });

    await expect(
      borrower.client.mutation(api.requests.create, {
        toolId,
        startDate: "2026-07-01",
        endDate: "2026-07-02",
      }),
    ).rejects.toThrow("already have a pending request");
  });
});

describe("who can act on a request", () => {
  test("only the owner can approve or decline", async () => {
    const t = createTest();
    const owner = await addUser(t, "owner");
    const borrower = await addUser(t, "borrower");
    const stranger = await addUser(t, "stranger");
    const admin = await addAdmin(t, "admin");
    const toolId = await addTool(owner.client);
    const requestId = await borrower.client.mutation(api.requests.create, {
      toolId,
      ...DATES,
    });

    for (const { client } of [borrower, stranger, admin]) {
      await expect(
        client.mutation(api.requests.approve, { requestId }),
      ).rejects.toThrow("Not authorized");
      await expect(
        client.mutation(api.requests.decline, { requestId }),
      ).rejects.toThrow("Not authorized");
    }
    expect(await getRequest(t, requestId)).toMatchObject({ status: "pending" });
  });

  test("only the borrower can cancel", async () => {
    const { owner, borrower, stranger, toolId, t } = await setup();
    const requestId = await borrower.client.mutation(api.requests.create, {
      toolId,
      ...DATES,
    });

    for (const { client } of [owner, stranger]) {
      await expect(
        client.mutation(api.requests.cancel, { requestId }),
      ).rejects.toThrow("Not authorized");
    }
    await borrower.client.mutation(api.requests.cancel, { requestId });
    expect(await getRequest(t, requestId)).toMatchObject({
      status: "cancelled",
    });
  });

  test("only the lender can mark a loan returned", async () => {
    const t = createTest();
    const owner = await addUser(t, "owner");
    const borrower = await addUser(t, "borrower");
    const admin = await addAdmin(t, "admin");
    const toolId = await addTool(owner.client);
    const requestId = await borrower.client.mutation(api.requests.create, {
      toolId,
      ...DATES,
    });
    await owner.client.mutation(api.requests.approve, { requestId });

    for (const { client } of [borrower, admin]) {
      await expect(
        client.mutation(api.requests.markReturned, { requestId }),
      ).rejects.toThrow("Not authorized");
    }
  });
});

describe("requests.approve", () => {
  test("starts the loan and notifies the borrower", async () => {
    const { t, owner, borrower, toolId } = await setup();
    const requestId = await borrower.client.mutation(api.requests.create, {
      toolId,
      ...DATES,
    });

    await owner.client.mutation(api.requests.approve, { requestId });

    expect(await getRequest(t, requestId)).toMatchObject({
      status: "approved",
    });
    expect(await getTool(t, toolId)).toMatchObject({ status: "on_loan" });
    const events = await getEvents(t, requestId);
    expect(
      events.find((e) => e.event === "request.approved")?.recipientId,
    ).toBe(borrower.id);
  });

  test("declines overlapping requests and keeps the others pending", async () => {
    const { t, owner, borrower, stranger, toolId } = await setup();
    const third = await addUser(t, "third");
    const approved = await borrower.client.mutation(api.requests.create, {
      toolId,
      ...DATES,
    });
    const overlapping = await stranger.client.mutation(api.requests.create, {
      toolId,
      startDate: "2026-06-24",
      endDate: "2026-06-28",
    });
    const later = await third.client.mutation(api.requests.create, {
      toolId,
      startDate: "2026-07-10",
      endDate: "2026-07-12",
    });

    await owner.client.mutation(api.requests.approve, { requestId: approved });

    expect(await getRequest(t, overlapping)).toMatchObject({
      status: "declined",
    });
    expect(await getRequest(t, later)).toMatchObject({ status: "pending" });
    const events = await getEvents(t, overlapping);
    expect(
      events.find((e) => e.event === "request.declined")?.recipientId,
    ).toBe(stranger.id);
  });

  test("rejects a second loan while the tool is out", async () => {
    const { t, owner, borrower, stranger, toolId } = await setup();
    const first = await borrower.client.mutation(api.requests.create, {
      toolId,
      ...DATES,
    });
    const second = await stranger.client.mutation(api.requests.create, {
      toolId,
      startDate: "2026-07-10",
      endDate: "2026-07-12",
    });
    await owner.client.mutation(api.requests.approve, { requestId: first });

    await expect(
      owner.client.mutation(api.requests.approve, { requestId: second }),
    ).rejects.toThrow("already on loan");
    expect(await getRequest(t, second)).toMatchObject({ status: "pending" });
  });

  test("rejects a request whose dates have passed", async () => {
    const { t, owner, borrower, toolId } = await setup();
    const requestId = await borrower.client.mutation(api.requests.create, {
      toolId,
      ...DATES,
    });
    await t.run((ctx) =>
      ctx.db.patch("borrowRequests", requestId, {
        startDate: "2026-06-01",
        endDate: "2026-06-02",
      }),
    );

    await expect(
      owner.client.mutation(api.requests.approve, { requestId }),
    ).rejects.toThrow("dates have passed");
  });
});

describe("requests.decline and cancel", () => {
  test("decline notifies the borrower and leaves the tool available", async () => {
    const { t, owner, borrower, toolId } = await setup();
    const requestId = await borrower.client.mutation(api.requests.create, {
      toolId,
      ...DATES,
    });

    await owner.client.mutation(api.requests.decline, { requestId });

    expect(await getTool(t, toolId)).toMatchObject({ status: "available" });
    const events = await getEvents(t, requestId);
    expect(
      events.find((e) => e.event === "request.declined")?.recipientId,
    ).toBe(borrower.id);
  });

  test("cancel notifies the owner", async () => {
    const { t, owner, borrower, toolId } = await setup();
    const requestId = await borrower.client.mutation(api.requests.create, {
      toolId,
      ...DATES,
    });

    await borrower.client.mutation(api.requests.cancel, { requestId });

    const events = await getEvents(t, requestId);
    expect(
      events.find((e) => e.event === "request.cancelled")?.recipientId,
    ).toBe(owner.id);
  });
});

describe("requests.markReturned", () => {
  test("ends the loan, frees the tool, and notifies the borrower", async () => {
    const { t, owner, borrower, toolId } = await setup();
    const requestId = await borrower.client.mutation(api.requests.create, {
      toolId,
      ...DATES,
    });
    await owner.client.mutation(api.requests.approve, { requestId });

    await owner.client.mutation(api.requests.markReturned, { requestId });

    const request = await getRequest(t, requestId);
    expect(request?.status).toBe("returned");
    // convex-test can nudge its clock forward, so this can't be an exact match.
    expect(request?.returnedAt).toBeGreaterThanOrEqual(Date.now());
    expect(await getTool(t, toolId)).toMatchObject({ status: "available" });
    const events = await getEvents(t, requestId);
    expect(
      events.find((e) => e.event === "request.returned")?.recipientId,
    ).toBe(borrower.id);
  });
});

describe("the state machine", () => {
  test("rejects transitions that aren't allowed", async () => {
    const { owner, borrower, toolId } = await setup();
    const requestId = await borrower.client.mutation(api.requests.create, {
      toolId,
      ...DATES,
    });
    const { approve, decline, markReturned } = api.requests;

    await expect(
      owner.client.mutation(markReturned, { requestId }),
    ).rejects.toThrow("can't be changed");

    await owner.client.mutation(approve, { requestId });
    await expect(owner.client.mutation(decline, { requestId })).rejects.toThrow(
      "can't be changed",
    );
    await expect(
      borrower.client.mutation(api.requests.cancel, { requestId }),
    ).rejects.toThrow("Only a pending request");

    await owner.client.mutation(markReturned, { requestId });
    await expect(
      owner.client.mutation(markReturned, { requestId }),
    ).rejects.toThrow("can't be changed");
  });
});

describe("what each party can see", () => {
  async function emailsVisible(
    borrower: Awaited<ReturnType<typeof setup>>["borrower"],
    owner: Awaited<ReturnType<typeof setup>>["owner"],
  ) {
    const mine = await borrower.client.query(api.requests.listMine, {
      paginationOpts: FIRST_PAGE,
    });
    const open = await owner.client.query(api.requests.listIncomingOpen, {});
    const history = await owner.client.query(api.requests.listIncomingHistory, {
      paginationOpts: FIRST_PAGE,
    });
    return {
      toBorrower: mine.page[0].otherParty?.email,
      toOwner: [...open.pending, ...open.active, ...history.page][0].otherParty
        ?.email,
    };
  }

  test("emails are shared only during an active loan", async () => {
    const { owner, borrower, toolId } = await setup();
    const requestId = await borrower.client.mutation(api.requests.create, {
      toolId,
      ...DATES,
    });

    expect(await emailsVisible(borrower, owner)).toEqual({
      toBorrower: undefined,
      toOwner: undefined,
    });

    await owner.client.mutation(api.requests.approve, { requestId });
    expect(await emailsVisible(borrower, owner)).toEqual({
      toBorrower: "owner@example.com",
      toOwner: "borrower@example.com",
    });

    await owner.client.mutation(api.requests.markReturned, { requestId });
    expect(await emailsVisible(borrower, owner)).toEqual({
      toBorrower: undefined,
      toOwner: undefined,
    });
  });

  test("users see only their own requests", async () => {
    const { owner, borrower, stranger, toolId } = await setup();
    await borrower.client.mutation(api.requests.create, { toolId, ...DATES });

    const mine = await stranger.client.query(api.requests.listMine, {
      paginationOpts: FIRST_PAGE,
    });
    const incoming = await stranger.client.query(
      api.requests.listIncomingOpen,
      {},
    );

    expect(mine.page).toEqual([]);
    expect(incoming).toEqual({ pending: [], active: [] });
    const ownerOpen = await owner.client.query(
      api.requests.listIncomingOpen,
      {},
    );
    expect(ownerOpen.pending).toHaveLength(1);
  });

  test("incoming views split requests by what they need", async () => {
    const { owner, borrower, stranger, toolId } = await setup();
    const active = await borrower.client.mutation(api.requests.create, {
      toolId,
      ...DATES,
    });
    const declined = await stranger.client.mutation(api.requests.create, {
      toolId,
      startDate: "2026-07-10",
      endDate: "2026-07-12",
    });
    await owner.client.mutation(api.requests.decline, { requestId: declined });
    await owner.client.mutation(api.requests.approve, { requestId: active });

    const open = await owner.client.query(api.requests.listIncomingOpen, {});
    const history = await owner.client.query(api.requests.listIncomingHistory, {
      paginationOpts: FIRST_PAGE,
    });

    expect(open.pending).toEqual([]);
    expect(open.active.map((r) => r._id)).toEqual([active]);
    expect(history.page.map((r) => r._id)).toEqual([declined]);
  });

  test("includes recent automation activity", async () => {
    const { borrower, toolId } = await setup();
    await borrower.client.mutation(api.requests.create, { toolId, ...DATES });

    const { page } = await borrower.client.query(api.requests.listMine, {
      paginationOpts: FIRST_PAGE,
    });

    expect(page[0].activity).toEqual([
      expect.objectContaining({
        kind: "request_notification",
        status: "pending",
      }),
    ]);
  });
});
