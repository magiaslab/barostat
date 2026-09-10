import type { Metadata } from "next";

import { NewGameForm } from "@/components/games/new-game-form";

export const metadata: Metadata = { title: "Nuova partita" };

export default function NewGamePage() {
  return <NewGameForm />;
}
