"use client";

import { useState, type ReactNode } from "react";
import type { FunctionReturnType } from "convex/server";
import type { api } from "@convex/_generated/api";
import { RequestBadges, TrustedLenderBadge } from "@/components/badges";
import { CardHeader } from "@/components/card-header";
import { formatDateRange, formatTimeAgo } from "@/lib/dates/dates";
import { card, mutedText } from "@/lib/styles";

export type RequestView = FunctionReturnType<
  typeof api.requests.listIncomingOpen
>["pending"][number];

const ACTIVITY_LABELS = {
  request_notification: {
    pending: "Notification sending",
    sent: "Notification sent",
    failed: "Notification failed",
  },
  overdue_reminder: {
    pending: "Reminder sending",
    sent: "Reminder sent",
    failed: "Reminder failed",
  },
} as const;

function AutomationActivity({
  activity,
}: {
  activity: RequestView["activity"];
}) {
  const [now] = useState(() => Date.now());
  if (activity.length === 0) return null;
  return (
    <ul className="mt-3 space-y-0.5 border-t border-line pt-2 text-xs text-muted">
      {activity.map(({ _id, kind, status, occurredAt }) => (
        <li key={_id}>
          {ACTIVITY_LABELS[kind][status]} {formatTimeAgo(occurredAt, now)}
        </li>
      ))}
    </ul>
  );
}

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
      <CardHeader title={request.toolName} as="h3">
        <RequestBadges request={request} />
      </CardHeader>
      <p className={`mt-1 ${mutedText}`}>
        {formatDateRange(request.startDate, request.endDate)}
      </p>
      <div className={`mt-2 flex flex-wrap items-center gap-2 ${mutedText}`}>
        {otherPartyLabel} {otherParty?.name ?? "a former member"}
        {otherParty?.isTrustedLender && <TrustedLenderBadge />}
      </div>
      {otherParty?.email && (
        <p className="mt-1 break-all text-sm">
          Arrange the handover: {otherParty.email}
        </p>
      )}
      <AutomationActivity activity={request.activity} />
      {children}
    </div>
  );
}
