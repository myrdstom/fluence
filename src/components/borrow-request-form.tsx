"use client";

import { useMutation } from "convex/react";
import { useState, type FormEvent } from "react";
import { localToday } from "@/lib/dates";
import { buttonPrimary, buttonSecondary, fieldInput } from "@/lib/styles";
import { useAsyncAction } from "@/lib/use-async-action";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

export function BorrowRequestForm({ toolId }: { toolId: Id<"tools"> }) {
  const createRequest = useMutation(api.requests.create);
  const { run, isPending, error } = useAsyncAction();
  const [isOpen, setIsOpen] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  if (!isOpen) {
    return (
      <button type="button" onClick={() => setIsOpen(true)} className={buttonPrimary}>
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
        <label className="block text-sm font-medium">
          From
          <input
            required
            type="date"
            min={localToday()}
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
            className={`${fieldInput} font-normal`}
          />
        </label>
        <label className="block text-sm font-medium">
          Until
          <input
            required
            type="date"
            min={startDate || localToday()}
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
            className={`${fieldInput} font-normal`}
          />
        </label>
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-700 dark:text-red-400">
          {error}
        </p>
      )}
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
