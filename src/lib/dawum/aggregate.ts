import type { NormalizedSurvey } from "./types";

/** Aggregate "other parties" buckets that are not a single party. */
export const NON_PARTISAN = new Set([
  "Sonstige",
  "Sonstige Parteien",
  "Andere",
]);

/** Nominal Bundestag size after the 2023 electoral-law reform. */
export const BUNDESTAG_SEATS = 630;

/** Fünf-Prozent-Hürde. */
export const SEAT_THRESHOLD = 5;

export interface PartyAverage {
  shortcut: string;
  name: string;
  /** Mean share across the contributing institutes. */
  percent: number;
  /** How many institutes reported this party. */
  institutes: number;
}

/**
 * Returns party shortcuts ordered by their all-time mean reported percentage
 * across the given surveys, descending. Each party's mean only counts surveys
 * that actually reported it, so column order is not biased toward longevity.
 */
export function archivePartyOrder(surveys: NormalizedSurvey[]): string[] {
  const acc = new Map<string, { sum: number; n: number }>();
  for (const s of surveys) {
    for (const r of s.results) {
      const prev = acc.get(r.shortcut);
      if (prev) {
        prev.sum += r.percent;
        prev.n += 1;
      } else {
        acc.set(r.shortcut, { sum: r.percent, n: 1 });
      }
    }
  }
  return [...acc.entries()]
    .sort((a, b) => b[1].sum / b[1].n - a[1].sum / a[1].n)
    .map(([shortcut]) => shortcut);
}

/**
 * Average each party's share across a set of surveys (typically the latest
 * survey per institute). A party's mean only counts institutes that actually
 * reported it. Sorted by share, descending.
 */
export function currentAverage(surveys: NormalizedSurvey[]): PartyAverage[] {
  const acc = new Map<string, { name: string; sum: number; n: number }>();
  for (const s of surveys) {
    for (const r of s.results) {
      const prev = acc.get(r.shortcut);
      if (prev) {
        prev.sum += r.percent;
        prev.n += 1;
      } else {
        acc.set(r.shortcut, { name: r.name, sum: r.percent, n: 1 });
      }
    }
  }
  return [...acc.entries()]
    .map(([shortcut, v]) => ({
      shortcut,
      name: v.name,
      percent: v.sum / v.n,
      institutes: v.n,
    }))
    .sort((a, b) => b.percent - a.percent);
}

/**
 * For each survey, the change (in points) of every party's share versus the
 * **same institute's** immediately-preceding survey by date. Lets the UI show a
 * ▲/▼ delta next to each value. A party only gets a delta when the prior survey
 * also reported it. Returns a plain object keyed by survey id (JSON-serialisable
 * across the server→client boundary), each value a `shortcut → delta` record.
 * Pure: order-independent, anchored on the data, no wall-clock.
 */
export function instituteDeltas(
  surveys: NormalizedSurvey[],
): Record<string, Record<string, number>> {
  const byInstitute = new Map<string, NormalizedSurvey[]>();
  for (const s of surveys) {
    const list = byInstitute.get(s.institute.id) ?? [];
    list.push(s);
    byInstitute.set(s.institute.id, list);
  }

  const out: Record<string, Record<string, number>> = {};
  for (const list of byInstitute.values()) {
    // Oldest → newest, breaking date ties by id for determinism.
    const sorted = [...list].sort(
      (a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id),
    );
    for (let i = 1; i < sorted.length; i++) {
      const prev = new Map(
        sorted[i - 1].results.map((r) => [r.shortcut, r.percent]),
      );
      const deltas: Record<string, number> = {};
      for (const r of sorted[i].results) {
        const before = prev.get(r.shortcut);
        if (before !== undefined) {
          // Round to one decimal to avoid float noise like 0.30000000000004.
          deltas[r.shortcut] = Math.round((r.percent - before) * 10) / 10;
        }
      }
      out[sorted[i].id] = deltas;
    }
  }
  return out;
}

export interface PartyDataPoint {
  date: string;
  percent: number;
  institute: string;
  surveyId: string;
}

export interface PartySeries {
  /** One point per survey reporting the party, ascending by date. */
  points: PartyDataPoint[];
  /** Most recent point. */
  latest?: PartyDataPoint;
  /** All-time strongest reported value. */
  high?: PartyDataPoint;
  /** All-time weakest reported value. */
  low?: PartyDataPoint;
}

/**
 * Extract one party's history from a set of surveys: every survey that reports a
 * matching shortcut becomes a point, ascending by date, plus the latest, all-time
 * high and all-time low. `matches` decides which result shortcut belongs to the
 * party (parties change shortcuts over time — see the party registry's aliases).
 * Pure and deterministic; ties on date break by survey id.
 */
export function partySeries(
  surveys: NormalizedSurvey[],
  matches: (shortcut: string) => boolean,
): PartySeries {
  const points: PartyDataPoint[] = [];
  for (const s of surveys) {
    const hit = s.results.find((r) => matches(r.shortcut));
    if (hit) {
      points.push({
        date: s.date,
        percent: hit.percent,
        institute: s.institute.name,
        surveyId: s.id,
      });
    }
  }
  points.sort(
    (a, b) =>
      a.date.localeCompare(b.date) || a.surveyId.localeCompare(b.surveyId),
  );

  if (points.length === 0) return { points };

  let high = points[0];
  let low = points[0];
  for (const p of points) {
    if (p.percent > high.percent) high = p;
    if (p.percent < low.percent) low = p;
  }
  return { points, latest: points[points.length - 1], high, low };
}

export interface WeightedAverageOptions {
  /** Recency half-life in days: a survey this many days older than the newest
   * one in the set counts half as much. Smaller = more weight on fresh polls. */
  halfLifeDays?: number;
  /** Sample size that scores a weight of 1; others scale by sqrt(n / ref), so a
   * 4× larger sample counts ~2× (diminishing returns). Surveys without a sample
   * size get a neutral weight of 1. */
  refSampleSize?: number;
}

/**
 * "Poll of polls": a recency- and sample-size-weighted average across *all*
 * given surveys (not just the latest per institute). Each survey's weight is
 * `0.5^(ageDays / halfLifeDays) · sqrt(n / refSampleSize)`, where `ageDays` is
 * measured from the **newest survey in the set** (not the wall clock) so the
 * result is deterministic and unit-testable — mirroring `buildBundestagTrend`
 * and `surveysWithinDays`. Each party's mean only counts surveys that reported
 * it. Pass surveys already windowed (e.g. `surveysWithinDays(bundestag, 30)`).
 * `institutes` carries the count of contributing surveys for this estimate.
 */
export function weightedAverage(
  surveys: NormalizedSurvey[],
  { halfLifeDays = 14, refSampleSize = 1000 }: WeightedAverageOptions = {},
): PartyAverage[] {
  if (surveys.length === 0) return [];

  let newest = 0;
  for (const s of surveys) {
    const t = new Date(s.date).getTime();
    if (t > newest) newest = t;
  }

  const acc = new Map<
    string,
    { name: string; wSum: number; wpSum: number; n: number }
  >();
  for (const s of surveys) {
    const ageDays = (newest - new Date(s.date).getTime()) / 86_400_000;
    const wRecency = Math.pow(0.5, ageDays / halfLifeDays);
    const wSize = s.surveyedPersons
      ? Math.sqrt(s.surveyedPersons / refSampleSize)
      : 1;
    const w = wRecency * wSize;
    for (const r of s.results) {
      const prev = acc.get(r.shortcut);
      if (prev) {
        prev.wSum += w;
        prev.wpSum += w * r.percent;
        prev.n += 1;
      } else {
        acc.set(r.shortcut, {
          name: r.name,
          wSum: w,
          wpSum: w * r.percent,
          n: 1,
        });
      }
    }
  }

  return [...acc.entries()]
    .map(([shortcut, v]) => ({
      shortcut,
      name: v.name,
      percent: v.wSum > 0 ? v.wpSum / v.wSum : 0,
      institutes: v.n,
    }))
    .sort((a, b) => b.percent - a.percent);
}

export interface PartyComparisonRow {
  shortcut: string;
  name: string;
  current?: number;
  previous?: number;
  /** current − previous, only when both are present. */
  delta?: number;
}

/**
 * Diff two party-average snapshots (e.g. "now" vs "3 months ago") into one row
 * per party with both values and the change. Parties present in only one
 * snapshot keep that value and get no delta. Sorted by the current value
 * (falling back to the previous) descending. Pure.
 */
export function comparePartyAverages(
  current: PartyAverage[],
  previous: PartyAverage[],
): PartyComparisonRow[] {
  const byShortcut = new Map<string, PartyComparisonRow>();
  for (const p of current) {
    byShortcut.set(p.shortcut, {
      shortcut: p.shortcut,
      name: p.name,
      current: p.percent,
    });
  }
  for (const p of previous) {
    const row = byShortcut.get(p.shortcut);
    if (row) row.previous = p.percent;
    else
      byShortcut.set(p.shortcut, {
        shortcut: p.shortcut,
        name: p.name,
        previous: p.percent,
      });
  }
  for (const row of byShortcut.values()) {
    if (row.current !== undefined && row.previous !== undefined) {
      row.delta = Math.round((row.current - row.previous) * 10) / 10;
    }
  }
  return [...byShortcut.values()].sort(
    (a, b) => (b.current ?? b.previous ?? 0) - (a.current ?? a.previous ?? 0),
  );
}

export interface SeatEntry {
  shortcut: string;
  name: string;
  percent: number;
  seats: number;
}

export interface SeatDistribution {
  entries: SeatEntry[];
  totalSeats: number;
  /** Seats needed for an absolute majority. */
  majority: number;
}

/**
 * Project Bundestag seats from an averaged poll using the largest-remainder
 * (Hare) method. Only parties at or above the 5% threshold get seats, and
 * non-partisan "Sonstige" buckets are excluded entirely.
 */
export function seatDistribution(
  parties: PartyAverage[],
  totalSeats: number = BUNDESTAG_SEATS,
  threshold: number = SEAT_THRESHOLD,
): SeatDistribution {
  const eligible = parties.filter(
    (p) => p.percent >= threshold && !NON_PARTISAN.has(p.shortcut),
  );
  const pool = eligible.reduce((acc, p) => acc + p.percent, 0);
  const majority = Math.floor(totalSeats / 2) + 1;

  if (pool === 0) {
    return { entries: [], totalSeats, majority };
  }

  const quotas = eligible.map((p) => (p.percent / pool) * totalSeats);
  const base = quotas.map((q) => Math.floor(q));
  let remaining = totalSeats - base.reduce((acc, n) => acc + n, 0);

  // Hand out leftover seats to the largest fractional remainders.
  const byRemainder = quotas
    .map((q, i) => ({ i, frac: q - Math.floor(q) }))
    .sort((a, b) => b.frac - a.frac);
  for (let k = 0; k < remaining; k++) {
    base[byRemainder[k % base.length].i] += 1;
  }
  remaining = 0;

  const entries = eligible
    .map((p, i) => ({
      shortcut: p.shortcut,
      name: p.name,
      percent: p.percent,
      seats: base[i],
    }))
    .sort((a, b) => b.seats - a.seats);

  return { entries, totalSeats, majority };
}

export interface InstituteComparison {
  /** One row per institute: party shortcut → reported percent. */
  rows: Array<{
    institute: string;
    date: string;
    [shortcut: string]: number | string;
  }>;
  /** Party shortcuts charted as grouped bars, strongest first. */
  parties: string[];
}

/**
 * Reshape the latest survey per institute into grouped-bar rows for comparing
 * how each institute sees the same parties (house effects). Limited to the
 * `topParties` strongest parties to keep the chart legible.
 */
export function instituteComparison(
  surveys: NormalizedSurvey[],
  topParties = 6,
): InstituteComparison {
  const parties = currentAverage(surveys)
    .filter((p) => !NON_PARTISAN.has(p.shortcut))
    .slice(0, topParties)
    .map((p) => p.shortcut);

  const partySet = new Set(parties);

  const rows = [...surveys]
    .sort((a, b) => a.institute.name.localeCompare(b.institute.name, "de"))
    .map((s) => {
      const row: InstituteComparison["rows"][number] = {
        institute: s.institute.name,
        date: s.date,
      };
      for (const r of s.results) {
        if (partySet.has(r.shortcut)) row[r.shortcut] = r.percent;
      }
      return row;
    });

  return { rows, parties };
}

export interface HouseEffectRow {
  institute: string;
  instituteId: string;
  /** How many of the institute's surveys fed these means. */
  surveys: number;
  /** Deviation from the panel mean per party, in points. Only parties the
   * institute actually reported are present. */
  deviations: Record<string, number>;
}

export interface HouseEffects {
  /** Charted parties, strongest (by panel mean) first. */
  parties: string[];
  /** One row per institute, sorted by institute name. */
  rows: HouseEffectRow[];
}

/**
 * Quantified house effects: each institute's average deviation from the panel
 * mean, per party. The panel mean is the mean of the **institute means** (so a
 * prolific pollster doesn't dominate the panel), and each institute mean
 * averages that institute's surveys in the given set. Pass surveys already
 * windowed (e.g. `surveysWithinDays(bundestag, 365)`) — house effects are only
 * meaningful over recent, comparable polls. Non-partisan buckets are excluded;
 * parties are capped at the `topParties` strongest. A **positive** value means
 * the institute reports that party **higher** than the panel on average.
 */
export function houseEffects(
  surveys: NormalizedSurvey[],
  { topParties = 6 }: { topParties?: number } = {},
): HouseEffects {
  // institute -> { name, survey count, per-party running sum/count }
  const institutes = new Map<
    string,
    {
      name: string;
      surveys: number;
      acc: Map<string, { sum: number; n: number }>;
    }
  >();
  for (const s of surveys) {
    let inst = institutes.get(s.institute.id);
    if (!inst) {
      inst = { name: s.institute.name, surveys: 0, acc: new Map() };
      institutes.set(s.institute.id, inst);
    }
    inst.surveys += 1;
    for (const r of s.results) {
      const pp = inst.acc.get(r.shortcut) ?? { sum: 0, n: 0 };
      pp.sum += r.percent;
      pp.n += 1;
      inst.acc.set(r.shortcut, pp);
    }
  }

  // Institute means, and the panel mean = mean across institute means.
  const instituteMeans = new Map<
    string,
    { name: string; surveys: number; means: Map<string, number> }
  >();
  const panel = new Map<string, { sum: number; n: number }>();
  for (const [id, inst] of institutes) {
    const means = new Map<string, number>();
    for (const [shortcut, { sum, n }] of inst.acc) {
      const mean = sum / n;
      means.set(shortcut, mean);
      if (!NON_PARTISAN.has(shortcut)) {
        const p = panel.get(shortcut) ?? { sum: 0, n: 0 };
        p.sum += mean;
        p.n += 1;
        panel.set(shortcut, p);
      }
    }
    instituteMeans.set(id, { name: inst.name, surveys: inst.surveys, means });
  }

  const panelMean = new Map<string, number>();
  for (const [shortcut, { sum, n }] of panel) panelMean.set(shortcut, sum / n);

  const parties = [...panelMean.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, topParties)
    .map(([shortcut]) => shortcut);
  const partySet = new Set(parties);

  const rows: HouseEffectRow[] = [...instituteMeans.entries()]
    .map(([id, inst]) => {
      const deviations: Record<string, number> = {};
      for (const [shortcut, mean] of inst.means) {
        if (partySet.has(shortcut)) {
          deviations[shortcut] = mean - (panelMean.get(shortcut) ?? 0);
        }
      }
      return {
        institute: inst.name,
        instituteId: id,
        surveys: inst.surveys,
        deviations,
      };
    })
    .sort((a, b) => a.institute.localeCompare(b.institute, "de"));

  return { parties, rows };
}
