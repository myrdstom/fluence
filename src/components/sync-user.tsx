"use client";

import { useConvexAuth, useMutation } from "convex/react";
import { useEffect } from "react";
import { api } from "../../convex/_generated/api";

/** Ensures the signed-in Clerk user has a matching Convex record. */
export function SyncUser() {
  const { isAuthenticated } = useConvexAuth();
  const storeUser = useMutation(api.users.store);

  useEffect(() => {
    if (isAuthenticated) void storeUser();
  }, [isAuthenticated, storeUser]);

  return null;
}
