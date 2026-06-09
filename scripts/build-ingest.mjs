// Bundles the ingest entrypoint (scripts/ingest.ts) and all its local imports
// into a single CommonJS file at dist/ingest.cjs that the server runs with
// `node dist/ingest.cjs`. npm packages (pg, drizzle-orm, dotenv) stay external
// and resolve from the repo's node_modules at runtime — the server already has
// them for the Next app, so we don't ship a second copy.
//
// The `@/*` path alias is resolved via tsconfig.json (paths), so no separate
// alias config is needed here.
import { build } from "esbuild";

await build({
  // Both worker entrypoints: the hourly ingest and the staleness watchdog.
  entryPoints: {
    ingest: "scripts/ingest.ts",
    "check-ingest-health": "scripts/check-ingest-health.ts",
  },
  outdir: "dist",
  outExtension: { ".js": ".cjs" },
  bundle: true,
  platform: "node",
  target: "node22",
  format: "cjs",
  // Keep every node_module import as a runtime require; only our own
  // TypeScript sources get bundled.
  packages: "external",
  tsconfig: "tsconfig.json",
  sourcemap: true,
  logLevel: "info",
});
