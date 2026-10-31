const badge =
  "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium";

export function ToolStatusBadge({
  status,
}: {
  status: "available" | "on_loan";
}) {
  return status === "available" ? (
    <span
      className={`${badge} bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300`}
    >
      Available
    </span>
  ) : (
    <span
      className={`${badge} bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300`}
    >
      On loan
    </span>
  );
}

export function TrustedLenderBadge() {
  return (
    <span
      className={`${badge} bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300`}
    >
      Trusted Lender
    </span>
  );
}

const REQUEST_STATUS_STYLES = {
  pending: {
    label: "Pending",
    className:
      "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  },
  approved: {
    label: "On loan",
    className:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  },
  declined: {
    label: "Declined",
    className: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  },
  returned: {
    label: "Returned",
    className: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300",
  },
} as const;

export function RequestStatusBadge({
  status,
}: {
  status: keyof typeof REQUEST_STATUS_STYLES;
}) {
  const { label, className } = REQUEST_STATUS_STYLES[status];
  return <span className={`${badge} ${className}`}>{label}</span>;
}

export function OverdueBadge() {
  return (
    <span
      className={`${badge} bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300`}
    >
      Overdue
    </span>
  );
}

const AUTOMATION_STATUS_STYLES = {
  pending: {
    label: "Sending",
    className:
      "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  },
  sent: {
    label: "Sent",
    className:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  },
  failed: {
    label: "Failed",
    className: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  },
} as const;

export function AutomationStatusBadge({
  status,
}: {
  status: keyof typeof AUTOMATION_STATUS_STYLES;
}) {
  const { label, className } = AUTOMATION_STATUS_STYLES[status];
  return <span className={`${badge} ${className}`}>{label}</span>;
}
