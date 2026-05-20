"use client";

import { useEffect } from "react";
import { THEME_STORAGE_KEY, type DaisyTheme } from "@/lib/themes";

export function ThemeProvider() {
  useEffect(() => {
    const stored = localStorage.getItem(THEME_STORAGE_KEY) as DaisyTheme | null;
    if (stored) {
      document.documentElement.setAttribute("data-theme", stored);
    }
  }, []);

  return null;
}
