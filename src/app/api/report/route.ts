import { randomUUID } from "node:crypto";
import type { NextRequest } from "next/server";
import { db } from "@/db/client";
import { problemReports } from "@/db/schema";
import { sendReportEmail } from "@/lib/report/mailer";
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

// --- Per-IP rate limit (fixed window) -------------------------------------
// In-memory is fine for the single-server systemd deploy: it resets on restart
// and isn't shared across instances, but it blunts trivial floods. Pair with the
// edge rate limit (deploy/SECURITY.md) for anything serious.
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 10 * 60 * 1000;
const hits = new Map<string, { count: number; resetAt: number }>();

function rateLimited(ip: string, now: number): boolean {
  const entry = hits.get(ip);
  if (!entry || now >= entry.resetAt) {
    hits.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_LIMIT;
}

function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return req.headers.get("cf-connecting-ip") ?? "unknown";
}

export async function POST(req: NextRequest) {
  // crypto isn't deterministic; Date.now is fine here (not a cached render path).
  const now = Date.now();
  const ip = clientIp(req);
  if (rateLimited(ip, now)) {
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

  const pageUrl =
    typeof raw.pageUrl === "string" && raw.pageUrl.length <= MAX_PAGE_URL_LENGTH
      ? raw.pageUrl
      : null;
  const userAgent = req.headers.get("user-agent")?.slice(0, MAX_EMAIL_LENGTH * 2) ?? null;
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

  // Best-effort notification — the report is already saved, so don't fail on it.
  await sendReportEmail(report, { id, pageUrl, userAgent });

  return Response.json({ ok: true });
}
