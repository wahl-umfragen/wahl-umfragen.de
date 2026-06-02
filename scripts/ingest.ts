import { pool } from "@/db/client";
import { runIngest } from "@/lib/ingest/run";

async function main() {
  console.log("[ingest] starting");
  try {
    const result = await runIngest();
    console.log(
      `[ingest] ok  seen=${result.surveysSeen}  new=${result.surveysNew}  updated=${result.surveysUpdated}  ${result.durationMs}ms  run=${result.runId}`,
    );
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error("[ingest] failed:", err);
  process.exit(1);
});
