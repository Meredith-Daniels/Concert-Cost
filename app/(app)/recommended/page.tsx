import { Suspense } from "react";
import { RecommendedConcerts } from "@/components/RecommendedConcerts";
import { PageHeader } from "@/components/PageHeader";

export default function RecommendedPage() {
  return (
    <section className="section-gap">
      <PageHeader
        title="Recommended for you"
        subtitle="Concerts in the next year from your Spotify top 50 artists and tracks — anywhere in the world."
      />
      <Suspense
        fallback={
          <p className="text-sm text-base-content/70">Loading recommendations…</p>
        }
      >
        <RecommendedConcerts />
      </Suspense>
    </section>
  );
}
