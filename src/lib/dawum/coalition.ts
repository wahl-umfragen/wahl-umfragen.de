export interface CoalitionInputParty {
  shortcut: string;
  percent: number;
}

export interface CoalitionResult {
  selectedSum: number;
  eligibleSum: number;
  share: number;
  hasMajority: boolean;
  excludedBelowThreshold: string[];
}

const DEFAULT_THRESHOLD = 5;
const MAJORITY_SHARE = 0.5;

/**
 * Compute coalition arithmetic under a simple "Fünf-Prozent-Hürde" model.
 *
 * Only parties at or above `thresholdPercent` count toward Bundestag seats,
 * so the effective denominator is the sum of those parties' votes — not 100.
 * A coalition has a majority if its share of that pool is strictly above 50%.
 */
export function coalitionMath(
  parties: CoalitionInputParty[],
  selected: ReadonlySet<string>,
  thresholdPercent: number = DEFAULT_THRESHOLD,
): CoalitionResult {
  const eligible = parties.filter((p) => p.percent >= thresholdPercent);
  const eligibleSum = sumPercent(eligible);

  const selectedEligible = eligible.filter((p) => selected.has(p.shortcut));
  const selectedSum = sumPercent(selectedEligible);

  const share = eligibleSum > 0 ? selectedSum / eligibleSum : 0;

  const excludedBelowThreshold = parties
    .filter((p) => selected.has(p.shortcut) && p.percent < thresholdPercent)
    .map((p) => p.shortcut);

  return {
    selectedSum,
    eligibleSum,
    share,
    hasMajority: share > MAJORITY_SHARE,
    excludedBelowThreshold,
  };
}

function sumPercent(parties: CoalitionInputParty[]): number {
  return parties.reduce((acc, p) => acc + p.percent, 0);
}
