import { ConvexError, type Infer } from "convex/values";
import type { Doc } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { requestStatusValidator } from "./constants";

export type RequestStatus = Infer<typeof requestStatusValidator>;

const ALLOWED_TRANSITIONS: Record<RequestStatus, RequestStatus[]> = {
  pending: ["approved", "declined", "cancelled"],
  approved: ["returned"],
  declined: [],
  cancelled: [],
  returned: [],
};

/** The only place a request's status changes, so every change obeys the state machine. */
export async function setRequestStatus(
  ctx: MutationCtx,
  request: Doc<"borrowRequests">,
  status: RequestStatus,
) {
  if (!ALLOWED_TRANSITIONS[request.status].includes(status)) {
    throw new ConvexError(`This request is ${request.status}, so it can't be changed this way`);
  }
  await ctx.db.patch("borrowRequests", request._id, {
    status,
    ...(status === "returned" ? { returnedAt: Date.now() } : {}),
  });
}
