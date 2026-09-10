"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { SyncPill } from "@/components/sync-pill";
import { flushGames, pullRemote } from "@/lib/local/sync";
import { useGameList } from "@/lib/local/use-games";

export function GamesSyncPill() {
  const { rows, ready } = useGameList();
  const ids = useMemo(() => rows.map((row) => row.game.id), [rows]);
  const key = ids.join(",");
  const [status, setStatus] = useState({
    pending: 0,
    lastOk: null as boolean | null,
  });
  const [refreshing, setRefreshing] = useState(false);

  const tick = useCallback(
    async (force = false) => {
      if (ids.length > 0) {
        const result = await flushGames(ids);
        setStatus({ pending: result.pending, lastOk: result.ok });
      }
      const pulled = await pullRemote({ force });
      if (ids.length === 0) {
        setStatus({ pending: 0, lastOk: pulled.ok });
      }
    },
    [ids],
  );

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;

    async function run() {
      await tick();
      if (cancelled) return;
    }

    void run();
    const id = window.setInterval(() => {
      void tick();
    }, 15000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [ready, key, tick]);

  async function refresh() {
    setRefreshing(true);
    try {
      await tick(true);
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <SyncPill
      lastOk={status.lastOk}
      pending={status.pending}
      onRefresh={() => {
        void refresh();
      }}
      refreshing={refreshing}
    />
  );
}
