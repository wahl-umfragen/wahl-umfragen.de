import { describe, expect, it } from "vitest";
import type { ElectionResult } from "./results";
import { buildElectionTable } from "./table";

const SOURCE = { name: "Q", url: "https://example.test" };

const ELECTIONS: ElectionResult[] = [
  {
    date: "2021-09-26",
    label: "Bundestagswahl 2021",
    parliamentId: "0",
    results: { SPD: 25.7, "CDU/CSU": 24.1, Grüne: 14.8, FDP: 11.5 },
    source: SOURCE,
  },
  {
    date: "2025-02-23",
    label: "Bundestagswahl 2025",
    parliamentId: "0",
    results: { "CDU/CSU": 28.6, AfD: 20.8, SPD: 16.4, Grüne: 11.6 },
    source: SOURCE,
  },
];

describe("buildElectionTable()", () => {
  it("orders columns newest-first", () => {
    const { columns } = buildElectionTable(ELECTIONS);
    expect(columns.map((c) => c.date)).toEqual(["2025-02-23", "2021-09-26"]);
  });

  it("sorts rows by the newest election's result, descending", () => {
    const { rows } = buildElectionTable(ELECTIONS);
    expect(rows[0]?.shortcut).toBe("CDU/CSU"); // 28.6 in 2025
    expect(rows[1]?.shortcut).toBe("AfD"); // 20.8 in 2025
  });

  it("aligns each cell to its column and uses null when absent", () => {
    const { rows } = buildElectionTable(ELECTIONS);
    const afd = rows.find((r) => r.shortcut === "AfD");
    // present in 2025 (col 0), absent in 2021 (col 1)
    expect(afd?.cells).toEqual([20.8, null]);
    const fdp = rows.find((r) => r.shortcut === "FDP");
    // absent in 2025, present in 2021
    expect(fdp?.cells).toEqual([null, 11.5]);
  });

  it("places parties missing from the newest election below the rest", () => {
    const { rows } = buildElectionTable(ELECTIONS);
    const fdpIndex = rows.findIndex((r) => r.shortcut === "FDP");
    const grueneIndex = rows.findIndex((r) => r.shortcut === "Grüne");
    expect(fdpIndex).toBeGreaterThan(grueneIndex);
  });

  it("handles a single election", () => {
    const { columns, rows } = buildElectionTable([ELECTIONS[1]]);
    expect(columns).toHaveLength(1);
    expect(rows.every((r) => r.cells.length === 1)).toBe(true);
  });

  it("returns empty structure for no elections", () => {
    expect(buildElectionTable([])).toEqual({ columns: [], rows: [] });
  });
});
