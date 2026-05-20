export type SpotifyArtist = {
  id: string;
  name: string;
  popularity?: number;
};

export type SpotifyTopArtistsResponse = {
  items: SpotifyArtist[];
};

export type SpotifyTrack = {
  id: string;
  name: string;
  artists: SpotifyArtist[];
};

export type SpotifyTopTracksResponse = {
  items: SpotifyTrack[];
};

export type SpotifyRecentlyPlayedItem = {
  track: {
    artists: { id: string; name: string }[];
  };
};

export type SpotifyRecentlyPlayedResponse = {
  items: SpotifyRecentlyPlayedItem[];
};

export type SpotifyTokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope?: string;
  token_type: string;
};

export type SpotifyUserProfile = {
  id: string;
  display_name: string | null;
};

export type TasteSource =
  | "short_term"
  | "medium_term"
  | "long_term"
  | "recent"
  | "top_tracks";

export type RankedArtist = {
  name: string;
  spotify_id: string;
  score: number;
  sources: TasteSource[];
};
