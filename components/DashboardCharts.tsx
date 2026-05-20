"use client";

import type { Concert } from "@/lib/database.types";
import {
  categoryTotals,
  funPointsPer100,
  totalCost,
} from "@/lib/metrics";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const CHART_COLORS = [
  "oklch(var(--p))",
  "oklch(var(--s))",
  "oklch(var(--a))",
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#06b6d4",
  "#f97316",
];

type DashboardChartsProps = {
  concerts: Concert[];
};

function truncateLabel(label: string, max = 18) {
  return label.length > max ? `${label.slice(0, max)}…` : label;
}

function asNumber(value: unknown): number {
  return typeof value === "number" ? value : Number(value ?? 0);
}

export function DashboardCharts({ concerts }: DashboardChartsProps) {
  const categoryData = categoryTotals(concerts);

  const concertData = concerts.map((c) => ({
    name: truncateLabel(c.concert_name),
    fullName: c.concert_name,
    totalCost: totalCost(c),
    funRating: c.fun_rating,
    funPer100: funPointsPer100(c) ?? 0,
  }));

  if (concerts.length === 0) {
    return null;
  }

  return (
    <section className="grid gap-6 lg:grid-cols-2">
      <ChartCard
        title="Spending by cost category"
        description="Across all concerts"
      >
        <PieChart>
          <Pie
            data={categoryData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={90}
            label={({ name, percent }) =>
              `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`
            }
          >
            {categoryData.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={CHART_COLORS[index % CHART_COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip formatter={(value) => `$${asNumber(value).toFixed(2)}`} />
          <Legend />
        </PieChart>
      </ChartCard>

      <ChartCard title="Total cost by concert" description="Per show">
        <BarChart data={concertData}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={60} />
          <YAxis tickFormatter={(v) => `$${v}`} />
          <Tooltip
            formatter={(value) => [`$${asNumber(value).toFixed(2)}`, "Total cost"]}
            labelFormatter={(_, payload) =>
              payload?.[0]?.payload?.fullName ?? ""
            }
          />
          <Bar dataKey="totalCost" fill="oklch(var(--p))" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ChartCard>

      <ChartCard title="Fun rating by concert" description="Out of 10">
        <BarChart data={concertData}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={60} />
          <YAxis domain={[0, 10]} />
          <Tooltip
            formatter={(value) => [`${asNumber(value)} / 10`, "Fun rating"]}
            labelFormatter={(_, payload) =>
              payload?.[0]?.payload?.fullName ?? ""
            }
          />
          <Bar dataKey="funRating" fill="oklch(var(--s))" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ChartCard>

      <ChartCard title="Fun Points per $100 by concert" description="Higher is better value">
        <BarChart data={concertData}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={60} />
          <YAxis />
          <Tooltip
            formatter={(value) => [
              asNumber(value).toFixed(2),
              "Fun Points per $100",
            ]}
            labelFormatter={(_, payload) =>
              payload?.[0]?.payload?.fullName ?? ""
            }
          />
          <Bar dataKey="funPer100" fill="oklch(var(--su))" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ChartCard>
    </section>
  );
}

function ChartCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactElement;
}) {
  return (
    <article className="section-card motion-safe-transition">
      <section className="section-card-body">
        <header>
          <h3 className="section-title">{title}</h3>
          {description && (
            <p className="text-xs text-base-content/60">{description}</p>
          )}
        </header>
        <section className="h-72 w-full overflow-x-auto">
          <section className="min-w-[280px] h-full">
            <ResponsiveContainer width="100%" height="100%">
              {children}
            </ResponsiveContainer>
          </section>
        </section>
      </section>
    </article>
  );
}
