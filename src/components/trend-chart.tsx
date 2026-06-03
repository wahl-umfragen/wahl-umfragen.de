"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  usePlotArea,
  useXAxisScale,
  useYAxisScale,
  XAxis,
  YAxis,
} from "recharts";
import type { MouseHandlerDataParam } from "recharts/types/synchronisation/types";
import type { TooltipContentProps } from "recharts/types/component/Tooltip";
import { t } from "@/i18n";
import { partyColor } from "@/lib/dawum/colors";
import type { TrendData, TrendPoint, TrendSeries } from "@/lib/dawum/trend";
import { electionMarkers } from "@/lib/elections/markers";
import { BUNDESTAG_ELECTIONS, type ElectionResult } from "@/lib/elections/results";
import { useColorScheme } from "./use-color-scheme";

const X_FORMAT = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "short",
});

const TOOLTIP_FORMAT = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

/** Sentinel name for the wider background "halo" line drawn under each colored
 * line; lets the tooltip skip these duplicate entries. */
const HALO_NAME = "__halo";

/** Right margin reserved for the end-of-line party labels. */
const LABEL_MARGIN = 60;

export interface TrendChartProps {
  data: TrendData;
  /** Cap on charted series to keep the legend readable. */
  maxSeries?: number;
  /** Render markers at each survey point (off looks cleaner when smoothed). */
  showDots?: boolean;
  /** Party shortcuts to hide; lets the dashboard filter the charted lines. */
  hiddenParties?: ReadonlySet<string>;
  /** Click a legend entry to isolate one party (and again to restore all). */
  onSoloParty?: (shortcut: string) => void;
  /** Official election results, drawn as comparison markers. */
  elections?: ElectionResult[];
  /** Toggle the official-result markers (and their caption). */
  showElectionMarkers?: boolean;
  /** The plotted line is a moving average — show the methodology caption.
   * Set by callers that pass smoothed data (the chart itself doesn't smooth). */
  smoothed?: boolean;
}

export function TrendChart({
  data,
  maxSeries = 8,
  showDots = true,
  hiddenParties,
  onSoloParty,
  elections = BUNDESTAG_ELECTIONS,
  showElectionMarkers = true,
  smoothed = false,
}: TrendChartProps) {
  const scheme = useColorScheme();
  const router = useRouter();

  const haloColor = scheme === "dark" ? "#18181b" : "#ffffff";

  // Explicit, evenly spaced ticks. Several institutes often publish on the same
  // day, so letting recharts derive ticks from the data yields duplicate
  // timestamps — and duplicate React keys. Distinct values keep keys unique.
  const ticks = useMemo(() => {
    const pts = data.points;
    if (pts.length === 0) return [];
    const first = pts[0].date;
    const last = pts[pts.length - 1].date;
    if (first === last) return [first];
    const count = 6;
    return Array.from({ length: count }, (_, i) =>
      Math.round(first + ((last - first) * i) / (count - 1)),
    );
  }, [data.points]);

  if (data.points.length === 0) {
    return (
      <p
        data-testid="trend-empty"
        className="text-sm text-muted"
      >
        {t("charts.trendEmpty")}
      </p>
    );
  }

  const series = data.series
    .slice(0, maxSeries)
    .filter((s) => !hiddenParties?.has(s.shortcut));

  // Official-result markers. recharts discards references outside the visible
  // x-domain, but we mirror that filter here so the caption only shows when a
  // marker is actually on screen. The chart's x-domain is the first..last point
  // date (XAxis domain ["dataMin","dataMax"]).
  const firstDate = data.points[0].date as number;
  const lastDate = data.points[data.points.length - 1].date as number;
  const inRange = (ts: number) => ts >= firstDate && ts <= lastDate;
  const visibleElections = showElectionMarkers
    ? elections.filter((e) => inRange(new Date(e.date).getTime()))
    : [];
  const visibleMarkers = electionMarkers(visibleElections, series);

  // Clicking a point (or anywhere near one) opens that survey in the archive.
  // recharts hands us the active datum's index into the chart's data array
  // (a string at runtime despite the numeric typing, so coerce it).
  function handleClick(state: MouseHandlerDataParam) {
    const raw = state?.activeIndex;
    if (raw === null || raw === undefined || raw === "") return;
    const index = Number(raw);
    if (!Number.isInteger(index)) return;
    const point = data.points[index];
    if (point?.surveyId) router.push(`/archiv/${point.surveyId}`);
  }

  return (
    <div
      data-testid="trend-chart"
      className="flex h-96 w-full flex-col rounded-xl border border-border bg-surface p-2 sm:h-[32rem]"
    >
      <div className="min-h-0 flex-1 cursor-pointer">
        <ResponsiveContainer
          width="100%"
          height="100%"
          initialDimension={{ width: 600, height: 360 }}
        >
          <LineChart
            data={data.points}
            margin={{ top: 8, right: LABEL_MARGIN, bottom: 8, left: 0 }}
            onClick={handleClick}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              strokeOpacity={0.4}
              vertical={false}
            />
            <XAxis
              type="number"
              dataKey="date"
              scale="time"
              domain={["dataMin", "dataMax"]}
              tickFormatter={(v: number) => X_FORMAT.format(new Date(v))}
              stroke="currentColor"
              tick={{ fontSize: 12 }}
              ticks={ticks}
              tickMargin={10}
              height={28}
            />
            <YAxis
              tickFormatter={(v: number) => `${v}%`}
              stroke="currentColor"
              tick={{ fontSize: 12 }}
              width={40}
            />
            <Tooltip content={(props) => <TrendTooltip {...props} />} />
            {series.map((s) => (
              <Line
                key={`halo-${s.shortcut}`}
                type="monotone"
                dataKey={s.shortcut}
                name={HALO_NAME}
                legendType="none"
                stroke={haloColor}
                strokeWidth={5}
                dot={false}
                activeDot={false}
                connectNulls
                isAnimationActive={false}
              />
            ))}
            {series.map((s) => (
              <Line
                key={s.shortcut}
                type="monotone"
                dataKey={s.shortcut}
                name={s.shortcut}
                stroke={partyColor(s.shortcut, { scheme })}
                strokeWidth={2}
                dot={showDots ? { r: 2 } : false}
                activeDot={{ r: 4 }}
                connectNulls
                isAnimationActive={false}
              />
            ))}
            {visibleElections.map((e) => (
              <ReferenceLine
                key={`election-${e.date}`}
                x={new Date(e.date).getTime()}
                ifOverflow="discard"
                stroke="currentColor"
                strokeOpacity={0.35}
                strokeDasharray="4 4"
                label={{
                  value: e.date.slice(0, 4),
                  position: "insideTopLeft",
                  fontSize: 11,
                  fontWeight: 600,
                  fill: "currentColor",
                  opacity: 0.7,
                }}
              />
            ))}
            {visibleMarkers.map((m) => (
              <ReferenceDot
                key={`marker-${m.label}-${m.shortcut}`}
                x={m.date}
                y={m.percent}
                r={4}
                ifOverflow="discard"
                fill={haloColor}
                stroke={partyColor(m.shortcut, { scheme })}
                strokeWidth={2}
              />
            ))}
            <TrendEndLabels
              points={data.points}
              series={series}
              scheme={scheme}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <TrendLegend series={series} scheme={scheme} onSolo={onSoloParty} />
      {smoothed ? (
        <p
          data-testid="trend-smoothing-note"
          className="mt-1 text-center text-[11px] text-muted"
        >
          {t("charts.smoothingNote")}
        </p>
      ) : null}
      {visibleElections.length > 0 ? (
        <p
          data-testid="trend-election-caption"
          className="mt-1 text-center text-[11px] text-muted"
        >
          {t("charts.electionMarker")} · {t("charts.electionSourcePrefix")}
          <a
            href={visibleElections[0].source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            {visibleElections[0].source.name}
          </a>{" "}
          ·{" "}
          <Link href="/wahlen" className="underline">
            {t("charts.electionDetails")}
          </Link>
        </p>
      ) : null}
    </div>
  );
}

/**
 * Direct labels at the right end of each line, so a party can be identified
 * without matching it against the legend. Uses recharts' scale hooks (3.8+) to
 * place each label at its line's last reported value, then nudges overlapping
 * labels apart by a minimum vertical gap so the bunched small parties stay
 * readable.
 */
function TrendEndLabels({
  points,
  series,
  scheme,
}: {
  points: TrendPoint[];
  series: TrendSeries[];
  scheme: "light" | "dark";
}) {
  const xScale = useXAxisScale();
  const yScale = useYAxisScale();
  const plot = usePlotArea();
  if (!xScale || !yScale || !plot) return null;

  type Lab = { shortcut: string; color: string; y: number };
  const labels: Lab[] = [];
  for (const s of series) {
    let value: number | undefined;
    let date: number | undefined;
    for (let i = points.length - 1; i >= 0; i--) {
      const v = points[i][s.shortcut];
      if (typeof v === "number") {
        value = v;
        date = points[i].date as number;
        break;
      }
    }
    if (value === undefined || date === undefined) continue;
    const py = yScale(value);
    if (py === undefined) continue;
    labels.push({
      shortcut: s.shortcut,
      color: partyColor(s.shortcut, { scheme }),
      y: py,
    });
  }

  // Collision avoidance: sort top-to-bottom, push each label below the previous
  // one by at least `minGap`, then pull the stack back up if it overran.
  labels.sort((a, b) => a.y - b.y);
  const minGap = 13;
  const top = plot.y + 6;
  const bottom = plot.y + plot.height - 2;
  for (let i = 0; i < labels.length; i++) {
    labels[i].y =
      i === 0
        ? Math.max(labels[i].y, top)
        : Math.max(labels[i].y, labels[i - 1].y + minGap);
  }
  const overrun = labels.length ? labels[labels.length - 1].y - bottom : 0;
  if (overrun > 0) {
    for (let i = labels.length - 1; i >= 0; i--) {
      const limit = bottom - (labels.length - 1 - i) * minGap;
      labels[i].y = Math.min(labels[i].y, limit);
    }
  }

  const labelX = plot.x + plot.width + 6;
  return (
    <g>
      {labels.map((l) => (
        <text
          key={l.shortcut}
          x={labelX}
          y={l.y}
          dy={3}
          textAnchor="start"
          fontSize={11}
          fontWeight={600}
          fill={l.color}
        >
          {l.shortcut}
        </text>
      ))}
    </g>
  );
}

/**
 * Interactive legend rendered below the chart. Clicking an entry isolates that
 * party via `onSolo` (click again to restore all).
 */
function TrendLegend({
  series,
  scheme,
  onSolo,
}: {
  series: TrendSeries[];
  scheme: "light" | "dark";
  onSolo?: (shortcut: string) => void;
}) {
  if (series.length === 0) return null;
  return (
    <div className="mt-1 flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
      {series.map((s) => {
        const color = partyColor(s.shortcut, { scheme });
        return (
          <button
            key={s.shortcut}
            type="button"
            onClick={() => onSolo?.(s.shortcut)}
            title={t("charts.legendSolo")}
            className="flex items-center gap-1.5 text-xs font-medium"
          >
            <span
              aria-hidden="true"
              className="inline-block h-0.5 w-4 rounded"
              style={{ backgroundColor: color }}
            />
            <span style={{ color }}>{s.shortcut}</span>
          </button>
        );
      })}
    </div>
  );
}

function TrendTooltip({ active, payload, label }: TooltipContentProps) {
  if (!active || !payload || payload.length === 0) return null;

  const point = payload[0]?.payload as TrendPoint | undefined;
  const ts = typeof label === "number" ? label : point?.date;

  const rows = payload
    .filter(
      (p): p is typeof p & { value: number } =>
        typeof p.value === "number" && p.name !== HALO_NAME,
    )
    .sort((a, b) => b.value - a.value);

  return (
    <div className="rounded-md border border-border-strong bg-surface/95 p-2 text-xs shadow-lg backdrop-blur">
      <p className="font-semibold">
        {typeof ts === "number" ? TOOLTIP_FORMAT.format(new Date(ts)) : ""}
      </p>
      {point?.instituteName ? (
        <p className="text-muted">{point.instituteName}</p>
      ) : null}
      <ul className="mt-1 space-y-0.5">
        {rows.map((p) => (
          <li
            key={String(p.dataKey)}
            className="flex items-center justify-between gap-3"
          >
            <span className="flex items-center gap-1.5">
              <span
                aria-hidden="true"
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: p.color }}
              />
              {String(p.name)}
            </span>
            <span className="font-mono tabular-nums">
              {p.value.toFixed(1)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
