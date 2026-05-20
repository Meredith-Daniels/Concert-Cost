import { GLOBAL_METRO_PATHS } from "../lib/concert-events/global-metros.ts";

const artists = [
  "Kings of Leon",
  "Lorde",
  "Tame Impala",
  "Ty Myers",
  "Treaty Oak Revival",
];

function norm(s) {
  return s.toLowerCase().replace(/^the\s+/, "").replace(/[^a-z0-9\s]/g, " ").trim();
}

function matches(text, name) {
  const t = norm(text);
  const n = norm(name);
  return t.includes(n) || n.includes(t);
}

const all = [];
for (const path of GLOBAL_METRO_PATHS.slice(0, 4)) {
  await new Promise((r) => setTimeout(r, 1000));
  const res = await fetch(`https://www.songkick.com${path}`, {
    headers: { "User-Agent": "Mozilla/5.0" },
  });
  if (!res.ok) {
    console.log(path, res.status);
    continue;
  }
  const html = await res.text();
  const re =
    /<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi;
  for (const m of html.matchAll(re)) {
    try {
      const p = JSON.parse(m[1].trim());
      const arr = Array.isArray(p) ? p : [p];
      for (const e of arr) {
        if (e["@type"] !== "MusicEvent" || !e.startDate) continue;
        const date = e.startDate.slice(0, 10);
        const performer = Array.isArray(e.performer)
          ? e.performer.map((x) => x.name).join(", ")
          : e.performer?.name || "";
        const title = e.name || "";
        for (const a of artists) {
          if (matches(performer, a) || matches(title, a)) {
            all.push({ artist: a, date, title: title.slice(0, 60) });
          }
        }
      }
    } catch {}
  }
}

console.log("matches", all.length);
for (const row of all.slice(0, 15)) {
  console.log(row.date, row.artist, "-", row.title);
}
