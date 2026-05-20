import type {
  RankedArtist,
  SpotifyRecentlyPlayedResponse,
  SpotifyTopArtistsResponse,
  SpotifyTopTracksResponse,
  SpotifyUserProfile,
  TasteSource,
} from "@/lib/spotify/types";

const SPOTIFY_API = "https://api.spotify.com/v1";
/** Spotify API max per request for top artists/tracks */
export const SPOTIFY_TOP_LIMIT = 50;

async function spotifyFetch<T>(accessToken: string, path: string): Promise<T> {
  const response = await fetch(`${SPOTIFY_API}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Spotify API ${response.status}: ${text.slice(0, 200)}`);
  }

  return response.json() as Promise<T>;
}

export async function fetchSpotifyProfile(
  accessToken: string
): Promise<SpotifyUserProfile> {
  return spotifyFetch<SpotifyUserProfile>(accessToken, "/me");
}

async function fetchTopArtistsForRange(
  accessToken: string,
  timeRange: "short_term" | "medium_term" | "long_term",
  limit: number
): Promise<SpotifyTopArtistsResponse> {
  const params = new URLSearchParams({
    time_range: timeRange,
    limit: String(Math.min(limit, SPOTIFY_TOP_LIMIT)),
  });
  return spotifyFetch<SpotifyTopArtistsResponse>(
    accessToken,
    `/me/top/artists?${params}`
  );
}

async function fetchTopTracksForRange(
  accessToken: string,
  timeRange: "short_term" | "medium_term" | "long_term",
  limit: number
): Promise<SpotifyTopTracksResponse> {
  const params = new URLSearchParams({
    time_range: timeRange,
    limit: String(Math.min(limit, SPOTIFY_TOP_LIMIT)),
  });
  return spotifyFetch<SpotifyTopTracksResponse>(
    accessToken,
    `/me/top/tracks?${params}`
  );
}

export async function fetchRecentlyPlayedArtistNames(
  accessToken: string,
  limit = 50
): Promise<string[]> {
  const params = new URLSearchParams({ limit: String(Math.min(limit, 50)) });
  const data = await spotifyFetch<SpotifyRecentlyPlayedResponse>(
    accessToken,
    `/me/player/recently-played?${params}`
  );

  const names = new Set<string>();
  for (const item of data.items ?? []) {
    for (const artist of item.track?.artists ?? []) {
      if (artist.name) names.add(artist.name);
    }
  }
  return [...names];
}

const RANGE_WEIGHTS: Record<
  "short_term" | "medium_term" | "long_term" | "recent" | "top_tracks",
  number
> = {
  short_term: 1,
  medium_term: 0.75,
  long_term: 0.5,
  recent: 0.35,
  top_tracks: 0.85,
};

function addArtistToMap(
  scoreMap: Map<string, RankedArtist>,
  artist: { id: string; name: string },
  source: TasteSource,
  weight: number,
  position: number,
  total: number
) {
  const positionScore = (total - position) / total;
  const points = positionScore * weight;

  const existing = scoreMap.get(artist.id);
  if (existing) {
    existing.score += points;
    if (!existing.sources.includes(source)) {
      existing.sources.push(source);
    }
  } else {
    scoreMap.set(artist.id, {
      name: artist.name,
      spotify_id: artist.id,
      score: points,
      sources: [source],
    });
  }
}

/**
 * Top 50 artists from Spotify, blending top artists, top tracks (all time ranges),
 * and recently played.
 */
export async function buildRankedArtistsFromSpotify(
  accessToken: string
): Promise<RankedArtist[]> {
  const limit = SPOTIFY_TOP_LIMIT;

  const [
    shortArtists,
    mediumArtists,
    longArtists,
    shortTracks,
    mediumTracks,
    longTracks,
    recentNames,
  ] = await Promise.all([
    fetchTopArtistsForRange(accessToken, "short_term", limit),
    fetchTopArtistsForRange(accessToken, "medium_term", limit),
    fetchTopArtistsForRange(accessToken, "long_term", limit),
    fetchTopTracksForRange(accessToken, "short_term", limit),
    fetchTopTracksForRange(accessToken, "medium_term", limit),
    fetchTopTracksForRange(accessToken, "long_term", limit),
    fetchRecentlyPlayedArtistNames(accessToken, limit).catch(() => [] as string[]),
  ]);

  const scoreMap = new Map<string, RankedArtist>();

  function addArtistsFromList(
    artists: SpotifyTopArtistsResponse["items"],
    source: "short_term" | "medium_term" | "long_term"
  ) {
    const weight = RANGE_WEIGHTS[source];
    artists.forEach((artist, index) => {
      addArtistToMap(scoreMap, artist, source, weight, index, artists.length);
    });
  }

  addArtistsFromList(shortArtists.items ?? [], "short_term");
  addArtistsFromList(mediumArtists.items ?? [], "medium_term");
  addArtistsFromList(longArtists.items ?? [], "long_term");

  function addTracks(
    tracks: SpotifyTopTracksResponse["items"],
    timeRange: "short_term" | "medium_term" | "long_term"
  ) {
    const trackWeight = RANGE_WEIGHTS.top_tracks * RANGE_WEIGHTS[timeRange];
    tracks.forEach((track, index) => {
      for (const artist of track.artists ?? []) {
        if (!artist.id || !artist.name) continue;
        addArtistToMap(
          scoreMap,
          artist,
          "top_tracks",
          trackWeight,
          index,
          tracks.length
        );
      }
    });
  }

  addTracks(shortTracks.items ?? [], "short_term");
  addTracks(mediumTracks.items ?? [], "medium_term");
  addTracks(longTracks.items ?? [], "long_term");

  for (const name of recentNames) {
    const existing = [...scoreMap.values()].find((a) => a.name === name);
    if (existing) {
      existing.score += RANGE_WEIGHTS.recent;
      if (!existing.sources.includes("recent")) {
        existing.sources.push("recent");
      }
    } else {
      scoreMap.set(`recent-${name}`, {
        name,
        spotify_id: `recent-${name}`,
        score: RANGE_WEIGHTS.recent,
        sources: ["recent"],
      });
    }
  }

  return [...scoreMap.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, SPOTIFY_TOP_LIMIT);
}
