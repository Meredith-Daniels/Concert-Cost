import { NextResponse } from "next/server";
import { toPublicConcertEvents } from "@/lib/concert-events/to-public";
import { isValidCoordinates } from "@/lib/geo";
import { buildRecommendedConcerts } from "@/lib/recommendations/engine";
import {
  fetchUpcomingEventsForSpotifyArtists,
  hasDedicatedEventsApi,
} from "@/lib/spotify/artist-events";
import { buildRankedArtistsFromSpotify } from "@/lib/spotify/api";
import { isSpotifyConfigured } from "@/lib/spotify/config";
import { getValidSpotifyAccessToken } from "@/lib/spotify/tokens";
import { createClient } from "@/lib/supabase/server";

/** For You scans multiple sources; allow up to 60s on Vercel Pro. Hobby plan max is 10s. */
export const maxDuration = 60;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const latParam = searchParams.get("latitude");
  const lngParam = searchParams.get("longitude");
  const lat = latParam != null ? Number(latParam) : null;
  const lng = lngParam != null ? Number(lngParam) : null;

  const hasLocation =
    lat != null &&
    lng != null &&
    isValidCoordinates({ latitude: lat, longitude: lng });

  if (!isSpotifyConfigured()) {
    return NextResponse.json(
      {
        code: "SPOTIFY_NOT_CONFIGURED",
        error:
          "Spotify integration is not configured on the server. Add SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET.",
      },
      { status: 503 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const accessToken = await getValidSpotifyAccessToken(user.id);
  if (!accessToken) {
    return NextResponse.json(
      {
        code: "SPOTIFY_NOT_CONNECTED",
        error: "Connect Spotify to get personalized concert recommendations.",
      },
      { status: 403 }
    );
  }

  try {
    const rankedArtists = await buildRankedArtistsFromSpotify(accessToken);

    if (rankedArtists.length === 0) {
      return NextResponse.json({
        concerts: [],
        code: "NO_SPOTIFY_DATA",
        message:
          "We could not find listening history on your Spotify account yet. Play some music and try again.",
        top_artists: [],
      });
    }

    const rawEvents = await fetchUpcomingEventsForSpotifyArtists(rankedArtists);

    const userLocation = hasLocation
      ? { latitude: lat!, longitude: lng! }
      : undefined;

    const concerts = toPublicConcertEvents(rawEvents, userLocation, "spotify");

    const recommendations = buildRecommendedConcerts({
      concerts,
      rankedArtists,
      radiusMiles: hasLocation ? 500 : 0,
    });

    const message =
      recommendations.length === 0
        ? "No upcoming shows in the next year matched your top Spotify artists yet. Try again later, or add TICKETMASTER_API_KEY to .env.local for more coverage."
        : undefined;

    return NextResponse.json({
      concerts: recommendations,
      message,
      top_artists: rankedArtists.map((a) => a.name),
      artist_count: rankedArtists.length,
      events_found: concerts.length,
      raw_events_found: rawEvents.length,
      horizon: "next_year",
      scope: "global",
      uses_location: hasLocation,
      source: "spotify",
      dedicated_events_api: hasDedicatedEventsApi(),
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to build recommendations.";
    return NextResponse.json(
      {
        code: "SPOTIFY_FETCH_FAILED",
        error: message,
      },
      { status: 502 }
    );
  }
}
