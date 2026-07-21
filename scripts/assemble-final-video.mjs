import { spawnSync } from "node:child_process";
import { access, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

const ffmpegPath = process.env.FFMPEG_PATH?.trim();
const ffprobePath = process.env.FFPROBE_PATH?.trim();
if (!ffmpegPath || !ffprobePath) {
  throw new Error("Set FFMPEG_PATH and FFPROBE_PATH to verified local binaries.");
}

await Promise.all([access(ffmpegPath), access(ffprobePath)]);

const videoDirectory = resolve("submission/video");
const framesDirectory = resolve(videoDirectory, "frames");
const audioPath = resolve(videoDirectory, "kasistock-ai-narration.mp3");
const captionsPath = resolve(videoDirectory, "kasistock-ai-demo.srt");
const manifestPath = resolve(tmpdir(), "kasistock-final-video-concat.txt");
const outputPath = resolve(videoDirectory, "kasistock-ai-demo.mp4");

const probe = spawnSync(
  ffprobePath,
  ["-v", "error", "-show_entries", "format=duration", "-of", "json", audioPath],
  { encoding: "utf8" },
);
if (probe.status !== 0) throw new Error(probe.stderr || "Could not inspect narration audio.");
const audioDuration = Number(JSON.parse(probe.stdout).format.duration);
if (!Number.isFinite(audioDuration) || audioDuration <= 0 || audioDuration >= 180) {
  throw new Error(`Unexpected narration duration: ${audioDuration}`);
}

const captions = [
  "This demonstration uses an AI-generated narrator.",
  "Small retailers often restock from memory, a quick shelf check, inconsistent supplier catalogues, and a fixed amount of cash.",
  "KasiStock AI answers a practical question: what should I buy today, from which supplier, and in which pack sizes, without exceeding my budget?",
  "The evidence workspace accepts shelf photographs, supplier PDFs or images, and recent sales history.",
  "GPT-5.6 Sol extracts visible products, quantities, prices, and pack details into strict structured contracts.",
  "But valid JSON is not business authority. Every uncertain observation stays visible until a merchant accepts or corrects it.",
  "The server then binds the accepted snapshot to the original file hash.",
  "Product names rarely line up across a shelf, sales export, and supplier list.",
  "Deterministic rules try barcodes, governed aliases, and exact normalized names first.",
  "Fuzzy and GPT-assisted candidates remain proposals. The merchant explicitly confirms uncertain identities before the mapping set is frozen and hashed.",
  "Only then does deterministic TypeScript calculate sales velocity, days of cover, demand ceilings, effective supplier costs, and the budget-constrained basket.",
  "All money uses integer cents. The merchant can edit pack quantities, but cannot exceed accepted demand or the available cash.",
  "The browser never creates the authoritative order. It submits requested selections, and the server rebuilds the draft from accepted evidence and mappings.",
  "The server verifies every constraint, hashes the draft, and signs it.",
  "After explicit approval, KasiStock generates two supplier-specific purchase orders, integrity-bound PDFs, WhatsApp-ready messages, and six immutable audit events.",
  "Starting from the verified submission archive, this primary Codex task genuinely added durable PostgreSQL persistence for every authority layer, atomic approval writes, migrations, and real database tests.",
  "Live GPT-5.6 validation found a PDF encoding defect and, importantly, a model date error.",
  "The raw 2025 result stayed immutable while the visible 2026 date was corrected only in a separate accepted snapshot.",
  "The final gates passed thirty-seven normal tests, a real PostgreSQL authority-chain test, and eight production Playwright tests in both durable and prepared-fallback modes.",
  "Those accessibility tests found zero WCAG A or double-A violations.",
  "KasiStock AI makes the boundary simple: the model interprets, deterministic code calculates, and the merchant decides.",
];

function timestamp(seconds) {
  const milliseconds = Math.max(0, Math.round(seconds * 1000));
  const hours = Math.floor(milliseconds / 3_600_000);
  const minutes = Math.floor((milliseconds % 3_600_000) / 60_000);
  const secs = Math.floor((milliseconds % 60_000) / 1000);
  const millis = milliseconds % 1000;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")},${String(millis).padStart(3, "0")}`;
}

const totalWords = captions.reduce((sum, caption) => sum + caption.split(/\s+/).length, 0);
let cursor = 0;
const captionBlocks = captions.map((caption, index) => {
  const wordShare = caption.split(/\s+/).length / totalWords;
  const start = cursor;
  cursor = index === captions.length - 1 ? audioDuration : cursor + audioDuration * wordShare;
  return `${index + 1}\n${timestamp(start)} --> ${timestamp(cursor)}\n${caption}\n`;
});
await writeFile(captionsPath, captionBlocks.join("\n"), "utf8");

const scenes = [
  ["01-title.png", 4],
  ["02-home.png", 18],
  ["03-evidence.png", 24],
  ["04-mapping.png", 20],
  ["05-optimisation.png", 21],
  ["06-signed-draft.png", 12],
  ["07-approved.png", 27],
  ["08-architecture.png", 10],
  ["09-verification.png", 15],
  ["10-end.png", 4],
];
const sceneWeight = scenes.reduce((sum, [, duration]) => sum + duration, 0);
const videoDuration = audioDuration + 0.4;
const manifest = scenes
  .flatMap(([filename, weight], index) => {
    const filePath = resolve(framesDirectory, filename).replaceAll("\\", "/");
    const rows = [`file '${filePath}'`, `duration ${(videoDuration * weight) / sceneWeight}`];
    if (index === scenes.length - 1) rows.push(`file '${filePath}'`);
    return rows;
  })
  .join("\n");
await writeFile(manifestPath, `${manifest}\n`, "utf8");

const relativeCaptions = "submission/video/kasistock-ai-demo.srt";
const ffmpeg = spawnSync(
  ffmpegPath,
  [
    "-y",
    "-f",
    "concat",
    "-safe",
    "0",
    "-i",
    manifestPath,
    "-i",
    audioPath,
    "-vf",
    `subtitles=${relativeCaptions}:force_style='FontName=Arial,FontSize=11,PrimaryColour=&H00FFFFFF,OutlineColour=&H00132D25,BorderStyle=1,Outline=1,Shadow=0,MarginV=26,Alignment=2'`,
    "-c:v",
    "libx264",
    "-preset",
    "medium",
    "-crf",
    "18",
    "-r",
    "30",
    "-pix_fmt",
    "yuv420p",
    "-c:a",
    "aac",
    "-b:a",
    "192k",
    "-shortest",
    "-movflags",
    "+faststart",
    outputPath,
  ],
  { encoding: "utf8", maxBuffer: 4 * 1024 * 1024 },
);
if (ffmpeg.status !== 0) throw new Error(ffmpeg.stderr || "FFmpeg assembly failed.");

const metadata = {
  generatedAt: new Date().toISOString(),
  narrationSeconds: audioDuration,
  frameCount: scenes.length,
  captionCount: captions.length,
  resolution: "1920x1080",
  output: "submission/video/kasistock-ai-demo.mp4",
  disclosure: "AI-generated narration using an OpenAI built-in voice.",
};
await writeFile(
  resolve(videoDirectory, "final-video-metadata.json"),
  `${JSON.stringify(metadata, null, 2)}\n`,
  "utf8",
);
console.log(JSON.stringify(metadata));
