"use client";

import { useMutation, usePaginatedQuery, useQuery } from "convex/react";
import { LoadMore } from "@/components/load-more";
import { RequestCard, type RequestView } from "@/components/request-card";
import { buttonPrimary, buttonSecondary } from "@/lib/styles";
import { useAsyncAction } from "@/lib/use-async-action";
import { api } from "../../../../convex/_generated/api";

const HISTORY_PAGE_SIZE = 10;

function ActionError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="mt-2 text-sm text-red-700 dark:text-red-400">
      {message}
    </p>
  );
}

function PendingCard({ request }: { request: RequestView }) {
  const approve = useMutation(api.requests.approve);
  const decline = useMutation(api.requests.decline);
  const { run, isPending, error } = useAsyncAction();

  return (
    <RequestCard request={request} otherPartyLabel="Requested by">
      <ActionError message={error} />
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

function ActiveLoanCard({ request }: { request: RequestView }) {
  const markReturned = useMutation(api.requests.markReturned);
  const { run, isPending, error } = useAsyncAction();

  return (
    <RequestCard request={request} otherPartyLabel="Borrowed by">
      <ActionError message={error} />
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

function Section({
  title,
  isEmpty,
  emptyText,
  children,
}: {
  title: string;
  isEmpty: boolean;
  emptyText: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8">
      <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500">
        {title}
      </h2>
      {isEmpty ? (
        <p className="mt-3 text-sm text-zinc-500">{emptyText}</p>
      ) : (
        <ul className="mt-3 space-y-4">{children}</ul>
      )}
    </section>
  );
}

export default function IncomingPage() {
  const open = useQuery(api.requests.listIncomingOpen);
  const history = usePaginatedQuery(
    api.requests.listIncomingHistory,
    {},
    { initialNumItems: HISTORY_PAGE_SIZE },
  );

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Incoming requests</h1>
      {open === undefined ? (
        <p className="mt-6 text-sm text-zinc-500">Loading requests…</p>
      ) : (
        <>
          <Section
            title="Needs your decision"
            isEmpty={open.pending.length === 0}
            emptyText="Nothing waiting on you."
          >
            {open.pending.map((request) => (
              <li key={request._id}>
                <PendingCard request={request} />
              </li>
            ))}
          </Section>
          <Section
            title="Out on loan"
            isEmpty={open.active.length === 0}
            emptyText="None of your tools are out right now."
          >
            {open.active.map((request) => (
              <li key={request._id}>
                <ActiveLoanCard request={request} />
              </li>
            ))}
          </Section>
          <Section
            title="History"
            isEmpty={history.status !== "LoadingFirstPage" && history.results.length === 0}
            emptyText="Finished requests will appear here."
          >
            {history.results.map((request) => (
              <li key={request._id}>
                <RequestCard request={request} otherPartyLabel="Requested by" />
              </li>
            ))}
          </Section>
          <LoadMore
            status={history.status}
            onLoadMore={() => history.loadMore(HISTORY_PAGE_SIZE)}
          />
        </>
      )}
    </div>
  );
}
