"use client";

import { Palette } from "lucide-react";
import { useEffect, useState } from "react";
import { DAISY_THEMES, THEME_STORAGE_KEY, type DaisyTheme } from "@/lib/themes";

type ThemeSelectorProps = {
  className?: string;
  compact?: boolean;
};

export function ThemeSelector({ className = "", compact = false }: ThemeSelectorProps) {
  const [theme, setTheme] = useState<DaisyTheme>("light");

  useEffect(() => {
    const stored = localStorage.getItem(THEME_STORAGE_KEY) as DaisyTheme | null;
    const current =
      stored ||
      (document.documentElement.getAttribute("data-theme") as DaisyTheme) ||
      "light";
    setTheme(current);
    document.documentElement.setAttribute("data-theme", current);
  }, []);

  function handleChange(nextTheme: string) {
    const value = nextTheme as DaisyTheme;
    setTheme(value);
    document.documentElement.setAttribute("data-theme", value);
    localStorage.setItem(THEME_STORAGE_KEY, value);
  }

  return (
    <label className={`form-control w-full max-w-xs ${className}`}>
      {!compact && (
        <div className="label">
          <span className="label-text flex items-center gap-2">
            <Palette className="h-4 w-4" aria-hidden />
            Theme
          </span>
        </div>
      )}
      <select
        className="select select-bordered select-sm w-full capitalize"
        value={theme}
        onChange={(e) => handleChange(e.target.value)}
        aria-label="Choose app theme"
      >
        {DAISY_THEMES.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
    </label>
  );
}
