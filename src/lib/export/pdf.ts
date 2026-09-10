import { formatReportMeta } from "@/lib/format";
import { insight, periodRows, type PeriodRow } from "@/lib/report";
import { teamStats, type TeamStats } from "@/lib/stats";
import {
  BAND_CLOCK,
  BAND_LABEL,
  BANDS,
  type Game,
  type GameEvent,
} from "@/lib/types";

import { deliver, type DeliverResult } from "./deliver";
import { exportFilename } from "./rows";

const US_MARK: [number, number, number] = [42, 159, 214];
const THEM_MARK: [number, number, number] = [228, 96, 60];
const INK: [number, number, number] = [20, 24, 30];
const MUTED: [number, number, number] = [90, 100, 112];

export async function downloadPdf(
  game: Game,
  events: readonly GameEvent[],
  us: TeamStats,
  them: TeamStats,
): Promise<DeliverResult> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const pageW = 210;
  const margin = 16;
  let y = 16;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text("BAROSTAT 24", margin, y);

  y += 10;
  doc.setFontSize(20);
  doc.setTextColor(...INK);
  doc.text(
    `NOI  ${us.total}  -  ${them.total}  ${ascii(game.opponent.toUpperCase())}`,
    margin,
    y,
  );

  y += 7;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...MUTED);
  doc.text(ascii(formatReportMeta(game)), margin, y);

  const result = insight(us, them);
  y += 10;
  doc.setTextColor(...INK);
  doc.setFontSize(11);
  const phrase = result.empty
    ? "Ancora nessun punto nostro da sintetizzare."
    : `Il ${result.usShare} dei nostri punti nasce nella fascia ${ascii(BAND_LABEL[result.band])}; nella stessa finestra ${ascii(game.opponent)} ne produce il ${result.themShare}.`;
  const wrapped = doc.splitTextToSize(phrase, pageW - margin * 2);
  doc.text(wrapped, margin, y);
  y += wrapped.length * 5 + 4;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Da dove arrivano i punti", margin, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text('Punti per fascia dei 24" - partita intera', margin, y);
  y += 6;

  const max = Math.max(
    ...BANDS.map((band) => Math.max(us.pointsByBand[band], them.pointsByBand[band])),
    1,
  );
  const barMax = pageW - margin * 2 - 42;

  for (const band of BANDS) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...INK);
    doc.text(`${ascii(BAND_LABEL[band])}  ${BAND_CLOCK[band]}`, margin, y);
    y += 3;
    y = drawBar(doc, y, margin, barMax, us.pointsByBand[band], us.total, max, US_MARK);
    y = drawBar(doc, y, margin, barMax, them.pointsByBand[band], them.total, max, THEM_MARK);
    y += 3;
  }

  const usRows = periodRows(events, "us", (period) => teamStats(events, "us", period));
  const themRows = periodRows(events, "them", (period) =>
    teamStats(events, "them", period),
  );

  y += 4;
  y = drawTable(doc, y, margin, pageW, "NOI", usRows);
  y += 6;
  drawTable(doc, y, margin, pageW, ascii(game.opponent.toUpperCase()), themRows);

  return deliver(
    doc.output("blob"),
    exportFilename(game, "pdf"),
    "application/pdf",
  );
}

function drawBar(
  doc: import("jspdf").jsPDF,
  y: number,
  x: number,
  barMax: number,
  value: number,
  total: number,
  max: number,
  color: [number, number, number],
): number {
  const width = value > 0 ? Math.max((value / max) * barMax, 2) : 0;
  doc.setFillColor(...color);
  if (width > 0) doc.rect(x, y, width, 3.2, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...INK);
  const pct = total === 0 ? "-" : `${Math.round((value * 100) / total)}%`;
  doc.text(`${value} pt - ${pct}`, x + barMax + 3, y + 2.6);
  return y + 5;
}

function drawTable(
  doc: import("jspdf").jsPDF,
  y: number,
  margin: number,
  pageW: number,
  title: string,
  rows: PeriodRow[],
): number {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...INK);
  doc.text(title, margin, y);
  y += 5;

  const cols = [22, 28, 28, 28, 22, 22];
  const headers = ["Periodo", '0-8"', '8-16"', '16-24"', "Tot", "TL"];
  const tableW = pageW - margin * 2;
  const scale = tableW / cols.reduce((sum, col) => sum + col, 0);
  const widths = cols.map((col) => col * scale);

  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  let x = margin;
  headers.forEach((header, i) => {
    doc.text(header, i === 0 ? x : x + widths[i] - 1, y, {
      align: i === 0 ? "left" : "right",
    });
    x += widths[i];
  });
  y += 2;
  doc.setDrawColor(200, 206, 214);
  doc.line(margin, y, pageW - margin, y);
  y += 5;

  for (const row of rows) {
    doc.setFont("helvetica", row.key === "game" ? "bold" : "normal");
    doc.setTextColor(...INK);
    const cells = [
      row.label,
      `${row.bands[0]} ${ascii(row.percents[0])}`,
      `${row.bands[1]} ${ascii(row.percents[1])}`,
      `${row.bands[2]} ${ascii(row.percents[2])}`,
      String(row.total),
      row.ft,
    ];
    x = margin;
    cells.forEach((cell, i) => {
      doc.text(cell, i === 0 ? x : x + widths[i] - 1, y, {
        align: i === 0 ? "left" : "right",
      });
      x += widths[i];
    });
    y += 5;
  }

  return y;
}

function ascii(value: string): string {
  return value
    .replaceAll("″", '"')
    .replaceAll("–", "-")
    .replaceAll("—", "-")
    .replaceAll("·", "-");
}
