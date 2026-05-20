import { distanceInMiles } from "@/lib/geo";
import { reverseGeocode } from "@/lib/reverse-geocode";
import {
  fetchSongkickEventsNearLocation,
  fetchSongkickEventsWithoutCity,
} from "@/lib/songkick-events";

export type PublicConcertEvent = {
  id: string;
  name: string;
  artist: string | null;
  venue: string;
  city: string;
  state: string;
  event_date: string;
  event_time: string | null;
  distance_miles: number;
  ticket_url: string | null;
  image_url: string | null;
  /** Artist from the user's Spotify list used to find this show */
  taste_artist?: string;
  /** Where this listing came from (saved to liked_concerts) */
  source?: "spotify" | "songkick";
};

export type PublicEventsSource = "songkick";

export async function fetchNearbyPublicConcerts(
  latitude: number,
  longitude: number,
  radiusMiles: number
): Promise<{ events: PublicConcertEvent[]; source: PublicEventsSource }> {
  const location = await reverseGeocode(latitude, longitude);

  const rawEvents = location
    ? await fetchSongkickEventsNearLocation(
        latitude,
        longitude,
        radiusMiles,
        location
      )
    : await fetchSongkickEventsWithoutCity(latitude, longitude, radiusMiles);

  const userLocation = { latitude, longitude };
  const events: PublicConcertEvent[] = rawEvents.map((event) => ({
    id: event.id,
    name: event.name,
    artist: event.artist,
    venue: event.venue,
    city: event.city,
    state: event.state,
    event_date: event.event_date,
    event_time: event.event_time,
    distance_miles: distanceInMiles(userLocation, {
      latitude: event.latitude,
      longitude: event.longitude,
    }),
    ticket_url: event.ticket_url,
    image_url: event.image_url,
  }));

  return { events, source: "songkick" };
}

export class PublicEventsFetchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PublicEventsFetchError";
  }
}
