import { distanceInMiles, isConcertWithinNextYear, isValidCoordinates } from "@/lib/geo";
import { geocodePlace, geocodeVenue } from "@/lib/geocode";
import { normalizeArtistName } from "@/lib/recommendations/artist-match";
import { fetchUpcomingEventsViaApi } from "@/lib/songkick/api";
import { getSongkickApiKey } from "@/lib/songkick/config";
import { fetchSongkickHtml } from "@/lib/songkick/http";
import type { SongkickRawEvent } from "@/lib/songkick-events";

const SONGKICK_BASE = "https://www.songkick.com";
export const MAX_ARTISTS_TO_SEARCH = 50;
const MAX_EVENTS_PER_ARTIST = 24;

const artistPathCache = new Map<string, string | null>();
const artistEventsCache = new Map<string, SongkickRawEvent[]>();

type SchemaMusicEvent = {
  "@type"?: string;
  name?: string;
  url?: string;
  image?: string;
  startDate?: string;
  location?: {
    name?: string;
    geo?: { latitude?: number; longitude?: number };
    address?: {
      addressLocality?: string;
      addressRegion?: string;
      addressCountry?: string;
    };
  };
  performer?: { name?: string } | { name?: string }[];
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function parseJsonLdEvents(html: string): SchemaMusicEvent[] {
  const events: SchemaMusicEvent[] = [];
  const pattern =
    /<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi;

  for (const match of html.matchAll(pattern)) {
    const raw = match[1]?.trim();
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw) as SchemaMusicEvent | SchemaMusicEvent[];
      if (Array.isArray(parsed)) {
        events.push(...parsed.filter((e) => e["@type"] === "MusicEvent"));
      } else if (parsed["@type"] === "MusicEvent") {
        events.push(parsed);
      }
    } catch {
      // ignore
    }
  }
  return events;
}

function songkickIdFromUrl(url: string | undefined): string {
  if (!url) return `sk-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const match = url.match(/concerts\/(\d+)/);
  return match?.[1] ?? url;
}

function splitEventDateTime(startDate: string): {
  event_date: string;
  event_time: string | null;
} {
  if (startDate.includes("T")) {
    const [date, timePart] = startDate.split("T");
    return { event_date: date, event_time: timePart?.slice(0, 8) ?? null };
  }
  return { event_date: startDate.slice(0, 10), event_time: null };
}

function parseHtmlCalendarEvents(
  html: string,
  sourceArtistName: string
): SongkickRawEvent[] {
  const events: SongkickRawEvent[] = [];
  const seen = new Set<string>();

  const blockPattern =
    /<a[^>]+href="(\/concerts\/(\d+)-[^"]+)"[^>]*>[\s\S]*?<time[^>]+datetime="([^"]+)"[^>]*>/gi;

  for (const match of html.matchAll(blockPattern)) {
    const path = match[1];
    const id = match[2];
    const datetime = match[3];
    if (!path || !id || !datetime) continue;

    const { event_date, event_time } = splitEventDateTime(datetime);
    if (!isConcertWithinNextYear(event_date)) continue;
    if (seen.has(id)) continue;
    seen.add(id);

    const snippet = html.slice(
      Math.max(0, (match.index ?? 0) - 200),
      (match.index ?? 0) + 400
    );
    const venueMatch = snippet.match(/@ ([^<]+)</);
    const venue = venueMatch?.[1]?.trim() ?? "Venue TBA";

    events.push({
      id,
      name: `${sourceArtistName} @ ${venue}`,
      artist: sourceArtistName,
      venue,
      city: "",
      state: "",
      event_date,
      event_time,
      latitude: NaN,
      longitude: NaN,
      ticket_url: `${SONGKICK_BASE}${path}`,
      image_url: null,
      source_artist_name: sourceArtistName,
    });
  }

  return events.slice(0, MAX_EVENTS_PER_ARTIST);
}

function normalizeJsonLdEvent(
  raw: SchemaMusicEvent,
  sourceArtistName: string
): SongkickRawEvent | null {
  if (!raw.name || !raw.startDate) return null;

  const { event_date, event_time } = splitEventDateTime(raw.startDate);
  if (!isConcertWithinNextYear(event_date)) return null;

  const lat = Number(raw.location?.geo?.latitude);
  const lng = Number(raw.location?.geo?.longitude);

  const performers = Array.isArray(raw.performer)
    ? raw.performer
    : raw.performer
      ? [raw.performer]
      : [];
  const artist =
    performers.map((p) => p.name).filter(Boolean).join(", ") ||
    raw.name.split(" @ ")[0]?.trim() ||
    sourceArtistName;

  return {
    id: songkickIdFromUrl(raw.url),
    name: raw.name,
    artist,
    venue: raw.location?.name ?? "Venue TBA",
    city: raw.location?.address?.addressLocality ?? "",
    state:
      raw.location?.address?.addressRegion ??
      raw.location?.address?.addressCountry ??
      "",
    event_date,
    event_time,
    latitude: lat,
    longitude: lng,
    ticket_url: raw.url ?? null,
    image_url: raw.image ?? null,
    source_artist_name: sourceArtistName,
  };
}

function extractArtistCandidates(html: string): { path: string; slug: string }[] {
  const results: { path: string; slug: string }[] = [];
  const seen = new Set<string>();

  for (const match of html.matchAll(
    /href="(\/artists\/(\d+)-([^"?#]+))"/gi
  )) {
    const path = match[1];
    const slug = match[3];
    if (!path || !slug || seen.has(path)) continue;
    seen.add(path);
    results.push({ path, slug });
  }

  return results;
}

async function resolveArtistCalendarPath(artistName: string): Promise<string | null> {
  const cacheKey = artistName.toLowerCase();
  if (artistPathCache.has(cacheKey)) {
    return artistPathCache.get(cacheKey) ?? null;
  }

  const searchHtml = await fetchSongkickHtml(
    `${SONGKICK_BASE}/search?query=${encodeURIComponent(artistName)}&type=artists`
  );
  if (!searchHtml) {
    artistPathCache.set(cacheKey, null);
    return null;
  }

  const wantSlug = slugify(artistName);
  const candidates = extractArtistCandidates(searchHtml);

  const exact = candidates.find((c) => c.slug === wantSlug);
  const fuzzy = candidates.find(
    (c) =>
      c.slug.includes(wantSlug) ||
      wantSlug.includes(c.slug) ||
      normalizeArtistName(c.slug.replace(/-/g, " ")) ===
        normalizeArtistName(artistName)
  );

  const path = (exact ?? fuzzy)?.path ?? null;
  const calendarPath = path ? `${path}/calendar` : null;
  artistPathCache.set(cacheKey, calendarPath);
  return calendarPath;
}

async function ensureCoordinates(event: SongkickRawEvent): Promise<SongkickRawEvent | null> {
  if (isValidCoordinates({ latitude: event.latitude, longitude: event.longitude })) {
    return event;
  }

  const locationLabel = [event.city, event.state].filter(Boolean).join(", ");
  const coords = locationLabel
    ? await geocodeVenue(event.venue, event.city, event.state)
    : await geocodePlace(event.venue, event.name);

  if (!coords) return null;

  return {
    ...event,
    latitude: coords.latitude,
    longitude: coords.longitude,
  };
}

async function fetchArtistUpcomingEventsHtml(
  artistName: string
): Promise<SongkickRawEvent[]> {
  const cached = artistEventsCache.get(artistName.toLowerCase());
  if (cached) return cached;

  const calendarPath = await resolveArtistCalendarPath(artistName);
  if (!calendarPath) {
    artistEventsCache.set(artistName.toLowerCase(), []);
    return [];
  }

  const html = await fetchSongkickHtml(`${SONGKICK_BASE}${calendarPath}`);
  if (!html) {
    artistEventsCache.set(artistName.toLowerCase(), []);
    return [];
  }

  const byId = new Map<string, SongkickRawEvent>();

  for (const item of parseJsonLdEvents(html)) {
    const normalized = normalizeJsonLdEvent(item, artistName);
    if (normalized) byId.set(normalized.id, normalized);
  }

  if (byId.size === 0) {
    for (const item of parseHtmlCalendarEvents(html, artistName)) {
      byId.set(item.id, item);
    }
  }

  const finalized: SongkickRawEvent[] = [];
  for (const event of byId.values()) {
    const withCoords = await ensureCoordinates(event);
    if (withCoords) finalized.push(withCoords);
  }

  const sorted = finalized
    .sort((a, b) => a.event_date.localeCompare(b.event_date))
    .slice(0, MAX_EVENTS_PER_ARTIST);

  artistEventsCache.set(artistName.toLowerCase(), sorted);
  return sorted;
}

async function fetchViaHtmlScraping(
  artistNames: string[]
): Promise<SongkickRawEvent[]> {
  const byId = new Map<string, SongkickRawEvent>();

  for (const name of artistNames) {
    const events = await fetchArtistUpcomingEventsHtml(name);
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

async function finalizeApiEvents(
  events: SongkickRawEvent[]
): Promise<SongkickRawEvent[]> {
  const out: SongkickRawEvent[] = [];
  for (const event of events) {
    const withCoords = await ensureCoordinates(event);
    if (withCoords) out.push(withCoords);
  }
  return out;
}

/** Concerts in the next year for top Spotify artists (any location). */
export async function fetchUpcomingEventsForArtists(
  artistNames: string[]
): Promise<SongkickRawEvent[]> {
  const uniqueNames = [
    ...new Set(artistNames.map((n) => n.trim()).filter(Boolean)),
  ].slice(0, MAX_ARTISTS_TO_SEARCH);

  const apiKey = getSongkickApiKey();
  if (apiKey) {
    const apiEvents = await fetchUpcomingEventsViaApi(uniqueNames, apiKey);
    return finalizeApiEvents(apiEvents);
  }

  return fetchViaHtmlScraping(uniqueNames);
}

export function toPublicConcertEvents(
  rawEvents: SongkickRawEvent[],
  userLocation?: { latitude: number; longitude: number }
) {
  return rawEvents
    .filter((event) => isConcertWithinNextYear(event.event_date))
    .map((event) => ({
      id: event.id,
      name: event.name,
      artist: event.artist,
      venue: event.venue,
      city: event.city,
      state: event.state,
      event_date: event.event_date,
      event_time: event.event_time,
      distance_miles: userLocation
        ? distanceInMiles(userLocation, {
            latitude: event.latitude,
            longitude: event.longitude,
          })
        : 0,
      ticket_url: event.ticket_url,
      image_url: event.image_url,
      taste_artist: event.source_artist_name,
    }));
}
