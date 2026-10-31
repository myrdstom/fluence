"use client";

import { useMutation } from "convex/react";
import { useState, type FormEvent } from "react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { ErrorMessage } from "@/components/error-message";
import { localToday } from "@/lib/dates";
import {
  buttonPrimary,
  buttonSecondary,
  fieldInput,
  fieldLabel,
} from "@/lib/styles";
import { useAsyncAction } from "@/lib/use-async-action";

export function BorrowRequestForm({ toolId }: { toolId: Id<"tools"> }) {
  const createRequest = useMutation(api.requests.create);
  const { run, isPending, error } = useAsyncAction();
  const [isOpen, setIsOpen] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={buttonPrimary}
      >
        Request to borrow
      </button>
    );
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    void run(() => createRequest({ toolId, startDate, endDate }));
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className={fieldLabel}>
          From
          <input
            required
            type="date"
            min={localToday()}
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
            className={fieldInput}
          />
        </label>
        <label className={fieldLabel}>
          Until
          <input
            required
            type="date"
            min={startDate || localToday()}
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
            className={fieldInput}
          />
        </label>
      </div>
      <ErrorMessage message={error} />
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={isPending} className={buttonPrimary}>
          {isPending ? "Sending…" : "Send request"}
        </button>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          disabled={isPending}
          className={buttonSecondary}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
