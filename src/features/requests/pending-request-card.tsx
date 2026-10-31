"use client";

import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { ErrorMessage } from "@/components/error-message";
import { RequestCard, type RequestView } from "@/components/request-card";
import { buttonPrimary, buttonSecondary } from "@/lib/styles";
import { useAsyncAction } from "@/lib/use-async-action";

export function PendingRequestCard({ request }: { request: RequestView }) {
  const approve = useMutation(api.requests.approve);
  const decline = useMutation(api.requests.decline);
  const { run, isPending, error } = useAsyncAction();

  return (
    <RequestCard request={request} otherPartyLabel="Requested by">
      <ErrorMessage message={error} className="mt-2" />
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={isPending}
          onClick={() => run(() => approve({ requestId: request._id }))}
          className={buttonPrimary}
        >
          Approve
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => run(() => decline({ requestId: request._id }))}
          className={buttonSecondary}
        >
          Decline
        </button>
      </div>
    </RequestCard>
  );
}
