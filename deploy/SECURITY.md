# Edge protection: Cloudflare + locked-down origin

This documents the bot / DDoS protection for wahlumfragen. The site is
**read-only** — static pages plus a public read API (`/api/surveys`) and one
secret-gated POST (`/api/revalidate`) the local ingest worker calls. There are
**no forms, no logins, no user submissions**, so the protection that matters is
*edge caching + DDoS mitigation + a hidden origin*, **not** a CAPTCHA (there is
no interactive endpoint for one to guard — see "Turnstile, for later").

The strategy, in order of impact:

1. **Cloudflare in front** — free L3/L4 DDoS mitigation + aggressive edge caching
   so floods are absorbed at the edge and barely reach the origin.
2. **Hide the origin behind a `cloudflared` tunnel** — the server has *no* public
   inbound port; the origin IP can't be hit directly, so the edge can't be
   bypassed.
3. **Edge L7 rules** — rate limiting on the API, bot mode, WAF.
4. **App-side headers** (already shipped in `next.config.ts`) as defense in depth.

---

## 1. Put the domain behind Cloudflare

1. Add the domain to a (free) Cloudflare account; switch the registrar's
   nameservers to the ones Cloudflare assigns.
2. Ensure the DNS records for the app are **proxied** (orange cloud), not
   "DNS only". Proxied = traffic flows through Cloudflare = DDoS protection +
   caching + WAF apply. With the tunnel below, the record is created for you.
3. SSL/TLS mode: **Full (strict)**. Cloudflare terminates TLS at the edge and
   re-encrypts to the origin; "strict" requires a valid origin cert (the tunnel
   provides this automatically).

The free plan already includes **unmetered L3/L4 DDoS mitigation** — no config
needed for volumetric attacks.

## 2. Hide the origin behind a `cloudflared` tunnel (chosen approach)

A tunnel means the Linux server opens an **outbound** connection to Cloudflare
and never exposes 80/443 publicly. Attackers can't find or hit the origin IP,
so they can't bypass the edge. Free.

On the server (same host that runs Postgres + `next start`):

```bash
# Install cloudflared (Debian/Ubuntu example)
curl -fsSL https://pkg.cloudflare.com/cloudflare-main.gpg \
  | sudo tee /usr/share/keyrings/cloudflare-main.gpg >/dev/null
echo "deb [signed-by=/usr/share/keyrings/cloudflare-main.gpg] \
  https://pkg.cloudflare.com/cloudflared any main" \
  | sudo tee /etc/apt/sources.list.d/cloudflared.list
sudo apt update && sudo apt install cloudflared

# Authenticate against your Cloudflare account (opens a browser URL once)
cloudflared tunnel login

# Create a named tunnel and route the hostname to it
cloudflared tunnel create wahlumfragen
cloudflared tunnel route dns wahlumfragen wahlumfragen.example.de
```

Config at `/etc/cloudflared/config.yml` — point the tunnel at the local Next
server (default `next start` port 3000):

```yaml
tunnel: wahlumfragen
credentials-file: /root/.cloudflared/<TUNNEL_ID>.json

ingress:
  - hostname: wahlumfragen.example.de
    service: http://localhost:3000
  - service: http_status:404
```

Run it as a service:

```bash
sudo cloudflared service install
sudo systemctl enable --now cloudflared
```

**Then close the public ports.** Since all inbound traffic now arrives via the
tunnel, the firewall can drop public 80/443 entirely:

```bash
sudo ufw default deny incoming
sudo ufw allow OpenSSH        # keep your own access
sudo ufw enable
# do NOT open 80/443 — the tunnel is outbound-only
```

> Postgres (`5432`) must never be public either — it's only reached by the local
> app and ingest worker on `localhost`. Keep the docker port binding on
> `127.0.0.1` and leave 5432 closed in the firewall.

## 3. Edge L7 rules (Cloudflare dashboard)

### 3a. Cache the read paths aggressively — the biggest DDoS lever

The pages are static (ISR) and `/api/surveys` already sends
`s-maxage=300, stale-while-revalidate=60`. Make the edge honor and extend that
so identical requests collapse to ~one origin hit per 5 min.

- **Caching → Cache Rules**, add a rule:
  - Match: `Hostname equals wahlumfragen.example.de`
  - Then: **Eligible for cache** (Cache Everything), **Edge TTL: respect origin**
    (falls back to the `s-maxage` we send).
- Optionally a second rule for `/api/surveys*` with a slightly longer edge TTL
  if you want the heavy CSV export to stick around longer.

Under a flood of `?format=csv`, this is what keeps the origin idle.

### 3b. Rate limiting on the API

**Security → WAF → Rate limiting rules** (free tier allows one rule):

- Match: `URI Path starts with /api/surveys`
- Counting: requests per **client IP**
- Threshold: e.g. **60 requests / 1 minute**
- Action: **Block** (or Managed Challenge) for 1 minute

This caps abusive scraping of the export without hurting normal use (the data
is ODbL and meant to be reused — the goal is to stop *abuse*, not access).

### 3c. Bot mitigation

- **Security → Bots → Bot Fight Mode**: on (free). Challenges known bad bots.
- On Pro: **Super Bot Fight Mode** for finer control (allow verified bots like
  search engines, challenge the rest).

### 3d. WAF managed rules

- **Security → WAF → Managed rules**: enable the Cloudflare Free Managed Ruleset.
  Low risk for a read-only site; blocks common automated exploit probes.

### 3e. Protect `/api/revalidate`

It's already gated by the `x-revalidate-secret` header and called only by the
**local** ingest worker. Best practice: have the worker POST to
`http://localhost:3000/api/revalidate` directly so the call never leaves the
host or traverses Cloudflare. As belt-and-suspenders, add a WAF custom rule:
**Block** `URI Path equals /api/revalidate` (external callers have no business
hitting it). Keep the secret regardless.

---

## 4. App-side headers (already shipped)

`next.config.ts` sets HSTS, `X-Content-Type-Options: nosniff`, `X-Frame-Options:
DENY`, `Referrer-Policy`, a minimal `Permissions-Policy`, and a
`frame-ancestors 'none'` CSP. These are defense in depth and are independent of
Cloudflare — verify them with:

```bash
curl -sI https://wahlumfragen.example.de | grep -iE 'strict-transport|x-content|x-frame|referrer|permissions|content-security'
```

---

## Turnstile, for later (NOT needed today)

A CAPTCHA only protects **interactive endpoints** — a form/submission a human
fills in. wahlumfragen has none, so there is nothing for hCaptcha or Turnstile
to guard right now; adding one would only add JS weight and a vendor dependency
for zero benefit.

**When that changes** (e.g. a contact form, a data-correction submission, an
email signup), add **Cloudflare Turnstile** rather than hCaptcha — it's the
direct hCaptcha equivalent, free, privacy-friendly, and integrates natively with
a Cloudflare-fronted site (no extra third party). Sketch:

1. Cloudflare dashboard → **Turnstile** → create a widget for the hostname.
   You get a **site key** (public) and **secret key** (server-side).
2. Store the secret as an env var (`TURNSTILE_SECRET`) — never commit it.
3. Render the widget on the form:

   ```tsx
   // in the form's client component
   <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />
   <div className="cf-turnstile" data-sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY} />
   ```

4. Verify the token server-side in the route handler **before** doing the work:

   ```ts
   const token = formData.get("cf-turnstile-response");
   const verify = await fetch(
     "https://challenges.cloudflare.com/turnstile/v0/siteverify",
     {
       method: "POST",
       headers: { "content-type": "application/json" },
       body: JSON.stringify({ secret: process.env.TURNSTILE_SECRET, response: token }),
     },
   ).then((r) => r.json());
   if (!verify.success) return Response.json({ error: "captcha failed" }, { status: 400 });
   ```

Until there's such an endpoint, leave this out.
