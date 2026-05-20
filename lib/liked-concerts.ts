import type { PublicConcertEvent } from "@/lib/public-events";
import type { Database } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/server";

export type LikedConcertRow = Database["public"]["Tables"]["liked_concerts"]["Row"];

export function toPublicConcertEvent(row: LikedConcertRow): PublicConcertEvent {
  return {
    id: row.external_event_id,
    name: row.name,
    artist: row.artist,
    venue: row.venue,
    city: row.city,
    state: row.state,
    event_date: row.event_date,
    event_time: row.event_time,
    distance_miles: Number(row.distance_miles ?? 0),
    ticket_url: row.ticket_url,
    image_url: row.image_url,
  };
}

export function publicEventToLikedInsert(
  userId: string,
  concert: PublicConcertEvent,
  source = concert.source ?? "songkick"
): Database["public"]["Tables"]["liked_concerts"]["Insert"] {
  return {
    user_id: userId,
    external_event_id: concert.id,
    source,
    name: concert.name,
    artist: concert.artist,
    venue: concert.venue,
    city: concert.city,
    state: concert.state,
    event_date: concert.event_date,
    event_time: concert.event_time,
    distance_miles: concert.distance_miles,
    ticket_url: concert.ticket_url,
    image_url: concert.image_url,
  };
}

export async function getLikedConcertsForUser(): Promise<PublicConcertEvent[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("liked_concerts")
    .select("*")
    .eq("user_id", user.id)
    .order("event_date", { ascending: true });

  if (error || !data) return [];

  return data.map(toPublicConcertEvent);
}

export async function getLikedExternalIdsForUser(): Promise<string[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("liked_concerts")
    .select("external_event_id")
    .eq("user_id", user.id);

  if (error || !data) return [];

  return data.map((row) => row.external_event_id);
}
