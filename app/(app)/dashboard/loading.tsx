import { ChartCardSkeleton, StatCardSkeleton } from "@/components/ui/Skeleton";
import { PageHeader } from "@/components/PageHeader";

export default function DashboardLoading() {
  return (
    <section className="section-gap">
      <PageHeader
        title="Dashboard"
        subtitle="Your concert spending and fun at a glance."
      />
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </section>
      <section className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <ChartCardSkeleton key={i} />
        ))}
      </section>
    </section>
  );
}
