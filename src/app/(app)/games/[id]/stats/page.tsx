import type { Metadata } from "next";

import { StatsScreen } from "@/components/svb-stats/stats-screen";
import "@/components/svb-stats/stats-screen.css";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ q?: string; v?: string }>;
};

export const metadata: Metadata = { title: "Falli e tiri" };

/** Falli, minuti e percentuali della partita in corso, dalle statistiche di SVB Stats. */
export default async function StatsPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { q, v } = await searchParams;
  // Il ‹ 24″ riporta al quarto e alla vista da cui si è arrivati
  const back = new URLSearchParams({ ...(q ? { q } : {}), ...(v ? { v } : {}) }).toString();
  return <StatsScreen gameId={id} back={back} />;
}
