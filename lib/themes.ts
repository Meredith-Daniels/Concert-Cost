export const DAISY_THEMES = [
  "light",
  "dark",
  "cupcake",
  "synthwave",
  "retro",
  "forest",
  "night",
  "dim",
] as const;

export type DaisyTheme = (typeof DAISY_THEMES)[number];

export const THEME_STORAGE_KEY = "concert-cost-theme";
