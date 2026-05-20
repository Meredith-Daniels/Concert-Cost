import { NextResponse } from "next/server";
import { isValidCoordinates } from "@/lib/geo";
import {
  fetchNearbyPublicConcerts,
  PublicEventsFetchError,
} from "@/lib/public-events";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 30;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = Number(searchParams.get("latitude"));
  const lng = Number(searchParams.get("longitude"));
  const radiusMiles = Number(searchParams.get("radius_miles") ?? "25");

  if (!isValidCoordinates({ latitude: lat, longitude: lng })) {
    return NextResponse.json(
      { error: "Valid latitude and longitude are required." },
      { status: 400 }
    );
  }

  if (!Number.isFinite(radiusMiles) || radiusMiles < 1 || radiusMiles > 200) {
    return NextResponse.json(
      { error: "radius_miles must be between 1 and 200." },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { events, source } = await fetchNearbyPublicConcerts(
      lat,
      lng,
      radiusMiles
    );

    return NextResponse.json({
      concerts: events,
      source,
      radius_miles: radiusMiles,
      latitude: lat,
      longitude: lng,
    });
  } catch (err) {
    if (err instanceof PublicEventsFetchError) {
      return NextResponse.json({ error: err.message }, { status: 502 });
    }
    return NextResponse.json(
      { error: "Failed to search for nearby concerts." },
      { status: 500 }
    );
  }
}
