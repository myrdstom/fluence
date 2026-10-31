import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { api, internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { addTool, addUser, createTest, type TestConvex } from "./test.helpers";

const TODAY = "2026-06-15";

beforeEach(() => {
  vi.useFakeTimers({ now: new Date(`${TODAY}T12:00:00Z`) });
});
afterEach(() => {
  vi.useRealTimers();
});

/** A loan whose due date is `endDate`, set directly so it can be in the past. */
async function setupLoan(endDate = "2026-06-12") {
  const t = createTest();
  const owner = await addUser(t, "owner");
  const borrower = await addUser(t, "borrower");
  const toolId = await addTool(owner.client, "Drill");
  const loanId = await borrower.client.mutation(api.requests.create, {
    toolId,
    startDate: TODAY,
    endDate: "2026-06-20",
  });
  await owner.client.mutation(api.requests.approve, { requestId: loanId });
  await t.run((ctx) =>
    ctx.db.patch("borrowRequests", loanId, {
      startDate: "2026-06-01",
      endDate,
    }),
  );
  return { t, owner, loanId };
}

function getReminders(t: TestConvex, requestId: Id<"borrowRequests">) {
  return t.run(async (ctx) => {
    const events = await ctx.db
      .query("automationEvents")
      .withIndex("by_requestId", (q) => q.eq("requestId", requestId))
      .collect();
    return events.filter((event) => event.kind === "overdue_reminder");
  });
}

describe("reminders.listOverdue", () => {
  test("returns overdue loans with only the fields a reminder needs", async () => {
    const { t, loanId } = await setupLoan();

    const loans = await t.query(internal.reminders.listOverdue, {
      today: TODAY,
    });

    expect(loans).toEqual([
      {
        loanId,
        toolName: "Drill",
        dueDate: "2026-06-12",
        daysOverdue: 3,
        borrower: { name: "borrower", email: "borrower@example.com" },
      },
    ]);
  });

  test("skips loans due today or later", async () => {
    const { t } = await setupLoan(TODAY);
    expect(
      await t.query(internal.reminders.listOverdue, { today: TODAY }),
    ).toEqual([]);
  });

  test("skips returned loans", async () => {
    const { t, owner, loanId } = await setupLoan();
    await owner.client.mutation(api.requests.markReturned, {
      requestId: loanId,
    });
    expect(
      await t.query(internal.reminders.listOverdue, { today: TODAY }),
    ).toEqual([]);
  });

  test("skips loans already reminded today, but not on later days", async () => {
    const { t, loanId } = await setupLoan();
    await t.mutation(internal.reminders.recordReminder, {
      loanId,
      reminderDate: TODAY,
      status: "sent",
    });

    expect(
      await t.query(internal.reminders.listOverdue, { today: TODAY }),
    ).toEqual([]);
    expect(
      await t.query(internal.reminders.listOverdue, { today: "2026-06-16" }),
    ).toHaveLength(1);
  });

  test("retries a loan whose reminder failed today", async () => {
    const { t, loanId } = await setupLoan();
    await t.mutation(internal.reminders.recordReminder, {
      loanId,
      reminderDate: TODAY,
      status: "failed",
    });

    expect(
      await t.query(internal.reminders.listOverdue, { today: TODAY }),
    ).toHaveLength(1);
  });
});

describe("reminders.recordReminder", () => {
  const record = (
    t: TestConvex,
    loanId: string,
    status: "sent" | "failed",
    reminderDate = TODAY,
  ) =>
    t.mutation(internal.reminders.recordReminder, {
      loanId,
      reminderDate,
      status,
    });

  test("records once, however many times it's retried", async () => {
    const { t, loanId } = await setupLoan();

    expect(await record(t, loanId, "sent")).toEqual({ outcome: "recorded" });
    expect(await record(t, loanId, "sent")).toEqual({ outcome: "duplicate" });
    expect(await record(t, loanId, "sent")).toEqual({ outcome: "duplicate" });

    expect(await getReminders(t, loanId)).toHaveLength(1);
  });

  test("records one reminder per day", async () => {
    const { t, loanId } = await setupLoan();

    await record(t, loanId, "sent", TODAY);
    await record(t, loanId, "sent", "2026-06-16");

    expect(await getReminders(t, loanId)).toHaveLength(2);
  });

  test("a later success replaces a failure", async () => {
    const { t, loanId } = await setupLoan();

    await record(t, loanId, "failed");
    expect(await record(t, loanId, "sent")).toEqual({ outcome: "recorded" });

    const reminders = await getReminders(t, loanId);
    expect(reminders.map((reminder) => reminder.status)).toEqual(["sent"]);
  });

  test("a late failure can't undo a sent reminder", async () => {
    const { t, loanId } = await setupLoan();

    await record(t, loanId, "sent");
    expect(await record(t, loanId, "failed")).toEqual({ outcome: "duplicate" });

    const reminders = await getReminders(t, loanId);
    expect(reminders.map((reminder) => reminder.status)).toEqual(["sent"]);
  });

  test("reports an unknown or malformed loan ID", async () => {
    const t = createTest();
    expect(await record(t, "not-a-real-id", "sent")).toEqual({
      outcome: "not_found",
    });
  });
});

describe("reminders.recordWorkflowFailure", () => {
  test("records a failed execution only once", async () => {
    const t = createTest();
    const failure = {
      executionId: "42",
      workflowName: "Reminders",
      nodeName: "Fetch",
      message: "Timed out",
    };

    expect(
      await t.mutation(internal.reminders.recordWorkflowFailure, failure),
    ).toEqual({ outcome: "recorded" });
    expect(
      await t.mutation(internal.reminders.recordWorkflowFailure, failure),
    ).toEqual({ outcome: "duplicate" });

    const failures = await t.run((ctx) =>
      ctx.db.query("workflowFailures").collect(),
    );
    expect(failures).toHaveLength(1);
  });
});
