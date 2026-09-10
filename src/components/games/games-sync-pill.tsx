"use client";

import { useEffect, useMemo, useState } from "react";

import { SyncPill } from "@/components/sync-pill";
import { flushGames } from "@/lib/local/sync";
import { useGameList } from "@/lib/local/use-games";

export function GamesSyncPill() {
  const { rows, ready } = useGameList();
  const ids = useMemo(() => rows.map((row) => row.game.id), [rows]);
  const key = ids.join(",");
  const [status, setStatus] = useState({ pending: 0, lastOk: null as boolean | null });

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;

    async function tick() {
      if (ids.length === 0) {
        if (!cancelled) setStatus({ pending: 0, lastOk: true });
        return;
      }
      const result = await flushGames(ids);
      if (!cancelled) {
        setStatus({ pending: result.pending, lastOk: result.ok });
      }
    }

    void tick();
    const id = window.setInterval(() => {
      void tick();
    }, 15000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [ready, key, ids]);

  return <SyncPill lastOk={status.lastOk} pending={status.pending} />;
}
