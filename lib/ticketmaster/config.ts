export function getTicketmasterApiKey(): string | null {
  const key = process.env.TICKETMASTER_API_KEY?.trim();
  return key || null;
}

export function isTicketmasterConfigured(): boolean {
  return getTicketmasterApiKey() !== null;
}
