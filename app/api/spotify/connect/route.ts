import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { buildSpotifyAuthorizeUrl } from "@/lib/spotify/oauth";
import { isSpotifyConfigured } from "@/lib/spotify/config";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  if (!isSpotifyConfigured()) {
    const url = new URL("/recommended", request.url);
    url.searchParams.set("spotify_error", "not_configured");
    return NextResponse.redirect(url);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const state = randomBytes(16).toString("hex");
  const authorizeUrl = buildSpotifyAuthorizeUrl(state);

  const response = NextResponse.redirect(authorizeUrl);
  response.cookies.set("spotify_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  return response;
}
