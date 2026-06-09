import { loadBundestagData } from "@/lib/data";
import { NON_PARTISAN, surveysWithinDays, weightedAverage } from "@/lib/dawum";
import { partyColor } from "@/lib/dawum/colors";
import { formatDate } from "@/lib/format";
import { absoluteUrl } from "@/lib/seo";

/**
 * Embeddable widget: a self-contained HTML document (no app chrome, inline
 * styles) showing the current weighted poll-of-polls standings, meant to be
 * iframed by third-party sites with attribution back to wahlumfragen. Served as
 * a route (not a page) so it bypasses the root layout's header/footer and can be
 * framed — the deny-framing headers are lifted for /embed in next.config.ts.
 *
 * Embed with:
 *   <iframe src="https://wahlumfragen.de/embed" width="100%" height="420"
 *           style="border:0" title="Sonntagsfrage Bundestag"></iframe>
 */

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function GET() {
  const { bundestag, lastUpdate } = await loadBundestagData();
  const parties = weightedAverage(surveysWithinDays(bundestag, 30)).filter(
    (p) => !NON_PARTISAN.has(p.shortcut),
  );
  const max = Math.max(5, Math.ceil(parties.reduce((m, p) => Math.max(m, p.percent), 0) / 5) * 5);
  const stand = lastUpdate ? formatDate(lastUpdate) : "—";
  const home = absoluteUrl("/");

  const bars = parties
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

  const html = `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Sonntagsfrage Bundestag – Poll of Polls</title>
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
  footer { margin-top: 12px; font-size: 11px; opacity: .65; }
  a { color: inherit; }
</style>
</head>
<body>
  <h1>Sonntagsfrage Bundestag</h1>
  <p class="sub">Gewichteter Schnitt (Poll of Polls) · Stand ${escapeHtml(stand)}</p>
  <ul>${bars || "<li class='sub'>Keine aktuellen Umfragen.</li>"}</ul>
  <footer>Quelle: <a href="${escapeHtml(home)}" target="_blank" rel="noopener">wahlumfragen.de</a> · Daten: dawum.de (ODbL)</footer>
</body>
</html>`;

  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, max-age=600, s-maxage=600, stale-while-revalidate=300",
    },
  });
}
