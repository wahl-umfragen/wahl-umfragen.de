import { partyColorVar } from "@/lib/dawum/colors";
import type { PartyDataPoint } from "@/lib/dawum/aggregate";

/**
 * Server-rendered SVG sparkline of a party's reported share over time. No client
 * JS and the line lives in the static HTML, so it's cheap and crawlable. Uses
 * the theme-aware party CSS variable for the stroke. Y axis is auto-scaled to
 * the value range (with a little padding) so movement is visible.
 */
export function PartySparkline({
  points,
  shortcut,
  label,
}: {
  points: PartyDataPoint[];
  shortcut: string;
  label: string;
}) {
  if (points.length < 2) return null;

  const w = 600;
  const h = 140;
  const pad = 10;
  const ys = points.map((p) => p.percent);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const range = Math.max(1, maxY - minY);

  const coords = points
    .map((p, i) => {
      const x = pad + (i / (points.length - 1)) * (w - 2 * pad);
      const y = pad + (1 - (p.percent - minY) / range) * (h - 2 * pad);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  const last = points[points.length - 1];
  const lastX = w - pad;
  const lastY = pad + (1 - (last.percent - minY) / range) * (h - 2 * pad);

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="h-32 w-full"
      role="img"
      aria-label={label}
      preserveAspectRatio="none"
    >
      <polyline
        points={coords}
        fill="none"
        stroke={partyColorVar(shortcut)}
        strokeWidth={2.5}
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      <circle cx={lastX} cy={lastY} r={4} fill={partyColorVar(shortcut)} />
    </svg>
  );
}
