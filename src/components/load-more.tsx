import { buttonSecondary } from "@/lib/styles";

export type PaginationStatus =
  "LoadingFirstPage" | "CanLoadMore" | "LoadingMore" | "Exhausted";

export function LoadMore({
  status,
  onLoadMore,
}: {
  status: PaginationStatus;
  onLoadMore: () => void;
}) {
  if (status !== "CanLoadMore" && status !== "LoadingMore") return null;
  return (
    <div className="mt-6 flex justify-center">
      <button
        type="button"
        onClick={onLoadMore}
        disabled={status === "LoadingMore"}
        className={buttonSecondary}
      >
        {status === "LoadingMore" ? "Loading…" : "Load more"}
      </button>
    </div>
  );
}
