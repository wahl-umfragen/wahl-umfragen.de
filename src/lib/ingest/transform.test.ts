import { describe, expect, it } from "vitest";
import { SAMPLE_DB } from "@/lib/dawum/fixtures";
import { transformDawumToRows } from "./transform";

describe("transformDawumToRows", () => {
  const rows = transformDawumToRows(SAMPLE_DB);

  it("flattens all dimension tables", () => {
    expect(rows.parliaments).toHaveLength(2);
    expect(rows.institutes).toHaveLength(3);
    expect(rows.taskers).toHaveLength(2);
    expect(rows.methods).toHaveLength(2);
    expect(rows.parties).toHaveLength(4);
  });

  it("normalizes Bundestag parliament row", () => {
    const bundestag = rows.parliaments.find((p) => p.id === "0");
    expect(bundestag).toEqual({
      id: "0",
      shortcut: "Bundestag",
      name: "Bundestag",
      election: "Bundestagswahl",
    });
  });

  it("maps optional survey fields to null when missing", () => {
    const minimal = rows.surveys.find((s) => s.id === "101");
    expect(minimal).toEqual({
      id: "101",
      date: "2026-05-28",
      parliamentId: "0",
      instituteId: "1",
      taskerId: null,
      methodId: null,
      surveyedPersons: null,
      periodStart: null,
      periodEnd: null,
    });
  });

  it("flattens survey results to one row per (survey, party)", () => {
    const for100 = rows.surveyResults.filter((r) => r.surveyId === "100");
    expect(for100).toHaveLength(4);
    expect(for100.find((r) => r.partyId === "7")).toEqual({
      surveyId: "100",
      partyId: "7",
      percent: 27,
    });
  });

  it("preserves period_start / period_end when present", () => {
    const s = rows.surveys.find((s) => s.id === "100");
    expect(s?.periodStart).toBe("2026-05-28");
    expect(s?.periodEnd).toBe("2026-05-31");
  });
});
