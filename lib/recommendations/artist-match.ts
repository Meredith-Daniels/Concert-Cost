/** Normalize artist names for fuzzy matching. */
export function normalizeArtistName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/^the\s+/i, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export type ArtistMatchResult = {
  matched_artist: string;
  match_strength: "exact" | "strong" | "partial";
  rank_score: number;
  popularity_bonus: number;
};

function tokenize(name: string): string[] {
  return normalizeArtistName(name).split(" ").filter((t) => t.length > 1);
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Avoid false positives like "Ty Myers" matching the word "party". */
export function textContainsArtistName(
  text: string,
  artistName: string
): boolean {
  const normalizedText = normalizeArtistName(text);
  const normalizedArtist = normalizeArtistName(artistName);
  if (!normalizedText || !normalizedArtist) return false;
  if (normalizedText === normalizedArtist) return true;

  const phrase = escapeRegex(normalizedArtist).replace(/\s+/g, "\\s+");
  const phraseRe = new RegExp(`(?:^|\\s)${phrase}(?:\\s|$)`);
  if (phraseRe.test(normalizedText)) return true;

  const artistTokens = tokenize(artistName);
  const textTokens = new Set(tokenize(text));

  if (artistTokens.length >= 2) {
    const overlap = artistTokens.filter((t) => textTokens.has(t));
    return overlap.length >= Math.min(2, artistTokens.length);
  }

  if (artistTokens.length === 1) {
    const token = artistTokens[0];
    return token.length >= 4 && textTokens.has(token);
  }

  return false;
}

export function matchArtistInText(
  text: string,
  rankedArtists: { name: string; score: number; popularity?: number }[]
): ArtistMatchResult | null {
  const normalizedText = normalizeArtistName(text);
  if (!normalizedText) return null;

  let best: ArtistMatchResult | null = null;

  for (const artist of rankedArtists) {
    const normalizedArtist = normalizeArtistName(artist.name);
    if (!normalizedArtist) continue;

    let match_strength: ArtistMatchResult["match_strength"] | null = null;

    if (normalizedText === normalizedArtist) {
      match_strength = "exact";
    } else if (textContainsArtistName(text, artist.name)) {
      const artistTokens = tokenize(artist.name);
      const textTokens = tokenize(text);
      const overlap = artistTokens.filter((t) => textTokens.includes(t));
      if (overlap.length >= Math.min(2, artistTokens.length)) {
        match_strength = "strong";
      } else if (normalizedArtist.length >= 4) {
        match_strength = "partial";
      }
    }

    if (!match_strength) continue;

    const strengthScore =
      match_strength === "exact" ? 1 : match_strength === "strong" ? 0.85 : 0.65;
    const popularity_bonus = (artist.popularity ?? 50) / 100;
    const rank_score = artist.score * strengthScore;

    const candidate: ArtistMatchResult = {
      matched_artist: artist.name,
      match_strength,
      rank_score,
      popularity_bonus,
    };

    if (!best || rank_score > best.rank_score) {
      best = candidate;
    }
  }

  return best;
}
