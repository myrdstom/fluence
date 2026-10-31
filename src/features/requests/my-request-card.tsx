"use client";

import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { ErrorMessage } from "@/components/error-message";
import { RequestCard, type RequestView } from "@/components/request-card";
import { buttonSecondary } from "@/lib/styles";
import { useAsyncAction } from "@/lib/use-async-action";

export function MyRequestCard({ request }: { request: RequestView }) {
  const cancelRequest = useMutation(api.requests.cancel);
  const { run, isPending, error } = useAsyncAction();

  return (
    <RequestCard request={request} otherPartyLabel="Lent by">
      <ErrorMessage message={error} className="mt-2" />
      {request.status === "pending" && (
        <button
          type="button"
          disabled={isPending}
          onClick={() => run(() => cancelRequest({ requestId: request._id }))}
          className={`${buttonSecondary} mt-4`}
        >
          {isPending ? "Cancelling…" : "Cancel request"}
        </button>
      )}
    </RequestCard>
  );
}
