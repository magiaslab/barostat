"use client";

import { liveQuery } from "dexie";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  appendEvent,
  listLiveEvents,
  undoLast,
  type EventDraft,
} from "@/lib/local/dexie";
import { score, teamStats, type Score, type TeamStats } from "@/lib/stats";
import type { GameEvent, Period } from "@/lib/types";

export type UseGameEventsResult = {
  events: GameEvent[];
  score: Score;
  us: TeamStats;
  them: TeamStats;
  append: (draft: Omit<EventDraft, "gameId">) => Promise<GameEvent>;
  undo: () => Promise<GameEvent | null>;
  canUndo: boolean;
  ready: boolean;
};

const EMPTY_EVENTS: GameEvent[] = [];

export function useGameEvents(
  gameId: string,
  period?: Period,
): UseGameEventsResult {
  const [snapshot, setSnapshot] = useState<{
    gameId: string;
    events: GameEvent[];
  } | null>(null);

  useEffect(() => {
    const subscription = liveQuery(() => listLiveEvents(gameId)).subscribe({
      next(rows) {
        setSnapshot({ gameId, events: rows });
      },
      error(err: unknown) {
        console.error(err);
      },
    });
    return () => subscription.unsubscribe();
  }, [gameId]);

  const events = useMemo(
    () => (snapshot?.gameId === gameId ? snapshot.events : EMPTY_EVENTS),
    [snapshot, gameId],
  );
  const ready = snapshot?.gameId === gameId;

  const append = useCallback(
    async (draft: Omit<EventDraft, "gameId">) => {
      const event = await appendEvent({ ...draft, gameId });
      setSnapshot((prev) => {
        const current = prev?.gameId === gameId ? prev.events : EMPTY_EVENTS;
        if (current.some((row) => row.id === event.id)) {
          return { gameId, events: current };
        }
        return { gameId, events: [...current, event] };
      });
      return event;
    },
    [gameId],
  );

  const undo = useCallback(async () => {
    const retracted = await undoLast(gameId);
    if (retracted) {
      setSnapshot((prev) => {
        if (prev?.gameId !== gameId) return prev;
        return {
          gameId,
          events: prev.events.filter((row) => row.id !== retracted.id),
        };
      });
    }
    return retracted;
  }, [gameId]);

  const board = useMemo(() => score(events), [events]);
  const us = useMemo(() => teamStats(events, "us", period), [events, period]);
  const them = useMemo(
    () => teamStats(events, "them", period),
    [events, period],
  );

  return {
    events,
    score: board,
    us,
    them,
    append,
    undo,
    canUndo: events.length > 0,
    ready,
  };
}
