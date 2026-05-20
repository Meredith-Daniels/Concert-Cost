import { isValidCoordinates } from "@/lib/geo";

const reverseCache = new Map<string, ReverseGeocodeResult>();

export type ReverseGeocodeResult = {
  city: string;
  state: string;
  country_code: string;
  display_name: string;
};

type NominatimAddress = {
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  hamlet?: string;
  suburb?: string;
  county?: string;
  state?: string;
  region?: string;
  country_code?: string;
};

const NOMINATIM_HEADERS = {
  "User-Agent": "ConcertCostTracker/1.0 (student project; contact@localhost)",
  Accept: "application/json",
};

const REVERSE_ZOOM_LEVELS = [14, 10, 8, 16, 18];

function cacheKey(lat: number, lng: number): string {
  return `${lat.toFixed(4)},${lng.toFixed(4)}`;
}

function parseDisplayName(displayName: string): { city: string; state: string } | null {
  const parts = displayName.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length < 2) return null;

  const state = parts.find((p) => p.length === 2 && /^[A-Z]{2}$/.test(p)) ?? "";
  const stateByName =
    parts.find((p) => {
      const lower = p.toLowerCase();
      return (
        !lower.includes("county") &&
        !/^\d{5}/.test(p) &&
        p !== "United States" &&
        parts.indexOf(p) >= parts.length - 3
      );
    }) ?? "";

  const resolvedState = state || stateByName;
  if (!resolvedState) return null;

  const stateIndex = parts.indexOf(resolvedState);
  const cityCandidate =
    stateIndex > 0 ? parts[stateIndex - 1]?.replace(/ County$/, "") : "";
  if (!cityCandidate || cityCandidate.length < 2) return null;

  if (/^\d{5}/.test(cityCandidate) || cityCandidate === "United States") {
    return null;
  }

  return { city: cityCandidate, state: resolvedState };
}

function parseNominatimAddress(
  address: NominatimAddress | undefined,
  displayName?: string
): ReverseGeocodeResult | null {
  if (!address) return null;

  const city =
    address.city ??
    address.town ??
    address.village ??
    address.municipality ??
    address.suburb ??
    address.hamlet ??
    address.county?.replace(/\s+County$/i, "") ??
    "";

  const state = address.state ?? address.region ?? "";
  const country_code = (address.country_code ?? "us").toLowerCase();

  if (city && state) {
    return {
      city,
      state,
      country_code,
      display_name: displayName ?? `${city}, ${state}`,
    };
  }

  if (displayName) {
    const fromDisplay = parseDisplayName(displayName);
    if (fromDisplay) {
      return {
        city: fromDisplay.city,
        state: fromDisplay.state,
        country_code,
        display_name: displayName,
      };
    }
  }

  if (address.county && state) {
    const countyCity = address.county.replace(/\s+County$/i, "");
    return {
      city: countyCity,
      state,
      country_code,
      display_name: displayName ?? `${address.county}, ${state}`,
    };
  }

  return null;
}

async function nominatimReverse(
  latitude: number,
  longitude: number,
  zoom: number
): Promise<ReverseGeocodeResult | null> {
  const params = new URLSearchParams({
    lat: String(latitude),
    lon: String(longitude),
    format: "json",
    addressdetails: "1",
    zoom: String(zoom),
  });

  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?${params}`,
    {
      headers: NOMINATIM_HEADERS,
      cache: "no-store",
    }
  );

  if (!response.ok) return null;

  const data = (await response.json()) as {
    display_name?: string;
    address?: NominatimAddress;
  };

  return parseNominatimAddress(data.address, data.display_name);
}

async function photonReverse(
  latitude: number,
  longitude: number
): Promise<ReverseGeocodeResult | null> {
  const params = new URLSearchParams({
    lat: String(latitude),
    lon: String(longitude),
  });

  const response = await fetch(`https://photon.komoot.io/reverse?${params}`, {
    headers: NOMINATIM_HEADERS,
    cache: "no-store",
  });

  if (!response.ok) return null;

  const data = (await response.json()) as {
    features?: {
      properties?: {
        city?: string;
        town?: string;
        village?: string;
        county?: string;
        state?: string;
        countrycode?: string;
        name?: string;
      };
    }[];
  };

  const props = data.features?.[0]?.properties;
  if (!props) return null;

  return parseNominatimAddress(
    {
      city: props.city ?? props.town ?? props.village ?? props.name,
      county: props.county,
      state: props.state,
      country_code: props.countrycode,
    },
    undefined
  );
}

export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<ReverseGeocodeResult | null> {
  if (!isValidCoordinates({ latitude, longitude })) {
    return null;
  }

  const key = cacheKey(latitude, longitude);
  if (reverseCache.has(key)) {
    return reverseCache.get(key)!;
  }

  for (const zoom of REVERSE_ZOOM_LEVELS) {
    try {
      const result = await nominatimReverse(latitude, longitude, zoom);
      if (result) {
        reverseCache.set(key, result);
        return result;
      }
    } catch {
      // try next zoom
    }
  }

  try {
    const photon = await photonReverse(latitude, longitude);
    if (photon) {
      reverseCache.set(key, photon);
      return photon;
    }
  } catch {
    // fall through
  }

  return null;
}
