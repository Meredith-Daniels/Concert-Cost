"use client";

import { LikedConcertsProvider } from "@/hooks/useLikedConcerts";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return <LikedConcertsProvider>{children}</LikedConcertsProvider>;
}
