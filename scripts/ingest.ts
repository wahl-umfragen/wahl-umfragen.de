import { pool } from "@/db/client";
import { runIngest } from "@/lib/ingest/run";

async function main() {
  const force = process.argv.includes("--force");
  console.log(`[ingest] starting${force ? " (force)" : ""}`);
  try {
    const result = await runIngest(undefined, { force });
    if (result.skipped) {
      console.log(
        `[ingest] no change  dawum_last_update=${result.dawumLastUpdate}  ${result.durationMs}ms`,
      );
    } else {
      console.log(
        `[ingest] ok  seen=${result.surveysSeen}  new=${result.surveysNew}  updated=${result.surveysUpdated}  ${result.durationMs}ms  run=${result.runId}`,
      );
      // New data landed — tell the running app to rebuild its cached pages.
      await triggerRevalidate();
    }
  } finally {
    await pool.end();
  }
}

/**
 * POST the app's revalidate endpoint so it busts the `surveys` cache tag.
 * Best-effort: the data is already committed, so a failure here only means the
 * frontend serves slightly stale pages until the next ingest. No-op (with a
 * log) when REVALIDATE_URL / REVALIDATE_SECRET aren't configured.
 */
async function triggerRevalidate() {
  const url = process.env.REVALIDATE_URL;
  const secret = process.env.REVALIDATE_SECRET;
  if (!url || !secret) {
    console.log(
      "[ingest] revalidate skipped (REVALIDATE_URL/REVALIDATE_SECRET unset)",
    );
    return;
  }
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "x-revalidate-secret": secret },
    });
    if (res.ok) {
      console.log("[ingest] revalidated frontend cache");
    } else {
      console.warn(
        `[ingest] revalidate failed: ${res.status} ${res.statusText}`,
      );
    }
  } catch (err) {
    console.warn(
      `[ingest] revalidate error: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}

main().catch((err) => {
  console.error("[ingest] failed:", err);
  process.exit(1);
});
