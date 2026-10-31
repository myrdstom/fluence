"use client";

import { usePaginatedQuery, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { ListSection } from "@/components/list-section";
import { LoadMore } from "@/components/load-more";
import { RequestCard } from "@/components/request-card";
import { StatusMessage } from "@/components/status-message";
import { ActiveLoanCard } from "@/features/requests/active-loan-card";
import { PendingRequestCard } from "@/features/requests/pending-request-card";
import { pageTitle } from "@/lib/styles";

const HISTORY_PAGE_SIZE = 10;

export default function IncomingPage() {
  const open = useQuery(api.requests.listIncomingOpen);
  const history = usePaginatedQuery(
    api.requests.listIncomingHistory,
    {},
    { initialNumItems: HISTORY_PAGE_SIZE },
  );

  return (
    <div>
      <h1 className={pageTitle}>Incoming requests</h1>
      {open === undefined ? (
        <StatusMessage>Loading requests…</StatusMessage>
      ) : (
        <>
          <ListSection
            title="Needs your decision"
            isEmpty={open.pending.length === 0}
            emptyText="Nothing waiting on you."
          >
            {open.pending.map((request) => (
              <li key={request._id}>
                <PendingRequestCard request={request} />
              </li>
            ))}
          </ListSection>
          <ListSection
            title="Out on loan"
            isEmpty={open.active.length === 0}
            emptyText="None of your tools are out right now."
          >
            {open.active.map((request) => (
              <li key={request._id}>
                <ActiveLoanCard request={request} />
              </li>
            ))}
          </ListSection>
          <ListSection
            title="History"
            isEmpty={
              history.status !== "LoadingFirstPage" &&
              history.results.length === 0
            }
            emptyText="Finished requests will appear here."
          >
            {history.results.map((request) => (
              <li key={request._id}>
                <RequestCard request={request} otherPartyLabel="Requested by" />
              </li>
            ))}
          </ListSection>
          <LoadMore
            status={history.status}
            onLoadMore={() => history.loadMore(HISTORY_PAGE_SIZE)}
          />
        </>
      )}
    </div>
  );
}
