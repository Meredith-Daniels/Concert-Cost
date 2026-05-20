import { distanceInMiles } from "@/lib/geo";
import type { ReverseGeocodeResult } from "@/lib/reverse-geocode";

/**
 * Verified Songkick metro pages (path + center). More metros are discovered
 * via Songkick search; these seeds cover common gaps when search is ambiguous.
 */
export const SONGKICK_METRO_SEEDS = [
  { path: "/metro-areas/54252-us-oxford", latitude: 34.3665, longitude: -89.5192 },
  { path: "/metro-areas/22600-us-memphis", latitude: 35.1495, longitude: -90.049 },
] as const;

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function metroSeedsForLocation(
  location: ReverseGeocodeResult,
  latitude: number,
  longitude: number,
  radiusMiles: number
): string[] {
  const citySlug = slugify(location.city);
  const user = { latitude, longitude };
  const maxMetroDistance = radiusMiles + 40;

  const paths = new Set<string>();

  for (const seed of SONGKICK_METRO_SEEDS) {
    const pathLower = seed.path.toLowerCase();
    const country = location.country_code || "us";

    if (country === "us" && !pathLower.includes("-us-")) continue;

    const nameMatch =
      pathLower.includes(`-${citySlug}`) || pathLower.endsWith(`-${citySlug}`);

    const nearUser =
      distanceInMiles(user, {
        latitude: seed.latitude,
        longitude: seed.longitude,
      }) <= maxMetroDistance;

    if (nameMatch || nearUser) {
      paths.add(seed.path);
    }
  }

  return [...paths];
}

export function metroSeedsNearCoordinates(
  latitude: number,
  longitude: number,
  radiusMiles: number
): string[] {
  const user = { latitude, longitude };
  const maxMetroDistance = radiusMiles + 40;

  return [
    ...new Set(
      SONGKICK_METRO_SEEDS.filter(
        (seed) =>
          distanceInMiles(user, {
            latitude: seed.latitude,
            longitude: seed.longitude,
          }) <= maxMetroDistance
      ).map((seed) => seed.path)
    ),
  ];
}
