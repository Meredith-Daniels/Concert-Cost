import { NextResponse } from "next/server";
import { isSpotifyConfigured } from "@/lib/spotify/config";
import { getSpotifyConnection } from "@/lib/spotify/tokens";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const connection = await getSpotifyConnection(user.id);

  return NextResponse.json({
    configured: isSpotifyConfigured(),
    connected: Boolean(connection),
    spotify_user_id: connection?.spotify_user_id ?? null,
  });
}
