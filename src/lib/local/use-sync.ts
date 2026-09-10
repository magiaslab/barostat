"use client";

import { useCallback, useEffect, useState } from "react";

import { flushGame, type FlushResult } from "@/lib/local/sync";

export type SyncStatus = {
  pending: number;
  lastOk: boolean | null;
  reason?: FlushResult["reason"];
};

export function useGameSync(gameId: string, eventCount: number): SyncStatus {
  const [status, setStatus] = useState<SyncStatus>({
    pending: 0,
    lastOk: null,
  });

  const run = useCallback(async () => {
    const result = await flushGame(gameId);
    setStatus({
      pending: result.pending,
      lastOk: result.ok,
      reason: result.reason,
    });
  }, [gameId]);

  useEffect(() => {
    void run();
    const id = window.setInterval(() => {
      void run();
    }, 15000);
    return () => window.clearInterval(id);
  }, [run, eventCount]);

  return status;
}
