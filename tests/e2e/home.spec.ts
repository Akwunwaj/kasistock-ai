import { expect, test } from "@playwright/test";

test("shows the seeded decision workspace", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Turn limited cash/i })).toBeVisible();
  await expect(page.getByText("Proposed purchase order")).toBeVisible();
  await expect(page.getByRole("link", { name: "Open live decision engine" })).toBeVisible();
});
