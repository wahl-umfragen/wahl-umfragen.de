CREATE TABLE "ingest_runs" (
	"id" text PRIMARY KEY NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"surveys_seen" integer DEFAULT 0 NOT NULL,
	"surveys_new" integer DEFAULT 0 NOT NULL,
	"surveys_updated" integer DEFAULT 0 NOT NULL,
	"error" text
);
--> statement-breakpoint
CREATE TABLE "institutes" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "methods" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "parliaments" (
	"id" text PRIMARY KEY NOT NULL,
	"shortcut" text NOT NULL,
	"name" text NOT NULL,
	"election" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "parties" (
	"id" text PRIMARY KEY NOT NULL,
	"shortcut" text NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "survey_results" (
	"survey_id" text NOT NULL,
	"party_id" text NOT NULL,
	"percent" real NOT NULL,
	CONSTRAINT "survey_results_survey_id_party_id_pk" PRIMARY KEY("survey_id","party_id")
);
--> statement-breakpoint
CREATE TABLE "surveys" (
	"id" text PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"parliament_id" text NOT NULL,
	"institute_id" text NOT NULL,
	"tasker_id" text,
	"method_id" text,
	"surveyed_persons" integer,
	"period_start" date,
	"period_end" date,
	"first_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "taskers" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "survey_results" ADD CONSTRAINT "survey_results_survey_id_surveys_id_fk" FOREIGN KEY ("survey_id") REFERENCES "public"."surveys"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "survey_results" ADD CONSTRAINT "survey_results_party_id_parties_id_fk" FOREIGN KEY ("party_id") REFERENCES "public"."parties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "surveys" ADD CONSTRAINT "surveys_parliament_id_parliaments_id_fk" FOREIGN KEY ("parliament_id") REFERENCES "public"."parliaments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "surveys" ADD CONSTRAINT "surveys_institute_id_institutes_id_fk" FOREIGN KEY ("institute_id") REFERENCES "public"."institutes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "surveys" ADD CONSTRAINT "surveys_tasker_id_taskers_id_fk" FOREIGN KEY ("tasker_id") REFERENCES "public"."taskers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "surveys" ADD CONSTRAINT "surveys_method_id_methods_id_fk" FOREIGN KEY ("method_id") REFERENCES "public"."methods"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "surveys_parliament_date_idx" ON "surveys" USING btree ("parliament_id","date");--> statement-breakpoint
CREATE INDEX "surveys_institute_date_idx" ON "surveys" USING btree ("institute_id","date");