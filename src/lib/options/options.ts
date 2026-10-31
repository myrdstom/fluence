/** Narrows a raw form value, such as a select's, to one of the allowed options. */
export function findOption<T extends string>(
  options: readonly T[],
  value: string,
): T | undefined {
  return options.find((option) => option === value);
}
