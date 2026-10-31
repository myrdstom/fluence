import { clerk } from "@clerk/testing/playwright";
import { expect, test } from "@playwright/test";

const email = process.env.E2E_USER_EMAIL;

test.describe("signed-in lender", () => {
  test.skip(!email, "Set E2E_USER_EMAIL to an existing Clerk user");

  test("lists, finds, and deletes a tool", async ({ page }) => {
    const toolName = `E2E drill ${Date.now()}`;

    await page.goto("/");
    await clerk.signIn({ page, emailAddress: email! });

    await page.goto("/listings");
    await page.getByRole("button", { name: "List a tool" }).click();
    await page.getByLabel("Name").fill(toolName);
    await page.getByLabel("Category").selectOption("power_tools");
    await page.getByLabel("Condition").selectOption("good");
    await page.getByLabel("Description").fill("Created by an end-to-end test.");
    await page.getByRole("button", { name: "List tool" }).click();
    await expect(page.getByRole("heading", { name: toolName })).toBeVisible();

    await page.goto("/tools");
    await page.getByRole("button", { name: "Power tools" }).click();
    const browseCard = page.getByRole("listitem").filter({ hasText: toolName });
    await expect(browseCard).toContainText("Your listing");
    await expect(browseCard).toContainText("Available");

    await page.goto("/listings");
    const listing = page.getByRole("listitem").filter({ hasText: toolName });
    await listing.getByRole("button", { name: "Delete" }).click();
    await listing.getByRole("button", { name: "Yes, delete" }).click();
    await expect(page.getByRole("heading", { name: toolName })).toHaveCount(0);
  });
});
