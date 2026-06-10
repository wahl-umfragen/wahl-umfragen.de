import { createHash, randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { db } from "@/db/client";
import { problemReports } from "@/db/schema";
import { sendReportConfirmation, sendReportEmail } from "@/lib/report/mailer";
import { verifyTurnstile } from "@/lib/report/turnstile";
import {
  isHoneypotTripped,
  MAX_EMAIL_LENGTH,
  validateReport,
} from "@/lib/report/validate";

/**
 * Problem-report intake. POST a JSON body and we persist it to `problem_reports`
 * (the durable record) and fire a best-effort SMTP notification on top.
 *
 *   POST /api/report
 *   { category, message, email?, pageUrl?, honeypot? }
 *
 * Hardening for a public, unauthenticated write endpoint:
 *  - a hidden `honeypot` field bots tend to fill → drop silently (fake 200);
 *  - per-IP fixed-window rate limit so it can't be flooded;
 *  - strict validation + length caps in `validateReport` (pure, unit-tested);
 *  - the email is best-effort: a mail failure still returns 200 because the
 *    report is already saved.
 */

/** Cap how much of the request body we'll even read (defense against huge POSTs). */
const MAX_BODY_BYTES = 16 * 1024;

/** Page URL is context only — keep it short, don't let it become an attack vector. */
const MAX_PAGE_URL_LENGTH = 512;

// --- Per-IP rate limit (fixed window, persisted in Postgres) ---------------
// DB-backed so it survives restarts and is shared across instances (the old
// in-memory map was neither). The client IP is hashed — the raw IP is never
// stored. Pair with the edge rate limit (deploy/SECURITY.md) for anything serious.
const RATE_LIMIT = 5;
const RATE_WINDOW = "10 minutes";

/**
 * Atomically bump the counter for this client and report whether it's now over
 * the limit. One upsert: a new key (or an expired window) resets to 1, otherwise
 * the count increments. Fails open (returns false) on a DB error so a transient
 * DB hiccup can't lock out a legitimate report.
 */
async function rateLimited(ip: string): Promise<boolean> {
  const key = createHash("sha256").update(ip).digest("hex");
  try {
    const { rows } = await db.execute(sql`
      INSERT INTO report_rate_limit (key, count, window_start)
      VALUES (${key}, 1, now())
      ON CONFLICT (key) DO UPDATE SET
        count = CASE
          WHEN report_rate_limit.window_start < now() - interval '${sql.raw(RATE_WINDOW)}'
          THEN 1 ELSE report_rate_limit.count + 1 END,
        window_start = CASE
          WHEN report_rate_limit.window_start < now() - interval '${sql.raw(RATE_WINDOW)}'
          THEN now() ELSE report_rate_limit.window_start END
      RETURNING count
    `);
    const count = Number(
      (rows[0] as { count: number } | undefined)?.count ?? 0,
    );
    return count > RATE_LIMIT;
  } catch (err) {
    console.error("[report] rate-limit check failed:", err);
    return false;
  }
}

function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return req.headers.get("cf-connecting-ip") ?? "unknown";
}

export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  if (await rateLimited(ip)) {
    return Response.json(
      { error: "Zu viele Meldungen. Bitte später erneut versuchen." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    const text = await req.text();
    if (text.length > MAX_BODY_BYTES) {
      return Response.json({ error: "Anfrage zu groß." }, { status: 413 });
    }
    body = JSON.parse(text);
  } catch {
    return Response.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }

  const raw = (typeof body === "object" && body ? body : {}) as Record<
    string,
    unknown
  >;

  // Honeypot tripped → act successful but persist nothing.
  if (isHoneypotTripped(raw.honeypot)) {
    return Response.json({ ok: true });
  }

  const result = validateReport(body);
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: 400 });
  }
  const report = result.value;

  // Bot gate: verify the Cloudflare Turnstile token. No-ops when Turnstile is
  // unconfigured (dev/preview); enforced in production (see deploy/SECURITY.md).
  const human = await verifyTurnstile(raw.turnstileToken, ip);
  if (!human) {
    return Response.json(
      { error: "Bot-Schutz-Prüfung fehlgeschlagen. Bitte erneut versuchen." },
      { status: 403 },
    );
  }

  const pageUrl =
    typeof raw.pageUrl === "string" && raw.pageUrl.length <= MAX_PAGE_URL_LENGTH
      ? raw.pageUrl
      : null;
  const userAgent =
    req.headers.get("user-agent")?.slice(0, MAX_EMAIL_LENGTH * 2) ?? null;
  const id = randomUUID();

  try {
    await db.insert(problemReports).values({
      id,
      category: report.category,
      message: report.message,
      email: report.email,
      pageUrl,
      userAgent,
    });
  } catch (err) {
    console.error("[report] failed to persist report:", err);
    return Response.json(
      { error: "Speichern fehlgeschlagen. Bitte später erneut versuchen." },
      { status: 500 },
    );
  }

  // Best-effort notification + reporter acknowledgement — the report is already
  // saved, so don't fail the request on a mail error. Run both concurrently.
  await Promise.all([
    sendReportEmail(report, { id, pageUrl, userAgent }),
    sendReportConfirmation(report),
  ]);

  return Response.json({ ok: true });
}
