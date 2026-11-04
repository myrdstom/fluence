"use client";

import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { CATEGORY_LABELS } from "@convex/lib/constants";
import { mutedText } from "@/lib/styles";

/** Available tools, shown as tags hanging on a pegboard. */
export function PublicToolList() {
  const tools = useQuery(api.tools.listPublic);

  if (tools === undefined) {
    return <p className={mutedText}>Loading tools…</p>;
  }
  if (tools.length === 0) {
    return (
      <p className={mutedText}>
        The board is empty. Sign in and list the first tool.
      </p>
    );
  }
  return (
    <ul className="pegboard tag-rack grid grid-cols-2 gap-x-5 gap-y-7 rounded-md p-5 sm:grid-cols-3 sm:p-7 lg:grid-cols-4">
      {tools.map((tool, index) => (
        // The public query returns no IDs, and these rows hold no state.
        <li key={index}>
          <div className="tool-tag h-full">
            <p className="font-display text-xl font-bold leading-tight">
              {tool.name}
            </p>
            <p className="mt-1 text-sm opacity-80">
              {CATEGORY_LABELS[tool.category]}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
