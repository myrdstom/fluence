import { pill } from "@/lib/styles";

/** A row of toggle buttons where exactly one option is selected. */
export function FilterPills<T>({
  label,
  options,
  value,
  onChange,
  className = "",
}: {
  label: string;
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className={`flex flex-wrap gap-2 ${className}`}
    >
      {options.map((option) => (
        <button
          key={option.label}
          type="button"
          aria-pressed={option.value === value}
          onClick={() => onChange(option.value)}
          className={pill(option.value === value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
