"use client";

import { useState, type FormEvent } from "react";
import {
  CATEGORIES,
  CATEGORY_LABELS,
  CONDITIONS,
  CONDITION_LABELS,
  TOOL_DESCRIPTION_MAX_LENGTH,
  TOOL_NAME_MAX_LENGTH,
  type Category,
  type Condition,
} from "@convex/lib/constants";
import { ErrorMessage } from "@/components/error-message";
import { findOption } from "@/lib/options/options";
import {
  buttonPrimary,
  buttonSecondary,
  card,
  fieldInput,
  fieldLabel,
} from "@/lib/styles";
import { useAsyncAction } from "@/lib/use-async-action";

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

function SelectField<T extends string>({
  label,
  options,
  labels,
  value,
  onChange,
}: {
  label: string;
  options: readonly T[];
  labels: Record<T, string>;
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <label className={fieldLabel}>
      {label}
      <select
        value={value}
        onChange={(event) => {
          const option = findOption(options, event.target.value);
          if (option) onChange(option);
        }}
        className={fieldInput}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {labels[option]}
          </option>
        ))}
      </select>
    </label>
  );
}

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
  const { run, isPending, error } = useAsyncAction();

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    void run(() => onSubmit(values));
  }

  return (
    <form onSubmit={handleSubmit} className={`${card} space-y-4`}>
      <h2 className="font-medium">{title}</h2>
      <label className={fieldLabel}>
        Name
        <input
          required
          maxLength={TOOL_NAME_MAX_LENGTH}
          value={values.name}
          onChange={(event) =>
            setValues({ ...values, name: event.target.value })
          }
          placeholder="Cordless drill"
          className={fieldInput}
        />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          label="Category"
          options={CATEGORIES}
          labels={CATEGORY_LABELS}
          value={values.category}
          onChange={(category) => setValues({ ...values, category })}
        />
        <SelectField
          label="Condition"
          options={CONDITIONS}
          labels={CONDITION_LABELS}
          value={values.condition}
          onChange={(condition) => setValues({ ...values, condition })}
        />
      </div>
      <label className={fieldLabel}>
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
          className={fieldInput}
        />
      </label>
      <ErrorMessage message={error} />
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={isPending} className={buttonPrimary}>
          {isPending ? "Saving…" : submitLabel}
        </button>
        <button type="button" onClick={onCancel} className={buttonSecondary}>
          Cancel
        </button>
      </div>
    </form>
  );
}
