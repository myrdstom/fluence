"use client";

import { useQuery } from "convex/react";
import { useState } from "react";
import { api } from "@convex/_generated/api";
import { AutomationStatusBadge } from "@/components/badges";
import { CardHeader } from "@/components/card-header";
import { ListSection } from "@/components/list-section";
import { StatusMessage } from "@/components/status-message";
import { formatTimeAgo } from "@/lib/dates/dates";
import { card, dangerText, mutedText } from "@/lib/styles";

export function AutomationTab() {
  const automation = useQuery(api.admin.listAutomation);
  const [now] = useState(() => Date.now());

  if (automation === undefined) {
    return <StatusMessage>Loading…</StatusMessage>;
  }
  const { failures, events } = automation;
  return (
    <>
      <ListSection
        title="Workflow failures"
        isEmpty={failures.length === 0}
        emptyText="No failed workflow runs."
        className="mt-6"
        listClassName="space-y-3"
      >
        {failures.map((failure) => (
          <li key={failure._id} className={card}>
            <h3 className="font-medium">{failure.workflowName}</h3>
            <p className={`mt-1 ${mutedText}`}>
              {failure.nodeName} · {formatTimeAgo(failure.occurredAt, now)}
            </p>
            <p className={`mt-2 break-words ${dangerText}`}>
              {failure.message}
            </p>
          </li>
        ))}
      </ListSection>
      <ListSection
        title="Recent notifications and reminders"
        isEmpty={events.length === 0}
        emptyText="Nothing has been sent yet."
        listClassName="space-y-3"
      >
        {events.map((event) => (
          <li key={event._id} className={card}>
            <CardHeader title={event.toolName ?? "Deleted request"} as="h3">
              <AutomationStatusBadge status={event.status} />
            </CardHeader>
            <p className={`mt-1 ${mutedText}`}>
              {event.event ?? "Overdue reminder"} ·{" "}
              {formatTimeAgo(event.occurredAt, now)}
              {event.attempts ? ` · ${event.attempts} attempt(s)` : ""}
            </p>
            {event.lastError && (
              <p className={`mt-2 ${dangerText}`}>{event.lastError}</p>
            )}
          </li>
        ))}
      </ListSection>
    </>
  );
}
