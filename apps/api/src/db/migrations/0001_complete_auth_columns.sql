ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "email" varchar(255),
  ADD COLUMN IF NOT EXISTS "password_hash" text,
  ADD COLUMN IF NOT EXISTS "last_active_at" timestamp with time zone DEFAULT now() NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "users_email_unique" ON "users" ("email");
