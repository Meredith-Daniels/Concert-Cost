import { ConcertCardSkeleton } from "@/components/ui/Skeleton";
import { PageHeader } from "@/components/PageHeader";

export default function RecommendedLoading() {
  return (
    <section className="section-gap">
      <PageHeader
        title="Recommended for you"
        subtitle="Concerts in the next year from your Spotify top 50 artists and tracks — anywhere in the world."
      />
      <section className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <ConcertCardSkeleton key={i} />
        ))}
      </section>
    </section>
  );
}
