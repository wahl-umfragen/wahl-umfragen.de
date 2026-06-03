import { describe, expect, it } from "vitest";
import { electionMarkers } from "./markers";
import { BUNDESTAG_ELECTIONS, type ElectionResult } from "./results";

const SAMPLE: ElectionResult[] = [
  {
    date: "2025-02-23",
    label: "Bundestagswahl 2025",
    parliamentId: "0",
    results: { "CDU/CSU": 28.6, SPD: 16.4, AfD: 20.8 },
    source: { name: "Quelle", url: "https://example.test" },
  },
];

describe("electionMarkers()", () => {
  it("emits one marker per charted party with a result", () => {
    const markers = electionMarkers(SAMPLE, [
      { shortcut: "CDU/CSU" },
      { shortcut: "SPD" },
      { shortcut: "AfD" },
    ]);
    expect(markers).toHaveLength(3);
    const cdu = markers.find((m) => m.shortcut === "CDU/CSU");
    expect(cdu).toEqual({
      date: new Date("2025-02-23").getTime(),
      label: "Bundestagswahl 2025",
      shortcut: "CDU/CSU",
      percent: 28.6,
    });
  });

  it("only emits markers for the passed series", () => {
    const markers = electionMarkers(SAMPLE, [{ shortcut: "SPD" }]);
    expect(markers).toHaveLength(1);
    expect(markers[0]?.shortcut).toBe("SPD");
  });

  it("skips parties without a recorded result", () => {
    const markers = electionMarkers(SAMPLE, [
      { shortcut: "SPD" },
      { shortcut: "FDP" }, // not in SAMPLE results
    ]);
    expect(markers.map((m) => m.shortcut)).toEqual(["SPD"]);
  });

  it("returns nothing when there are no series", () => {
    expect(electionMarkers(SAMPLE, [])).toEqual([]);
  });
});

describe("BUNDESTAG_ELECTIONS data", () => {
  const CORE = ["CDU/CSU", "SPD", "Grüne", "AfD", "Linke"];

  it("is non-empty and sorted oldest-first", () => {
    expect(BUNDESTAG_ELECTIONS.length).toBeGreaterThan(0);
    const dates = BUNDESTAG_ELECTIONS.map((e) => e.date);
    expect([...dates].sort()).toEqual(dates);
  });

  it("each election is internally consistent", () => {
    for (const e of BUNDESTAG_ELECTIONS) {
      // valid ISO date
      expect(Number.isNaN(new Date(e.date).getTime())).toBe(false);
      // covers the core parties we always chart
      for (const party of CORE) {
        expect(e.results[party]).toBeGreaterThan(0);
      }
      // every share is a plausible percentage
      const shares = Object.values(e.results);
      for (const v of shares) {
        expect(v).toBeGreaterThan(0);
        expect(v).toBeLessThanOrEqual(100);
      }
      // the listed shares never exceed 100 % in total
      expect(shares.reduce((a, b) => a + b, 0)).toBeLessThanOrEqual(100);
      // attribution present
      expect(e.source.name).toBeTruthy();
      expect(e.source.url).toMatch(/^https:\/\//);
    }
  });

  /**
   * Dead-man's switch: this turns CI red on REVIEW_BY so nobody can forget to
   * add the newest official result. The next regular Bundestagswahl is expected
   * ~2029; once the new result is appended to BUNDESTAG_ELECTIONS, bump
   * REVIEW_BY past the following election. A deliberate, date-based failure —
   * not flakiness.
   */
  it("is reviewed before the next expected federal election", () => {
    const REVIEW_BY = new Date("2029-01-01");
    expect(new Date().getTime()).toBeLessThan(REVIEW_BY.getTime());
  });
});
