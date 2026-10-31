import { clerkSetup } from "@clerk/testing/playwright";

/** Fetches a testing token so Clerk's bot protection doesn't block the browser. */
export default async function globalSetup() {
  await clerkSetup();
}
