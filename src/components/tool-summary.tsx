import type { Doc } from "@convex/_generated/dataModel";
import { CATEGORY_LABELS, CONDITION_LABELS } from "@convex/lib/constants";
import { ToolStatusBadge } from "@/components/badges";
import { CardHeader } from "@/components/card-header";
import { mutedText } from "@/lib/styles";

/** A tool's name, availability, category, condition and description. */
export function ToolSummary({
  tool,
}: {
  tool: Pick<
    Doc<"tools">,
    "name" | "status" | "category" | "condition" | "description"
  >;
}) {
  return (
    <>
      <CardHeader title={tool.name}>
        <ToolStatusBadge status={tool.status} />
      </CardHeader>
      <p className={`mt-1 ${mutedText}`}>
        {CATEGORY_LABELS[tool.category]} · {CONDITION_LABELS[tool.condition]}{" "}
        condition
      </p>
      <p className="mt-2 text-sm">{tool.description}</p>
    </>
  );
}
