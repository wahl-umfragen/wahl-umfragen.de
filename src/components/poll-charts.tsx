"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  LabelList,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { t } from "@/i18n";
import { partyColor } from "@/lib/dawum/colors";
import type {
  InstituteComparison,
  PartyAverage,
  SeatDistribution,
} from "@/lib/dawum/aggregate";
import { useColorScheme } from "./use-color-scheme";

const CARD =
  "w-full rounded-lg border border-zinc-200 bg-white p-2 dark:border-zinc-800 dark:bg-zinc-900";

const fmt1 = (v: number) => v.toFixed(1);

/** Horizontal bar chart of the current averaged poll. */
export function CurrentStandingChart({ data }: { data: PartyAverage[] }) {
  const scheme = useColorScheme();
  if (data.length === 0) {
    return <Empty />;
  }

  return (
    <div
      data-testid="standing-chart"
      className={CARD}
      style={{ height: Math.max(200, data.length * 36 + 24) }}
    >
      <ResponsiveContainer
        width="100%"
        height="100%"
        initialDimension={{ width: 600, height: 280 }}
      >
        <BarChart
          layout="vertical"
          data={data}
          margin={{ top: 4, right: 44, bottom: 4, left: 8 }}
        >
          <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.4} horizontal={false} />
          <XAxis
            type="number"
            domain={[0, "dataMax"]}
            tickFormatter={(v: number) => `${v}%`}
            stroke="currentColor"
            tick={{ fontSize: 12 }}
          />
          <YAxis
            type="category"
            dataKey="shortcut"
            stroke="currentColor"
            tick={{ fontSize: 12 }}
            width={72}
          />
          <Tooltip
            cursor={{ fillOpacity: 0.06 }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const p = payload[0].payload as PartyAverage;
              return (
                <ChartTooltip
                  title={p.name}
                  rows={[
                    { label: t("charts.average"), value: `${fmt1(p.percent)}%` },
                    { label: t("charts.institutes"), value: String(p.institutes) },
                  ]}
                />
              );
            }}
          />
          <Bar dataKey="percent" radius={[0, 4, 4, 0]} isAnimationActive={false}>
            {data.map((p) => (
              <Cell key={p.shortcut} fill={partyColor(p.shortcut, { scheme })} />
            ))}
            <LabelList
              dataKey="percent"
              position="right"
              formatter={(v) => (typeof v === "number" ? `${fmt1(v)}%` : "")}
              style={{ fontSize: 12, fill: "currentColor" }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Half-donut seat projection with a majority annotation. */
export function SeatDistributionChart({ data }: { data: SeatDistribution }) {
  const scheme = useColorScheme();
  if (data.entries.length === 0) {
    return <Empty />;
  }

  return (
    <div data-testid="seat-chart" className={CARD}>
      <div className="h-64 w-full">
        <ResponsiveContainer
          width="100%"
          height="100%"
          initialDimension={{ width: 600, height: 256 }}
        >
          <PieChart>
            <Pie
              data={data.entries}
              dataKey="seats"
              nameKey="shortcut"
              cx="50%"
              cy="92%"
              startAngle={180}
              endAngle={0}
              innerRadius="55%"
              outerRadius="95%"
              paddingAngle={1}
              isAnimationActive={false}
            >
              {data.entries.map((e) => (
                <Cell key={e.shortcut} fill={partyColor(e.shortcut, { scheme })} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const e = payload[0].payload as SeatDistribution["entries"][number];
                return (
                  <ChartTooltip
                    title={e.name}
                    rows={[
                      { label: t("charts.seats"), value: String(e.seats) },
                      { label: t("charts.average"), value: `${fmt1(e.percent)}%` },
                    ]}
                  />
                );
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <p className="-mt-4 text-center text-xs text-zinc-500 dark:text-zinc-400">
        {t("charts.seatsSummary", {
          total: data.totalSeats,
          majority: data.majority,
        })}
      </p>
      <ul className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm">
        {data.entries.map((e) => (
          <li key={e.shortcut} className="flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: partyColor(e.shortcut, { scheme }) }}
            />
            <span className="font-medium">{e.shortcut}</span>
            <span className="font-mono tabular-nums text-zinc-500 dark:text-zinc-400">
              {e.seats}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Grouped bars: the same parties side by side across institutes. */
export function InstituteComparisonChart({
  data,
}: {
  data: InstituteComparison;
}) {
  const scheme = useColorScheme();
  if (data.rows.length === 0 || data.parties.length === 0) {
    return <Empty />;
  }

  return (
    <div data-testid="comparison-chart" className={`${CARD} h-96`}>
      <ResponsiveContainer
        width="100%"
        height="100%"
        initialDimension={{ width: 600, height: 384 }}
      >
        <BarChart data={data.rows} margin={{ top: 8, right: 16, bottom: 48, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.4} vertical={false} />
          <XAxis
            dataKey="institute"
            stroke="currentColor"
            tick={{ fontSize: 11 }}
            interval={0}
            angle={-30}
            textAnchor="end"
            height={48}
          />
          <YAxis
            tickFormatter={(v: number) => `${v}%`}
            stroke="currentColor"
            tick={{ fontSize: 12 }}
            width={40}
          />
          <Tooltip
            cursor={{ fillOpacity: 0.06 }}
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              return (
                <ChartTooltip
                  title={String(label)}
                  rows={payload
                    .filter((p) => typeof p.value === "number")
                    .sort((a, b) => (b.value as number) - (a.value as number))
                    .map((p) => ({
                      label: String(p.name),
                      value: `${fmt1(p.value as number)}%`,
                      color: p.color,
                    }))}
                />
              );
            }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {data.parties.map((shortcut) => (
            <Bar
              key={shortcut}
              dataKey={shortcut}
              name={shortcut}
              fill={partyColor(shortcut, { scheme })}
              radius={[2, 2, 0, 0]}
              isAnimationActive={false}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function ChartTooltip({
  title,
  rows,
}: {
  title: string;
  rows: Array<{ label: string; value: string; color?: string }>;
}) {
  return (
    <div className="rounded-md border border-zinc-200 bg-white/95 p-2 text-xs shadow-md dark:border-zinc-700 dark:bg-zinc-900/95">
      <p className="font-semibold">{title}</p>
      <ul className="mt-1 space-y-0.5">
        {rows.map((r) => (
          <li key={r.label} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5">
              {r.color ? (
                <span
                  aria-hidden="true"
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: r.color }}
                />
              ) : null}
              {r.label}
            </span>
            <span className="font-mono tabular-nums">{r.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Empty() {
  return (
    <p className="text-sm text-zinc-600 dark:text-zinc-400">
      {t("common.noData")}
    </p>
  );
}
