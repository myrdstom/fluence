import { ConvexError, type Infer } from "convex/values";
import type { Doc } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { requestStatusValidator } from "./constants";
import { enqueueRequestNotification, type Recipient } from "./notifications";

export type RequestStatus = Infer<typeof requestStatusValidator>;

const ALLOWED_TRANSITIONS: Record<RequestStatus, RequestStatus[]> = {
  pending: ["approved", "declined", "cancelled"],
  approved: ["returned"],
  declined: [],
  cancelled: [],
  returned: [],
};

/** Who hears about each change by default: the person who didn't make it. */
const DEFAULT_RECIPIENTS: Record<RequestStatus, Recipient> = {
  pending: "owner",
  approved: "borrower",
  declined: "borrower",
  cancelled: "owner",
  returned: "borrower",
};

/**
 * The only place a request's status changes, so every change obeys the state
 * machine and notifies someone. The notification commits with the status.
 */
export async function setRequestStatus(
  ctx: MutationCtx,
  request: Doc<"borrowRequests">,
  status: RequestStatus,
  recipient: Recipient = DEFAULT_RECIPIENTS[status],
) {
  if (!ALLOWED_TRANSITIONS[request.status].includes(status)) {
    throw new ConvexError(
      `This request is ${request.status}, so it can't be changed this way`,
    );
  }
  await ctx.db.patch("borrowRequests", request._id, {
    status,
    ...(status === "returned" ? { returnedAt: Date.now() } : {}),
  });
  await enqueueRequestNotification(
    ctx,
    request,
    `request.${status}`,
    recipient,
  );
}
