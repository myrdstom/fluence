"use client";

import { usePaginatedQuery } from "convex/react";
import { useState } from "react";
import { api } from "@convex/_generated/api";
import {
  CATEGORIES,
  CATEGORY_LABELS,
  type Category,
} from "@convex/lib/constants";
import { FilterPills } from "@/components/filter-pills";
import { PaginatedList } from "@/components/paginated-list";
import { ToolCard } from "@/features/tools/tool-card";
import { pageTitle } from "@/lib/styles";

const PAGE_SIZE = 24;

const CATEGORY_OPTIONS = [
  { value: undefined, label: "All" },
  ...CATEGORIES.map((category) => ({
    value: category,
    label: CATEGORY_LABELS[category],
  })),
];

export default function ToolsPage() {
  const [category, setCategory] = useState<Category | undefined>();
  const tools = usePaginatedQuery(
    api.tools.list,
    { category },
    { initialNumItems: PAGE_SIZE },
  );

  return (
    <section>
      <h1 className={pageTitle}>All tools</h1>
      <FilterPills
        label="Filter by category"
        options={CATEGORY_OPTIONS}
        value={category}
        onChange={setCategory}
        className="mt-4"
      />
      <PaginatedList
        pagination={tools}
        pageSize={PAGE_SIZE}
        loadingText="Loading tools…"
        emptyText={
          category
            ? `No ${CATEGORY_LABELS[category].toLowerCase()} tools listed yet.`
            : "No tools listed yet."
        }
        listClassName="mt-6 grid gap-4 sm:grid-cols-2"
        renderItem={(tool) => <ToolCard key={tool._id} tool={tool} />}
      />
    </section>
  );
}
