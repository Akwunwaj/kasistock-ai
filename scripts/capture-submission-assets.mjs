import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { chromium } from "playwright";
import { fetchStandaloneHtml } from "./static-page.mjs";

const root = process.cwd();
const outputDirectory = resolve(root, "submission", "screenshots");
const videoDirectory = resolve(root, "submission", "video");
mkdirSync(outputDirectory, { recursive: true });
mkdirSync(videoDirectory, { recursive: true });

const port = process.env.CAPTURE_PORT ?? "3015";
const externallyManaged = Boolean(process.env.CAPTURE_BASE_URL);
const baseUrl = process.env.CAPTURE_BASE_URL ?? `http://127.0.0.1:${port}`;
const chromiumPath = [
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
  "/usr/bin/google-chrome",
].find((candidate) => candidate && existsSync(candidate));

let server;
async function waitUntilReady() {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/api/health`);
      if (response.ok) return;
    } catch {
      // Server is still starting.
    }
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 500));
  }
  throw new Error(`KasiStock AI did not become ready at ${baseUrl}.`);
}

const captures = [
  { route: "/", filename: "01-home-dashboard.png" },
  { route: "/submission-preview/evidence", filename: "02-human-evidence-review.png" },
  { route: "/submission-preview/approved", filename: "03-approved-supplier-orders.png" },
  { route: "/architecture", filename: "04-trust-boundaries.png" },
];

try {
  if (!externallyManaged) {
    server = spawn("npm", ["run", "start"], {
      cwd: root,
      env: { ...process.env, PORT: port, HOSTNAME: "127.0.0.1" },
      stdio: ["ignore", "pipe", "pipe"],
    });
    server.stdout?.on("data", (chunk) => process.stdout.write(chunk));
    server.stderr?.on("data", (chunk) => process.stderr.write(chunk));
  }

  await waitUntilReady();
  const browser = await chromium.launch({
    headless: true,
    executablePath: chromiumPath,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });

  for (const capture of captures) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const html = await fetchStandaloneHtml(baseUrl, capture.route);
    await page.setContent(html, { waitUntil: "domcontentloaded" });
    await page.screenshot({ path: resolve(outputDirectory, capture.filename) });
    await page.close();
  }
  await browser.close();

  const targetVideoPath = resolve(videoDirectory, "kasistock-ai-demo-draft.mp4");
  const imagePattern = resolve(outputDirectory, "*.png");
  const ffmpeg = spawnSync(
    "ffmpeg",
    [
      "-y",
      "-framerate",
      "1/4",
      "-pattern_type",
      "glob",
      "-i",
      imagePattern,
      "-vf",
      "scale=1440:900:force_original_aspect_ratio=decrease,pad=1440:900:(ow-iw)/2:(oh-ih)/2,format=yuv420p",
      "-c:v",
      "libx264",
      "-r",
      "30",
      "-movflags",
      "+faststart",
      targetVideoPath,
    ],
    { encoding: "utf8" },
  );
  if (ffmpeg.status !== 0) {
    throw new Error(`ffmpeg failed: ${ffmpeg.stderr || ffmpeg.stdout}`);
  }

  const metadata = {
    generatedAt: new Date().toISOString(),
    baseUrl,
    mode: "offline server-rendered DOM",
    viewport: "1440x900",
    screenshots: captures.map((capture) => capture.filename),
    draftVideo: "submission/video/kasistock-ai-demo-draft.mp4",
  };
  writeFileSync(resolve(outputDirectory, "assets.json"), `${JSON.stringify(metadata, null, 2)}\n`);
  console.log(JSON.stringify(metadata, null, 2));
} finally {
  if (server && !server.killed) server.kill("SIGTERM");
}
