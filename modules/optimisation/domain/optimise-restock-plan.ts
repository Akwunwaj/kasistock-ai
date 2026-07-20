import { cents } from "@/modules/shared/domain/money";
import type { OptimisationResult, RestockCandidate, SelectedRestockLine } from "./types";

const SCORE_SCALE = 1_000;

function candidateUtility(candidate: RestockCandidate): number {
  const grossProfit = candidate.expectedMarginPerPackCents;
  const stockOutBenefit = candidate.stockOutRiskScore * 1_200;
  const essentialBenefit = candidate.essentialityScore * 900;
  const expiryPenalty = candidate.expiryRiskScore * 700;
  return grossProfit + stockOutBenefit + essentialBenefit - expiryPenalty;
}

function compareCandidates(a: RestockCandidate, b: RestockCandidate): number {
  const aEfficiency = candidateUtility(a) / a.packCostCents;
  const bEfficiency = candidateUtility(b) / b.packCostCents;
  if (aEfficiency !== bEfficiency) return bEfficiency - aEfficiency;
  if (candidateUtility(a) !== candidateUtility(b)) return candidateUtility(b) - candidateUtility(a);
  return a.productId.localeCompare(b.productId);
}

/**
 * Deterministic scaffold optimiser.
 *
 * This first implementation uses stable utility-per-cent ordering while enforcing
 * pack-size, maximum-demand, and budget invariants. The production iteration will
 * replace the allocation strategy with bounded dynamic programming without changing
 * this public contract.
 */
export function optimiseRestockPlan(
  candidates: readonly RestockCandidate[],
  budgetCents: number,
): OptimisationResult {
  const budget = cents(budgetCents);
  const ranked = [...candidates].sort(compareCandidates);
  const selected: SelectedRestockLine[] = [];
  let spent = 0;

  for (const candidate of ranked) {
    if (candidate.packCostCents <= 0 || candidate.maximumPacks <= 0) continue;
    const affordablePacks = Math.floor((budget - spent) / candidate.packCostCents);
    const selectedPacks = Math.min(candidate.maximumPacks, affordablePacks);
    if (selectedPacks <= 0) continue;

    const lineCost = selectedPacks * candidate.packCostCents;
    spent += lineCost;
    selected.push({
      ...candidate,
      selectedPacks,
      selectedUnits: selectedPacks * candidate.packQuantity,
      lineCostCents: cents(lineCost),
      objectiveContribution:
        Math.round(candidateUtility(candidate) * selectedPacks * SCORE_SCALE) / SCORE_SCALE,
    });
  }

  return {
    budgetCents: budget,
    totalCostCents: cents(spent),
    remainingCents: cents(budget - spent),
    lines: selected,
  };
}
