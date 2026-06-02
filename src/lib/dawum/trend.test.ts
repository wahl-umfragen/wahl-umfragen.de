import { describe, expect, it } from "vitest";
import { SAMPLE_DB } from "./fixtures";
import { selectBundestagSurveys } from "./normalize";
import { buildBundestagTrend } from "./trend";

describe("buildBundestagTrend", () => {
  it("returns empty trend when no surveys are given", () => {
    expect(buildBundestagTrend([])).toEqual({
      points: [],
      series: [],
      range: null,
    });
  });

  it("includes only surveys inside the window", () => {
    const surveys = selectBundestagSurveys(SAMPLE_DB);
    const trend = buildBundestagTrend(surveys, { windowDays: 7, minAppearances: 1 });
    expect(trend.points.map((p) => p.surveyId)).toEqual(["101", "100"]);
    expect(trend.range).not.toBeNull();
  });

  it("orders points ascending in time", () => {
    const surveys = selectBundestagSurveys(SAMPLE_DB);
    const trend = buildBundestagTrend(surveys, { windowDays: 365, minAppearances: 1 });
    const dates = trend.points.map((p) => p.date);
    expect([...dates].sort((a, b) => a - b)).toEqual(dates);
  });

  it("drops parties that fall below minAppearances", () => {
    const surveys = selectBundestagSurveys(SAMPLE_DB);
    const trend = buildBundestagTrend(surveys, {
      windowDays: 365,
      minAppearances: 99,
    });
    expect(trend.series).toEqual([]);
    for (const p of trend.points) {
      const partyKeys = Object.keys(p).filter(
        (k) => !["date", "surveyId", "instituteId", "instituteName"].includes(k),
      );
      expect(partyKeys).toEqual([]);
    }
  });

  it("annotates each point with the institute", () => {
    const surveys = selectBundestagSurveys(SAMPLE_DB);
    const trend = buildBundestagTrend(surveys, {
      windowDays: 365,
      minAppearances: 1,
    });
    const inst = trend.points.map((p) => p.instituteName);
    expect(inst).toEqual(["Forsa", "Infratest dimap", "Forsa"]);
  });
});
