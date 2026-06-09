import { t } from "@/i18n";
import { NON_PARTISAN, type PartyAverage } from "@/lib/dawum/aggregate";
import { partyColorVar } from "@/lib/dawum/colors";

/** Strongest scale value so bars use the available width without a fixed 100%. */
function scaleMax(parties: PartyAverage[]): number {
  const top = parties.reduce((m, p) => Math.max(m, p.percent), 0);
  // Round up to the next 5 for a stable, readable axis.
  return Math.max(5, Math.ceil(top / 5) * 5);
}

/**
 * "Poll of polls" summary: the recency- and sample-size-weighted average
 * (`weightedAverage`) rendered as labelled horizontal bars. Server component —
 * static, no client JS — using theme-aware party CSS variables for the fills.
 * Non-partisan "Sonstige" buckets are dropped so the bars compare real parties.
 */
export function PollOfPolls({
  average,
  basisCount,
}: {
  average: PartyAverage[];
  /** Number of surveys feeding the estimate (shown as provenance). */
  basisCount: number;
}) {
  const parties = average.filter((p) => !NON_PARTISAN.has(p.shortcut));
  if (parties.length === 0) return null;
  const max = scaleMax(parties);

  return (
    <section data-testid="poll-of-polls" className="mb-10">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h3 className="eyebrow">{t("pollOfPolls.title")}</h3>
        <span className="text-xs text-muted">
          {t("pollOfPolls.basis", { count: basisCount })}
        </span>
      </div>
      <p className="-mt-2 mb-4 text-xs text-muted">{t("pollOfPolls.hint")}</p>
      <ul className="space-y-1.5">
        {parties.map((p) => (
          <li key={p.shortcut} className="flex items-center gap-3">
            <span className="w-16 shrink-0 text-sm font-medium">{p.shortcut}</span>
            <div className="h-5 flex-1 overflow-hidden rounded bg-border/40">
              <div
                className="h-full rounded"
                style={{
                  width: `${Math.min(100, (p.percent / max) * 100)}%`,
                  backgroundColor: partyColorVar(p.shortcut),
                }}
              />
            </div>
            <span className="w-14 shrink-0 text-right font-mono text-sm tabular-nums">
              {p.percent.toFixed(1)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
