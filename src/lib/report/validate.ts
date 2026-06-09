/**
 * Pure validation + normalisation for a problem report submission. No DB, no
 * network, no email side effects — so it stays unit-testable (see the project's
 * "keep the transform pure" rule). The API route owns the side effects.
 */

/** Allowed report categories. Single source of truth — the i18n catalog mirrors
 * these ids under `report.categories.*` and the UI builds its <select> from them. */
export const REPORT_CATEGORIES = ["data", "bug", "other"] as const;

export type ReportCategory = (typeof REPORT_CATEGORIES)[number];

/** Upper bounds so a single submission can't store/email an unbounded blob. */
export const MAX_MESSAGE_LENGTH = 5000;
export const MAX_EMAIL_LENGTH = 254;

/** Cleaned, ready-to-persist report. `email` is null when not supplied. */
export interface ValidReport {
  category: ReportCategory;
  message: string;
  email: string | null;
}

export type ValidationResult =
  | { ok: true; value: ValidReport }
  | { ok: false; error: string };

/** Pragmatic email shape check — not RFC-perfect, just enough to reject junk. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isCategory(value: unknown): value is ReportCategory {
  return (
    typeof value === "string" &&
    (REPORT_CATEGORIES as readonly string[]).includes(value)
  );
}

/**
 * Validate and normalise raw (untrusted) report input. Returns the cleaned
 * report on success or a human-readable German error string on failure.
 */
export function validateReport(input: unknown): ValidationResult {
  if (typeof input !== "object" || input === null) {
    return { ok: false, error: "Ungültige Anfrage." };
  }
  const raw = input as Record<string, unknown>;

  if (!isCategory(raw.category)) {
    return { ok: false, error: "Bitte eine gültige Kategorie wählen." };
  }
  const category = raw.category;

  if (typeof raw.message !== "string") {
    return { ok: false, error: "Bitte eine Beschreibung angeben." };
  }
  const message = raw.message.trim();
  if (message.length === 0) {
    return { ok: false, error: "Bitte eine Beschreibung angeben." };
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return {
      ok: false,
      error: `Die Beschreibung darf höchstens ${MAX_MESSAGE_LENGTH} Zeichen lang sein.`,
    };
  }

  let email: string | null = null;
  if (raw.email != null && raw.email !== "") {
    if (typeof raw.email !== "string") {
      return { ok: false, error: "Ungültige E-Mail-Adresse." };
    }
    const trimmed = raw.email.trim();
    if (trimmed.length > MAX_EMAIL_LENGTH || !EMAIL_RE.test(trimmed)) {
      return { ok: false, error: "Ungültige E-Mail-Adresse." };
    }
    email = trimmed;
  }

  return { ok: true, value: { category, message, email } };
}

/**
 * Honeypot check. The form ships a hidden field a human never fills; a bot that
 * fills every input trips it. A tripped honeypot means "drop silently" — the
 * caller should pretend success so the bot gets no signal.
 */
export function isHoneypotTripped(honeypot: unknown): boolean {
  return typeof honeypot === "string" && honeypot.trim().length > 0;
}
