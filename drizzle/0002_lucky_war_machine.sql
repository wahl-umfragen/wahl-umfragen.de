CREATE TABLE "problem_reports" (
	"id" text PRIMARY KEY NOT NULL,
	"category" text NOT NULL,
	"message" text NOT NULL,
	"email" text,
	"page_url" text,
	"user_agent" text,
	"status" text DEFAULT 'new' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "problem_reports_created_idx" ON "problem_reports" USING btree ("created_at");