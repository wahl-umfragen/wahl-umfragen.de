"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { t } from "@/i18n";

const STORAGE_KEY = "cookie-notice-ack";

/**
 * Info-only notice (no consent gate): the site uses cookieless analytics
 * (Plausible) which needs no opt-in. The banner is a one-time informational
 * hint; dismissing it persists in localStorage so it stays hidden.
 *
 * Reads localStorage through useSyncExternalStore so the server snapshot is
 * always "acknowledged" (banner hidden) — this avoids a hydration mismatch and
 * a flash of the banner before the client store resolves. The banner then
 * appears on the client only if it has never been dismissed.
 */
function subscribe(onChange: () => void): () => void {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

function useAcknowledged(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => localStorage.getItem(STORAGE_KEY) === "1",
    () => true,
  );
}

export function CookieBanner() {
  const acknowledged = useAcknowledged();

  if (acknowledged) return null;

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    // useSyncExternalStore doesn't observe same-tab setItem; nudge a re-render.
    window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY }));
  };

  return (
    <div
      data-testid="cookie-banner"
      role="region"
      aria-label={t("cookie.text")}
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-surface/95 backdrop-blur"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-4 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-3xl">
          {t("cookie.text")}{" "}
          <Link href="/datenschutz" className="underline">
            {t("cookie.more")}
          </Link>
          .
        </p>
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 self-start rounded-md bg-brand px-4 py-2 font-semibold text-brand-foreground transition-colors hover:bg-brand-hover sm:self-auto"
        >
          {t("cookie.accept")}
        </button>
      </div>
    </div>
  );
}
