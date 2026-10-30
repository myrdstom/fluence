import { Show, SignInButton } from "@clerk/nextjs";
import Link from "next/link";
import { PublicToolList } from "@/components/public-tool-list";
import { buttonPrimary } from "@/lib/styles";

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
            <button type="button" className={buttonPrimary}>
              Sign in to lend or borrow
            </button>
          </SignInButton>
        </Show>
        <Show when="signed-in">
          <Link href="/tools" className={buttonPrimary}>
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
