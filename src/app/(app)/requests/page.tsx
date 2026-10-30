"use client";

import { useMutation, usePaginatedQuery } from "convex/react";
import Link from "next/link";
import { LoadMore } from "@/components/load-more";
import { RequestCard, type RequestView } from "@/components/request-card";
import { buttonSecondary } from "@/lib/styles";
import { useAsyncAction } from "@/lib/use-async-action";
import { api } from "../../../../convex/_generated/api";

const PAGE_SIZE = 20;

function MyRequestCard({ request }: { request: RequestView }) {
  const cancelRequest = useMutation(api.requests.cancel);
  const { run, isPending, error } = useAsyncAction();

  return (
    <RequestCard request={request} otherPartyLabel="Lent by">
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-700 dark:text-red-400">
          {error}
        </p>
      )}
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

export default function RequestsPage() {
  const { results, status, loadMore } = usePaginatedQuery(
    api.requests.listMine,
    {},
    { initialNumItems: PAGE_SIZE },
  );

  return (
    <section>
      <h1 className="text-2xl font-semibold tracking-tight">My requests</h1>
      {status === "LoadingFirstPage" ? (
        <p className="mt-6 text-sm text-zinc-500">Loading your requests…</p>
      ) : results.length === 0 ? (
        <p className="mt-6 text-sm text-zinc-500">
          You haven&apos;t asked to borrow anything yet.{" "}
          <Link href="/tools" className="underline">
            Browse tools
          </Link>
          .
        </p>
      ) : (
        <ul className="mt-6 space-y-4">
          {results.map((request) => (
            <li key={request._id}>
              <MyRequestCard request={request} />
            </li>
          ))}
        </ul>
      )}
      <LoadMore status={status} onLoadMore={() => loadMore(PAGE_SIZE)} />
    </section>
  );
}
