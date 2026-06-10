/**
 * Dead-man's-switch heartbeat for the ingest worker. The existing
 * `check-ingest-health.ts` watchdog is a *pull* check — it only runs if the
 * host and its timer are alive, so it can't catch a fully-dead box. This is the
 * complementary *push* side: every live ingest run (a real ingest OR a cheap
 * skip — both prove the worker is polling) pings an external monitor
 * (healthchecks.io, Uptime Kuma, ntfy, …). If those pings stop arriving, the
 * external service alerts — even when the whole server is down.
 *
 * Configured via HEALTHCHECK_PING_URL. No-op when unset, never throws — a
 * monitoring outage must never break the ingest.
 */

/**
 * For a healthchecks.io-style base URL, the failure signal is the same URL with
 * a `/fail` suffix. Pure so it can be unit-tested without a network call.
 */
export function failPingUrl(base: string): string {
  return `${base.replace(/\/+$/, "")}/fail`;
}

export async function pingHeartbeat(ok: boolean): Promise<void> {
  const base = process.env.HEALTHCHECK_PING_URL?.trim();
  if (!base) return;

  const url = ok ? base : failPingUrl(base);
  try {
    const res = await fetch(url, {
      method: "POST",
      // Don't let a hung monitor stall the worker.
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      console.warn(`[ingest] heartbeat ping non-ok: ${res.status} ${url}`);
    }
  } catch (err) {
    console.warn(
      `[ingest] heartbeat ping failed: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}
