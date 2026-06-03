import { describe, expect, it } from "vitest";
import { SAMPLE_DB } from "./fixtures";
import {
  DawumLookupError,
  latestPerInstitute,
  normalizeSurvey,
  selectBundestagSurveys,
  surveysWithinDays,
} from "./normalize";

describe("normalizeSurvey", () => {
  it("resolves all foreign keys into names/shortcuts", () => {
    const s = normalizeSurvey(SAMPLE_DB, "100");
    expect(s.parliament).toEqual({
      id: "0",
      shortcut: "Bundestag",
      name: "Bundestag",
    });
    expect(s.institute).toEqual({ id: "4", name: "Forsa" });
    expect(s.tasker).toEqual({ id: "5", name: "RTL/n-tv" });
    expect(s.method).toEqual({ id: "1", name: "Telefonisch" });
    expect(s.surveyedPersons).toBe(1023);
    expect(s.periodStart).toBe("2026-05-28");
    expect(s.periodEnd).toBe("2026-05-31");
  });

  it("sorts results descending by percent", () => {
    const s = normalizeSurvey(SAMPLE_DB, "100");
    expect(s.results.map((r) => r.shortcut)).toEqual([
      "AfD",
      "CDU/CSU",
      "SPD",
      "Grüne",
    ]);
    expect(s.results[0].percent).toBe(27);
  });

  it("omits tasker/method when missing on the survey", () => {
    const s = normalizeSurvey(SAMPLE_DB, "101");
    expect(s.tasker).toBeUndefined();
    expect(s.method).toBeUndefined();
    expect(s.periodStart).toBeUndefined();
  });

  it("throws DawumLookupError for unknown survey id", () => {
    expect(() => normalizeSurvey(SAMPLE_DB, "999")).toThrow(DawumLookupError);
  });

  it("throws DawumLookupError when a referenced party is missing", () => {
    const corrupt = {
      ...SAMPLE_DB,
      Surveys: {
        ...SAMPLE_DB.Surveys,
        bad: { ...SAMPLE_DB.Surveys["100"], Results: { "999": 50 } },
      },
    };
    expect(() => normalizeSurvey(corrupt, "bad")).toThrow(DawumLookupError);
  });
});

describe("selectBundestagSurveys", () => {
  it("returns only Bundestag surveys, sorted newest first", () => {
    const surveys = selectBundestagSurveys(SAMPLE_DB);
    expect(surveys.map((s) => s.id)).toEqual(["100", "101", "102"]);
    expect(surveys.every((s) => s.parliament.shortcut === "Bundestag")).toBe(
      true,
    );
  });
});

describe("surveysWithinDays", () => {
  // Fixture Bundestag dates: 100 = 2026-06-01, 101 = 2026-05-28, 102 = 2026-05-20.
  it("keeps only surveys within `days` of the newest one", () => {
    const surveys = selectBundestagSurveys(SAMPLE_DB);
    // 7 days back from 2026-06-01 → cutoff 2026-05-25, drops the 05-20 survey.
    const recent = surveysWithinDays(surveys, 7);
    expect(recent.map((s) => s.id)).toEqual(["100", "101"]);
  });

  it("keeps everything when the window covers the whole set", () => {
    const surveys = selectBundestagSurveys(SAMPLE_DB);
    expect(surveysWithinDays(surveys, 365)).toHaveLength(surveys.length);
  });

  it("returns an empty array unchanged", () => {
    expect(surveysWithinDays([], 365)).toEqual([]);
  });
});

describe("latestPerInstitute", () => {
  it("keeps only the newest survey per institute", () => {
    const surveys = selectBundestagSurveys(SAMPLE_DB);
    const latest = latestPerInstitute(surveys);
    expect(latest).toHaveLength(2);
    const byInstitute = Object.fromEntries(
      latest.map((s) => [s.institute.name, s.id]),
    );
    expect(byInstitute).toEqual({ Forsa: "100", "Infratest dimap": "101" });
  });

  it("returns institutes sorted alphabetically (de)", () => {
    const surveys = selectBundestagSurveys(SAMPLE_DB);
    const latest = latestPerInstitute(surveys);
    expect(latest.map((s) => s.institute.name)).toEqual([
      "Forsa",
      "Infratest dimap",
    ]);
  });
});
