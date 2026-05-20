import { distanceInMiles, isConcertWithinNextYear } from "@/lib/geo";
import type { RawConcertEvent } from "@/lib/concert-events/raw";
import type { PublicConcertEvent } from "@/lib/public-events";

export function toPublicConcertEvents(
  rawEvents: RawConcertEvent[],
  userLocation?: { latitude: number; longitude: number },
  source: PublicConcertEvent["source"] = "spotify"
): PublicConcertEvent[] {
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
      source,
    }));
}
