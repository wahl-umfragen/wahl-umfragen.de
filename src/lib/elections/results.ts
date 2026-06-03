import { BUNDESTAG_PARLIAMENT_ID } from "@/lib/dawum/types";

/**
 * One certified federal election result. Unlike the polls (which come from
 * dawum), these are the **official final results** ("amtliches Endergebnis")
 * published by Die Bundeswahlleiterin. They never change once certified, so we
 * keep them as a small, reviewed, version-controlled constant rather than
 * ingesting them — see the plan/AGENTS notes. They are rendered as comparison
 * markers on the trend chart ("polls vs. how people actually voted"), never as
 * surveys, so they don't touch averages, seats or house effects.
 */
export interface ElectionResult {
  /** ISO date of the election (the voting day). */
  date: string;
  /** Human-readable label, e.g. "Bundestagswahl 2025". */
  label: string;
  /** Parliament this election fills — matches dawum's parliament id. */
  parliamentId: string;
  /**
   * Official second-vote (Zweitstimmen) share per party, in percent. Keyed by
   * the **same party shortcuts dawum uses** (`CDU/CSU`, `SPD`, `Grüne`, `AfD`,
   * `Linke`, `BSW`, `FDP`, `FW`, …) so each marker lines up with its charted
   * series.
   */
  results: Record<string, number>;
  /** Attribution for the official figures. */
  source: { name: string; url: string };
}

/** Bundeswahlleiterin result page for a given election year. */
function bundeswahlleiterin(year: number): { name: string; url: string } {
  return {
    name: "Die Bundeswahlleiterin",
    url: `https://www.bundeswahlleiterin.de/bundestagswahlen/${year}/ergebnisse.html`,
  };
}

/**
 * Certified Bundestag election results, **oldest first** (the table and the
 * data-consistency test rely on ascending date order). Append the next entry
 * after each federal election — the guard test in `markers.test.ts` turns CI
 * red before the next regular election (≈2029) so this can't be forgotten.
 *
 * All figures are official Zweitstimmen-Endergebnisse from Die Bundeswahlleiterin,
 * rounded to one decimal (2025 BSW kept at full precision so the sub-5 % near-miss
 * stays visible). Parties that didn't exist at an election (e.g. BSW before 2025)
 * are simply omitted → the table shows "–" for them.
 */
export const BUNDESTAG_ELECTIONS: ElectionResult[] = [
  {
    date: "2017-09-24",
    label: "Bundestagswahl 2017",
    parliamentId: BUNDESTAG_PARLIAMENT_ID,
    results: {
      "CDU/CSU": 32.9,
      SPD: 20.5,
      AfD: 12.6,
      FDP: 10.7,
      Linke: 9.2,
      Grüne: 8.9,
      FW: 1.0,
    },
    source: bundeswahlleiterin(2017),
  },
  {
    date: "2021-09-26",
    label: "Bundestagswahl 2021",
    parliamentId: BUNDESTAG_PARLIAMENT_ID,
    results: {
      SPD: 25.7,
      "CDU/CSU": 24.1,
      Grüne: 14.8,
      FDP: 11.5,
      AfD: 10.3,
      Linke: 4.9,
      FW: 2.4,
    },
    source: bundeswahlleiterin(2021),
  },
  {
    date: "2025-02-23",
    label: "Bundestagswahl 2025",
    parliamentId: BUNDESTAG_PARLIAMENT_ID,
    results: {
      "CDU/CSU": 28.6,
      AfD: 20.8,
      SPD: 16.4,
      Grüne: 11.6,
      Linke: 8.8,
      BSW: 4.981,
      FDP: 4.3,
      FW: 1.5,
    },
    source: bundeswahlleiterin(2025),
  },
];
