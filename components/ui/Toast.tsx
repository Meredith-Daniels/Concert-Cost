"use client";

import { useEffect } from "react";
import { CircleCheck, X } from "lucide-react";

type ToastProps = {
  message: string;
  show: boolean;
  onClose: () => void;
  durationMs?: number;
};

export function Toast({
  message,
  show,
  onClose,
  durationMs = 3000,
}: ToastProps) {
  useEffect(() => {
    if (!show) return;
    const timer = setTimeout(onClose, durationMs);
    return () => clearTimeout(timer);
  }, [show, durationMs, onClose]);

  if (!show) return null;

  return (
    <section className="toast toast-top toast-center z-50">
      <article className="alert alert-success animate-slide-in-alert shadow-lg">
        <CircleCheck className="h-5 w-5 shrink-0" aria-hidden />
        <span>{message}</span>
        <button
          type="button"
          className="btn btn-ghost btn-xs btn-circle"
          onClick={onClose}
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </article>
    </section>
  );
}
