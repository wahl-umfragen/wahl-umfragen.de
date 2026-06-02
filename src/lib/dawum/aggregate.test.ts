import { describe, expect, it } from "vitest";
import {
  currentAverage,
  instituteComparison,
  seatDistribution,
  type PartyAverage,
} from "./aggregate";
import { SAMPLE_DB } from "./fixtures";
import { latestPerInstitute, selectBundestagSurveys } from "./normalize";

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
