import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { t } from "@/i18n";
import { loadBundestagData, loadIngestStatus } from "@/lib/data";
import { formatDate, formatDateTime } from "@/lib/format";
import { buildMetadata, PAGE_META } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  ...PAGE_META.datenstand,
  path: "/datenstand",
});

export default async function DatenstandPage() {
  const [status, { bundestag }] = await Promise.all([
    loadIngestStatus(),
    loadBundestagData(),
  ]);

  // Per-institute coverage (Bundestag): survey count + newest date.
  const coverage = new Map<string, { name: string; count: number; latest: string }>();
  for (const s of bundestag) {
    const entry = coverage.get(s.institute.id);
    if (entry) {
      entry.count += 1;
      if (s.date > entry.latest) entry.latest = s.date;
    } else {
      coverage.set(s.institute.id, {
        name: s.institute.name,
        count: 1,
        latest: s.date,
      });
    }
  }
  const institutes = [...coverage.values()].sort((a, b) => b.count - a.count);

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <PageHeader title={t("statusPage.title")} subtitle={t("statusPage.subtitle")} />

      <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
        <Stat label={t("statusPage.lastRun")}>
          {status.lastRunAt ? formatDateTime(status.lastRunAt) : "—"}
        </Stat>
        <Stat label={t("statusPage.dawumUpdate")}>
          {status.lastDawumUpdate ? formatDateTime(status.lastDawumUpdate) : "—"}
        </Stat>
        <Stat label={t("statusPage.totalSurveys")}>
          {status.surveysTotal.toLocaleString("de-DE")}
        </Stat>
        <Stat label={t("statusPage.lastChanges")}>
          {t("statusPage.newUpdated", {
            new: status.lastNew,
            updated: status.lastUpdated,
          })}
        </Stat>
      </dl>

      <section className="mt-12">
        <h2 className="eyebrow mb-1">{t("statusPage.coverageTitle")}</h2>
        <p className="mb-4 text-xs text-muted">{t("statusPage.coverageHint")}</p>
        {institutes.length === 0 ? (
          <p className="text-sm text-muted">{t("common.noData")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b-2 border-border-strong text-left text-xs font-bold uppercase tracking-wide text-muted">
                  <th scope="col" className="py-2 pr-3">{t("statusPage.institute")}</th>
                  <th scope="col" className="py-2 pr-3 text-right">{t("statusPage.count")}</th>
                  <th scope="col" className="py-2 pr-3 text-right">{t("statusPage.latest")}</th>
                </tr>
              </thead>
              <tbody>
                {institutes.map((i) => (
                  <tr
                    key={i.name}
                    className="border-b border-border last:border-0"
                  >
                    <td className="py-2 pr-3 font-medium">{i.name}</td>
                    <td className="py-2 pr-3 text-right font-mono tabular-nums">
                      {i.count.toLocaleString("de-DE")}
                    </td>
                    <td className="whitespace-nowrap py-2 pr-3 text-right text-muted">
                      {formatDate(i.latest)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
        {label}
      </dt>
      <dd className="mt-0.5 font-medium">{children}</dd>
    </div>
  );
}
