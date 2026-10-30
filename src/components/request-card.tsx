import type { ReactNode } from "react";
import { OverdueBadge, RequestStatusBadge, TrustedLenderBadge } from "@/components/badges";
import { formatDateRange, isOverdue } from "@/lib/dates";
import { card } from "@/lib/styles";
import type { FunctionReturnType } from "convex/server";
import { api } from "../../convex/_generated/api";

export type RequestView = FunctionReturnType<
  typeof api.requests.listIncomingOpen
>["pending"][number];

export function RequestCard({
  request,
  otherPartyLabel,
  children,
}: {
  request: RequestView;
  otherPartyLabel: string;
  children?: ReactNode;
}) {
  const { otherParty } = request;
  return (
    <div className={card}>
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-medium">{request.toolName}</h3>
        <div className="flex flex-wrap justify-end gap-1">
          {isOverdue(request) && <OverdueBadge />}
          <RequestStatusBadge status={request.status} />
        </div>
      </div>
      <p className="mt-1 text-sm text-zinc-500">
        {formatDateRange(request.startDate, request.endDate)}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-zinc-500">
        {otherPartyLabel} {otherParty?.name ?? "a former member"}
        {otherParty?.isTrustedLender && <TrustedLenderBadge />}
      </div>
      {otherParty?.email && (
        <p className="mt-1 break-all text-sm">
          Arrange the handover: {otherParty.email}
        </p>
      )}
      {children}
    </div>
  );
}
