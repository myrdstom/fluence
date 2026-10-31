"use client";

import { usePaginatedQuery } from "convex/react";
import Link from "next/link";
import { api } from "@convex/_generated/api";
import { PaginatedList } from "@/components/paginated-list";
import { MyRequestCard } from "@/features/requests/my-request-card";
import { pageTitle } from "@/lib/styles";

const PAGE_SIZE = 20;

export default function RequestsPage() {
  const requests = usePaginatedQuery(
    api.requests.listMine,
    {},
    { initialNumItems: PAGE_SIZE },
  );

  return (
    <section>
      <h1 className={pageTitle}>My requests</h1>
      <PaginatedList
        pagination={requests}
        pageSize={PAGE_SIZE}
        loadingText="Loading your requests…"
        emptyText={
          <>
            You haven&apos;t asked to borrow anything yet.{" "}
            <Link href="/tools" className="underline">
              Browse tools
            </Link>
            .
          </>
        }
        renderItem={(request) => (
          <li key={request._id}>
            <MyRequestCard request={request} />
          </li>
        )}
      />
    </section>
  );
}
