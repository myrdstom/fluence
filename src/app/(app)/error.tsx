"use client";

import { useEffect } from "react";
import { buttonSecondary, mutedText } from "@/lib/styles";

export default function AppError({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section role="alert">
      <h1 className="text-xl font-semibold tracking-tight">
        Something went wrong
      </h1>
      <p className={`mt-2 ${mutedText}`}>
        We couldn&apos;t load this page. Your data is safe.
      </p>
      <button
        type="button"
        onClick={retry}
        className={`${buttonSecondary} mt-4`}
      >
        Try again
      </button>
    </section>
  );
}
