import {
  buildBundestagTrend,
  currentAverage,
  houseEffects,
  instituteComparison,
  latestPerInstitute,
  surveysWithinDays,
  TREND_WINDOW_DAYS,
  type TrendWindowKey,
  type TrendWindows,
} from "@/lib/dawum";
import type { NormalizedSurvey } from "@/lib/dawum/types";

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
  const houseEffectsData = houseEffects(within);

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
    houseEffects: houseEffectsData,
    contributingSurveys,
    trends,
  };
}
