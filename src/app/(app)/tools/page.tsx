"use client";

import { usePaginatedQuery } from "convex/react";
import Link from "next/link";
import { useState } from "react";
import { ToolStatusBadge, TrustedLenderBadge } from "@/components/badges";
import { BorrowRequestForm } from "@/components/borrow-request-form";
import { LoadMore } from "@/components/load-more";
import { card, pill } from "@/lib/styles";
import { api } from "../../../../convex/_generated/api";
import {
  CATEGORIES,
  CATEGORY_LABELS,
  CONDITION_LABELS,
  type Category,
} from "../../../../convex/lib/constants";

const PAGE_SIZE = 24;

export default function ToolsPage() {
  const [category, setCategory] = useState<Category | undefined>();
  const { results, status, loadMore } = usePaginatedQuery(
    api.tools.list,
    { category },
    { initialNumItems: PAGE_SIZE },
  );

  return (
    <section>
      <h1 className="text-2xl font-semibold tracking-tight">All tools</h1>

      <div
        role="group"
        aria-label="Filter by category"
        className="mt-4 flex flex-wrap gap-2"
      >
        <button
          type="button"
          aria-pressed={category === undefined}
          onClick={() => setCategory(undefined)}
          className={pill(category === undefined)}
        >
          All
        </button>
        {CATEGORIES.map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={category === option}
            onClick={() => setCategory(option)}
            className={pill(category === option)}
          >
            {CATEGORY_LABELS[option]}
          </button>
        ))}
      </div>

      {status === "LoadingFirstPage" ? (
        <p className="mt-6 text-sm text-zinc-500">Loading tools…</p>
      ) : results.length === 0 ? (
        <p className="mt-6 text-sm text-zinc-500">
          {category
            ? `No ${CATEGORY_LABELS[category].toLowerCase()} tools listed yet.`
            : "No tools listed yet."}
        </p>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {results.map((tool) => (
            <li key={tool._id} className={card}>
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-medium">{tool.name}</h2>
                <ToolStatusBadge status={tool.status} />
              </div>
              <p className="mt-1 text-sm text-zinc-500">
                {CATEGORY_LABELS[tool.category]} ·{" "}
                {CONDITION_LABELS[tool.condition]} condition
              </p>
              <p className="mt-2 text-sm">{tool.description}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-zinc-500">
                {tool.isMine
                  ? "Your listing"
                  : `Lent by ${tool.lender?.name ?? "a neighbor"}`}
                {tool.lender?.isTrustedLender && <TrustedLenderBadge />}
              </div>
              {!tool.isMine && tool.status === "available" && (
                <div className="mt-4">
                  {tool.hasPendingRequest ? (
                    <p className="text-sm text-zinc-500">
                      Requested. Track it in{" "}
                      <Link href="/requests" className="underline">
                        My requests
                      </Link>
                      .
                    </p>
                  ) : (
                    <BorrowRequestForm toolId={tool._id} />
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <LoadMore status={status} onLoadMore={() => loadMore(PAGE_SIZE)} />
    </section>
  );
}
