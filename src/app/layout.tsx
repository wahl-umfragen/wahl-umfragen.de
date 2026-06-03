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
          <header className="sticky top-0 z-40 border-b border-brand-hover/40 bg-brand text-brand-foreground">
            <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-3">
              <h1 className="text-lg leading-none">
                <Link
                  href="/"
                  className="flex items-center gap-2.5 font-display font-extrabold uppercase tracking-[0.06em]"
                >
                  <Logo className="h-8 w-8 shrink-0 text-brand-foreground" />
                  {t("app.name")}
                </Link>
              </h1>
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
          <main className="flex-1">{children}</main>
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
              <nav className="flex gap-4">
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
