"use client";

import dynamic from "next/dynamic";
import type { TrendChartProps } from "./trend-chart";

/**
 * Client-only wrapper so a single `TrendChart` can be embedded in an otherwise
 * server-rendered page (e.g. the institute detail page). recharts needs the
 * DOM, so it loads with `ssr: false`, mirroring `PollDashboardClient`.
 */
const TrendChartImpl = dynamic(
  () => import("./trend-chart").then((m) => m.TrendChart),
  {
    ssr: false,
    loading: () => (
      <div className="h-96 w-full animate-pulse rounded-xl border border-border bg-surface sm:h-[32rem]" />
    ),
  },
);

export function TrendChartClient(props: TrendChartProps) {
  return <TrendChartImpl {...props} />;
}
