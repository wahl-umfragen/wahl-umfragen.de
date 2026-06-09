import type { Metadata } from "next";

/**
 * Single source of truth for SEO: site identity, the base URL, per-page meta
 * copy, on-page SEO prose, the FAQ, and Schema.org JSON-LD builders.
 *
 * SEO copy lives here rather than in the i18n catalog (`de-DE.json`) on purpose:
 * it is longer-form marketing/legal-adjacent prose (mirroring the inline German
 * prose already used in the Impressum), and keeping it isolated avoids churn in
 * the shared UI string catalog.
 *
 * The canonical origin comes from `NEXT_PUBLIC_SITE_URL` (set it in production,
 * e.g. https://wahlumfragen.de). It falls back to localhost for dev/preview so
 * absolute URLs in metadata, the sitemap and OpenGraph still resolve.
 */
export const SITE_NAME = "Wahlumfragen";

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
).replace(/\/+$/, "");

/** Absolute URL for a path, e.g. absoluteUrl("/trend"). */
export function absoluteUrl(path = "/"): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export const DEFAULT_TITLE =
  "Wahlumfragen Bundestag – Sonntagsfrage & Wahltrend aktuell";

export const DEFAULT_DESCRIPTION =
  "Aktuelle Sonntagsfrage zur Bundestagswahl: alle Umfragen der großen Institute (INSA, Forsa, Verian, Infratest dimap u. a.) aggregiert – mit Wahltrend, Sitzverteilung und Koalitionsrechner. Stündlich aktualisiert.";

export const KEYWORDS = [
  "Wahlumfragen",
  "Sonntagsfrage",
  "Bundestagswahl",
  "Bundestag Umfragen",
  "Wahltrend",
  "aktuelle Umfragen",
  "Sitzverteilung",
  "Koalitionsrechner",
  "INSA",
  "Forsa",
  "Infratest dimap",
  "Politbarometer",
];

interface PageMetaInput {
  title: string;
  description: string;
  path: string;
  /** Use the title verbatim (no "· Wahlumfragen" template suffix). */
  absoluteTitle?: boolean;
  /**
   * Keep the page out of search engines (legal pages like Impressum and
   * Datenschutz). Emits a `noindex, follow` robots meta tag so crawlers still
   * follow outgoing links but neither index nor surface the page in results.
   * Note: such pages must stay crawlable (not disallowed in robots.txt) so the
   * crawler can actually read this tag.
   */
  noindex?: boolean;
}

/**
 * Build a Next `Metadata` object with a canonical URL plus OpenGraph and
 * Twitter cards filled from one title/description. `metadataBase` (set in the
 * root layout) resolves the relative canonical and the file-based OG image.
 */
export function buildMetadata({
  title,
  description,
  path,
  absoluteTitle = false,
  noindex = false,
}: PageMetaInput): Metadata {
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    ...(noindex ? { robots: { index: false, follow: true } } : {}),
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: "de_DE",
      url: absoluteUrl(path),
      title,
      description,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

/** Per-page meta copy. Titles ≤ ~60 chars, descriptions ≤ ~160. */
export const PAGE_META = {
  home: {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
  },
  trend: {
    title: "Wahltrend Bundestag – Verlauf der Sonntagsfrage",
    description:
      "Interaktiver Wahltrend zur Bundestagswahl: Umfrageverlauf je Partei über 90 Tage, 1 Jahr oder gesamt, Sitzverteilung mit 5-%-Hürde und Institutsvergleich.",
  },
  koalition: {
    title: "Koalitionsrechner Bundestag – Mehrheiten prüfen",
    description:
      "Koalitionsrechner für den Bundestag: Parteien auf Basis der aktuellsten Umfrage kombinieren und Mehrheiten unter der 5-%-Hürde durchrechnen.",
  },
  archiv: {
    title: "Umfrage-Archiv Bundestag seit 2017",
    description:
      "Durchsuchbares Archiv aller Bundestags-Umfragen seit 2017: nach Institut und Zeitraum filtern, nach Partei sortieren und als CSV oder JSON exportieren.",
  },
  wahlen: {
    title: "Bundestagswahl-Ergebnisse – amtliche Zweitstimmen",
    description:
      "Amtliche Endergebnisse der Bundestagswahl (Zweitstimmen je Partei) von Die Bundeswahlleiterin – als Tabelle zum Vergleich mit der aktuellen Sonntagsfrage.",
  },
  parteien: {
    title: "Parteien in der Sonntagsfrage – Umfragewerte je Partei",
    description:
      "Aktuelle Umfragewerte aller Bundestagsparteien (CDU/CSU, SPD, Grüne, AfD, Linke, BSW, FDP, FW): gewichteter Schnitt, Verlauf und Höchst-/Tiefstwerte der Sonntagsfrage.",
  },
  impressum: {
    title: "Impressum",
    description: "Impressum und Anbieterkennzeichnung von Wahlumfragen.",
  },
  datenschutz: {
    title: "Datenschutzerklärung",
    description:
      "Datenschutzerklärung von Wahlumfragen – cookielose, datensparsame Reichweitenmessung ohne personenbezogene Daten.",
  },
} as const;

/**
 * On-page intro prose per section. Visible, indexable text that gives search
 * engines (and readers) context the charts and tables alone don't convey.
 */
export const PAGE_INTRO: Record<string, string> = {
  home: "Diese Seite bündelt die Sonntagsfrage zur Bundestagswahl: Für jedes große Meinungsforschungsinstitut zeigt die Tabelle dessen jüngste Umfrage, sodass sich der aktuelle Stand der Parteien auf einen Blick vergleichen lässt. Die Daten werden stündlich mit dawum.de abgeglichen und dauerhaft archiviert.",
  trend: "Der Wahltrend fasst die einzelnen Umfragen zu einem geglätteten Verlauf je Partei zusammen und federt so die Schwankungen zwischen den Instituten (House-Effects) ab. Ergänzt wird er um eine Sitzverteilung nach dem Hare-/Niemeyer-Verfahren mit 5-%-Hürde und einen direkten Institutsvergleich.",
  koalition: "Der Koalitionsrechner kombiniert Parteien auf Basis der aktuellsten Umfrage zu möglichen Bündnissen und zeigt, ob sie zusammen eine Mehrheit im Bundestag erreichen. Parteien unter der 5-%-Hürde bleiben dabei unberücksichtigt, da sie ohne Grundmandate nicht in den Bundestag einziehen würden.",
  archiv: "Das Archiv enthält alle erfassten Bundestags-Umfragen seit 2017 – weit über das rund 90-tägige Fenster von dawum.de hinaus, weil wir die Umfragen fortlaufend speichern. Du kannst nach Institut und Zeitraum filtern, nach jeder Partei sortieren, einzelne Umfragen im Detail öffnen und den gesamten Datensatz als CSV oder JSON exportieren.",
  wahlen: "Diese Übersicht zeigt die amtlichen Endergebnisse der Bundestagswahl (Zweitstimmenanteile je Partei), festgestellt von Die Bundeswahlleiterin. Anders als die Sonntagsfrage sind das keine Umfragen, sondern das tatsächliche Wahlergebnis – die Bezugsgröße, an der sich die Umfragen messen lassen. Im Wahltrend sind dieselben Werte zusätzlich als Markierung am Wahltag eingezeichnet.",
};

export interface FaqItem {
  question: string;
  answer: string;
}

/** Home-page FAQ — rendered visibly and as FAQPage JSON-LD. */
export const FAQ: FaqItem[] = [
  {
    question: "Was ist die Sonntagsfrage?",
    answer:
      "Die Sonntagsfrage erhebt, welche Partei die Befragten wählen würden, wenn am kommenden Sonntag Bundestagswahl wäre. Sie ist eine Momentaufnahme der Stimmung, keine Wahlprognose.",
  },
  {
    question: "Woher stammen die Umfragedaten?",
    answer:
      "Alle Umfragen werden über die offene Datenbank dawum.de bezogen, die die veröffentlichten Ergebnisse der Meinungsforschungsinstitute zusammenträgt. Die Daten stehen unter der Open Database License (ODbL). Wir erheben selbst keine Umfragen.",
  },
  {
    question: "Wie aktuell sind die Daten?",
    answer:
      "Ein Hintergrundprozess gleicht stündlich mit dawum.de ab und übernimmt neue Umfragen, sobald sie veröffentlicht sind. Der Stand jeder Seite ist oben mit Datum und Uhrzeit angegeben.",
  },
  {
    question: "Welche Institute sind enthalten?",
    answer:
      "Unter anderem INSA, Forsa, Verian (früher Emnid/Kantar), Infratest dimap, die Forschungsgruppe Wahlen, YouGov, Allensbach, Ipsos und GMS – also die etablierten deutschen Meinungsforschungsinstitute.",
  },
  {
    question: "Ist das eine Wahlprognose?",
    answer:
      "Nein. Durchschnittswerte, Trends, Sitzverteilungen und Koalitionsrechnungen sind eigene, vereinfachte Auswertungen öffentlich verfügbarer Umfragen und stellen keine Wahlprognose und keine wissenschaftliche Aussage dar.",
  },
];

/* --------------------------------------------------------------------------
 * Schema.org JSON-LD builders. Each returns a plain object to be serialized
 * inside a <script type="application/ld+json"> (see <JsonLd>).
 * ------------------------------------------------------------------------ */

export function organizationLd() {
  return {
    "@type": "Organization",
    "@id": absoluteUrl("/#organization"),
    name: SITE_NAME,
    url: SITE_URL,
  };
}

export function websiteLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": absoluteUrl("/#website"),
    name: SITE_NAME,
    url: SITE_URL,
    inLanguage: "de-DE",
    description: DEFAULT_DESCRIPTION,
    publisher: organizationLd(),
  };
}

/** The aggregated polling data as a Schema.org Dataset (Google Dataset Search). */
export function datasetLd(options: {
  lastUpdate?: string | null;
  count?: number;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: "Sonntagsfrage Bundestagswahl – aggregierte Umfragen",
    description:
      "Historische und aktuelle Umfragen zur Sonntagsfrage für die Bundestagswahl, aggregiert aus den Veröffentlichungen der deutschen Meinungsforschungsinstitute.",
    url: absoluteUrl("/archiv"),
    inLanguage: "de-DE",
    keywords: KEYWORDS,
    license: "https://opendatacommons.org/licenses/odbl/1-0/",
    isAccessibleForFree: true,
    creator: organizationLd(),
    ...(options.lastUpdate ? { dateModified: options.lastUpdate } : {}),
    distribution: [
      {
        "@type": "DataDownload",
        encodingFormat: "application/json",
        contentUrl: absoluteUrl("/api/surveys"),
      },
      {
        "@type": "DataDownload",
        encodingFormat: "text/csv",
        contentUrl: absoluteUrl("/api/surveys?format=csv"),
      },
    ],
  };
}

export function faqLd(items: FaqItem[] = FAQ) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
}

export function breadcrumbLd(trail: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: absoluteUrl(c.path),
    })),
  };
}
