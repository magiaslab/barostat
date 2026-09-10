import { describe, expect, test } from "vitest";

import { parseSyncPayload, parseSyncSnapshot } from "./sync-payload";
import type { Game, GameEvent } from "./types";

const game: Game = {
  id: "g1",
  opponent: "Cernusco",
  date: "2026-09-10",
  venue: "home",
  competition: "cup",
  createdAt: 1,
  closedAt: null,
  recorderDeviceId: "dev-1",
};

const event: GameEvent = {
  id: "e1",
  gameId: "g1",
  period: 0,
  team: "us",
  band: 0,
  outcome: 3,
  tsClient: 1,
  seq: 1,
  deletedAt: null,
  syncedAt: null,
};

describe("parseSyncPayload", () => {
  test("accetta un batch valido", () => {
    expect(parseSyncPayload({ game, events: [event] })).toEqual({
      game,
      events: [event],
    });
  });

  test("accetta uno snapshot di lettura con più partite", () => {
    const other: Game = { ...game, id: "g2", opponent: "Seveso" };
    const otherEvent: GameEvent = { ...event, id: "e2", gameId: "g2" };
    expect(
      parseSyncSnapshot({
        games: [game, other],
        events: [event, otherEvent],
      }),
    ).toEqual({
      games: [game, other],
      events: [event, otherEvent],
    });
  });

  test("rifiuta snapshot senza games o con evento orfano", () => {
    expect(parseSyncSnapshot({ events: [event] })).toBeNull();
    expect(parseSyncSnapshot({ games: [game], events: [{ ...event, gameId: "altro" }] })).toBeNull();
  });

  test("rifiuta eventi di un'altra partita o campi fuori dominio", () => {
    expect(
      parseSyncPayload({ game, events: [{ ...event, gameId: "altro" }] }),
    ).toBeNull();
    expect(parseSyncPayload({ game, events: [{ ...event, band: 9 }] })).toBeNull();
    expect(parseSyncPayload({ game: { ...game, venue: "casa" }, events: [] })).toBeNull();
  });
});
