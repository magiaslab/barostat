"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { BandChart } from "@/components/report/band-chart";
import { ExportPanel } from "@/components/report/export-panel";
import { PeriodTable } from "@/components/report/period-table";
import { formatReportMeta } from "@/lib/format";
import { closeGame } from "@/lib/local/dexie";
import { flushGame } from "@/lib/local/sync";
import { useGameEvents } from "@/lib/local/use-game-events";
import { useGame } from "@/lib/local/use-games";
import { insight } from "@/lib/report";
import { BAND_LABEL } from "@/lib/types";

type ReportScreenProps = {
  gameId: string;
};

export function ReportScreen({ gameId }: ReportScreenProps) {
  const router = useRouter();
  const { game, ready: gameReady } = useGame(gameId);
  const { events, us, them, ready } = useGameEvents(gameId);
  const [toast, setToast] = useState<string | null>(null);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 1800);
    return () => window.clearTimeout(id);
  }, [toast]);

  if (!gameReady || !ready) {
    return (
      <div className="report-screen">
        <div className="wrap">
          <p className="muted">…</p>
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="report-screen">
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

  const result = insight(us, them);
  const closed = game.closedAt !== null;
  const chip =
    us.total === them.total ? null : us.total > them.total ? (
      <span className="chip win">Vittoria</span>
    ) : (
      <span className="chip loss">Sconfitta</span>
    );

  async function archive() {
    if (closing || !game || game.closedAt !== null) return;
    setClosing(true);
    await closeGame(game.id);
    // La chiusura deve partire prima della navigazione: altrimenti closedAt
    // resta solo sul tablet se la rete è lenta o il componente si smonta.
    await flushGame(game.id);
    setToast("Partita archiviata");
    window.setTimeout(() => {
      router.push("/games");
    }, 700);
  }

  return (
    <div className="report-screen">
      <div className="wrap">
        <div className="apphead">
          <Link href={`/games/${game.id}`} className="link">
            ← Torna alla partita
          </Link>
        </div>

        <div className="rep">
          <div className="final">
            <div className="meta">
              {chip}
              <span className="muted">{formatReportMeta(game)}</span>
            </div>
            <div className="sc">
              <div>
                <div className="n us">Noi</div>
                <div className="v">{us.total}</div>
              </div>
              <div className="sc-them">
                <div className="n them">{game.opponent}</div>
                <div className="v">{them.total}</div>
              </div>
            </div>
          </div>

          <p className="insight">
            {result.empty ? (
              "Ancora nessun punto nostro da sintetizzare."
            ) : (
              <>
                Il <b>{result.usShare}</b> dei nostri punti nasce nella fascia{" "}
                <b>{BAND_LABEL[result.band]}</b>; nella stessa finestra{" "}
                {game.opponent} ne produce il <b>{result.themShare}</b>.
              </>
            )}
          </p>

          <BandChart us={us} them={them} opponent={game.opponent} />
          <PeriodTable events={events} team="us" caption="Noi" />
          <PeriodTable events={events} team="them" caption={game.opponent} />
          <ExportPanel
            game={game}
            events={events}
            us={us}
            them={them}
            onToast={setToast}
          />
        </div>
      </div>

      <div className="bar">
        <div className="bar-inner">
          <Link href={`/games/${game.id}`} className="btn">
            Continua
          </Link>
          {closed ? (
            <Link href="/games" className="btn primary">
              Partite
            </Link>
          ) : (
            <button
              className="btn primary"
              type="button"
              disabled={closing}
              onClick={() => {
                void archive();
              }}
            >
              Chiudi partita
            </button>
          )}
        </div>
      </div>

      <div className={toast ? "toast on" : "toast"} role="status">
        {toast}
      </div>
    </div>
  );
}
