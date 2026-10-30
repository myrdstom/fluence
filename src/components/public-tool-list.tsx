"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { CATEGORY_LABELS } from "../../convex/lib/constants";

export function PublicToolList() {
  const tools = useQuery(api.tools.listPublic);

  if (tools === undefined) {
    return <p className="text-sm text-zinc-500">Loading tools…</p>;
  }
  if (tools.length === 0) {
    return <p className="text-sm text-zinc-500">No tools listed yet.</p>;
  }
  return (
    <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
      {tools.map((tool) => (
        <li key={tool._id} className="flex items-center justify-between py-3">
          <span className="font-medium">{tool.name}</span>
          <span className="text-sm text-zinc-500">
            {CATEGORY_LABELS[tool.category]}
          </span>
        </li>
      ))}
    </ul>
  );
}
