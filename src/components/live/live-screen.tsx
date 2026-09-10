"use client";

import { useState } from "react";

import { TeamPanel } from "@/components/live/team-panel";
import { vibrate } from "@/lib/haptics";
import { useGameEvents } from "@/lib/local/use-game-events";
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
  opponent: string;
};

function shortName(name: string): string {
  if (name.length <= 12) return name;
  return name.split(/\s+/)[0] ?? name;
}

export function LiveScreen({ gameId, opponent }: LiveScreenProps) {
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

  const usName = "Noi";
  const themShort = shortName(opponent);
  const gridOff = !ready;

  function add(team: Team, band: Band, outcome: Outcome) {
    void append({ period, team, band, outcome });
  }

  async function remove(
    team: Team,
    band: Band,
    outcome: Outcome,
  ): Promise<boolean> {
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
              <span className="syncpill">
                <i className="dot off" aria-hidden />
                <span>Offline · salvato sul tablet</span>
              </span>
              <span className="syncmeta">
                {ready ? `${events.length} eventi in coda` : "…"}
              </span>
            </div>
          </div>
        </header>

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
            disabled={!ready || !canUndo}
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
          <button type="button" className="btn primary" disabled>
            Riepilogo
          </button>
        </div>
      </div>
    </div>
  );
}
