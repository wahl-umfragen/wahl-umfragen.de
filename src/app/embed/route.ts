import type { NextRequest } from "next/server";
import { loadBundestagData } from "@/lib/data";
import {
  buildBundestagTrend,
  NON_PARTISAN,
  smoothTrendData,
  surveysWithinDays,
  weightedAverage,
} from "@/lib/dawum";
import { partyColor } from "@/lib/dawum/colors";
import { escapeHtml } from "@/lib/escape";
import { formatDate } from "@/lib/format";
import { absoluteUrl } from "@/lib/seo";

/**
 * Embeddable widget: a self-contained HTML document (no app chrome, inline
 * styles) meant to be iframed by third-party sites with attribution back to
 * wahlumfragen. Served as a route (not a page) so it bypasses the root layout's
 * header/footer and can be framed — the deny-framing headers are lifted for
 * /embed in next.config.ts.
 *
 *   /embed            → current weighted poll-of-polls standings (bars)
 *   /embed?type=trend → smoothed 12-month trend of the strongest parties (SVG)
 *
 * Embed with:
 *   <iframe src="https://wahlumfragen.de/embed" width="100%" height="420"
 *           style="border:0" title="Sonntagsfrage Bundestag"></iframe>
 */

/** How many series the trend embed draws (strongest first) to stay legible. */
const TREND_SERIES = 5;

function shell(title: string, subtitle: string, body: string): string {
  const home = absoluteUrl("/");
  return `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(title)}</title>
<style>
  :root { color-scheme: light dark; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; color: #1f1f1f; background: #fff; padding: 16px; }
  @media (prefers-color-scheme: dark) { body { color: #e5e5e5; background: #111; } .track { background: #333 !important; } }
  h1 { font-size: 15px; margin: 0 0 2px; }
  .sub { font-size: 11px; opacity: .65; margin: 0 0 12px; }
  ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; }
  .row { display: flex; align-items: center; gap: 10px; }
  .label { width: 64px; flex: none; font-size: 13px; font-weight: 600; }
  .track { flex: 1; height: 18px; background: #eee; border-radius: 4px; overflow: hidden; }
  .bar { display: block; height: 100%; border-radius: 4px; }
  .val { width: 44px; flex: none; text-align: right; font-variant-numeric: tabular-nums; font-size: 13px; }
  .legend { display: flex; flex-wrap: wrap; gap: 10px; font-size: 12px; margin-top: 8px; }
  .legend span { display: inline-flex; align-items: center; gap: 5px; }
  .dot { width: 10px; height: 10px; border-radius: 999px; display: inline-block; }
  svg { width: 100%; height: auto; }
  footer { margin-top: 12px; font-size: 11px; opacity: .65; }
  a { color: inherit; }
</style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <p class="sub">${escapeHtml(subtitle)}</p>
  ${body}
  <footer>Quelle: <a href="${escapeHtml(home)}" target="_blank" rel="noopener">wahlumfragen.de</a> · Daten: dawum.de (ODbL)</footer>
</body>
</html>`;
}

function barsBody(parties: { shortcut: string; percent: number }[]): string {
  const max = Math.max(
    5,
    Math.ceil(parties.reduce((m, p) => Math.max(m, p.percent), 0) / 5) * 5,
  );
  const rows = parties
    .map((p) => {
      const width = Math.min(100, (p.percent / max) * 100);
      const color = partyColor(p.shortcut, { scheme: "light" });
      return `
      <li class="row">
        <span class="label">${escapeHtml(p.shortcut)}</span>
        <span class="track"><span class="bar" style="width:${width.toFixed(1)}%;background:${color}"></span></span>
        <span class="val">${p.percent.toFixed(1).replace(".", ",")}</span>
      </li>`;
    })
    .join("");
  return `<ul>${rows || "<li class='sub'>Keine aktuellen Umfragen.</li>"}</ul>`;
}

function trendBody(
  bundestag: Awaited<ReturnType<typeof loadBundestagData>>["bundestag"],
): string {
  const trend = smoothTrendData(
    buildBundestagTrend(bundestag, { windowDays: 365 }),
    11,
  );
  const series = trend.series
    .filter((s) => !NON_PARTISAN.has(s.shortcut))
    .slice(0, TREND_SERIES);
  if (trend.points.length < 2 || series.length === 0) {
    return "<p class='sub'>Keine aktuellen Umfragen.</p>";
  }

  const w = 600;
  const h = 240;
  const pad = 16;
  const xs = trend.points.map((p) => p.date as number);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const rangeX = Math.max(1, maxX - minX);
  let maxY = 0;
  for (const p of trend.points) {
    for (const s of series) {
      const v = p[s.shortcut];
      if (typeof v === "number" && v > maxY) maxY = v;
    }
  }
  const yMax = Math.max(5, Math.ceil(maxY / 5) * 5);

  const lines = series
    .map((s) => {
      const color = partyColor(s.shortcut, { scheme: "light" });
      const pts = trend.points
        .filter((p) => typeof p[s.shortcut] === "number")
        .map((p) => {
          const x =
            pad + (((p.date as number) - minX) / rangeX) * (w - 2 * pad);
          const y =
            pad + (1 - (p[s.shortcut] as number) / yMax) * (h - 2 * pad);
          return `${x.toFixed(1)},${y.toFixed(1)}`;
        })
        .join(" ");
      return `<polyline points="${pts}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke" />`;
    })
    .join("");

  const legend = series
    .map(
      (s) =>
        `<span><i class="dot" style="background:${partyColor(s.shortcut, { scheme: "light" })}"></i>${escapeHtml(s.shortcut)}</span>`,
    )
    .join("");

  return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" role="img" aria-label="Wahltrend Bundestag">${lines}</svg><div class="legend">${legend}</div>`;
}

export async function GET(req: NextRequest) {
  const { bundestag, lastUpdate } = await loadBundestagData();
  const stand = lastUpdate ? formatDate(lastUpdate) : "—";
  const type = req.nextUrl.searchParams.get("type");

  const { title, subtitle, body } =
    type === "trend"
      ? {
          title: "Wahltrend Bundestag",
          subtitle: `Geglätteter Verlauf (12 Monate) · Stand ${stand}`,
          body: trendBody(bundestag),
        }
      : {
          title: "Sonntagsfrage Bundestag",
          subtitle: `Gewichteter Schnitt (Poll of Polls) · Stand ${stand}`,
          body: barsBody(
            weightedAverage(surveysWithinDays(bundestag, 30)).filter(
              (p) => !NON_PARTISAN.has(p.shortcut),
            ),
          ),
        };

  return new Response(shell(title, subtitle, body), {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control":
        "public, max-age=600, s-maxage=600, stale-while-revalidate=300",
    },
  });
}
