"use client";

import { useState } from "react";
import { getErrorMessage } from "./errors/errors";

/** Tracks one in-flight mutation so a component can disable buttons and show failures. */
export function useAsyncAction() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(action: () => Promise<unknown>) {
    setError(null);
    setIsPending(true);
    try {
      await action();
    } catch (actionError) {
      setError(getErrorMessage(actionError));
    } finally {
      setIsPending(false);
    }
  }

  return { run, isPending, error };
}
