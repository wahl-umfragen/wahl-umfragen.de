import Link from "next/link";
import { t } from "@/i18n";
import type { SurveyWeight } from "@/lib/dawum/aggregate";
import { formatDate } from "@/lib/format";

/**
 * Disclosure listing the surveys that feed a weighted poll-of-polls estimate,
 * each linked to its archive entry and annotated with sample size, date and its
 * relative weight (share of the total). Shared by the dashboard's PollOfPolls
 * and the per-party page so the provenance UI stays identical. Renders nothing
 * when there are no contributors (e.g. the value fell back to a single survey).
 */
export function ContributingSurveys({
  contributors,
  className = "mt-4",
}: {
  contributors: SurveyWeight[];
  /** Outer spacing override; defaults to the dashboard's `mt-4`. */
  className?: string;
}) {
  if (contributors.length === 0) return null;

  return (
    <details className={`group ${className}`}>
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
  );
}
