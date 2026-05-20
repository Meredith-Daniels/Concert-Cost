/** @type {import('next').NextConfig} */
const nextConfig = {
  // Do not bake env here — Vercel injects NEXT_PUBLIC_* at build time from project settings.
  serverExternalPackages: ["@supabase/ssr", "@supabase/supabase-js"],
};

module.exports = nextConfig;
