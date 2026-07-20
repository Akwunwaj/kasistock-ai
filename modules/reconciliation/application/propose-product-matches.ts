import { createHash } from "node:crypto";
import type { CanonicalProduct } from "@/modules/catalogue/domain/product";
import type {
  MatchCandidate,
  ProductMatchProposal,
  SourceProductRecord,
} from "../domain/contracts";
import { normaliseProductName, tokenSimilarityBasisPoints } from "./normalise-product-name";

const FUZZY_RECOMMENDATION_THRESHOLD = 6_200;
const FUZZY_LEAD_THRESHOLD = 750;

export function proposeProductMatches(
  records: readonly SourceProductRecord[],
  products: readonly CanonicalProduct[],
): ProductMatchProposal[] {
  return records.map((record) => proposeOne(record, products));
}

function proposeOne(
  source: SourceProductRecord,
  products: readonly CanonicalProduct[],
): ProductMatchProposal {
  const barcodeMatch = source.barcode
    ? products.find((product) => product.barcodes.includes(source.barcode as string))
    : undefined;
  if (barcodeMatch) {
    return proposal(source, [candidate(barcodeMatch, "barcode", 10_000, "Exact barcode match.")], {
      recommendedProductId: barcodeMatch.productId,
      status: "auto_confirmed",
    });
  }

  const sourceNormalised = normaliseProductName(source.rawProductName);
  const exact = products
    .map((product) => {
      const names = [product.displayName, ...product.aliases];
      const matchedName = names.find((name) => normaliseProductName(name) === sourceNormalised);
      return matchedName ? { product, matchedName } : null;
    })
    .find((value) => value !== null);

  if (exact) {
    const method =
      normaliseProductName(exact.product.displayName) === sourceNormalised
        ? "normalised_name"
        : "exact_alias";
    return proposal(
      source,
      [
        candidate(
          exact.product,
          method,
          method === "normalised_name" ? 9_950 : 9_900,
          `Exact match after safe normalisation against ${method === "exact_alias" ? "a governed alias" : "the canonical name"}.`,
        ),
      ],
      { recommendedProductId: exact.product.productId, status: "auto_confirmed" },
    );
  }

  const ranked = products
    .map((product) => {
      const bestScore = Math.max(
        tokenSimilarityBasisPoints(source.rawProductName, product.displayName),
        ...product.aliases.map((alias) => tokenSimilarityBasisPoints(source.rawProductName, alias)),
      );
      return candidate(
        product,
        "token_similarity",
        bestScore,
        `Token and pack-size similarity score: ${(bestScore / 100).toFixed(1)}%.`,
      );
    })
    .sort(
      (left, right) =>
        right.scoreBasisPoints - left.scoreBasisPoints ||
        left.productId.localeCompare(right.productId),
    )
    .slice(0, 3);

  const first = ranked[0];
  const second = ranked[1];
  const isRecommended =
    first !== undefined &&
    first.scoreBasisPoints >= FUZZY_RECOMMENDATION_THRESHOLD &&
    first.scoreBasisPoints - (second?.scoreBasisPoints ?? 0) >= FUZZY_LEAD_THRESHOLD;

  return proposal(source, ranked, {
    recommendedProductId: isRecommended ? first.productId : null,
    status: isRecommended ? "requires_confirmation" : "unmatched",
  });
}

function candidate(
  product: CanonicalProduct,
  method: MatchCandidate["method"],
  scoreBasisPoints: number,
  explanation: string,
): MatchCandidate {
  return {
    productId: product.productId,
    displayName: product.displayName,
    method,
    scoreBasisPoints,
    explanation,
  };
}

function proposal(
  source: SourceProductRecord,
  candidates: MatchCandidate[],
  result: Pick<ProductMatchProposal, "recommendedProductId" | "status">,
): ProductMatchProposal {
  return {
    proposalId: createHash("sha256").update(source.sourceKey).digest("hex").slice(0, 20),
    source,
    candidates,
    ...result,
    proposer: "deterministic",
  };
}
