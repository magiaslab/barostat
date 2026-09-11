import { formatFreeThrows } from "@/lib/stats";
import type { TeamStats } from "@/lib/stats";
import type { Game, GameEvent } from "@/lib/types";

import { deliver, type DeliverResult } from "./deliver";
import {
  EXCEL_HEADERS,
  asExcelText,
  eventRows,
  exportFilename,
} from "./rows";

const XLSX_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export async function downloadExcel(
  game: Game,
  events: readonly GameEvent[],
  us: TeamStats,
  them: TeamStats,
): Promise<DeliverResult> {
  const XLSX = await import("xlsx");
  const wb = XLSX.utils.book_new();

  const eventSheet = XLSX.utils.aoa_to_sheet([
    [...EXCEL_HEADERS],
    ...eventRows(game, events),
  ]);
  XLSX.utils.book_append_sheet(wb, eventSheet, "Eventi");

  const summary = XLSX.utils.aoa_to_sheet([
    ["squadra", "punti", "0–8″", "8–16″", "16–24″", "TL"],
    [
      "Noi",
      us.total,
      `${us.pointsByBand[0]} (${us.percentsByBand[0]})`,
      `${us.pointsByBand[1]} (${us.percentsByBand[1]})`,
      `${us.pointsByBand[2]} (${us.percentsByBand[2]})`,
      formatFreeThrows(us.freeThrows),
    ],
    [
      asExcelText(game.opponent),
      them.total,
      `${them.pointsByBand[0]} (${them.percentsByBand[0]})`,
      `${them.pointsByBand[1]} (${them.percentsByBand[1]})`,
      `${them.pointsByBand[2]} (${them.percentsByBand[2]})`,
      formatFreeThrows(them.freeThrows),
    ],
  ]);
  XLSX.utils.book_append_sheet(wb, summary, "Riepilogo");

  const data = XLSX.write(wb, { type: "array", bookType: "xlsx" });
  const blob = new Blob([data], { type: XLSX_MIME });
  return deliver(blob, exportFilename(game, "xlsx"), XLSX_MIME);
}
