import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/json-ld";
import { PageHeader } from "@/components/page-header";
import { t } from "@/i18n";
import { STATE_PARLIAMENTS } from "@/lib/parliaments";
import { breadcrumbLd, buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Landtagswahlen – Umfragen je Bundesland",
  description:
    "Aktuelle Umfragen, Wahltrend und Sitzverteilung für die Landtage der 16 Bundesländer – aggregiert aus den Veröffentlichungen der Meinungsforschungsinstitute.",
  path: "/laender",
});

export default function LaenderPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <JsonLd
        data={breadcrumbLd([
          { name: "Startseite", path: "/" },
          { name: t("laenderPage.title"), path: "/laender" },
        ])}
      />
      <PageHeader
        title={t("laenderPage.title")}
        subtitle={t("laenderPage.subtitle")}
      />
      <ul className="grid gap-3 sm:grid-cols-2">
        {STATE_PARLIAMENTS.map((p) => (
          <li key={p.id}>
            <Link
              href={`/laender/${p.slug}`}
              className="block rounded-xl border border-border bg-surface px-4 py-3 transition-colors hover:bg-brand-soft"
            >
              <span className="font-display font-bold">{p.name}</span>
              <span className="mt-0.5 block text-xs text-muted">
                {p.parliamentName}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
