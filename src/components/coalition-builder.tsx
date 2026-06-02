"use client";

import { useMemo, useState } from "react";
import { coalitionMath, type CoalitionInputParty } from "@/lib/dawum/coalition";
import { partyColor } from "@/lib/dawum/colors";

const NON_PARTISAN = new Set(["Sonstige", "Sonstige Parteien", "Andere"]);

export interface CoalitionBuilderProps {
  parties: CoalitionInputParty[];
  surveyLabel: string;
}

export function CoalitionBuilder({ parties, surveyLabel }: CoalitionBuilderProps) {
  const eligible = useMemo(
    () => parties.filter((p) => !NON_PARTISAN.has(p.shortcut)),
    [parties],
  );
  const [selected, setSelected] = useState<Set<string>>(() => new Set());

  const result = useMemo(
    () => coalitionMath(eligible, selected),
    [eligible, selected],
  );

  if (eligible.length === 0) {
    return null;
  }

  return (
    <div
      data-testid="coalition-builder"
      className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <p className="mb-3 text-xs text-zinc-500 dark:text-zinc-400">
        Grundlage: {surveyLabel}
      </p>
      <ul className="flex flex-wrap gap-2">
        {eligible.map((p) => {
          const isChecked = selected.has(p.shortcut);
          const belowThreshold = p.percent < 5;
          return (
            <li key={p.shortcut}>
              <label
                className={`flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1 text-sm transition-colors ${
                  isChecked
                    ? "border-transparent text-white"
                    : "border-zinc-300 dark:border-zinc-700"
                } ${belowThreshold && !isChecked ? "opacity-60" : ""}`}
                style={
                  isChecked
                    ? { backgroundColor: partyColor(p.shortcut) }
                    : undefined
                }
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={isChecked}
                  onChange={() => toggle(setSelected, p.shortcut)}
                />
                <span
                  aria-hidden="true"
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: partyColor(p.shortcut) }}
                />
                <span>{p.shortcut}</span>
                <span className="font-mono tabular-nums">
                  {p.percent.toFixed(1)}%
                </span>
              </label>
            </li>
          );
        })}
      </ul>

      <div className="mt-4 flex flex-wrap items-baseline gap-x-6 gap-y-2 text-sm">
        <div>
          <span className="text-zinc-500">Summe: </span>
          <span
            data-testid="coalition-sum"
            className="font-mono tabular-nums font-semibold"
          >
            {result.selectedSum.toFixed(1)}%
          </span>
        </div>
        <div>
          <span className="text-zinc-500">Anteil im Bundestag: </span>
          <span
            data-testid="coalition-share"
            className="font-mono tabular-nums font-semibold"
          >
            {(result.share * 100).toFixed(1)}%
          </span>
        </div>
        <MajorityBadge hasMajority={result.hasMajority} share={result.share} />
      </div>

      {result.excludedBelowThreshold.length > 0 ? (
        <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
          Unter 5%-Hürde, zählt nicht: {result.excludedBelowThreshold.join(", ")}
        </p>
      ) : null}
    </div>
  );
}

function toggle(
  setSelected: (updater: (prev: Set<string>) => Set<string>) => void,
  shortcut: string,
) {
  setSelected((prev) => {
    const next = new Set(prev);
    if (next.has(shortcut)) next.delete(shortcut);
    else next.add(shortcut);
    return next;
  });
}

function MajorityBadge({
  hasMajority,
  share,
}: {
  hasMajority: boolean;
  share: number;
}) {
  if (share === 0) {
    return (
      <span
        data-testid="coalition-status"
        className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
      >
        keine Auswahl
      </span>
    );
  }
  if (hasMajority) {
    return (
      <span
        data-testid="coalition-status"
        className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
      >
        Mehrheit
      </span>
    );
  }
  return (
    <span
      data-testid="coalition-status"
      className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
    >
      keine Mehrheit
    </span>
  );
}
