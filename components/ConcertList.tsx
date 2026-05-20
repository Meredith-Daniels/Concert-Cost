"use client";

import { useAutoAnimate } from "@formkit/auto-animate/react";
import { ConcertCard } from "@/components/ConcertCard";
import type { Concert } from "@/lib/database.types";

type ConcertListProps = {
  concerts: Concert[];
};

export function ConcertList({ concerts }: ConcertListProps) {
  const [parent] = useAutoAnimate();

  return (
    <section ref={parent} className="grid gap-4 md:grid-cols-2">
      {concerts.map((concert) => (
        <ConcertCard key={concert.id} concert={concert} />
      ))}
    </section>
  );
}
