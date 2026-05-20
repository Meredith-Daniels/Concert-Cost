import { geocodeVenue } from "@/lib/geocode";
import { isConcertWithinNextYear, isValidCoordinates } from "@/lib/geo";
import { getBandsintownAppId } from "@/lib/bandsintown/config";
import { eventFeaturesArtist } from "@/lib/recommendations/exact-artist-match";
import type { RawConcertEvent } from "@/lib/concert-events/raw";
import type { RankedArtist } from "@/lib/spotify/types";

const BASE = "https://rest.bandsintown.com";
const MAX_ARTISTS = 50;
const CONCURRENCY = 4;

type BitVenue = {
  name?: string;
  latitude?: string;
  longitude?: string;
  city?: string;
  region?: string;
  country?: string;
};

type BitEvent = {
  id?: string;
  datetime?: string;
  url?: string;
  venue?: BitVenue;
  lineup?: string[];
  artist_id?: string;
};

function artistPath(artist: RankedArtist): string {
  const id = artist.spotify_id;
  if (id && !id.startsWith("recent-")) {
    return `/artists/id_${encodeURIComponent(id)}/events`;
  }
  return `/artists/${encodeURIComponent(artist.name)}/events`;
}

async function parseBitEvent(
  event: BitEvent,
  sourceArtist: RankedArtist
): Promise<RawConcertEvent | null> {
  if (!event.datetime || !event.id) return null;

  const eventDate = event.datetime.slice(0, 10);
  if (!isConcertWithinNextYear(eventDate)) return null;

  let lat = Number(event.venue?.latitude);
  let lng = Number(event.venue?.longitude);
  const lineup = (event.lineup ?? []).filter(Boolean);
  const lineupArtist = lineup[0] ?? sourceArtist.name;
  const billedArtists = lineup.length > 0 ? lineup.join(", ") : sourceArtist.name;
  const venue = event.venue?.name ?? "Venue TBA";
  const city = event.venue?.city ?? "";
  const state = event.venue?.region ?? event.venue?.country ?? "";
  const eventTitle = `${lineupArtist} @ ${venue}`;

  if (!isValidCoordinates({ latitude: lat, longitude: lng })) {
    const coords = await geocodeVenue(venue, city, state);
    if (!coords) return null;
    lat = coords.latitude;
    lng = coords.longitude;
  }

  if (
    !eventFeaturesArtist(sourceArtist.name, {
      artist: billedArtists,
      name: eventTitle,
    })
  ) {
    return null;
  }

  return {
    id: `bit-${event.id}`,
    name: eventTitle,
    artist: billedArtists,
    venue,
    city,
    state,
    event_date: eventDate,
    event_time: event.datetime.includes("T")
      ? event.datetime.split("T")[1]?.slice(0, 8) ?? null
      : null,
    latitude: lat,
    longitude: lng,
    ticket_url: event.url ?? null,
    image_url: null,
    source_artist_name: sourceArtist.name,
  };
}

async function fetchArtistEvents(
  artist: RankedArtist,
  appId: string
): Promise<RawConcertEvent[]> {
  const params = new URLSearchParams({
    app_id: appId,
    date: "upcoming",
  });
  const url = `${BASE}${artistPath(artist)}?${params}`;

  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) return [];

    const data = (await response.json()) as BitEvent[] | { error?: string };
    if (!Array.isArray(data)) return [];

    const events: RawConcertEvent[] = [];
    for (const item of data) {
      const parsed = await parseBitEvent(item, artist);
      if (parsed) events.push(parsed);
    }
    return events;
  } catch {
    return [];
  }
}

async function fetchInBatches(
  artists: RankedArtist[],
  appId: string
): Promise<RawConcertEvent[]> {
  const byId = new Map<string, RawConcertEvent>();

  for (let i = 0; i < artists.length; i += CONCURRENCY) {
    const batch = artists.slice(i, i + CONCURRENCY);
    const results = await Promise.all(
      batch.map((artist) => fetchArtistEvents(artist, appId))
    );

    for (const events of results) {
      for (const event of events) {
        if (!byId.has(event.id)) {
          byId.set(event.id, event);
        }
      }
    }

    if (i + CONCURRENCY < artists.length) {
      await new Promise((r) => setTimeout(r, 120));
    }
  }

  return [...byId.values()].sort((a, b) =>
    a.event_date.localeCompare(b.event_date)
  );
}

/** Upcoming shows for Spotify-ranked artists (Bandsintown uses Spotify artist IDs). */
export async function fetchUpcomingEventsForSpotifyArtists(
  rankedArtists: RankedArtist[]
): Promise<RawConcertEvent[]> {
  const artists = rankedArtists.slice(0, MAX_ARTISTS);
  const appId = getBandsintownAppId();
  return fetchInBatches(artists, appId);
}
