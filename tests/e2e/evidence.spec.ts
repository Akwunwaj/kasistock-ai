import { expect, test } from "@playwright/test";

test("prepared extraction can be reviewed and accepted", async ({ page }) => {
  await page.goto("/evidence");
  await page.getByRole("button", { name: "Use prepared demo" }).click();
  await expect(page.getByText("PREPARED DEMO", { exact: true })).toBeVisible();

  const reviewChecks = page.getByLabel("I checked this item against the source evidence");
  await expect(reviewChecks).toHaveCount(2);
  for (let index = 0; index < 2; index += 1) {
    await reviewChecks.nth(index).check();
  }

  await page.getByRole("button", { name: "Accept evidence snapshot" }).click();
  await expect(
    page.getByText("Human-accepted evidence is ready for product reconciliation."),
  ).toBeVisible();
});
