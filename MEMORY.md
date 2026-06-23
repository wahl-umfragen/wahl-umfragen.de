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

- _(none open.)_ Resolved:
  - **Untranslated-text cleanup — done.** `error.tsx`/`not-found.tsx`, the
    `SeoSection` titles (now `SEO_SECTION_TITLES` in `seo.ts`), chart
    `aria-label`s and the institute-table change tooltips all route through
    `t()` / `seo.ts`. The only hardcoded German left is the `breadcrumbLd(...)`
    `"Startseite"` JSON-LD label — intentional (non-visible structured data).
  - **Ingest worker "error" — explained.** It was the best-effort
    `/api/revalidate` POST failing while the app was unreachable; harmless and
    gone now that the app is deployed and reachable.
