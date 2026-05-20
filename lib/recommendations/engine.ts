import {
  eventFeaturesArtist,
  findRankedArtistInEvent,
} from "@/lib/recommendations/exact-artist-match";
import { normalizeArtistName } from "@/lib/recommendations/artist-match";
import type { PublicConcertEvent } from "@/lib/public-events";
import type { RankedArtist } from "@/lib/spotify/types";

export type RecommendedConcert = PublicConcertEvent & {
  matched_artist: string;
  match_reason: string;
  match_score: number;
};

const MAX_RECOMMENDATIONS = 100;

type BuildRecommendationsInput = {
  concerts: PublicConcertEvent[];
  rankedArtists: RankedArtist[];
  /** When > 0, proximity affects ranking; 0 = worldwide artist-based only */
  radiusMiles?: number;
};

function proximityScore(distanceMiles: number, radiusMiles: number): number {
  if (radiusMiles <= 0) return 0;
  const cap = Math.max(radiusMiles, 1);
  return Math.max(0, 1 - distanceMiles / cap);
}

function matchReasonLabel(
  artist: string,
  fromTopTracks: boolean
): string {
  if (fromTopTracks) {
    return `Your top tracks artist: ${artist}`;
  }
  return `Your top artist: ${artist}`;
}

export function buildRecommendedConcerts({
  concerts,
  rankedArtists,
  radiusMiles,
}: BuildRecommendationsInput): RecommendedConcert[] {
  if (rankedArtists.length === 0) return [];

  const artistWeights = rankedArtists.map((a, index) => ({
    name: a.name,
    score: a.score,
    popularity: 50 + Math.min(50, rankedArtists.length - index),
  }));

  const scored: RecommendedConcert[] = [];

  for (const concert of concerts) {
    const eventFields = {
      artist: concert.artist,
      name: concert.name,
    };

    let matchedProfile: RankedArtist | null = null;

    if (concert.taste_artist) {
      const taste = rankedArtists.find(
        (a) =>
          normalizeArtistName(a.name) ===
          normalizeArtistName(concert.taste_artist!)
      );
      if (
        taste &&
        eventFeaturesArtist(taste.name, eventFields)
      ) {
        matchedProfile = taste;
      }
    }

    if (!matchedProfile) {
      matchedProfile = findRankedArtistInEvent(eventFields, rankedArtists);
    }

    if (!matchedProfile) continue;

    const weight = artistWeights.find((w) => w.name === matchedProfile!.name);
    const rank_score = weight?.score ?? matchedProfile.score;
    const popularity_bonus = (weight?.popularity ?? 50) / 100;

    const useProximity = (radiusMiles ?? 0) > 0;
    const proximity = useProximity
      ? proximityScore(concert.distance_miles, radiusMiles ?? 150)
      : 0;
    const match_score = useProximity
      ? rank_score * 0.45 + popularity_bonus * 0.25 + proximity * 0.3
      : rank_score * 0.65 + popularity_bonus * 0.35;

    scored.push({
      ...concert,
      matched_artist: matchedProfile.name,
      match_reason: matchReasonLabel(
        matchedProfile.name,
        matchedProfile.sources.includes("top_tracks")
      ),
      match_score,
    });
  }

  return scored
    .sort((a, b) => {
      if (b.match_score !== a.match_score) {
        return b.match_score - a.match_score;
      }
      if (a.event_date !== b.event_date) {
        return a.event_date.localeCompare(b.event_date);
      }
      if ((radiusMiles ?? 0) > 0) {
        return a.distance_miles - b.distance_miles;
      }
      return 0;
    })
    .slice(0, MAX_RECOMMENDATIONS);
}
