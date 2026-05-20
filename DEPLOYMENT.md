# Deploy Concert Cost Tracker to Vercel

This project is **Next.js 16** (App Router) with **TypeScript**, **Tailwind/daisyUI**, **Supabase** auth/database, and **API routes** under `app/api/`. Vercel is the recommended host and detects Next.js automatically.

## Build status

| Item | Value |
|------|--------|
| Framework | Next.js 16.2.6 |
| Build command | `npm run build` |
| Output | Managed by Vercel (not a static `out/` export) |
| `vercel.json` | **Not required** (optional notes below) |
| Local build | Run `npm run build` — must pass before deploy |

---

## Step 1 — Prerequisites

1. [GitHub](https://github.com) account (for Git integration), **or** [Vercel CLI](https://vercel.com/docs/cli).
2. [Vercel](https://vercel.com) account (free Hobby tier works).
3. [Supabase](https://supabase.com) project already used locally.
4. (Optional) [Spotify Developer](https://developer.spotify.com/dashboard) app for For You recommendations.
5. (Optional) [Ticketmaster Discovery API](https://developer.ticketmaster.com/) key for faster/more For You results.

Install **Git** if you use GitHub deploy: [https://git-scm.com/download/win](https://git-scm.com/download/win)

---

## Step 2 — Push code to GitHub

From the project folder:

```bash
git init
git add .
git commit -m "Prepare for Vercel deployment"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/concert-cost.git
git push -u origin main
```

Do **not** commit `.env.local` (it is in `.gitignore`). Secrets go only in Vercel.

---

## Step 3 — Create the Vercel project (GitHub)

1. Go to [vercel.com/new](https://vercel.com/new).
2. **Import** your GitHub repository.
3. Vercel should detect **Next.js** automatically:

   | Setting | Value |
   |---------|--------|
   | Framework Preset | Next.js |
   | Root Directory | `.` (leave default) |
   | Build Command | `npm run build` (default) |
   | Output Directory | *(leave empty — default)* |
   | Install Command | `npm install` (default) |

4. **Do not deploy yet** — add environment variables first (Step 4).

---

## Step 4 — Environment variables on Vercel

In the Vercel project: **Settings → Environment Variables**. Add these for **Production** (and Preview if you want):

### Required

| Name | Description |
|------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (`https://xxxx.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase **anon** public JWT (Settings → API Keys) |
| `NEXT_PUBLIC_APP_URL` | Your live URL, e.g. `https://concert-cost.vercel.app` (no trailing slash) |

### Spotify (for For You / recommendations)

| Name | Description |
|------|-------------|
| `SPOTIFY_CLIENT_ID` | From Spotify Developer Dashboard |
| `SPOTIFY_CLIENT_SECRET` | From Spotify Developer Dashboard |
| `SPOTIFY_REDIRECT_URI` | `https://YOUR_VERCEL_DOMAIN/api/spotify/callback` |

If you omit `SPOTIFY_REDIRECT_URI`, the app uses `https://$VERCEL_URL/api/spotify/callback` on Vercel.

### Optional

| Name | Description |
|------|-------------|
| `TICKETMASTER_API_KEY` | More/faster concert listings on For You |
| `BANDSINTOWN_APP_ID` | Defaults to `concert-cost-tracker` |
| `SONGKICK_API_KEY` | Optional Songkick API |

Copy values from your local `.env.local` where applicable, but **update URLs** to your Vercel domain (not `127.0.0.1`).

---

## Step 5 — Configure Supabase for production

In **Supabase → Authentication → URL configuration**:

1. **Site URL:** `https://YOUR_VERCEL_DOMAIN`
2. **Redirect URLs:** add:
   - `https://YOUR_VERCEL_DOMAIN/**`
   - `https://YOUR_VERCEL_DOMAIN/auth/callback`

Save changes.

Ensure database migrations have been applied to this Supabase project (run SQL from `supabase/migrations/` in the Supabase SQL editor if you have not already).

---

## Step 6 — Configure Spotify for production

In [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) → your app → **Settings**:

1. **Redirect URIs:** add  
   `https://YOUR_VERCEL_DOMAIN/api/spotify/callback`
2. Remove or keep local URI `http://127.0.0.1:3000/api/spotify/callback` for local dev.

Match `SPOTIFY_REDIRECT_URI` in Vercel exactly.

---

## Step 7 — Deploy

1. Click **Deploy** in Vercel (or push to `main` if already connected).
2. Wait for the build log to show **Build Completed**.
3. Open the production URL (e.g. `https://concert-cost-xxx.vercel.app`).

### Deploy with Vercel CLI (alternative)

```bash
npm i -g vercel
cd "path/to/Concert-Cost"
vercel login
vercel link
vercel env pull .env.local   # optional: pull remote env for local testing
vercel --prod
```

Add environment variables with `vercel env add` or in the dashboard before `vercel --prod`.

---

## Step 8 — Verify the live site

Checklist:

- [ ] Home/login loads (no blank page or 500)
- [ ] Sign up / log in works (Supabase redirect URLs correct)
- [ ] Dashboard and **My Concerts** load after login
- [ ] **Nearby** returns concerts (may take a few seconds)
- [ ] **For You** works after Spotify connect (first load can take 10–30s)
- [ ] Static assets (icons, styles) load — no broken CSS

---

## API routes (serverless)

These run as Vercel serverless functions:

| Route | Purpose |
|-------|---------|
| `/api/concerts/nearby` | Nearby shows (geolocation) |
| `/api/concerts/recommended` | Spotify-based recommendations |
| `/api/concerts/geocode` | Venue geocoding |
| `/api/liked-concerts` | Saved concerts |
| `/api/spotify/*` | Spotify OAuth |
| `/auth/callback` | Supabase auth callback |

**Timeouts:** Hobby plan functions max out at **10 seconds**. The For You route is configured for up to **60s** (`maxDuration`), which requires **Vercel Pro** for long runs. On Hobby, add `TICKETMASTER_API_KEY` for faster results, or upgrade to Pro if For You times out.

---

## Troubleshooting

### Build fails on Vercel

- Run `npm run build` locally and fix TypeScript/eslint errors first.
- Ensure **Node 20+** (Vercel default is fine).

### “Invalid API key” on login

- `NEXT_PUBLIC_SUPABASE_ANON_KEY` must be the **anon JWT**, not the service role key.
- Redeploy after changing env vars.

### Spotify connect fails

- Redirect URI in Spotify must match `SPOTIFY_REDIRECT_URI` / `NEXT_PUBLIC_APP_URL` exactly (https, no trailing slash on domain).
- Redeploy after env changes.

### For You returns 504 / timeout

- Hobby plan 10s limit — add `TICKETMASTER_API_KEY` or use Vercel Pro.
- First request scans city listings; later requests use cache and are faster.

### CSS or assets missing

- Do not set Output Directory to `out` unless you enable `output: 'export'` in `next.config.ts` (this app does **not** use static export).

### Middleware warning in build log

- Next.js 16 may log a middleware deprecation notice; deployment still works.

---

## Optional: `vercel.json`

Not required for this project. Vercel auto-configures Next.js. Use only if you need custom headers or redirects later.

---

## Confirmation

The app is **ready to publish** when:

1. `npm run build` succeeds locally.
2. All **required** env vars are set on Vercel.
3. Supabase and Spotify redirect URLs include your production domain.
4. A test deploy loads login, auth, and at least one API route successfully.
