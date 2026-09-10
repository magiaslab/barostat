import type { Metadata } from "next";

import { LiveScreen } from "@/components/live/live-screen";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ opp?: string | string[] }>;
};

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export async function generateMetadata({
  searchParams,
}: PageProps): Promise<Metadata> {
  const opponent = first((await searchParams).opp)?.trim() || "Loro";
  return { title: `In campo · ${opponent}` };
}

export default async function LivePage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const opponent = first((await searchParams).opp)?.trim() || "Loro";
  return <LiveScreen gameId={id} opponent={opponent} />;
}
