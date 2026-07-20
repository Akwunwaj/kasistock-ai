import { expect, test } from "@playwright/test";

test("prepared evidence reaches approved supplier purchase orders", async ({ page }) => {
  await page.goto("/decision");
  await page.getByRole("button", { name: "Load prepared accepted evidence" }).click();

  await expect(page.getByText("16 source product labels")).toBeVisible();
  const confirmations = page.getByLabel("Human confirmed");
  const confirmationCount = await confirmations.count();
  for (let index = 0; index < confirmationCount; index += 1) {
    await confirmations.nth(index).check();
  }

  await page.getByRole("button", { name: "Accept product mapping set" }).click();
  await expect(page.getByText(/Mapping hash:/)).toBeVisible();

  await page.getByRole("button", { name: "Build and optimise plan" }).click();
  await expect(page.getByText(/allocated/)).toBeVisible();
  await expect(page.getByText("Merchant-controlled purchase order")).toBeVisible();

  await page.getByRole("button", { name: "Create signed approval draft" }).click();
  await expect(page.getByText(/Draft hash:/)).toBeVisible();

  await page
    .getByLabel("I reviewed this order and authorise the supplier purchase orders shown.")
    .check();
  await page.getByRole("button", { name: "Approve and generate purchase orders" }).click();

  await expect(page.getByText("Supplier orders are ready")).toBeVisible();
  await expect(page.getByRole("button", { name: "Download approved PDF" }).first()).toBeVisible();
  await expect(page.getByText("WhatsApp-ready supplier message").first()).toBeVisible();
  await expect(page.getByText("Immutable audit timeline")).toBeVisible();
});
