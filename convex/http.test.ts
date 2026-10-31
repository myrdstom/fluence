import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { api } from "./_generated/api";
import { signHex } from "./lib/signature/signature";
import { addTool, addUser, createTest, type TestConvex } from "./test.helpers";

const SECRET = "inbound-secret";
const TODAY = "2026-06-15";

beforeEach(() => {
  vi.useFakeTimers({ now: new Date(`${TODAY}T12:00:00Z`) });
  vi.stubEnv("CONVEX_INBOUND_SECRET", SECRET);
});
afterEach(() => {
  vi.useRealTimers();
});

async function signedFetch(
  t: TestConvex,
  method: "GET" | "POST",
  path: string,
  body = "",
  secret = SECRET,
) {
  const timestamp = String(Date.now());
  const signature = await signHex(
    secret,
    `${timestamp}.${method}.${path}.${body}`,
  );
  return t.fetch(path, {
    method,
    headers: {
      "x-lendloop-timestamp": timestamp,
      "x-lendloop-signature": signature,
    },
    ...(method === "POST" ? { body } : {}),
  });
}

async function setupOverdueLoan() {
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
      endDate: "2026-06-12",
    }),
  );
  return { t, loanId };
}

describe("every n8n endpoint", () => {
  test.each([
    ["GET", "/n8n/overdue-loans"],
    ["POST", "/n8n/reminder-status"],
    ["POST", "/n8n/workflow-failure"],
  ] as const)(
    "%s %s rejects unsigned and wrongly signed calls",
    async (method, path) => {
      const t = createTest();

      const unsigned = await t.fetch(path, { method });
      const wrongSecret = await signedFetch(t, method, path, "", "wrong");

      expect(unsigned.status).toBe(401);
      expect(wrongSecret.status).toBe(401);
    },
  );

  test("fails closed when the secret isn't configured", async () => {
    const t = createTest();
    vi.stubEnv("CONVEX_INBOUND_SECRET", "");
    vi.spyOn(console, "error").mockImplementation(() => {});

    const response = await signedFetch(t, "GET", "/n8n/overdue-loans");

    expect(response.status).toBe(503);
  });
});

describe("GET /n8n/overdue-loans", () => {
  test("returns overdue loans and the date they were checked", async () => {
    const { t, loanId } = await setupOverdueLoan();

    const response = await signedFetch(t, "GET", "/n8n/overdue-loans");

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      reminderDate: TODAY,
      loans: [expect.objectContaining({ loanId, daysOverdue: 3 })],
      continueCursor: expect.any(String),
      isDone: true,
    });
  });

  test("continues from a signed cursor", async () => {
    const { t } = await setupOverdueLoan();
    const first = await signedFetch(t, "GET", "/n8n/overdue-loans");
    const { continueCursor } = await first.json();

    const response = await signedFetch(
      t,
      "GET",
      `/n8n/overdue-loans?cursor=${encodeURIComponent(continueCursor)}`,
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ loans: [], isDone: true });
  });
});

describe("POST /n8n/reminder-status", () => {
  const path = "/n8n/reminder-status";

  test("records a reminder and treats a retry as a duplicate", async () => {
    const { t, loanId } = await setupOverdueLoan();
    const body = JSON.stringify({
      loanId,
      reminderDate: TODAY,
      status: "sent",
    });

    const first = await signedFetch(t, "POST", path, body);
    const retry = await signedFetch(t, "POST", path, body);

    expect(await first.json()).toEqual({ outcome: "recorded" });
    expect(await retry.json()).toEqual({ outcome: "duplicate" });
  });

  test.each([
    ["invalid JSON", "not json"],
    ["an array", "[]"],
    ["no loan ID", JSON.stringify({ reminderDate: TODAY, status: "sent" })],
    [
      "a bad date",
      JSON.stringify({ loanId: "x", reminderDate: "soon", status: "sent" }),
    ],
    [
      "a bad status",
      JSON.stringify({ loanId: "x", reminderDate: TODAY, status: "maybe" }),
    ],
  ])("rejects %s with a 400", async (_label, body) => {
    const t = createTest();
    const response = await signedFetch(t, "POST", path, body);
    expect(response.status).toBe(400);
  });

  test("returns a 404 for an unknown loan", async () => {
    const t = createTest();
    const body = JSON.stringify({
      loanId: "unknown",
      reminderDate: TODAY,
      status: "sent",
    });

    const response = await signedFetch(t, "POST", path, body);

    expect(response.status).toBe(404);
  });
});

describe("POST /n8n/workflow-failure", () => {
  const path = "/n8n/workflow-failure";

  test("records a failure once and caps long messages", async () => {
    const t = createTest();
    const body = JSON.stringify({
      executionId: "42",
      workflowName: "Reminders",
      nodeName: "Fetch",
      message: "x".repeat(2000),
    });

    const first = await signedFetch(t, "POST", path, body);
    const retry = await signedFetch(t, "POST", path, body);

    expect(await first.json()).toEqual({ outcome: "recorded" });
    expect(await retry.json()).toEqual({ outcome: "duplicate" });
    const [failure] = await t.run((ctx) =>
      ctx.db.query("workflowFailures").collect(),
    );
    expect(failure.message).toHaveLength(500);
  });

  test("rejects a body with missing fields", async () => {
    const t = createTest();
    const response = await signedFetch(
      t,
      "POST",
      path,
      JSON.stringify({ executionId: "42" }),
    );
    expect(response.status).toBe(400);
  });
});
