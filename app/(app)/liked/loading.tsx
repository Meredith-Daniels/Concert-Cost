import { ConcertCardSkeleton } from "@/components/ui/Skeleton";
import { PageHeader } from "@/components/PageHeader";

export default function LikedLoading() {
  return (
    <section className="section-gap">
      <PageHeader
        title="Liked concerts"
        subtitle="Shows you saved from Nearby so you don't forget them."
      />
      <section className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <ConcertCardSkeleton key={i} />
        ))}
      </section>
    </section>
  );
}
