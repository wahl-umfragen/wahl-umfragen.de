import { describe, expect, it } from "vitest";
import { coalitionMath } from "./coalition";

const parties = [
  { shortcut: "AfD", percent: 27 },
  { shortcut: "CDU/CSU", percent: 23 },
  { shortcut: "SPD", percent: 14 },
  { shortcut: "Grüne", percent: 12 },
  { shortcut: "Linke", percent: 8 },
  { shortcut: "FDP", percent: 4 },
  { shortcut: "Sonstige", percent: 4 },
];

describe("coalitionMath", () => {
  it("zero selection has no majority", () => {
    const r = coalitionMath(parties, new Set());
    expect(r.selectedSum).toBe(0);
    expect(r.hasMajority).toBe(false);
  });

  it("excludes parties below the 5% threshold from the denominator", () => {
    const r = coalitionMath(parties, new Set(["CDU/CSU", "SPD"]));
    expect(r.eligibleSum).toBe(27 + 23 + 14 + 12 + 8);
    expect(r.selectedSum).toBe(23 + 14);
    expect(r.share).toBeCloseTo((23 + 14) / r.eligibleSum, 5);
  });

  it("flags a coalition with strict majority", () => {
    const r = coalitionMath(parties, new Set(["AfD", "CDU/CSU", "Grüne"]));
    expect(r.hasMajority).toBe(true);
  });

  it("a 50/50 split is not a majority", () => {
    const tied = [
      { shortcut: "A", percent: 30 },
      { shortcut: "B", percent: 30 },
    ];
    const r = coalitionMath(tied, new Set(["A"]));
    expect(r.share).toBe(0.5);
    expect(r.hasMajority).toBe(false);
  });

  it("selected parties below threshold are reported but do not contribute", () => {
    const r = coalitionMath(parties, new Set(["FDP", "CDU/CSU"]));
    expect(r.excludedBelowThreshold).toEqual(["FDP"]);
    expect(r.selectedSum).toBe(23);
  });

  it("handles a custom threshold", () => {
    const r = coalitionMath(parties, new Set(["FDP", "CDU/CSU"]), 3);
    expect(r.excludedBelowThreshold).toEqual([]);
    expect(r.selectedSum).toBe(23 + 4);
  });
});
