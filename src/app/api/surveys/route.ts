import type { NextRequest } from "next/server";
import { loadBundestagData } from "@/lib/data";

/**
 * Public data endpoint for all Bundestag surveys.
 *   GET /api/surveys                    → JSON { lastUpdate, count, total, surveys }
 *   GET /api/surveys?format=csv         → CSV, one row per party result (long format)
 *   GET /api/surveys?limit=100&offset=0 → page through the dataset (newest first)
 *
 * Reads the cached loader, so it returns current data without hitting the DB
 * per request. dawum data is ODbL — attribute accordingly when reusing.
 *
 * Hardening: serializing the full dataset (esp. CSV) is the most expensive
 * thing the origin does per uncached request, so it's a natural flood target.
 * Mitigations: (1) `limit`/`offset` let clients page instead of always pulling
 * everything, with a hard `MAX_LIMIT` cap; (2) `s-maxage`/`stale-while-revalidate`
 * let Cloudflare serve from the edge and refresh in the background, so a burst
 * of identical requests collapses to ~one origin hit per 5 min. Pair this with
 * the edge Cache Rule + rate limit in `deploy/SECURITY.md`.
 */

/** Hard ceiling on an explicit `limit`, so a client can't request a huge page. */
const MAX_LIMIT = 1000;

/** Single source of truth for ODbL attribution surfaced to API consumers. */
export const ATTRIBUTION = {
  source: "dawum.de",
  license: "ODbL-1.0",
  licenseUrl: "https://opendatacommons.org/licenses/odbl/1-0/",
  attributionText: "Data sourced from dawum.de, licensed under ODbL-1.0. Share-alike required for derived databases.",
} as const;

/** HTTP headers added to every response so the license is discoverable without parsing the body. */
const LICENSE_HEADERS = {
  link: `<${ATTRIBUTION.licenseUrl}>; rel="license"`,
  "x-data-source": ATTRIBUTION.source,
} as const;

export async function GET(req: NextRequest) {
  const { bundestag, lastUpdate } = await loadBundestagData();
  const params = req.nextUrl.searchParams;
  const format = params.get("format");

  const { limit, offset, error } = parsePaging(params);
  if (error) return Response.json({ error }, { status: 400 });

  const filtered = applyFilters(bundestag, params);
  const total = filtered.length;
  // When no limit is given we keep returning the full dataset (the public
  // export use case); a given limit is clamped to [1, MAX_LIMIT].
  const page =
    limit === undefined ? filtered : filtered.slice(offset, offset + limit);

  const headers = {
    // Cache at the browser (max-age) and the edge (s-maxage), and let the edge
    // serve stale while it revalidates so bursts don't pile onto the origin.
    "cache-control": "public, max-age=300, s-maxage=300, stale-while-revalidate=60",
    ...LICENSE_HEADERS,
  };

  if (format === "csv") {
    return new Response(toCsv(page), {
      headers: {
        ...headers,
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": 'attachment; filename="wahlumfragen.csv"',
      },
    });
  }

  return Response.json(
    { lastUpdate, total, count: page.length, attribution: ATTRIBUTION, surveys: page },
    { headers },
  );
}

/**
 * Filter `surveys` in-process by `institut` (exact id match), `from` (ISO date,
 * inclusive lower bound), and `to` (ISO date, inclusive upper bound).
 * Missing or malformed params are silently ignored so the call degrades
 * gracefully (unknown institute → zero rows, not a 500).
 */
function applyFilters(
  surveys: Awaited<ReturnType<typeof loadBundestagData>>["bundestag"],
  params: URLSearchParams,
): Awaited<ReturnType<typeof loadBundestagData>>["bundestag"] {
  const institut = params.get("institut") ?? "";
  const from = params.get("from") ?? "";
  const to = params.get("to") ?? "";
  if (!institut && !from && !to) return surveys;
  return surveys.filter((s) => {
    if (institut && s.institute.id !== institut) return false;
    if (from && s.date < from) return false;
    if (to && s.date > to) return false;
    return true;
  });
}

/**
 * Parse and validate `limit`/`offset`. `limit` absent → undefined (full set).
 * Returns an `error` string for malformed input so the handler can 400.
 */
function parsePaging(params: URLSearchParams): {
  limit: number | undefined;
  offset: number;
  error?: string;
} {
  const rawLimit = params.get("limit");
  const rawOffset = params.get("offset");

  let limit: number | undefined;
  if (rawLimit !== null) {
    const n = Number(rawLimit);
    if (!Number.isInteger(n) || n < 1) {
      return { limit: undefined, offset: 0, error: "limit must be a positive integer" };
    }
    limit = Math.min(n, MAX_LIMIT);
  }

  let offset = 0;
  if (rawOffset !== null) {
    const n = Number(rawOffset);
    if (!Number.isInteger(n) || n < 0) {
      return { limit, offset: 0, error: "offset must be a non-negative integer" };
    }
    offset = n;
  }

  return { limit, offset };
}

const CSV_HEADER = [
  "survey_id",
  "date",
  "period_start",
  "period_end",
  "institute",
  "method",
  "tasker",
  "surveyed_persons",
  "party",
  "percent",
];

function toCsv(
  surveys: Awaited<ReturnType<typeof loadBundestagData>>["bundestag"],
): string {
  const lines = [
    `# Source: ${ATTRIBUTION.source} — ${ATTRIBUTION.license} (${ATTRIBUTION.licenseUrl})`,
    `# ${ATTRIBUTION.attributionText}`,
    CSV_HEADER.join(","),
  ];
  for (const s of surveys) {
    for (const r of s.results) {
      lines.push(
        [
          s.id,
          s.date,
          s.periodStart ?? "",
          s.periodEnd ?? "",
          s.institute.name,
          s.method?.name ?? "",
          s.tasker?.name ?? "",
          s.surveyedPersons ?? "",
          r.shortcut,
          r.percent,
        ]
          .map(csvCell)
          .join(","),
      );
    }
  }
  return "﻿" + lines.join("\r\n");
}

/** Quote a CSV cell when it contains a comma, quote, or newline. */
function csvCell(value: string | number): string {
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
