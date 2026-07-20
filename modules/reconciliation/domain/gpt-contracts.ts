import { z } from "zod";

export const gptProductMatchSuggestionSchema = z.object({
  sourceKey: z.string().min(1),
  candidateProductId: z.string().nullable(),
  confidence: z.enum(["high", "medium", "low"]),
  reasoning: z.string().min(1).max(500),
});

export const gptProductMatchBatchSchema = z.object({
  suggestions: z.array(gptProductMatchSuggestionSchema),
});

export type GptProductMatchBatch = z.infer<typeof gptProductMatchBatchSchema>;
