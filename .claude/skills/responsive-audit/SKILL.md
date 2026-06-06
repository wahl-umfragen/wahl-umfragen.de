---
name: responsive-audit
description: 'Analyse or improve responsive / mobile layout in the wahlumfragen app. Use when asked to check, audit, or fix how the app looks on phones/tablets/narrow screens — horizontal overflow, breakpoints, the data tables and charts that are the real risk here, tap targets, the sticky header, or text wrapping. Knows this project uses Tailwind v4 with an inline (config-less) theme and is mobile-first, and how to drive real viewports for verification.'
---

# responsive-audit

Styling is **Tailwind v4 with an inline config** — there is **no
`tailwind.config.js`**. The theme lives in `src/app/globals.css`
(`@import "tailwindcss"`, `@theme inline { … }`, `@custom-variant dark`). Custom
tokens (colours, fonts) are defined there; breakpoints are the Tailwind defaults
(`sm` 640, `md` 768, `lg` 1024, `xl` 1280, `2xl` 1536) unless overridden in
`@theme`. Layout is **mobile-first**: base utility classes target the phone, and
`sm:`/`md:`/`lg:` prefixes scale **up**. The page container idiom is
`mx-auto max-w-6xl px-6`.

## Where responsive actually breaks in this app

This is a data-dense polling dashboard. The risk is almost never the prose — it's
the **wide tables and the measured charts**:

- **Data tables** — `institute-table.tsx`, `house-effects-table.tsx`,
  `survey-archive.tsx`, `sr-table.tsx`, `recent-surveys.tsx`. Many columns (one
  per party) → horizontal overflow on phones. Check they wrap in an
  `overflow-x-auto` container or collapse columns, and that nothing forces the
  page itself to scroll sideways.
- **Charts** — `poll-charts.tsx`, `trend-chart*.tsx`, `poll-dashboard*.tsx`.
  These are **client** components that measure their container width; verify they
  resize fluidly and don't assume a fixed desktop width. `fullscreenable.tsx`
  wraps some — check the fullscreen affordance works and is reachable on touch.
- **The sticky header** (`layout.tsx`) — `flex-wrap`, `SiteNav`, and a divider
  hidden below `sm` (`hidden sm:block`). Confirm the nav wraps cleanly and the
  sticky bar doesn't eat too much vertical space on short screens.

## The verification gap: Playwright runs Desktop-only

`playwright.config.ts` defines **one project, `Desktop Chrome`** — the e2e suite
does **not** exercise mobile viewports. So a responsive check must drive viewports
explicitly. Two options:

**1. Claude-in-Chrome browser tools (best for a visual audit).** Load them via
ToolSearch, then `navigate` to the route, `resize_window` to each width, and
`read_page`/screenshot to see overflow and wrapping. Test a representative set:

| Width | Stands in for |
|------:|---------------|
| 360–390 | small/most phones |
| 768  | tablet portrait / `md` edge |
| 1024 | tablet landscape / `lg` edge |
| 1280 | small desktop |

Run the app first (`npm run dev`, see the `local-dev` skill — needs a migrated,
**non-empty** DB or pages render blank). Look for: a horizontal scrollbar on
`<body>` (the classic overflow tell), tables clipped or pushing the layout,
chart labels colliding, tap targets < ~44px, the header nav overlapping.

**2. A throwaway Playwright check** for a deterministic overflow assertion, e.g.
`page.setViewportSize({ width: 360, height: 800 })` then assert
`document.scrollingElement.scrollWidth <= innerWidth`. If a responsive contract is
worth keeping, add a mobile project to `playwright.config.ts` (`devices['iPhone 13']`
etc.) rather than leaving it as a one-off.

## Making fixes (Tailwind v4, mobile-first)

- Write the **mobile** layout as the base classes; add `sm:`/`md:`/`lg:` only to
  enhance on wider screens. Don't write desktop-first with `max-*:` overrides —
  it fights the codebase's direction.
- Wide tables: prefer an `overflow-x-auto` scroll container (keeps all data) over
  hiding columns, unless a column is genuinely noise on mobile.
- Keep the `mx-auto max-w-6xl px-6` container rhythm; don't introduce a new
  max-width per page.
- New design tokens / breakpoints go in `@theme` in `globals.css` — there's no JS
  config to edit.
- Respect dark mode: it's **class-based** (`.dark`, via `next-themes`), so test
  fixes in both themes (`dark:` variant), not via OS `prefers-color-scheme`.
- Don't regress the skip-link / `sr-only` focus affordances in the header when
  reflowing it.

## Gotchas

- An **empty DB renders an empty UI** — if a page looks broken on mobile but it's
  actually just blank, that's missing data, not a layout bug. Ingest first (see
  `local-dev` / `ingest`).
- Charts are client components — a server-render screenshot won't show their final
  laid-out size; let them hydrate before judging.
- Verify visually at real widths before claiming a responsive fix works — a class
  change that "looks right" in the JSX often still overflows because of an inner
  table or a fixed chart width.
- Commit with the `commit-push` skill, `fix`/`feat`/`style` title (e.g.
  `fix(responsive): scroll-contain the institute table on phones`).
