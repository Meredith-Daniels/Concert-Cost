import { ConcertCardSkeleton } from "@/components/ui/Skeleton";
import { PageHeader } from "@/components/PageHeader";

export default function NearbyLoading() {
  return (
    <section className="section-gap">
      <PageHeader
        title="Nearby concerts"
        subtitle="Real upcoming shows near you from Songkick — no API key required."
      />
      <article className="section-card">
        <section className="section-card-body gap-4">
          <div className="h-4 w-32 animate-pulse rounded bg-base-300" />
          <div className="h-8 w-full animate-pulse rounded-full bg-base-300" />
        </section>
      </article>
      <section className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <ConcertCardSkeleton key={i} />
        ))}
      </section>
    </section>
  );
}
