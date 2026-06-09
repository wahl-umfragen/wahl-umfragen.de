/**
 * Server-side Cloudflare Turnstile verification for the problem-report form.
 * Turnstile is the bot gate for the one interactive endpoint on this otherwise
 * read-only site (see deploy/SECURITY.md — this is the "Turnstile, for later"
 * case becoming real).
 *
 * Config:
 *   TURNSTILE_SECRET             — server secret (enables verification)
 *   NEXT_PUBLIC_TURNSTILE_SITE_KEY — public site key (renders the widget)
 *
 * When TURNSTILE_SECRET is unset we skip verification so local dev / preview
 * work without Cloudflare — mirroring the SMTP "configured → enforce, else
 * no-op" pattern. In production (Cloudflare-fronted) set the secret to enforce.
 */

const SITEVERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/** True when a server secret is configured, i.e. verification is enforced. */
export function isTurnstileEnabled(): boolean {
  return Boolean(process.env.TURNSTILE_SECRET);
}

interface SiteverifyResponse {
  success?: boolean;
  "error-codes"?: string[];
}

/**
 * Verify a Turnstile token against Cloudflare's siteverify API. Returns true
 * when the challenge passed. When Turnstile isn't configured, returns true
 * (verification skipped). Fails *closed* on a missing token or a network/API
 * error — a bot gate that fails open is no gate.
 */
export async function verifyTurnstile(
  token: unknown,
  remoteIp?: string | null,
): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET;
  if (!secret) return true; // not configured → skip (dev/preview)
  if (typeof token !== "string" || token.length === 0) return false;

  try {
    const body = new URLSearchParams({ secret, response: token });
    if (remoteIp && remoteIp !== "unknown") body.set("remoteip", remoteIp);

    const res = await fetch(SITEVERIFY_URL, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body,
    });
    const data = (await res.json()) as SiteverifyResponse;
    return data.success === true;
  } catch (err) {
    console.error("[report] turnstile verification failed:", err);
    return false;
  }
}
