import { desc, isNotNull } from "drizzle-orm";
import { db, pool } from "@/db/client";
import * as schema from "@/db/schema";
import { sendIngestAlert } from "@/lib/ingest/alert";

/**
 * Staleness watchdog for the ingest worker. Because a *skipped* run leaves no DB
 * trace (see AGENTS.md), the data's freshness is the newest stored
 * `dawum_last_update`, not the latest run row. If that value is missing or older
 * than the threshold, the worker is likely wedged (crash-looping, network down,
 * timer disabled) — so we alert. Intended for a daily systemd timer:
 *   node dist/check-ingest-health.cjs
 *
 * Threshold is INGEST_STALE_HOURS (default 12). dawum itself can legitimately go
 * quiet for a day or two, so keep it generous to avoid false alarms.
 */
const THRESHOLD_HOURS = Number(process.env.INGEST_STALE_HOURS ?? "12");

async function main() {
  try {
    const [row] = await db
      .select({ value: schema.ingestRuns.dawumLastUpdate })
      .from(schema.ingestRuns)
      .where(isNotNull(schema.ingestRuns.dawumLastUpdate))
      .orderBy(desc(schema.ingestRuns.dawumLastUpdate))
      .limit(1);

    if (!row?.value) {
      console.warn("[health] no ingest with a dawum_last_update found");
      await sendIngestAlert(
        "Kein Datenstand vorhanden",
        "Es wurde noch kein erfolgreicher Ingest mit dawum_last_update gefunden.",
      );
      return;
    }

    const ageHours = (Date.now() - row.value.getTime()) / 3_600_000;
    if (ageHours > THRESHOLD_HOURS) {
      const msg = `Letzter dawum-Stand ist ${ageHours.toFixed(1)} h alt (Schwelle ${THRESHOLD_HOURS} h, Stand ${row.value.toISOString()}).`;
      console.warn(`[health] STALE: ${msg}`);
      await sendIngestAlert("Datenstand veraltet", msg);
    } else {
      console.log(
        `[health] ok  dawum_last_update=${row.value.toISOString()}  age=${ageHours.toFixed(1)}h`,
      );
    }
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error("[health] failed:", err);
  process.exit(1);
});
