"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { navLink } from "@/lib/styles";

/** A header link that marks itself as the current page. */
export function NavLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const isCurrent = pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      aria-current={isCurrent ? "page" : undefined}
      className={navLink}
    >
      {children}
    </Link>
  );
}
