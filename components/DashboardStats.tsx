"use client";

import { useAutoAnimate } from "@formkit/auto-animate/react";
import {
  Calendar,
  DollarSign,
  Smile,
  Ticket,
  TrendingUp,
  Trophy,
  Wallet,
} from "lucide-react";
import type { Concert } from "@/lib/database.types";
import {
  dashboardStats,
  formatCurrency,
  formatNumber,
  funPointsPer100,
  totalCost,
} from "@/lib/metrics";
import type { LucideIcon } from "lucide-react";

type DashboardStatsProps = {
  concerts: Concert[];
};

type StatItem = {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  hero?: boolean;
};

export function DashboardStats({ concerts }: DashboardStatsProps) {
  const [parent] = useAutoAnimate();
  const stats = dashboardStats(concerts);

  if (!stats) {
    return null;
  }

  const items: StatItem[] = [
    {
      label: "Total concerts",
      value: String(stats.totalConcerts),
      icon: Calendar,
    },
    {
      label: "Total spent",
      value: formatCurrency(stats.totalSpent),
      icon: DollarSign,
      hero: true,
    },
    {
      label: "Average cost per concert",
      value: formatCurrency(stats.averageCost),
      icon: Wallet,
    },
    {
      label: "Average fun rating",
      value: `${formatNumber(stats.averageFun, 1)} / 10`,
      icon: Smile,
    },
    {
      label: "Average cost per hour",
      value:
        stats.averageCostPerHour !== null
          ? formatCurrency(stats.averageCostPerHour)
          : "—",
      icon: TrendingUp,
    },
    {
      label: "Best value concert",
      value: stats.bestValue.concert_name,
      hint: funPointsPer100(stats.bestValue)
        ? `${formatNumber(funPointsPer100(stats.bestValue)!)} fun pts / $100`
        : undefined,
      icon: Trophy,
    },
    {
      label: "Most expensive concert",
      value: stats.mostExpensive.concert_name,
      hint: formatCurrency(totalCost(stats.mostExpensive)),
      icon: Ticket,
    },
    {
      label: "Highest fun rating",
      value: stats.highestFun.concert_name,
      hint: `${stats.highestFun.fun_rating} / 10`,
      icon: Smile,
    },
  ];

  return (
    <section
      ref={parent}
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      {items.map((item) => (
        <article
          key={item.label}
          className={`section-card motion-safe-transition hover:shadow-md ${
            item.hero ? "border-primary/30 bg-primary/5 sm:col-span-2" : ""
          }`}
        >
          <section className="section-card-body gap-2">
            <header className="flex items-center gap-2">
              <span className="rounded-lg bg-primary/10 p-2">
                <item.icon className="h-4 w-4 text-primary" aria-hidden />
              </span>
              <p className="text-xs font-medium uppercase tracking-wide text-base-content/60">
                {item.label}
              </p>
            </header>
            <p
              className="text-lg font-semibold leading-tight tabular-nums line-clamp-2"
              title={item.value}
            >
              {item.value}
            </p>
            {item.hint && (
              <p className="text-xs text-base-content/60">{item.hint}</p>
            )}
          </section>
        </article>
      ))}
    </section>
  );
}
