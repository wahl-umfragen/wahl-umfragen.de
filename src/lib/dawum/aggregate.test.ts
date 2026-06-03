import { describe, expect, it } from "vitest";
import {
  currentAverage,
  houseEffects,
  instituteComparison,
  seatDistribution,
  type PartyAverage,
} from "./aggregate";
import { SAMPLE_DB } from "./fixtures";
import { latestPerInstitute, selectBundestagSurveys } from "./normalize";
import type { NormalizedSurvey } from "./types";

/** Build a minimal Bundestag survey from a party→percent map. */
function survey(
  id: string,
  instituteId: string,
  instituteName: string,
  results: Record<string, number>,
): NormalizedSurvey {
  return {
    id,
    date: "2026-01-01",
    parliament: { id: "0", shortcut: "Bundestag", name: "Bundestag" },
    institute: { id: instituteId, name: instituteName },
    results: Object.entries(results).map(([shortcut, percent]) => ({
      partyId: shortcut,
      shortcut,
      name: shortcut,
      percent,
    })),
  };
}

function latestBundestag() {
  return latestPerInstitute(selectBundestagSurveys(SAMPLE_DB));
}

describe("currentAverage", () => {
  it("averages each party across the latest survey per institute", () => {
    const avg = currentAverage(latestBundestag());
    const byShortcut = Object.fromEntries(avg.map((a) => [a.shortcut, a]));

    // Forsa #100 (23/14/12/27) and Infratest #101 (24/15/13/25).
    expect(byShortcut["CDU/CSU"].percent).toBeCloseTo(23.5);
    expect(byShortcut["AfD"].percent).toBeCloseTo(26);
    expect(byShortcut["SPD"].percent).toBeCloseTo(14.5);
    expect(byShortcut["AfD"].institutes).toBe(2);
  });

  it("sorts by share descending", () => {
    const avg = currentAverage(latestBundestag());
    expect(avg.map((a) => a.shortcut)).toEqual([
      "AfD",
      "CDU/CSU",
      "SPD",
      "Grüne",
    ]);
  });
});

describe("seatDistribution", () => {
  it("allocates exactly the total seats", () => {
    const dist = seatDistribution(currentAverage(latestBundestag()));
    const sum = dist.entries.reduce((acc, e) => acc + e.seats, 0);
    expect(sum).toBe(630);
    expect(dist.majority).toBe(316);
  });

  it("excludes parties below the 5% threshold", () => {
    const parties: PartyAverage[] = [
      { shortcut: "A", name: "A", percent: 40, institutes: 1 },
      { shortcut: "B", name: "B", percent: 4, institutes: 1 },
    ];
    const dist = seatDistribution(parties);
    expect(dist.entries.map((e) => e.shortcut)).toEqual(["A"]);
    expect(dist.entries[0].seats).toBe(630);
  });

  it("excludes non-partisan buckets even above threshold", () => {
    const parties: PartyAverage[] = [
      { shortcut: "A", name: "A", percent: 50, institutes: 1 },
      { shortcut: "Sonstige", name: "Sonstige", percent: 10, institutes: 1 },
    ];
    const dist = seatDistribution(parties);
    expect(dist.entries.map((e) => e.shortcut)).toEqual(["A"]);
  });

  it("returns no seats when the eligible pool is empty", () => {
    const dist = seatDistribution([
      { shortcut: "B", name: "B", percent: 3, institutes: 1 },
    ]);
    expect(dist.entries).toEqual([]);
    expect(dist.totalSeats).toBe(630);
  });
});

describe("instituteComparison", () => {
  it("produces one row per institute with the strongest parties", () => {
    const cmp = instituteComparison(latestBundestag());
    expect(cmp.rows.map((r) => r.institute)).toEqual([
      "Forsa",
      "Infratest dimap",
    ]);
    expect(cmp.parties).toEqual(["AfD", "CDU/CSU", "SPD", "Grüne"]);
    expect(cmp.rows[0]["AfD"]).toBe(27);
  });
});

describe("houseEffects", () => {
  it("measures each institute's deviation from the panel mean", () => {
    const he = houseEffects([
      survey("1", "A", "Alpha", { CDU: 30, SPD: 20 }),
      survey("2", "B", "Beta", { CDU: 26, SPD: 24 }),
    ]);
    // panel mean: CDU (30+26)/2 = 28, SPD (20+24)/2 = 22.
    const a = he.rows.find((r) => r.instituteId === "A")!;
    const b = he.rows.find((r) => r.instituteId === "B")!;
    expect(a.deviations.CDU).toBeCloseTo(2);
    expect(a.deviations.SPD).toBeCloseTo(-2);
    expect(b.deviations.CDU).toBeCloseTo(-2);
    expect(b.deviations.SPD).toBeCloseTo(2);
  });

  it("deviations sum to ~0 per party when all institutes report it", () => {
    const he = houseEffects([
      survey("1", "A", "Alpha", { CDU: 30, SPD: 20 }),
      survey("2", "B", "Beta", { CDU: 26, SPD: 24 }),
      survey("3", "C", "Gamma", { CDU: 25, SPD: 25 }),
    ]);
    for (const party of ["CDU", "SPD"]) {
      const sum = he.rows.reduce((acc, r) => acc + (r.deviations[party] ?? 0), 0);
      expect(sum).toBeCloseTo(0);
    }
  });

  it("averages an institute's multiple surveys before comparing", () => {
    const he = houseEffects([
      survey("1", "A", "Alpha", { CDU: 28 }),
      survey("2", "A", "Alpha", { CDU: 32 }), // A mean = 30
      survey("3", "B", "Beta", { CDU: 26 }),
    ]);
    // panel mean = (30 + 26) / 2 = 28 → A +2, B −2 (A's two polls don't double-weight).
    const a = he.rows.find((r) => r.instituteId === "A")!;
    expect(a.surveys).toBe(2);
    expect(a.deviations.CDU).toBeCloseTo(2);
    expect(he.rows.find((r) => r.instituteId === "B")!.deviations.CDU).toBeCloseTo(-2);
  });

  it("omits parties an institute didn't report and excludes non-partisan buckets", () => {
    const he = houseEffects([
      survey("1", "A", "Alpha", { CDU: 30, SPD: 20, Sonstige: 8 }),
      survey("2", "B", "Beta", { CDU: 26 }), // no SPD
    ]);
    expect(he.parties).not.toContain("Sonstige");
    const b = he.rows.find((r) => r.instituteId === "B")!;
    expect(b.deviations.SPD).toBeUndefined();
    expect(b.deviations.CDU).toBeDefined();
  });

  it("caps and orders parties by panel mean", () => {
    const he = houseEffects(
      [survey("1", "A", "Alpha", { CDU: 30, AfD: 25, SPD: 15, FDP: 5 })],
      { topParties: 2 },
    );
    expect(he.parties).toEqual(["CDU", "AfD"]);
  });
});
