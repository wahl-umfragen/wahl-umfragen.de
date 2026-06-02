import Link from "next/link";
import { t } from "@/i18n";
import { partyColorVar } from "@/lib/dawum/colors";
import type { NormalizedSurvey } from "@/lib/dawum/types";
import { formatDate } from "@/lib/format";

/**
 * Compact list of the newest surveys, each linking to its archive detail page,
 * with a shortcut to the full archive. Server-rendered (no interactivity) so it
 * stays part of the statically cached trend page.
 */
export function RecentSurveys({
  surveys,
  limit = 8,
}: {
  surveys: NormalizedSurvey[];
  limit?: number;
}) {
  const recent = [...surveys]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, limit);

  if (recent.length === 0) return null;

  return (
    <section data-testid="recent-surveys">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          {t("dashboard.recentTitle")}
        </h3>
        <Link
          href="/archiv"
          className="text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          {t("dashboard.recentViewAll")}
        </Link>
      </div>
      <ul className="divide-y divide-zinc-100 overflow-hidden rounded-lg border border-zinc-200 bg-white dark:divide-zinc-900 dark:border-zinc-800 dark:bg-zinc-900">
        {recent.map((s) => {
          const top = [...s.results]
            .sort((a, b) => b.percent - a.percent)
            .slice(0, 3);
          return (
            <li key={s.id}>
              <Link
                href={`/archiv/${s.id}`}
                className="flex items-center justify-between gap-4 px-3 py-2.5 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-900/60"
              >
                <span className="min-w-0 truncate font-medium">
                  {s.institute.name}
                </span>
                <span className="flex shrink-0 items-center gap-3">
                  <span className="hidden items-center gap-2.5 sm:flex">
                    {top.map((r) => (
                      <span
                        key={r.partyId}
                        className="flex items-center gap-1 font-mono tabular-nums text-zinc-600 dark:text-zinc-400"
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
                  <span className="w-20 text-right text-zinc-500 dark:text-zinc-400">
                    {formatDate(s.date)}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
