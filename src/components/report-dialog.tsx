"use client";

import { useEffect, useId, useRef, useState } from "react";
import Script from "next/script";
import { t } from "@/i18n";
import { REPORT_CATEGORIES } from "@/lib/report/validate";

type Status = "idle" | "sending" | "success" | "error";

/** Minimal typing for the Turnstile JS API we use (explicit-render subset). */
interface TurnstileApi {
  render: (
    el: HTMLElement,
    opts: {
      sitekey: string;
      callback?: (token: string) => void;
      "expired-callback"?: () => void;
      "error-callback"?: () => void;
      theme?: "auto" | "light" | "dark";
    },
  ) => string;
  reset: (id?: string) => void;
}
declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const TURNSTILE_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js";

/**
 * "Problem melden" footer entry: a button that opens a native <dialog> modal
 * with the report form. Native <dialog> gives us focus trapping, Esc-to-close
 * and a backdrop for free. The form POSTs JSON to /api/report.
 *
 * Bot protection: when NEXT_PUBLIC_TURNSTILE_SITE_KEY is set, a Cloudflare
 * Turnstile widget is rendered and its token is required before submitting; the
 * route verifies it server-side (see deploy/SECURITY.md). When the key is unset
 * (dev/preview) the widget is skipped and the route doesn't enforce it. A hidden
 * honeypot field and a per-IP rate limit back this up.
 */
export function ReportDialog() {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  const dialogRef = useRef<HTMLDialogElement>(null);
  const widgetContainerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const formId = useId();

  const [isOpen, setIsOpen] = useState(false);
  const [scriptReady, setScriptReady] = useState(false);
  const [token, setToken] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  // Drive the native dialog from state so we can coordinate widget rendering.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  // Render the Turnstile widget only while the dialog is visible (Turnstile
  // needs a visible container). Render once, then reset on subsequent opens so
  // every submission gets a fresh single-use token.
  useEffect(() => {
    if (!isOpen || !scriptReady || !siteKey) return;
    const ts = window.turnstile;
    const el = widgetContainerRef.current;
    if (!ts || !el) return;
    if (widgetIdRef.current == null) {
      widgetIdRef.current = ts.render(el, {
        sitekey: siteKey,
        callback: (tok) => setToken(tok),
        "expired-callback": () => setToken(""),
        "error-callback": () => setToken(""),
        theme: "auto",
      });
    } else {
      ts.reset(widgetIdRef.current);
      setToken("");
    }
  }, [isOpen, scriptReady, siteKey]);

  function open() {
    setStatus("idle");
    setError("");
    setIsOpen(true);
  }

  function close() {
    setIsOpen(false);
  }

  function resetCaptcha() {
    if (widgetIdRef.current != null)
      window.turnstile?.reset(widgetIdRef.current);
    setToken("");
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);

    if (siteKey && !token) {
      setError(t("report.captchaRequired"));
      setStatus("error");
      return;
    }

    setStatus("sending");
    setError("");

    try {
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          category: data.get("category"),
          message: data.get("message"),
          email: data.get("email"),
          honeypot: data.get("website"),
          turnstileToken: token || undefined,
          pageUrl:
            typeof window !== "undefined" ? window.location.href : undefined,
        }),
      });
      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        setError(payload?.error ?? t("report.error"));
        setStatus("error");
        resetCaptcha();
        return;
      }
      form.reset();
      setStatus("success");
      resetCaptcha();
    } catch {
      setError(t("report.error"));
      setStatus("error");
      resetCaptcha();
    }
  }

  const sending = status === "sending";

  return (
    <>
      {siteKey && (
        <Script
          src={TURNSTILE_SRC}
          strategy="afterInteractive"
          onLoad={() => setScriptReady(true)}
          onReady={() => setScriptReady(true)}
        />
      )}

      <button
        type="button"
        onClick={open}
        data-testid="report-trigger"
        className="font-medium text-brand-foreground underline underline-offset-2"
      >
        {t("report.trigger")}
      </button>

      <dialog
        ref={dialogRef}
        onClose={() => setIsOpen(false)}
        data-testid="report-dialog"
        aria-labelledby={`${formId}-title`}
        className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-xl border border-border bg-surface p-0 text-foreground shadow-xl backdrop:bg-black/50"
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-4">
          <h2
            id={`${formId}-title`}
            className="font-display text-lg font-bold tracking-tight"
          >
            {t("report.title")}
          </h2>
          <button
            type="button"
            onClick={close}
            aria-label={t("report.close")}
            className="-mr-1 rounded-md p-1 text-muted transition-colors hover:bg-border/50 hover:text-foreground"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {status === "success" ? (
          <div className="px-6 py-8">
            <p data-testid="report-success" className="text-sm text-foreground">
              {t("report.success")}
            </p>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={close}
                className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground transition-colors hover:bg-brand-hover"
              >
                {t("report.close")}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
            <p className="text-sm text-muted">{t("report.intro")}</p>

            <div>
              <label
                htmlFor={`${formId}-category`}
                className="block text-sm font-medium text-foreground"
              >
                {t("report.categoryLabel")}
              </label>
              <select
                id={`${formId}-category`}
                name="category"
                defaultValue={REPORT_CATEGORIES[0]}
                required
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
              >
                {REPORT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {t(`report.categories.${c}`)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor={`${formId}-message`}
                className="block text-sm font-medium text-foreground"
              >
                {t("report.messageLabel")}{" "}
                <span aria-hidden="true" className="text-accent">
                  *
                </span>
              </label>
              <textarea
                id={`${formId}-message`}
                name="message"
                required
                maxLength={5000}
                rows={5}
                placeholder={t("report.messagePlaceholder")}
                className="mt-1 w-full resize-y rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
              />
            </div>

            <div>
              <label
                htmlFor={`${formId}-email`}
                className="block text-sm font-medium text-foreground"
              >
                {t("report.emailLabel")}
              </label>
              <input
                id={`${formId}-email`}
                name="email"
                type="email"
                maxLength={254}
                autoComplete="email"
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
              />
              <p className="mt-1 text-xs text-muted">{t("report.emailHint")}</p>
            </div>

            {/* Honeypot: hidden from humans, tempting to bots. Off-screen rather
                than display:none so simple bots still "see" it. */}
            <div aria-hidden="true" className="absolute -left-[9999px]">
              <label htmlFor={`${formId}-website`}>Website</label>
              <input
                id={`${formId}-website`}
                name="website"
                type="text"
                tabIndex={-1}
                autoComplete="off"
              />
            </div>

            {/* Cloudflare Turnstile widget mount point (only when configured). */}
            {siteKey && (
              <div ref={widgetContainerRef} className="min-h-[65px]" />
            )}

            {status === "error" && (
              <p
                role="alert"
                className="text-sm text-red-600 dark:text-red-400"
              >
                {error}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={close}
                className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-border/50"
              >
                {t("report.cancel")}
              </button>
              <button
                type="submit"
                disabled={sending}
                className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground transition-colors hover:bg-brand-hover disabled:opacity-60"
              >
                {sending ? t("report.sending") : t("report.submit")}
              </button>
            </div>
          </form>
        )}
      </dialog>
    </>
  );
}
