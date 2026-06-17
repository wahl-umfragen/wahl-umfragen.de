import Link from "next/link";
import { t } from "@/i18n";
import {
  NON_PARTISAN,
  type PartyAverage,
  type SurveyWeight,
} from "@/lib/dawum/aggregate";
import { partyColorVar } from "@/lib/dawum/colors";
import { formatDate } from "@/lib/format";
import { partyByShortcut } from "@/lib/parties";

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
  contributors,
}: {
  average: PartyAverage[];
  /** The surveys feeding the estimate with their relative weights (provenance).
   * Its length is the basis count shown in the header. */
  contributors: SurveyWeight[];
}) {
  const parties = average.filter((p) => !NON_PARTISAN.has(p.shortcut));
  if (parties.length === 0) return null;
  const max = scaleMax(parties);

  return (
    <section data-testid="poll-of-polls" className="mb-10">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h3 className="eyebrow">{t("pollOfPolls.title")}</h3>
        <span className="text-xs text-muted">
          {t("pollOfPolls.basis", { count: contributors.length })}
        </span>
      </div>
      <p className="-mt-2 mb-4 text-xs text-muted">{t("pollOfPolls.hint")}</p>
      <ul className="space-y-1.5">
        {parties.map((p) => {
          const info = partyByShortcut(p.shortcut);
          return (
            <li key={p.shortcut} className="flex items-center gap-3">
              <span className="w-16 shrink-0 text-sm font-medium">
                {info ? (
                  <Link
                    href={`/partei/${info.slug}`}
                    className="hover:underline"
                  >
                    {p.shortcut}
                  </Link>
                ) : (
                  p.shortcut
                )}
              </span>
              <div
                aria-hidden="true"
                className="h-5 flex-1 overflow-hidden rounded bg-border/40"
              >
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
          );
        })}
      </ul>

      {contributors.length > 0 ? (
        <details className="group mt-4">
          <summary className="inline-flex cursor-pointer list-none items-center gap-1 text-xs font-medium text-muted hover:text-foreground [&::-webkit-details-marker]:hidden">
            <span
              aria-hidden="true"
              className="transition-transform group-open:rotate-90"
            >
              ›
            </span>
            {t("pollOfPolls.showSurveys")}
          </summary>
          <ul className="mt-3 divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
            {contributors.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/archiv/${c.id}`}
                  className="flex items-center justify-between gap-3 px-3 py-2 text-sm hover:bg-brand-soft"
                >
                  <span className="min-w-0 truncate font-medium">
                    {c.institute}
                  </span>
                  <span className="flex shrink-0 items-center gap-3 text-muted">
                    {c.surveyedPersons ? (
                      <span className="hidden tabular-nums sm:inline">
                        {t("pollOfPolls.sample", {
                          count: c.surveyedPersons.toLocaleString("de-DE"),
                        })}
                      </span>
                    ) : null}
                    <span className="w-20 text-right tabular-nums">
                      {formatDate(c.date)}
                    </span>
                    <span
                      className="w-10 text-right font-mono tabular-nums text-foreground"
                      title={t("pollOfPolls.weightLabel")}
                    >
                      {Math.round(c.share * 100)}%
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </section>
  );
}
