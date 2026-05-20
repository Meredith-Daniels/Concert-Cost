import type { Concert } from "@/lib/database.types";

export type CostFields = Pick<
  Concert,
  | "ticket_cost"
  | "ticket_fees"
  | "parking_cost"
  | "food_drink_cost"
  | "merchandise_cost"
  | "lodging_cost"
  | "travel_cost"
  | "other_cost"
>;

export const COST_CATEGORIES: {
  key: keyof CostFields;
  label: string;
}[] = [
  { key: "ticket_cost", label: "Tickets" },
  { key: "ticket_fees", label: "Ticket fees" },
  { key: "parking_cost", label: "Parking" },
  { key: "food_drink_cost", label: "Food & drink" },
  { key: "merchandise_cost", label: "Merchandise" },
  { key: "lodging_cost", label: "Hotel / lodging" },
  { key: "travel_cost", label: "Travel / gas" },
  { key: "other_cost", label: "Other" },
];

export function totalCost(concert: CostFields): number {
  return (
    Number(concert.ticket_cost) +
    Number(concert.ticket_fees) +
    Number(concert.parking_cost) +
    Number(concert.food_drink_cost) +
    Number(concert.merchandise_cost) +
    Number(concert.lodging_cost) +
    Number(concert.travel_cost) +
    Number(concert.other_cost)
  );
}

export function costPerHour(concert: Concert): number | null {
  const hours = Number(concert.hours_at_event);
  if (!hours || hours <= 0) return null;
  return totalCost(concert) / hours;
}

export function funPointsPer100(concert: Concert): number | null {
  const cost = totalCost(concert);
  if (!cost || cost <= 0) return null;
  return (concert.fun_rating / cost) * 100;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatNumber(value: number, decimals = 2): string {
  return value.toFixed(decimals);
}

export function topCostCategories(concert: Concert, limit = 3): string[] {
  return COST_CATEGORIES.filter((c) => Number(concert[c.key]) > 0)
    .sort((a, b) => Number(concert[b.key]) - Number(concert[a.key]))
    .slice(0, limit)
    .map((c) => c.label);
}

export function categoryTotals(concerts: Concert[]) {
  return COST_CATEGORIES.map((category) => ({
    name: category.label,
    value: concerts.reduce((sum, c) => sum + Number(c[category.key]), 0),
  })).filter((item) => item.value > 0);
}

export function dashboardStats(concerts: Concert[]) {
  if (concerts.length === 0) {
    return null;
  }

  const totals = concerts.map(totalCost);
  const funRatings = concerts.map((c) => c.fun_rating);
  const costPerHours = concerts
    .map(costPerHour)
    .filter((v): v is number => v !== null);
  const funPer100 = concerts
    .map(funPointsPer100)
    .filter((v): v is number => v !== null);

  const bestValue = concerts.reduce((best, c) => {
    const score = funPointsPer100(c);
    const bestScore = funPointsPer100(best);
    if (score === null) return best;
    if (bestScore === null) return c;
    return score > bestScore ? c : best;
  }, concerts[0]);

  const mostExpensive = concerts.reduce((best, c) =>
    totalCost(c) > totalCost(best) ? c : best
  );

  const highestFun = concerts.reduce((best, c) =>
    c.fun_rating > best.fun_rating ? c : best
  );

  return {
    totalConcerts: concerts.length,
    totalSpent: totals.reduce((a, b) => a + b, 0),
    averageCost: totals.reduce((a, b) => a + b, 0) / concerts.length,
    averageFun:
      funRatings.reduce((a, b) => a + b, 0) / concerts.length,
    averageCostPerHour:
      costPerHours.length > 0
        ? costPerHours.reduce((a, b) => a + b, 0) / costPerHours.length
        : null,
    bestValue,
    mostExpensive,
    highestFun,
    categoryTotals: categoryTotals(concerts),
  };
}
