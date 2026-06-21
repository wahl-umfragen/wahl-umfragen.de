import { beforeEach, describe, expect, it, vi } from "vitest";

// The data loaders are wrapped in `unstable_cache` (next/cache) and React
// `cache()` at module-eval time. Stub both to identity so the wrapped functions
// run their real bodies on every call, and replace the DB with a chainable mock
// whose terminal `await` resolves the next queued row set. This exercises the
// real column→view-model mapping, the hidden-party filter and the gzip
// compress/decompress round-trip — everything between Postgres and the page.
vi.mock("next/cache", () => ({
  unstable_cache: (fn: unknown) => fn,
  revalidateTag: vi.fn(),
}));
vi.mock("react", () => ({ cache: (fn: unknown) => fn }));

const selectQueue: unknown[][] = [];

function thenable(result: unknown[]) {
  const p: Record<string, unknown> = {};
  for (const m of [
    "from",
    "innerJoin",
    "leftJoin",
    "where",
    "orderBy",
    "limit",
  ])
    p[m] = () => p;
  p.then = (res: (v: unknown) => unknown, rej: (e: unknown) => unknown) =>
    Promise.resolve(result).then(res, rej);
  return p;
}

vi.mock("@/db/client", () => ({
  db: { select: vi.fn(() => thenable(selectQueue.shift() ?? [])) },
}));

import {
  loadBundestagData,
  loadIngestStatus,
  loadParliamentData,
  mapSurveyRows,
} from "./load";

const SURVEY_ROW = {
  id: "s1",
  date: "2026-01-15",
  periodStart: "2026-01-10",
  periodEnd: "2026-01-14",
  surveyedPersons: 1200,
  parliamentId: "0",
  parliamentShortcut: "BT",
  parliamentName: "Bundestag",
  instituteId: "inst-a",
  instituteName: "Institut A",
  taskerId: "t1",
  taskerName: "Auftraggeber",
  methodId: "m1",
  methodName: "Online",
};

let debugSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  vi.clearAllMocks();
  selectQueue.length = 0;
  debugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});
});

describe("mapSurveyRows", () => {
  it("groups result rows under their survey, sorted by percent desc", () => {
    const out = mapSurveyRows(
      [SURVEY_ROW],
      [
        {
          surveyId: "s1",
          partyId: "1",
          shortcut: "SPD",
          name: "SPD",
          percent: 18,
        },
        {
          surveyId: "s1",
          partyId: "2",
          shortcut: "CDU/CSU",
          name: "Union",
          percent: 30,
        },
      ],
    );
    expect(out).toHaveLength(1);
    expect(out[0].results.map((r) => r.shortcut)).toEqual(["CDU/CSU", "SPD"]);
    expect(out[0].institute).toEqual({ id: "inst-a", name: "Institut A" });
    expect(out[0].tasker).toEqual({ id: "t1", name: "Auftraggeber" });
    expect(out[0].method).toEqual({ id: "m1", name: "Online" });
  });

  it("drops hidden parties from the assembled view model and logs once", () => {
    const out = mapSurveyRows(
      [SURVEY_ROW],
      [
        {
          surveyId: "s1",
          partyId: "1",
          shortcut: "SPD",
          name: "SPD",
          percent: 20,
        },
        {
          surveyId: "s1",
          partyId: "9",
          shortcut: "FW",
          name: "Freie Wähler",
          percent: 3,
        },
      ],
    );
    expect(out[0].results.map((r) => r.shortcut)).toEqual(["SPD"]);
    expect(debugSpy).toHaveBeenCalledTimes(1);
  });

  it("does not log when nothing is hidden", () => {
    mapSurveyRows(
      [SURVEY_ROW],
      [
        {
          surveyId: "s1",
          partyId: "1",
          shortcut: "SPD",
          name: "SPD",
          percent: 20,
        },
      ],
    );
    expect(debugSpy).not.toHaveBeenCalled();
  });

  it("yields an empty results array for a survey with no result rows", () => {
    const out = mapSurveyRows([SURVEY_ROW], []);
    expect(out[0].results).toEqual([]);
  });

  it("maps absent tasker/method to undefined", () => {
    const out = mapSurveyRows(
      [
        {
          ...SURVEY_ROW,
          taskerId: null,
          taskerName: null,
          methodId: null,
          methodName: null,
        },
      ],
      [],
    );
    expect(out[0].tasker).toBeUndefined();
    expect(out[0].method).toBeUndefined();
  });
});

describe("loadParliamentData (gzip cache round-trip)", () => {
  it("returns the mapped surveys and lastUpdate, surviving compress/decompress", async () => {
    selectQueue.push(
      [SURVEY_ROW], // survey rows
      [{ value: new Date("2026-01-15T08:00:00.000Z") }], // loadLastUpdate
      [
        {
          surveyId: "s1",
          partyId: "1",
          shortcut: "SPD",
          name: "SPD",
          percent: 20,
        },
      ], // result rows
    );
    const data = await loadParliamentData("0");
    expect(data.lastUpdate).toBe("2026-01-15T08:00:00.000Z");
    expect(data.surveys).toHaveLength(1);
    expect(data.surveys[0].id).toBe("s1");
    expect(data.surveys[0].results[0].shortcut).toBe("SPD");
  });

  it("returns empty surveys (and skips the results query) for an empty parliament", async () => {
    selectQueue.push([], [{ value: new Date("2026-01-15T08:00:00.000Z") }]);
    const data = await loadParliamentData("99");
    expect(data.surveys).toEqual([]);
    expect(data.lastUpdate).toBe("2026-01-15T08:00:00.000Z");
  });

  it("loadBundestagData wraps the parliament-0 read", async () => {
    selectQueue.push([SURVEY_ROW], [{ value: null }], []);
    const data = await loadBundestagData();
    expect(data.bundestag).toHaveLength(1);
    expect(data.lastUpdate).toBeNull();
  });
});

describe("loadIngestStatus", () => {
  it("maps the newest completed run plus the total survey count", async () => {
    selectQueue.push(
      [
        {
          completedAt: new Date("2026-01-15T09:00:00.000Z"),
          dawumLastUpdate: new Date("2026-01-15T08:00:00.000Z"),
          surveysNew: 3,
          surveysUpdated: 7,
        },
      ],
      [{ total: 4242 }],
    );
    const status = await loadIngestStatus();
    expect(status).toEqual({
      lastRunAt: "2026-01-15T09:00:00.000Z",
      lastDawumUpdate: "2026-01-15T08:00:00.000Z",
      lastNew: 3,
      lastUpdated: 7,
      surveysTotal: 4242,
    });
  });

  it("falls back to nulls/zeros when no run has completed", async () => {
    selectQueue.push([], [{ total: 0 }]);
    const status = await loadIngestStatus();
    expect(status).toEqual({
      lastRunAt: null,
      lastDawumUpdate: null,
      lastNew: 0,
      lastUpdated: 0,
      surveysTotal: 0,
    });
  });
});
