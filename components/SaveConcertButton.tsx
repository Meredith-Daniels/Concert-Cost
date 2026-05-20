"use client";

import { Heart } from "lucide-react";
import { useState } from "react";
import { useLikedConcerts } from "@/hooks/useLikedConcerts";
import type { PublicConcertEvent } from "@/lib/public-events";

type SaveConcertButtonProps = {
  concert: PublicConcertEvent;
  className?: string;
};

export function SaveConcertButton({ concert, className = "" }: SaveConcertButtonProps) {
  const { isLiked, toggleLike } = useLikedConcerts();
  const [busy, setBusy] = useState(false);
  const saved = isLiked(concert.id);

  async function handleClick() {
    setBusy(true);
    try {
      await toggleLike(concert);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      className={`btn btn-sm btn-interactive gap-2 ${
        saved ? "btn-primary" : "btn-outline"
      } ${className}`}
      onClick={handleClick}
      disabled={busy}
      aria-pressed={saved}
      aria-label={saved ? "Remove from liked concerts" : "Save concert"}
    >
      {busy ? (
        <span className="loading loading-spinner loading-xs" />
      ) : (
        <Heart
          className={`h-4 w-4 ${saved ? "fill-current" : ""}`}
          aria-hidden
        />
      )}
      {saved ? "Saved" : "Save"}
    </button>
  );
}
