"use client";

import { useConvexAuth, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { NavLink } from "@/components/nav-link";

/** Hiding the link is only a convenience. Convex rejects non-admin calls regardless. */
export function AdminNavLink() {
  const { isAuthenticated } = useConvexAuth();
  const me = useQuery(api.users.me, isAuthenticated ? {} : "skip");
  if (me?.role !== "admin") return null;
  return <NavLink href="/admin">Admin</NavLink>;
}
