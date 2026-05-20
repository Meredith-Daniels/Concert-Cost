# Vercel environment variables (concert-cost-final2)

Add these in **Vercel → Project → Settings → Environment Variables**  
Enable **Production** and **Preview** for each. Then **Redeploy**.

Copy values from your local `.env.local`, except URLs must use your live domain.

## Required

| Key | Example shape |
|-----|----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Long JWT starting with `eyJ` |
| `NEXT_PUBLIC_APP_URL` | `https://concert-cost-final2.vercel.app` (no trailing slash) |

## Spotify (For You page)

| Key | Example shape |
|-----|----------------|
| `SPOTIFY_CLIENT_ID` | From Spotify Developer Dashboard |
| `SPOTIFY_CLIENT_SECRET` | From Spotify Developer Dashboard |
| `SPOTIFY_REDIRECT_URI` | `https://concert-cost-final2.vercel.app/api/spotify/callback` |

## Supabase dashboard

**Authentication → URL configuration**

- Site URL: `https://concert-cost-final2.vercel.app`
- Redirect URLs: `https://concert-cost-final2.vercel.app/**`

## Spotify dashboard

Redirect URI: `https://concert-cost-final2.vercel.app/api/spotify/callback`
