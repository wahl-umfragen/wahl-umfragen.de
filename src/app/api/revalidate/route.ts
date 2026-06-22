import { revalidateTag } from "next/cache";
import type { NextRequest } from "next/server";
import { SURVEYS_TAG } from "@/lib/data/tags";

/**
 * On-demand cache invalidation. The ingest worker POSTs here after a real
 * ingest (see scripts/ingest.ts) so the statically-cached pages regenerate
 * with the new data — instead of expiring on a timer. Protected by a shared
 * secret in the `x-revalidate-secret` header.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) {
    return Response.json(
      { error: "revalidation not configured (REVALIDATE_SECRET unset)" },
      { status: 503 },
    );
  }
  if (req.headers.get("x-revalidate-secret") !== secret) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  // Expire immediately so the *next* visit to any tagged page is a blocking
  // cache miss that serves fresh data. The "max" stale-while-revalidate profile
  // instead serves stale content for one more visit — fine for the high-traffic
  // archive/home, but it left rarely-visited per-id routes (e.g. /institut/[id])
  // lagging a full ingest behind. `{ expire: 0 }` is the documented form for
  // external callers (our ingest worker) that need immediate expiration.
  revalidateTag(SURVEYS_TAG, { expire: 0 });
  return Response.json({ revalidated: true, tag: SURVEYS_TAG });
}
