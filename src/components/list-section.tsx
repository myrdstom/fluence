import type { ReactNode } from "react";
import { mutedText, sectionLabel } from "@/lib/styles";

export function ListSection({
  title,
  isEmpty,
  emptyText,
  className = "mt-8",
  listClassName = "space-y-4",
  children,
}: {
  title: string;
  isEmpty: boolean;
  emptyText: string;
  className?: string;
  listClassName?: string;
  children: ReactNode;
}) {
  return (
    <section className={className}>
      <h2 className={sectionLabel}>{title}</h2>
      {isEmpty ? (
        <p className={`mt-3 ${mutedText}`}>{emptyText}</p>
      ) : (
        <ul className={`mt-3 ${listClassName}`}>{children}</ul>
      )}
    </section>
  );
}
