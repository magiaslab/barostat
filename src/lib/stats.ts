import {
  BANDS,
  PERIODS,
  type Band,
  type GameEvent,
  type Outcome,
  type Period,
  type Team,
} from "./types";

export type OutcomeCounts = { readonly [O in Outcome]: number };
export type GridCounts = { readonly [B in Band]: OutcomeCounts };

export type BandPoints = { readonly [B in Band]: number };
export type PeriodPoints = { readonly [P in Period]: number };

export type FreeThrows = {
  made: number;
  missed: number;
  attempted: number;
};

export type TeamStats = {
  grid: GridCounts;
  pointsByBand: BandPoints;
  total: number;
  percentsByBand: { readonly [B in Band]: string };
  freeThrows: FreeThrows;
};

export type Score = {
  us: number;
  them: number;
};

function emptyOutcomes(): { [O in Outcome]: number } {
  return { 0: 0, 1: 0, 2: 0, 3: 0 };
}

function emptyGrid(): { [B in Band]: { [O in Outcome]: number } } {
  return { 0: emptyOutcomes(), 1: emptyOutcomes(), 2: emptyOutcomes() };
}

function isLive(event: GameEvent): boolean {
  return event.deletedAt === null;
}

function matches(
  event: GameEvent,
  team: Team,
  period?: Period,
  gameId?: string,
): boolean {
  if (!isLive(event) || event.team !== team) return false;
  if (period !== undefined && event.period !== period) return false;
  if (gameId !== undefined && event.gameId !== gameId) return false;
  return true;
}

function isGrid(source: readonly GameEvent[] | GridCounts): source is GridCounts {
  return !Array.isArray(source);
}

/** L'esito è già il valore in punti: TL sbagliato vale 0. */
export function pointsOf(outcome: Outcome): number {
  return outcome;
}

function bandTotal(counts: OutcomeCounts): number {
  let total = 0;
  for (const outcome of [3, 2, 1, 0] as const) {
    total += counts[outcome] * pointsOf(outcome);
  }
  return total;
}

function pointsByBandFromGrid(grid: GridCounts): BandPoints {
  return {
    0: bandTotal(grid[0]),
    1: bandTotal(grid[1]),
    2: bandTotal(grid[2]),
  };
}

function freeThrowsFromGrid(grid: GridCounts): FreeThrows {
  let made = 0;
  let missed = 0;
  for (const band of BANDS) {
    made += grid[band][1];
    missed += grid[band][0];
  }
  return { made, missed, attempted: made + missed };
}

export function gridCounts(
  events: readonly GameEvent[],
  team: Team,
  period?: Period,
  gameId?: string,
): GridCounts {
  const grid = emptyGrid();

  for (const event of events) {
    if (!matches(event, team, period, gameId)) continue;
    grid[event.band][event.outcome] += 1;
  }

  return grid;
}

export function cellCount(
  grid: GridCounts,
  band: Band,
  outcome: Outcome,
): number;
export function cellCount(
  events: readonly GameEvent[],
  team: Team,
  band: Band,
  outcome: Outcome,
  period?: Period,
  gameId?: string,
): number;
export function cellCount(
  source: readonly GameEvent[] | GridCounts,
  teamOrBand: Team | Band,
  bandOrOutcome: Band | Outcome,
  outcome?: Outcome,
  period?: Period,
  gameId?: string,
): number {
  if (isGrid(source)) {
    return source[teamOrBand as Band][bandOrOutcome as Outcome];
  }
  return gridCounts(
    source,
    teamOrBand as Team,
    period,
    gameId,
  )[bandOrOutcome as Band][outcome as Outcome];
}

export function pointsByBand(
  events: readonly GameEvent[],
  team: Team,
  period?: Period,
  gameId?: string,
): BandPoints {
  return pointsByBandFromGrid(gridCounts(events, team, period, gameId));
}

export function totalPoints(
  events: readonly GameEvent[],
  team: Team,
  period?: Period,
  gameId?: string,
): number {
  const bands = pointsByBandFromGrid(gridCounts(events, team, period, gameId));
  return bands[0] + bands[1] + bands[2];
}

export function pointsByPeriod(
  events: readonly GameEvent[],
  team: Team,
  gameId?: string,
): PeriodPoints {
  return {
    0: totalPoints(events, team, 0, gameId),
    1: totalPoints(events, team, 1, gameId),
    2: totalPoints(events, team, 2, gameId),
    3: totalPoints(events, team, 3, gameId),
    4: totalPoints(events, team, 4, gameId),
  };
}

export function score(events: readonly GameEvent[], gameId?: string): Score {
  return {
    us: totalPoints(events, "us", undefined, gameId),
    them: totalPoints(events, "them", undefined, gameId),
  };
}

export function freeThrows(
  events: readonly GameEvent[],
  team: Team,
  period?: Period,
  gameId?: string,
): FreeThrows {
  return freeThrowsFromGrid(gridCounts(events, team, period, gameId));
}

export function percent(part: number, total: number): number | null {
  if (total === 0) return null;
  return Math.round((part * 100) / total);
}

export function formatPercent(part: number, total: number): string {
  const value = percent(part, total);
  return value === null ? "—" : `${value}%`;
}

export function formatFreeThrows(ft: FreeThrows): string {
  return `${ft.made}/${ft.attempted}`;
}

/** Quarti in cui c'è almeno un evento live, in ordine Q1→TS. */
export function usedPeriods(
  events: readonly GameEvent[],
  gameId?: string,
): Period[] {
  const seen = new Set<Period>();
  for (const event of events) {
    if (!isLive(event)) continue;
    if (gameId !== undefined && event.gameId !== gameId) continue;
    seen.add(event.period);
  }
  return PERIODS.filter((period) => seen.has(period));
}

export function teamStats(
  events: readonly GameEvent[],
  team: Team,
  period?: Period,
  gameId?: string,
): TeamStats {
  const grid = gridCounts(events, team, period, gameId);
  const byBand = pointsByBandFromGrid(grid);
  const total = byBand[0] + byBand[1] + byBand[2];
  return {
    grid,
    pointsByBand: byBand,
    total,
    percentsByBand: {
      0: formatPercent(byBand[0], total),
      1: formatPercent(byBand[1], total),
      2: formatPercent(byBand[2], total),
    },
    freeThrows: freeThrowsFromGrid(grid),
  };
}
