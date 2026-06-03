import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BackLink } from "@/components/back-link";
import { t } from "@/i18n";
import { partyColorVar } from "@/lib/dawum/colors";
import type { NormalizedSurvey } from "@/lib/dawum/types";
import { loadBundestagData } from "@/lib/data";
import { formatDate } from "@/lib/format";

async function findSurvey(id: string): Promise<NormalizedSurvey | undefined> {
  const { bundestag } = await loadBundestagData();
  return bundestag.find((s) => s.id === id);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const survey = await findSurvey(id);
  if (!survey) return {};
  return {
    title: t("detail.metaTitle", {
      institute: survey.institute.name,
      date: formatDate(survey.date),
    }),
  };
}

export default async function SurveyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const survey = await findSurvey(id);
  if (!survey) notFound();

  const max = Math.max(...survey.results.map((r) => r.percent), 1);

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <BackLink
        fallbackHref="/archiv"
        label={t("detail.back")}
        className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
      />

      <header className="mt-4 mb-8">
        <h2 className="text-2xl font-semibold tracking-tight">
          <Link
            href={`/institut/${survey.institute.id}`}
            className="hover:underline"
          >
            {survey.institute.name}
          </Link>
        </h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          {formatDate(survey.date)}
        </p>
      </header>

      <dl
        data-testid="survey-meta"
        className="mb-8 grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3"
      >
        <Meta label={t("detail.date")}>{formatDate(survey.date)}</Meta>
        {survey.periodStart && survey.periodEnd ? (
          <Meta label={t("detail.period")}>
            {formatDate(survey.periodStart)} – {formatDate(survey.periodEnd)}
          </Meta>
        ) : null}
        {survey.method ? (
          <Meta label={t("detail.method")}>{survey.method.name}</Meta>
        ) : null}
        {survey.tasker ? (
          <Meta label={t("detail.tasker")}>{survey.tasker.name}</Meta>
        ) : null}
        {survey.surveyedPersons ? (
          <Meta label={t("detail.surveyed")}>
            {survey.surveyedPersons.toLocaleString("de-DE")}
          </Meta>
        ) : null}
      </dl>

      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {t("detail.results")}
      </h3>
      <ul data-testid="survey-results" className="space-y-2">
        {survey.results.map((r) => (
          <li key={r.partyId} className="flex items-center gap-3 text-sm">
            <span className="w-28 shrink-0 font-medium">{r.shortcut}</span>
            <span className="relative h-5 flex-1 overflow-hidden rounded bg-zinc-100 dark:bg-zinc-900">
              <span
                className="absolute inset-y-0 left-0 rounded"
                style={{
                  width: `${(r.percent / max) * 100}%`,
                  backgroundColor: partyColorVar(r.shortcut),
                }}
              />
            </span>
            <span className="w-12 shrink-0 text-right font-mono tabular-nums">
              {r.percent.toFixed(1)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Meta({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-xs text-zinc-500">{label}</dt>
      <dd className="mt-0.5">{children}</dd>
    </div>
  );
}
