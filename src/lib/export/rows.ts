import {
  PERIOD_LABEL,
  type Band,
  type Game,
  type GameEvent,
  type Outcome,
} from "@/lib/types";

export const EXCEL_HEADERS = [
  "partita",
  "data",
  "periodo",
  "squadra",
  "fascia",
  "esito",
  "punti",
] as const;

const EXCEL_OUTCOME: { readonly [O in Outcome]: string } = {
  3: "3p",
  2: "2p",
  1: "tl",
  0: "tl-sbagliato",
};

const EXCEL_BAND: { readonly [B in Band]: string } = {
  0: "0–8",
  1: "8–16",
  2: "16–24",
};

export function gameSlug(opponent: string): string {
  const slug = opponent
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
  return slug || "partita";
}

export function exportFilename(game: Game, ext: "xlsx" | "pdf"): string {
  return `barostat-${gameSlug(game.opponent)}-${game.date}.${ext}`;
}

export function eventRows(
  game: Game,
  events: readonly GameEvent[],
): string[][] {
  return [...events]
    .filter((event) => event.deletedAt === null)
    .sort((a, b) => a.seq - b.seq)
    .map((event) => [
      gameSlug(game.opponent),
      game.date,
      PERIOD_LABEL[event.period],
      event.team === "us" ? "noi" : "loro",
      EXCEL_BAND[event.band],
      EXCEL_OUTCOME[event.outcome],
      String(event.outcome),
    ]);
}

export function excelPreview(
  game: Game,
  events: readonly GameEvent[],
  limit = 6,
): string {
  const rows = eventRows(game, events);
  const lines = [
    EXCEL_HEADERS.join(","),
    ...rows.slice(0, limit).map((row) => row.join(",")),
  ];
  const rest = Math.max(rows.length - limit, 0);
  if (rest > 0) lines.push(`… ${rest} righe successive`);
  return lines.join("\n");
}

export function pdfPreview(opponent: string, us: number, them: number, dateLine: string): string {
  return [
    "┌──────────────────────────────────┐",
    `│  NOI ${us} – ${them}  ${opponent}`,
    `│  ${dateLine}`,
    "├──────────────────────────────────┤",
    "│  ▄▄▄▄▄▄▄▄▄  grafico distribuzione │",
    "│  ▄▄▄▄▄▄                           │",
    "│                                   │",
    "│  Tabella per quarto — noi         │",
    "│  Tabella per quarto — loro        │",
    "│  Tiri liberi, totali di partita   │",
    "└──────────────────────────────────┘",
  ].join("\n");
}
