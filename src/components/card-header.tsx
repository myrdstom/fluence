import type { ReactNode } from "react";

/** A card's title, with any badges aligned to the right. */
export function CardHeader({
  title,
  as: Heading = "h2",
  children,
}: {
  title: string;
  as?: "h2" | "h3";
  children?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <Heading className="font-medium">{title}</Heading>
      {children && (
        <div className="flex flex-wrap justify-end gap-1">{children}</div>
      )}
    </div>
  );
}
