"use client";

import dynamic from "next/dynamic";
import type { TrendData } from "@/lib/dawum/trend";

const TrendChartImpl = dynamic(
  () => import("./trend-chart").then((m) => m.TrendChart),
  {
    ssr: false,
    loading: () => (
      <div
        data-testid="trend-chart-loading"
        className="h-72 w-full animate-pulse rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 sm:h-96"
      />
    ),
  },
);

export function TrendChartClient(props: { data: TrendData }) {
  return <TrendChartImpl {...props} />;
}
