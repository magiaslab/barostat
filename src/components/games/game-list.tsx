"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";

import { GameRow } from "@/components/games/game-row";
import { InstallBanner } from "@/components/pwa/install-banner";
import { pullRemote } from "@/lib/local/sync";
import { useGameList } from "@/lib/local/use-games";

type GameListProps = {
  header: ReactNode;
};

export function GameList({ header }: GameListProps) {
  const { rows, ready } = useGameList();
  const [catalogReady, setCatalogReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void pullRemote().finally(() => {
      if (!cancelled) setCatalogReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const waitingCatalog = !catalogReady && rows.length === 0;

  return (
    <div className="games-screen">
      <div className="wrap">
        {header}
        <InstallBanner />

        <h1 className="t">Partite</h1>
        <div className="legend-row">
          <span className="eyebrow tight">Punti per fascia</span>
          <span>
            <i className="sw f1" aria-hidden />
            0–8″
          </span>
          <span>
            <i className="sw f2" aria-hidden />
            8–16″
          </span>
          <span>
            <i className="sw f3" aria-hidden />
            16–24″
          </span>
        </div>

        <div className="games">
          {!ready || waitingCatalog ? (
            <p className="muted">…</p>
          ) : rows.length === 0 ? (
            <p className="muted">
              Nessuna partita. Tocca Nuova partita per iniziare.
            </p>
          ) : (
            rows.map((row) => <GameRow key={row.game.id} row={row} />)
          )}
        </div>
      </div>

      <div className="bar">
        <div className="bar-inner">
          <Link href="/games/new" className="btn primary wide">
            + Nuova partita
          </Link>
        </div>
      </div>
    </div>
  );
}
