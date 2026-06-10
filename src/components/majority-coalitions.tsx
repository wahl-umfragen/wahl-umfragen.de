import { t } from "@/i18n";
import type { MajorityCoalition } from "@/lib/dawum/coalition";
import { partyColorVar } from "@/lib/dawum/colors";

/**
 * Server-rendered list of all minimal winning coalitions (`findMajorityCoalitions`)
 * on the /koalition page — answers "which coalitions would have a majority?" at a
 * glance, complementing the interactive builder. Static, no client JS.
 */
export function MajorityCoalitions({
  coalitions,
}: {
  coalitions: MajorityCoalition[];
}) {
  return (
    <section data-testid="majority-coalitions" className="mt-12">
      <h2 className="eyebrow mb-1">{t("koalitionPage.majoritiesTitle")}</h2>
      <p className="mb-4 text-xs text-muted">
        {t("koalitionPage.majoritiesHint")}
      </p>

      {coalitions.length === 0 ? (
        <p className="text-sm text-muted">
          {t("koalitionPage.majoritiesNone")}
        </p>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2">
          {coalitions.map((c) => (
            <li
              key={c.parties.join("+")}
              className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-3"
            >
              <span className="flex flex-wrap items-center gap-1.5">
                {c.parties.map((p) => (
                  <span
                    key={p}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border px-2 py-0.5 text-sm font-medium"
                  >
                    <span
                      aria-hidden="true"
                      className="inline-block h-2 w-2 rounded-full"
                      style={{ backgroundColor: partyColorVar(p) }}
                    />
                    {p}
                  </span>
                ))}
              </span>
              <span className="shrink-0 text-right font-mono text-sm tabular-nums text-muted">
                {t("koalitionPage.majorityShare", {
                  share: (c.share * 100).toFixed(0),
                })}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
