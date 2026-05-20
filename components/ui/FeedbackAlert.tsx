"use client";

import { AlertCircle, CircleCheck, Info, X, AlertTriangle } from "lucide-react";

type FeedbackVariant = "error" | "success" | "warning" | "info";

type FeedbackAlertProps = {
  variant: FeedbackVariant;
  message: string;
  onDismiss?: () => void;
};

const VARIANT_STYLES: Record<FeedbackVariant, string> = {
  error: "alert-error",
  success: "alert-success",
  warning: "alert-warning",
  info: "alert-info",
};

const VARIANT_ICONS = {
  error: AlertCircle,
  success: CircleCheck,
  warning: AlertTriangle,
  info: Info,
};

export function FeedbackAlert({
  variant,
  message,
  onDismiss,
}: FeedbackAlertProps) {
  const Icon = VARIANT_ICONS[variant];

  return (
    <section
      role="alert"
      className={`alert ${VARIANT_STYLES[variant]} animate-slide-in-alert text-sm shadow-sm`}
    >
      <Icon className="h-5 w-5 shrink-0" aria-hidden />
      <span className="flex-1">{message}</span>
      {onDismiss && (
        <button
          type="button"
          className="btn btn-ghost btn-xs btn-circle"
          onClick={onDismiss}
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </section>
  );
}
