"use client";

import { useMutation, usePaginatedQuery } from "convex/react";
import { useState } from "react";
import { ToolStatusBadge } from "@/components/badges";
import { LoadMore } from "@/components/load-more";
import { ToolForm } from "@/components/tool-form";
import { getErrorMessage } from "@/lib/errors";
import { buttonDanger, buttonPrimary, buttonSecondary, card } from "@/lib/styles";
import { api } from "../../../../convex/_generated/api";
import type { Doc, Id } from "../../../../convex/_generated/dataModel";
import { CATEGORY_LABELS, CONDITION_LABELS } from "../../../../convex/lib/constants";

const PAGE_SIZE = 20;

function ListingCard({
  tool,
  onEdit,
}: {
  tool: Doc<"tools">;
  onEdit: () => void;
}) {
  const removeTool = useMutation(api.tools.remove);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setError(null);
    setIsDeleting(true);
    try {
      await removeTool({ toolId: tool._id });
    } catch (deleteError) {
      setError(getErrorMessage(deleteError));
      setIsDeleting(false);
      setIsConfirming(false);
    }
  }

  return (
    <div className={card}>
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-medium">{tool.name}</h2>
        <ToolStatusBadge status={tool.status} />
      </div>
      <p className="mt-1 text-sm text-zinc-500">
        {CATEGORY_LABELS[tool.category]} · {CONDITION_LABELS[tool.condition]} condition
      </p>
      <p className="mt-2 text-sm">{tool.description}</p>
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-700 dark:text-red-400">
          {error}
        </p>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {isConfirming ? (
          <>
            <span className="text-sm">Delete this listing?</span>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className={buttonDanger}
            >
              {isDeleting ? "Deleting…" : "Yes, delete"}
            </button>
            <button
              type="button"
              onClick={() => setIsConfirming(false)}
              disabled={isDeleting}
              className={buttonSecondary}
            >
              Keep
            </button>
          </>
        ) : (
          <>
            <button type="button" onClick={onEdit} className={buttonSecondary}>
              Edit
            </button>
            <button
              type="button"
              onClick={() => setIsConfirming(true)}
              className={buttonSecondary}
            >
              Delete
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function ListingsPage() {
  const { results, status, loadMore } = usePaginatedQuery(
    api.tools.listMine,
    {},
    { initialNumItems: PAGE_SIZE },
  );
  const createTool = useMutation(api.tools.create);
  const updateTool = useMutation(api.tools.update);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<Id<"tools"> | null>(null);

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">My listings</h1>
        {!isCreating && (
          <button
            type="button"
            onClick={() => {
              setEditingId(null);
              setIsCreating(true);
            }}
            className={buttonPrimary}
          >
            List a tool
          </button>
        )}
      </div>

      {isCreating && (
        <div className="mt-6">
          <ToolForm
            title="List a tool"
            submitLabel="List tool"
            onCancel={() => setIsCreating(false)}
            onSubmit={async (values) => {
              await createTool(values);
              setIsCreating(false);
            }}
          />
        </div>
      )}

      {status === "LoadingFirstPage" ? (
        <p className="mt-6 text-sm text-zinc-500">Loading your listings…</p>
      ) : results.length === 0 ? (
        !isCreating && (
          <p className="mt-6 text-sm text-zinc-500">
            You haven&apos;t listed any tools yet. What could a neighbor borrow from you?
          </p>
        )
      ) : (
        <ul className="mt-6 space-y-4">
          {results.map((tool) => (
            <li key={tool._id}>
              {editingId === tool._id ? (
                <ToolForm
                  title={`Edit ${tool.name}`}
                  submitLabel="Save changes"
                  initialValues={{
                    name: tool.name,
                    category: tool.category,
                    condition: tool.condition,
                    description: tool.description,
                  }}
                  onCancel={() => setEditingId(null)}
                  onSubmit={async (values) => {
                    await updateTool({ toolId: tool._id, ...values });
                    setEditingId(null);
                  }}
                />
              ) : (
                <ListingCard
                  tool={tool}
                  onEdit={() => {
                    setIsCreating(false);
                    setEditingId(tool._id);
                  }}
                />
              )}
            </li>
          ))}
        </ul>
      )}

      <LoadMore status={status} onLoadMore={() => loadMore(PAGE_SIZE)} />
    </section>
  );
}
