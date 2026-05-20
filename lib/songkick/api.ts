import { isConcertWithinNextYear, oneYearFromTodayIsoDate, todayIsoDate } from "@/lib/geo";
import { getSongkickApiKey } from "@/lib/songkick/config";
import { fetchSongkickJson } from "@/lib/songkick/http";
import { normalizeArtistName } from "@/lib/recommendations/artist-match";
import type { SongkickRawEvent } from "@/lib/songkick-events";

const SONGKICK_API = "https://api.songkick.com/api/3.0";

type SongkickArtist = {
  id: number;
  displayName: string;
  uri?: string;
};

type SongkickApiEvent = {
  id: number;
  displayName: string;
  uri?: string;
  start?: { date?: string; time?: string };
  performance?: {
    artist?: { displayName?: string };
  }[];
  venue?: {
    displayName?: string;
    lat?: number;
    lng?: number;
    metroArea?: {
      state?: { displayName?: string };
      country?: { displayName?: string };
    };
  };
  location?: {
    city?: string;
    lat?: number;
    lng?: number;
  };
};

type ResultsPage<T> = {
  resultsPage?: {
    results?: T;
    status?: string;
    totalEntries?: number;
    perPage?: number;
    page?: number;
  };
};

function asArray<T>(value: T | T[] | undefined | null): T[] {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

function parseLocationCity(city: string | undefined): {
  city: string;
  state: string;
} {
  if (!city) return { city: "", state: "" };
  const parts = city.split(",").map((p) => p.trim());
  if (parts.length >= 2) {
    return { city: parts[0], state: parts[1] };
  }
  return { city: parts[0] ?? "", state: "" };
}

function headlinerName(event: SongkickApiEvent): string | null {
  const performances = asArray(event.performance);
  const headline = performances.find((p) => p.artist?.displayName);
  return headline?.artist?.displayName ?? performances[0]?.artist?.displayName ?? null;
}

function apiEventToRaw(
  event: SongkickApiEvent,
  sourceArtistName: string
): SongkickRawEvent | null {
  const eventDate = event.start?.date;
  if (!eventDate || !isConcertWithinNextYear(eventDate)) return null;

  const lat =
    Number(event.venue?.lat) ||
    Number(event.location?.lat) ||
    Number.NaN;
  const lng =
    Number(event.venue?.lng) ||
    Number(event.location?.lng) ||
    Number.NaN;

  const { city, state } = parseLocationCity(event.location?.city);
  const venueState =
    state ||
    event.venue?.metroArea?.state?.displayName ||
    event.venue?.metroArea?.country?.displayName ||
    "";

  return {
    id: String(event.id),
    name: event.displayName,
    artist: headlinerName(event),
    venue: event.venue?.displayName ?? "Venue TBA",
    city,
    state: venueState,
    event_date: eventDate,
    event_time: event.start?.time?.slice(0, 8) ?? null,
    latitude: Number.isFinite(lat) ? lat : NaN,
    longitude: Number.isFinite(lng) ? lng : NaN,
    ticket_url: event.uri ?? null,
    image_url: null,
    source_artist_name: sourceArtistName,
  };
}

async function searchArtistId(
  artistName: string,
  apiKey: string
): Promise<number | null> {
  const url = `${SONGKICK_API}/search/artists.json?apikey=${encodeURIComponent(apiKey)}&query=${encodeURIComponent(artistName)}&per_page=10`;
  const data = await fetchSongkickJson<
    ResultsPage<{ artist?: SongkickArtist | SongkickArtist[] }>
  >(url);

  const artists = asArray(data?.resultsPage?.results?.artist);
  if (artists.length === 0) return null;

  const target = normalizeArtistName(artistName);
  const exact = artists.find(
    (a) => normalizeArtistName(a.displayName) === target
  );
  if (exact) return exact.id;

  const contains = artists.find((a) => {
    const n = normalizeArtistName(a.displayName);
    return n.includes(target) || target.includes(n);
  });
  return (contains ?? artists[0]).id;
}

async function fetchArtistCalendarPage(
  artistId: number,
  apiKey: string,
  page: number
): Promise<SongkickApiEvent[]> {
  const min = todayIsoDate();
  const max = oneYearFromTodayIsoDate();
  const url = `${SONGKICK_API}/artists/${artistId}/calendar.json?apikey=${encodeURIComponent(apiKey)}&min_date=${min}&max_date=${max}&page=${page}&per_page=50`;
  const data = await fetchSongkickJson<
    ResultsPage<{ event?: SongkickApiEvent | SongkickApiEvent[] }>
  >(url);
  return asArray(data?.resultsPage?.results?.event);
}

export async function fetchArtistEventsViaApi(
  artistName: string,
  apiKey: string
): Promise<SongkickRawEvent[]> {
  const artistId = await searchArtistId(artistName, apiKey);
  if (artistId == null) return [];

  const events: SongkickRawEvent[] = [];
  const seen = new Set<string>();

  for (let page = 1; page <= 5; page++) {
    const pageEvents = await fetchArtistCalendarPage(artistId, apiKey, page);
    if (pageEvents.length === 0) break;

    for (const event of pageEvents) {
      const raw = apiEventToRaw(event, artistName);
      if (raw && !seen.has(raw.id)) {
        seen.add(raw.id);
        events.push(raw);
      }
    }

    if (pageEvents.length < 50) break;
  }

  return events.sort((a, b) => a.event_date.localeCompare(b.event_date));
}

export async function fetchUpcomingEventsViaApi(
  artistNames: string[],
  apiKey: string
): Promise<SongkickRawEvent[]> {
  const byId = new Map<string, SongkickRawEvent>();

  for (const name of artistNames) {
    const events = await fetchArtistEventsViaApi(name, apiKey);
    for (const event of events) {
      if (!byId.has(event.id)) {
        byId.set(event.id, event);
      }
    }
  }

  return [...byId.values()].sort((a, b) =>
    a.event_date.localeCompare(b.event_date)
  );
}
