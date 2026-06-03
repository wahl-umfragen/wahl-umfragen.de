import Link from "next/link";
import { t } from "@/i18n";
import type { HouseEffects } from "@/lib/dawum/aggregate";
import { partyColorVar } from "@/lib/dawum/colors";

const SIGNED = new Intl.NumberFormat("de-DE", {
  signDisplay: "exceptZero",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

/** Below this magnitude (points) a deviation is treated as essentially neutral. */
const NEUTRAL = 0.05;

/**
 * House-effects table: each institute's average deviation from the panel mean
 * per party. Positive = the institute reports that party higher than the panel.
 * Tinted by direction (over/under), not good/bad. Reuses the shared party colours.
 */
export function HouseEffectsTable({ data }: { data: HouseEffects }) {
  if (data.rows.length === 0 || data.parties.length === 0) return null;

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-surface">
      <table data-testid="house-effects" className="w-full text-sm">
        <thead>
          <tr className="border-b-2 border-border-strong bg-surface-2 text-left">
            <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide">
              {t("table.institute")}
            </th>
            {data.parties.map((shortcut) => (
              <th
                key={shortcut}
                className="px-3 py-3 text-right text-xs font-bold uppercase tracking-wide tabular-nums"
              >
                <span className="inline-flex items-center gap-1.5">
                  <span
                    aria-hidden="true"
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ backgroundColor: partyColorVar(shortcut) }}
                  />
                  {shortcut}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.rows.map((row) => (
            <tr
              key={row.instituteId}
              className="border-b border-border last:border-0 hover:bg-brand-soft"
            >
              <th scope="row" className="px-4 py-2.5 text-left font-medium">
                <Link
                  href={`/institut/${row.instituteId}`}
                  className="hover:text-foreground hover:underline"
                >
                  {row.institute}
                </Link>
              </th>
              {data.parties.map((shortcut) => {
                const v = row.deviations[shortcut];
                if (v === undefined) {
                  return (
                    <td
                      key={shortcut}
                      className="px-3 py-2.5 text-right text-border-strong"
                    >
                      ·
                    </td>
                  );
                }
                const tint =
                  Math.abs(v) < NEUTRAL
                    ? "text-muted"
                    : v > 0
                      ? "text-sky-600 dark:text-sky-400"
                      : "text-amber-600 dark:text-amber-400";
                return (
                  <td
                    key={shortcut}
                    className={`px-3 py-2.5 text-right font-mono tabular-nums ${tint}`}
                  >
                    {SIGNED.format(v)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
