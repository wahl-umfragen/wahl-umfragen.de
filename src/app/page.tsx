import { Suspense } from "react";
import {
  fetchDawumDatabase,
  latestPerInstitute,
  partyColor,
  selectBundestagSurveys,
  type NormalizedSurvey,
} from "@/lib/dawum";

export const revalidate = 900;

export default function Page() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <header className="mb-8">
        <h2 className="text-2xl font-semibold tracking-tight">
          Sonntagsfrage Bundestag
        </h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Aktuellste Umfrage je Institut.
        </p>
      </header>
      <Suspense fallback={<SurveysSkeleton />}>
        <LatestSurveys />
      </Suspense>
    </div>
  );
}

async function LatestSurveys() {
  const db = await fetchDawumDatabase();
  const latest = latestPerInstitute(selectBundestagSurveys(db));

  return (
    <>
      <p
        data-testid="data-freshness"
        className="mb-4 text-xs text-zinc-500 dark:text-zinc-400"
      >
        Stand: {formatDateTime(db.Database.Last_Update)}
      </p>
      {latest.length === 0 ? (
        <p
          data-testid="empty-state"
          className="text-sm text-zinc-600 dark:text-zinc-400"
        >
          Keine Umfragen verfügbar.
        </p>
      ) : (
        <ul
          data-testid="survey-list"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2"
        >
          {latest.map((s) => (
            <SurveyCard key={s.id} survey={s} />
          ))}
        </ul>
      )}
    </>
  );
}

function SurveyCard({ survey }: { survey: NormalizedSurvey }) {
  return (
    <li
      data-testid="survey-card"
      data-institute={survey.institute.name}
      className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="flex items-baseline justify-between">
        <h3 className="text-base font-semibold">{survey.institute.name}</h3>
        <time className="text-xs text-zinc-500" dateTime={survey.date}>
          {formatDate(survey.date)}
        </time>
      </div>
      <ol className="mt-3 space-y-1.5">
        {survey.results.map((r) => (
          <li
            key={r.partyId}
            className="flex items-center justify-between gap-3 text-sm"
          >
            <span className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: partyColor(r.shortcut) }}
              />
              {r.shortcut}
            </span>
            <span className="font-mono tabular-nums">
              {r.percent.toFixed(1)}%
            </span>
          </li>
        ))}
      </ol>
      {survey.surveyedPersons ? (
        <p className="mt-3 text-xs text-zinc-500">
          n = {survey.surveyedPersons}
        </p>
      ) : null}
    </li>
  );
}

function SurveysSkeleton() {
  return (
    <div
      data-testid="surveys-skeleton"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2"
    >
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="h-40 animate-pulse rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
        />
      ))}
    </div>
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

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("de-DE", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
