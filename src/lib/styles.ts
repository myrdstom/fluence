const buttonBase =
  "inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-500 disabled:cursor-not-allowed disabled:opacity-50";

export const buttonPrimary = `${buttonBase} bg-zinc-900 text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300`;

export const buttonSecondary = `${buttonBase} border border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800`;

export const buttonDanger = `${buttonBase} bg-red-700 text-white hover:bg-red-600`;

export const fieldInput =
  "mt-1 w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-zinc-500 dark:border-zinc-700 dark:[&>option]:bg-zinc-900";

export const card =
  "rounded-lg border border-zinc-200 p-4 dark:border-zinc-800";

export function pill(isActive: boolean) {
  return `rounded-full border px-3 py-1 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-500 ${
    isActive
      ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
      : "border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
  }`;
}
