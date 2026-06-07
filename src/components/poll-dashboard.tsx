"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo, useState } from "react";
import { t, type TranslationKey } from "@/i18n";
import { partyColorVar } from "@/lib/dawum/colors";
import { formatDate } from "@/lib/format";
import type {
  InstituteComparison,
  PartyAverage,
  SeatDistribution,
} from "@/lib/dawum/aggregate";
import {
  smoothTrendData,
  TREND_SMOOTHING_WINDOW,
  TREND_WINDOW_DAYS,
  type TrendWindowKey,
  type TrendWindows,
} from "@/lib/dawum/trend";
import {
  HOUSE_EFFECT_WINDOWS,
  type HouseEffectWindowKey,
  type HouseEffectWindows,
} from "@/lib/dashboard";
import { Fullscreenable } from "./fullscreenable";
import { HouseEffectsTable } from "./house-effects-table";

const CHART_CARD =
  "w-full animate-pulse rounded-xl border border-border bg-surface";

const CurrentStandingChart = dynamic(
  () => import("./poll-charts").then((m) => m.CurrentStandingChart),
  { ssr: false, loading: () => <div className={`${CHART_CARD} h-72`} /> },
);

const SeatDistributionChart = dynamic(
  () => import("./poll-charts").then((m) => m.SeatDistributionChart),
  { ssr: false, loading: () => <div className={`${CHART_CARD} h-64`} /> },
);

const InstituteComparisonChart = dynamic(
  () => import("./poll-charts").then((m) => m.InstituteComparisonChart),
  { ssr: false, loading: () => <div className={`${CHART_CARD} h-96`} /> },
);

const TrendChart = dynamic(
  () => import("./trend-chart").then((m) => m.TrendChart),
  {
    ssr: false,
    loading: () => <div className={`${CHART_CARD} h-96 sm:h-[36rem]`} />,
  },
);

/** Lines beyond this many crowd the legend; also the filterable party set. */
const MAX_TREND_SERIES = 8;

/** One survey feeding the current-standing average (slim, client-safe shape). */
export interface ContributingSurvey {
  id: string;
  instituteId: string;
  institute: string;
  date: string;
}

export interface PollDashboardProps {
  average: PartyAverage[];
  trends: TrendWindows;
  seats: SeatDistribution;
  comparison: InstituteComparison;
  houseEffects: HouseEffectWindows;
  /** The surveys averaged into "Aktueller Stand", listed for transparency. */
  contributingSurveys: ContributingSurvey[];
  /** Draw the official election markers on the trend (Bundestag only). */
  showElectionMarkers?: boolean;
  /** Parliament ID for institute link targets in the house-effects table. When
   *  omitted or set to the Bundestag ID, links go to /institut/[id] (default).
   *  For state-parliament dashboards, pass the parliament ID so links point to
   *  /institut/[id]?p=<parliamentId> and show the correct survey context. */
  parliamentId?: string;
}

const WINDOW_LABELS: Record<TrendWindowKey, TranslationKey> = {
  "90": "dashboard.window90",
  "365": "dashboard.window1y",
  all: "dashboard.windowAll",
};

const HE_WINDOW_LABELS: Record<HouseEffectWindowKey, TranslationKey> = {
  "30": "dashboard.heWindow1m",
  "90": "dashboard.heWindow3m",
  "180": "dashboard.heWindow6m",
  "365": "dashboard.heWindow12m",
  all: "dashboard.heWindowAll",
};

export function PollDashboard({
  average,
  trends,
  seats,
  comparison,
  houseEffects,
  contributingSurveys,
  showElectionMarkers = true,
  parliamentId,
}: PollDashboardProps) {
  const [windowKey, setWindowKey] = useState<TrendWindowKey>("all");
  const [hiddenParties, setHiddenParties] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const [heWindow, setHeWindow] = useState<HouseEffectWindowKey>("365");
  // The trend is always smoothed (there is no toggle); the window scales with
  // the selected range.
  const trendData = useMemo(
    () => smoothTrendData(trends[windowKey], TREND_SMOOTHING_WINDOW[windowKey]),
    [trends, windowKey],
  );

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

  // Legend click: isolate one party (hide all others); clicking the already
  // isolated party — or one while everything else is hidden — restores all.
  function soloParty(shortcut: string) {
    setHiddenParties((prev) => {
      const others = filterableParties
        .map((s) => s.shortcut)
        .filter((s) => s !== shortcut);
      const alreadySoloed =
        !prev.has(shortcut) && others.every((s) => prev.has(s));
      return alreadySoloed ? new Set() : new Set(others);
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
        {contributingSurveys.length > 0 ? (
          <details data-testid="current-sources" className="mt-3 text-xs">
            <summary className="cursor-pointer select-none font-medium text-muted hover:text-foreground">
              {t("dashboard.currentSourcesSummary", {
                count: contributingSurveys.length,
              })}
            </summary>
            <ul className="mt-2 grid gap-x-6 gap-y-1 text-muted sm:grid-cols-2">
              {contributingSurveys.map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/archiv/${s.id}`}
                    className="hover:text-foreground hover:underline"
                  >
                    <span className="font-medium text-foreground/80">
                      {s.institute}
                    </span>{" "}
                    · {formatDate(s.date)}
                  </Link>
                </li>
              ))}
            </ul>
          </details>
        ) : null}
      </Section>

      <Section
        title={t("dashboard.trendTitle")}
        hint={t("dashboard.trendHint")}
        action={
          <div
            data-testid="trend-window"
            className="flex items-center gap-0.5 rounded-md border border-border p-0.5"
          >
            {(Object.keys(TREND_WINDOW_DAYS) as TrendWindowKey[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setWindowKey(key)}
                aria-pressed={windowKey === key}
                className={`rounded px-2 py-0.5 text-xs font-semibold normal-case tracking-normal transition-colors ${
                  windowKey === key
                    ? "bg-brand text-brand-foreground"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {t(WINDOW_LABELS[key])}
              </button>
            ))}
          </div>
        }
      >
        {filterableParties.length > 0 ? (
          <div
            data-testid="trend-party-filter"
            className="mb-3 flex flex-wrap items-center gap-1.5"
          >
            <span className="mr-1 text-xs font-medium normal-case tracking-normal text-muted">
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
                  className={`flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-semibold transition-colors ${
                    active
                      ? "border-border-strong text-foreground"
                      : "border-border text-muted/60 line-through"
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
                className="ml-1 rounded-full px-2 py-0.5 text-xs font-medium text-muted underline hover:text-foreground"
              >
                {t("dashboard.partiesAll")}
              </button>
            ) : null}
          </div>
        ) : null}
        <Fullscreenable>
          <TrendChart
            data={trendData}
            showDots={false}
            smoothed
            showElectionMarkers={showElectionMarkers}
            hiddenParties={hiddenParties}
            onSoloParty={soloParty}
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

      <Section
        title={t("dashboard.houseEffectsTitle")}
        hint={t("dashboard.houseEffectsHint")}
        action={
          <select
            data-testid="house-effects-window"
            value={heWindow}
            onChange={(e) =>
              setHeWindow(e.target.value as HouseEffectWindowKey)
            }
            aria-label={t("dashboard.houseEffectsPeriod")}
            className="rounded-md border border-border bg-surface px-2 py-1 text-xs font-medium text-foreground"
          >
            {(Object.keys(HOUSE_EFFECT_WINDOWS) as HouseEffectWindowKey[]).map(
              (key) => (
                <option key={key} value={key}>
                  {t(HE_WINDOW_LABELS[key])}
                </option>
              ),
            )}
          </select>
        }
      >
        {houseEffects[heWindow].rows.length > 0 ? (
          <HouseEffectsTable data={houseEffects[heWindow]} parliamentId={parliamentId} />
        ) : (
          <p className="text-sm text-muted">{t("common.noData")}</p>
        )}
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
        <h3 className="eyebrow">{title}</h3>
        {action}
      </div>
      {hint ? (
        <p className="-mt-2 mb-3 text-xs text-muted">{hint}</p>
      ) : null}
      {children}
    </section>
  );
}
