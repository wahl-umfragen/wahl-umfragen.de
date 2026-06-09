import { describe, expect, it } from "vitest";
import { coalitionMath, findMajorityCoalitions } from "./coalition";

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

describe("findMajorityCoalitions", () => {
  it("returns minimal winning coalitions (no supersets)", () => {
    const out = findMajorityCoalitions(parties);
    // Every result must have a majority of the eligible pool.
    expect(out.length).toBeGreaterThan(0);
    for (const c of out) expect(c.share).toBeGreaterThan(0.5);
    // No result is a superset of another result (minimality).
    for (const a of out) {
      for (const b of out) {
        if (a === b) continue;
        const aSet = new Set(a.parties);
        const bIsSubset = b.parties.every((p) => aSet.has(p));
        if (bIsSubset) expect(b.parties.length).toBe(a.parties.length);
      }
    }
  });

  it("excludes below-threshold and non-partisan parties", () => {
    const out = findMajorityCoalitions(parties);
    const all = new Set(out.flatMap((c) => c.parties));
    expect(all.has("FDP")).toBe(false); // 4% < 5%
    expect(all.has("Sonstige")).toBe(false);
  });

  it("sorts by size ascending then share descending", () => {
    const out = findMajorityCoalitions(parties);
    for (let i = 1; i < out.length; i++) {
      const prev = out[i - 1];
      const cur = out[i];
      expect(prev.parties.length).toBeLessThanOrEqual(cur.parties.length);
    }
  });
});
