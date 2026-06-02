"use client";

import { useMemo, useState } from "react";
import { t, type TranslationKey } from "@/i18n";
import type {
  InstituteComparison,
  PartyAverage,
  SeatDistribution,
} from "@/lib/dawum/aggregate";
import {
  smoothTrendData,
  TREND_WINDOW_DAYS,
  type TrendWindowKey,
  type TrendWindows,
} from "@/lib/dawum/trend";
import {
  CurrentStandingChart,
  InstituteComparisonChart,
  SeatDistributionChart,
} from "./poll-charts";
import { TrendChart } from "./trend-chart";

export interface PollDashboardProps {
  average: PartyAverage[];
  trends: TrendWindows;
  seats: SeatDistribution;
  comparison: InstituteComparison;
}

const WINDOW_LABELS: Record<TrendWindowKey, TranslationKey> = {
  "90": "dashboard.window90",
  "365": "dashboard.window1y",
  all: "dashboard.windowAll",
};

export function PollDashboard({
  average,
  trends,
  seats,
  comparison,
}: PollDashboardProps) {
  const [smoothed, setSmoothed] = useState(true);
  const [windowKey, setWindowKey] = useState<TrendWindowKey>("90");
  const trendData = useMemo(() => {
    const base = trends[windowKey];
    return smoothed ? smoothTrendData(base, 5) : base;
  }, [smoothed, trends, windowKey]);

  return (
    <div className="space-y-10">
      <Section
        title={t("dashboard.currentTitle")}
        hint={t("dashboard.currentHint")}
      >
        <CurrentStandingChart data={average} />
      </Section>

      <Section
        title={t("dashboard.trendTitle")}
        action={
          <div className="flex items-center gap-3">
            <div
              data-testid="trend-window"
              className="flex items-center gap-0.5 rounded-md border border-zinc-200 p-0.5 dark:border-zinc-800"
            >
              {(Object.keys(TREND_WINDOW_DAYS) as TrendWindowKey[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setWindowKey(key)}
                  aria-pressed={windowKey === key}
                  className={`rounded px-2 py-0.5 text-xs font-medium normal-case tracking-normal transition-colors ${
                    windowKey === key
                      ? "bg-zinc-200 text-zinc-900 dark:bg-zinc-700 dark:text-zinc-100"
                      : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                  }`}
                >
                  {t(WINDOW_LABELS[key])}
                </button>
              ))}
            </div>
            <label className="flex items-center gap-2 text-xs font-normal normal-case tracking-normal text-zinc-600 dark:text-zinc-400">
              <input
                type="checkbox"
                data-testid="smooth-toggle"
                checked={smoothed}
                onChange={(e) => setSmoothed(e.target.checked)}
                className="h-3.5 w-3.5 accent-zinc-700 dark:accent-zinc-300"
              />
              {t("dashboard.smooth")}
            </label>
          </div>
        }
      >
        <TrendChart data={trendData} showDots={!smoothed} />
      </Section>

      <Section
        title={t("dashboard.seatsTitle")}
        hint={t("dashboard.seatsHint")}
      >
        <SeatDistributionChart data={seats} />
      </Section>

      <Section
        title={t("dashboard.comparisonTitle")}
        hint={t("dashboard.comparisonHint")}
      >
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
