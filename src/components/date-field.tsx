import { fieldInput, fieldLabel } from "@/lib/styles";

/** A required date input. Clicking anywhere opens the picker, which Chromium otherwise only does from its icon. */
export function DateField({
  label,
  min,
  value,
  onChange,
}: {
  label: string;
  min: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className={fieldLabel}>
      {label}
      <input
        required
        type="date"
        min={min}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onClick={(event) => event.currentTarget.showPicker()}
        className={fieldInput}
      />
    </label>
  );
}
