import { getSpotifyRedirectUri } from "@/lib/app-url";

export function getSpotifyConfig() {
  const clientId = process.env.SPOTIFY_CLIENT_ID?.trim();
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET?.trim();
  const redirectUri = getSpotifyRedirectUri();

  if (!clientId || !clientSecret) {
    return null;
  }

  return { clientId, clientSecret, redirectUri };
}

export const SPOTIFY_SCOPES = [
  "user-top-read",
  "user-read-recently-played",
].join(" ");

export function isSpotifyConfigured(): boolean {
  return getSpotifyConfig() !== null;
}
