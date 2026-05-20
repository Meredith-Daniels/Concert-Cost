"use client";

import { useAutoAnimate } from "@formkit/auto-animate/react";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Globe, Sparkles } from "lucide-react";
import { SpotifyConnectCard } from "@/components/SpotifyConnectCard";
import { UpcomingConcertCard } from "@/components/UpcomingConcertCard";
import { FeedbackAlert } from "@/components/ui/FeedbackAlert";
import { Skeleton } from "@/components/ui/Skeleton";
import type { RecommendedConcert } from "@/lib/recommendations/engine";

type SpotifyStatus = {
  configured: boolean;
  connected: boolean;
};

export function RecommendedConcerts() {
  const searchParams = useSearchParams();

  const [spotifyStatus, setSpotifyStatus] = useState<SpotifyStatus | null>(null);
  const [concerts, setConcerts] = useState<RecommendedConcert[]>([]);
  const [topArtists, setTopArtists] = useState<string[]>([]);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [emptyHint, setEmptyHint] = useState<string | null>(null);
  const [responseCode, setResponseCode] = useState<string | null>(null);
  const [listParent] = useAutoAnimate();

  const spotifyConnectedParam = searchParams.get("spotify_connected");
  const spotifyErrorParam = searchParams.get("spotify_error");

  const loadSpotifyStatus = useCallback(async () => {
    try {
      const response = await fetch("/api/spotify/status");
      const data = await response.json();
      if (response.ok) {
        setSpotifyStatus({
          configured: data.configured,
          connected: data.connected,
        });
      }
    } catch {
      setSpotifyStatus({ configured: false, connected: false });
    }
  }, []);

  const loadRecommendations = useCallback(async () => {
    setFetchLoading(true);
    setFetchError(null);
    setEmptyHint(null);
    setResponseCode(null);

    try {
      const response = await fetch("/api/concerts/recommended");
      const data = await response.json();

      if (!response.ok) {
        setResponseCode(data.code ?? null);
        setFetchError(data.error ?? "Failed to load recommendations.");
        setConcerts([]);
        setTopArtists([]);
        return;
      }

      setConcerts(data.concerts ?? []);
      setTopArtists(data.top_artists ?? []);
      setResponseCode(data.code ?? null);
      setEmptyHint(
        (data.concerts?.length ?? 0) === 0 && data.message ? data.message : null
      );
    } catch {
      setFetchError("Something went wrong while loading recommendations.");
      setConcerts([]);
    } finally {
      setFetchLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSpotifyStatus();
  }, [loadSpotifyStatus, spotifyConnectedParam]);

  useEffect(() => {
    if (spotifyStatus?.connected) {
      loadRecommendations();
    }
  }, [spotifyStatus?.connected, loadRecommendations, spotifyConnectedParam]);

  const isLoading = fetchLoading || spotifyStatus === null;
  const notConfigured = spotifyStatus?.configured === false;
  const notConnected = spotifyStatus?.configured && !spotifyStatus.connected;

  const hasBlockingError =
    responseCode === "SPOTIFY_NOT_CONNECTED" ||
    responseCode === "SPOTIFY_NOT_CONFIGURED" ||
    responseCode === "SPOTIFY_FETCH_FAILED" ||
    Boolean(fetchError && responseCode !== "NO_SPOTIFY_DATA");

  const showResults =
    !isLoading && spotifyStatus?.connected && !hasBlockingError;

  return (
    <section className="section-gap">
      {spotifyConnectedParam && (
        <FeedbackAlert
          variant="success"
          message="Spotify connected! Loading concerts for your top artists…"
        />
      )}

      {spotifyErrorParam && (
        <FeedbackAlert
          variant="error"
          message={`Spotify connection failed: ${spotifyErrorParam.replace(/_/g, " ")}`}
        />
      )}

      {(notConfigured || notConnected) && <SpotifyConnectCard />}

      {spotifyStatus?.connected && (
        <section className="section-gap">
          <SpotifyConnectCard />
          {topArtists.length > 0 && (
            <p className="flex items-center gap-2 text-sm text-base-content/70">
              <Globe className="h-4 w-4 shrink-0" aria-hidden />
              Shows in the next year for your top 50 artists &amp; tracks — any
              location. Sample: {topArtists.slice(0, 5).join(", ")}
              {topArtists.length > 5 ? "…" : ""}
            </p>
          )}
        </section>
      )}

      {fetchError && responseCode !== "NO_SPOTIFY_DATA" && (
        <FeedbackAlert
          variant="error"
          message={fetchError}
          onDismiss={() => setFetchError(null)}
        />
      )}

      {responseCode === "NO_SPOTIFY_DATA" && (
        <FeedbackAlert variant="info" message={fetchError ?? ""} />
      )}

      {isLoading && spotifyStatus?.connected && (
        <p className="text-sm text-base-content/70">
          Finding upcoming shows for your top 50 Spotify artists — loading
          listings from major cities (about 15 seconds)…
        </p>
      )}

      {isLoading && spotifyStatus?.connected && (
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

      {showResults && (
        <>
          <p className="text-sm text-base-content/70">
            {concerts.length === 0
              ? "No recommended concerts found right now — check back soon."
              : `${concerts.length} show${concerts.length === 1 ? "" : "s"} in the next year for your top artists & tracks`}
            <span className="text-base-content/50"> · via Spotify</span>
          </p>

          {concerts.length === 0 ? (
            <article className="section-card">
              <section className="card-body items-center py-12 text-center">
                <Sparkles className="mb-4 h-12 w-12 text-primary opacity-80" aria-hidden />
                <h3 className="text-lg font-semibold">No matches yet</h3>
                <p className="mt-2 max-w-md text-sm text-base-content/70">
                  {emptyHint ??
                    "No upcoming shows in the next year were found for your top Spotify artists. Many artists may not have tours listed yet — check back later."}
                </p>
                <a href="/nearby" className="btn btn-primary btn-interactive mt-6">
                  Browse nearby concerts
                </a>
              </section>
            </article>
          ) : (
            <section ref={listParent} className="grid gap-4 md:grid-cols-2">
              {concerts.map((concert) => (
                <UpcomingConcertCard
                  key={concert.id}
                  concert={concert}
                  showSaveButton
                  showDistance={concert.distance_miles > 0}
                  matchReason={concert.match_reason}
                />
              ))}
            </section>
          )}
        </>
      )}
    </section>
  );
}
