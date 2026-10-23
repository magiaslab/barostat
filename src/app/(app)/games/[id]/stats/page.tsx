import type { Metadata } from "next";

import { StatsScreen } from "@/components/svb-stats/stats-screen";
import "@/components/svb-stats/stats-screen.css";

type PageProps = {
  params: Promise<{ id: string }>;
};

export const metadata: Metadata = { title: "Falli e tiri" };

/** Falli, minuti e percentuali della partita in corso, dalle statistiche di SVB Stats. */
export default async function StatsPage({ params }: PageProps) {
  const { id } = await params;
  return <StatsScreen gameId={id} />;
}
