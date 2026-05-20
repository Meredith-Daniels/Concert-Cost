/** Normalized upcoming show from an external provider (before public mapping). */
export type RawConcertEvent = {
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
  /** Spotify artist name used to find this show */
  source_artist_name?: string;
};
