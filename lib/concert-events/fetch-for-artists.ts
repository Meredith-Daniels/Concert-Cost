import { fetchUpcomingEventsForSpotifyArtists as fetchFromBandsintown } from "@/lib/bandsintown/client";
import { fetchMetroPoolEventsForArtists } from "@/lib/concert-events/metro-pool";
import type { RawConcertEvent } from "@/lib/concert-events/raw";
import { fetchUpcomingEventsViaApi } from "@/lib/songkick/api";
import { getSongkickApiKey } from "@/lib/songkick/config";
import { fetchUpcomingEventsFromTicketmaster } from "@/lib/ticketmaster/discovery";
import { isTicketmasterConfigured } from "@/lib/ticketmaster/config";
import { findRankedArtistInEvent } from "@/lib/recommendations/exact-artist-match";
import type { RankedArtist } from "@/lib/spotify/types";

/** Drop shows where none of the user's top artists are explicitly billed. */
function keepOnlyExactArtistShows(
  events: RawConcertEvent[],
  rankedArtists: RankedArtist[]
): RawConcertEvent[] {
  const kept: RawConcertEvent[] = [];

  for (const event of events) {
    const matched = findRankedArtistInEvent(
      { artist: event.artist, name: event.name },
      rankedArtists
    );
    if (!matched) continue;

    kept.push({ ...event, source_artist_name: matched.name });
  }

  return kept;
}

function mergeEvents(sources: RawConcertEvent[][]): RawConcertEvent[] {
  const byId = new Map<string, RawConcertEvent>();
  for (const list of sources) {
    for (const event of list) {
      if (!byId.has(event.id)) {
        byId.set(event.id, event);
      }
    }
  }
  return [...byId.values()].sort((a, b) =>
    a.event_date.localeCompare(b.event_date)
  );
}

async function fetchFromSongkickApi(
  rankedArtists: RankedArtist[]
): Promise<RawConcertEvent[]> {
  const apiKey = getSongkickApiKey();
  if (!apiKey) return [];

  const names = rankedArtists.map((a) => a.name);
  const events = await fetchUpcomingEventsViaApi(names, apiKey);

  return events.map((e) => ({
    id: `sk-${e.id}`,
    name: e.name,
    artist: e.artist,
    venue: e.venue,
    city: e.city,
    state: e.state,
    event_date: e.event_date,
    event_time: e.event_time,
    latitude: e.latitude,
    longitude: e.longitude,
    ticket_url: e.ticket_url,
    image_url: e.image_url,
    source_artist_name: e.source_artist_name,
  }));
}

/**
 * Upcoming concerts for Spotify-ranked artists from every available source.
 */
export async function fetchUpcomingEventsForSpotifyArtists(
  rankedArtists: RankedArtist[]
): Promise<RawConcertEvent[]> {
  const sources: RawConcertEvent[][] = [];

  if (isTicketmasterConfigured()) {
    sources.push(await fetchUpcomingEventsFromTicketmaster(rankedArtists));
  }

  const fromBandsintown = await fetchFromBandsintown(rankedArtists);
  if (fromBandsintown.length > 0) {
    sources.push(fromBandsintown);
  }

  sources.push(await fetchFromSongkickApi(rankedArtists));

  const metroMatched = await fetchMetroPoolEventsForArtists(rankedArtists);
  return keepOnlyExactArtistShows(
    mergeEvents([...sources, metroMatched]),
    rankedArtists
  );
}

export function hasDedicatedEventsApi(): boolean {
  return isTicketmasterConfigured() || Boolean(getSongkickApiKey());
}
