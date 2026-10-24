ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "putback" boolean DEFAULT false NOT NULL;
