const EARTH_RADIUS_MILES = 3958.8;

export type Coordinates = {
  latitude: number;
  longitude: number;
};

/** Great-circle distance in miles between two points. */
export function distanceInMiles(
  from: Coordinates,
  to: Coordinates
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(to.latitude - from.latitude);
  const dLon = toRad(to.longitude - from.longitude);
  const lat1 = toRad(from.latitude);
  const lat2 = toRad(to.latitude);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_MILES * c;
}

export function isValidCoordinates(coords: Partial<Coordinates>): coords is Coordinates {
  const { latitude, longitude } = coords;
  if (latitude == null || longitude == null) return false;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return false;
  if (latitude < -90 || latitude > 90) return false;
  if (longitude < -180 || longitude > 180) return false;
  return true;
}

export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function isUpcomingConcertDate(concertDate: string): boolean {
  return concertDate >= todayIsoDate();
}

/** ISO date (YYYY-MM-DD) one year from today. */
export function oneYearFromTodayIsoDate(): string {
  const date = new Date();
  date.setFullYear(date.getFullYear() + 1);
  return date.toISOString().slice(0, 10);
}

export function isConcertWithinNextYear(concertDate: string): boolean {
  return (
    concertDate >= todayIsoDate() && concertDate <= oneYearFromTodayIsoDate()
  );
}
