"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { MouseHandlerDataParam } from "recharts/types/synchronisation/types";
import type { TooltipContentProps } from "recharts/types/component/Tooltip";
import { t } from "@/i18n";
import { partyColor } from "@/lib/dawum/colors";
import type { TrendData, TrendPoint } from "@/lib/dawum/trend";
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

export interface TrendChartProps {
  data: TrendData;
  /** Cap on charted series to keep the legend readable. */
  maxSeries?: number;
  /** Render markers at each survey point (off looks cleaner when smoothed). */
  showDots?: boolean;
  /** Party shortcuts to hide; lets the dashboard filter the charted lines. */
  hiddenParties?: ReadonlySet<string>;
}

export function TrendChart({
  data,
  maxSeries = 8,
  showDots = true,
  hiddenParties,
}: TrendChartProps) {
  const scheme = useColorScheme();
  const router = useRouter();

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
        className="text-sm text-zinc-600 dark:text-zinc-400"
      >
        {t("charts.trendEmpty")}
      </p>
    );
  }

  const series = data.series
    .slice(0, maxSeries)
    .filter((s) => !hiddenParties?.has(s.shortcut));

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
      className="h-80 w-full cursor-pointer rounded-lg border border-zinc-200 bg-white p-2 dark:border-zinc-800 dark:bg-zinc-900 sm:h-[26rem]"
    >
      <ResponsiveContainer
        width="100%"
        height="100%"
        initialDimension={{ width: 600, height: 360 }}
      >
        <LineChart
          data={data.points}
          margin={{ top: 8, right: 20, bottom: 8, left: 0 }}
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
          <Legend
            verticalAlign="bottom"
            height={36}
            iconType="plainline"
            iconSize={16}
            wrapperStyle={{ fontSize: 12, paddingTop: 4 }}
          />
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
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function TrendTooltip({ active, payload, label }: TooltipContentProps) {
  if (!active || !payload || payload.length === 0) return null;

  const point = payload[0]?.payload as TrendPoint | undefined;
  const ts = typeof label === "number" ? label : point?.date;

  const rows = payload
    .filter(
      (p): p is typeof p & { value: number } => typeof p.value === "number",
    )
    .sort((a, b) => b.value - a.value);

  return (
    <div className="rounded-md border border-zinc-200 bg-white/95 p-2 text-xs shadow-md dark:border-zinc-700 dark:bg-zinc-900/95">
      <p className="font-semibold">
        {typeof ts === "number" ? TOOLTIP_FORMAT.format(new Date(ts)) : ""}
      </p>
      {point?.instituteName ? (
        <p className="text-zinc-600 dark:text-zinc-400">{point.instituteName}</p>
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
