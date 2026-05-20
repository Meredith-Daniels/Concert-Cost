import {
  distanceInMiles,
  isConcertWithinNextYear,
  isValidCoordinates,
} from "@/lib/geo";
import {
  metroSeedsForLocation,
  metroSeedsNearCoordinates,
} from "@/lib/songkick-metros";
import type { ReverseGeocodeResult } from "@/lib/reverse-geocode";

import { fetchSongkickHtml } from "@/lib/songkick/http";

const SONGKICK_BASE = "https://www.songkick.com";
const MAX_METRO_PAGES = 5;

const metroPathCache = new Map<string, string[]>();

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

export type SongkickRawEvent = {
  id: string;
  name: string;
  artist: string | null;
  venue: string;
  city: string;
  state: string;
  event_date: string;
  event_time: string | null;
  latitude: number;
  longitude: number;
  ticket_url: string | null;
  image_url: string | null;
  /** Spotify/Songkick artist we searched for (recommendations). */
  source_artist_name?: string;
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
      // ignore malformed blocks
    }
  }

  return events;
}

function parsePerformers(
  performer: SchemaMusicEvent["performer"]
): string | null {
  if (!performer) return null;
  const list = Array.isArray(performer) ? performer : [performer];
  const names = list.map((p) => p.name).filter(Boolean) as string[];
  return names.length > 0 ? names.join(", ") : null;
}

function splitEventDateTime(startDate: string): {
  event_date: string;
  event_time: string | null;
} {
  if (startDate.includes("T")) {
    const [date, timePart] = startDate.split("T");
    const time = timePart?.slice(0, 8) ?? null;
    return { event_date: date, event_time: time };
  }
  return { event_date: startDate.slice(0, 10), event_time: null };
}

function extractArtistFromTitle(title: string): string | null {
  const atIndex = title.indexOf(" @ ");
  if (atIndex > 0) return title.slice(0, atIndex).trim();
  return null;
}

function songkickIdFromUrl(url: string | undefined): string {
  if (!url) return `sk-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const match = url.match(/concerts\/(\d+)/);
  return match?.[1] ?? url;
}

function normalizeSongkickEvent(raw: SchemaMusicEvent): SongkickRawEvent | null {
  if (!raw.name || !raw.startDate) return null;

  const lat = Number(raw.location?.geo?.latitude);
  const lng = Number(raw.location?.geo?.longitude);
  if (!isValidCoordinates({ latitude: lat, longitude: lng })) return null;

  const { event_date, event_time } = splitEventDateTime(raw.startDate);
  if (!isConcertWithinNextYear(event_date)) return null;

  const performers = parsePerformers(raw.performer);
  const artist = performers ?? extractArtistFromTitle(raw.name);

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
  };
}

async function fetchHtml(path: string): Promise<string | null> {
  return fetchSongkickHtml(`${SONGKICK_BASE}${path}`);
}

function extractMetroPaths(html: string): string[] {
  const matches = html.matchAll(/metro-areas\/(\d+-[a-z0-9-]+)/gi);
  const paths = new Set<string>();
  for (const match of matches) {
    paths.add(`/metro-areas/${match[1]}`);
  }
  return [...paths];
}

function rankMetroPaths(
  paths: string[],
  location: ReverseGeocodeResult
): string[] {
  const citySlug = slugify(location.city);
  const stateSlug = slugify(location.state);

  return [...paths].sort((a, b) => {
    const score = (path: string) => {
      const lower = path.toLowerCase();
      let s = 0;
      if (lower.includes(citySlug)) s += 10;
      if (lower.includes(stateSlug)) s += 2;
      if (location.country_code && lower.includes(location.country_code)) {
        s += 1;
      }
      return s;
    };
    return score(b) - score(a);
  });
}

export async function resolveSongkickMetroPaths(
  location: ReverseGeocodeResult,
  latitude: number,
  longitude: number,
  radiusMiles: number
): Promise<string[]> {
  const cacheKey = `${location.city}|${location.state}|${location.country_code}|${radiusMiles}`;
  if (metroPathCache.has(cacheKey)) {
    return metroPathCache.get(cacheKey) ?? [];
  }

  const paths = new Set<string>();

  for (const path of metroSeedsForLocation(
    location,
    latitude,
    longitude,
    radiusMiles
  )) {
    paths.add(path);
  }

  const queries = [
    `${location.city}, ${location.state}`,
    location.city,
    location.state,
  ];

  for (const query of queries) {
    const searchHtml = await fetchHtml(
      `/search?query=${encodeURIComponent(query)}`
    );
    if (!searchHtml) continue;

    for (const path of rankMetroPaths(extractMetroPaths(searchHtml), location)) {
      paths.add(path);
    }
  }

  const ranked = [...paths].slice(0, MAX_METRO_PAGES);

  metroPathCache.set(cacheKey, ranked);
  return ranked;
}

export async function fetchSongkickMetroEvents(
  metroPath: string
): Promise<SongkickRawEvent[]> {
  const html = await fetchHtml(metroPath);
  if (!html) return [];

  const parsed = parseJsonLdEvents(html);
  const events: SongkickRawEvent[] = [];

  for (const item of parsed) {
    const normalized = normalizeSongkickEvent(item);
    if (normalized) events.push(normalized);
  }

  return events;
}

/** Fetch events using only coordinates when reverse geocoding fails. */
export async function fetchSongkickEventsWithoutCity(
  latitude: number,
  longitude: number,
  radiusMiles: number
): Promise<SongkickRawEvent[]> {
  const metroPaths = metroSeedsNearCoordinates(
    latitude,
    longitude,
    radiusMiles
  );
  if (metroPaths.length === 0) return [];

  const userLocation = { latitude, longitude };
  const byId = new Map<string, SongkickRawEvent>();

  for (const path of metroPaths) {
    const events = await fetchSongkickMetroEvents(path);
    for (const event of events) {
      const miles = distanceInMiles(userLocation, {
        latitude: event.latitude,
        longitude: event.longitude,
      });
      if (miles > radiusMiles) continue;
      if (!byId.has(event.id)) byId.set(event.id, event);
    }
  }

  return [...byId.values()].sort((a, b) =>
    a.event_date.localeCompare(b.event_date)
  );
}

export async function fetchSongkickEventsNearLocation(
  latitude: number,
  longitude: number,
  radiusMiles: number,
  location: ReverseGeocodeResult
): Promise<SongkickRawEvent[]> {
  let metroPaths = await resolveSongkickMetroPaths(
    location,
    latitude,
    longitude,
    radiusMiles
  );

  if (metroPaths.length === 0) {
    metroPaths = metroSeedsNearCoordinates(latitude, longitude, radiusMiles);
  }

  if (metroPaths.length === 0) return [];

  const userLocation = { latitude, longitude };
  const byId = new Map<string, SongkickRawEvent>();

  for (const path of metroPaths) {
    const events = await fetchSongkickMetroEvents(path);
    for (const event of events) {
      const miles = distanceInMiles(userLocation, {
        latitude: event.latitude,
        longitude: event.longitude,
      });
      if (miles > radiusMiles) continue;
      if (!byId.has(event.id)) {
        byId.set(event.id, event);
      }
    }
  }

  return [...byId.values()].sort((a, b) => {
    if (a.event_date !== b.event_date) {
      return a.event_date.localeCompare(b.event_date);
    }
    const distA = distanceInMiles(userLocation, {
      latitude: a.latitude,
      longitude: a.longitude,
    });
    const distB = distanceInMiles(userLocation, {
      latitude: b.latitude,
      longitude: b.longitude,
    });
    return distA - distB;
  });
}
