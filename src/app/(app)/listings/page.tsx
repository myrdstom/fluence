"use client";

import { useMutation, usePaginatedQuery } from "convex/react";
import { useState } from "react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { PaginatedList } from "@/components/paginated-list";
import { ToolForm } from "@/components/tool-form";
import { ListingCard } from "@/features/tools/listing-card";
import { buttonPrimary, pageTitle } from "@/lib/styles";

const PAGE_SIZE = 20;

export default function ListingsPage() {
  const listings = usePaginatedQuery(
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
        <h1 className={pageTitle}>My listings</h1>
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

      <PaginatedList
        pagination={listings}
        pageSize={PAGE_SIZE}
        loadingText="Loading your listings…"
        emptyText={
          !isCreating &&
          "You haven't listed any tools yet. What could a neighbor borrow from you?"
        }
        renderItem={(tool) => (
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
        )}
      />
    </section>
  );
}
