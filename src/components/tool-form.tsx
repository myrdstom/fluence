"use client";

import { useState, type FormEvent } from "react";
import { getErrorMessage } from "@/lib/errors";
import { buttonPrimary, buttonSecondary, card, fieldInput } from "@/lib/styles";
import {
  CATEGORIES,
  CATEGORY_LABELS,
  CONDITIONS,
  CONDITION_LABELS,
  TOOL_DESCRIPTION_MAX_LENGTH,
  TOOL_NAME_MAX_LENGTH,
  type Category,
  type Condition,
} from "../../convex/lib/constants";

export type ToolFormValues = {
  name: string;
  category: Category;
  condition: Condition;
  description: string;
};

const EMPTY_VALUES: ToolFormValues = {
  name: "",
  category: "power_tools",
  condition: "good",
  description: "",
};

export function ToolForm({
  title,
  submitLabel,
  initialValues = EMPTY_VALUES,
  onSubmit,
  onCancel,
}: {
  title: string;
  submitLabel: string;
  initialValues?: ToolFormValues;
  onSubmit: (values: ToolFormValues) => Promise<unknown>;
  onCancel: () => void;
}) {
  const [values, setValues] = useState(initialValues);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSaving(true);
    try {
      await onSubmit(values);
    } catch (submitError) {
      setError(getErrorMessage(submitError));
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className={`${card} space-y-4`}>
      <h2 className="font-medium">{title}</h2>
      <label className="block text-sm font-medium">
        Name
        <input
          required
          maxLength={TOOL_NAME_MAX_LENGTH}
          value={values.name}
          onChange={(event) =>
            setValues({ ...values, name: event.target.value })
          }
          placeholder="Cordless drill"
          className={`${fieldInput} font-normal`}
        />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium">
          Category
          <select
            value={values.category}
            onChange={(event) =>
              setValues({ ...values, category: event.target.value as Category })
            }
            className={`${fieldInput} font-normal`}
          >
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {CATEGORY_LABELS[category]}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium">
          Condition
          <select
            value={values.condition}
            onChange={(event) =>
              setValues({
                ...values,
                condition: event.target.value as Condition,
              })
            }
            className={`${fieldInput} font-normal`}
          >
            {CONDITIONS.map((condition) => (
              <option key={condition} value={condition}>
                {CONDITION_LABELS[condition]}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="block text-sm font-medium">
        Description
        <textarea
          required
          rows={3}
          maxLength={TOOL_DESCRIPTION_MAX_LENGTH}
          value={values.description}
          onChange={(event) =>
            setValues({ ...values, description: event.target.value })
          }
          placeholder="18V, comes with two batteries and a charger."
          className={`${fieldInput} font-normal`}
        />
      </label>
      {error && (
        <p role="alert" className="text-sm text-red-700 dark:text-red-400">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={isSaving} className={buttonPrimary}>
          {isSaving ? "Saving…" : submitLabel}
        </button>
        <button type="button" onClick={onCancel} className={buttonSecondary}>
          Cancel
        </button>
      </div>
    </form>
  );
}
