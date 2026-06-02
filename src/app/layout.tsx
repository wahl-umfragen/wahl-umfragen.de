import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono, Source_Serif_4 } from "next/font/google";
import { Analytics } from "@/components/analytics";
import { CookieBanner } from "@/components/cookie-banner";
import { Logo } from "@/components/logo";
import { SiteNav } from "@/components/site-nav";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { t } from "@/i18n";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const serif = Source_Serif_4({
  variable: "--font-serif-editorial",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: t("app.metaTitle"),
  description: t("app.metaDescription"),
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
      className={`${geistSans.variable} ${geistMono.variable} ${serif.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <ThemeProvider>
          <header className="border-b border-zinc-200 dark:border-zinc-800">
            <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-4">
              <h1 className="flex items-center gap-2.5 text-lg font-semibold tracking-tight">
                <Logo className="h-7 w-7 shrink-0 text-foreground" />
                {t("app.name")}
              </h1>
              <div className="flex items-center gap-3">
                <SiteNav />
                <ThemeToggle />
              </div>
            </div>
          </header>
          <main className="flex-1">{children}</main>
          <footer
            data-testid="site-footer"
            className="border-t border-zinc-200 dark:border-zinc-800"
          >
            <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-4 text-xs text-zinc-600 dark:text-zinc-400">
              <span>
                {t("footer.dataPrefix")}{" "}
                <a
                  href="https://dawum.de/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  dawum.de
                </a>{" "}
                {t("footer.license")}{" "}
                <a
                  href="https://opendatacommons.org/licenses/odbl/1-0/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  ODbL
                </a>
                .
              </span>
              <nav className="flex gap-4">
                <Link href="/impressum" className="underline">
                  {t("footer.impressum")}
                </Link>
                <Link href="/datenschutz" className="underline">
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
