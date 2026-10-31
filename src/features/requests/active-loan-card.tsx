"use client";

import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { ErrorMessage } from "@/components/error-message";
import { RequestCard, type RequestView } from "@/components/request-card";
import { buttonPrimary } from "@/lib/styles";
import { useAsyncAction } from "@/lib/use-async-action";

export function ActiveLoanCard({ request }: { request: RequestView }) {
  const markReturned = useMutation(api.requests.markReturned);
  const { run, isPending, error } = useAsyncAction();

  return (
    <RequestCard request={request} otherPartyLabel="Borrowed by">
      <ErrorMessage message={error} className="mt-2" />
      <button
        type="button"
        disabled={isPending}
        onClick={() => run(() => markReturned({ requestId: request._id }))}
        className={`${buttonPrimary} mt-4`}
      >
        {isPending ? "Saving…" : "Mark as returned"}
      </button>
    </RequestCard>
  );
}
