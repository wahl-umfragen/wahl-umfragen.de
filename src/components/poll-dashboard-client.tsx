"use client";

import type { PollDashboardProps } from "./poll-dashboard";
import { PollDashboard } from "./poll-dashboard";

export function PollDashboardClient(props: PollDashboardProps) {
  return <PollDashboard {...props} />;
}
