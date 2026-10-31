import type { ReactNode } from "react";
import { mutedText } from "@/lib/styles";

/** Muted text standing in for content that is loading or empty. */
export function StatusMessage({ children }: { children: ReactNode }) {
  return <p className={`mt-6 ${mutedText}`}>{children}</p>;
}
