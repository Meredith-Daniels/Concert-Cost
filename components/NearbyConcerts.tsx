"use client";

import { useAutoAnimate } from "@formkit/auto-animate/react";
import { useCallback, useEffect, useState } from "react";
import { MapPin, RefreshCw } from "lucide-react";
import { RadiusSlider } from "@/components/RadiusSlider";
import { UpcomingConcertCard } from "@/components/UpcomingConcertCard";
import { FeedbackAlert } from "@/components/ui/FeedbackAlert";
import { Skeleton } from "@/components/ui/Skeleton";
import { useGeolocation } from "@/hooks/useGeolocation";
import type { PublicConcertEvent } from "@/lib/public-events";

const DEFAULT_RADIUS = 25;
const FETCH_DEBOUNCE_MS = 350;

export function NearbyConcerts() {
  const { latitude, longitude, loading: geoLoading, error: geoError, requestLocation } =
    useGeolocation();
  const [radiusMiles, setRadiusMiles] = useState(DEFAULT_RADIUS);
  const [concerts, setConcerts] = useState<PublicConcertEvent[]>([]);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [listParent] = useAutoAnimate();

  const loadConcerts = useCallback(
    async (lat: number, lng: number, radius: number) => {
      setFetchLoading(true);
      setFetchError(null);

      try {
        const params = new URLSearchParams({
          latitude: String(lat),
          longitude: String(lng),
          radius_miles: String(radius),
        });

        const response = await fetch(`/api/concerts/nearby?${params}`);
        const data = await response.json();

        if (!response.ok) {
          setFetchError(data.error ?? "Failed to load nearby concerts.");
          setConcerts([]);
          return;
        }

        setConcerts(data.concerts ?? []);
      } catch {
        setFetchError("Something went wrong while searching for concerts.");
        setConcerts([]);
      } finally {
        setFetchLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (latitude == null || longitude == null) return;

    const timer = window.setTimeout(() => {
      loadConcerts(latitude, longitude, radiusMiles);
    }, FETCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [latitude, longitude, radiusMiles, loadConcerts]);

  const isLoading = geoLoading || fetchLoading;
  const sliderDisabled = geoLoading || latitude == null;

  return (
    <section className="section-gap">
      <RadiusSlider
        value={radiusMiles}
        onChange={setRadiusMiles}
        disabled={sliderDisabled}
      />

      {geoError && (
        <section className="flex flex-col gap-3">
          <FeedbackAlert variant="warning" message={geoError} />
          <button
            type="button"
            className="btn btn-outline btn-sm btn-interactive w-fit gap-2"
            onClick={requestLocation}
          >
            <RefreshCw className="h-4 w-4" aria-hidden />
            Try location again
          </button>
        </section>
      )}

      {geoLoading && !geoError && (
        <p className="text-sm text-base-content/70">Detecting your location…</p>
      )}

      {fetchError && (
        <FeedbackAlert
          variant="error"
          message={fetchError}
          onDismiss={() => setFetchError(null)}
        />
      )}

      {isLoading && (
        <section className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <article key={i} className="section-card">
              <section className="section-card-body gap-3">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-12 w-full" />
              </section>
            </article>
          ))}
        </section>
      )}

      {!isLoading && !geoError && !fetchError && latitude != null && (
        <>
          <p className="text-sm text-base-content/70">
            {concerts.length === 0
              ? `No concerts found within ${radiusMiles} miles.`
              : `${concerts.length} upcoming concert${concerts.length === 1 ? "" : "s"} within ${radiusMiles} miles`}
            <span className="text-base-content/50"> · via Songkick</span>
          </p>

          {concerts.length === 0 ? (
            <article className="section-card">
              <section className="card-body items-center py-12 text-center">
                <MapPin className="mb-4 h-12 w-12 text-primary opacity-80" aria-hidden />
                <h3 className="text-lg font-semibold">No concerts nearby</h3>
                <p className="mt-2 max-w-md text-sm text-base-content/70">
                  No concerts found within {radiusMiles} miles. Try increasing the
                  radius or check back later — listings come from Songkick and
                  depend on what is scheduled in your area.
                </p>
              </section>
            </article>
          ) : (
            <section ref={listParent} className="grid gap-4 md:grid-cols-2">
              {concerts.map((concert) => (
                <UpcomingConcertCard
                  key={concert.id}
                  concert={concert}
                  showSaveButton
                />
              ))}
            </section>
          )}
        </>
      )}
    </section>
  );
}
