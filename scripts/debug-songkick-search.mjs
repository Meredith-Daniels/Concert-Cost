const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const BASE = "https://www.songkick.com";

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchHtml(path) {
  await sleep(2000);
  const r = await fetch(`${BASE}${path}`, {
    headers: { "User-Agent": UA, Accept: "text/html" },
  });
  console.log(path, r.status);
  if (!r.ok) return null;
  return r.text();
}

function extractArtists(html) {
  const results = [];
  const re =
    /href="(\/artists\/(\d+)-([^"]+))"[^>]*>[\s\S]*?<\/a>/gi;
  for (const m of html.matchAll(re)) {
    results.push({ path: m[1], id: m[2], slug: m[3] });
  }
  return results;
}

async function main() {
  const name = "Kings of Leon";
  const html = await fetchHtml(`/search?query=${encodeURIComponent(name)}`);
  if (!html) return;

  const artists = extractArtists(html);
  console.log("found", artists.length, "artist links");
  const want = slugify(name);
  for (const a of artists.slice(0, 15)) {
    console.log(a.slug, a.path, a.slug.includes(want) || want.includes(a.slug));
  }

  const best =
    artists.find((a) => a.slug === want) ||
    artists.find((a) => a.slug.includes(want) || want.includes(a.slug));
  console.log("best", best);

  if (best) {
    const cal = await fetchHtml(`${best.path}/calendar`);
    if (!cal) return;
    const events = cal.match(/\/concerts\/\d+-/g);
    console.log("concert links", events ? new Set(events).size : 0);
    const ld = [
      ...cal.matchAll(
        /<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi
      ),
    ];
    let count = 0;
    for (const block of ld) {
      try {
        const p = JSON.parse(block[1].trim());
        const arr = Array.isArray(p) ? p : [p];
        count += arr.filter((e) => e["@type"] === "MusicEvent").length;
      } catch {}
    }
    console.log("jsonld MusicEvents", count);
  }
}

main();
