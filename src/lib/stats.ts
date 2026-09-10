import {
  BANDS,
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
): boolean {
  if (!isLive(event) || event.team !== team) return false;
  if (period !== undefined && event.period !== period) return false;
  return true;
}

/** L'esito è già il valore in punti: TL sbagliato vale 0. */
export function pointsOf(outcome: Outcome): number {
  return outcome;
}

export function gridCounts(
  events: readonly GameEvent[],
  team: Team,
  period?: Period,
): GridCounts {
  const grid = emptyGrid();

  for (const event of events) {
    if (!matches(event, team, period)) continue;
    grid[event.band][event.outcome] += 1;
  }

  return grid;
}

export function cellCount(
  events: readonly GameEvent[],
  team: Team,
  band: Band,
  outcome: Outcome,
  period?: Period,
): number {
  return gridCounts(events, team, period)[band][outcome];
}

export function pointsByBand(
  events: readonly GameEvent[],
  team: Team,
  period?: Period,
): BandPoints {
  const grid = gridCounts(events, team, period);
  return {
    0: bandTotal(grid[0]),
    1: bandTotal(grid[1]),
    2: bandTotal(grid[2]),
  };
}

function bandTotal(counts: OutcomeCounts): number {
  let total = 0;
  for (const outcome of [3, 2, 1, 0] as const) {
    total += counts[outcome] * pointsOf(outcome);
  }
  return total;
}

export function totalPoints(
  events: readonly GameEvent[],
  team: Team,
  period?: Period,
): number {
  const bands = pointsByBand(events, team, period);
  return bands[0] + bands[1] + bands[2];
}

export function pointsByPeriod(
  events: readonly GameEvent[],
  team: Team,
): PeriodPoints {
  return {
    0: totalPoints(events, team, 0),
    1: totalPoints(events, team, 1),
    2: totalPoints(events, team, 2),
    3: totalPoints(events, team, 3),
    4: totalPoints(events, team, 4),
  };
}

export function score(events: readonly GameEvent[]): Score {
  return {
    us: totalPoints(events, "us"),
    them: totalPoints(events, "them"),
  };
}

export function freeThrows(
  events: readonly GameEvent[],
  team: Team,
  period?: Period,
): FreeThrows {
  const grid = gridCounts(events, team, period);
  let made = 0;
  let missed = 0;
  for (const band of BANDS) {
    made += grid[band][1];
    missed += grid[band][0];
  }
  return { made, missed, attempted: made + missed };
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

export function teamStats(
  events: readonly GameEvent[],
  team: Team,
  period?: Period,
): TeamStats {
  const grid = gridCounts(events, team, period);
  const byBand = pointsByBand(events, team, period);
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
    freeThrows: freeThrows(events, team, period),
  };
}
