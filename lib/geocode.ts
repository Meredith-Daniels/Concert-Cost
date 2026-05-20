import type { Coordinates } from "@/lib/geo";

const geocodeCache = new Map<string, Coordinates | null>();

function cacheKey(city: string, state: string, venue: string): string {
  return `${venue}|${city}|${state}`.toLowerCase().trim();
}

/**
 * Geocode a US venue using OpenStreetMap Nominatim (no API key required).
 * Results are cached in memory for the server process lifetime.
 */
async function nominatimSearch(query: string, cacheKeyValue: string): Promise<Coordinates | null> {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "ConcertCostTracker/1.0 (student project)",
      },
      next: { revalidate: 86400 },
    });

    if (!response.ok) {
      geocodeCache.set(cacheKeyValue, null);
      return null;
    }

    const data = (await response.json()) as { lat: string; lon: string }[];
    if (!data?.length) {
      geocodeCache.set(cacheKeyValue, null);
      return null;
    }

    const coords: Coordinates = {
      latitude: Number(data[0].lat),
      longitude: Number(data[0].lon),
    };

    geocodeCache.set(cacheKeyValue, coords);
    return coords;
  } catch {
    geocodeCache.set(cacheKeyValue, null);
    return null;
  }
}

export async function geocodeVenue(
  venue: string,
  city: string,
  state: string
): Promise<Coordinates | null> {
  const key = cacheKey(city, state, venue);
  if (geocodeCache.has(key)) {
    return geocodeCache.get(key) ?? null;
  }

  const usQuery = `${venue}, ${city}, ${state}, USA`;
  let coords = await nominatimSearch(usQuery, `${key}|us`);
  if (!coords) {
    const globalQuery = `${venue}, ${city}, ${state}`.replace(/,\s*,/g, ",");
    coords = await nominatimSearch(globalQuery, `${key}|global`);
  }
  geocodeCache.set(key, coords);
  return coords;
}

/** Geocode using a full location label (e.g. "London, UK"). */
export async function geocodePlace(
  venue: string,
  locationLabel: string
): Promise<Coordinates | null> {
  const key = cacheKey(locationLabel, "", venue);
  if (geocodeCache.has(key)) {
    return geocodeCache.get(key) ?? null;
  }
  return nominatimSearch(`${venue}, ${locationLabel}`, key);
}
