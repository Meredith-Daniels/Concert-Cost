import type { SupabaseClient } from "@supabase/supabase-js";
import type { Concert } from "@/lib/database.types";
import type { Database } from "@/lib/database.types";
import { geocodeVenue } from "@/lib/geocode";
import {
  distanceInMiles,
  isUpcomingConcertDate,
  isValidCoordinates,
  type Coordinates,
} from "@/lib/geo";

export type ConcertWithCoords = Concert & {
  venue_latitude: number;
  venue_longitude: number;
};

export type NearbyConcertResult = ConcertWithCoords & {
  distance_miles: number;
};

async function resolveVenueCoordinates(
  concert: Concert,
  supabase?: SupabaseClient<Database>
): Promise<Coordinates | null> {
  if (
    isValidCoordinates({
      latitude: concert.venue_latitude ?? undefined,
      longitude: concert.venue_longitude ?? undefined,
    })
  ) {
    return {
      latitude: Number(concert.venue_latitude),
      longitude: Number(concert.venue_longitude),
    };
  }

  const geocoded = await geocodeVenue(concert.venue, concert.city, concert.state);
  if (!geocoded) return null;

  if (supabase) {
    await supabase
      .from("concerts")
      .update({
        venue_latitude: geocoded.latitude,
        venue_longitude: geocoded.longitude,
      })
      .eq("id", concert.id);
  }

  return geocoded;
}

export async function enrichUpcomingConcertsWithCoords(
  concerts: Concert[],
  supabase?: SupabaseClient<Database>
): Promise<ConcertWithCoords[]> {
  const upcoming = concerts.filter((c) => isUpcomingConcertDate(c.concert_date));
  const enriched: ConcertWithCoords[] = [];

  for (const concert of upcoming) {
    const coords = await resolveVenueCoordinates(concert, supabase);
    if (!coords) continue;

    enriched.push({
      ...concert,
      venue_latitude: coords.latitude,
      venue_longitude: coords.longitude,
    });
  }

  return enriched;
}

export function filterConcertsByRadius(
  concerts: ConcertWithCoords[],
  userLocation: Coordinates,
  radiusMiles: number
): NearbyConcertResult[] {
  return concerts
    .map((concert) => ({
      ...concert,
      distance_miles: distanceInMiles(userLocation, {
        latitude: concert.venue_latitude,
        longitude: concert.venue_longitude,
      }),
    }))
    .filter((c) => c.distance_miles <= radiusMiles)
    .sort((a, b) => {
      if (a.concert_date !== b.concert_date) {
        return a.concert_date.localeCompare(b.concert_date);
      }
      return a.distance_miles - b.distance_miles;
    });
}
