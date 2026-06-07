import { describe, expect, it, vi } from "vitest";
import { GET, ATTRIBUTION } from "./route";

vi.mock("@/lib/data", () => ({
  loadBundestagData: vi.fn().mockResolvedValue({
    lastUpdate: "2024-01-01",
    bundestag: [],
  }),
}));

function makeRequest(search = "") {
  return { nextUrl: { searchParams: new URLSearchParams(search) } } as Parameters<typeof GET>[0];
}

describe("GET /api/surveys — attribution & license", () => {
  it("JSON response includes attribution block from ATTRIBUTION constant", async () => {
    const res = await GET(makeRequest());
    const body = await res.json();

    expect(body.attribution).toEqual(ATTRIBUTION);
    expect(body.attribution.license).toBe("ODbL-1.0");
    expect(body.attribution.source).toBe("dawum.de");
    expect(body.attribution.licenseUrl).toBe("https://opendatacommons.org/licenses/odbl/1-0/");
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

    expect(res.headers.get("link")).toContain("rel=\"license\"");
    expect(res.headers.get("link")).toContain(ATTRIBUTION.licenseUrl);
    expect(res.headers.get("x-data-source")).toBe(ATTRIBUTION.source);
  });

  it("CSV response sets Link rel=license and X-Data-Source headers", async () => {
    const res = await GET(makeRequest("format=csv"));

    expect(res.headers.get("link")).toContain("rel=\"license\"");
    expect(res.headers.get("x-data-source")).toBe(ATTRIBUTION.source);
  });

  it("CSV response starts with attribution comment lines before header row", async () => {
    const res = await GET(makeRequest("format=csv"));
    const text = await res.text();
    const lines = text.split("\n");

    expect(lines[0]).toMatch(/^# Source: dawum\.de/);
    expect(lines[0]).toContain("ODbL-1.0");
    expect(lines[0]).toContain("https://opendatacommons.org/licenses/odbl/1-0/");
    expect(lines[1]).toMatch(/^#/);
    expect(lines[2]).toBe("survey_id,date,period_start,period_end,institute,method,tasker,surveyed_persons,party,percent");
  });

  it("CSV column layout is unchanged for data rows", async () => {
    const res = await GET(makeRequest("format=csv"));
    const text = await res.text();
    const lines = text.split("\n");
    const headerLine = lines.find((l) => l.startsWith("survey_id"));

    expect(headerLine).toBeDefined();
    expect(headerLine!.split(",")).toHaveLength(10);
  });
});
