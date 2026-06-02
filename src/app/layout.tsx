import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SiteNav } from "@/components/site-nav";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Wahlumfragen Bundestag",
  description:
    "Aktuelle Sonntagsfrage zur Bundestagswahl, aggregiert aus Umfragen der großen deutschen Institute.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="de"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
        <header className="border-b border-zinc-200 dark:border-zinc-800">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-4">
            <h1 className="text-lg font-semibold tracking-tight">
              Wahlumfragen
            </h1>
            <SiteNav />
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer
          data-testid="site-footer"
          className="border-t border-zinc-200 dark:border-zinc-800"
        >
          <div className="mx-auto max-w-5xl px-6 py-4 text-xs text-zinc-600 dark:text-zinc-400">
            Daten:{" "}
            <a
              href="https://dawum.de/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              dawum.de
            </a>{" "}
            unter der{" "}
            <a
              href="https://opendatacommons.org/licenses/odbl/1-0/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              ODbL
            </a>
            .
          </div>
        </footer>
      </body>
    </html>
  );
}
