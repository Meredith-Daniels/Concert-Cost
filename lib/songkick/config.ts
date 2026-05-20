export function getSongkickApiKey(): string | null {
  const key = process.env.SONGKICK_API_KEY?.trim();
  return key || null;
}

export function isSongkickApiConfigured(): boolean {
  return getSongkickApiKey() !== null;
}
