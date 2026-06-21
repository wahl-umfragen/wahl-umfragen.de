import { describe, expect, it } from "vitest";
import { detectAnomalies } from "./anomalies";
import type { IngestRows } from "./transform";

type SurveyInput = {
  id: string;
  surveyedPersons?: number | null;
  periodStart?: string | null;
  periodEnd?: string | null;
};

function rows(
  surveys: SurveyInput[],
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
      surveyedPersons: s.surveyedPersons ?? null,
      periodStart: s.periodStart ?? null,
      periodEnd: s.periodEnd ?? null,
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

  it("flags a negative sample size", () => {
    const out = detectAnomalies(
      rows(
        [{ id: "s", surveyedPersons: -1200 }],
        [{ surveyId: "s", partyId: "1", percent: 100 }],
      ),
    );
    expect(out.filter((a) => a.kind === "sample")).toHaveLength(1);
  });

  it("accepts a missing (null) sample size", () => {
    const out = detectAnomalies(
      rows(
        [{ id: "s", surveyedPersons: null }],
        [{ surveyId: "s", partyId: "1", percent: 100 }],
      ),
    );
    expect(out.filter((a) => a.kind === "sample")).toHaveLength(0);
  });

  it("flags a survey period that starts after it ends", () => {
    const out = detectAnomalies(
      rows(
        [{ id: "s", periodStart: "2026-02-10", periodEnd: "2026-02-01" }],
        [{ surveyId: "s", partyId: "1", percent: 100 }],
      ),
    );
    expect(out.filter((a) => a.kind === "period")).toHaveLength(1);
  });

  it("accepts a well-ordered survey period", () => {
    const out = detectAnomalies(
      rows(
        [{ id: "s", periodStart: "2026-02-01", periodEnd: "2026-02-10" }],
        [{ surveyId: "s", partyId: "1", percent: 100 }],
      ),
    );
    expect(out.filter((a) => a.kind === "period")).toHaveLength(0);
  });
});
