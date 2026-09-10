"use client";

import Link from "next/link";

import { GameRow } from "@/components/games/game-row";
import { useGameList } from "@/lib/local/use-games";

export function GameList() {
  const { rows, ready } = useGameList();

  return (
    <div className="games-screen">
      <div className="wrap">
        <div className="apphead">
          <span className="eyebrow">BaroStat 24</span>
          <span className="syncpill">
            <i className="dot off" aria-hidden />
            <span>Offline · salvato sul tablet</span>
          </span>
        </div>

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
          {!ready ? (
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
