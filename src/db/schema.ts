import {
  date,
  index,
  integer,
  pgTable,
  primaryKey,
  real,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const parliaments = pgTable("parliaments", {
  id: text("id").primaryKey(),
  shortcut: text("shortcut").notNull(),
  name: text("name").notNull(),
  election: text("election").notNull(),
});

export const institutes = pgTable("institutes", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
});

export const taskers = pgTable("taskers", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
});

export const methods = pgTable("methods", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
});

export const parties = pgTable("parties", {
  id: text("id").primaryKey(),
  shortcut: text("shortcut").notNull(),
  name: text("name").notNull(),
});

export const surveys = pgTable(
  "surveys",
  {
    id: text("id").primaryKey(),
    date: date("date").notNull(),
    parliamentId: text("parliament_id")
      .notNull()
      .references(() => parliaments.id),
    instituteId: text("institute_id")
      .notNull()
      .references(() => institutes.id),
    taskerId: text("tasker_id").references(() => taskers.id),
    methodId: text("method_id").references(() => methods.id),
    surveyedPersons: integer("surveyed_persons"),
    periodStart: date("period_start"),
    periodEnd: date("period_end"),
    firstSeenAt: timestamp("first_seen_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("surveys_parliament_date_idx").on(t.parliamentId, t.date),
    index("surveys_institute_date_idx").on(t.instituteId, t.date),
  ],
);

export const surveyResults = pgTable(
  "survey_results",
  {
    surveyId: text("survey_id")
      .notNull()
      .references(() => surveys.id, { onDelete: "cascade" }),
    partyId: text("party_id")
      .notNull()
      .references(() => parties.id),
    percent: real("percent").notNull(),
  },
  (t) => [primaryKey({ columns: [t.surveyId, t.partyId] })],
);

export const ingestRuns = pgTable("ingest_runs", {
  id: text("id").primaryKey(),
  startedAt: timestamp("started_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  // dawum's last_update.txt value at the time of this ingest. The worker
  // compares the live value against the newest stored one and skips the full
  // ingest when nothing changed (see runIngest's guard).
  dawumLastUpdate: timestamp("dawum_last_update", { withTimezone: true }),
  surveysSeen: integer("surveys_seen").notNull().default(0),
  surveysNew: integer("surveys_new").notNull().default(0),
  surveysUpdated: integer("surveys_updated").notNull().default(0),
  error: text("error"),
});

export type Parliament = typeof parliaments.$inferSelect;
export type Institute = typeof institutes.$inferSelect;
export type Tasker = typeof taskers.$inferSelect;
export type Method = typeof methods.$inferSelect;
export type Party = typeof parties.$inferSelect;
export type Survey = typeof surveys.$inferSelect;
export type SurveyResult = typeof surveyResults.$inferSelect;
export type IngestRun = typeof ingestRuns.$inferSelect;
