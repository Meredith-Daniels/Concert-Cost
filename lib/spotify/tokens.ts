import type { Database } from "@/lib/database.types";
import { getSpotifyConfig } from "@/lib/spotify/config";
import type { SpotifyTokenResponse } from "@/lib/spotify/types";
import { createClient } from "@/lib/supabase/server";

type SpotifyConnection = Database["public"]["Tables"]["spotify_connections"]["Row"];

async function refreshAccessToken(
  refreshToken: string
): Promise<SpotifyTokenResponse> {
  const config = getSpotifyConfig();
  if (!config) {
    throw new Error("Spotify is not configured.");
  }

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
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
    throw new Error(`Spotify token refresh failed: ${text.slice(0, 200)}`);
  }

  return response.json() as Promise<SpotifyTokenResponse>;
}

export async function saveSpotifyConnection(
  userId: string,
  tokens: SpotifyTokenResponse,
  spotifyUserId?: string
) {
  const supabase = await createClient();
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

  const row = {
    user_id: userId,
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token ?? "",
    expires_at: expiresAt,
    scope: tokens.scope ?? null,
    spotify_user_id: spotifyUserId ?? null,
    updated_at: new Date().toISOString(),
  };

  if (!row.refresh_token) {
    const { data: existing } = await supabase
      .from("spotify_connections")
      .select("refresh_token")
      .eq("user_id", userId)
      .maybeSingle();

    if (existing?.refresh_token) {
      row.refresh_token = existing.refresh_token;
    }
  }

  const { error } = await supabase
    .from("spotify_connections")
    .upsert(row, { onConflict: "user_id" });

  if (error) throw new Error(error.message);
}

export async function deleteSpotifyConnection(userId: string) {
  const supabase = await createClient();
  await supabase.from("spotify_connections").delete().eq("user_id", userId);
}

export async function getSpotifyConnection(
  userId: string
): Promise<SpotifyConnection | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("spotify_connections")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) return null;
  return data;
}

export async function getValidSpotifyAccessToken(
  userId: string
): Promise<string | null> {
  const connection = await getSpotifyConnection(userId);
  if (!connection) return null;

  const expiresAt = new Date(connection.expires_at).getTime();
  const bufferMs = 60_000;

  if (Date.now() < expiresAt - bufferMs) {
    return connection.access_token;
  }

  try {
    const refreshed = await refreshAccessToken(connection.refresh_token);
    await saveSpotifyConnection(userId, {
      ...refreshed,
      refresh_token: refreshed.refresh_token ?? connection.refresh_token,
    });
    return refreshed.access_token;
  } catch {
    await deleteSpotifyConnection(userId);
    return null;
  }
}
