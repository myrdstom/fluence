"use client";

import { useMutation, usePaginatedQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { CATEGORY_LABELS, type Category } from "@convex/lib/constants";
import { ToolStatusBadge } from "@/components/badges";
import { CardHeader } from "@/components/card-header";
import { ConfirmAction } from "@/components/confirm-action";
import { PaginatedList } from "@/components/paginated-list";
import { card, mutedText } from "@/lib/styles";
import { ADMIN_PAGE_SIZE } from "./constants";

function ListingRow({
  tool,
}: {
  tool: {
    _id: Id<"tools">;
    name: string;
    category: Category;
    status: "available" | "on_loan";
    lender: { name: string } | null;
  };
}) {
  const removeTool = useMutation(api.tools.remove);

  return (
    <li className={card}>
      <CardHeader title={tool.name}>
        <ToolStatusBadge status={tool.status} />
      </CardHeader>
      <p className={`mt-1 ${mutedText}`}>
        {CATEGORY_LABELS[tool.category]} · Lent by{" "}
        {tool.lender?.name ?? "a former member"}
      </p>
      <ConfirmAction
        triggerLabel="Remove listing"
        prompt={
          tool.status === "on_loan"
            ? "Remove this listing and close its active loan?"
            : "Remove this listing?"
        }
        confirmLabel="Yes, remove"
        pendingLabel="Removing…"
        onConfirm={() => removeTool({ toolId: tool._id })}
      />
    </li>
  );
}

export function ListingsTab() {
  const tools = usePaginatedQuery(
    api.tools.list,
    {},
    { initialNumItems: ADMIN_PAGE_SIZE },
  );
  return (
    <PaginatedList
      pagination={tools}
      pageSize={ADMIN_PAGE_SIZE}
      emptyText="No listings yet."
      renderItem={(tool) => <ListingRow key={tool._id} tool={tool} />}
    />
  );
}
