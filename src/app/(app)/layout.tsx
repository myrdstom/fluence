import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import type { ReactNode } from "react";
import { NavLink } from "@/components/nav-link";
import { AdminNavLink } from "@/features/admin/admin-nav-link";
import { RequireUser } from "@/features/auth/require-user";

const NAV_LINKS = [
  { href: "/tools", label: "All tools" },
  { href: "/listings", label: "My listings" },
  { href: "/requests", label: "My requests" },
  { href: "/incoming", label: "Incoming" },
];

export default async function AppLayout({ children }: { children: ReactNode }) {
  // Redirects signed-out visitors. This is UX; Convex functions enforce authorization.
  await auth.protect();

  return (
    <>
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex w-full max-w-4xl flex-wrap items-center gap-x-8 gap-y-2 px-4 py-3">
          <Link
            href="/"
            className="font-display text-2xl font-bold leading-none tracking-tight"
          >
            LendLoop
          </Link>
          <nav className="flex flex-1 flex-wrap gap-x-5 gap-y-1 text-sm font-semibold text-muted">
            {NAV_LINKS.map(({ href, label }) => (
              <NavLink key={href} href={href}>
                {label}
              </NavLink>
            ))}
            <AdminNavLink />
          </nav>
          <UserButton />
        </div>
      </header>
      <main className="mx-auto w-full max-w-4xl px-4 py-10">
        <RequireUser>{children}</RequireUser>
      </main>
    </>
  );
}
