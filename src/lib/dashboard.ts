import {
  buildBundestagTrend,
  currentAverage,
  type HouseEffects,
  houseEffects,
  instituteComparison,
  latestPerInstitute,
  surveysWithinDays,
  TREND_WINDOW_DAYS,
  type TrendWindowKey,
  type TrendWindows,
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
    (Object.entries(HOUSE_EFFECT_WINDOWS) as [HouseEffectWindowKey, number][]).map(
      ([key, days]) => [key, houseEffects(surveysWithinDays(surveys, days))],
    ),
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
      ([key, days]) => [key, buildBundestagTrend(surveys, { windowDays: days })],
    ),
  ) as TrendWindows;

  return {
    average,
    comparison,
    houseEffects: houseEffectsWindows,
    contributingSurveys,
    trends,
  };
}
