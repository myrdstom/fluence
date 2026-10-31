"use client";

import { useState, type ReactNode } from "react";
import { ErrorMessage } from "@/components/error-message";
import { buttonDanger, buttonSecondary } from "@/lib/styles";
import { useAsyncAction } from "@/lib/use-async-action";

/** A destructive button that asks for confirmation before running. Children render beside it while idle. */
export function ConfirmAction({
  triggerLabel,
  prompt,
  confirmLabel,
  pendingLabel,
  onConfirm,
  children,
}: {
  triggerLabel: string;
  prompt: string;
  confirmLabel: string;
  pendingLabel: string;
  onConfirm: () => Promise<unknown>;
  children?: ReactNode;
}) {
  const { run, isPending, error } = useAsyncAction();
  const [isConfirming, setIsConfirming] = useState(false);

  async function handleConfirm() {
    await run(onConfirm);
    setIsConfirming(false);
  }

  return (
    <>
      <ErrorMessage message={error} className="mt-2" />
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {isConfirming ? (
          <>
            <span className="text-sm">{prompt}</span>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isPending}
              className={buttonDanger}
            >
              {isPending ? pendingLabel : confirmLabel}
            </button>
            <button
              type="button"
              onClick={() => setIsConfirming(false)}
              disabled={isPending}
              className={buttonSecondary}
            >
              Keep
            </button>
          </>
        ) : (
          <>
            {children}
            <button
              type="button"
              onClick={() => setIsConfirming(true)}
              className={buttonSecondary}
            >
              {triggerLabel}
            </button>
          </>
        )}
      </div>
    </>
  );
}
