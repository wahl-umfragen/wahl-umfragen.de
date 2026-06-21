import {
  buildBundestagTrend,
  comparePartyAverages,
  currentAverage,
  type HouseEffects,
  houseEffects,
  instituteComparison,
  latestPerInstitute,
  NON_PARTISAN,
  type PartyComparisonRow,
  surveysWithinDays,
  TREND_WINDOW_DAYS,
  type TrendWindowKey,
  type TrendWindows,
  weightedAverage,
} from "@/lib/dawum";
import type { NormalizedSurvey } from "@/lib/dawum/types";

/** Selectable look-back windows for house effects, in days. `all` is large
 * enough to cover the whole dataset. */
export const HOUSE_EFFECT_WINDOWS = {
  "30": 30,
  "90": 90,
  "180": 180,
  "365": 365,
  all: 100_000,
} as const;

export type HouseEffectWindowKey = keyof typeof HOUSE_EFFECT_WINDOWS;
export type HouseEffectWindows = Record<HouseEffectWindowKey, HouseEffects>;

/** Selectable look-back distances (days) for the over-time comparison: how the
 * current weighted average moved versus that many days ago. */
export const COMPARISON_WINDOWS = {
  "30": 30,
  "90": 90,
  "180": 180,
  "365": 365,
} as const;

export type ComparisonWindowKey = keyof typeof COMPARISON_WINDOWS;
export type ComparisonWindows = Record<
  ComparisonWindowKey,
  PartyComparisonRow[]
>;

const DAY = 86_400_000;

/** Surveys whose date falls in [fromMs, toMs]. */
function inRange(surveys: NormalizedSurvey[], fromMs: number, toMs: number) {
  return surveys.filter((s) => {
    const ms = new Date(s.date).getTime();
    return ms >= fromMs && ms <= toMs;
  });
}

const EMPTY_COMPARISON: ComparisonWindows = {
  "30": [],
  "90": [],
  "180": [],
  "365": [],
};

/**
 * Diff the current weighted average ("now": newest 30 days) against the 30-day
 * window ending `days` ago, for each selectable look-back. Precomputed per
 * window so the client toggles without a server round-trip (mirrors the trend /
 * house-effects windows). Non-partisan buckets ("Sonstige") are dropped.
 */
function buildComparisonWindows(
  surveys: NormalizedSurvey[],
): ComparisonWindows {
  if (surveys.length === 0) return EMPTY_COMPARISON;
  const newest = Math.max(...surveys.map((s) => new Date(s.date).getTime()));
  const now = weightedAverage(inRange(surveys, newest - 30 * DAY, newest));
  return Object.fromEntries(
    (Object.entries(COMPARISON_WINDOWS) as [ComparisonWindowKey, number][]).map(
      ([key, days]) => {
        const anchor = newest - days * DAY;
        const then = weightedAverage(
          inRange(surveys, anchor - 30 * DAY, anchor),
        );
        return [
          key,
          comparePartyAverages(now, then).filter(
            (r) => !NON_PARTISAN.has(r.shortcut),
          ),
        ];
      },
    ),
  ) as ComparisonWindows;
}

/**
 * Build the shared poll-dashboard view models from a parliament's surveys
 * (Bundestag or a Landtag). Parliament-agnostic: the seat distribution, which
 * needs per-parliament seat/threshold rules, is computed by the caller from the
 * returned `average`. `buildBundestagTrend` is named for its origin but just
 * windows whatever surveys it's given.
 */
export function buildDashboardData(surveys: NormalizedSurvey[]) {
  // Current standing & comparison only count institutes active within a year.
  const within = surveysWithinDays(surveys, 365);
  const latest = latestPerInstitute(within);
  const average = currentAverage(latest);
  const comparison = instituteComparison(latest);

  // Precompute house effects per look-back window so the client can switch
  // between them without a server round-trip (mirrors the trend windows).
  const houseEffectsWindows = Object.fromEntries(
    (
      Object.entries(HOUSE_EFFECT_WINDOWS) as [HouseEffectWindowKey, number][]
    ).map(([key, days]) => [
      key,
      houseEffects(surveysWithinDays(surveys, days)),
    ]),
  ) as HouseEffectWindows;

  const contributingSurveys = latest
    .map((s) => ({
      id: s.id,
      instituteId: s.institute.id,
      institute: s.institute.name,
      date: s.date,
    }))
    .sort((a, b) => b.date.localeCompare(a.date));

  const trends = Object.fromEntries(
    (Object.entries(TREND_WINDOW_DAYS) as [TrendWindowKey, number][]).map(
      ([key, days]) => [
        key,
        buildBundestagTrend(surveys, { windowDays: days }),
      ],
    ),
  ) as TrendWindows;

  return {
    average,
    comparison,
    comparisonWindows: buildComparisonWindows(surveys),
    houseEffects: houseEffectsWindows,
    contributingSurveys,
    trends,
  };
}
