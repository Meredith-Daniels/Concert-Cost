import { NextResponse } from "next/server";
import { geocodeVenue } from "@/lib/geocode";
import { createClient } from "@/lib/supabase/server";

type GeocodeBody = {
  concert_id: string;
  venue: string;
  city: string;
  state: string;
};

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: GeocodeBody;
  try {
    body = (await request.json()) as GeocodeBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { concert_id, venue, city, state } = body;
  if (!concert_id || !venue?.trim() || !city?.trim() || !state?.trim()) {
    return NextResponse.json(
      { error: "concert_id, venue, city, and state are required." },
      { status: 400 }
    );
  }

  const coords = await geocodeVenue(venue.trim(), city.trim(), state.trim());
  if (!coords) {
    return NextResponse.json(
      { error: "Could not geocode this venue." },
      { status: 422 }
    );
  }

  const { error } = await supabase
    .from("concerts")
    .update({
      venue_latitude: coords.latitude,
      venue_longitude: coords.longitude,
    })
    .eq("id", concert_id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    venue_latitude: coords.latitude,
    venue_longitude: coords.longitude,
  });
}
