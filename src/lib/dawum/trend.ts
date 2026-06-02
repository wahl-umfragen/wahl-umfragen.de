import type { NormalizedSurvey } from "./types";

export interface TrendPoint {
  date: number;
  surveyId: string;
  instituteId: string;
  instituteName: string;
  [partyShortcut: string]: number | string;
}

export interface TrendSeries {
  shortcut: string;
  name: string;
  appearances: number;
}

export interface TrendData {
  points: TrendPoint[];
  series: TrendSeries[];
  range: { from: number; to: number } | null;
}

/** Selectable trend windows, in days from the newest survey. `all` uses a
 * value large enough to cover the whole dataset (dawum starts ~2017). */
export const TREND_WINDOW_DAYS = {
  "90": 90,
  "365": 365,
  all: 100_000,
} as const;

export type TrendWindowKey = keyof typeof TREND_WINDOW_DAYS;

export type TrendWindows = Record<TrendWindowKey, TrendData>;

export interface BuildTrendOptions {
  /** Maximum age of a survey in days, measured from the newest survey's date. */
  windowDays?: number;
  /** Lower bound on how often a party must appear to be charted. */
  minAppearances?: number;
}

export function buildBundestagTrend(
  surveys: NormalizedSurvey[],
  options: BuildTrendOptions = {},
): TrendData {
  const { windowDays = 90, minAppearances = 2 } = options;

  if (surveys.length === 0) {
    return { points: [], series: [], range: null };
  }

  const sortedAsc = [...surveys].sort((a, b) => a.date.localeCompare(b.date));
  const newest = new Date(sortedAsc[sortedAsc.length - 1].date).getTime();
  const cutoff = newest - windowDays * 24 * 60 * 60 * 1000;

  const inWindow = sortedAsc.filter(
    (s) => new Date(s.date).getTime() >= cutoff,
  );
  if (inWindow.length === 0) {
    return { points: [], series: [], range: null };
  }

  const counts = new Map<string, { name: string; n: number }>();
  for (const s of inWindow) {
    for (const r of s.results) {
      const prev = counts.get(r.shortcut);
      if (prev) prev.n += 1;
      else counts.set(r.shortcut, { name: r.name, n: 1 });
    }
  }

  const series: TrendSeries[] = [...counts.entries()]
    .filter(([, v]) => v.n >= minAppearances)
    .map(([shortcut, v]) => ({ shortcut, name: v.name, appearances: v.n }))
    .sort((a, b) => b.appearances - a.appearances);

  const seriesShortcuts = new Set(series.map((s) => s.shortcut));

  const points: TrendPoint[] = inWindow.map((s) => {
    const row: TrendPoint = {
      date: new Date(s.date).getTime(),
      surveyId: s.id,
      instituteId: s.institute.id,
      instituteName: s.institute.name,
    };
    for (const r of s.results) {
      if (seriesShortcuts.has(r.shortcut)) row[r.shortcut] = r.percent;
    }
    return row;
  });

  const first = points[0].date;
  const last = points[points.length - 1].date;

  return { points, series, range: { from: first, to: last } };
}

/**
 * Smooth each party series with a trailing simple moving average over the last
 * `window` samples that actually reported that party. Reduces the zig-zag from
 * differing institute house effects while keeping the same x positions, so the
 * chart stays aligned with the raw survey dates. Points are cloned; the input
 * is not mutated.
 */
export function smoothTrendData(data: TrendData, window = 5): TrendData {
  if (window <= 1 || data.points.length === 0) return data;

  const smoothed: TrendPoint[] = data.points.map((p) => ({ ...p }));

  for (const s of data.series) {
    const recent: number[] = [];
    for (let i = 0; i < data.points.length; i++) {
      const value = data.points[i][s.shortcut];
      if (typeof value !== "number") continue;
      recent.push(value);
      if (recent.length > window) recent.shift();
      const avg = recent.reduce((acc, n) => acc + n, 0) / recent.length;
      smoothed[i][s.shortcut] = Math.round(avg * 100) / 100;
    }
  }

  return { ...data, points: smoothed };
}
