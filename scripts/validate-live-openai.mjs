import OpenAI from "openai";

const apiKey = process.env.OPENAI_API_KEY?.trim();
const model = process.env.OPENAI_MODEL?.trim();

if (!apiKey) {
  console.error("OPENAI_API_KEY is not configured.");
  process.exit(1);
}
if (!model) {
  console.error("OPENAI_MODEL is not configured.");
  process.exit(1);
}

const client = new OpenAI({ apiKey });
const startedAt = Date.now();

try {
  const response = await client.responses.create({
    model,
    store: false,
    max_output_tokens: 40,
    input: "Return exactly: KASISTOCK_OPENAI_READY",
  });
  const output = response.output_text.trim();
  if (output !== "KASISTOCK_OPENAI_READY") {
    throw new Error(`Unexpected validation response: ${output || "<empty>"}`);
  }

  console.log(
    JSON.stringify(
      {
        status: "ready",
        model,
        responseId: response.id,
        latencyMs: Date.now() - startedAt,
      },
      null,
      2,
    ),
  );
} catch (error) {
  console.error(
    JSON.stringify(
      {
        status: "failed",
        model,
        error: error instanceof Error ? error.message : "Unknown OpenAI error",
      },
      null,
      2,
    ),
  );
  process.exit(1);
}
