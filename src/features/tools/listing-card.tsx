"use client";

import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Doc } from "@convex/_generated/dataModel";
import { ConfirmAction } from "@/components/confirm-action";
import { ToolSummary } from "@/components/tool-summary";
import { buttonSecondary, card } from "@/lib/styles";

export function ListingCard({
  tool,
  onEdit,
}: {
  tool: Doc<"tools">;
  onEdit: () => void;
}) {
  const removeTool = useMutation(api.tools.remove);

  return (
    <div className={card}>
      <ToolSummary tool={tool} />
      <ConfirmAction
        triggerLabel="Delete"
        prompt="Delete this listing?"
        confirmLabel="Yes, delete"
        pendingLabel="Deleting…"
        onConfirm={() => removeTool({ toolId: tool._id })}
      >
        <button type="button" onClick={onEdit} className={buttonSecondary}>
          Edit
        </button>
      </ConfirmAction>
    </div>
  );
}
