const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring";

const buttonBase = `inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition-colors ${focusRing} disabled:cursor-not-allowed disabled:opacity-50`;

export const buttonPrimary = `${buttonBase} bg-primary text-on-primary hover:bg-primary-hover`;

export const buttonSecondary = `${buttonBase} border border-input hover:bg-surface-hover`;

export const buttonDanger = `${buttonBase} bg-danger-solid text-on-danger hover:bg-danger-solid-hover`;

export const fieldLabel = "block text-sm font-medium";

export const fieldInput =
  "mt-1 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm font-normal focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-focus-ring [&>option]:bg-option-surface";

export const card = "rounded-lg border border-line p-4";

export const pageTitle = "text-2xl font-semibold tracking-tight";

export const sectionLabel =
  "text-sm font-medium uppercase tracking-wide text-muted";

export const mutedText = "text-sm text-muted";

export const dangerText = "text-sm text-danger";

export function pill(isActive: boolean) {
  return `rounded-full border px-3 py-1 text-sm transition-colors ${focusRing} ${
    isActive
      ? "border-primary bg-primary text-on-primary"
      : "border-input hover:bg-surface-hover"
  }`;
}
