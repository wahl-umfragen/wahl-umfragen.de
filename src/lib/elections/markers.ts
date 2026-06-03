import type { ElectionResult } from "./results";

/** One chartable comparison point: a party's official result at an election. */
export interface ElectionMarker {
  /** Election day as an epoch timestamp (the chart's x scale is time). */
  date: number;
  /** Election label, e.g. "Bundestagswahl 2025". */
  label: string;
  /** Party shortcut — matches the trend series and the color map. */
  shortcut: string;
  /** Official second-vote share, in percent. */
  percent: number;
}

/**
 * Flatten elections into one marker per (election × charted party that has a
 * result). Pure: no range filtering — the chart discards markers outside the
 * visible x-domain via recharts' `ifOverflow="discard"`, and passing only the
 * currently drawn `series` means hidden/over-cap parties get no marker for
 * free. Parties without a recorded result in an election are skipped.
 */
export function electionMarkers(
  elections: ElectionResult[],
  series: ReadonlyArray<{ shortcut: string }>,
): ElectionMarker[] {
  const markers: ElectionMarker[] = [];
  for (const election of elections) {
    const date = new Date(election.date).getTime();
    for (const { shortcut } of series) {
      const percent = election.results[shortcut];
      if (typeof percent === "number") {
        markers.push({ date, label: election.label, shortcut, percent });
      }
    }
  }
  return markers;
}
