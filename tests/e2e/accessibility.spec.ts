import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const routes = [
  { path: "/", name: "home" },
  { path: "/evidence", name: "evidence" },
  { path: "/decision", name: "decision" },
  { path: "/architecture", name: "architecture" },
] as const;

for (const route of routes) {
  test(`${route.name} page has no WCAG A/AA violations`, async ({ page }) => {
    await page.goto(route.path);
    await expect(page.locator("#main-content")).toBeVisible();

    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    expect(result.violations).toEqual([]);
  });
}

test("prepared evidence review state has no WCAG A/AA violations", async ({ page }) => {
  await page.goto("/evidence");
  await page.getByRole("button", { name: "Use prepared demo" }).click();
  await expect(page.getByText("PREPARED DEMO", { exact: true })).toBeVisible();

  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();

  expect(result.violations).toEqual([]);
});
