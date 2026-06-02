import { desc, eq, isNotNull } from "drizzle-orm";
import { db } from "@/db/client";
import * as schema from "@/db/schema";
import {
  BUNDESTAG_PARLIAMENT_ID,
  type NormalizedPartyResult,
  type NormalizedSurvey,
} from "@/lib/dawum/types";

export interface BundestagData {
  /** All Bundestag surveys in the DB, newest first. */
  bundestag: NormalizedSurvey[];
  /** ISO timestamp of dawum's last update we ingested, or null if never. */
  lastUpdate: string | null;
}

/**
 * Server-side loader shared by every page route — the **DB read path**
 * (Phase 2, see AGENTS.md). Reads accumulated history from Postgres instead of
 * hitting dawum live, so the frontend shows whatever the ingest worker has
 * gathered. An empty DB yields empty data (no live fallback by design).
 *
 * Produces the exact same `NormalizedSurvey[]` shape the live path used, so all
 * downstream selectors and components are unchanged.
 */
export async function loadBundestagData(): Promise<BundestagData> {
  const surveyRows = await db
    .select({
      id: schema.surveys.id,
      date: schema.surveys.date,
      periodStart: schema.surveys.periodStart,
      periodEnd: schema.surveys.periodEnd,
      surveyedPersons: schema.surveys.surveyedPersons,
      parliamentId: schema.surveys.parliamentId,
      parliamentShortcut: schema.parliaments.shortcut,
      parliamentName: schema.parliaments.name,
      instituteId: schema.surveys.instituteId,
      instituteName: schema.institutes.name,
      taskerId: schema.surveys.taskerId,
      taskerName: schema.taskers.name,
      methodId: schema.surveys.methodId,
      methodName: schema.methods.name,
    })
    .from(schema.surveys)
    .innerJoin(
      schema.parliaments,
      eq(schema.surveys.parliamentId, schema.parliaments.id),
    )
    .innerJoin(
      schema.institutes,
      eq(schema.surveys.instituteId, schema.institutes.id),
    )
    .leftJoin(schema.taskers, eq(schema.surveys.taskerId, schema.taskers.id))
    .leftJoin(schema.methods, eq(schema.surveys.methodId, schema.methods.id))
    .where(eq(schema.surveys.parliamentId, BUNDESTAG_PARLIAMENT_ID))
    .orderBy(desc(schema.surveys.date), desc(schema.surveys.id));

  const lastUpdate = await loadLastUpdate();
  if (surveyRows.length === 0) return { bundestag: [], lastUpdate };

  // One query for all results of Bundestag surveys; grouped in memory.
  const resultRows = await db
    .select({
      surveyId: schema.surveyResults.surveyId,
      partyId: schema.surveyResults.partyId,
      shortcut: schema.parties.shortcut,
      name: schema.parties.name,
      percent: schema.surveyResults.percent,
    })
    .from(schema.surveyResults)
    .innerJoin(
      schema.parties,
      eq(schema.surveyResults.partyId, schema.parties.id),
    )
    .innerJoin(schema.surveys, eq(schema.surveyResults.surveyId, schema.surveys.id))
    .where(eq(schema.surveys.parliamentId, BUNDESTAG_PARLIAMENT_ID));

  const resultsBySurvey = new Map<string, NormalizedPartyResult[]>();
  for (const r of resultRows) {
    const list = resultsBySurvey.get(r.surveyId) ?? [];
    list.push({
      partyId: r.partyId,
      shortcut: r.shortcut,
      name: r.name,
      percent: r.percent,
    });
    resultsBySurvey.set(r.surveyId, list);
  }

  const bundestag: NormalizedSurvey[] = surveyRows.map((s) => ({
    id: s.id,
    date: s.date,
    periodStart: s.periodStart ?? undefined,
    periodEnd: s.periodEnd ?? undefined,
    surveyedPersons: s.surveyedPersons ?? undefined,
    parliament: {
      id: s.parliamentId,
      shortcut: s.parliamentShortcut,
      name: s.parliamentName,
    },
    institute: { id: s.instituteId, name: s.instituteName },
    tasker:
      s.taskerId && s.taskerName
        ? { id: s.taskerId, name: s.taskerName }
        : undefined,
    method:
      s.methodId && s.methodName
        ? { id: s.methodId, name: s.methodName }
        : undefined,
    results: (resultsBySurvey.get(s.id) ?? []).sort(
      (a, b) => b.percent - a.percent,
    ),
  }));

  return { bundestag, lastUpdate };
}

/** Newest dawum `last_update` we have recorded, as ISO, or null. */
async function loadLastUpdate(): Promise<string | null> {
  const [row] = await db
    .select({ value: schema.ingestRuns.dawumLastUpdate })
    .from(schema.ingestRuns)
    .where(isNotNull(schema.ingestRuns.dawumLastUpdate))
    .orderBy(desc(schema.ingestRuns.dawumLastUpdate))
    .limit(1);
  return row?.value ? row.value.toISOString() : null;
}
