import { gunzipSync, gzipSync } from "node:zlib";
import { and, desc, eq, isNotNull } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { cache } from "react";
import { db } from "@/db/client";
import * as schema from "@/db/schema";
import {
  BUNDESTAG_PARLIAMENT_ID,
  type NormalizedPartyResult,
  type NormalizedSurvey,
} from "@/lib/dawum/types";
import { SURVEYS_TAG } from "./tags";

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
 *
 * Wrapped in `unstable_cache` (tag `surveys`, no time expiry): the heavy query
 * runs once and is reused across all requests until the ingest worker triggers
 * `revalidateTag('surveys')`. That's what makes the pages cheap at scale.
 *
 * The cached value is **gzipped** (base64 of the gzipped JSON), not the raw
 * object. Next's data cache rejects any single entry over 2 MB, and the
 * accumulated history outgrew that (~2.8 MB of JSON). Compression brings it to a
 * few hundred KB — well under the cap and slow-growing — so the shared,
 * tag-invalidated cache the whole frontend depends on keeps working instead of
 * silently failing and re-querying Postgres on every render. We decode once per
 * request via React `cache()` (multiple components — e.g. a page and its
 * `generateMetadata` — share the single decode).
 */
const loadCompressedBundestagData = unstable_cache(
  async () => {
    const data = await loadBundestagDataUncached();
    return gzipSync(Buffer.from(JSON.stringify(data))).toString("base64");
  },
  ["bundestag-data"],
  { tags: [SURVEYS_TAG], revalidate: false },
);

export const loadBundestagData = cache(
  async (): Promise<BundestagData> => {
    const gz = await loadCompressedBundestagData();
    return JSON.parse(
      gunzipSync(Buffer.from(gz, "base64")).toString("utf8"),
    ) as BundestagData;
  },
);

async function loadBundestagDataUncached(): Promise<BundestagData> {
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

  const bundestag = mapSurveyRows(surveyRows, resultRows);
  return { bundestag, lastUpdate };
}

/** Column selection for a survey joined with its lookup names. */
const surveyColumns = {
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
} as const;

type SurveyRow = {
  id: string;
  date: string;
  periodStart: string | null;
  periodEnd: string | null;
  surveyedPersons: number | null;
  parliamentId: string;
  parliamentShortcut: string;
  parliamentName: string;
  instituteId: string;
  instituteName: string;
  taskerId: string | null;
  taskerName: string | null;
  methodId: string | null;
  methodName: string | null;
};

type ResultRow = {
  surveyId: string;
  partyId: string;
  shortcut: string;
  name: string;
  percent: number;
};

/** Group result rows under their survey and assemble NormalizedSurvey[]. */
function mapSurveyRows(
  surveyRows: SurveyRow[],
  resultRows: ResultRow[],
): NormalizedSurvey[] {
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

  return surveyRows.map((s) => ({
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
}

const resultColumns = {
  surveyId: schema.surveyResults.surveyId,
  partyId: schema.surveyResults.partyId,
  shortcut: schema.parties.shortcut,
  name: schema.parties.name,
  percent: schema.surveyResults.percent,
} as const;

/**
 * All Bundestag surveys from one institute, newest first. Targeted loader for
 * `/institut/[id]` so the page reads ~one institute's rows instead of
 * decompressing the whole history. Cached under the shared `surveys` tag (the
 * institute id is part of the cache key), so ingest revalidation reaches it.
 */
export const loadSurveysByInstitute = unstable_cache(
  async (instituteId: string): Promise<NormalizedSurvey[]> => {
    const where = and(
      eq(schema.surveys.parliamentId, BUNDESTAG_PARLIAMENT_ID),
      eq(schema.surveys.instituteId, instituteId),
    );
    const surveyRows = await db
      .select(surveyColumns)
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
      .where(where)
      .orderBy(desc(schema.surveys.date), desc(schema.surveys.id));
    if (surveyRows.length === 0) return [];

    const resultRows = await db
      .select(resultColumns)
      .from(schema.surveyResults)
      .innerJoin(
        schema.parties,
        eq(schema.surveyResults.partyId, schema.parties.id),
      )
      .innerJoin(
        schema.surveys,
        eq(schema.surveyResults.surveyId, schema.surveys.id),
      )
      .where(where);
    return mapSurveyRows(surveyRows, resultRows);
  },
  ["surveys-by-institute"],
  { tags: [SURVEYS_TAG], revalidate: false },
);

/**
 * A single survey by id, or null. Targeted loader for `/archiv/[id]` so the
 * detail page reads one row instead of the whole history.
 */
export const loadSurveyById = unstable_cache(
  async (id: string): Promise<NormalizedSurvey | null> => {
    const surveyRows = await db
      .select(surveyColumns)
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
      .where(eq(schema.surveys.id, id))
      .limit(1);
    if (surveyRows.length === 0) return null;

    const resultRows = await db
      .select(resultColumns)
      .from(schema.surveyResults)
      .innerJoin(
        schema.parties,
        eq(schema.surveyResults.partyId, schema.parties.id),
      )
      .where(eq(schema.surveyResults.surveyId, id));
    return mapSurveyRows(surveyRows, resultRows)[0] ?? null;
  },
  ["survey-by-id"],
  { tags: [SURVEYS_TAG], revalidate: false },
);

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
