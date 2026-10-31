import type { ReactNode } from "react";
import { LoadMore, type PaginationStatus } from "@/components/load-more";
import { StatusMessage } from "@/components/status-message";

/** Renders one page-at-a-time list with its loading, empty and "Load more" states. */
export function PaginatedList<T>({
  pagination: { results, status, loadMore },
  pageSize,
  loadingText = "Loading…",
  emptyText,
  listClassName = "mt-6 space-y-4",
  renderItem,
}: {
  pagination: {
    results: T[];
    status: PaginationStatus;
    loadMore: (numItems: number) => void;
  };
  pageSize: number;
  loadingText?: string;
  emptyText: ReactNode;
  listClassName?: string;
  renderItem: (item: T) => ReactNode;
}) {
  let content: ReactNode;
  if (status === "LoadingFirstPage") {
    content = <StatusMessage>{loadingText}</StatusMessage>;
  } else if (results.length === 0) {
    content = emptyText && <StatusMessage>{emptyText}</StatusMessage>;
  } else {
    content = <ul className={listClassName}>{results.map(renderItem)}</ul>;
  }

  return (
    <>
      {content}
      <LoadMore status={status} onLoadMore={() => loadMore(pageSize)} />
    </>
  );
}
