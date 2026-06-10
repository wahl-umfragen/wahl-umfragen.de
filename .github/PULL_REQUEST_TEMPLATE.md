<!-- Keep PRs focused: one intent per PR (matches the conventional-commit types). -->

## What & why

<!-- One or two sentences. What does this change and what problem does it solve? -->

## Which data path does this touch?

<!-- Tick all that apply — see AGENTS.md "Data flow". -->

- [ ] Ingest path (writes to Postgres)
- [ ] DB read path (frontend / cached loaders)
- [ ] Pure selectors / view model (`src/lib/dawum`)
- [ ] Ops / CI / deploy only
- [ ] None of the above

## Checklist

- [ ] `npm run typecheck` passes
- [ ] `npm run lint` and `npm run format:check` pass
- [ ] `npm test` passes (unit)
- [ ] E2E updated/added if a route or user flow changed
- [ ] Schema change? migration generated, inspected, and committed with the schema
- [ ] New DB read goes through a cached, `surveys`-tagged loader (no `force-dynamic` regressions)

## Notes for reviewers

<!-- Anything non-obvious: trade-offs, follow-ups, new env vars, required deploy steps. -->
