"use client";

import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useEffect, useState, type ReactNode } from "react";
import { api } from "@convex/_generated/api";
import { ErrorMessage } from "@/components/error-message";
import { getErrorMessage } from "@/lib/errors/errors";
import { mutedText } from "@/lib/styles";

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
    return <ErrorMessage message={syncError} />;
  }
  if (!isLoading && !isAuthenticated) {
    return (
      <p role="alert" className={mutedText}>
        We couldn&apos;t verify your session. Please sign out and sign in again.
      </p>
    );
  }
  if (!me) {
    return <p className={mutedText}>Loading…</p>;
  }
  return children;
}
