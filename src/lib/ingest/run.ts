import { desc, eq, isNotNull, sql } from "drizzle-orm";
import { db as defaultDb, type Db } from "@/db/client";
import * as schema from "@/db/schema";
import {
  fetchDawumDatabaseRaw,
  fetchDawumLastUpdateRaw,
} from "@/lib/dawum/client";
import { type Anomaly, detectAnomalies } from "./anomalies";
import { transformDawumToRows } from "./transform";

const CHUNK_SIZE = 1000;

function chunked<T>(rows: T[]): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
    out.push(rows.slice(i, i + CHUNK_SIZE));
  }
  return out;
}

export interface IngestResult {
  /** null when the run was skipped (no change since the last ingest). */
  runId: string | null;
  /** true when dawum reported no change and the full ingest was skipped. */
  skipped: boolean;
  /** dawum's last_update value seen on this run (ISO), if it was reachable. */
  dawumLastUpdate: string | null;
  surveysSeen: number;
  surveysNew: number;
  surveysUpdated: number;
  durationMs: number;
  /** Plausibility issues found in the dawum payload (not a hard failure — the
   * rows are still upserted; the caller can alert on these). */
  anomalies: Anomaly[];
}

export async function runIngest(
  database: Db = defaultDb,
  opts: { force?: boolean } = {},
): Promise<IngestResult> {
  const startedAt = Date.now();

  // Cheap guard: only do the heavy full fetch + upsert when dawum's data has
  // actually changed since our newest successful ingest. Lets the worker poll
  // frequently (hourly) while staying polite to dawum.
  const lastUpdate = await fetchDawumLastUpdateRaw();
  if (!opts.force) {
    const [prev] = await database
      .select({ dawumLastUpdate: schema.ingestRuns.dawumLastUpdate })
      .from(schema.ingestRuns)
      .where(isNotNull(schema.ingestRuns.dawumLastUpdate))
      .orderBy(desc(schema.ingestRuns.dawumLastUpdate))
      .limit(1);
    if (prev?.dawumLastUpdate && lastUpdate <= prev.dawumLastUpdate) {
      return {
        runId: null,
        skipped: true,
        dawumLastUpdate: lastUpdate.toISOString(),
        surveysSeen: 0,
        surveysNew: 0,
        surveysUpdated: 0,
        durationMs: Date.now() - startedAt,
        anomalies: [],
      };
    }
  }

  const runId = crypto.randomUUID();
  await database.insert(schema.ingestRuns).values({ id: runId });

  try {
    const data = await fetchDawumDatabaseRaw();
    const rows = transformDawumToRows(data);

    // Flag implausible data (don't drop it — still upsert; the caller alerts).
    const anomalies = detectAnomalies(rows);
    for (const a of anomalies) {
      console.warn(
        `[ingest] anomaly (${a.kind}) survey=${a.surveyId}: ${a.detail}`,
      );
    }

    const existing = await database
      .select({ id: schema.surveys.id })
      .from(schema.surveys);
    const existingIds = new Set(existing.map((r) => r.id));

    let surveysNew = 0;
    let surveysUpdated = 0;
    for (const s of rows.surveys) {
      if (existingIds.has(s.id)) surveysUpdated++;
      else surveysNew++;
    }

    await database.transaction(async (tx) => {
      for (const chunk of chunked(rows.parliaments)) {
        await tx
          .insert(schema.parliaments)
          .values(chunk)
          .onConflictDoUpdate({
            target: schema.parliaments.id,
            set: {
              shortcut: sql`excluded.shortcut`,
              name: sql`excluded.name`,
              election: sql`excluded.election`,
            },
          });
      }
      for (const chunk of chunked(rows.institutes)) {
        await tx
          .insert(schema.institutes)
          .values(chunk)
          .onConflictDoUpdate({
            target: schema.institutes.id,
            set: { name: sql`excluded.name` },
          });
      }
      for (const chunk of chunked(rows.taskers)) {
        await tx
          .insert(schema.taskers)
          .values(chunk)
          .onConflictDoUpdate({
            target: schema.taskers.id,
            set: { name: sql`excluded.name` },
          });
      }
      for (const chunk of chunked(rows.methods)) {
        await tx
          .insert(schema.methods)
          .values(chunk)
          .onConflictDoUpdate({
            target: schema.methods.id,
            set: { name: sql`excluded.name` },
          });
      }
      for (const chunk of chunked(rows.parties)) {
        await tx
          .insert(schema.parties)
          .values(chunk)
          .onConflictDoUpdate({
            target: schema.parties.id,
            set: {
              shortcut: sql`excluded.shortcut`,
              name: sql`excluded.name`,
            },
          });
      }
      for (const chunk of chunked(rows.surveys)) {
        await tx
          .insert(schema.surveys)
          .values(chunk)
          .onConflictDoUpdate({
            target: schema.surveys.id,
            set: {
              date: sql`excluded.date`,
              parliamentId: sql`excluded.parliament_id`,
              instituteId: sql`excluded.institute_id`,
              taskerId: sql`excluded.tasker_id`,
              methodId: sql`excluded.method_id`,
              surveyedPersons: sql`excluded.surveyed_persons`,
              periodStart: sql`excluded.period_start`,
              periodEnd: sql`excluded.period_end`,
              lastSeenAt: sql`now()`,
            },
          });
      }
      for (const chunk of chunked(rows.surveyResults)) {
        await tx
          .insert(schema.surveyResults)
          .values(chunk)
          .onConflictDoUpdate({
            target: [
              schema.surveyResults.surveyId,
              schema.surveyResults.partyId,
            ],
            set: { percent: sql`excluded.percent` },
          });
      }
    });

    const durationMs = Date.now() - startedAt;
    await database
      .update(schema.ingestRuns)
      .set({
        completedAt: new Date(),
        dawumLastUpdate: lastUpdate,
        surveysSeen: rows.surveys.length,
        surveysNew,
        surveysUpdated,
      })
      .where(eq(schema.ingestRuns.id, runId));

    return {
      runId,
      skipped: false,
      dawumLastUpdate: lastUpdate.toISOString(),
      surveysSeen: rows.surveys.length,
      surveysNew,
      surveysUpdated,
      durationMs,
      anomalies,
    };
  } catch (err) {
    await database
      .update(schema.ingestRuns)
      .set({
        completedAt: new Date(),
        error: err instanceof Error ? err.message : String(err),
      })
      .where(eq(schema.ingestRuns.id, runId));
    throw err;
  }
}
