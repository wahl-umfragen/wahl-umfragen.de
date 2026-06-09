"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { t } from "@/i18n";
import { archivePartyOrder } from "@/lib/dawum/aggregate";
import { partyColorVar } from "@/lib/dawum/colors";
import { formatDate } from "@/lib/format";
import type { NormalizedSurvey } from "@/lib/dawum/types";

type SortKey = "institute" | "date" | { party: string };
type SortDir = "asc" | "desc";

function sameKey(a: SortKey, b: SortKey): boolean {
  if (typeof a === "string" || typeof b === "string") return a === b;
  return a.party === b.party;
}

/** A tiny ▲/▼ delta vs the institute's previous poll, in points. */
function DeltaBadge({ value }: { value: number | undefined }) {
  if (value === undefined || value === 0) return null;
  const up = value > 0;
  return (
    <span
      className={`ml-1 text-[0.65rem] font-semibold tabular-nums ${
        up ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
      }`}
      title={`${up ? "+" : ""}${value.toFixed(1)} ggü. vorheriger Umfrage des Instituts`}
    >
      {up ? "▲" : "▼"}
      {Math.abs(value).toFixed(1)}
    </span>
  );
}

export function InstituteTable({
  surveys,
  deltas,
}: {
  surveys: NormalizedSurvey[];
  /** Per-survey, per-party change vs the institute's previous poll (see
   *  `instituteDeltas`). Optional — when omitted, no change badges are shown. */
  deltas?: Record<string, Record<string, number>>;
}) {
  // Column order: every party that appears in any survey, ranked by its
  // average share across surveys so the strongest parties sit on the left.
  // Average only counts surveys that reported the party (not biased by appearance count).
  const parties = useMemo(() => archivePartyOrder(surveys), [surveys]);

  // Default: freshest survey first.
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  function toggleSort(key: SortKey) {
    if (sameKey(key, sortKey)) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      // Numbers and dates feel natural high-to-low; names low-to-high.
      setSortDir(key === "institute" ? "asc" : "desc");
    }
  }

  const rows = useMemo(() => {
    const dir = sortDir === "asc" ? 1 : -1;
    return [...surveys].sort((a, b) => {
      if (sortKey === "institute") {
        return dir * a.institute.name.localeCompare(b.institute.name, "de");
      }
      if (sortKey === "date") {
        return dir * a.date.localeCompare(b.date);
      }
      const pa = a.results.find((r) => r.shortcut === sortKey.party)?.percent;
      const pb = b.results.find((r) => r.shortcut === sortKey.party)?.percent;
      // Surveys missing this party always sink to the bottom.
      if (pa === undefined && pb === undefined) return 0;
      if (pa === undefined) return 1;
      if (pb === undefined) return -1;
      return dir * (pa - pb);
    });
  }, [surveys, sortKey, sortDir]);

  function indicator(key: SortKey): string {
    if (!sameKey(key, sortKey)) return "";
    return sortDir === "asc" ? " ↑" : " ↓";
  }

  function ariaSort(key: SortKey): "ascending" | "descending" | "none" {
    if (!sameKey(key, sortKey)) return "none";
    return sortDir === "asc" ? "ascending" : "descending";
  }

  return (
    <div className="overflow-x-auto">
      <table data-testid="survey-list" className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b-2 border-border-strong">
            <th
              aria-sort={ariaSort("institute")}
              className="sticky left-0 bg-background"
            >
              <SortButton
                active={sameKey("institute", sortKey)}
                onClick={() => toggleSort("institute")}
                className="py-2 pr-3 text-left"
              >
                {t("table.institute")}
                {indicator("institute")}
              </SortButton>
            </th>
            <th aria-sort={ariaSort("date")}>
              <SortButton
                active={sameKey("date", sortKey)}
                onClick={() => toggleSort("date")}
                className="py-2 pr-3 text-left"
              >
                {t("table.date")}
                {indicator("date")}
              </SortButton>
            </th>
            {parties.map((shortcut) => {
              const key: SortKey = { party: shortcut };
              return (
                <th
                  key={shortcut}
                  aria-sort={ariaSort(key)}
                  className="whitespace-nowrap"
                >
                  <SortButton
                    active={sameKey(key, sortKey)}
                    onClick={() => toggleSort(key)}
                    className="w-full justify-end py-2 px-2"
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <span
                        aria-hidden="true"
                        className="inline-block h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: partyColorVar(shortcut) }}
                      />
                      {shortcut}
                    </span>
                    {indicator(key)}
                  </SortButton>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((survey) => {
            const byShortcut = new Map(
              survey.results.map((r) => [r.shortcut, r.percent]),
            );
            return (
              <tr
                key={survey.id}
                data-testid="survey-card"
                data-institute={survey.institute.name}
                className="border-b border-border last:border-0 hover:bg-brand-soft"
              >
                <th
                  scope="row"
                  className="sticky left-0 bg-background py-2 pr-3 text-left font-medium"
                >
                  <Link
                    href={`/institut/${survey.institute.id}`}
                    className="hover:underline"
                  >
                    {survey.institute.name}
                  </Link>
                </th>
                <td className="whitespace-nowrap py-2 pr-3 text-muted">
                  {formatDate(survey.date)}
                </td>
                {parties.map((shortcut) => {
                  const percent = byShortcut.get(shortcut);
                  const delta = deltas?.[survey.id]?.[shortcut];
                  return (
                    <td
                      key={shortcut}
                      className="whitespace-nowrap py-2 px-2 text-right font-mono tabular-nums tracking-tight"
                    >
                      {percent === undefined ? (
                        <span className="text-border-strong">–</span>
                      ) : (
                        <>
                          {percent.toFixed(1)}
                          <DeltaBadge value={delta} />
                        </>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function SortButton({
  active,
  onClick,
  className = "",
  children,
}: {
  active: boolean;
  onClick: () => void;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1 text-xs font-bold uppercase tracking-wide tabular-nums hover:text-foreground ${
        active ? "text-foreground" : "text-muted"
      } ${className}`}
    >
      {children}
    </button>
  );
}

