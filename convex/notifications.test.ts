import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { api, internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { signHex } from "./lib/signature";
import { addTool, addUser, createTest, type TestConvex } from "./test.helpers";

const WEBHOOK_URL = "https://n8n.example.com/webhook/test";
const SECRET = "webhook-secret";

beforeEach(() => {
  vi.useFakeTimers({ now: new Date("2026-06-15T12:00:00Z") });
  vi.stubEnv("N8N_WEBHOOK_URL", WEBHOOK_URL);
  vi.stubEnv("N8N_WEBHOOK_SECRET", SECRET);
});
afterEach(() => {
  vi.useRealTimers();
});

/** A new request, which queues one notification for the tool's owner. */
async function setup() {
  const t = createTest();
  const owner = await addUser(t, "owner");
  const borrower = await addUser(t, "borrower");
  const toolId = await addTool(owner.client, "Drill");
  const requestId = await borrower.client.mutation(api.requests.create, {
    toolId,
    startDate: "2026-06-20",
    endDate: "2026-06-25",
  });
  const eventId = await t.run(async (ctx) => {
    const event = await ctx.db
      .query("automationEvents")
      .withIndex("by_requestId", (q) => q.eq("requestId", requestId))
      .unique();
    return event!._id;
  });
  return { t, eventId };
}

function getEvent(t: TestConvex, eventId: Id<"automationEvents">) {
  return t.run((ctx) => ctx.db.get("automationEvents", eventId));
}

function stubFetch(response: () => Promise<Response>) {
  const fetchMock = vi.fn(response);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("notifications.deliver", () => {
  test("posts a correctly signed payload and marks the event sent", async () => {
    const { t, eventId } = await setup();
    const fetchMock = stubFetch(async () => new Response("{}"));

    await t.action(internal.notifications.deliver, { eventId });

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0] as unknown as [
      string,
      { body: string; headers: Record<string, string> },
    ];
    expect(url).toBe(WEBHOOK_URL);
    const timestamp = init.headers["x-lendloop-timestamp"];
    expect(init.headers["x-lendloop-signature"]).toBe(
      await signHex(SECRET, `${timestamp}.${init.body}`),
    );
    expect(await getEvent(t, eventId)).toMatchObject({
      status: "sent",
      attempts: 1,
    });
  });

  test("sends only the fields the notification needs", async () => {
    const { t, eventId } = await setup();
    const fetchMock = stubFetch(async () => new Response("{}"));

    await t.action(internal.notifications.deliver, { eventId });

    const init = fetchMock.mock.calls[0] as unknown as [
      string,
      { body: string },
    ];
    expect(JSON.parse(init[1].body)).toEqual({
      eventId,
      event: "request.created",
      recipient: { name: "owner", email: "owner@example.com" },
      toolName: "Drill",
      startDate: "2026-06-20",
      endDate: "2026-06-25",
    });
  });

  test("schedules a retry after an error response", async () => {
    const { t, eventId } = await setup();
    stubFetch(async () => new Response("nope", { status: 502 }));

    await t.action(internal.notifications.deliver, { eventId });

    expect(await getEvent(t, eventId)).toMatchObject({
      status: "pending",
      attempts: 1,
      lastError: "HTTP 502",
    });
    const scheduled = await t.run((ctx) =>
      ctx.db.system.query("_scheduled_functions").collect(),
    );
    expect(
      scheduled.filter((job) => job.state.kind === "pending").length,
    ).toBeGreaterThan(0);
  });

  test("schedules a retry when n8n can't be reached", async () => {
    const { t, eventId } = await setup();
    stubFetch(async () => {
      throw new Error("connection refused");
    });

    await t.action(internal.notifications.deliver, { eventId });

    expect(await getEvent(t, eventId)).toMatchObject({
      status: "pending",
      lastError: "Could not reach n8n",
    });
  });

  test("gives up visibly after the last retry", async () => {
    const { t, eventId } = await setup();
    await t.run((ctx) =>
      ctx.db.patch("automationEvents", eventId, { attempts: 4 }),
    );
    stubFetch(async () => new Response("nope", { status: 500 }));
    vi.spyOn(console, "error").mockImplementation(() => {});

    await t.action(internal.notifications.deliver, { eventId });

    expect(await getEvent(t, eventId)).toMatchObject({
      status: "failed",
      attempts: 5,
      lastError: "HTTP 500",
    });
  });

  test("clears the error once a retry succeeds", async () => {
    const { t, eventId } = await setup();
    const responses = [
      new Response("nope", { status: 503 }),
      new Response("{}"),
    ];
    stubFetch(async () => responses.shift()!);

    await t.action(internal.notifications.deliver, { eventId });
    await t.action(internal.notifications.deliver, { eventId });

    const event = await getEvent(t, eventId);
    expect(event).toMatchObject({ status: "sent", attempts: 2 });
    expect(event?.lastError).toBeUndefined();
  });

  test("fails without retrying when the webhook isn't configured", async () => {
    const { t, eventId } = await setup();
    vi.stubEnv("N8N_WEBHOOK_URL", "");
    const fetchMock = stubFetch(async () => new Response("{}"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    await t.action(internal.notifications.deliver, { eventId });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(await getEvent(t, eventId)).toMatchObject({
      status: "failed",
      lastError: "n8n webhook is not configured",
    });
  });

  test("doesn't send an event twice once it has been delivered", async () => {
    const { t, eventId } = await setup();
    const fetchMock = stubFetch(async () => new Response("{}"));

    await t.action(internal.notifications.deliver, { eventId });
    await t.action(internal.notifications.deliver, { eventId });

    expect(fetchMock).toHaveBeenCalledOnce();
  });
});
