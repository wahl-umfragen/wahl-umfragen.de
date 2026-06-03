"use client";

import { useRouter } from "next/navigation";

/**
 * Context-aware back navigation. The survey detail page (`/archiv/[id]`) is
 * reached from several places — the home "Letzte Umfragen" list, the archive
 * table, the trend chart, an institute page — so a hard-coded "back to archive"
 * link is wrong for every entry point except the archive itself.
 *
 * Instead we step back through history to wherever the user actually came from,
 * and fall back to `fallbackHref` only when there is no in-app history (e.g. the
 * page was opened directly via a shared link or a fresh tab).
 */
export function BackLink({
  fallbackHref,
  label,
  className = "",
}: {
  fallbackHref: string;
  label: string;
  className?: string;
}) {
  const router = useRouter();

  function handleBack() {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackHref);
    }
  }

  return (
    <button type="button" onClick={handleBack} className={className}>
      {label}
    </button>
  );
}
