import AxeBuilder from "@axe-core/playwright";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { chromium } from "playwright";
import { fetchStandaloneHtml } from "./static-page.mjs";

const root = process.cwd();
const baseUrl = process.env.AUDIT_BASE_URL ?? "http://127.0.0.1:3117";
const chromiumPath = [
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
  "/usr/bin/google-chrome",
].find((candidate) => candidate && existsSync(candidate));

const routes = [
  "/",
  "/judge",
  "/submission-preview/evidence",
  "/submission-preview/approved",
  "/architecture",
];

const browser = await chromium.launch({
  headless: true,
  executablePath: chromiumPath,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

const results = [];
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
try {
  for (const route of routes) {
    const page = await context.newPage();
    const html = await fetchStandaloneHtml(baseUrl, route);
    await page.setContent(html, { waitUntil: "domcontentloaded" });
    const audit = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    results.push({
      route,
      violations: audit.violations.map((violation) => ({
        id: violation.id,
        impact: violation.impact,
        description: violation.description,
        nodes: violation.nodes.length,
      })),
    });
    await page.close();
  }
} finally {
  await context.close();
  await browser.close();
}

const violationCount = results.reduce((total, result) => total + result.violations.length, 0);
const report = {
  generatedAt: new Date().toISOString(),
  mode: "offline server-rendered DOM",
  standard: "WCAG 2 A/AA and WCAG 2.1 A/AA",
  routes: results,
  violationCount,
  passed: violationCount === 0,
};
const outputDirectory = resolve(root, "submission", "qa");
mkdirSync(outputDirectory, { recursive: true });
writeFileSync(
  resolve(outputDirectory, "accessibility-report.json"),
  `${JSON.stringify(report, null, 2)}\n`,
);
console.log(JSON.stringify(report, null, 2));
if (violationCount > 0) process.exitCode = 1;
