import type { CanonicalProduct } from "@/modules/catalogue/domain/product";
import type { GptProductMatchBatch } from "../domain/gpt-contracts";
import type { MatchCandidate, ProductMatchProposal } from "../domain/contracts";

export function mergeGptProposals(
  deterministic: readonly ProductMatchProposal[],
  batch: GptProductMatchBatch,
  products: readonly CanonicalProduct[],
): ProductMatchProposal[] {
  const suggestions = new Map(batch.suggestions.map((item) => [item.sourceKey, item]));
  const productMap = new Map(products.map((product) => [product.productId, product]));

  return deterministic.map((proposal) => {
    if (proposal.status === "auto_confirmed") return proposal;
    const suggestion = suggestions.get(proposal.source.sourceKey);
    if (!suggestion?.candidateProductId) return proposal;
    const product = productMap.get(suggestion.candidateProductId);
    if (!product) return proposal;

    const confidenceScore =
      suggestion.confidence === "high" ? 8_500 : suggestion.confidence === "medium" ? 7_000 : 5_500;
    const existing = proposal.candidates.filter(
      (candidate) => candidate.productId !== suggestion.candidateProductId,
    );

    const gptCandidate: MatchCandidate = {
      productId: product.productId,
      displayName: product.displayName,
      method: "gpt_proposal",
      scoreBasisPoints: confidenceScore,
      explanation: suggestion.reasoning,
    };

    return {
      ...proposal,
      candidates: [gptCandidate, ...existing].slice(0, 3),
      recommendedProductId: product.productId,
      status: "requires_confirmation",
      proposer: "gpt",
    };
  });
}
