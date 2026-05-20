import type { ReactNode } from "react";

type FormFieldProps = {
  label: string;
  htmlFor: string;
  helper?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
};

export function FormField({
  label,
  htmlFor,
  helper,
  required,
  children,
  className = "",
}: FormFieldProps) {
  return (
    <section
      className={`grid grid-cols-1 items-center gap-2 sm:grid-cols-[minmax(9rem,11rem)_1fr] sm:gap-x-4 ${className}`}
    >
      <label
        htmlFor={htmlFor}
        className="text-sm font-medium text-base-content/80 sm:pt-0.5"
      >
        {label}
        {required && <span className="text-error"> *</span>}
      </label>
      <section className="min-w-0">
        {children}
        {helper && (
          <p className="mt-1 text-xs text-base-content/60">{helper}</p>
        )}
      </section>
    </section>
  );
}
