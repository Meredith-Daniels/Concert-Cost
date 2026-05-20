const UA = "ConcertCostTracker/1.0 (student project)";
const BASE = "https://www.songkick.com";

async function fetchHtml(path) {
  const r = await fetch(`${BASE}${path}`, {
    headers: { "User-Agent": UA, Accept: "text/html" },
  });
  console.log(path, "status", r.status);
  return r.ok ? r.text() : null;
}

async function test(artist) {
  const searchHtml = await fetchHtml(`/search?query=${encodeURIComponent(artist)}`);
  if (!searchHtml) return;
  const m = searchHtml.match(/\/artists\/(\d+-[a-z0-9-]+)/i);
  console.log(artist, "artist path", m?.[0] ?? "NONE");
  if (!m) return;
  const cal = await fetchHtml(`/artists/${m[1]}/calendar`);
  if (!cal) return;
  const ld = [
    ...cal.matchAll(
      /<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi
    ),
  ];
  console.log(artist, "json-ld blocks", ld.length);
  let musicEvents = 0;
  let withGeo = 0;
  for (const match of ld) {
    try {
      const parsed = JSON.parse(match[1].trim());
      const arr = Array.isArray(parsed) ? parsed : [parsed];
      for (const e of arr) {
        if (e["@type"] === "MusicEvent") {
          musicEvents++;
          const lat = e.location?.geo?.latitude;
          if (lat != null) withGeo++;
          if (musicEvents <= 2) {
            console.log("  sample", e.name, e.startDate, "geo", lat);
          }
        }
      }
    } catch {
      // ignore
    }
  }
  console.log(artist, "MusicEvents", musicEvents, "withGeo", withGeo);
  const concertLinks = cal.match(/\/concerts\/\d+/g);
  console.log(
    artist,
    "concert links in html",
    concertLinks ? new Set(concertLinks).size : 0
  );
}

for (const a of ["Kings of Leon", "Lorde", "Tame Impala"]) {
  await test(a);
}
