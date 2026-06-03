import type { ElectionResult } from "./results";

/** One election rendered as a table column. */
export interface ElectionColumn {
  date: string;
  label: string;
}

/** One party rendered as a table row, with a cell per column (null = no result). */
export interface ElectionTableRow {
  shortcut: string;
  /** Zweitstimmen share per column, aligned to `columns` order; null if absent. */
  cells: Array<number | null>;
}

export interface ElectionTable {
  columns: ElectionColumn[];
  rows: ElectionTableRow[];
}

/**
 * Pivot the elections into a party-by-election table: columns are elections
 * (newest first), rows are parties sorted by their result in the newest
 * election (parties missing there fall to the bottom, ordered by their best
 * available result). Pure and unit-testable; the page just renders it.
 */
export function buildElectionTable(elections: ElectionResult[]): ElectionTable {
  const columns: ElectionColumn[] = [...elections]
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((e) => ({ date: e.date, label: e.label }));

  // Column order maps back to the source elections so we can read each cell.
  const byDate = new Map(elections.map((e) => [e.date, e]));
  const ordered = columns.map((c) => byDate.get(c.date)!);

  const shortcuts = new Set<string>();
  for (const e of elections) {
    for (const s of Object.keys(e.results)) shortcuts.add(s);
  }

  const rows: ElectionTableRow[] = [...shortcuts].map((shortcut) => ({
    shortcut,
    cells: ordered.map((e) => {
      const v = e.results[shortcut];
      return typeof v === "number" ? v : null;
    }),
  }));

  // Sort by the newest election's value desc; nulls (not on the ballot / no
  // result there) sink below, tie-broken by their highest value anywhere.
  const best = (r: ElectionTableRow) =>
    Math.max(...r.cells.map((c) => c ?? -1), -1);
  rows.sort((a, b) => {
    const av = a.cells[0] ?? -1;
    const bv = b.cells[0] ?? -1;
    if (av !== bv) return bv - av;
    return best(b) - best(a);
  });

  return { columns, rows };
}
