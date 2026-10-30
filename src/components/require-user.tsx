"use client";

import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useEffect, useState, type ReactNode } from "react";
import { getErrorMessage } from "@/lib/errors";
import { api } from "../../convex/_generated/api";

/**
 * Syncs the signed-in Clerk user to Convex and holds back its children until
 * the record exists, so their queries can rely on requireUser.
 */
export function RequireUser({ children }: { children: ReactNode }) {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const me = useQuery(api.users.me, isAuthenticated ? {} : "skip");
  const storeUser = useMutation(api.users.store);
  const [syncError, setSyncError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    storeUser().catch((error) => setSyncError(getErrorMessage(error)));
  }, [isAuthenticated, storeUser]);

  if (syncError) {
    return <p role="alert" className="text-sm text-red-700 dark:text-red-400">{syncError}</p>;
  }
  if (!isLoading && !isAuthenticated) {
    return (
      <p role="alert" className="text-sm text-zinc-500">
        We couldn&apos;t verify your session. Please sign out and sign in again.
      </p>
    );
  }
  if (!me) {
    return <p className="text-sm text-zinc-500">Loading…</p>;
  }
  return children;
}
