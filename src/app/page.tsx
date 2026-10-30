import { Show, SignInButton } from "@clerk/nextjs";
import Link from "next/link";
import { PublicToolList } from "@/components/public-tool-list";

const buttonClass =
  "inline-block rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-16">
      <h1 className="text-4xl font-semibold tracking-tight">LendLoop</h1>
      <p className="mt-3 text-lg text-zinc-500">
        Borrow what you need. Lend what you don&apos;t.
      </p>
      <div className="mt-6">
        <Show when="signed-out">
          <SignInButton mode="modal" forceRedirectUrl="/tools">
            <button type="button" className={buttonClass}>
              Sign in to lend or borrow
            </button>
          </SignInButton>
        </Show>
        <Show when="signed-in">
          <Link href="/tools" className={buttonClass}>
            Go to tools
          </Link>
        </Show>
      </div>
      <h2 className="mt-12 text-sm font-medium uppercase tracking-wide text-zinc-500">
        Available now
      </h2>
      <div className="mt-2">
        <PublicToolList />
      </div>
    </main>
  );
}
