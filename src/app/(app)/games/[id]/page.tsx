import type { Metadata } from "next";

import { LiveScreen } from "@/components/live/live-screen";
import { PERIODS } from "@/lib/types";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ q?: string; v?: string }>;
};

export const metadata: Metadata = { title: "In campo" };

export default async function LivePage({ params, searchParams }: PageProps) {
  const { id } = await params;
  // Tornando da Falli e tiri si riprende il quarto e la vista di prima
  const { q, v } = await searchParams;
  const period = PERIODS.find((p) => String(p) === q);
  return <LiveScreen gameId={id} initialPeriod={period} initialScope={v === "game" ? "game" : undefined} />;
}
