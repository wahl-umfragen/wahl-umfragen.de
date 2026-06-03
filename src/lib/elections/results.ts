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

const BUNDESWAHLLEITERIN = {
  name: "Die Bundeswahlleiterin",
  url: "https://www.bundeswahlleiterin.de/bundestagswahlen/2025/ergebnisse.html",
} as const;

/**
 * Certified Bundestag election results, newest last. Append the next entry
 * after each federal election — the guard test in `markers.test.ts` turns CI
 * red before the next regular election (≈2029) so this can't be forgotten.
 *
 * BTW 2025 Zweitstimmen, amtliches Endergebnis (Die Bundeswahlleiterin,
 * Wahltag 2025-02-23): CDU/CSU 28.6, AfD 20.8, SPD 16.4, Grüne 11.6, Linke 8.8,
 * BSW 4.981 (knapp unter 5 %), FDP 4.3, FW 1.5.
 */
export const BUNDESTAG_ELECTIONS: ElectionResult[] = [
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
    source: BUNDESWAHLLEITERIN,
  },
];
