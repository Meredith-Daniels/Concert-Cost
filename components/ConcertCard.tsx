import type { Concert } from "@/lib/database.types";
import {
  COST_CATEGORIES,
  costPerHour,
  formatCurrency,
  formatDate,
  formatNumber,
  funPointsPer100,
  topCostCategories,
  totalCost,
} from "@/lib/metrics";
import { Calendar, MapPin, Star } from "lucide-react";

type ConcertCardProps = {
  concert: Concert;
};

function funBadgeClass(rating: number): string {
  if (rating >= 8) return "badge-accent";
  if (rating >= 5) return "badge-primary";
  return "badge-ghost";
}

export function ConcertCard({ concert }: ConcertCardProps) {
  const total = totalCost(concert);
  const perHour = costPerHour(concert);
  const funPer100 = funPointsPer100(concert);
  const categories = topCostCategories(concert, 3);

  const categoryAmounts = COST_CATEGORIES.map((c) => ({
    label: c.label,
    value: Number(concert[c.key]),
  }))
    .filter((c) => c.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 3);

  return (
    <article className="section-card motion-safe-transition hover:-translate-y-0.5 hover:shadow-lg">
      <section className="section-card-body gap-3">
        <header className="flex flex-wrap items-start justify-between gap-2">
          <section>
            <h3 className="text-lg font-semibold">{concert.concert_name}</h3>
            <p className="text-sm text-base-content/70">{concert.artist}</p>
          </section>
          <span className={`badge gap-1 ${funBadgeClass(concert.fun_rating)}`}>
            <Star className="h-3 w-3" aria-hidden />
            {concert.fun_rating}/10
          </span>
        </header>

        <section className="flex flex-col gap-1 text-sm text-base-content/70">
          <p className="flex items-center gap-2">
            <MapPin className="h-4 w-4 shrink-0" aria-hidden />
            {concert.venue} · {concert.city}, {concert.state}
          </p>
          <p className="flex items-center gap-2">
            <Calendar className="h-4 w-4 shrink-0" aria-hidden />
            {formatDate(concert.concert_date)}
          </p>
        </section>

        <section className="stats stats-vertical rounded-xl bg-base-200/80 shadow-none sm:stats-horizontal">
          <article className="stat py-3">
            <p className="stat-title text-xs">Total cost</p>
            <p className="stat-value text-lg tabular-nums">
              {formatCurrency(total)}
            </p>
          </article>
          <article className="stat py-3">
            <p className="stat-title text-xs">Cost per hour</p>
            <p className="stat-value text-lg tabular-nums">
              {perHour !== null ? formatCurrency(perHour) : "—"}
            </p>
          </article>
          <article className="stat py-3">
            <p className="stat-title text-xs">Fun Points per $100</p>
            <p className="stat-value text-lg tabular-nums">
              {funPer100 !== null ? formatNumber(funPer100) : "—"}
            </p>
          </article>
        </section>

        {categoryAmounts.length > 0 && total > 0 && (
          <section>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-base-content/60">
              Top costs
            </p>
            <section className="flex h-2 overflow-hidden rounded-full bg-base-300/50">
              {categoryAmounts.map((cat, i) => (
                <span
                  key={cat.label}
                  className="h-full"
                  style={{
                    width: `${(cat.value / total) * 100}%`,
                    backgroundColor: [
                      "oklch(var(--p))",
                      "oklch(var(--s))",
                      "oklch(var(--a))",
                    ][i],
                  }}
                  title={`${cat.label}: ${formatCurrency(cat.value)}`}
                />
              ))}
            </section>
            <section className="mt-2 flex flex-wrap gap-2">
              {categories.map((label) => (
                <span key={label} className="badge badge-outline badge-sm">
                  {label}
                </span>
              ))}
            </section>
          </section>
        )}

        {concert.notes && (
          <p className="rounded-xl bg-base-200/80 p-3 text-sm italic text-base-content/80">
            {concert.notes}
          </p>
        )}
      </section>
    </article>
  );
}
