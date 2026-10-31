"use client";

import { useMutation, usePaginatedQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { TrustedLenderBadge } from "@/components/badges";
import { ErrorMessage } from "@/components/error-message";
import { PaginatedList } from "@/components/paginated-list";
import { buttonSecondary, card, mutedText } from "@/lib/styles";
import { useAsyncAction } from "@/lib/use-async-action";
import { ADMIN_PAGE_SIZE } from "./constants";

function LenderRow({
  user,
}: {
  user: {
    _id: Id<"users">;
    name: string;
    email?: string;
    role: "user" | "admin";
    isTrustedLender: boolean;
  };
}) {
  const setTrustedLender = useMutation(api.admin.setTrustedLender);
  const { run, isPending, error } = useAsyncAction();

  return (
    <li className={card}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-medium">{user.name}</h2>
            {user.isTrustedLender && <TrustedLenderBadge />}
            {user.role === "admin" && (
              <span className="text-xs text-muted">Admin</span>
            )}
          </div>
          {user.email && (
            <p className={`mt-1 break-all ${mutedText}`}>{user.email}</p>
          )}
        </div>
        <button
          type="button"
          disabled={isPending}
          onClick={() =>
            run(() =>
              setTrustedLender({
                userId: user._id,
                isTrustedLender: !user.isTrustedLender,
              }),
            )
          }
          className={buttonSecondary}
        >
          {user.isTrustedLender
            ? "Remove Trusted Lender"
            : "Mark as Trusted Lender"}
        </button>
      </div>
      <ErrorMessage message={error} className="mt-2" />
    </li>
  );
}

export function LendersTab() {
  const users = usePaginatedQuery(
    api.admin.listUsers,
    {},
    { initialNumItems: ADMIN_PAGE_SIZE },
  );
  return (
    <PaginatedList
      pagination={users}
      pageSize={ADMIN_PAGE_SIZE}
      emptyText="No users yet."
      renderItem={(user) => <LenderRow key={user._id} user={user} />}
    />
  );
}
