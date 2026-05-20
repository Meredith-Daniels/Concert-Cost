import { GLOBAL_METRO_PATHS } from "@/lib/concert-events/global-metros";
import type { RawConcertEvent } from "@/lib/concert-events/raw";
import { isConcertWithinNextYear } from "@/lib/geo";
import { findRankedArtistInEvent } from "@/lib/recommendations/exact-artist-match";
import {
  fetchSongkickMetroEvents,
  type SongkickRawEvent,
} from "@/lib/songkick-events";
import type { RankedArtist } from "@/lib/spotify/types";

const metroCache = new Map<string, SongkickRawEvent[]>();
const METRO_CACHE_MS = 60 * 60 * 1000;
let metroCacheAt = 0;

function toRaw(event: SongkickRawEvent): RawConcertEvent {
  return {
    id: `sk-${event.id}`,
    name: event.name,
    artist: event.artist,
    venue: event.venue,
    city: event.city,
    state: event.state,
    event_date: event.event_date,
    event_time: event.event_time,
    latitude: event.latitude,
    longitude: event.longitude,
    ticket_url: event.ticket_url,
    image_url: event.image_url,
  };
}

async function loadMetroEvents(): Promise<SongkickRawEvent[]> {
  if (metroCache.size > 0 && Date.now() - metroCacheAt < METRO_CACHE_MS) {
    return [...metroCache.values()].flat();
  }

  metroCache.clear();
  const all: SongkickRawEvent[] = [];

  const paths =
    process.env.VERCEL === "1"
      ? GLOBAL_METRO_PATHS.slice(0, 8)
      : [...GLOBAL_METRO_PATHS];
  const delayMs = process.env.VERCEL === "1" ? 500 : 900;

  for (const path of paths) {
    const events = await fetchSongkickMetroEvents(path);
    metroCache.set(path, events);
    all.push(...events);
    await new Promise((r) => setTimeout(r, delayMs));
  }

  metroCacheAt = Date.now();
  return all;
}

/**
 * Pull upcoming shows from major city listings and keep those matching
 * the user's Spotify top artists (works when per-artist APIs are blocked).
 */
export async function fetchMetroPoolEventsForArtists(
  rankedArtists: RankedArtist[]
): Promise<RawConcertEvent[]> {
  const metroEvents = await loadMetroEvents();
  const byId = new Map<string, RawConcertEvent>();

  for (const sk of metroEvents) {
    if (!isConcertWithinNextYear(sk.event_date)) continue;

    const raw = toRaw(sk);
    const matched = findRankedArtistInEvent(
      { artist: raw.artist, name: raw.name },
      rankedArtists
    );
    if (!matched) continue;

    raw.source_artist_name = matched.name;
    const id = raw.id;
    if (!byId.has(id)) {
      byId.set(id, raw);
    }
  }

  return [...byId.values()].sort((a, b) =>
    a.event_date.localeCompare(b.event_date)
  );
}
