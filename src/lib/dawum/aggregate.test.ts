import { describe, expect, it } from "vitest";
import {
  archivePartyOrder,
  comparePartyAverages,
  currentAverage,
  houseEffects,
  instituteComparison,
  instituteDeltas,
  partySeries,
  seatDistribution,
  weightedAverage,
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

/** Like `survey` but with an explicit date (instituteDeltas needs ordering). */
function dated(
  id: string,
  instituteId: string,
  date: string,
  results: Record<string, number>,
): NormalizedSurvey {
  return { ...survey(id, instituteId, instituteId, results), date };
}

describe("instituteDeltas", () => {
  it("computes per-party change vs the same institute's previous survey", () => {
    const surveys = [
      dated("s2", "insa", "2026-02-01", { CDU: 31, SPD: 15 }),
      dated("s1", "insa", "2026-01-01", { CDU: 30, SPD: 16 }),
    ];
    const out = instituteDeltas(surveys);
    expect(out.s2).toEqual({ CDU: 1, SPD: -1 });
    // The earliest survey has no predecessor → no entry.
    expect(out.s1).toBeUndefined();
  });

  it("omits a delta for a party the previous survey didn't report", () => {
    const out = instituteDeltas([
      dated("a", "x", "2026-01-01", { CDU: 30 }),
      dated("b", "x", "2026-02-01", { CDU: 31, BSW: 5 }),
    ]);
    expect(out.b).toEqual({ CDU: 1 });
  });

  it("keeps institutes independent", () => {
    const out = instituteDeltas([
      dated("a1", "a", "2026-01-01", { CDU: 30 }),
      dated("a2", "a", "2026-02-01", { CDU: 32 }),
      dated("b1", "b", "2026-01-15", { CDU: 28 }),
      dated("b2", "b", "2026-02-15", { CDU: 27 }),
    ]);
    expect(out.a2).toEqual({ CDU: 2 });
    expect(out.b2).toEqual({ CDU: -1 });
  });
});

describe("partySeries", () => {
  const surveys = [
    dated("c", "a", "2026-03-01", { Grüne: 12 }),
    dated("a", "a", "2026-01-01", { Grüne: 14 }),
    dated("b", "b", "2026-02-01", { "Bündnis 90/Die Grünen": 11 }),
    dated("d", "c", "2026-02-15", { CDU: 30 }), // no Grüne → excluded
  ];
  const matches = (s: string) => s === "Grüne" || s === "Bündnis 90/Die Grünen";

  it("collects matching points ascending by date", () => {
    const { points } = partySeries(surveys, matches);
    expect(points.map((p) => p.surveyId)).toEqual(["a", "b", "c"]);
  });

  it("reports latest, high and low", () => {
    const { latest, high, low } = partySeries(surveys, matches);
    expect(latest?.surveyId).toBe("c");
    expect(high?.percent).toBe(14);
    expect(low?.percent).toBe(11);
  });

  it("returns empty stats when no survey reports the party", () => {
    const out = partySeries(surveys, (s) => s === "FDP");
    expect(out.points).toEqual([]);
    expect(out.latest).toBeUndefined();
  });
});

describe("comparePartyAverages", () => {
  const now = [
    { shortcut: "CDU/CSU", name: "CDU/CSU", percent: 30, institutes: 3 },
    { shortcut: "AfD", name: "AfD", percent: 22, institutes: 3 },
    { shortcut: "BSW", name: "BSW", percent: 6, institutes: 2 },
  ];
  const then = [
    { shortcut: "CDU/CSU", name: "CDU/CSU", percent: 28, institutes: 3 },
    { shortcut: "AfD", name: "AfD", percent: 25, institutes: 3 },
    { shortcut: "FDP", name: "FDP", percent: 4, institutes: 2 },
  ];

  it("computes deltas for parties in both snapshots", () => {
    const rows = comparePartyAverages(now, then);
    const cdu = rows.find((r) => r.shortcut === "CDU/CSU");
    const afd = rows.find((r) => r.shortcut === "AfD");
    expect(cdu).toMatchObject({ current: 30, previous: 28, delta: 2 });
    expect(afd).toMatchObject({ current: 22, previous: 25, delta: -3 });
  });

  it("keeps one-sided parties without a delta", () => {
    const rows = comparePartyAverages(now, then);
    const bsw = rows.find((r) => r.shortcut === "BSW");
    expect(bsw?.current).toBe(6);
    expect(bsw?.previous).toBeUndefined();
    expect(bsw?.delta).toBeUndefined();
    const fdp = rows.find((r) => r.shortcut === "FDP");
    expect(fdp?.previous).toBe(4);
    expect(fdp?.current).toBeUndefined();
  });

  it("sorts by current value descending", () => {
    const rows = comparePartyAverages(now, then);
    expect(rows[0].shortcut).toBe("CDU/CSU");
  });
});

describe("weightedAverage", () => {
  it("returns [] for no surveys", () => {
    expect(weightedAverage([])).toEqual([]);
  });

  it("weights an older survey by the recency half-life", () => {
    // Two surveys, same party, same (absent) sample size. The older one is
    // exactly one half-life back, so its weight is 0.5 vs 1.0.
    const surveys = [
      dated("new", "a", "2026-02-15", { CDU: 30 }),
      dated("old", "b", "2026-02-01", { CDU: 36 }), // 14 days older
    ];
    const [cdu] = weightedAverage(surveys, { halfLifeDays: 14 });
    // (1*30 + 0.5*36) / 1.5 = 48/1.5 = 32
    expect(cdu.percent).toBeCloseTo(32, 6);
    expect(cdu.institutes).toBe(2);
  });

  it("weights by sqrt of sample size relative to the reference", () => {
    // Same date (no recency effect). Sizes 1000 (w=1) and 4000 (w=2).
    const surveys = [
      dated("s", "a", "2026-02-15", { CDU: 30 }),
      dated("l", "b", "2026-02-15", { CDU: 33 }),
    ];
    surveys[0].surveyedPersons = 1000;
    surveys[1].surveyedPersons = 4000;
    const [cdu] = weightedAverage(surveys, { refSampleSize: 1000 });
    // (1*30 + 2*33) / 3 = 96/3 = 32
    expect(cdu.percent).toBeCloseTo(32, 6);
  });

  it("sorts parties by weighted share, descending", () => {
    const out = weightedAverage([
      dated("x", "a", "2026-02-15", { CDU: 28, AfD: 22, SPD: 15 }),
    ]);
    expect(out.map((p) => p.shortcut)).toEqual(["CDU", "AfD", "SPD"]);
  });
});

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

describe("archivePartyOrder", () => {
  it("orders by average, not sum — a high-average but less-frequent party ranks before a low-average but more-frequent one", () => {
    // NewParty: 20% in 2 surveys → avg 20; sum 40
    // OldParty: 15% in 3 surveys → avg 15; sum 45
    // Sum-based order: OldParty first (wrong). Average-based: NewParty first (correct).
    const s = [
      survey("1", "A", "Alpha", { NewParty: 20 }),
      survey("2", "B", "Beta", { NewParty: 20, OldParty: 15 }),
      survey("3", "C", "Gamma", { OldParty: 15 }),
      survey("4", "D", "Delta", { OldParty: 15 }),
    ];
    expect(archivePartyOrder(s)).toEqual(["NewParty", "OldParty"]);
  });

  it("returns parties in descending average order when all appear equally often", () => {
    const s = [
      survey("1", "A", "Alpha", { SPD: 25, CDU: 30, Grüne: 15 }),
      survey("2", "B", "Beta", { SPD: 23, CDU: 28, Grüne: 13 }),
    ];
    expect(archivePartyOrder(s)).toEqual(["CDU", "SPD", "Grüne"]);
  });
});
