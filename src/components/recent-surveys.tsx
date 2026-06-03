import Link from "next/link";
import { t } from "@/i18n";
import { partyColorVar } from "@/lib/dawum/colors";
import type { NormalizedSurvey } from "@/lib/dawum/types";
import { formatDate } from "@/lib/format";

/**
 * Compact list of the newest surveys, each linking to its archive detail page,
 * with an optional shortcut link in the header. Server-rendered (no
 * interactivity) so it stays part of the statically cached pages that embed it.
 * Reused on the home page (per institute name) and on an institute page (where
 * the institute is fixed, so `showInstitute` is turned off and the date leads).
 */
export function RecentSurveys({
  surveys,
  limit = 8,
  title = t("dashboard.recentTitle"),
  viewAllHref = "/archiv",
  viewAllLabel = t("dashboard.recentViewAll"),
  showInstitute = true,
}: {
  surveys: NormalizedSurvey[];
  limit?: number;
  title?: string;
  viewAllHref?: string;
  viewAllLabel?: string;
  showInstitute?: boolean;
}) {
  const recent = [...surveys]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, limit);

  if (recent.length === 0) return null;

  return (
    <section data-testid="recent-surveys">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h3 className="eyebrow">{title}</h3>
        {viewAllHref ? (
          <Link
            href={viewAllHref}
            className="text-xs font-medium text-muted hover:text-foreground"
          >
            {viewAllLabel}
          </Link>
        ) : null}
      </div>
      <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
        {recent.map((s) => {
          const top = [...s.results]
            .sort((a, b) => b.percent - a.percent)
            .slice(0, 3);
          return (
            <li key={s.id}>
              <Link
                href={`/archiv/${s.id}`}
                className="flex items-center justify-between gap-4 px-3 py-2.5 text-sm hover:bg-brand-soft"
              >
                <span className="min-w-0 truncate font-medium">
                  {showInstitute ? s.institute.name : formatDate(s.date)}
                </span>
                <span className="flex shrink-0 items-center gap-3">
                  <span className="hidden items-center gap-2.5 sm:flex">
                    {top.map((r) => (
                      <span
                        key={r.partyId}
                        className="flex items-center gap-1 font-mono tabular-nums text-muted"
                      >
                        <span
                          aria-hidden="true"
                          className="inline-block h-2 w-2 rounded-full"
                          style={{ backgroundColor: partyColorVar(r.shortcut) }}
                        />
                        {r.shortcut} {r.percent.toFixed(1)}
                      </span>
                    ))}
                  </span>
                  {showInstitute ? (
                    <span className="w-20 text-right text-muted">
                      {formatDate(s.date)}
                    </span>
                  ) : null}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
