type SkeletonProps = {
  className?: string;
};

export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <span
      className={`block animate-pulse rounded-lg bg-base-300/50 ${className}`}
      aria-hidden
    />
  );
}

export function StatCardSkeleton() {
  return (
    <article className="section-card">
      <section className="section-card-body gap-3">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-3 w-20" />
      </section>
    </article>
  );
}

export function ConcertCardSkeleton() {
  return (
    <article className="section-card">
      <section className="section-card-body gap-4">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-10 w-full" />
      </section>
    </article>
  );
}

export function ChartCardSkeleton() {
  return (
    <article className="section-card">
      <section className="section-card-body">
        <Skeleton className="mb-4 h-5 w-48" />
        <Skeleton className="h-72 w-full" />
      </section>
    </article>
  );
}
