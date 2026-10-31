import { internal } from "../_generated/api";
import type { Doc } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";

export type Recipient = "owner" | "borrower";

type NotifiableRequest = Pick<
  Doc<"borrowRequests">,
  "_id" | "ownerId" | "borrowerId"
>;

/**
 * Records the notification and schedules its delivery in the caller's
 * transaction, so a status change and its notification commit or fail together.
 */
export async function enqueueRequestNotification(
  ctx: MutationCtx,
  request: NotifiableRequest,
  event: string,
  recipient: Recipient,
) {
  const eventId = await ctx.db.insert("automationEvents", {
    requestId: request._id,
    kind: "request_notification",
    status: "pending",
    idempotencyKey: `${event}:${request._id}`,
    occurredAt: Date.now(),
    event,
    recipientId: recipient === "owner" ? request.ownerId : request.borrowerId,
    attempts: 0,
  });
  await ctx.scheduler.runAfter(0, internal.notifications.deliver, { eventId });
}
