const tests = [
  "https://api.seatgeek.com/2/events?performers.slug=kings-of-leon&per_page=3&client_id=MTY0IndTOFw5MgTbsNUdWjdrY2ZxZzQ3N1lBOHE2OTVZMVQ5",
  "https://api.seatgeek.com/2/events?q=Lorde&per_page=3",
];
for (const url of tests) {
  const r = await fetch(url);
  const t = await r.text();
  console.log(url.includes("client") ? "with client" : "no client", r.status, t.slice(0, 150));
}
