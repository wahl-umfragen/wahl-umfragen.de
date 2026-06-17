import { smoothPartySeries } from "@/lib/dawum/aggregate";
import type { PartyDataPoint } from "@/lib/dawum/aggregate";
import { partyColorVar } from "@/lib/dawum/colors";

/** Centered moving-average window, scaled to how many points we have. Capped so
 * dense all-time series don't get flattened into a near-straight line. Odd so
 * the average stays symmetric around each point. */
function smoothingWindow(n: number): number {
  const w = Math.min(15, Math.max(3, Math.round(n / 12)));
  return w % 2 === 0 ? w + 1 : w;
}

/** Build a smooth SVG path through the given points using a Catmull-Rom spline
 * converted to cubic béziers. Gives the line gentle curves instead of angular
 * segments without overshooting far past the data. */
function smoothPath(coords: Array<[number, number]>): string {
  if (coords.length < 2) return "";
  if (coords.length === 2) {
    return `M${coords[0][0]},${coords[0][1]} L${coords[1][0]},${coords[1][1]}`;
  }
  let d = `M${coords[0][0].toFixed(1)},${coords[0][1].toFixed(1)}`;
  for (let i = 0; i < coords.length - 1; i++) {
    const p0 = coords[i - 1] ?? coords[i];
    const p1 = coords[i];
    const p2 = coords[i + 1];
    const p3 = coords[i + 2] ?? p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d;
}

/**
 * Server-rendered SVG sparkline of a party's reported share over time. No client
 * JS and the line lives in the static HTML, so it's cheap and crawlable. The
 * prominent line is a **centered moving average** (mirrors the dashboard trend)
 * drawn as a smooth curve, with the raw per-survey values kept as a faint line
 * underneath for context. Uses the theme-aware party CSS variable for the
 * stroke. Y axis is auto-scaled to the value range (with a little padding) so
 * movement is visible.
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
  // Scale on the raw range — smoothing only ever pulls values inward, so the
  // smoothed curve always stays within these bounds.
  const ys = points.map((p) => p.percent);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const range = Math.max(1, maxY - minY);

  const x = (i: number) => pad + (i / (points.length - 1)) * (w - 2 * pad);
  const y = (percent: number) =>
    pad + (1 - (percent - minY) / range) * (h - 2 * pad);

  const rawCoords = points
    .map((p, i) => `${x(i).toFixed(1)},${y(p.percent).toFixed(1)}`)
    .join(" ");

  const smoothed = smoothPartySeries(points, smoothingWindow(points.length));
  const smoothCoords: Array<[number, number]> = smoothed.map((p, i) => [
    x(i),
    y(p.percent),
  ]);
  const path = smoothPath(smoothCoords);

  const last = smoothed[smoothed.length - 1];
  const lastX = w - pad;
  const lastY = y(last.percent);
  const color = partyColorVar(shortcut);

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="h-32 w-full"
      role="img"
      aria-label={label}
      preserveAspectRatio="none"
    >
      {/* Raw per-survey values, faint, for honesty about the spread. */}
      <polyline
        points={rawCoords}
        fill="none"
        stroke={color}
        strokeWidth={1}
        strokeOpacity={0.2}
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      {/* Smoothed trend line. */}
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={2.5}
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      <circle cx={lastX} cy={lastY} r={4} fill={color} />
    </svg>
  );
}
