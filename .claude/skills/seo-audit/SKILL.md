---
name: seo-audit
description: 'Analyse or improve the on-page/technical SEO of the wahlumfragen app. Use when asked to check, audit, or optimise SEO — titles/descriptions, canonicals, the one-<h1>-per-page rule, JSON-LD structured data, the sitemap/robots, OpenGraph/Twitter cards, or when adding a new route that must be indexable. Knows this project''s centralised SEO model (everything funnels through src/lib/seo.ts) and how it is verified (e2e/seo.spec.ts).'
---

# seo-audit

SEO here is **centralised and code-driven**, not scattered per-page strings. The
single source of truth is `src/lib/seo.ts`. Before changing anything, read it —
copy, canonical origin, keyword list, and every JSON-LD builder live there.

## The architecture (where each signal comes from)

- **`src/lib/seo.ts`** — `SITE_NAME`, `SITE_URL` (from `NEXT_PUBLIC_SITE_URL`,
  localhost fallback), `absoluteUrl()`, `DEFAULT_TITLE`/`DEFAULT_DESCRIPTION`,
  `KEYWORDS`, `buildMetadata()`, `PAGE_META`, `PAGE_INTRO`, the FAQ, and the
  Schema.org builders (`websiteLd`, `organizationLd`, `datasetLd`, `faqLd`,
  `breadcrumbLd`). **Add or edit SEO copy here**, not inline in pages and not in
  the i18n catalog (`de-DE.json`) — the prose is intentionally isolated.
- **`src/app/layout.tsx`** — site-wide `metadata`: `metadataBase`, the
  `%s · Wahlumfragen` title template, default OG/Twitter cards, `robots`,
  `lang="de"`, `locale: "de_DE"`. The header wordmark is a **`<Link>`, not an
  `<h1>`** — deliberate, so each page's own `<h1>` stays unique.
- **Per page** — each route exports `metadata` (or `generateMetadata` for
  dynamic routes) built via `buildMetadata({ title, description, path })`, which
  fills the canonical + OG + Twitter from one title/description. Detail pages
  (`archiv/[id]`, `institut/[id]`, `laender/[land]`) generate it from data.
- **Structured data** — rendered through `<JsonLd>` (`src/components/json-ld.tsx`)
  using the builders from `seo.ts`. Most pages already emit one.
- **File-based metadata** — `robots.ts`, `sitemap.ts`, `opengraph-image.tsx`
  (root + `archiv/[id]` + `institut/[id]`), `icon.svg`. The sitemap is generated
  from the **cached** `loadBundestagData()` loader, so it regenerates on ingest
  revalidation and stays cheap.

## The rule that's easy to break: one descriptive `<h1>` per page

Every top-level view must read to Google as its own page: **exactly one `<h1>`**,
carrying that view's unique title (via `PageHeader`), never the shared wordmark.
A second `<h1>`, a missing one, or a duplicated title across pages is a
regression. This is enforced by **`e2e/seo.spec.ts`** (`PAGES` list) — it asserts
one `<h1>` with the expected text and a self-referencing canonical per route.

## Auditing the current state

```bash
npm run test:e2e -- seo            # the deterministic SEO contract (no DB needed)
```

For a live look at the rendered head/structured data, build and inspect:

```bash
npm run build && npm run start     # needs a migrated, ingested DB (see local-dev)
```

Then check a route's `<head>`, canonical, and JSON-LD — via `curl -s URL` and
reading the `<head>`, or the Claude-in-Chrome browser tools (navigate +
`get_page_text`/`read_page`) to confirm titles, one `<h1>`, canonical, OG tags,
and that `application/ld+json` parses. Validate structured data against
Google's Rich Results / Schema.org expectations (Dataset, FAQPage, BreadcrumbList,
WebSite are the types in use).

Things worth checking in an audit:

- **Title/description length** — titles ≤ ~60 chars, descriptions ≤ ~160 (the
  `PAGE_META` comment states this). Flag truncation risk.
- **Canonical** is self-referencing and absolute (resolved via `metadataBase`).
- **No duplicate titles/descriptions** across distinct views.
- **`NEXT_PUBLIC_SITE_URL` is set in production** — otherwise every absolute URL
  (canonical, OG, sitemap) falls back to `localhost`. A frequent prod-only bug.
- **Sitemap** covers all indexable routes and **robots** keeps `/api/` out.
- **JSON-LD** is present, valid, and `@id`/`url` values use `absoluteUrl()`.

## When you add a new indexable route — the full checklist

1. Add its copy to `PAGE_META` (and `PAGE_INTRO` if it has intro prose) in
   `src/lib/seo.ts`.
2. Export `metadata`/`generateMetadata` from the page via `buildMetadata({ … })`.
3. Render a single descriptive `<h1>` (use `PageHeader`) — not a second one.
4. Add a `<JsonLd>` block if a relevant Schema.org type applies.
5. Add the route to **`sitemap.ts`** (static entry, or generated from data like
   the institute/survey entries).
6. Add it to the `PAGES` list in **`e2e/seo.spec.ts`** so the one-`<h1>` +
   canonical contract covers it.
7. `npm run test:e2e -- seo` to prove it.

## Gotchas

- SEO copy is **German** (the audience is German); keep new copy in German and in
  `seo.ts`, consistent with the existing tone.
- Don't move page routes to `force-dynamic` to "freshen" metadata — metadata and
  the sitemap already regenerate on the `surveys` cache revalidation (see
  AGENTS.md). Breaking the cache to fix SEO is the wrong trade.
- The OG images are **file-based** (`opengraph-image.tsx`), not URLs in metadata —
  edit those files to change the card image; don't add an `images:` URL that
  shadows them.
- Commit SEO changes with the `commit-push` skill, `feat`/`fix`/`chore` title
  (e.g. `feat(seo): add BreadcrumbList to institute pages`).
