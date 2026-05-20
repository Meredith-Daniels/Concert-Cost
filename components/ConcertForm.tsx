"use client";

import { useMemo, useState } from "react";
import { DollarSign, Music, Smile } from "lucide-react";
import { FormField } from "@/components/FormField";
import { FeedbackAlert } from "@/components/ui/FeedbackAlert";
import { Toast } from "@/components/ui/Toast";
import { createClient } from "@/lib/supabase/client";
import { COST_CATEGORIES, formatCurrency, totalCost } from "@/lib/metrics";

const emptyForm = {
  concert_name: "",
  artist: "",
  venue: "",
  city: "",
  state: "",
  concert_date: "",
  distance_from_home: "",
  hours_at_event: "",
  ticket_cost: "0",
  ticket_fees: "0",
  parking_cost: "0",
  food_drink_cost: "0",
  merchandise_cost: "0",
  lodging_cost: "0",
  travel_cost: "0",
  other_cost: "0",
  fun_rating: "7",
  notes: "",
};

const inputClass =
  "input input-bordered input-md w-full focus:input-primary sm:input-md";

function CostInput({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <FormField label={label} htmlFor={id}>
      <label className="input input-bordered input-md flex items-center gap-2 focus-within:input-primary">
        <span className="text-base-content/50">$</span>
        <input
          id={id}
          type="number"
          min="0"
          step="0.01"
          className="grow bg-transparent outline-none"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </label>
    </FormField>
  );
}

export function ConcertForm() {
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);

  const liveTotal = useMemo(() => {
    const costs = COST_CATEGORIES.reduce(
      (acc, cat) => {
        acc[cat.key] = Number(form[cat.key as keyof typeof form] || 0);
        return acc;
      },
      {} as Record<(typeof COST_CATEGORIES)[number]["key"], number>
    );
    return totalCost(costs as Parameters<typeof totalCost>[0]);
  }, [form]);

  function updateField(name: string, value: string) {
    setForm((prev) => ({ ...prev, [name]: value }));
    setShowToast(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setShowToast(false);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("You need to be logged in to save a concert.");
      setLoading(false);
      return;
    }

    const hours = Number(form.hours_at_event);
    if (!hours || hours <= 0) {
      setError(
        "Please enter how many hours you were at the event (must be greater than 0)."
      );
      setLoading(false);
      return;
    }

    const venue = form.venue.trim();
    const city = form.city.trim();
    const state = form.state.trim();

    const { data: inserted, error: insertError } = await supabase
      .from("concerts")
      .insert({
        user_id: user.id,
        concert_name: form.concert_name.trim(),
        artist: form.artist.trim(),
        venue,
        city,
        state,
        concert_date: form.concert_date,
        distance_from_home: form.distance_from_home
          ? Number(form.distance_from_home)
          : null,
        hours_at_event: hours,
        ticket_cost: Number(form.ticket_cost || 0),
        ticket_fees: Number(form.ticket_fees || 0),
        parking_cost: Number(form.parking_cost || 0),
        food_drink_cost: Number(form.food_drink_cost || 0),
        merchandise_cost: Number(form.merchandise_cost || 0),
        lodging_cost: Number(form.lodging_cost || 0),
        travel_cost: Number(form.travel_cost || 0),
        other_cost: Number(form.other_cost || 0),
        fun_rating: Number(form.fun_rating),
        notes: form.notes.trim() || null,
      })
      .select("id")
      .single();

    setLoading(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    if (inserted?.id) {
      void fetch("/api/concerts/geocode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          concert_id: inserted.id,
          venue,
          city,
          state,
        }),
      });
    }

    setForm(emptyForm);
    setShowToast(true);
  }

  return (
    <>
      <Toast
        message="Concert saved!"
        show={showToast}
        onClose={() => setShowToast(false)}
      />

      <form
        onSubmit={handleSubmit}
        className={`section-gap relative ${loading ? "pointer-events-none opacity-70" : ""}`}
      >
        {loading && (
          <section className="absolute inset-0 z-20 flex items-center justify-center rounded-2xl bg-base-100/60 backdrop-blur-sm">
            <span className="loading loading-spinner loading-lg text-primary" />
          </section>
        )}

        {error && (
          <FeedbackAlert
            variant="error"
            message={error}
            onDismiss={() => setError(null)}
          />
        )}

        <article className="section-card border-l-4 border-l-primary">
          <section className="section-card-body gap-4">
            <header className="flex items-center gap-2">
              <Music className="h-5 w-5 text-primary" aria-hidden />
              <h2 className="section-title">Concert details</h2>
            </header>
            <section className="space-y-3">
              <FormField label="Concert name" htmlFor="concert_name" required>
                <input
                  id="concert_name"
                  className={inputClass}
                  value={form.concert_name}
                  onChange={(e) => updateField("concert_name", e.target.value)}
                  required
                />
              </FormField>
              <FormField label="Artist or band" htmlFor="artist" required>
                <input
                  id="artist"
                  className={inputClass}
                  value={form.artist}
                  onChange={(e) => updateField("artist", e.target.value)}
                  required
                />
              </FormField>
              <FormField label="Venue" htmlFor="venue" required>
                <input
                  id="venue"
                  className={inputClass}
                  value={form.venue}
                  onChange={(e) => updateField("venue", e.target.value)}
                  required
                />
              </FormField>
              <FormField label="City" htmlFor="city" required>
                <input
                  id="city"
                  className={inputClass}
                  value={form.city}
                  onChange={(e) => updateField("city", e.target.value)}
                  required
                />
              </FormField>
              <FormField label="State" htmlFor="state" required helper="e.g. MS">
                <input
                  id="state"
                  className={inputClass}
                  value={form.state}
                  onChange={(e) => updateField("state", e.target.value)}
                  required
                />
              </FormField>
              <FormField label="Concert date" htmlFor="concert_date" required>
                <input
                  id="concert_date"
                  type="date"
                  className={inputClass}
                  value={form.concert_date}
                  onChange={(e) => updateField("concert_date", e.target.value)}
                  required
                />
              </FormField>
              <FormField
                label="Distance from home"
                htmlFor="distance_from_home"
                helper="Miles (optional)"
              >
                <input
                  id="distance_from_home"
                  type="number"
                  min="0"
                  step="0.1"
                  className={inputClass}
                  value={form.distance_from_home}
                  onChange={(e) =>
                    updateField("distance_from_home", e.target.value)
                  }
                />
              </FormField>
              <FormField
                label="Hours at event"
                htmlFor="hours_at_event"
                required
                helper="Used for cost per hour"
              >
                <input
                  id="hours_at_event"
                  type="number"
                  min="0.25"
                  step="0.25"
                  className={inputClass}
                  value={form.hours_at_event}
                  onChange={(e) => updateField("hours_at_event", e.target.value)}
                  required
                />
              </FormField>
              <FormField label="Notes" htmlFor="notes" helper="Optional memories">
                <textarea
                  id="notes"
                  className="textarea textarea-bordered w-full focus:textarea-primary"
                  rows={3}
                  value={form.notes}
                  onChange={(e) => updateField("notes", e.target.value)}
                />
              </FormField>
            </section>
          </section>
        </article>

        <article className="section-card border-l-4 border-l-secondary">
          <section className="section-card-body gap-4">
            <header className="flex flex-wrap items-center justify-between gap-3">
              <section className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-secondary" aria-hidden />
                <h2 className="section-title">Costs</h2>
              </section>
              <aside className="sticky top-20 z-10 rounded-xl bg-primary/10 px-4 py-2 shadow-sm ring-1 ring-primary/20">
                <p className="text-xs font-medium text-base-content/70">
                  Estimated total
                </p>
                <p className="text-xl font-bold tabular-nums text-primary">
                  {formatCurrency(liveTotal)}
                </p>
              </aside>
            </header>
            <p className="text-sm text-base-content/70">
              Enter amounts for each category. Leave blank or 0 if it does not
              apply.
            </p>
            <section className="grid gap-3 md:grid-cols-2">
              {COST_CATEGORIES.map((cat) => (
                <CostInput
                  key={cat.key}
                  id={cat.key}
                  label={cat.label}
                  value={String(form[cat.key as keyof typeof form])}
                  onChange={(v) => updateField(cat.key, v)}
                />
              ))}
            </section>
          </section>
        </article>

        <article className="section-card border-l-4 border-l-accent">
          <section className="section-card-body gap-4">
            <header className="flex items-center gap-2">
              <Smile className="h-5 w-5 text-accent" aria-hidden />
              <h2 className="section-title">Fun rating</h2>
            </header>
            <FormField label="How fun was it?" htmlFor="fun_rating" required>
              <section className="space-y-3">
                <input
                  id="fun_rating"
                  type="range"
                  min={1}
                  max={10}
                  step={1}
                  className="range range-primary range-lg w-full"
                  value={form.fun_rating}
                  onChange={(e) => updateField("fun_rating", e.target.value)}
                />
                <section className="flex justify-between gap-2 text-xs">
                  <span className="max-w-[7rem] text-base-content/60">
                    1 — Terrible Time
                  </span>
                  <span className="rounded-full bg-primary/15 px-3 py-1 text-sm font-bold text-primary">
                    {form.fun_rating} / 10
                  </span>
                  <span className="max-w-[7rem] text-right text-base-content/60">
                    10 — Best Time Ever
                  </span>
                </section>
              </section>
            </FormField>
          </section>
        </article>

        <button
          type="submit"
          className="btn btn-primary btn-lg btn-block btn-interactive min-h-12"
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="loading loading-spinner loading-sm" />
              Saving...
            </>
          ) : (
            "Save concert"
          )}
        </button>
      </form>
    </>
  );
}
