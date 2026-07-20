import "server-only";
import OpenAI from "openai";

let client: OpenAI | undefined;

export function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured. Add it to .env.local on the server.");
  }

  client ??= new OpenAI({ apiKey });
  return client;
}

export function getExtractionModel(): string {
  return process.env.OPENAI_MODEL ?? "gpt-5.6-sol";
}
