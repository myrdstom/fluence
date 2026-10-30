import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import type { ReactNode } from "react";
import { RequireUser } from "@/components/require-user";

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
      <header className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto flex w-full max-w-4xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
          <Link href="/" className="font-semibold tracking-tight">
            LendLoop
          </Link>
          <nav className="flex flex-1 flex-wrap gap-4 text-sm text-zinc-500">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="hover:text-zinc-900 dark:hover:text-zinc-100"
              >
                {label}
              </Link>
            ))}
          </nav>
          <UserButton />
        </div>
      </header>
      <main className="mx-auto w-full max-w-4xl px-4 py-8">
        <RequireUser>{children}</RequireUser>
      </main>
    </>
  );
}
