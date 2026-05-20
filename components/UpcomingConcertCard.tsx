"use client";

import { formatDate } from "@/lib/metrics";
import type { PublicConcertEvent } from "@/lib/public-events";
import { Calendar, ExternalLink, MapPin, Music2, Navigation } from "lucide-react";
import { SaveConcertButton } from "@/components/SaveConcertButton";

type UpcomingConcertCardProps = {
  concert: PublicConcertEvent;
  showSaveButton?: boolean;
  showDistance?: boolean;
  matchReason?: string;
};

function formatEventTime(time: string | null): string | null {
  if (!time) return null;
  const [hours, minutes] = time.split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function UpcomingConcertCard({
  concert,
  showSaveButton = false,
  showDistance = true,
  matchReason,
}: UpcomingConcertCardProps) {
  const timeLabel = formatEventTime(concert.event_time);

  return (
    <article className="section-card motion-safe-transition hover:-translate-y-0.5 hover:shadow-md">
      <section className="section-card-body gap-3">
        {concert.image_url && (
          <figure className="-mx-6 -mt-6 mb-1 aspect-[16/9] overflow-hidden rounded-t-2xl bg-base-300">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={concert.image_url}
              alt=""
              className="h-full w-full object-cover"
            />
          </figure>
        )}
        {matchReason && (
          <p className="flex items-start gap-2 rounded-xl bg-secondary/15 px-3 py-2 text-sm text-base-content/80">
            <Music2 className="mt-0.5 h-4 w-4 shrink-0 text-secondary" aria-hidden />
            <span>{matchReason}</span>
          </p>
        )}
        <header className="flex flex-wrap items-start justify-between gap-2">
          <section>
            <h3 className="text-lg font-semibold">{concert.name}</h3>
            {concert.artist && (
              <p className="text-sm text-base-content/70">{concert.artist}</p>
            )}
          </section>
          {showDistance && concert.distance_miles > 0 && (
            <span className="badge badge-primary gap-1 tabular-nums">
              <Navigation className="h-3 w-3" aria-hidden />
              {concert.distance_miles.toFixed(1)} mi
            </span>
          )}
        </header>
        <section className="flex flex-col gap-1 text-sm text-base-content/70">
          <p className="flex items-center gap-2">
            <MapPin className="h-4 w-4 shrink-0" aria-hidden />
            {concert.venue}
            {(concert.city || concert.state) && (
              <>
                {" "}
                · {concert.city}
                {concert.city && concert.state ? ", " : ""}
                {concert.state}
              </>
            )}
          </p>
          <p className="flex items-center gap-2">
            <Calendar className="h-4 w-4 shrink-0" aria-hidden />
            {formatDate(concert.event_date)}
            {timeLabel ? ` · ${timeLabel}` : ""}
          </p>
        </section>
        <section className="flex flex-wrap gap-2">
          {showSaveButton && <SaveConcertButton concert={concert} />}
          {concert.ticket_url && (
            <a
              href={concert.ticket_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline btn-sm btn-interactive gap-2"
            >
              <ExternalLink className="h-4 w-4" aria-hidden />
              View tickets
            </a>
          )}
        </section>
      </section>
    </article>
  );
}
