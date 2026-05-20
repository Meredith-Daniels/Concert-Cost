"use client";

type RadiusSliderProps = {
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
  disabled?: boolean;
};

export function RadiusSlider({
  value,
  min = 1,
  max = 200,
  onChange,
  disabled = false,
}: RadiusSliderProps) {
  return (
    <section className="section-card">
      <section className="section-card-body gap-4">
        <header className="flex flex-wrap items-end justify-between gap-2">
          <section>
            <h3 className="section-title">Search radius</h3>
            <p className="text-sm text-base-content/70">
              Search for real shows within this distance from you
            </p>
          </section>
          <span className="rounded-full bg-primary/15 px-4 py-2 text-lg font-bold tabular-nums text-primary">
            {value} mi
          </span>
        </header>
        <label className="sr-only" htmlFor="radius-miles">
          Radius in miles
        </label>
        <input
          id="radius-miles"
          type="range"
          min={min}
          max={max}
          step={1}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(Number(e.target.value))}
          className="range range-primary range-lg w-full"
        />
        <section className="flex justify-between text-xs text-base-content/60">
          <span>{min} mi</span>
          <span>{max} mi</span>
        </section>
      </section>
    </section>
  );
}
