"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { t } from "@/i18n";
import { partyColorVar } from "@/lib/dawum/colors";
import type { NormalizedSurvey } from "@/lib/dawum/types";
import { formatDate } from "@/lib/format";

const PAGE_SIZE = 50;

type SortKey = "institute" | "date" | { party: string };
type SortDir = "asc" | "desc";

function sameKey(a: SortKey, b: SortKey): boolean {
  if (typeof a === "string" || typeof b === "string") return a === b;
  return a.party === b.party;
}

function serializeSort(key: SortKey): string {
  return typeof key === "string" ? key : `party:${key.party}`;
}

function parseSort(raw: string | null): SortKey {
  if (raw === "institute") return "institute";
  if (raw?.startsWith("party:")) return { party: raw.slice("party:".length) };
  return "date";
}

/**
 * Full browsable archive of every Bundestag survey. Everything — filtering by
 * institute and date range, sorting, paging — happens client-side over the
 * cached payload, so the server ships one static page and does zero per-request
 * work regardless of how many users browse it.
 */
export function SurveyArchive({ surveys }: { surveys: NormalizedSurvey[] }) {
  // Party columns: every party that ever appears, strongest average on the left.
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

  // Distinct institutes for the filter dropdown, alphabetical.
  const institutes = useMemo(() => {
    const byId = new Map<string, string>();
    for (const s of surveys) byId.set(s.institute.id, s.institute.name);
    return [...byId.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, "de"));
  }, [surveys]);

  // All controls are mirrored to the URL query (?institut, from, to, sort, dir,
  // page) so a reload, bookmark, or shared link restores the exact view. The
  // params seed the initial state here; the URL is kept in sync by the effect
  // below. Filtering stays fully client-side, so the page stays static.
  const params = useSearchParams();
  const [institute, setInstitute] = useState(
    () => params.get("institut") ?? "",
  );
  const [from, setFrom] = useState(() => params.get("from") ?? "");
  const [to, setTo] = useState(() => params.get("to") ?? "");
  const [sortKey, setSortKey] = useState<SortKey>(() =>
    parseSort(params.get("sort")),
  );
  const [sortDir, setSortDir] = useState<SortDir>(() =>
    params.get("dir") === "asc" ? "asc" : "desc",
  );
  const [page, setPage] = useState(() => {
    const p = Number(params.get("page"));
    return Number.isInteger(p) && p > 1 ? p - 1 : 0;
  });

  function toggleSort(key: SortKey) {
    if (sameKey(key, sortKey)) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "institute" ? "asc" : "desc");
    }
    setPage(0);
  }

  const filtered = useMemo(() => {
    return surveys.filter((s) => {
      if (institute && s.institute.id !== institute) return false;
      if (from && s.date < from) return false;
      if (to && s.date > to) return false;
      return true;
    });
  }, [surveys, institute, from, to]);

  const sorted = useMemo(() => {
    const dir = sortDir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      if (sortKey === "institute") {
        return dir * a.institute.name.localeCompare(b.institute.name, "de");
      }
      if (sortKey === "date") {
        return dir * a.date.localeCompare(b.date);
      }
      const pa = a.results.find((r) => r.shortcut === sortKey.party)?.percent;
      const pb = b.results.find((r) => r.shortcut === sortKey.party)?.percent;
      if (pa === undefined && pb === undefined) return 0;
      if (pa === undefined) return 1;
      if (pb === undefined) return -1;
      return dir * (pa - pb);
    });
  }, [filtered, sortKey, sortDir]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pageRows = sorted.slice(
    safePage * PAGE_SIZE,
    safePage * PAGE_SIZE + PAGE_SIZE,
  );

  const sortParam = serializeSort(sortKey);

  // Mirror the current view into the URL without a navigation/refetch, so it
  // survives a reload and can be shared. Only non-default values are written to
  // keep the URL clean. `replaceState` avoids cluttering the back-history with
  // every keystroke.
  useEffect(() => {
    const q = new URLSearchParams();
    if (institute) q.set("institut", institute);
    if (from) q.set("from", from);
    if (to) q.set("to", to);
    if (sortParam !== "date") q.set("sort", sortParam);
    if (sortDir !== "desc") q.set("dir", sortDir);
    if (safePage > 0) q.set("page", String(safePage + 1));
    const qs = q.toString();
    const url = qs ? `?${qs}` : window.location.pathname;
    window.history.replaceState(window.history.state, "", url);
  }, [institute, from, to, sortParam, sortDir, safePage]);

  function indicator(key: SortKey): string {
    if (!sameKey(key, sortKey)) return "";
    return sortDir === "asc" ? " ↑" : " ↓";
  }

  function ariaSort(key: SortKey): "ascending" | "descending" | "none" {
    if (!sameKey(key, sortKey)) return "none";
    return sortDir === "asc" ? "ascending" : "descending";
  }

  function reset() {
    setInstitute("");
    setFrom("");
    setTo("");
    setPage(0);
  }

  const inputCls =
    "rounded-md border border-zinc-300 bg-background px-2 py-1 text-sm dark:border-zinc-700";

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end gap-3 text-sm">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-zinc-500">{t("archive.institute")}</span>
          <select
            data-testid="archive-institute"
            value={institute}
            onChange={(e) => {
              setInstitute(e.target.value);
              setPage(0);
            }}
            className={inputCls}
          >
            <option value="">{t("archive.allInstitutes")}</option>
            {institutes.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-zinc-500">{t("archive.dateFrom")}</span>
          <input
            type="date"
            value={from}
            onChange={(e) => {
              setFrom(e.target.value);
              setPage(0);
            }}
            className={inputCls}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-zinc-500">{t("archive.dateTo")}</span>
          <input
            type="date"
            value={to}
            onChange={(e) => {
              setTo(e.target.value);
              setPage(0);
            }}
            className={inputCls}
          />
        </label>
        <button
          type="button"
          onClick={reset}
          className="rounded-md border border-zinc-300 px-3 py-1 font-medium text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-900"
        >
          {t("archive.reset")}
        </button>
        <div className="ml-auto flex items-center gap-3 text-xs text-zinc-500">
          <span>
            {t("archive.export")}:{" "}
            <a
              href="/api/surveys"
              className="underline hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              JSON
            </a>
            {" · "}
            <a
              href="/api/surveys?format=csv"
              className="underline hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              CSV
            </a>
          </span>
          <span data-testid="archive-count">
            {t("archive.results", { count: sorted.length })}
          </span>
        </div>
      </div>

      {sorted.length === 0 ? (
        <p
          data-testid="archive-empty"
          className="py-8 text-center text-sm text-zinc-500"
        >
          {t("archive.noMatch")}
        </p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table
              data-testid="archive-table"
              className="w-full border-collapse text-sm"
            >
              <thead>
                <tr className="border-b-2 border-zinc-300 dark:border-zinc-700">
                  <th
                    aria-sort={ariaSort("institute")}
                    className="sticky left-0 bg-background"
                  >
                    <SortButton
                      active={sameKey("institute", sortKey)}
                      onClick={() => toggleSort("institute")}
                      className="py-2 pr-3 text-left"
                    >
                      {t("archive.institute")}
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
                  <th className="whitespace-nowrap py-2 px-2 text-right text-zinc-500">
                    {t("archive.n")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((survey) => {
                  const byShortcut = new Map(
                    survey.results.map((r) => [r.shortcut, r.percent]),
                  );
                  return (
                    <tr
                      key={survey.id}
                      data-testid="archive-row"
                      data-institute={survey.institute.name}
                      className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50 dark:border-zinc-900 dark:hover:bg-zinc-900/50"
                    >
                      <th
                        scope="row"
                        className="sticky left-0 bg-background py-2 pr-3 text-left font-medium"
                      >
                        <Link
                          href={`/archiv/${survey.id}`}
                          className="hover:underline"
                        >
                          {survey.institute.name}
                        </Link>
                      </th>
                      <td className="whitespace-nowrap py-2 pr-3 text-zinc-500 dark:text-zinc-400">
                        {formatDate(survey.date)}
                      </td>
                      {parties.map((shortcut) => {
                        const percent = byShortcut.get(shortcut);
                        return (
                          <td
                            key={shortcut}
                            className="py-2 px-2 text-right font-mono tabular-nums tracking-tight"
                          >
                            {percent === undefined ? (
                              <span className="text-zinc-300 dark:text-zinc-700">
                                –
                              </span>
                            ) : (
                              percent.toFixed(1)
                            )}
                          </td>
                        );
                      })}
                      <td className="py-2 px-2 text-right font-mono tabular-nums text-zinc-500 dark:text-zinc-400">
                        {survey.surveyedPersons?.toLocaleString("de-DE") ?? "–"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3 text-sm">
            <PageButton
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={safePage === 0}
              label={`‹ ${t("archive.prev")}`}
            />
            {/* A page <select> replaces dedicated first/last buttons: it jumps to
                any page (incl. first and last) without sitting next to prev/next,
                so you can't overshoot by clicking one button too many times. */}
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <span data-testid="archive-page">
                {t("archive.page", { page: safePage + 1, pages: pageCount })}
              </span>
              {pageCount > 1 ? (
                <label className="flex items-center gap-1.5">
                  <span className="sr-only">{t("archive.jumpTo")}</span>
                  <select
                    data-testid="archive-page-select"
                    value={safePage}
                    onChange={(e) => setPage(Number(e.target.value))}
                    aria-label={t("archive.jumpTo")}
                    className="rounded-md border border-zinc-300 bg-background px-1.5 py-1 text-xs dark:border-zinc-700"
                  >
                    {Array.from({ length: pageCount }, (_, i) => (
                      <option key={i} value={i}>
                        {i + 1}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
            </div>
            <PageButton
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
              disabled={safePage >= pageCount - 1}
              label={`${t("archive.next")} ›`}
            />
          </div>
        </>
      )}
    </div>
  );
}

function PageButton({
  onClick,
  disabled,
  label,
}: {
  onClick: () => void;
  disabled: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-md border border-zinc-300 px-3 py-1 font-medium disabled:opacity-40 enabled:hover:bg-zinc-100 dark:border-zinc-700 dark:enabled:hover:bg-zinc-900"
    >
      {label}
    </button>
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
      className={`flex items-center gap-1 font-semibold tabular-nums hover:text-zinc-900 dark:hover:text-zinc-100 ${
        active ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-500"
      } ${className}`}
    >
      {children}
    </button>
  );
}
