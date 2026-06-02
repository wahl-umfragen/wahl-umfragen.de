"use client";

import { useMemo, useState } from "react";
import { partyColorVar } from "@/lib/dawum/colors";
import type { NormalizedSurvey } from "@/lib/dawum/types";

type SortKey = "institute" | "date" | { party: string };
type SortDir = "asc" | "desc";

function sameKey(a: SortKey, b: SortKey): boolean {
  if (typeof a === "string" || typeof b === "string") return a === b;
  return a.party === b.party;
}

export function InstituteTable({ surveys }: { surveys: NormalizedSurvey[] }) {
  // Column order: every party that appears in any survey, ranked by its
  // average share across surveys so the strongest parties sit on the left.
  const parties = useMemo(() => {
    const totals = new Map<string, number>();
    for (const s of surveys) {
      for (const r of s.results) {
        totals.set(r.shortcut, (totals.get(r.shortcut) ?? 0) + r.percent);
      }
    }
    return [...totals.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([shortcut]) => shortcut);
  }, [surveys]);

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

  return (
    <div className="overflow-x-auto">
      <table data-testid="survey-list" className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-zinc-200 dark:border-zinc-800">
            <th className="sticky left-0 bg-white dark:bg-zinc-950">
              <SortButton
                active={sameKey("institute", sortKey)}
                onClick={() => toggleSort("institute")}
                className="py-2 pr-3 text-left"
              >
                Institut{indicator("institute")}
              </SortButton>
            </th>
            <th>
              <SortButton
                active={sameKey("date", sortKey)}
                onClick={() => toggleSort("date")}
                className="py-2 pr-3 text-left"
              >
                Datum{indicator("date")}
              </SortButton>
            </th>
            {parties.map((shortcut) => {
              const key: SortKey = { party: shortcut };
              return (
                <th key={shortcut} className="whitespace-nowrap">
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
                className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50 dark:border-zinc-900 dark:hover:bg-zinc-900/50"
              >
                <th
                  scope="row"
                  className="sticky left-0 bg-white py-2 pr-3 text-left font-medium dark:bg-zinc-950"
                >
                  {survey.institute.name}
                </th>
                <td className="whitespace-nowrap py-2 pr-3 text-zinc-500">
                  {formatDate(survey.date)}
                </td>
                {parties.map((shortcut) => {
                  const percent = byShortcut.get(shortcut);
                  return (
                    <td
                      key={shortcut}
                      className="py-2 px-2 text-right font-mono tabular-nums"
                    >
                      {percent === undefined ? (
                        <span className="text-zinc-300 dark:text-zinc-700">–</span>
                      ) : (
                        percent.toFixed(1)
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
      aria-sort={active ? "other" : undefined}
      className={`flex items-center gap-1 font-semibold tabular-nums hover:text-zinc-900 dark:hover:text-zinc-100 ${
        active ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-500"
      } ${className}`}
    >
      {children}
    </button>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("de-DE", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}
