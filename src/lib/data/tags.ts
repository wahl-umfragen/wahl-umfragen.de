/** Cache tag for all DB-backed poll data. The loader tags its `unstable_cache`
 * entries with this; the ingest worker invalidates it via the revalidate route
 * after a real ingest. Kept dependency-free so the route handler can import the
 * constant without pulling in the DB layer. */
export const SURVEYS_TAG = "surveys";
