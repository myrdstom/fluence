"use client";

import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { CATEGORY_LABELS } from "@convex/lib/constants";
import { mutedText } from "@/lib/styles";

export function PublicToolList() {
  const tools = useQuery(api.tools.listPublic);

  if (tools === undefined) {
    return <p className={mutedText}>Loading tools…</p>;
  }
  if (tools.length === 0) {
    return <p className={mutedText}>No tools listed yet.</p>;
  }
  return (
    <ul className="divide-y divide-line">
      {tools.map((tool, index) => (
        // The public query returns no IDs, and these rows hold no state.
        <li key={index} className="flex items-center justify-between py-3">
          <span className="font-medium">{tool.name}</span>
          <span className={mutedText}>{CATEGORY_LABELS[tool.category]}</span>
        </li>
      ))}
    </ul>
  );
}
