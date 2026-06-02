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
    }
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error("[ingest] failed:", err);
  process.exit(1);
});
