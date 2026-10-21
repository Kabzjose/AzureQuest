CREATE TABLE IF NOT EXISTS "attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"scenario_id" uuid NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"score" real
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "concepts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"domain" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"summary" text NOT NULL,
	"learn_url" text NOT NULL,
	"analogy_base" text NOT NULL,
	"analogy_base_sw" text,
	CONSTRAINT "concepts_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "decision_responses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"attempt_id" uuid NOT NULL,
	"decision_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"scenario_id" uuid NOT NULL,
	"selected_option_ids" json NOT NULL,
	"is_correct" boolean NOT NULL,
	"partial_score" real NOT NULL,
	"mistake_tags" json NOT NULL,
	"optional_reasoning" text,
	"from_verified_scenario" boolean DEFAULT true NOT NULL,
	"answered_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "decisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scenario_id" uuid NOT NULL,
	"prompt" text NOT NULL,
	"type" varchar(10) NOT NULL,
	"options" json NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "flashcard_states" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"concept_id" uuid NOT NULL,
	"box" integer DEFAULT 1 NOT NULL,
	"next_review_at" timestamp with time zone NOT NULL,
	"times_correct" integer DEFAULT 0 NOT NULL,
	"times_wrong" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "misconception_stats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"concept_pair" varchar(73) NOT NULL,
	"count" integer DEFAULT 1 NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "refresh_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone,
	CONSTRAINT "refresh_tokens_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "scenarios" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"domains" json NOT NULL,
	"title" varchar(255) NOT NULL,
	"story" text NOT NULL,
	"context" varchar(255) NOT NULL,
	"requirements" json NOT NULL,
	"difficulty" integer NOT NULL,
	"concept_ids" json NOT NULL,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"ai_generated" boolean DEFAULT false NOT NULL,
	"verified" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tutor_cache" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cache_key" text NOT NULL,
	"response" json NOT NULL,
	"language" varchar(5) DEFAULT 'en' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tutor_cache_cache_key_unique" UNIQUE("cache_key")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255),
	"password_hash" text,
	"is_guest" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_active_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "attempts_user_created_idx" ON "attempts" ("user_id","started_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "dr_user_created_idx" ON "decision_responses" ("user_id","answered_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "dr_attempt_idx" ON "decision_responses" ("attempt_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "decisions_scenario_idx" ON "decisions" ("scenario_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "fs_user_concept_uniq" ON "flashcard_states" ("user_id","concept_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "fs_user_idx" ON "flashcard_states" ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "ms_user_pair_uniq" ON "misconception_stats" ("user_id","concept_pair");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ms_user_idx" ON "misconception_stats" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "rt_user_idx" ON "refresh_tokens" ("user_id");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "attempts" ADD CONSTRAINT "attempts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "attempts" ADD CONSTRAINT "attempts_scenario_id_scenarios_id_fk" FOREIGN KEY ("scenario_id") REFERENCES "scenarios"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "decision_responses" ADD CONSTRAINT "decision_responses_attempt_id_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "attempts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "decision_responses" ADD CONSTRAINT "decision_responses_decision_id_decisions_id_fk" FOREIGN KEY ("decision_id") REFERENCES "decisions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "decision_responses" ADD CONSTRAINT "decision_responses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "decision_responses" ADD CONSTRAINT "decision_responses_scenario_id_scenarios_id_fk" FOREIGN KEY ("scenario_id") REFERENCES "scenarios"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "decisions" ADD CONSTRAINT "decisions_scenario_id_scenarios_id_fk" FOREIGN KEY ("scenario_id") REFERENCES "scenarios"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "flashcard_states" ADD CONSTRAINT "flashcard_states_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "flashcard_states" ADD CONSTRAINT "flashcard_states_concept_id_concepts_id_fk" FOREIGN KEY ("concept_id") REFERENCES "concepts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "misconception_stats" ADD CONSTRAINT "misconception_stats_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
