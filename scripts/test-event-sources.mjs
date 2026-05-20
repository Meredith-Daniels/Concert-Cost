const artists = [
  { name: "Kings of Leon", id: "2qk9voo8lVoOVgx0OCZ6ly" },
  { name: "Lorde", id: "163tK9Wjr9P9DmM0AVkKcm" },
  { name: "Tame Impala", id: "5INjqkS1o8h1imACPrqUnB" },
];

const appId = "concert-cost-tracker";

for (const a of artists) {
  const url = `https://rest.bandsintown.com/artists/id_${a.id}/events?app_id=${appId}&date=upcoming`;
  const r = await fetch(url);
  const text = await r.text();
  console.log("\n===", a.name, "BIT", r.status, "len", text.length);
  try {
    const data = JSON.parse(text);
    if (Array.isArray(data)) {
      console.log("events", data.length);
      if (data[0]) {
        console.log("sample", data[0].datetime, data[0].venue?.name, "lat", data[0].venue?.latitude);
      }
    } else {
      console.log(text.slice(0, 120));
    }
  } catch {
    console.log(text.slice(0, 120));
  }
}
