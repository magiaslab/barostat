import { describe, expect, test } from "vitest";

import {
  cellCount,
  formatFreeThrows,
  formatPercent,
  freeThrows,
  gridCounts,
  percent,
  pointsByBand,
  pointsByPeriod,
  pointsOf,
  score,
  teamStats,
  totalPoints,
  usedPeriods,
} from "./stats";
import type { Band, GameEvent, Outcome, Period, Team } from "./types";

let seq = 0;

function event(
  team: Team,
  band: Band,
  outcome: Outcome,
  extras: Partial<Pick<GameEvent, "period" | "deletedAt" | "syncedAt" | "gameId">> = {},
): GameEvent {
  seq += 1;
  return {
    id: `e${seq}`,
    gameId: extras.gameId ?? "g1",
    period: extras.period ?? 0,
    team,
    band,
    outcome,
    tsClient: seq,
    seq,
    deletedAt: extras.deletedAt ?? null,
    syncedAt: extras.syncedAt ?? null,
  };
}

/** Stesso seed del mockup: Q1 chiuso, Q2 in corso, 31–30. */
function mockupSeed(): GameEvent[] {
  const rows: [Period, Team, Band, Outcome][] = [
    [0, "us", 0, 2],
    [0, "them", 0, 2],
    [0, "us", 1, 2],
    [0, "them", 1, 3],
    [0, "us", 0, 2],
    [0, "them", 1, 2],
    [0, "us", 1, 2],
    [0, "them", 2, 2],
    [0, "us", 2, 2],
    [0, "them", 0, 2],
    [0, "us", 1, 1],
    [0, "us", 1, 1],
    [0, "them", 1, 2],
    [0, "us", 0, 3],
    [0, "them", 2, 2],
    [0, "us", 2, 3],
    [0, "them", 2, 3],
    [0, "us", 1, 2],
    [0, "them", 1, 1],
    [0, "us", 2, 0],
    [0, "us", 2, 0],
    [0, "them", 2, 0],
    [1, "us", 0, 3],
    [1, "them", 0, 2],
    [1, "us", 1, 2],
    [1, "them", 1, 2],
    [1, "us", 0, 2],
    [1, "them", 2, 2],
    [1, "us", 1, 1],
    [1, "us", 1, 1],
    [1, "them", 1, 3],
    [1, "us", 2, 2],
    [1, "them", 2, 2],
    [1, "them", 2, 0],
    [1, "them", 2, 0],
  ];
  return rows.map(([period, team, band, outcome]) =>
    event(team, band, outcome, { period }),
  );
}

describe("pointsOf", () => {
  test("l'esito coincide con i punti", () => {
    expect(pointsOf(3)).toBe(3);
    expect(pointsOf(2)).toBe(2);
    expect(pointsOf(1)).toBe(1);
    expect(pointsOf(0)).toBe(0);
  });
});

describe("nessun evento", () => {
  const none: GameEvent[] = [];

  test("griglia e totali a zero", () => {
    expect(gridCounts(none, "us")).toEqual({
      0: { 0: 0, 1: 0, 2: 0, 3: 0 },
      1: { 0: 0, 1: 0, 2: 0, 3: 0 },
      2: { 0: 0, 1: 0, 2: 0, 3: 0 },
    });
    expect(pointsByBand(none, "us")).toEqual({ 0: 0, 1: 0, 2: 0 });
    expect(totalPoints(none, "us")).toBe(0);
    expect(totalPoints(none, "them")).toBe(0);
    expect(score(none)).toEqual({ us: 0, them: 0 });
    expect(pointsByPeriod(none, "us")).toEqual({
      0: 0,
      1: 0,
      2: 0,
      3: 0,
      4: 0,
    });
    expect(cellCount(none, "us", 0, 3)).toBe(0);
  });

  test("tiri liberi 0/0", () => {
    expect(freeThrows(none, "us")).toEqual({
      made: 0,
      missed: 0,
      attempted: 0,
    });
    expect(formatFreeThrows(freeThrows(none, "them"))).toBe("0/0");
  });

  test("percentuali: divisione per zero → em dash", () => {
    expect(percent(0, 0)).toBeNull();
    expect(formatPercent(0, 0)).toBe("—");
    expect(teamStats(none, "us").percentsByBand).toEqual({
      0: "—",
      1: "—",
      2: "—",
    });
  });
});

describe("percent e formatPercent", () => {
  test("arrotonda come il mockup", () => {
    expect(percent(1, 3)).toBe(33);
    expect(formatPercent(1, 3)).toBe("33%");
    expect(percent(1, 2)).toBe(50);
    expect(percent(0, 10)).toBe(0);
    expect(formatPercent(0, 10)).toBe("0%");
  });

  test("totale zero non produce NaN né Infinity", () => {
    expect(percent(5, 0)).toBeNull();
    expect(formatPercent(5, 0)).toBe("—");
  });
});

describe("eventi singoli", () => {
  test("un 3P vale 3 e sta nella fascia giusta", () => {
    const events = [event("us", 2, 3)];
    expect(cellCount(events, "us", 2, 3)).toBe(1);
    expect(cellCount(events, "us", 0, 3)).toBe(0);
    expect(pointsByBand(events, "us")).toEqual({ 0: 0, 1: 0, 2: 3 });
    expect(totalPoints(events, "us")).toBe(3);
    expect(score(events)).toEqual({ us: 3, them: 0 });
  });

  test("TL sbagliato non aggiunge punti ma conta nel tentativo", () => {
    const events = [event("them", 1, 0)];
    expect(totalPoints(events, "them")).toBe(0);
    expect(freeThrows(events, "them")).toEqual({
      made: 0,
      missed: 1,
      attempted: 1,
    });
    expect(formatFreeThrows(freeThrows(events, "them"))).toBe("0/1");
  });

  test("un evento di una squadra non sporca l'altra", () => {
    const events = [event("us", 0, 2)];
    expect(totalPoints(events, "them")).toBe(0);
    expect(gridCounts(events, "them")[0][2]).toBe(0);
    const grid = gridCounts(events, "us");
    expect(cellCount(grid, 0, 2)).toBe(1);
  });
});

describe("filtri", () => {
  test("il periodo isola i totali; il punteggio di partita resta la somma", () => {
    const events = [
      event("us", 0, 3, { period: 0 }),
      event("us", 0, 2, { period: 1 }),
    ];
    expect(totalPoints(events, "us", 0)).toBe(3);
    expect(totalPoints(events, "us", 1)).toBe(2);
    expect(totalPoints(events, "us")).toBe(5);
    expect(pointsByPeriod(events, "us")[0]).toBe(3);
    expect(pointsByPeriod(events, "us")[1]).toBe(2);
    expect(pointsByPeriod(events, "us")[4]).toBe(0);
  });

  test("deletedAt esclude l'evento dal punteggio", () => {
    const events = [
      event("us", 0, 3),
      event("us", 0, 2, { deletedAt: 1 }),
    ];
    expect(totalPoints(events, "us")).toBe(3);
    expect(cellCount(events, "us", 0, 2)).toBe(0);
    expect(score(events).us).toBe(3);
  });

  test("eventi di due partite diverse non si sommano", () => {
    const events = [
      event("us", 0, 3, { gameId: "a" }),
      event("us", 0, 2, { gameId: "b" }),
    ];
    expect(totalPoints(events, "us", undefined, "a")).toBe(3);
    expect(totalPoints(events, "us", undefined, "b")).toBe(2);
    expect(score(events, "a")).toEqual({ us: 3, them: 0 });
    expect(cellCount(events, "us", 0, 3, undefined, "a")).toBe(1);
    expect(cellCount(events, "us", 0, 2, undefined, "a")).toBe(0);
  });
});

describe("seed del mockup 31–30", () => {
  const events = mockupSeed();

  test("il tabellone coincide con la somma degli eventi", () => {
    expect(score(events)).toEqual({ us: 31, them: 30 });
    const byPeriodUs = pointsByPeriod(events, "us");
    const byPeriodThem = pointsByPeriod(events, "them");
    expect(byPeriodUs[0] + byPeriodUs[1]).toBe(31);
    expect(byPeriodThem[0] + byPeriodThem[1]).toBe(30);
  });

  test("punti per fascia e TL del Q1 NOI", () => {
    expect(pointsByBand(events, "us", 0)).toEqual({ 0: 7, 1: 8, 2: 5 });
    expect(totalPoints(events, "us", 0)).toBe(20);
    expect(freeThrows(events, "us", 0)).toEqual({
      made: 2,
      missed: 2,
      attempted: 4,
    });
    expect(formatFreeThrows(freeThrows(events, "us", 0))).toBe("2/4");
  });

  test("percentuali di fascia sulla partita NOI", () => {
    const stats = teamStats(events, "us");
    expect(stats.total).toBe(31);
    expect(stats.pointsByBand).toEqual({ 0: 12, 1: 12, 2: 7 });
    expect(stats.percentsByBand[0]).toBe("39%");
    expect(stats.percentsByBand[1]).toBe("39%");
    expect(stats.percentsByBand[2]).toBe("23%");
  });

  test("usedPeriods elenca solo i quarti con eventi live, in ordine", () => {
    expect(usedPeriods(events)).toEqual([0, 1]);
    expect(
      usedPeriods([
        ...events,
        event("us", 0, 2, { period: 3, deletedAt: 1 }),
      ]),
    ).toEqual([0, 1]);
  });
});
