import { ConcertCardSkeleton } from "@/components/ui/Skeleton";
import { PageHeader } from "@/components/PageHeader";

export default function ConcertsLoading() {
  return (
    <section className="section-gap">
      <PageHeader
        title="My Concerts"
        subtitle="Every show you have logged, newest first."
      />
      <section className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <ConcertCardSkeleton key={i} />
        ))}
      </section>
    </section>
  );
}
