import { v } from "convex/values";
import { internal } from "./_generated/api";
import {
  internalAction,
  internalMutation,
  internalQuery,
} from "./_generated/server";
import { signHex } from "./lib/signature/signature";

/** Wait before each retry. After the last one the event is marked failed. */
const RETRY_DELAYS_MS = [30_000, 2 * 60_000, 10 * 60_000, 30 * 60_000];
const REQUEST_TIMEOUT_MS = 15_000;

/** Builds the webhook payload: only what's needed to tell one person about one change. */
export const getDelivery = internalQuery({
  args: { eventId: v.id("automationEvents") },
  handler: async (ctx, { eventId }) => {
    const event = await ctx.db.get("automationEvents", eventId);
    if (!event || event.status !== "pending" || !event.recipientId) return null;
    const [request, recipient] = await Promise.all([
      ctx.db.get("borrowRequests", event.requestId),
      ctx.db.get("users", event.recipientId),
    ]);
    if (!request || !recipient?.email) return { payload: null };
    return {
      payload: {
        eventId,
        event: event.event,
        recipient: { name: recipient.name, email: recipient.email },
        toolName: request.toolName,
        startDate: request.startDate,
        endDate: request.endDate,
      },
    };
  },
});

export const recordAttempt = internalMutation({
  args: {
    eventId: v.id("automationEvents"),
    error: v.optional(v.string()),
    retryable: v.boolean(),
  },
  handler: async (ctx, { eventId, error, retryable }) => {
    const event = await ctx.db.get("automationEvents", eventId);
    if (!event) return;
    const attempts = (event.attempts ?? 0) + 1;

    if (!error) {
      await ctx.db.patch("automationEvents", eventId, {
        status: "sent",
        attempts,
        lastError: undefined,
      });
      return;
    }

    const retryDelay = retryable ? RETRY_DELAYS_MS[attempts - 1] : undefined;
    if (retryDelay !== undefined) {
      await ctx.db.patch("automationEvents", eventId, {
        attempts,
        lastError: error,
      });
      await ctx.scheduler.runAfter(retryDelay, internal.notifications.deliver, {
        eventId,
      });
      return;
    }
    await ctx.db.patch("automationEvents", eventId, {
      status: "failed",
      attempts,
      lastError: error,
    });
    console.error(
      `Notification ${eventId} failed after ${attempts} attempts: ${error}`,
    );
  },
});

/** At-least-once delivery. n8n gets a stable eventId to recognize a repeat. */
export const deliver = internalAction({
  args: { eventId: v.id("automationEvents") },
  handler: async (ctx, { eventId }): Promise<void> => {
    const fail = (error: string, retryable: boolean) =>
      ctx.runMutation(internal.notifications.recordAttempt, {
        eventId,
        error,
        retryable,
      });

    const delivery = await ctx.runQuery(internal.notifications.getDelivery, {
      eventId,
    });
    if (!delivery) return;
    if (!delivery.payload) {
      await fail("Recipient has no email address", false);
      return;
    }

    const url = process.env.N8N_WEBHOOK_URL;
    const secret = process.env.N8N_WEBHOOK_SECRET;
    if (!url || !secret) {
      await fail("n8n webhook is not configured", false);
      return;
    }

    const body = JSON.stringify(delivery.payload);
    const timestamp = String(Date.now());
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-lendloop-timestamp": timestamp,
          "x-lendloop-signature": await signHex(secret, `${timestamp}.${body}`),
        },
        body,
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      if (!response.ok) {
        await fail(`HTTP ${response.status}`, true);
        return;
      }
    } catch {
      await fail("Could not reach n8n", true);
      return;
    }
    await ctx.runMutation(internal.notifications.recordAttempt, {
      eventId,
      retryable: false,
    });
  },
});
