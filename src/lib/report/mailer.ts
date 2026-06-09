import nodemailer from "nodemailer";
import type { ValidReport } from "./validate";

/**
 * SMTP notification for new problem reports. This is a *best-effort* layer on
 * top of the DB record (the durable source of truth lives in `problem_reports`).
 * When SMTP isn't configured we no-op so the app still works in dev/preview
 * without mail credentials.
 *
 * Required env to enable mail:
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, REPORT_RECIPIENT_EMAIL
 * Optional:
 *   SMTP_SECURE ("true" for implicit TLS / port 465), SMTP_FROM (envelope from;
 *   defaults to SMTP_USER).
 */

const CATEGORY_LABELS: Record<string, string> = {
  data: "Falsche/veraltete Daten",
  bug: "Anzeige-/Funktionsfehler",
  other: "Sonstiges",
};

interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
  to: string;
}

/** Read SMTP config from env, or null when it isn't fully configured. */
function readConfig(): SmtpConfig | null {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const to = process.env.REPORT_RECIPIENT_EMAIL;
  if (!host || !user || !pass || !to) return null;

  const port = Number(process.env.SMTP_PORT ?? "587");
  return {
    host,
    port: Number.isFinite(port) ? port : 587,
    // Implicit TLS on 465, STARTTLS otherwise. Override via SMTP_SECURE.
    secure: process.env.SMTP_SECURE
      ? process.env.SMTP_SECURE === "true"
      : port === 465,
    user,
    pass,
    from: process.env.SMTP_FROM ?? user,
    to,
  };
}

/** True when SMTP is configured (used by the route to decide whether to warn). */
export function isMailConfigured(): boolean {
  return readConfig() !== null;
}

/**
 * Send the report notification email. Resolves to `true` on success, `false`
 * when SMTP is unconfigured or sending failed. Never throws — the caller
 * treats mail as best-effort and the report is already persisted.
 */
export async function sendReportEmail(
  report: ValidReport,
  context: { id: string; pageUrl: string | null; userAgent: string | null },
): Promise<boolean> {
  const config = readConfig();
  if (!config) return false;

  const categoryLabel = CATEGORY_LABELS[report.category] ?? report.category;
  const lines = [
    `Neue Problemmeldung auf wahlumfragen`,
    ``,
    `Kategorie: ${categoryLabel}`,
    `Von: ${report.email ?? "(keine E-Mail angegeben)"}`,
    `Seite: ${context.pageUrl ?? "(unbekannt)"}`,
    `User-Agent: ${context.userAgent ?? "(unbekannt)"}`,
    `Report-ID: ${context.id}`,
    ``,
    `Beschreibung:`,
    report.message,
  ];

  try {
    const transport = transportFor(config);
    await transport.sendMail({
      from: config.from,
      to: config.to,
      // Let the operator reply straight to the reporter when they left an email.
      replyTo: report.email ?? undefined,
      subject: `[Wahlumfragen] Meldung: ${categoryLabel}`,
      text: lines.join("\n"),
    });
    return true;
  } catch (err) {
    console.error("[report] failed to send notification email:", err);
    return false;
  }
}

/**
 * Acknowledgement email to the reporter (only when they supplied an address and
 * SMTP is configured). Best-effort like `sendReportEmail`: never throws, returns
 * false when skipped or failed.
 */
export async function sendReportConfirmation(report: ValidReport): Promise<boolean> {
  if (!report.email) return false;
  const config = readConfig();
  if (!config) return false;

  const categoryLabel = CATEGORY_LABELS[report.category] ?? report.category;
  const lines = [
    "Danke für deine Meldung an wahlumfragen!",
    "",
    "Wir haben deinen Hinweis erhalten und schauen ihn uns an. Diese E-Mail",
    "dient nur der Bestätigung – du musst nichts weiter tun.",
    "",
    `Kategorie: ${categoryLabel}`,
    "",
    "Deine Nachricht:",
    report.message,
  ];

  try {
    const transport = transportFor(config);
    await transport.sendMail({
      from: config.from,
      to: report.email,
      subject: "Deine Meldung an Wahlumfragen ist eingegangen",
      text: lines.join("\n"),
    });
    return true;
  } catch (err) {
    console.error("[report] failed to send confirmation email:", err);
    return false;
  }
}

function transportFor(config: SmtpConfig) {
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: { user: config.user, pass: config.pass },
  });
}
