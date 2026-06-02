import { fetchDawumDatabase } from "./client";
import { selectBundestagSurveys } from "./normalize";
import type { DawumDatabase, NormalizedSurvey } from "./types";

export interface BundestagData {
  db: DawumDatabase;
  /** All Bundestag surveys, newest first. */
  bundestag: NormalizedSurvey[];
  /** ISO timestamp of dawum's last update. */
  lastUpdate: string;
}

/**
 * Server-side loader shared by every page route. Uses the live read path
 * (see AGENTS.md) — `fetchDawumDatabase` is cached via Next's `revalidate`,
 * so calling this from multiple routes does not multiply upstream requests.
 */
export async function loadBundestagData(): Promise<BundestagData> {
  const db = await fetchDawumDatabase();
  return {
    db,
    bundestag: selectBundestagSurveys(db),
    lastUpdate: db.Database.Last_Update,
  };
}
