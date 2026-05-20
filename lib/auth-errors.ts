/** Turn Supabase auth errors into plain-English messages for students. */
export function friendlyAuthError(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes("rate limit") || lower.includes("too many")) {
    return (
      "Supabase is temporarily blocking more sign-up or login emails for this address. " +
      "Wait about an hour, try logging in if you already created an account, or use a different email. " +
      "You can also raise limits in Supabase → Authentication → Rate limits."
    );
  }

  if (lower.includes("already registered") || lower.includes("already been registered")) {
    return "That email already has an account. Use Log in instead of Sign up.";
  }

  if (lower.includes("invalid login credentials")) {
    return "Wrong email or password. Try again or use Sign up if you have not created an account yet.";
  }

  if (lower.includes("email not confirmed")) {
    return "Please confirm your email first (check your inbox), then log in.";
  }

  if (lower.includes("invalid api key")) {
    return (
      "Supabase API key problem. Check .env.local uses the anon JWT key (starts with eyJ), then restart npm run dev."
    );
  }

  return message;
}

export function authErrorVariant(
  message: string
): "error" | "warning" | "success" | "info" {
  const lower = message.toLowerCase();
  if (lower.includes("rate limit") || lower.includes("too many")) {
    return "warning";
  }
  return "error";
}
