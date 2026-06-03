"use client";

import Link from "next/link";

/**
 * Route-level error boundary. Catches render/data errors (e.g. the DB being
 * unreachable at request time — `loadBundestagData` throws) and shows a branded
 * fallback with a retry instead of crashing to Next's default error page.
 * Kept dependency-light on purpose so the fallback itself can't easily fail.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-2xl px-6 py-20 text-center">
      <div aria-hidden="true" className="mx-auto mb-4 h-1 w-12 rounded-full bg-accent" />
      <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
        Etwas ist schiefgelaufen
      </h1>
      <p className="mx-auto mt-3 max-w-md text-muted">
        Die Daten konnten gerade nicht geladen werden. Bitte versuche es erneut –
        bleibt das Problem bestehen, schau später noch einmal vorbei.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground transition-colors hover:bg-brand-hover"
        >
          Erneut versuchen
        </button>
        <Link
          href="/"
          className="rounded-md border border-border-strong px-4 py-2 text-sm font-semibold transition-colors hover:bg-surface-2"
        >
          Zur Startseite
        </Link>
      </div>
      {error.digest ? (
        <p className="mt-6 font-mono text-xs text-muted">
          Referenz: {error.digest}
        </p>
      ) : null}
    </div>
  );
}
