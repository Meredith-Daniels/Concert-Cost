/**
 * Reads Supabase URL + anon key from .env.local (NEXT_PUBLIC_*).
 * Use the legacy anon JWT from Supabase → Settings → API Keys (starts with eyJ).
 */
export function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !key) {
    throw new Error(
      "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local, then restart npm run dev."
    );
  }

  if (key.startsWith("sb_publishable_")) {
    console.warn(
      "[Concert Cost] Using a publishable key may cause 'Invalid API key'. Prefer the anon JWT (eyJ...) in .env.local."
    );
  }

  return { url, key };
}
