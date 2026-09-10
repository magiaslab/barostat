import type { Metadata } from "next";

import { GameList } from "@/components/games/game-list";
import { GamesAppHead } from "@/components/games/games-app-head";

export const metadata: Metadata = { title: "Partite" };

export default function GamesPage() {
  return <GameList header={<GamesAppHead />} />;
}
