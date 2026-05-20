import { NextResponse } from "next/server";
import { deleteSpotifyConnection } from "@/lib/spotify/tokens";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await deleteSpotifyConnection(user.id);
  return NextResponse.json({ disconnected: true });
}
