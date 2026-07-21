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

test("live extraction reports a friendly timeout when the platform returns plain text", async ({
  page,
}) => {
  await page.route("**/api/extractions", async (route) => {
    await route.fulfill({
      status: 504,
      contentType: "text/plain",
      body: "An error occurred with your deployment",
    });
  });
  await page.goto("/evidence");
  await page.locator('input[type="file"]').setInputFiles({
    name: "shelf.png",
    mimeType: "image/png",
    buffer: Buffer.from("test image"),
  });
  await page.getByRole("button", { name: "Run GPT-5.6 extraction" }).click();

  await expect(page.locator(".errorNotice")).toHaveText(
    "Live extraction took too long. Try again or use the prepared demo while the service recovers.",
  );
});
