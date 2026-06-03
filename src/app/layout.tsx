import type { Metadata } from "next";
import Link from "next/link";
import { Archivo, IBM_Plex_Mono, Inter } from "next/font/google";
import { Analytics } from "@/components/analytics";
import { CookieBanner } from "@/components/cookie-banner";
import { Logo } from "@/components/logo";
import { SiteNav } from "@/components/site-nav";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { t } from "@/i18n";
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_TITLE,
  KEYWORDS,
  SITE_NAME,
  SITE_URL,
} from "@/lib/seo";
import "./globals.css";

// Body/UI: Inter. Display/headings: Archivo (a strong, slightly wide grotesque
// for the civic-bold wordmark and titles). Figures: IBM Plex Mono for crisp
// tabular alignment in the poll tables. None of these are the Next.js default
// (Geist), which was the whole point of the redesign.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: DEFAULT_TITLE,
    template: `%s · ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: KEYWORDS,
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: "politics",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "de_DE",
    url: SITE_URL,
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="de"
      suppressHydrationWarning
      className={`${inter.variable} ${archivo.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <ThemeProvider>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-brand focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-brand-foreground"
          >
            Zum Inhalt springen
          </a>
          <header className="sticky top-0 z-40 border-b border-brand-hover/40 bg-brand text-brand-foreground">
            <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-3">
              {/* Wordmark + home link. Intentionally NOT an <h1>: it repeats
                  on every page, so each page's own <h1> (PageHeader) stays the
                  unique, descriptive heading Google uses to tell views apart. */}
              <div className="text-lg leading-none">
                <Link
                  href="/"
                  aria-label={t("app.name")}
                  className="flex items-center gap-2.5 font-display font-extrabold uppercase tracking-[0.06em]"
                >
                  <Logo className="h-8 w-8 shrink-0 text-brand-foreground" />
                  {t("app.name")}
                </Link>
              </div>
              <div className="flex items-center gap-2">
                <SiteNav />
                <span
                  aria-hidden="true"
                  className="mx-1 hidden h-5 w-px bg-brand-foreground/20 sm:block"
                />
                <ThemeToggle />
              </div>
            </div>
          </header>
          <main id="main" className="flex-1">
            {children}
          </main>
          <footer
            data-testid="site-footer"
            className="mt-16 border-t-4 border-accent bg-brand text-brand-foreground"
          >
            <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-6 text-xs text-brand-foreground/75">
              <span>
                {t("footer.dataPrefix")}{" "}
                <a
                  href="https://dawum.de/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-brand-foreground underline underline-offset-2"
                >
                  dawum.de
                </a>{" "}
                {t("footer.license")}{" "}
                <a
                  href="https://opendatacommons.org/licenses/odbl/1-0/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-brand-foreground underline underline-offset-2"
                >
                  ODbL
                </a>
                . {t("footer.noWarranty")}
              </span>
              <nav className="flex items-center gap-4">
                <a
                  href="https://github.com/mike96841/wahlumfragen"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 font-medium text-brand-foreground underline underline-offset-2"
                >
                  <GitHubIcon className="h-4 w-4 shrink-0" />
                  {t("footer.github")}
                </a>
                <Link
                  href="/impressum"
                  className="font-medium text-brand-foreground underline underline-offset-2"
                >
                  {t("footer.impressum")}
                </Link>
                <Link
                  href="/datenschutz"
                  className="font-medium text-brand-foreground underline underline-offset-2"
                >
                  {t("footer.datenschutz")}
                </Link>
              </nav>
            </div>
          </footer>
          <CookieBanner />
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  );
}

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.42c.57.1.78-.25.78-.55v-2.1c-3.2.7-3.88-1.36-3.88-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.2 1.77 1.2 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.19-3.08-.12-.3-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.8 0c2.2-1.5 3.17-1.18 3.17-1.18.63 1.59.23 2.75.11 3.05.74.8 1.19 1.82 1.19 3.08 0 4.41-2.69 5.38-5.25 5.67.41.36.78 1.07.78 2.16v3.2c0 .31.2.66.79.55A11.5 11.5 0 0 0 12 .5Z" />
    </svg>
  );
}
