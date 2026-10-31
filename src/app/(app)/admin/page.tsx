"use client";

import { useMutation, usePaginatedQuery, useQuery } from "convex/react";
import { useState } from "react";
import {
  AutomationStatusBadge,
  OverdueBadge,
  RequestStatusBadge,
  ToolStatusBadge,
  TrustedLenderBadge,
} from "@/components/badges";
import { LoadMore } from "@/components/load-more";
import { formatDateRange, formatTimeAgo, isOverdue } from "@/lib/dates";
import { buttonDanger, buttonSecondary, card, pill } from "@/lib/styles";
import { useAsyncAction } from "@/lib/use-async-action";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { CATEGORY_LABELS } from "../../../../convex/lib/constants";

const PAGE_SIZE = 20;

const TABS = [
  { id: "loans", label: "Loans" },
  { id: "lenders", label: "Lenders" },
  { id: "listings", label: "Listings" },
  { id: "automation", label: "Automation" },
] as const;
type Tab = (typeof TABS)[number]["id"];

function ActionError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="mt-2 text-sm text-red-700 dark:text-red-400">
      {message}
    </p>
  );
}

function EmptyOrLoading({
  isLoading,
  emptyText,
}: {
  isLoading: boolean;
  emptyText: string;
}) {
  return (
    <p className="mt-6 text-sm text-zinc-500">
      {isLoading ? "Loading…" : emptyText}
    </p>
  );
}

function LoansTab() {
  const [status, setStatus] = useState<"approved" | "returned">("approved");
  const loans = usePaginatedQuery(
    api.admin.listLoans,
    { status },
    { initialNumItems: PAGE_SIZE },
  );

  return (
    <>
      <div
        role="group"
        aria-label="Filter loans"
        className="mt-6 flex flex-wrap gap-2"
      >
        <button
          type="button"
          aria-pressed={status === "approved"}
          onClick={() => setStatus("approved")}
          className={pill(status === "approved")}
        >
          Active
        </button>
        <button
          type="button"
          aria-pressed={status === "returned"}
          onClick={() => setStatus("returned")}
          className={pill(status === "returned")}
        >
          Returned
        </button>
      </div>
      {loans.results.length === 0 ? (
        <EmptyOrLoading
          isLoading={loans.status === "LoadingFirstPage"}
          emptyText={
            status === "approved"
              ? "No active loans."
              : "No returned loans yet."
          }
        />
      ) : (
        <ul className="mt-6 space-y-4">
          {loans.results.map((loan) => (
            <li key={loan._id} className={card}>
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-medium">{loan.toolName}</h2>
                <div className="flex flex-wrap justify-end gap-1">
                  {isOverdue(loan) && <OverdueBadge />}
                  <RequestStatusBadge status={loan.status} />
                </div>
              </div>
              <p className="mt-1 text-sm text-zinc-500">
                {formatDateRange(loan.startDate, loan.endDate)}
              </p>
              <p className="mt-2 text-sm">
                {loan.lenderName ?? "A former member"} lent to{" "}
                {loan.borrowerName ?? "a former member"}
              </p>
            </li>
          ))}
        </ul>
      )}
      <LoadMore
        status={loans.status}
        onLoadMore={() => loans.loadMore(PAGE_SIZE)}
      />
    </>
  );
}

function LenderRow({
  user,
}: {
  user: {
    _id: Id<"users">;
    name: string;
    email?: string;
    role: "user" | "admin";
    isTrustedLender: boolean;
  };
}) {
  const setTrustedLender = useMutation(api.admin.setTrustedLender);
  const { run, isPending, error } = useAsyncAction();

  return (
    <li className={card}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-medium">{user.name}</h2>
            {user.isTrustedLender && <TrustedLenderBadge />}
            {user.role === "admin" && (
              <span className="text-xs text-zinc-500">Admin</span>
            )}
          </div>
          {user.email && (
            <p className="mt-1 break-all text-sm text-zinc-500">{user.email}</p>
          )}
        </div>
        <button
          type="button"
          disabled={isPending}
          onClick={() =>
            run(() =>
              setTrustedLender({
                userId: user._id,
                isTrustedLender: !user.isTrustedLender,
              }),
            )
          }
          className={buttonSecondary}
        >
          {user.isTrustedLender
            ? "Remove Trusted Lender"
            : "Mark as Trusted Lender"}
        </button>
      </div>
      <ActionError message={error} />
    </li>
  );
}

function LendersTab() {
  const users = usePaginatedQuery(
    api.admin.listUsers,
    {},
    { initialNumItems: PAGE_SIZE },
  );
  return (
    <>
      {users.results.length === 0 ? (
        <EmptyOrLoading
          isLoading={users.status === "LoadingFirstPage"}
          emptyText="No users yet."
        />
      ) : (
        <ul className="mt-6 space-y-4">
          {users.results.map((user) => (
            <LenderRow key={user._id} user={user} />
          ))}
        </ul>
      )}
      <LoadMore
        status={users.status}
        onLoadMore={() => users.loadMore(PAGE_SIZE)}
      />
    </>
  );
}

function ListingRow({
  tool,
}: {
  tool: {
    _id: Id<"tools">;
    name: string;
    category: keyof typeof CATEGORY_LABELS;
    status: "available" | "on_loan";
    lender: { name: string } | null;
  };
}) {
  const removeTool = useMutation(api.tools.remove);
  const { run, isPending, error } = useAsyncAction();
  const [isConfirming, setIsConfirming] = useState(false);

  return (
    <li className={card}>
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-medium">{tool.name}</h2>
        <ToolStatusBadge status={tool.status} />
      </div>
      <p className="mt-1 text-sm text-zinc-500">
        {CATEGORY_LABELS[tool.category]} · Lent by{" "}
        {tool.lender?.name ?? "a former member"}
      </p>
      <ActionError message={error} />
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {isConfirming ? (
          <>
            <span className="text-sm">Remove this listing?</span>
            <button
              type="button"
              disabled={isPending}
              onClick={() =>
                run(async () => {
                  setIsConfirming(false);
                  await removeTool({ toolId: tool._id });
                })
              }
              className={buttonDanger}
            >
              Yes, remove
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => setIsConfirming(false)}
              className={buttonSecondary}
            >
              Keep
            </button>
          </>
        ) : (
          <button
            type="button"
            disabled={isPending}
            onClick={() => setIsConfirming(true)}
            className={buttonSecondary}
          >
            {isPending ? "Removing…" : "Remove listing"}
          </button>
        )}
      </div>
    </li>
  );
}

function ListingsTab() {
  const tools = usePaginatedQuery(
    api.tools.list,
    {},
    { initialNumItems: PAGE_SIZE },
  );
  return (
    <>
      {tools.results.length === 0 ? (
        <EmptyOrLoading
          isLoading={tools.status === "LoadingFirstPage"}
          emptyText="No listings yet."
        />
      ) : (
        <ul className="mt-6 space-y-4">
          {tools.results.map((tool) => (
            <ListingRow key={tool._id} tool={tool} />
          ))}
        </ul>
      )}
      <LoadMore
        status={tools.status}
        onLoadMore={() => tools.loadMore(PAGE_SIZE)}
      />
    </>
  );
}

function AutomationTab() {
  const automation = useQuery(api.admin.listAutomation);
  const [now] = useState(() => Date.now());

  if (automation === undefined) {
    return <EmptyOrLoading isLoading emptyText="" />;
  }
  const { failures, events } = automation;
  return (
    <>
      <h2 className="mt-6 text-sm font-medium uppercase tracking-wide text-zinc-500">
        Workflow failures
      </h2>
      {failures.length === 0 ? (
        <p className="mt-3 text-sm text-zinc-500">No failed workflow runs.</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {failures.map((failure) => (
            <li key={failure._id} className={card}>
              <h3 className="font-medium">{failure.workflowName}</h3>
              <p className="mt-1 text-sm text-zinc-500">
                {failure.nodeName} · {formatTimeAgo(failure.occurredAt, now)}
              </p>
              <p className="mt-2 break-words text-sm text-red-700 dark:text-red-400">
                {failure.message}
              </p>
            </li>
          ))}
        </ul>
      )}
      <h2 className="mt-8 text-sm font-medium uppercase tracking-wide text-zinc-500">
        Recent notifications and reminders
      </h2>
      {events.length === 0 ? (
        <p className="mt-3 text-sm text-zinc-500">Nothing has been sent yet.</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {events.map((event) => (
            <li key={event._id} className={card}>
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-medium">
                  {event.toolName ?? "Deleted request"}
                </h3>
                <AutomationStatusBadge status={event.status} />
              </div>
              <p className="mt-1 text-sm text-zinc-500">
                {event.event ?? "Overdue reminder"} ·{" "}
                {formatTimeAgo(event.occurredAt, now)}
                {event.attempts ? ` · ${event.attempts} attempt(s)` : ""}
              </p>
              {event.lastError && (
                <p className="mt-2 text-sm text-red-700 dark:text-red-400">
                  {event.lastError}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

export default function AdminPage() {
  const me = useQuery(api.users.me);
  const [tab, setTab] = useState<Tab>("loans");

  if (me === undefined) {
    return <p className="text-sm text-zinc-500">Loading…</p>;
  }
  if (me?.role !== "admin") {
    return (
      <section role="alert">
        <h1 className="text-2xl font-semibold tracking-tight">Admins only</h1>
        <p className="mt-2 text-sm text-zinc-500">
          You don&apos;t have access to this page.
        </p>
      </section>
    );
  }

  return (
    <section>
      <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
      <div
        role="group"
        aria-label="Admin sections"
        className="mt-4 flex flex-wrap gap-2 border-b border-zinc-200 pb-3 dark:border-zinc-800"
      >
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            aria-pressed={tab === id}
            onClick={() => setTab(id)}
            className={pill(tab === id)}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === "loans" && <LoansTab />}
      {tab === "lenders" && <LendersTab />}
      {tab === "listings" && <ListingsTab />}
      {tab === "automation" && <AutomationTab />}
    </section>
  );
}
