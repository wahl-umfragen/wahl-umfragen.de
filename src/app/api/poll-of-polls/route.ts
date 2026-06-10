import type { NextRequest } from "next/server";
import { loadBundestagData } from "@/lib/data";
import {
  seatDistribution,
  surveysWithinDays,
  weightedAverage,
} from "@/lib/dawum";

/**
 * Public "poll of polls" endpoint: the recency- and sample-size-weighted average
 * over the last 30 days of Bundestag surveys, plus the projected seat
 * distribution. Mirrors the home-page box (`weightedAverage` + `seatDistribution`)
 * as machine-readable JSON. Reads the cached loader; sends a weak ETag for
 * conditional requests. dawum data is ODbL — attribute when reusing.
 *
 *   GET /api/poll-of-polls            → { lastUpdate, basisDays, basisCount, average, seats }
 *   GET /api/poll-of-polls?days=14    → narrower window (1..120 days)
 */

const DEFAULT_DAYS = 30;
const MAX_DAYS = 120;

const ATTRIBUTION = {
  source: "dawum.de",
  license: "ODbL-1.0",
  licenseUrl: "https://opendatacommons.org/licenses/odbl/1-0/",
} as const;

const LICENSE_HEADERS = {
  link: `<${ATTRIBUTION.licenseUrl}>; rel="license"`,
  "x-data-source": ATTRIBUTION.source,
} as const;

export async function GET(req: NextRequest) {
  const { bundestag, lastUpdate } = await loadBundestagData();

  const rawDays = Number(req.nextUrl.searchParams.get("days") ?? DEFAULT_DAYS);
  const days = Number.isInteger(rawDays)
    ? Math.min(Math.max(rawDays, 1), MAX_DAYS)
    : DEFAULT_DAYS;

  const etag = `W/"${lastUpdate ?? "0"}-pp${days}"`;
  if (req.headers?.get("if-none-match") === etag) {
    return new Response(null, {
      status: 304,
      headers: { etag, ...LICENSE_HEADERS },
    });
  }

  const recent = surveysWithinDays(bundestag, days);
  const average = weightedAverage(recent);
  const seats = seatDistribution(average);

  return Response.json(
    {
      lastUpdate,
      basisDays: days,
      basisCount: recent.length,
      attribution: ATTRIBUTION,
      average,
      seats,
    },
    {
      headers: {
        "cache-control":
          "public, max-age=300, s-maxage=300, stale-while-revalidate=60",
        etag,
        ...LICENSE_HEADERS,
      },
    },
  );
}
