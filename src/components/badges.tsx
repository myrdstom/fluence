import type { ReactNode } from "react";
import { isOverdue } from "@/lib/dates";

const TONES = {
  success: "bg-success-surface text-success-ink",
  warning: "bg-warning-surface text-warning-ink",
  info: "bg-info-surface text-info-ink",
  danger: "bg-danger-surface text-danger-ink",
  neutral: "bg-neutral-surface text-neutral-ink",
} as const;

type Tone = keyof typeof TONES;

function Badge({ tone, children }: { tone: Tone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${TONES[tone]}`}
    >
      {children}
    </span>
  );
}

export function ToolStatusBadge({
  status,
}: {
  status: "available" | "on_loan";
}) {
  return status === "available" ? (
    <Badge tone="success">Available</Badge>
  ) : (
    <Badge tone="warning">On loan</Badge>
  );
}

export function TrustedLenderBadge() {
  return <Badge tone="info">Trusted Lender</Badge>;
}

export function OverdueBadge() {
  return <Badge tone="danger">Overdue</Badge>;
}

const REQUEST_STATUSES = {
  pending: { label: "Pending", tone: "warning" },
  approved: { label: "On loan", tone: "success" },
  declined: { label: "Declined", tone: "neutral" },
  cancelled: { label: "Cancelled", tone: "neutral" },
  returned: { label: "Returned", tone: "info" },
  closed: { label: "Closed", tone: "neutral" },
} as const satisfies Record<string, { label: string; tone: Tone }>;

export function RequestStatusBadge({
  status,
}: {
  status: keyof typeof REQUEST_STATUSES;
}) {
  const { label, tone } = REQUEST_STATUSES[status];
  return <Badge tone={tone}>{label}</Badge>;
}

/** A request's status, plus an overdue warning for late active loans. */
export function RequestBadges({
  request,
}: {
  request: { status: keyof typeof REQUEST_STATUSES; endDate: string };
}) {
  return (
    <>
      {isOverdue(request) && <OverdueBadge />}
      <RequestStatusBadge status={request.status} />
    </>
  );
}

const AUTOMATION_STATUSES = {
  pending: { label: "Sending", tone: "warning" },
  sent: { label: "Sent", tone: "success" },
  failed: { label: "Failed", tone: "danger" },
} as const satisfies Record<string, { label: string; tone: Tone }>;

export function AutomationStatusBadge({
  status,
}: {
  status: keyof typeof AUTOMATION_STATUSES;
}) {
  const { label, tone } = AUTOMATION_STATUSES[status];
  return <Badge tone={tone}>{label}</Badge>;
}
