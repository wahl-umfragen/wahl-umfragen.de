import { describe, expect, it } from "vitest";
import { detectAnomalies } from "./anomalies";
import type { IngestRows } from "./transform";

function rows(
  surveys: { id: string }[],
  results: { surveyId: string; partyId: string; percent: number }[],
): IngestRows {
  return {
    parliaments: [],
    institutes: [],
    taskers: [],
    methods: [],
    parties: [],
    surveys: surveys.map((s) => ({
      id: s.id,
      date: "2026-01-01",
      parliamentId: "0",
      instituteId: "i",
      taskerId: null,
      methodId: null,
      surveyedPersons: null,
      periodStart: null,
      periodEnd: null,
    })),
    surveyResults: results,
  };
}

describe("detectAnomalies", () => {
  it("passes a normal survey summing to ~100", () => {
    const out = detectAnomalies(
      rows(
        [{ id: "s" }],
        [
          { surveyId: "s", partyId: "1", percent: 30 },
          { surveyId: "s", partyId: "2", percent: 18 },
          { surveyId: "s", partyId: "3", percent: 52 },
        ],
      ),
    );
    expect(out).toEqual([]);
  });

  it("flags a survey whose shares sum far from 100", () => {
    const out = detectAnomalies(
      rows([{ id: "s" }], [{ surveyId: "s", partyId: "1", percent: 30 }]),
    );
    expect(out).toHaveLength(1);
    expect(out[0].kind).toBe("sum");
  });

  it("flags an out-of-range percent", () => {
    const out = detectAnomalies(
      rows(
        [{ id: "s" }],
        [
          { surveyId: "s", partyId: "1", percent: 130 },
          { surveyId: "s", partyId: "2", percent: -30 },
        ],
      ),
    );
    expect(out.filter((a) => a.kind === "range")).toHaveLength(2);
  });

  it("flags a survey with no results", () => {
    const out = detectAnomalies(rows([{ id: "empty" }], []));
    expect(out).toEqual([
      { surveyId: "empty", kind: "empty", detail: expect.any(String) },
    ]);
  });
});
