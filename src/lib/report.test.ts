import { describe, expect, test } from "vitest";

import { insight, periodRows, topBand } from "./report";
import { teamStats } from "./stats";
import type { Band, GameEvent, Outcome, Period, Team } from "./types";

let seq = 0;

function event(
  team: Team,
  band: Band,
  outcome: Outcome,
  extras: Partial<Pick<GameEvent, "period" | "deletedAt" | "gameId">> = {},
): GameEvent {
  seq += 1;
  return {
    id: `r${seq}`,
    gameId: extras.gameId ?? "g1",
    period: extras.period ?? 0,
    team,
    band,
    outcome,
    tsClient: seq,
    seq,
    deletedAt: extras.deletedAt ?? null,
    syncedAt: null,
  };
}

describe("insight", () => {
  test("con zero punti nostri non inventa una percentuale", () => {
    const none: GameEvent[] = [];
    const result = insight(teamStats(none, "us"), teamStats(none, "them"));
    expect(result.empty).toBe(true);
    expect(result.usShare).toBe("—");
    expect(result.themShare).toBe("—");
  });

  test("in caso di pareggio fra fasce prende la prima, come il mockup", () => {
    expect(topBand({ 0: 12, 1: 12, 2: 7 })).toBe(0);
    const events = [
      event("us", 0, 3),
      event("us", 0, 3),
      event("us", 0, 3),
      event("us", 0, 3),
      event("us", 1, 3),
      event("us", 1, 3),
      event("us", 1, 3),
      event("us", 1, 3),
      event("us", 2, 2),
      event("them", 0, 2),
    ];
    const result = insight(teamStats(events, "us"), teamStats(events, "them"));
    expect(result.empty).toBe(false);
    expect(result.band).toBe(0);
    expect(result.usShare).toBe("46%");
    expect(result.themShare).toBe("100%");
  });
});

describe("periodRows", () => {
  test("aggiunge sempre la riga Partita dopo i quarti usati", () => {
    const events = [
      event("us", 0, 3, { period: 0 }),
      event("us", 1, 2, { period: 2 }),
    ];
    const rows = periodRows(events, "us", (period) =>
      teamStats(events, "us", period),
    );
    expect(rows.map((row) => row.label)).toEqual(["Q1", "Q3", "Partita"]);
    expect(rows[2]?.total).toBe(5);
    expect(rows[2]?.highlight).toBe(false);
  });
});
