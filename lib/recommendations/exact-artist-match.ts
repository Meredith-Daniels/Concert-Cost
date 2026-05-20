import { normalizeArtistName } from "@/lib/recommendations/artist-match";
import type { RankedArtist } from "@/lib/spotify/types";

export type EventArtistFields = {
  artist: string | null;
  name: string;
};

/** Split billed performers (e.g. "Artist A, Artist B" or "A & B"). */
export function parsePerformerList(text: string | null | undefined): string[] {
  if (!text?.trim()) return [];
  return text
    .split(/\s*,\s*|\s+&\s+|\s+(?:and|with)\s+/i)
    .map((part) => part.trim())
    .filter(Boolean);
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Full artist name appears as a billed segment (not a substring of another word). */
function phraseMatchesPerformer(performer: string, artistName: string): boolean {
  const normalizedPerformer = normalizeArtistName(performer);
  const normalizedArtist = normalizeArtistName(artistName);
  if (!normalizedPerformer || !normalizedArtist) return false;
  if (normalizedPerformer === normalizedArtist) return true;

  const phrase = escapeRegex(normalizedArtist).replace(/\s+/g, "\\s+");
  return new RegExp(`(?:^|\\s)${phrase}(?:\\s|$)`).test(normalizedPerformer);
}

/** Headliner from titles like "Kings of Leon @ Red Rocks" or "Lorde - Solar Power Tour". */
export function headlinerFromEventTitle(title: string): string | null {
  const atIndex = title.indexOf(" @ ");
  if (atIndex > 0) return title.slice(0, atIndex).trim();

  const dashMatch = title.match(/^(.+?)\s+[-–]\s+/);
  if (dashMatch?.[1]) return dashMatch[1].trim();

  return null;
}

/**
 * True only when the Spotify artist is explicitly billed on the show
 * (performer list or headliner in the title), not a fuzzy keyword hit.
 */
export function eventFeaturesArtist(
  artistName: string,
  event: EventArtistFields
): boolean {
  const performers = parsePerformerList(event.artist);
  for (const performer of performers) {
    if (phraseMatchesPerformer(performer, artistName)) return true;
  }

  const headliner = headlinerFromEventTitle(event.name);
  if (headliner && phraseMatchesPerformer(headliner, artistName)) {
    return true;
  }

  return false;
}

/** Which top Spotify artist is actually on the bill for this show (if any). */
export function findRankedArtistInEvent(
  event: EventArtistFields,
  rankedArtists: RankedArtist[]
): RankedArtist | null {
  for (const artist of rankedArtists) {
    if (eventFeaturesArtist(artist.name, event)) {
      return artist;
    }
  }
  return null;
}
