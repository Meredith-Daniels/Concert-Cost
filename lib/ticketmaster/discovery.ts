import {
  isConcertWithinNextYear,
  isValidCoordinates,
  oneYearFromTodayIsoDate,
  todayIsoDate,
} from "@/lib/geo";
import { geocodeVenue } from "@/lib/geocode";
import type { RawConcertEvent } from "@/lib/concert-events/raw";
import { getTicketmasterApiKey } from "@/lib/ticketmaster/config";
import { eventFeaturesArtist } from "@/lib/recommendations/exact-artist-match";
import { normalizeArtistName } from "@/lib/recommendations/artist-match";
import type { RankedArtist } from "@/lib/spotify/types";

const BASE = "https://app.ticketmaster.com/discovery/v2";
const MAX_ARTISTS = 50;
const CONCURRENCY = 6;

type TmVenue = {
  name?: string;
  city?: { name?: string };
  state?: { stateCode?: string };
  country?: { countryCode?: string };
  location?: { latitude?: string; longitude?: string };
};
type TmEvent = {
  id: string;
  name: string;
  url?: string;
  dates?: { start?: { localDate?: string; localTime?: string } };
  _embedded?: { venues?: TmVenue[]; attractions?: { name: string }[] };
};

async function tmFetch<T>(path: string, apiKey: string): Promise<T | null> {
  const url = `${BASE}${path}${path.includes("?") ? "&" : "?"}apikey=${encodeURIComponent(apiKey)}`;
  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

function eventMatchesArtist(event: TmEvent, artistName: string): boolean {
  const attractionNames = (event._embedded?.attractions ?? [])
    .map((a) => a.name)
    .filter(Boolean)
    .join(", ");

  return eventFeaturesArtist(artistName, {
    artist: attractionNames || null,
    name: event.name,
  });
}

async function ensureCoords(
  raw: RawConcertEvent
): Promise<RawConcertEvent | null> {
  if (isValidCoordinates({ latitude: raw.latitude, longitude: raw.longitude })) {
    return raw;
  }
  const coords = await geocodeVenue(raw.venue, raw.city, raw.state);
  if (!coords) return null;
  return { ...raw, latitude: coords.latitude, longitude: coords.longitude };
}

function tmEventToRaw(
  event: TmEvent,
  sourceArtist: RankedArtist
): RawConcertEvent | null {
  const eventDate = event.dates?.start?.localDate;
  if (!eventDate || !isConcertWithinNextYear(eventDate)) return null;
  if (!eventMatchesArtist(event, sourceArtist.name)) return null;

  const venue = event._embedded?.venues?.[0];
  const lat = Number(venue?.location?.latitude);
  const lng = Number(venue?.location?.longitude);
  const venueName = venue?.name ?? "Venue TBA";
  const artist =
    event._embedded?.attractions?.find(
      (a) =>
        normalizeArtistName(a.name) === normalizeArtistName(sourceArtist.name)
    )?.name ??
    event._embedded?.attractions?.[0]?.name ??
    sourceArtist.name;

  return {
    id: `tm-${event.id}`,
    name: event.name,
    artist,
    venue: venueName,
    city: venue?.city?.name ?? "",
    state: venue?.state?.stateCode ?? venue?.country?.countryCode ?? "",
    event_date: eventDate,
    event_time: event.dates?.start?.localTime?.slice(0, 8) ?? null,
    latitude: lat,
    longitude: lng,
    ticket_url: event.url ?? null,
    image_url: null,
    source_artist_name: sourceArtist.name,
  };
}

async function fetchArtistEventsByKeyword(
  artist: RankedArtist,
  apiKey: string
): Promise<RawConcertEvent[]> {
  const start = `${todayIsoDate()}T00:00:00Z`;
  const end = `${oneYearFromTodayIsoDate()}T23:59:59Z`;
  const data = await tmFetch<{
    _embedded?: { events?: TmEvent[] };
  }>(
    `/events.json?keyword=${encodeURIComponent(artist.name)}&classificationName=music&startDateTime=${start}&endDateTime=${end}&size=50&sort=date,asc`,
    apiKey
  );

  const events = data?._embedded?.events ?? [];
  const out: RawConcertEvent[] = [];

  for (const event of events) {
    const raw = tmEventToRaw(event, artist);
    if (!raw) continue;
    const withCoords = await ensureCoords(raw);
    if (withCoords) out.push(withCoords);
  }

  return out;
}

async function fetchInBatches(
  artists: RankedArtist[],
  apiKey: string
): Promise<RawConcertEvent[]> {
  const byId = new Map<string, RawConcertEvent>();

  for (let i = 0; i < artists.length; i += CONCURRENCY) {
    const batch = artists.slice(i, i + CONCURRENCY);
    const results = await Promise.all(
      batch.map((artist) => fetchArtistEventsByKeyword(artist, apiKey))
    );

    for (const events of results) {
      for (const event of events) {
        if (!byId.has(event.id)) {
          byId.set(event.id, event);
        }
      }
    }
  }

  return [...byId.values()].sort((a, b) =>
    a.event_date.localeCompare(b.event_date)
  );
}

export async function fetchUpcomingEventsFromTicketmaster(
  rankedArtists: RankedArtist[]
): Promise<RawConcertEvent[]> {
  const apiKey = getTicketmasterApiKey();
  if (!apiKey) return [];

  return fetchInBatches(rankedArtists.slice(0, MAX_ARTISTS), apiKey);
}
