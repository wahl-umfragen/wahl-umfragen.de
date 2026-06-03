---
name: db-migrate
description: 'Change the Drizzle/Postgres schema safely — edit src/db/schema.ts, generate the SQL migration, inspect it, apply it, and commit schema + generated migration together. Invoke whenever a DB schema change is needed: adding/removing/renaming a table or column, changing types, indexes, or constraints. Encodes this project''s migration gotchas (single source of truth, never db:push, inspect before apply, chunk bulk inserts).'
---

# db-migrate

The schema is the single source of truth at `src/db/schema.ts`. Migrations live in
`drizzle/` (committed, generated — never hand-authored for new changes). Connection
is `DATABASE_URL` from `.env`. Drizzle config: `drizzle.config.ts` (`strict: true`,
`verbose: true`, dialect `postgresql`).

## Procedure

1. **Ensure a reachable DB.** Generation needs no DB, but `migrate` does. If Postgres
   isn't up: `npm run db:up` (docker compose `postgres`). Confirm `DATABASE_URL` is set
   (copy `.env.example` → `.env` if missing).

2. **Edit `src/db/schema.ts`.** Make the schema change there only — it is the source of
   truth. Match existing column/table naming and the surrounding style.

3. **Generate the migration:**
   ```bash
   npm run db:generate
   ```
   This writes a new `drizzle/NNNN_*.sql` plus updates `drizzle/meta/`. It does **not**
   touch the database.

4. **Inspect the generated SQL before applying.** Read the new `drizzle/NNNN_*.sql`.
   Verify it does what you intended and flag anything destructive (DROP COLUMN / DROP
   TABLE / type narrowing / NOT NULL on existing data). If the diff is wrong, fix
   `schema.ts` and regenerate rather than editing the SQL by hand.

5. **Apply it:**
   ```bash
   npm run db:migrate
   ```

6. **Verify** the app still typechecks and the schema import is consistent:
   ```bash
   npm run typecheck
   ```

7. **Commit schema + migration together.** The generated `drizzle/NNNN_*.sql`,
   `drizzle/meta/*`, and the `src/db/schema.ts` change belong in one commit. Use the
   `commit-push` skill with a `feat`/`refactor`/`fix` title (e.g.
   `feat: add survey.method_detail column`).

## Rules / gotchas

- **Never** use `drizzle-kit push` / a `db:push` shortcut to skip the migration file —
  migrations are committed history and the production worker relies on them.
- **Never** hand-edit a migration that has already been applied/committed; make a new
  schema change and generate a new migration instead.
- A **new column the ingest must populate** usually also needs an edit to
  `src/lib/ingest/transform.ts` (keep that transform pure — no DB) and possibly the
  read mapping in `src/lib/data/load.ts`. Check both paths before declaring done (see
  AGENTS.md "Data flow").
- **Postgres ~65k bind-parameter limit:** any `tx.insert(...).values([...])` over
  thousands of rows must chunk. Reuse `chunked()` in `src/lib/ingest/run.ts`.
- If a change requires backfilling existing rows, do it in the ingest/transform path or
  a one-off script — not by editing applied migrations.
