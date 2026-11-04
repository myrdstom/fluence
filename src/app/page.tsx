import { Show, SignInButton } from "@clerk/nextjs";
import Link from "next/link";
import { PublicToolList } from "@/features/tools/public-tool-list";
import { buttonPrimary, sectionLabel } from "@/lib/styles";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 pb-20 pt-8">
      <p className="font-display text-2xl font-bold leading-none tracking-tight">
        LendLoop
      </p>
      <section className="mt-16 sm:mt-24">
        <h1 className="font-display text-6xl font-extrabold leading-[0.9] tracking-tight sm:text-8xl">
          Borrow what you need.
          <br />
          Lend what you don&apos;t.
        </h1>
        <p className="mt-6 max-w-[34rem] text-lg text-muted">
          A tool-lending board for your neighborhood. List the drill sitting in
          your garage, and borrow the ladder you only need once a year.
        </p>
        <div className="mt-8">
          <Show when="signed-out">
            <SignInButton mode="modal" forceRedirectUrl="/tools">
              <button type="button" className={buttonPrimary}>
                Sign in to lend or borrow
              </button>
            </SignInButton>
          </Show>
          <Show when="signed-in">
            <Link href="/tools" className={buttonPrimary}>
              Browse all tools
            </Link>
          </Show>
        </div>
      </section>
      <section className="mt-20">
        <h2 className={sectionLabel}>On the board now</h2>
        <div className="mt-4">
          <PublicToolList />
        </div>
      </section>
    </main>
  );
}
