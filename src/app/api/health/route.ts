import { sql } from "drizzle-orm";
import { db } from "@/db/client";

// Liveness/readiness probe for uptime monitoring, the Docker HEALTHCHECK and
// load balancers. Must never be cached — it has to reflect the live DB state.
export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Returns 200 only when the app can reach Postgres (the app has no live
 * fallback — an unreachable DB means a broken site). Returns 503 otherwise so
 * an external monitor can alert. Cheap: a single `SELECT 1`.
 */
export async function GET() {
  try {
    await db.execute(sql`select 1`);
    return Response.json(
      { status: "ok", db: "up" },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    return Response.json(
      {
        status: "error",
        db: "down",
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
