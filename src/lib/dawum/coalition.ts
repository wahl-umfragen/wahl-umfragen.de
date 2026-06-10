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

export interface MajorityCoalition {
  /** Member party shortcuts, strongest first. */
  parties: string[];
  /** Combined percentage of the members. */
  sum: number;
  /** Share of the (above-threshold) seat pool, 0..1. */
  share: number;
}

/** Non-partisan buckets that can't be coalition members. */
const NON_PARTISAN_SHORTCUTS = new Set([
  "Sonstige",
  "Sonstige Parteien",
  "Andere",
]);

/**
 * Enumerate all **minimal winning coalitions**: combinations of above-threshold
 * parties that hold a majority of the seat pool, where dropping any single
 * member would lose that majority (so supersets of a winning coalition are not
 * listed). This is the standard "which coalitions have a majority" view.
 *
 * Pure and deterministic. Eligible parties are capped (`maxParties`, default 8)
 * to bound the 2^n subset scan; coalitions larger than `maxSize` (default 4) are
 * dropped as politically irrelevant. Sorted by member count, then share desc.
 */
export function findMajorityCoalitions(
  parties: CoalitionInputParty[],
  {
    thresholdPercent = DEFAULT_THRESHOLD,
    maxParties = 8,
    maxSize = 4,
  }: { thresholdPercent?: number; maxParties?: number; maxSize?: number } = {},
): MajorityCoalition[] {
  const eligible = parties
    .filter(
      (p) =>
        p.percent >= thresholdPercent &&
        !NON_PARTISAN_SHORTCUTS.has(p.shortcut),
    )
    .sort((a, b) => b.percent - a.percent)
    .slice(0, maxParties);

  const pool = sumPercent(eligible);
  if (pool === 0) return [];

  const n = eligible.length;
  const winning: { mask: number; sum: number }[] = [];

  for (let mask = 1; mask < 1 << n; mask++) {
    let sum = 0;
    let size = 0;
    for (let i = 0; i < n; i++) {
      if (mask & (1 << i)) {
        sum += eligible[i].percent;
        size++;
      }
    }
    if (size <= maxSize && sum / pool > MAJORITY_SHARE) {
      winning.push({ mask, sum });
    }
  }

  // Minimal = no winning coalition is a strict subset of this one.
  const minimal = winning.filter(
    (w) =>
      !winning.some((o) => o.mask !== w.mask && (o.mask & w.mask) === o.mask),
  );

  return minimal
    .map(({ mask, sum }) => {
      const members: string[] = [];
      for (let i = 0; i < n; i++) {
        if (mask & (1 << i)) members.push(eligible[i].shortcut);
      }
      return { parties: members, sum, share: sum / pool };
    })
    .sort((a, b) => a.parties.length - b.parties.length || b.share - a.share);
}
