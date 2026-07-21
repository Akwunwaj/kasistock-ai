import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import OpenAI from "openai";

const apiKey = process.env.OPENAI_API_KEY?.trim();
if (!apiKey) throw new Error("OPENAI_API_KEY is not configured.");

const narration = `This demonstration uses an AI-generated narrator.

Small retailers often restock from memory, a quick shelf check, inconsistent supplier catalogues, and a fixed amount of cash. KasiStock AI answers a practical question: what should I buy today, from which supplier, and in which pack sizes, without exceeding my budget?

The evidence workspace accepts shelf photographs, supplier PDFs or images, and recent sales history. GPT-5.6 Sol extracts visible products, quantities, prices, and pack details into strict structured contracts. But valid JSON is not business authority. Every uncertain observation stays visible until a merchant accepts or corrects it, and the server binds the accepted snapshot to the original file hash.

Product names rarely line up across a shelf, sales export, and supplier list. Deterministic rules try barcodes, governed aliases, and exact normalized names first. Fuzzy and GPT-assisted candidates remain proposals. The merchant explicitly confirms uncertain identities before the mapping set is frozen and hashed.

Only then does deterministic TypeScript calculate sales velocity, days of cover, demand ceilings, effective supplier costs, and the budget-constrained basket. All money uses integer cents. The merchant can edit pack quantities, but cannot exceed accepted demand or the available cash.

The browser never creates the authoritative order. It submits requested selections, and the server rebuilds the draft from accepted evidence and mappings, verifies every constraint, hashes it, and signs it. After an explicit approval, KasiStock generates two supplier-specific purchase orders, integrity-bound PDFs, WhatsApp-ready messages, and six immutable audit events.

Starting from the verified submission archive, this primary Codex task genuinely added durable PostgreSQL persistence for every authority layer, atomic approval writes, migrations, and real database tests. Live GPT-5.6 validation found a PDF encoding defect and, importantly, a model date error. The raw 2025 result stayed immutable while the visible 2026 date was corrected only in a separate accepted snapshot.

The final gates passed thirty-seven normal tests, a real PostgreSQL authority-chain test, and eight production Playwright tests in both durable and prepared-fallback modes, with zero WCAG A or double-A violations. KasiStock AI makes the boundary simple: the model interprets, deterministic code calculates, and the merchant decides.`;

if (narration.length > 4096)
  throw new Error(`Narration exceeds the TTS limit: ${narration.length}`);

const client = new OpenAI({ apiKey });
const response = await client.audio.speech.create({
  model: "gpt-4o-mini-tts",
  voice: "marin",
  input: narration,
  instructions:
    "Warm, credible product-demo narration in clear English. Moderate pace around 125 words per minute. Use natural pauses between paragraphs. Pronounce KasiStock as kah-see-stock, Zod as zod, and WCAG as double-u-cag.",
  response_format: "mp3",
});
const bytes = Buffer.from(await response.arrayBuffer());
const outputPath = resolve("submission/video/kasistock-ai-narration.mp3");
await mkdir(resolve("submission/video"), { recursive: true });
await writeFile(outputPath, bytes);
console.log(
  JSON.stringify({ outputPath, bytes: bytes.length, model: "gpt-4o-mini-tts", voice: "marin" }),
);
