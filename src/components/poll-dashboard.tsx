"use client";

import { useMemo, useState } from "react";
import type {
  InstituteComparison,
  PartyAverage,
  SeatDistribution,
} from "@/lib/dawum/aggregate";
import { smoothTrendData, type TrendData } from "@/lib/dawum/trend";
import {
  CurrentStandingChart,
  InstituteComparisonChart,
  SeatDistributionChart,
} from "./poll-charts";
import { TrendChart } from "./trend-chart";

export interface PollDashboardProps {
  average: PartyAverage[];
  trend: TrendData;
  seats: SeatDistribution;
  comparison: InstituteComparison;
}

export function PollDashboard({
  average,
  trend,
  seats,
  comparison,
}: PollDashboardProps) {
  const [smoothed, setSmoothed] = useState(true);
  const trendData = useMemo(
    () => (smoothed ? smoothTrendData(trend, 5) : trend),
    [smoothed, trend],
  );

  return (
    <div className="space-y-10">
      <Section title="Aktueller Stand" hint="Durchschnitt der jüngsten Umfrage je Institut">
        <CurrentStandingChart data={average} />
      </Section>

      <Section
        title="Trend (90 Tage)"
        action={
          <label className="flex items-center gap-2 text-xs font-normal normal-case tracking-normal text-zinc-600 dark:text-zinc-400">
            <input
              type="checkbox"
              data-testid="smooth-toggle"
              checked={smoothed}
              onChange={(e) => setSmoothed(e.target.checked)}
              className="h-3.5 w-3.5 accent-zinc-700 dark:accent-zinc-300"
            />
            Geglättet
          </label>
        }
      >
        <TrendChart data={trendData} showDots={!smoothed} />
      </Section>

      <Section title="Sitzverteilung" hint="Hochrechnung mit 5%-Hürde (Hare/Niemeyer)">
        <SeatDistributionChart data={seats} />
      </Section>

      <Section title="Institutsvergleich" hint="Gleiche Parteien je Institut – zeigt House-Effects">
        <InstituteComparisonChart data={comparison} />
      </Section>
    </div>
  );
}

function Section({
  title,
  hint,
  action,
  children,
}: {
  title: string;
  hint?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          {title}
        </h3>
        {action}
      </div>
      {hint ? (
        <p className="-mt-2 mb-3 text-xs text-zinc-500 dark:text-zinc-400">
          {hint}
        </p>
      ) : null}
      {children}
    </section>
  );
}
