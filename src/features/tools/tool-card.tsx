import Link from "next/link";
import type { FunctionReturnType } from "convex/server";
import type { api } from "@convex/_generated/api";
import { TrustedLenderBadge } from "@/components/badges";
import { ToolSummary } from "@/components/tool-summary";
import { BorrowRequestForm } from "@/features/requests/borrow-request-form";
import { card, mutedText } from "@/lib/styles";

type ToolView = FunctionReturnType<typeof api.tools.list>["page"][number];

export function ToolCard({ tool }: { tool: ToolView }) {
  return (
    <li className={card}>
      <ToolSummary tool={tool} />
      <div className={`mt-3 flex flex-wrap items-center gap-2 ${mutedText}`}>
        {tool.isMine
          ? "Your listing"
          : `Lent by ${tool.lender?.name ?? "a neighbor"}`}
        {tool.lender?.isTrustedLender && <TrustedLenderBadge />}
      </div>
      {!tool.isMine && tool.status === "available" && (
        <div className="mt-4">
          {tool.hasPendingRequest ? (
            <p className={mutedText}>
              Requested. Track it in{" "}
              <Link href="/requests" className="underline">
                My requests
              </Link>
              .
            </p>
          ) : (
            <BorrowRequestForm toolId={tool._id} />
          )}
        </div>
      )}
    </li>
  );
}
