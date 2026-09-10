import type { Metadata } from "next";

import { ReportScreen } from "@/components/report/report-screen";

type PageProps = {
  params: Promise<{ id: string }>;
};

export const metadata: Metadata = { title: "Riepilogo" };

export default async function ReportPage({ params }: PageProps) {
  const { id } = await params;
  return <ReportScreen gameId={id} />;
}
