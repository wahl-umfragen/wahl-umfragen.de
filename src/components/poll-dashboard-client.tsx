"use client";

import dynamic from "next/dynamic";
import type { PollDashboardProps } from "./poll-dashboard";

const PollDashboardImpl = dynamic(
  () => import("./poll-dashboard").then((m) => m.PollDashboard),
  {
    ssr: false,
    loading: () => (
      <div data-testid="dashboard-loading" className="space-y-10">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-72 w-full animate-pulse rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
          />
        ))}
      </div>
    ),
  },
);

export function PollDashboardClient(props: PollDashboardProps) {
  return <PollDashboardImpl {...props} />;
}
