import { desc, eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { db } from "@/db/client";
import { problemReports } from "@/db/schema";

/**
 * Triage endpoint for submitted problem reports (the `problem_reports` table is
 * otherwise write-only). Secret-gated by the `x-reports-secret` header against
 * `REPORTS_SECRET` — same pattern as `/api/revalidate`. Best practice: keep this
 * server-local / behind the edge (a WAF rule blocking external access is cheap).
 *
 *   GET   /api/reports            → newest reports (optional ?status=, ?limit=)
 *   PATCH /api/reports            → { id, status } updates one report's status
 */

const STATUSES = ["new", "seen", "done", "spam"] as const;
type Status = (typeof STATUSES)[number];

const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 500;

function authorized(req: NextRequest): boolean | null {
  const secret = process.env.REPORTS_SECRET;
  if (!secret) return null; // not configured
  return req.headers.get("x-reports-secret") === secret;
}

export async function GET(req: NextRequest) {
  const auth = authorized(req);
  if (auth === null) {
    return Response.json(
      { error: "triage not configured (REPORTS_SECRET unset)" },
      { status: 503 },
    );
  }
  if (!auth) return Response.json({ error: "unauthorized" }, { status: 401 });

  const params = req.nextUrl.searchParams;
  const status = params.get("status");
  const rawLimit = Number(params.get("limit") ?? DEFAULT_LIMIT);
  const limit = Number.isInteger(rawLimit)
    ? Math.min(Math.max(rawLimit, 1), MAX_LIMIT)
    : DEFAULT_LIMIT;

  const base = db.select().from(problemReports);
  const rows = await (
    status && (STATUSES as readonly string[]).includes(status)
      ? base.where(eq(problemReports.status, status))
      : base
  )
    .orderBy(desc(problemReports.createdAt))
    .limit(limit);

  return Response.json({ count: rows.length, reports: rows });
}

export async function PATCH(req: NextRequest) {
  const auth = authorized(req);
  if (auth === null) {
    return Response.json(
      { error: "triage not configured (REPORTS_SECRET unset)" },
      { status: 503 },
    );
  }
  if (!auth) return Response.json({ error: "unauthorized" }, { status: 401 });

  let body: { id?: unknown; status?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid body" }, { status: 400 });
  }

  const { id, status } = body;
  if (typeof id !== "string" || !id) {
    return Response.json({ error: "id required" }, { status: 400 });
  }
  if (
    typeof status !== "string" ||
    !(STATUSES as readonly string[]).includes(status)
  ) {
    return Response.json(
      { error: `status must be one of: ${STATUSES.join(", ")}` },
      { status: 400 },
    );
  }

  const [updated] = await db
    .update(problemReports)
    .set({ status: status as Status })
    .where(eq(problemReports.id, id))
    .returning();

  if (!updated) return Response.json({ error: "not found" }, { status: 404 });
  return Response.json({ ok: true, report: updated });
}
