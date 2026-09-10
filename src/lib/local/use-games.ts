"use client";

import { liveQuery } from "dexie";
import { useEffect, useMemo, useState } from "react";

import { getGame, listAllEvents, listGames } from "@/lib/local/dexie";
import { score, teamStats, type BandPoints, type Score } from "@/lib/stats";
import type { Game, GameEvent } from "@/lib/types";

export type GameListRow = {
  game: Game;
  score: Score;
  dist: BandPoints;
};

export function useGame(gameId: string): { game: Game | null; ready: boolean } {
  const [snapshot, setSnapshot] = useState<{
    id: string;
    game: Game | undefined;
  } | null>(null);

  useEffect(() => {
    const subscription = liveQuery(() => getGame(gameId)).subscribe({
      next(game) {
        setSnapshot({ id: gameId, game });
      },
      error(err: unknown) {
        console.error(err);
      },
    });
    return () => subscription.unsubscribe();
  }, [gameId]);

  const ready = snapshot?.id === gameId;
  return { game: ready ? (snapshot.game ?? null) : null, ready };
}

export function useGameList(): { rows: GameListRow[]; ready: boolean } {
  const [snapshot, setSnapshot] = useState<{
    games: Game[];
    events: GameEvent[];
  } | null>(null);

  useEffect(() => {
    const subscription = liveQuery(async () => ({
      games: await listGames(),
      events: await listAllEvents(),
    })).subscribe({
      next(value) {
        setSnapshot(value);
      },
      error(err: unknown) {
        console.error(err);
      },
    });
    return () => subscription.unsubscribe();
  }, []);

  const rows = useMemo(() => {
    if (!snapshot) return [];
    return snapshot.games.map((game) => {
      const events = snapshot.events.filter(
        (event) => event.gameId === game.id && event.deletedAt === null,
      );
      return {
        game,
        score: score(events, game.id),
        dist: teamStats(events, "us", undefined, game.id).pointsByBand,
      };
    });
  }, [snapshot]);

  return { rows, ready: snapshot !== null };
}
