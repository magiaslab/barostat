import { formatFreeThrows, formatPercent, usedPeriods } from "./stats";
import type { BandPoints, TeamStats } from "./stats";
import {
  PERIOD_LABEL,
  type Band,
  type GameEvent,
  type Period,
  type Team,
} from "./types";

export type Insight = {
  empty: boolean;
  band: Band;
  usShare: string;
  themShare: string;
};

export type PeriodRow = {
  key: string;
  label: string;
  bands: BandPoints;
  percents: { readonly [B in Band]: string };
  total: number;
  ft: string;
  highlight: boolean;
};

/** Prima fascia in caso di pareggio, come indexOf(max) nel mockup. */
export function topBand(points: BandPoints): Band {
  let top: Band = 0;
  if (points[1] > points[top]) top = 1;
  if (points[2] > points[top]) top = 2;
  return top;
}

export function insight(us: TeamStats, them: TeamStats): Insight {
  const band = topBand(us.pointsByBand);
  return {
    empty: us.total === 0,
    band,
    usShare: formatPercent(us.pointsByBand[band], us.total),
    themShare: formatPercent(them.pointsByBand[band], them.total),
  };
}

export function periodRows(
  events: readonly GameEvent[],
  _team: Team,
  statsFor: (period?: Period) => TeamStats,
): PeriodRow[] {
  const rows: PeriodRow[] = usedPeriods(events).map((period) => {
    const stats = statsFor(period);
    return {
      key: String(period),
      label: PERIOD_LABEL[period],
      bands: stats.pointsByBand,
      percents: stats.percentsByBand,
      total: stats.total,
      ft: formatFreeThrows(stats.freeThrows),
      highlight: true,
    };
  });

  const game = statsFor(undefined);
  rows.push({
    key: "game",
    label: "Partita",
    bands: game.pointsByBand,
    percents: game.percentsByBand,
    total: game.total,
    ft: formatFreeThrows(game.freeThrows),
    highlight: false,
  });
  return rows;
}

export function chartMax(us: BandPoints, them: BandPoints): number {
  return Math.max(
    us[0],
    us[1],
    us[2],
    them[0],
    them[1],
    them[2],
    1,
  );
}

export function barWidth(value: number, max: number): number {
  return value > 0 ? Math.max((value / max) * 100, 1.5) : 0;
}
