"use client";

import { useState } from "react";

import { downloadExcel } from "@/lib/export/excel";
import { downloadPdf } from "@/lib/export/pdf";
import { excelPreview, pdfPreview } from "@/lib/export/rows";
import { formatGameDateLong } from "@/lib/format";
import { COMPETITION_LABEL, type Game, type GameEvent } from "@/lib/types";
import type { TeamStats } from "@/lib/stats";

type ExportMode = "xlsx" | "pdf";

type ExportPanelProps = {
  game: Game;
  events: GameEvent[];
  us: TeamStats;
  them: TeamStats;
  onToast: (message: string) => void;
};

const NOTE: { readonly [M in ExportMode]: string } = {
  xlsx: "Un evento per riga, più un foglio di riepilogo. Si apre in Excel e regge qualsiasi analisi tu voglia fare dopo.",
  pdf: "Una pagina A4 con tabelle e grafico, da allegare al referto o da stampare per lo spogliatoio.",
};

const ACTION: { readonly [M in ExportMode]: string } = {
  xlsx: "Scarica eventi.xlsx",
  pdf: "Scarica riepilogo.pdf",
};

export function ExportPanel({
  game,
  events,
  us,
  them,
  onToast,
}: ExportPanelProps) {
  const [mode, setMode] = useState<ExportMode>("xlsx");
  const [busy, setBusy] = useState(false);

  const preview =
    mode === "xlsx"
      ? excelPreview(game, events)
      : pdfPreview(
          game.opponent,
          us.total,
          them.total,
          `${formatGameDateLong(game.date)} · ${COMPETITION_LABEL[game.competition]}`,
        );

  async function download() {
    if (busy) return;
    setBusy(true);
    try {
      if (mode === "xlsx") {
        await downloadExcel(game, events, us, them);
        onToast("Excel scaricato");
      } else {
        await downloadPdf(game, events, us, them);
        onToast("PDF scaricato");
      }
    } catch (err) {
      console.error(err);
      onToast("Download non riuscito");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="exp">
      <h3 className="t">Export</h3>
      <div className="tabs">
        <button
          type="button"
          aria-pressed={mode === "xlsx"}
          onClick={() => setMode("xlsx")}
        >
          Excel
        </button>
        <button
          type="button"
          aria-pressed={mode === "pdf"}
          onClick={() => setMode("pdf")}
        >
          PDF
        </button>
      </div>
      <p className="muted">{NOTE[mode]}</p>
      <pre className="preview">{preview}</pre>
      <button
        className="btn primary wide"
        type="button"
        disabled={busy}
        onClick={() => {
          void download();
        }}
      >
        {ACTION[mode]}
      </button>
    </div>
  );
}
