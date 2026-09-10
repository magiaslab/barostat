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
  recorderDeviceId: string;
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
  0: "TL ✕",
};

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
