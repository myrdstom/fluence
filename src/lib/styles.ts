const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring";

const buttonBase = `inline-flex items-center justify-center rounded px-4 py-2 text-sm font-semibold transition-colors ${focusRing} disabled:cursor-not-allowed disabled:opacity-50`;

export const buttonPrimary = `${buttonBase} bg-primary text-on-primary hover:bg-primary-hover`;

export const buttonSecondary = `${buttonBase} border border-input hover:bg-surface-hover`;

export const buttonDanger = `${buttonBase} bg-danger-solid text-on-danger hover:bg-danger-solid-hover`;

export const fieldLabel = "block text-sm font-semibold";

export const fieldInput =
  "mt-1 w-full rounded border border-input bg-surface px-3 py-2 text-sm font-normal focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-focus-ring [&>option]:bg-option-surface";

export const card = "rounded-md border border-line bg-surface p-4";

export const pageTitle =
  "font-display text-4xl font-bold leading-none tracking-tight";

export const sectionLabel = "font-display text-xl font-semibold leading-tight";

export const mutedText = "text-sm text-muted";

export const dangerText = "text-sm text-danger";

export const navLink = `rounded-sm underline-offset-[6px] decoration-2 hover:text-foreground aria-[current=page]:text-foreground aria-[current=page]:underline aria-[current=page]:decoration-primary ${focusRing}`;

export function pill(isActive: boolean) {
  return `rounded-full border px-3 py-1 text-sm transition-colors ${focusRing} ${
    isActive
      ? "border-primary bg-primary text-on-primary"
      : "border-input bg-surface hover:bg-surface-hover"
  }`;
}
