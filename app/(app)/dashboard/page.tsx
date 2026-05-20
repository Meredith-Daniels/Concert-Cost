import Link from "next/link";
import { DashboardCharts } from "@/components/DashboardCharts";
import { DashboardStats } from "@/components/DashboardStats";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { SpotifyConnectCard } from "@/components/SpotifyConnectCard";
import { getConcerts } from "@/lib/concerts";

export default async function DashboardPage() {
  const concerts = await getConcerts();

  return (
    <section className="section-gap">
      <PageHeader
        title="Dashboard"
        subtitle="Your concert spending and fun at a glance."
        action={
          concerts.length === 0 ? (
            <Link href="/add" className="btn btn-primary btn-sm btn-interactive">
              Add concert
            </Link>
          ) : undefined
        }
      />

      <SpotifyConnectCard />

      {concerts.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <DashboardStats concerts={concerts} />
          <DashboardCharts concerts={concerts} />
        </>
      )}
    </section>
  );
}
