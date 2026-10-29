export type Team = "us" | "them";
export type Band = 0 | 1 | 2;
export type Outcome = 3 | 2 | 1 | 0;
export type Period = 0 | 1 | 2 | 3 | 4;
export type Venue = "home" | "away";
export type Competition = "league" | "cup" | "friendly";

export type GameEvent = {
  id: string;
  gameId: string;
  period: Period;
  team: Team;
  band: Band;
  outcome: Outcome;
  /** Canestro da 2 dopo rimbalzo offensivo (colonna RO). Vale come un 2P; assente sugli eventi vecchi. */
  putback?: boolean;
  tsClient: number;
  seq: number;
  deletedAt: number | null;
  syncedAt: number | null;
};

export type Game = {
  id: string;
  opponent: string;
  date: string;
  venue: Venue;
  competition: Competition;
  createdAt: number;
  closedAt: number | null;
  /** UX: quale tablet ha la griglia. Non è autorità di scrittura sul server. */
  recorderDeviceId: string;
  /** Email sessione del registratore; null finché la partita non è mai stata inviata. */
  recorderUserId: string | null;
};

export const BANDS: readonly Band[] = [0, 1, 2];
export const OUTCOMES: readonly Outcome[] = [3, 2, 1, 0];
export const PERIODS: readonly Period[] = [0, 1, 2, 3, 4];

export const BAND_LABEL: { readonly [B in Band]: string } = {
  0: "0–8″",
  1: "8–16″",
  2: "16–24″",
};

export const BAND_CLOCK: { readonly [B in Band]: string } = {
  0: "24→17",
  1: "16→9",
  2: "8→0",
};

export const PERIOD_LABEL: { readonly [P in Period]: string } = {
  0: "Q1",
  1: "Q2",
  2: "Q3",
  3: "Q4",
  4: "TS",
};

export const OUTCOME_LABEL: { readonly [O in Outcome]: string } = {
  3: "3P",
  2: "2P",
  1: "TL",
  0: "NO",
};

/** Colonne della griglia: gli esiti più RO, il canestro da 2 dopo rimbalzo offensivo. */
export type Cell = Outcome | "ro";
export const CELLS: readonly Cell[] = [3, 2, 1, 0, "ro"];

export const CELL_LABEL: { readonly [C in Cell]: string } = {
  ...OUTCOME_LABEL,
  ro: "RO",
};

export function cellOf(event: Pick<GameEvent, "outcome" | "putback">): Cell {
  return event.putback ? "ro" : event.outcome;
}

/** Esito salvato per una colonna: RO è un 2P con putback. */
export function cellEvent(cell: Cell): { outcome: Outcome; putback: boolean } {
  return cell === "ro" ? { outcome: 2, putback: true } : { outcome: cell, putback: false };
}

export const VENUES: readonly Venue[] = ["home", "away"];
export const COMPETITIONS: readonly Competition[] = [
  "league",
  "cup",
  "friendly",
];

export const VENUE_LABEL: { readonly [V in Venue]: string } = {
  home: "Casa",
  away: "Trasferta",
};

export const COMPETITION_LABEL: { readonly [C in Competition]: string } = {
  league: "Campionato",
  cup: "Coppa",
  friendly: "Amichevole",
};
