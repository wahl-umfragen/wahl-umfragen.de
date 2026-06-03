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
 * Smoothing window (in samples) per selectable trend range. The window scales
 * with the range: the longer the period, the more survey points it holds, so a
 * wider average smooths house-effect noise without hiding real movement. A
 * fixed window (the old behaviour) over-smooths the dense short range and
 * barely touches the sparse-looking long range. Values are odd so the centered
 * average is symmetric.
 */
export const TREND_SMOOTHING_WINDOW: Record<TrendWindowKey, number> = {
  "90": 5,
  "365": 11,
  all: 21,
};

/**
 * Smooth each party series with a **centered** simple moving average spanning
 * `window` samples that actually reported that party (≈ half before, half
 * after the point). Centered rather than trailing, so the line carries **no
 * time lag** — turning points stay aligned with when they really happened
 * instead of being shifted later. The window shrinks at the edges where fewer
 * neighbours exist, and is capped at the number of available samples. x
 * positions are preserved, so the chart stays aligned with the raw survey
 * dates. Points are cloned; the input is not mutated.
 */
export function smoothTrendData(data: TrendData, window = 5): TrendData {
  if (window <= 1 || data.points.length === 0) return data;

  const smoothed: TrendPoint[] = data.points.map((p) => ({ ...p }));

  for (const s of data.series) {
    // Gather only the points that actually report this party, so gaps are
    // skipped rather than counted as zero, and the average is over real samples.
    const idx: number[] = [];
    const vals: number[] = [];
    for (let i = 0; i < data.points.length; i++) {
      const value = data.points[i][s.shortcut];
      if (typeof value === "number") {
        idx.push(i);
        vals.push(value);
      }
    }

    const span = Math.min(window, vals.length);
    const half = Math.floor(span / 2);
    for (let j = 0; j < vals.length; j++) {
      const lo = Math.max(0, j - half);
      const hi = Math.min(vals.length - 1, j + half);
      let sum = 0;
      for (let k = lo; k <= hi; k++) sum += vals[k];
      const avg = sum / (hi - lo + 1);
      smoothed[idx[j]][s.shortcut] = Math.round(avg * 100) / 100;
    }
  }

  return { ...data, points: smoothed };
}
