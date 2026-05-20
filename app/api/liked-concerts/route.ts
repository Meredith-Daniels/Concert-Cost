import { NextResponse } from "next/server";
import {
  getLikedConcertsForUser,
  publicEventToLikedInsert,
} from "@/lib/liked-concerts";
import type { PublicConcertEvent } from "@/lib/public-events";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const concerts = await getLikedConcertsForUser();
  return NextResponse.json({ concerts });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let concert: PublicConcertEvent;
  try {
    concert = (await request.json()) as PublicConcertEvent;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!concert?.id || !concert?.name || !concert?.event_date) {
    return NextResponse.json(
      { error: "Concert id, name, and event_date are required." },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("liked_concerts")
    .insert(publicEventToLikedInsert(user.id, concert))
    .select("id, external_event_id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({
        saved: true,
        external_event_id: concert.id,
        already_saved: true,
      });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    saved: true,
    id: data.id,
    external_event_id: data.external_event_id,
  });
}
