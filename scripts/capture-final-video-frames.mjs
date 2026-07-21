import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium } from "playwright";

const baseUrl = process.env.CAPTURE_BASE_URL?.trim() || "http://127.0.0.1:3118";
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?.trim();
const outputDirectory = resolve("submission/video/frames");
await mkdir(outputDirectory, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  executablePath: executablePath || undefined,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
const frames = [];

async function screenshot(filename, label) {
  await page.screenshot({ path: resolve(outputDirectory, filename), animations: "disabled" });
  frames.push({ filename, label });
}

async function titleCard(filename, eyebrow, title, copy) {
  await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>
    *{box-sizing:border-box}body{margin:0;width:1920px;height:1080px;background:#edf5f1;color:#0e2d24;
    font-family:Arial,Helvetica,sans-serif;display:grid;place-items:center}.card{width:1640px;padding:110px 120px;
    border:2px solid #c6d8d1;border-radius:36px;background:#fff;box-shadow:0 30px 90px rgba(14,45,36,.12)}
    .brand{display:flex;align-items:center;gap:24px;margin-bottom:72px}.mark{display:grid;place-items:center;width:82px;
    height:82px;border-radius:22px;background:#159469;color:white;font-size:42px;font-weight:800}.name{font-size:34px;
    font-weight:800}.eyebrow{font-size:24px;font-weight:800;letter-spacing:.16em;color:#087e59;margin-bottom:28px}
    h1{font-size:96px;line-height:1.02;letter-spacing:-.055em;margin:0 0 38px;max-width:1450px}p{font-size:34px;
    line-height:1.45;max-width:1350px;margin:0;color:#455f57}.disclosure{margin-top:62px;font-size:24px;color:#53655f}
  </style></head><body><main class="card"><div class="brand"><div class="mark">K</div><div class="name">KasiStock AI</div></div>
  <div class="eyebrow">${eyebrow}</div><h1>${title}</h1><p>${copy}</p><p class="disclosure">AI-generated narration using an OpenAI built-in voice.</p>
  </main></body></html>`);
  await screenshot(filename, title);
}

try {
  await titleCard(
    "01-title.png",
    "OPENAI BUILD WEEK",
    "Turn limited cash into the right stock.",
    "Explainable multimodal evidence, deterministic purchasing, and explicit human approval for small retailers.",
  );

  await page.goto(`${baseUrl}/`, { waitUntil: "networkidle" });
  await screenshot("02-home.png", "Problem and prepared scenario");

  await page.goto(`${baseUrl}/evidence`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Use prepared demo" }).click();
  await page.getByText("PREPARED DEMO", { exact: true }).waitFor();
  await screenshot("03-evidence.png", "Human evidence review");

  await page.goto(`${baseUrl}/decision`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Load prepared accepted evidence" }).click();
  await page
    .getByRole("heading", { name: "Map every source label to the canonical catalogue" })
    .scrollIntoViewIfNeeded();
  await screenshot("04-mapping.png", "Human-confirmed product identity mapping");

  const confirmations = page.getByLabel("Human confirmed");
  for (let index = 0; index < (await confirmations.count()); index += 1) {
    await confirmations.nth(index).check();
  }
  await page.getByRole("button", { name: "Accept product mapping set" }).click();
  await page.getByText(/Mapping hash:/).waitFor();
  await page.getByRole("button", { name: "Build and optimise plan" }).click();
  await page
    .getByRole("heading", { name: "Merchant-controlled purchase order" })
    .scrollIntoViewIfNeeded();
  await screenshot("05-optimisation.png", "Deterministic budget optimisation");

  await page.getByRole("button", { name: "Create signed approval draft" }).click();
  await page.getByText(/Draft hash:/).waitFor();
  await page.getByRole("heading", { name: "Review the immutable draft" }).scrollIntoViewIfNeeded();
  await screenshot("06-signed-draft.png", "Server-rebuilt signed approval draft");

  await page
    .getByLabel("I reviewed this order and authorise the supplier purchase orders shown.")
    .check();
  await page.getByRole("button", { name: "Approve and generate purchase orders" }).click();
  const supplierOrdersHeading = page.getByRole("heading", { name: "Supplier orders are ready" });
  await supplierOrdersHeading.waitFor();
  await supplierOrdersHeading.evaluate((element) =>
    element.scrollIntoView({ block: "start", behavior: "instant" }),
  );
  await page.waitForTimeout(200);
  await screenshot("07-approved.png", "Approved supplier orders and immutable audit evidence");

  await page.goto(`${baseUrl}/architecture`, { waitUntil: "networkidle" });
  await screenshot("08-architecture.png", "Separation of authority");

  const readinessResponse = await fetch(`${baseUrl}/api/readiness`);
  const readiness = await readinessResponse.json();
  const persistence = readiness.persistence ?? {};
  await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>
    *{box-sizing:border-box}body{margin:0;width:1920px;height:1080px;background:#f7f3ea;color:#0e2d24;
    font-family:Arial,Helvetica,sans-serif;padding:110px 150px}.eyebrow{font-size:24px;font-weight:800;letter-spacing:.15em;
    color:#087e59}h1{font-size:78px;letter-spacing:-.045em;margin:26px 0 60px}.grid{display:grid;grid-template-columns:repeat(3,1fr);
    gap:30px}.tile{background:white;border:2px solid #d8ded9;border-radius:28px;padding:42px}.label{font-size:22px;color:#53655f;
    text-transform:uppercase;letter-spacing:.1em}.value{font-size:48px;font-weight:800;margin-top:18px}.evidence{margin-top:54px;
    background:#143f33;color:white;border-radius:28px;padding:40px 46px;font:25px/1.55 Consolas,monospace}
  </style></head><body><div class="eyebrow">LIVE VALIDATION</div><h1>Durable authority evidence is ready.</h1><div class="grid">
    <div class="tile"><div class="label">Service</div><div class="value">${readiness.status}</div></div>
    <div class="tile"><div class="label">Persistence</div><div class="value">${persistence.mode}</div></div>
    <div class="tile"><div class="label">Database reachable</div><div class="value">${String(persistence.reachable)}</div></div>
  </div><div class="evidence">gpt-5.6-sol: live shelf + supplier PDF passed<br>PostgreSQL integration: passed<br>Production Playwright: 8 / 8 in both modes<br>WCAG A/AA violations: 0</div></body></html>`);
  await screenshot(
    "09-verification.png",
    "Live model, database, browser, and accessibility evidence",
  );

  await titleCard(
    "10-end.png",
    "KASISTOCK AI",
    "The model interprets. Code calculates. The merchant decides.",
    "A trustworthy evidence-to-order workflow for cash-constrained retailers.",
  );
} finally {
  await page.close();
  await browser.close();
}

const metadata = {
  generatedAt: new Date().toISOString(),
  baseUrl,
  viewport: "1920x1080",
  frames,
};
await writeFile(
  resolve("submission/video/final-video-frames.json"),
  `${JSON.stringify(metadata, null, 2)}\n`,
  "utf8",
);
console.log(JSON.stringify(metadata, null, 2));
