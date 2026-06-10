/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { GET, ATTRIBUTION } from "./route";
import { loadBundestagData } from "@/lib/data";

const SURVEYS = [
  {
    id: "1",
    date: "2024-01-15",
    periodStart: null,
    periodEnd: null,
    institute: { id: "inst-a", name: "Institut A" },
    method: null,
    tasker: null,
    surveyedPersons: null,
    results: [{ shortcut: "SPD", percent: 25 }],
  },
  {
    id: "2",
    date: "2024-06-01",
    periodStart: null,
    periodEnd: null,
    institute: { id: "inst-b", name: "Institut B" },
    method: null,
    tasker: null,
    surveyedPersons: null,
    results: [{ shortcut: "CDU", percent: 30 }],
  },
  {
    id: "3",
    date: "2025-03-10",
    periodStart: null,
    periodEnd: null,
    institute: { id: "inst-a", name: "Institut A" },
    method: null,
    tasker: null,
    surveyedPersons: null,
    results: [{ shortcut: "SPD", percent: 20 }],
  },
];

vi.mock("@/lib/data", () => ({
  loadBundestagData: vi.fn(),
}));

beforeEach(() => {
  vi.mocked(loadBundestagData).mockResolvedValue({
    lastUpdate: "2024-01-01",
    bundestag: [],
  });
});

function makeRequest(search = "") {
  return {
    nextUrl: { searchParams: new URLSearchParams(search) },
  } as Parameters<typeof GET>[0];
}

describe("GET /api/surveys — attribution & license", () => {
  it("JSON response includes attribution block from ATTRIBUTION constant", async () => {
    const res = await GET(makeRequest());
    const body = await res.json();

    expect(body.attribution).toEqual(ATTRIBUTION);
    expect(body.attribution.license).toBe("ODbL-1.0");
    expect(body.attribution.source).toBe("dawum.de");
    expect(body.attribution.licenseUrl).toBe(
      "https://opendatacommons.org/licenses/odbl/1-0/",
    );
  });

  it("JSON response keeps existing envelope fields intact", async () => {
    const res = await GET(makeRequest());
    const body = await res.json();

    expect(body).toHaveProperty("lastUpdate");
    expect(body).toHaveProperty("total");
    expect(body).toHaveProperty("count");
    expect(body).toHaveProperty("surveys");
  });

  it("JSON response sets Link rel=license and X-Data-Source headers", async () => {
    const res = await GET(makeRequest());

    expect(res.headers.get("link")).toContain('rel="license"');
    expect(res.headers.get("link")).toContain(ATTRIBUTION.licenseUrl);
    expect(res.headers.get("x-data-source")).toBe(ATTRIBUTION.source);
  });

  it("CSV response sets Link rel=license and X-Data-Source headers", async () => {
    const res = await GET(makeRequest("format=csv"));

    expect(res.headers.get("link")).toContain('rel="license"');
    expect(res.headers.get("x-data-source")).toBe(ATTRIBUTION.source);
  });

  it("CSV response body starts with a UTF-8 BOM so Excel renders umlauts correctly", async () => {
    const res = await GET(makeRequest("format=csv"));
    // Response.text() strips the BOM per the WHATWG encoding spec, so check raw bytes.
    const buf = await res.arrayBuffer();
    const bytes = new Uint8Array(buf);

    expect(bytes[0]).toBe(0xef);
    expect(bytes[1]).toBe(0xbb);
    expect(bytes[2]).toBe(0xbf);
  });

  it("JSON response body does not contain a leading BOM", async () => {
    const res = await GET(makeRequest());
    const buf = await res.arrayBuffer();
    const bytes = new Uint8Array(buf);

    expect(bytes[0]).not.toBe(0xef);
  });

  it("CSV response starts with attribution comment lines before header row", async () => {
    const res = await GET(makeRequest("format=csv"));
    const text = await res.text();
    // Strip leading BOM before parsing lines; split on CRLF (RFC 4180).
    const lines = text.replace(/^﻿/, "").split("\r\n");

    expect(lines[0]).toMatch(/^# Source: dawum\.de/);
    expect(lines[0]).toContain("ODbL-1.0");
    expect(lines[0]).toContain(
      "https://opendatacommons.org/licenses/odbl/1-0/",
    );
    expect(lines[1]).toMatch(/^#/);
    expect(lines[2]).toBe(
      "survey_id,date,period_start,period_end,institute,method,tasker,surveyed_persons,party,percent",
    );
  });

  it("CSV column layout is unchanged for data rows", async () => {
    const res = await GET(makeRequest("format=csv"));
    const text = await res.text();
    const lines = text.replace(/^﻿/, "").split("\r\n");
    const headerLine = lines.find((l) => l.startsWith("survey_id"));

    expect(headerLine).toBeDefined();
    expect(headerLine!.split(",")).toHaveLength(10);
  });
});

describe("GET /api/surveys — CSV formula-injection neutralisation (CWE-1236)", () => {
  it("prefixes institute name starting with = with a single quote guard", async () => {
    vi.mocked(loadBundestagData).mockResolvedValue({
      lastUpdate: "2024-01-01",
      bundestag: [
        {
          id: "42",
          date: "2024-01-01",
          periodStart: null,
          periodEnd: null,
          institute: { id: "x", name: "=DANGEROUS()" },
          method: null,
          tasker: null,
          surveyedPersons: null,
          results: [{ shortcut: "SPD", percent: 25 }],
        },
      ] as any,
    });

    const res = await GET(makeRequest("format=csv"));
    const text = await res.text();

    expect(text).toContain("'=DANGEROUS()");
    expect(text).not.toMatch(/,=DANGEROUS\(\)/);
  });

  it.each([
    ["leading -", "-Institut"],
    ["leading +", "+Institut"],
    ["leading @", "@Institut"],
    ["leading tab", "\tInstitut"],
    ["leading CR", "\rInstitut"],
  ])("prefixes cell with guard for %s", async (_label, name) => {
    vi.mocked(loadBundestagData).mockResolvedValue({
      lastUpdate: "2024-01-01",
      bundestag: [
        {
          id: "1",
          date: "2024-01-01",
          periodStart: null,
          periodEnd: null,
          institute: { id: "x", name },
          method: null,
          tasker: null,
          surveyedPersons: null,
          results: [{ shortcut: "SPD", percent: 10 }],
        },
      ] as any,
    });

    const res = await GET(makeRequest("format=csv"));
    const text = await res.text();

    expect(text).toContain(`'${name}`);
  });

  it("does not add guard to a normal institute name", async () => {
    vi.mocked(loadBundestagData).mockResolvedValue({
      lastUpdate: "2024-01-01",
      bundestag: [
        {
          id: "1",
          date: "2024-01-01",
          periodStart: null,
          periodEnd: null,
          institute: { id: "x", name: "Normal Institut" },
          method: null,
          tasker: null,
          surveyedPersons: null,
          results: [{ shortcut: "SPD", percent: 10 }],
        },
      ] as any,
    });

    const res = await GET(makeRequest("format=csv"));
    const text = await res.text();

    expect(text).toContain("Normal Institut");
    expect(text).not.toContain("'Normal Institut");
  });

  it("numeric columns (percent, surveyedPersons) are not guarded and remain numeric", async () => {
    vi.mocked(loadBundestagData).mockResolvedValue({
      lastUpdate: "2024-01-01",
      bundestag: [
        {
          id: "99",
          date: "2024-01-01",
          periodStart: null,
          periodEnd: null,
          institute: { id: "x", name: "Institut" },
          method: null,
          tasker: null,
          surveyedPersons: 1000,
          results: [{ shortcut: "SPD", percent: 25.5 }],
        },
      ] as any,
    });

    const res = await GET(makeRequest("format=csv"));
    const text = await res.text();

    expect(text).toContain(",1000,");
    expect(text).toContain(",25.5");
    expect(text).not.toContain("'1000");
    expect(text).not.toContain("'25.5");
  });

  it("guard composes with RFC-4180 quoting when the guarded cell also contains a comma", async () => {
    vi.mocked(loadBundestagData).mockResolvedValue({
      lastUpdate: "2024-01-01",
      bundestag: [
        {
          id: "1",
          date: "2024-01-01",
          periodStart: null,
          periodEnd: null,
          institute: { id: "x", name: "=Foo, Bar" },
          method: null,
          tasker: null,
          surveyedPersons: null,
          results: [{ shortcut: "SPD", percent: 10 }],
        },
      ] as any,
    });

    const res = await GET(makeRequest("format=csv"));
    const text = await res.text();

    expect(text).toContain('"\'=Foo, Bar"');
  });

  it("JSON response values are not affected by formula guarding", async () => {
    vi.mocked(loadBundestagData).mockResolvedValue({
      lastUpdate: "2024-01-01",
      bundestag: [
        {
          id: "1",
          date: "2024-01-01",
          periodStart: null,
          periodEnd: null,
          institute: { id: "x", name: "=DANGEROUS()" },
          method: null,
          tasker: null,
          surveyedPersons: null,
          results: [{ shortcut: "SPD", percent: 10 }],
        },
      ] as any,
    });

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(body.surveys[0].institute.name).toBe("=DANGEROUS()");
  });
});

describe("GET /api/surveys — filtering by institut/from/to", () => {
  beforeEach(() => {
    vi.mocked(loadBundestagData).mockResolvedValue({
      lastUpdate: "2025-03-10",
      bundestag: SURVEYS as any,
    });
  });

  it("no filters returns the full dataset", async () => {
    const res = await GET(makeRequest());
    const body = await res.json();
    expect(body.total).toBe(3);
    expect(body.surveys).toHaveLength(3);
  });

  it("institut filter returns only surveys from that institute", async () => {
    const res = await GET(makeRequest("institut=inst-a"));
    const body = await res.json();
    expect(body.total).toBe(2);
    expect(
      body.surveys.every(
        (s: { institute: { id: string } }) => s.institute.id === "inst-a",
      ),
    ).toBe(true);
  });

  it("unknown institut yields zero rows (not a 500)", async () => {
    const res = await GET(makeRequest("institut=unknown-xyz"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBe(0);
    expect(body.surveys).toHaveLength(0);
  });

  it("from filter returns only surveys on or after the date", async () => {
    const res = await GET(makeRequest("from=2024-06-01"));
    const body = await res.json();
    expect(body.total).toBe(2);
    expect(
      body.surveys.every((s: { date: string }) => s.date >= "2024-06-01"),
    ).toBe(true);
  });

  it("to filter returns only surveys on or before the date", async () => {
    const res = await GET(makeRequest("to=2024-06-01"));
    const body = await res.json();
    expect(body.total).toBe(2);
    expect(
      body.surveys.every((s: { date: string }) => s.date <= "2024-06-01"),
    ).toBe(true);
  });

  it("combined institut + from + to filter narrows results correctly", async () => {
    const res = await GET(
      makeRequest("institut=inst-a&from=2024-01-01&to=2024-12-31"),
    );
    const body = await res.json();
    expect(body.total).toBe(1);
    expect(body.surveys[0].id).toBe("1");
  });

  it("offset without limit skips the first N items and returns the rest", async () => {
    const res = await GET(makeRequest("offset=1"));
    const body = await res.json();
    expect(body.total).toBe(3);
    expect(body.count).toBe(2);
    expect(body.surveys[0].id).toBe("2");
    expect(body.surveys[1].id).toBe("3");
  });

  it("offset equal to total returns empty page, total stays at full size", async () => {
    const res = await GET(makeRequest("offset=3"));
    const body = await res.json();
    expect(body.total).toBe(3);
    expect(body.count).toBe(0);
    expect(body.surveys).toHaveLength(0);
  });

  it("offset beyond total returns empty page, not an error", async () => {
    const res = await GET(makeRequest("offset=999"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBe(3);
    expect(body.count).toBe(0);
  });

  it("no params still returns the full dataset unchanged", async () => {
    const res = await GET(makeRequest());
    const body = await res.json();
    expect(body.total).toBe(3);
    expect(body.count).toBe(3);
  });

  it("limit and offset together are unchanged by the fix", async () => {
    const res = await GET(makeRequest("limit=1&offset=1"));
    const body = await res.json();
    expect(body.total).toBe(3);
    expect(body.count).toBe(1);
    expect(body.surveys[0].id).toBe("2");
  });

  it("CSV format also applies filters", async () => {
    const res = await GET(makeRequest("format=csv&institut=inst-b"));
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain("Institut B");
    expect(text).not.toContain("Institut A");
  });
});
