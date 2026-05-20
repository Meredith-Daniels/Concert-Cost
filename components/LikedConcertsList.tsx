"use client";

import { useAutoAnimate } from "@formkit/auto-animate/react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { UpcomingConcertCard } from "@/components/UpcomingConcertCard";
import { useLikedConcerts } from "@/hooks/useLikedConcerts";

export function LikedConcertsList() {
  const { likedConcerts, loading } = useLikedConcerts();
  const [listParent] = useAutoAnimate();

  if (loading) {
    return (
      <section className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <article key={i} className="section-card">
            <section className="section-card-body gap-3">
              <div className="skeleton h-6 w-3/4" />
              <div className="skeleton h-4 w-1/2" />
              <div className="skeleton h-12 w-full" />
            </section>
          </article>
        ))}
      </section>
    );
  }

  if (likedConcerts.length === 0) {
    return (
      <article className="section-card">
        <section className="card-body items-center py-12 text-center">
          <Heart className="mb-4 h-12 w-12 text-primary opacity-80" aria-hidden />
          <h3 className="text-lg font-semibold">You haven&apos;t saved any concerts yet.</h3>
          <p className="mt-2 max-w-md text-sm text-base-content/70">
            Browse upcoming shows on Nearby and tap Save on any concert you want to
            remember.
          </p>
          <Link href="/nearby" className="btn btn-primary btn-interactive mt-6">
            Find concerts nearby
          </Link>
        </section>
      </article>
    );
  }

  return (
    <section ref={listParent} className="grid gap-4 md:grid-cols-2">
      {likedConcerts.map((concert) => (
        <UpcomingConcertCard key={concert.id} concert={concert} showSaveButton />
      ))}
    </section>
  );
}
