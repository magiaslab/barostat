"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";

import { TeamPanel } from "@/components/live/team-panel";
import { SyncPill } from "@/components/sync-pill";
import { vibrate } from "@/lib/haptics";
import { claimRecorder } from "@/lib/local/dexie";
import {
  ensureDeviceId,
  readDeviceId,
  subscribeDeviceId,
} from "@/lib/local/device";
import { useGameEvents } from "@/lib/local/use-game-events";
import { useGame } from "@/lib/local/use-games";
import { useGameSync } from "@/lib/local/use-sync";
import {
  PERIODS,
  PERIOD_LABEL,
  type Band,
  type Outcome,
  type Period,
  type Team,
} from "@/lib/types";

type LiveScreenProps = {
  gameId: string;
};

function shortName(name: string): string {
  if (name.length <= 12) return name;
  return name.split(/\s+/)[0] ?? name;
}

export function LiveScreen({ gameId }: LiveScreenProps) {
  const { game, ready: gameReady } = useGame(gameId);
  const opponent = game?.opponent ?? "Loro";
  const [period, setPeriod] = useState<Period>(0);
  const [scope, setScope] = useState<"period" | "game">("period");
  const scopedPeriod = scope === "period" ? period : undefined;
  const {
    events,
    score,
    us,
    them,
    append,
    undo,
    removeMatching,
    canUndo,
    ready,
  } = useGameEvents(gameId, scopedPeriod);
  const sync = useGameSync(gameId, events.length);
  const deviceId = useSyncExternalStore(
    subscribeDeviceId,
    readDeviceId,
    () => "",
  );

  const usName = "Noi";
  const themShort = shortName(opponent);
  const foreignRecorder = Boolean(
    deviceId &&
      game &&
      game.recorderDeviceId &&
      game.recorderDeviceId !== deviceId,
  );
  const readOnly = foreignRecorder || sync.reason === "recorder";
  const gridOff = !ready || !gameReady || !game || readOnly;

  useEffect(() => {
    ensureDeviceId();
  }, []);

  useEffect(() => {
    if (!game || game.recorderDeviceId !== "") return;
    void claimRecorder(game.id, ensureDeviceId());
  }, [game]);

  if (!gameReady) {
    return (
      <div className="games-screen">
        <div className="wrap">
          <p className="muted">…</p>
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="games-screen">
        <div className="wrap">
          <div className="apphead">
            <Link href="/games" className="link">
              ← Partite
            </Link>
          </div>
          <p className="muted">Partita non trovata.</p>
        </div>
      </div>
    );
  }

  function add(team: Team, band: Band, outcome: Outcome) {
    if (readOnly) return;
    void append({ period, team, band, outcome });
  }

  async function remove(
    team: Team,
    band: Band,
    outcome: Outcome,
  ): Promise<boolean> {
    if (readOnly) return false;
    const retracted = await removeMatching({
      period,
      team,
      band,
      outcome,
    });
    return retracted !== null;
  }

  return (
    <div className="live">
      <div className="wrap">
        <header className="board">
          <div className="board-inner">
            <div className="score-row">
              <div className="side us">
                <span className="side-name">{usName}</span>
                <span className="side-score">{score.us}</span>
              </div>
              <div className="mid">
                <span className="period">
                  {scope === "period" ? "In campo" : "Totale partita"}
                </span>
                <div className="pills" role="group" aria-label="Quarto">
                  {PERIODS.map((item) => (
                    <button
                      key={item}
                      type="button"
                      className="pill"
                      aria-pressed={item === period}
                      onClick={() => setPeriod(item)}
                    >
                      {PERIOD_LABEL[item]}
                    </button>
                  ))}
                </div>
              </div>
              <div className="side them right">
                <span className="side-name">{themShort}</span>
                <span className="side-score">{score.them}</span>
              </div>
            </div>
            <div className="sync">
              <SyncPill lastOk={sync.lastOk} pending={sync.pending} />
              <span className="syncmeta">
                {sync.pending === 0
                  ? `${events.length} eventi`
                  : `${sync.pending} in coda`}
              </span>
            </div>
          </div>
        </header>

        {readOnly ? (
          <p className="readonly-banner" role="status">
            Questa partita è in sola lettura su questo dispositivo.
          </p>
        ) : null}

        <main className="panels">
          <TeamPanel
            team="us"
            name={usName}
            stats={us}
            disabled={gridOff}
            onAdd={(band, outcome) => add("us", band, outcome)}
            onRemove={(band, outcome) => remove("us", band, outcome)}
          />
          <TeamPanel
            team="them"
            name={opponent}
            stats={them}
            disabled={gridOff}
            onAdd={(band, outcome) => add("them", band, outcome)}
            onRemove={(band, outcome) => remove("them", band, outcome)}
          />
        </main>
      </div>

      <div className="bar">
        <div className="bar-inner">
          <button
            type="button"
            className="btn undo"
            disabled={!ready || !canUndo || readOnly}
            onClick={() => {
              void undo();
              vibrate(30);
            }}
          >
            ↩ Annulla
          </button>
          <button
            type="button"
            className="btn"
            aria-pressed={scope === "game"}
            onClick={() =>
              setScope((current) => (current === "period" ? "game" : "period"))
            }
          >
            {scope === "period" ? "Quarto" : "Partita"}
          </button>
          <Link href={`/games/${gameId}/report`} className="btn primary">
            Riepilogo
          </Link>
        </div>
      </div>
    </div>
  );
}
