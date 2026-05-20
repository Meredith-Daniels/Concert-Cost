/** Public Bandsintown app id (required query param; not a secret). */
export function getBandsintownAppId(): string {
  return process.env.BANDSINTOWN_APP_ID?.trim() || "concert-cost-tracker";
}
