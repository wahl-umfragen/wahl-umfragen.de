# Project memory

Evolving project context, loaded at session start via `@MEMORY.md` in
`CLAUDE.md`. Stable architecture and conventions live in `AGENTS.md`; this file
is the short, living log of decisions and open threads. Keep entries terse and
prune them once they are resolved or absorbed into `AGENTS.md`.

## Decisions

- **License: MIT** — free to use/fork, copyright notice must be retained. The
  repo is intended to go public.
- **i18n is German-only.** The `en-US` catalog was removed; `t()` still accepts
  a `locale` arg so a second catalog can be added later.

## Conventions (quick pointers)

- Short UI strings go through `t()` → `src/i18n/de-DE.json`.
- Longer-form, indexable SEO prose lives in `src/lib/seo.ts`
  (`PAGE_META`, `PAGE_INTRO`, `FAQ`) — a deliberately separate home from the UI
  catalog. SeoSection **titles** belong here next to their `PAGE_INTRO` body.
- The legal pages (`impressum`, `datenschutz`) are intentionally inline German
  prose, not in the i18n catalog.

## Open threads

- **Untranslated-text cleanup (in progress).** Several hardcoded user-facing
  strings still bypass `t()` / `seo.ts`: `app/error.tsx` and `app/not-found.tsx`
  (don't even import `t`), the inline `SeoSection title="…"` props across the
  page routes, chart `aria-label`/screen-reader captions in
  `components/poll-charts.tsx` and `components/trend-chart.tsx`, and the change
  tooltips in `components/institute-table.tsx`. The 8× `"Startseite"` are inside
  `breadcrumbLd(...)` (JSON-LD, not visible UI) — lowest priority.
- **Ingest worker emits an error despite completing** — the run lands data but
  returns/logs an error; under investigation. Likely a post-commit best-effort
  step (revalidate POST / heartbeat / SMTP alert) rather than the upsert itself.
