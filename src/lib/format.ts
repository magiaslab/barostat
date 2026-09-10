import { COMPETITION_LABEL, type Game, type Venue } from "@/lib/types";

const MONTHS = [
  "gen",
  "feb",
  "mar",
  "apr",
  "mag",
  "giu",
  "lug",
  "ago",
  "set",
  "ott",
  "nov",
  "dic",
] as const;

export function formatGameDate(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return iso;
  return `${day} ${MONTHS[month - 1]}`;
}

export function formatGameDateLong(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return iso;
  return `${day} ${MONTHS[month - 1]} ${year}`;
}

export function venuePhrase(venue: Venue): string {
  return venue === "home" ? "in casa" : "in trasferta";
}

export function formatGameMeta(game: Game): string {
  return `${formatGameDate(game.date)} · ${COMPETITION_LABEL[game.competition]}`;
}

export function formatReportMeta(game: Game): string {
  return `${formatGameDateLong(game.date)} · ${COMPETITION_LABEL[game.competition]} · ${venuePhrase(game.venue)}`;
}

export function todayISO(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}
