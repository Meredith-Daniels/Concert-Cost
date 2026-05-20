import { ConcertList } from "@/components/ConcertList";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { getConcerts } from "@/lib/concerts";

export default async function MyConcertsPage() {
  const concerts = await getConcerts();

  return (
    <section className="section-gap">
      <PageHeader
        title="My Concerts"
        subtitle="Every show you have logged, newest first."
      />

      {concerts.length === 0 ? (
        <EmptyState />
      ) : (
        <ConcertList concerts={concerts} />
      )}
    </section>
  );
}
