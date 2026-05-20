const metros = [
  "/metro-areas/12210-us-nashville",
  "/metro-areas/7644-us-new-york-nyc",
  "/metro-areas/17835-us-los-angeles-la",
];

for (const path of metros) {
  await new Promise((r) => setTimeout(r, 1500));
  const res = await fetch(`https://www.songkick.com${path}`, {
    headers: { "User-Agent": "Mozilla/5.0" },
  });
  const html = await res.text();
  const links = html.match(/\/concerts\/\d+/g);
  console.log(path, res.status, "links", links ? new Set(links).size : 0);
}
