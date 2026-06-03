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
      <div className="h-80 w-full animate-pulse rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 sm:h-[26rem]" />
    ),
  },
);

export function TrendChartClient(props: TrendChartProps) {
  return <TrendChartImpl {...props} />;
}
