import nodemailer from "nodemailer";

/**
 * Operational alerting for the ingest worker: a best-effort email when an ingest
 * fails, surfaces data anomalies, or the data has gone stale. Reuses the same
 * SMTP_* config as the problem-report mailer and sends to REPORT_RECIPIENT_EMAIL.
 * When SMTP isn't configured it no-ops (and logs), so dev/preview ingests run
 * without mail credentials. Never throws — alerting must not break the ingest.
 */
export async function sendIngestAlert(subject: string, text: string): Promise<boolean> {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const to = process.env.REPORT_RECIPIENT_EMAIL;
  if (!host || !user || !pass || !to) {
    console.warn("[ingest] alert not sent (SMTP not configured):", subject);
    return false;
  }

  const port = Number(process.env.SMTP_PORT ?? "587");
  try {
    const transport = nodemailer.createTransport({
      host,
      port: Number.isFinite(port) ? port : 587,
      secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === "true" : port === 465,
      auth: { user, pass },
    });
    await transport.sendMail({
      from: process.env.SMTP_FROM ?? user,
      to,
      subject: `[Wahlumfragen Ingest] ${subject}`,
      text,
    });
    return true;
  } catch (err) {
    console.error("[ingest] failed to send alert email:", err);
    return false;
  }
}
