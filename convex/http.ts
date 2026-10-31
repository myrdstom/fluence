import { httpRouter } from "convex/server";
import { internal } from "./_generated/api";
import { httpAction, type ActionCtx } from "./_generated/server";
import { isCalendarDate, utcDate } from "./lib/dates/dates";
import { verifyInboundRequest } from "./lib/signature/signature";

const MAX_TEXT_LENGTH = 500;
const OVERDUE_PAGE_SIZE = 100;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

/** Wraps a handler so it only runs for correctly signed requests. */
function signedAction(
  handler: (
    ctx: ActionCtx,
    body: string,
    request: Request,
  ) => Promise<Response>,
) {
  return httpAction(async (ctx, request) => {
    const secret = process.env.CONVEX_INBOUND_SECRET;
    if (!secret) {
      console.error("CONVEX_INBOUND_SECRET is not set");
      return json({ error: "Not configured" }, 503);
    }
    const body = await request.text();
    if (!(await verifyInboundRequest(request, body, secret))) {
      return json({ error: "Invalid signature" }, 401);
    }
    return handler(ctx, body, request);
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseObject(body: string): Record<string, unknown> | null {
  try {
    const parsed: unknown = JSON.parse(body);
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function boundedText(value: unknown) {
  return typeof value === "string" && value.length > 0
    ? value.slice(0, MAX_TEXT_LENGTH)
    : null;
}

const http = httpRouter();

http.route({
  path: "/n8n/overdue-loans",
  method: "GET",
  handler: signedAction(async (ctx, _body, request) => {
    const today = utcDate(Date.now());
    const { page, continueCursor, isDone } = await ctx.runQuery(
      internal.reminders.listOverdue,
      {
        today,
        paginationOpts: {
          numItems: OVERDUE_PAGE_SIZE,
          cursor: new URL(request.url).searchParams.get("cursor"),
        },
      },
    );
    return json({ reminderDate: today, loans: page, continueCursor, isDone });
  }),
});

http.route({
  path: "/n8n/reminder-status",
  method: "POST",
  handler: signedAction(async (ctx, rawBody) => {
    const body = parseObject(rawBody);
    const loanId = boundedText(body?.loanId);
    const reminderDate = boundedText(body?.reminderDate);
    const status = body?.status;
    if (
      !loanId ||
      !reminderDate ||
      !isCalendarDate(reminderDate) ||
      (status !== "sent" && status !== "failed")
    ) {
      return json({ error: "Invalid body" }, 400);
    }
    const result = await ctx.runMutation(internal.reminders.recordReminder, {
      loanId,
      reminderDate,
      status,
    });
    return json(result, result.outcome === "not_found" ? 404 : 200);
  }),
});

http.route({
  path: "/n8n/workflow-failure",
  method: "POST",
  handler: signedAction(async (ctx, rawBody) => {
    const body = parseObject(rawBody);
    const executionId = boundedText(body?.executionId);
    const workflowName = boundedText(body?.workflowName);
    const nodeName = boundedText(body?.nodeName);
    const message = boundedText(body?.message);
    if (!executionId || !workflowName || !nodeName || !message) {
      return json({ error: "Invalid body" }, 400);
    }
    const result = await ctx.runMutation(
      internal.reminders.recordWorkflowFailure,
      {
        executionId,
        workflowName,
        nodeName,
        message,
      },
    );
    return json(result);
  }),
});

export default http;
