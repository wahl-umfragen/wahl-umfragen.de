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

  // "max" = stale-while-revalidate: next visit serves cached content and
  // refreshes in the background. Fine for hourly-updated poll data and avoids
  // a blocking regeneration under load.
  revalidateTag(SURVEYS_TAG, "max");
  return Response.json({ revalidated: true, tag: SURVEYS_TAG });
}
