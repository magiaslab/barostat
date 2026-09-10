import type { Metadata } from "next";

import { GameList } from "@/components/games/game-list";

export const metadata: Metadata = { title: "Partite" };

export default function GamesPage() {
  return <GameList />;
}
