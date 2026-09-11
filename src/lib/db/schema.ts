import { bigint, integer, pgTable, smallint, text } from "drizzle-orm/pg-core";

export const games = pgTable("games", {
  id: text("id").primaryKey(),
  opponent: text("opponent").notNull(),
  date: text("date").notNull(),
  venue: text("venue").notNull(),
  competition: text("competition").notNull(),
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
  closedAt: bigint("closed_at", { mode: "number" }),
  /** Solo UX locale (quale tablet ha la griglia). Non è autorità di scrittura. */
  recorderDeviceId: text("recorder_device_id").notNull(),
  /** Email della sessione Auth.js che può scrivere eventi su questa partita. */
  recorderUserId: text("recorder_user_id"),
});

export const events = pgTable("events", {
  id: text("id").primaryKey(),
  gameId: text("game_id")
    .notNull()
    .references(() => games.id),
  period: smallint("period").notNull(),
  team: text("team").notNull(),
  band: smallint("band").notNull(),
  outcome: smallint("outcome").notNull(),
  tsClient: bigint("ts_client", { mode: "number" }).notNull(),
  seq: integer("seq").notNull(),
  deletedAt: bigint("deleted_at", { mode: "number" }),
});
