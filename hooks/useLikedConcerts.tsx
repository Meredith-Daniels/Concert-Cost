"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { PublicConcertEvent } from "@/lib/public-events";

type LikedConcertsContextValue = {
  likedIds: Set<string>;
  likedConcerts: PublicConcertEvent[];
  loading: boolean;
  isLiked: (externalId: string) => boolean;
  saveConcert: (concert: PublicConcertEvent) => Promise<boolean>;
  removeConcert: (externalId: string) => Promise<boolean>;
  toggleLike: (concert: PublicConcertEvent) => Promise<void>;
};

const LikedConcertsContext = createContext<LikedConcertsContextValue | null>(
  null
);

export function LikedConcertsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [likedConcerts, setLikedConcerts] = useState<PublicConcertEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLiked = useCallback(async () => {
    try {
      const response = await fetch("/api/liked-concerts");
      const data = await response.json();
      if (response.ok) {
        setLikedConcerts(data.concerts ?? []);
      }
    } catch {
      // keep existing list on network error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLiked();
  }, [loadLiked]);

  const likedIds = useMemo(
    () => new Set(likedConcerts.map((c) => c.id)),
    [likedConcerts]
  );

  const isLiked = useCallback(
    (externalId: string) => likedIds.has(externalId),
    [likedIds]
  );

  const saveConcert = useCallback(async (concert: PublicConcertEvent) => {
    let skipped = false;
    let previous: PublicConcertEvent[] = [];

    setLikedConcerts((list) => {
      if (list.some((c) => c.id === concert.id)) {
        skipped = true;
        return list;
      }
      previous = list;
      return [...list, concert].sort((a, b) =>
        a.event_date.localeCompare(b.event_date)
      );
    });

    if (skipped) return true;

    try {
      const response = await fetch("/api/liked-concerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(concert),
      });
      if (!response.ok) {
        setLikedConcerts(previous);
        return false;
      }
      return true;
    } catch {
      setLikedConcerts(previous);
      return false;
    }
  }, []);

  const removeConcert = useCallback(async (externalId: string) => {
    let previous: PublicConcertEvent[] = [];

    setLikedConcerts((list) => {
      previous = list;
      return list.filter((c) => c.id !== externalId);
    });

    try {
      const response = await fetch(
        `/api/liked-concerts/${encodeURIComponent(externalId)}`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        setLikedConcerts(previous);
        return false;
      }
      return true;
    } catch {
      setLikedConcerts(previous);
      return false;
    }
  }, []);

  const toggleLike = useCallback(
    async (concert: PublicConcertEvent) => {
      if (isLiked(concert.id)) {
        await removeConcert(concert.id);
      } else {
        await saveConcert(concert);
      }
    },
    [isLiked, removeConcert, saveConcert]
  );

  const value = useMemo(
    () => ({
      likedIds,
      likedConcerts,
      loading,
      isLiked,
      saveConcert,
      removeConcert,
      toggleLike,
    }),
    [
      likedIds,
      likedConcerts,
      loading,
      isLiked,
      saveConcert,
      removeConcert,
      toggleLike,
    ]
  );

  return (
    <LikedConcertsContext.Provider value={value}>
      {children}
    </LikedConcertsContext.Provider>
  );
}

export function useLikedConcerts() {
  const context = useContext(LikedConcertsContext);
  if (!context) {
    throw new Error("useLikedConcerts must be used within LikedConcertsProvider");
  }
  return context;
}
