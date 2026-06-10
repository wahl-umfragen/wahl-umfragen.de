import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Seite nicht gefunden",
  robots: { index: false, follow: true },
};

/**
 * Branded 404. Reached via `notFound()` (e.g. an unknown survey or institute
 * id) and for any unmatched route. `noindex` so search engines don't list it.
 */
export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-20 text-center">
      <div
        aria-hidden="true"
        className="mx-auto mb-4 h-1 w-12 rounded-full bg-accent"
      />
      <p className="font-display text-5xl font-extrabold tracking-tight text-muted">
        404
      </p>
      <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
        Seite nicht gefunden
      </h1>
      <p className="mx-auto mt-3 max-w-md text-muted">
        Diese Seite gibt es nicht (mehr). Vielleicht hilft einer dieser Links:
      </p>
      <nav className="mt-6 flex flex-wrap justify-center gap-3 text-sm font-semibold">
        <Link
          href="/"
          className="rounded-md bg-brand px-4 py-2 text-brand-foreground transition-colors hover:bg-brand-hover"
        >
          Sonntagsfrage
        </Link>
        <Link
          href="/trend"
          className="rounded-md border border-border-strong px-4 py-2 transition-colors hover:bg-surface-2"
        >
          Wahltrend
        </Link>
        <Link
          href="/archiv"
          className="rounded-md border border-border-strong px-4 py-2 transition-colors hover:bg-surface-2"
        >
          Archiv
        </Link>
      </nav>
    </div>
  );
}
