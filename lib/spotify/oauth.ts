import { getSpotifyConfig, SPOTIFY_SCOPES } from "@/lib/spotify/config";
import type { SpotifyTokenResponse } from "@/lib/spotify/types";

export function buildSpotifyAuthorizeUrl(state: string): string {
  const config = getSpotifyConfig();
  if (!config) {
    throw new Error("Spotify is not configured.");
  }

  const params = new URLSearchParams({
    client_id: config.clientId,
    response_type: "code",
    redirect_uri: config.redirectUri,
    scope: SPOTIFY_SCOPES,
    state,
    show_dialog: "false",
  });

  return `https://accounts.spotify.com/authorize?${params}`;
}

export async function exchangeSpotifyCode(
  code: string
): Promise<SpotifyTokenResponse> {
  const config = getSpotifyConfig();
  if (!config) {
    throw new Error("Spotify is not configured.");
  }

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: config.redirectUri,
  });

  const credentials = Buffer.from(
    `${config.clientId}:${config.clientSecret}`
  ).toString("base64");

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Spotify authorization failed: ${text.slice(0, 200)}`);
  }

  return response.json() as Promise<SpotifyTokenResponse>;
}
