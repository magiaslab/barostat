import {
  type Band,
  type Competition,
  type Game,
  type GameEvent,
  type Outcome,
  type Period,
  type Team,
  type Venue,
} from "@/lib/types";

export type SyncPayload = {
  game: Game;
  events: GameEvent[];
};

function isTeam(value: unknown): value is Team {
  return value === "us" || value === "them";
}

function isBand(value: unknown): value is Band {
  return value === 0 || value === 1 || value === 2;
}

function isOutcome(value: unknown): value is Outcome {
  return value === 0 || value === 1 || value === 2 || value === 3;
}

function isPeriod(value: unknown): value is Period {
  return value === 0 || value === 1 || value === 2 || value === 3 || value === 4;
}

function isVenue(value: unknown): value is Venue {
  return value === "home" || value === "away";
}

function isCompetition(value: unknown): value is Competition {
  return value === "league" || value === "cup" || value === "friendly";
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function parseSyncPayload(input: unknown): SyncPayload | null {
  if (typeof input !== "object" || input === null) return null;
  const body = input as Record<string, unknown>;
  const game = parseGame(body.game);
  if (!game || !Array.isArray(body.events)) return null;
  const events: GameEvent[] = [];
  for (const row of body.events) {
    const event = parseEvent(row, game.id);
    if (!event) return null;
    events.push(event);
  }
  return { game, events };
}

function parseGame(input: unknown): Game | null {
  if (typeof input !== "object" || input === null) return null;
  const g = input as Record<string, unknown>;
  if (typeof g.id !== "string" || !g.id) return null;
  if (typeof g.opponent !== "string") return null;
  if (typeof g.date !== "string") return null;
  if (!isVenue(g.venue) || !isCompetition(g.competition)) return null;
  if (!isFiniteNumber(g.createdAt)) return null;
  if (g.closedAt !== null && !isFiniteNumber(g.closedAt)) return null;
  if (typeof g.recorderDeviceId !== "string" || !g.recorderDeviceId) return null;
  return {
    id: g.id,
    opponent: g.opponent,
    date: g.date,
    venue: g.venue,
    competition: g.competition,
    createdAt: g.createdAt,
    closedAt: g.closedAt,
    recorderDeviceId: g.recorderDeviceId,
  };
}

function parseEvent(input: unknown, gameId: string): GameEvent | null {
  if (typeof input !== "object" || input === null) return null;
  const e = input as Record<string, unknown>;
  if (typeof e.id !== "string" || !e.id) return null;
  if (e.gameId !== gameId) return null;
  if (!isPeriod(e.period) || !isTeam(e.team) || !isBand(e.band)) return null;
  if (!isOutcome(e.outcome)) return null;
  if (!isFiniteNumber(e.tsClient) || !isFiniteNumber(e.seq)) return null;
  if (e.deletedAt !== null && !isFiniteNumber(e.deletedAt)) return null;
  return {
    id: e.id,
    gameId,
    period: e.period,
    team: e.team,
    band: e.band,
    outcome: e.outcome,
    tsClient: e.tsClient,
    seq: e.seq,
    deletedAt: e.deletedAt,
    syncedAt: null,
  };
}
