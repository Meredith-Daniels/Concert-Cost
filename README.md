# Concert Cost Tracker

Track concert spending, fun ratings, and value per dollar.

## Local setup

1. Copy `.env.local.example` to `.env.local` and add your Supabase keys.
2. Run `npm install` (first time only).
3. **Start the dev server** (required — the browser will show "connection failed" if this is not running):
   - **Easy (Windows):** double-click `start-dev.cmd` in the project folder, or
   - **Terminal:** `npm run dev`
4. Wait until you see `Ready` in the terminal, then open [http://127.0.0.1:3000](http://127.0.0.1:3000) (first load can take 10–20 seconds while the app compiles).

### "Connection failed" in the browser?

That means the dev server is not running. Start it with `npm run dev` or `start-dev.cmd` and leave that window open.

### Supabase Auth (one-time)

In your **Concert Cost** Supabase project:

- **Authentication → URL configuration:** Site URL `http://localhost:3000`, redirect URLs `http://localhost:3000/**`
- For easier local signup, you can turn off **Confirm email** under Email provider settings.
- If you see **email rate limit exceeded**, wait about an hour or use **Log in** (your account may already exist). You can raise limits under **Authentication → Rate limits** in Supabase.

After changing `.env.local`, stop the dev server (Ctrl+C) and run `npm run dev` again.

## Deploy to Vercel

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for a full step-by-step guide (GitHub or CLI), environment variables, Supabase/Spotify production URLs, and troubleshooting.
