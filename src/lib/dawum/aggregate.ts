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
  rows: Array<{ institute: string; date: string; [shortcut: string]: number | string }>;
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
