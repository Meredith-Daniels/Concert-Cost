import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { fetchSpotifyProfile } from "@/lib/spotify/api";
import { exchangeSpotifyCode } from "@/lib/spotify/oauth";
import { saveSpotifyConnection } from "@/lib/spotify/tokens";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const redirectBase = `${origin}/recommended`;

  if (error) {
    return NextResponse.redirect(
      `${redirectBase}?spotify_error=${encodeURIComponent(error)}`
    );
  }

  const cookieStore = await cookies();
  const storedState = cookieStore.get("spotify_oauth_state")?.value;

  if (!code || !state || !storedState || state !== storedState) {
    return NextResponse.redirect(
      `${redirectBase}?spotify_error=invalid_state`
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${origin}/login`);
  }

  try {
    const tokens = await exchangeSpotifyCode(code);
    const profile = await fetchSpotifyProfile(tokens.access_token);
    await saveSpotifyConnection(user.id, tokens, profile.id);

    const response = NextResponse.redirect(`${redirectBase}?spotify_connected=1`);
    response.cookies.set("spotify_oauth_state", "", {
      httpOnly: true,
      maxAge: 0,
      path: "/",
    });
    return response;
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Spotify connection failed.";
    return NextResponse.redirect(
      `${redirectBase}?spotify_error=${encodeURIComponent(message)}`
    );
  }
}
