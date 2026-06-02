"use client";

import { useMemo, useState } from "react";
import { t, type TranslationKey } from "@/i18n";
import { partyColorVar } from "@/lib/dawum/colors";
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
import { Fullscreenable } from "./fullscreenable";
import {
  CurrentStandingChart,
  InstituteComparisonChart,
  SeatDistributionChart,
} from "./poll-charts";
import { TrendChart } from "./trend-chart";

/** Lines beyond this many crowd the legend; also the filterable party set. */
const MAX_TREND_SERIES = 8;

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
  const [hiddenParties, setHiddenParties] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const trendData = useMemo(() => {
    const base = trends[windowKey];
    return smoothed ? smoothTrendData(base, 5) : base;
  }, [smoothed, trends, windowKey]);

  // Parties offered in the filter = the lines the chart would draw for the
  // selected window, in the same order.
  const filterableParties = useMemo(
    () => trendData.series.slice(0, MAX_TREND_SERIES),
    [trendData],
  );

  function toggleParty(shortcut: string) {
    setHiddenParties((prev) => {
      const next = new Set(prev);
      if (next.has(shortcut)) next.delete(shortcut);
      else next.add(shortcut);
      return next;
    });
  }

  return (
    <div className="space-y-10">
      <Section
        title={t("dashboard.currentTitle")}
        hint={t("dashboard.currentHint")}
      >
        <Fullscreenable>
          <CurrentStandingChart data={average} />
        </Fullscreenable>
      </Section>

      <Section
        title={t("dashboard.trendTitle")}
        hint={t("dashboard.trendHint")}
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
        {filterableParties.length > 0 ? (
          <div
            data-testid="trend-party-filter"
            className="mb-3 flex flex-wrap items-center gap-1.5"
          >
            <span className="mr-1 text-xs font-medium normal-case tracking-normal text-zinc-500">
              {t("dashboard.partiesLabel")}
            </span>
            {filterableParties.map((s) => {
              const active = !hiddenParties.has(s.shortcut);
              return (
                <button
                  key={s.shortcut}
                  type="button"
                  onClick={() => toggleParty(s.shortcut)}
                  aria-pressed={active}
                  className={`flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium transition-colors ${
                    active
                      ? "border-zinc-300 text-zinc-900 dark:border-zinc-600 dark:text-zinc-100"
                      : "border-zinc-200 text-zinc-400 line-through dark:border-zinc-800 dark:text-zinc-600"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className="inline-block h-2 w-2 rounded-full"
                    style={{
                      backgroundColor: partyColorVar(s.shortcut),
                      opacity: active ? 1 : 0.4,
                    }}
                  />
                  {s.shortcut}
                </button>
              );
            })}
            {hiddenParties.size > 0 ? (
              <button
                type="button"
                onClick={() => setHiddenParties(new Set())}
                className="ml-1 rounded-full px-2 py-0.5 text-xs font-medium text-zinc-500 underline hover:text-zinc-900 dark:hover:text-zinc-100"
              >
                {t("dashboard.partiesAll")}
              </button>
            ) : null}
          </div>
        ) : null}
        <Fullscreenable>
          <TrendChart
            data={trendData}
            showDots={!smoothed}
            hiddenParties={hiddenParties}
          />
        </Fullscreenable>
      </Section>

      <Section
        title={t("dashboard.seatsTitle")}
        hint={t("dashboard.seatsHint")}
      >
        <Fullscreenable>
          <SeatDistributionChart data={seats} />
        </Fullscreenable>
      </Section>

      <Section
        title={t("dashboard.comparisonTitle")}
        hint={t("dashboard.comparisonHint")}
      >
        <Fullscreenable>
          <InstituteComparisonChart data={comparison} />
        </Fullscreenable>
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
