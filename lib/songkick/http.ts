const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const MIN_INTERVAL_MS = 650;
let lastRequestAt = 0;

async function throttle(): Promise<void> {
  const now = Date.now();
  const wait = MIN_INTERVAL_MS - (now - lastRequestAt);
  if (wait > 0) {
    await new Promise((resolve) => setTimeout(resolve, wait));
  }
  lastRequestAt = Date.now();
}

export async function fetchSongkickHtml(
  url: string,
  retries = 3
): Promise<string | null> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    await throttle();

    try {
      const response = await fetch(url, {
        headers: { "User-Agent": USER_AGENT, Accept: "text/html" },
        cache: "no-store",
      });

      if (response.status === 429) {
        const backoff = 2000 * 2 ** attempt;
        await new Promise((resolve) => setTimeout(resolve, backoff));
        continue;
      }

      if (!response.ok) return null;
      return response.text();
    } catch {
      if (attempt === retries) return null;
    }
  }

  return null;
}

export async function fetchSongkickJson<T>(
  url: string,
  retries = 2
): Promise<T | null> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    await throttle();

    try {
      const response = await fetch(url, {
        headers: { Accept: "application/json", "User-Agent": USER_AGENT },
        cache: "no-store",
      });

      if (response.status === 429) {
        const backoff = 1500 * 2 ** attempt;
        await new Promise((resolve) => setTimeout(resolve, backoff));
        continue;
      }

      if (!response.ok) return null;
      return (await response.json()) as T;
    } catch {
      if (attempt === retries) return null;
    }
  }

  return null;
}
