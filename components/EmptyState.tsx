import { Music2 } from "lucide-react";
import Link from "next/link";

type EmptyStateProps = {
  title?: string;
  message?: string;
  showAddLink?: boolean;
};

export function EmptyState({
  title = "No concerts yet",
  message = "No concerts logged yet. Add your first concert to start seeing your dashboard.",
  showAddLink = true,
}: EmptyStateProps) {
  return (
    <article className="section-card">
      <section className="card-body items-center py-12 text-center">
        <span
          className="mb-4 inline-flex rounded-full bg-primary/10 p-6 motion-safe-transition"
          aria-hidden
        >
          <Music2 className="h-12 w-12 text-primary opacity-90 [animation-duration:2s] motion-safe:animate-bounce" />
        </span>
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="mt-2 max-w-md text-sm text-base-content/70">{message}</p>
        <ol className="mt-4 max-w-sm list-inside list-decimal text-left text-sm text-base-content/70">
          <li>Add a concert with costs and fun rating</li>
          <li>See it on My Concerts</li>
          <li>Watch your Dashboard fill with charts</li>
        </ol>
        {showAddLink && (
          <Link
            href="/add"
            className="btn btn-primary btn-interactive mt-6 gap-2"
          >
            Add your first concert
          </Link>
        )}
      </section>
    </article>
  );
}
