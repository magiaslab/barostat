CREATE TABLE "events" (
	"id" text PRIMARY KEY NOT NULL,
	"game_id" text NOT NULL,
	"period" smallint NOT NULL,
	"team" text NOT NULL,
	"band" smallint NOT NULL,
	"outcome" smallint NOT NULL,
	"ts_client" bigint NOT NULL,
	"seq" integer NOT NULL,
	"deleted_at" bigint
);
--> statement-breakpoint
CREATE TABLE "games" (
	"id" text PRIMARY KEY NOT NULL,
	"opponent" text NOT NULL,
	"date" text NOT NULL,
	"venue" text NOT NULL,
	"competition" text NOT NULL,
	"created_at" bigint NOT NULL,
	"closed_at" bigint,
	"recorder_device_id" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE no action ON UPDATE no action;