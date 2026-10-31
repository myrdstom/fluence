import { expect, test } from "@playwright/test";

test.describe("signed-out visitor", () => {
  test("sees the landing page and a sign-in button", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", { name: "LendLoop", level: 1 }),
    ).toBeVisible();
    await expect(page.getByText("Borrow what you need.")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Sign in to lend or borrow" }),
    ).toBeVisible();
    await expect(page.getByText("Available now")).toBeVisible();
  });

  test("never sees lender details on the public list", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByText("Lent by")).toHaveCount(0);
    await expect(page.locator("main")).not.toContainText("@");
  });

  for (const path of [
    "/tools",
    "/listings",
    "/requests",
    "/incoming",
    "/admin",
  ]) {
    test(`is sent to sign in from ${path}`, async ({ page }) => {
      await page.goto(path);

      await expect(page).toHaveURL(/sign-in/);
    });
  }
});
