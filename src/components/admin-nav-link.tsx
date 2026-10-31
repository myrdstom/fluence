"use client";

import { useConvexAuth, useQuery } from "convex/react";
import Link from "next/link";
import { api } from "../../convex/_generated/api";

/** Hiding the link is only a convenience. Convex rejects non-admin calls regardless. */
export function AdminNavLink({ className }: { className: string }) {
  const { isAuthenticated } = useConvexAuth();
  const me = useQuery(api.users.me, isAuthenticated ? {} : "skip");
  if (me?.role !== "admin") return null;
  return (
    <Link href="/admin" className={className}>
      Admin
    </Link>
  );
}
