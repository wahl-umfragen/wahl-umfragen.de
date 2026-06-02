import type { NextRequest } from "next/server";
import { loadBundestagData } from "@/lib/data";

/**
 * Public data endpoint for all Bundestag surveys.
 *   GET /api/surveys            → JSON { lastUpdate, count, surveys }
 *   GET /api/surveys?format=csv → CSV, one row per party result (long format)
 *
 * Reads the cached loader, so it returns current data without hitting the DB
 * per request. dawum data is ODbL — attribute accordingly when reusing.
 */
export async function GET(req: NextRequest) {
  const { bundestag, lastUpdate } = await loadBundestagData();
  const format = req.nextUrl.searchParams.get("format");

  if (format === "csv") {
    return new Response(toCsv(bundestag), {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": 'attachment; filename="wahlumfragen.csv"',
        "cache-control": "public, max-age=300",
      },
    });
  }

  return Response.json(
    { lastUpdate, count: bundestag.length, surveys: bundestag },
    { headers: { "cache-control": "public, max-age=300" } },
  );
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
  const lines = [CSV_HEADER.join(",")];
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
  return lines.join("\n");
}

/** Quote a CSV cell when it contains a comma, quote, or newline. */
function csvCell(value: string | number): string {
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
