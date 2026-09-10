import type { Metadata } from "next";

import { LiveScreen } from "@/components/live/live-screen";

type PageProps = {
  params: Promise<{ id: string }>;
};

export const metadata: Metadata = { title: "In campo" };

export default async function LivePage({ params }: PageProps) {
  const { id } = await params;
  return <LiveScreen gameId={id} />;
}
