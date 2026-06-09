"use client";

import { useId, useRef, useState } from "react";
import { t } from "@/i18n";
import { REPORT_CATEGORIES } from "@/lib/report/validate";

type Status = "idle" | "sending" | "success" | "error";

/**
 * "Problem melden" footer entry: a button that opens a native <dialog> modal
 * with the report form. Native <dialog> gives us focus trapping, Esc-to-close
 * and a backdrop for free. The form POSTs JSON to /api/report; on success it
 * shows a confirmation. A hidden honeypot field traps naive bots (see the
 * route's `isHoneypotTripped`).
 */
export function ReportDialog() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const formId = useId();
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string>("");

  function open() {
    setStatus("idle");
    setError("");
    dialogRef.current?.showModal();
  }

  function close() {
    dialogRef.current?.close();
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
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
        return;
      }
      form.reset();
      setStatus("success");
    } catch {
      setError(t("report.error"));
      setStatus("error");
    }
  }

  const sending = status === "sending";

  return (
    <>
      <button
        type="button"
        onClick={open}
        className="font-medium text-brand-foreground underline underline-offset-2"
      >
        {t("report.trigger")}
      </button>

      <dialog
        ref={dialogRef}
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
            <p className="text-sm text-foreground">{t("report.success")}</p>
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

            {status === "error" && (
              <p role="alert" className="text-sm text-red-600 dark:text-red-400">
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
