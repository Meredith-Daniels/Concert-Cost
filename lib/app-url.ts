/** Public origin for OAuth redirects (local vs Vercel). */
export function getAppOrigin(): string {
  if (process.env.NEXT_PUBLIC_APP_URL?.trim()) {
    return process.env.NEXT_PUBLIC_APP_URL.trim().replace(/\/$/, "");
  }

  if (process.env.VERCEL_URL?.trim()) {
    return `https://${process.env.VERCEL_URL.trim()}`;
  }

  return "http://127.0.0.1:3000";
}

export function getSpotifyRedirectUri(): string {
  return (
    process.env.SPOTIFY_REDIRECT_URI?.trim() ??
    `${getAppOrigin()}/api/spotify/callback`
  );
}
