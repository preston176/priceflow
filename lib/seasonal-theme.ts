/**
 * Seasonal Theme Detection System
 * Automatically detects current season/holiday and applies appropriate theme
 */

export type SeasonalTheme =
  | "christmas"
  | "halloween"
  | "valentines"
  | "spring"
  | "summer"
  | "fall"
  | "winter"
  | "new-year";

export interface ThemeColors {
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  accent: string;
  accentForeground: string;
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  muted: string;
  mutedForeground: string;
  border: string;
}

export interface SeasonalThemeConfig {
  name: SeasonalTheme;
  displayName: string;
  light: ThemeColors;
  dark: ThemeColors;
  particles?: {
    emoji?: string[];
    count?: number;
  };
}

/**
 * Get the current seasonal theme based on date
 */
export function getCurrentSeasonalTheme(): SeasonalTheme {
  const now = new Date();
  const month = now.getMonth(); // 0-11
  const day = now.getDate();

  // New Year (Dec 26 - Jan 5)
  if ((month === 11 && day >= 26) || (month === 0 && day <= 5)) {
    return "new-year";
  }

  // Christmas Season (Dec 1 - Dec 25)
  if (month === 11 && day >= 1 && day <= 25) {
    return "christmas";
  }

  // Valentines (Feb 1 - Feb 14)
  if (month === 1 && day >= 1 && day <= 14) {
    return "valentines";
  }

  // Halloween (Oct 15 - Oct 31)
  if (month === 9 && day >= 15) {
    return "halloween";
  }

  // Spring (March 1 - May 31)
  if (month >= 2 && month <= 4) {
    return "spring";
  }

  // Summer (June 1 - August 31)
  if (month >= 5 && month <= 7) {
    return "summer";
  }

  // Fall (September 1 - October 14)
  if (month === 8 || (month === 9 && day < 15)) {
    return "fall";
  }

  // Winter (November 1 - November 30, Jan 6 - Feb 28)
  return "winter";
}

// Winter Elegance color scheme (used for all seasons)
const WINTER_ELEGANCE_LIGHT: ThemeColors = {
  primary: "180 84% 41%", // Teal-600
  primaryForeground: "0 0% 100%",
  secondary: "215 20% 40%", // Slate-700
  secondaryForeground: "0 0% 100%",
  accent: "217 91% 60%", // Blue-400
  accentForeground: "0 0% 100%",
  background: "0 0% 98%",
  foreground: "222 13% 13%",
  card: "0 0% 100%",
  cardForeground: "222 13% 13%",
  muted: "210 40% 96%",
  mutedForeground: "215 16% 47%",
  border: "214 32% 91%",
};

const WINTER_ELEGANCE_DARK: ThemeColors = {
  primary: "180 84% 41%", // Teal-600
  primaryForeground: "0 0% 100%",
  secondary: "215 20% 40%", // Slate-700
  secondaryForeground: "0 0% 100%",
  accent: "217 91% 60%", // Blue-400
  accentForeground: "0 0% 100%",
  background: "222 47% 11%", // Neutral-950
  foreground: "210 20% 98%",
  card: "215 28% 17%", // Slate-900
  cardForeground: "210 20% 98%",
  muted: "217 33% 17%", // Slate-900
  mutedForeground: "215 16% 47%", // Slate-400
  border: "215 20% 27%", // Slate-800
};

/**
 * Theme configurations for each season/holiday
 */
export const SEASONAL_THEMES: Record<SeasonalTheme, SeasonalThemeConfig> = {
  christmas: {
    name: "christmas",
    displayName: "Christmas",
    light: WINTER_ELEGANCE_LIGHT,
    dark: WINTER_ELEGANCE_DARK,
    particles: {
      emoji: ["❄️", "🎄", "⭐", "🎁", "☃️"],
      count: 20,
    },
  },

  "new-year": {
    name: "new-year",
    displayName: "New Year",
    light: WINTER_ELEGANCE_LIGHT,
    dark: WINTER_ELEGANCE_DARK,
    particles: {
      emoji: ["🎊", "🎉", "✨", "🎆", "🥳"],
      count: 25,
    },
  },

  halloween: {
    name: "halloween",
    displayName: "Halloween",
    light: WINTER_ELEGANCE_LIGHT,
    dark: WINTER_ELEGANCE_DARK,
    particles: {
      emoji: ["🎃", "👻", "🦇", "🕷️", "🕸️"],
      count: 15,
    },
  },

  valentines: {
    name: "valentines",
    displayName: "Valentine's Day",
    light: WINTER_ELEGANCE_LIGHT,
    dark: WINTER_ELEGANCE_DARK,
    particles: {
      emoji: ["💕", "💖", "💝", "💗", "❤️"],
      count: 18,
    },
  },

  spring: {
    name: "spring",
    displayName: "Spring",
    light: WINTER_ELEGANCE_LIGHT,
    dark: WINTER_ELEGANCE_DARK,
    particles: {
      emoji: ["🌸", "🌺", "🌼", "🦋", "🌷"],
      count: 12,
    },
  },

  summer: {
    name: "summer",
    displayName: "Summer",
    light: WINTER_ELEGANCE_LIGHT,
    dark: WINTER_ELEGANCE_DARK,
    particles: {
      emoji: ["☀️", "🌊", "🏖️", "🌴", "🍹"],
      count: 10,
    },
  },

  fall: {
    name: "fall",
    displayName: "Fall",
    light: WINTER_ELEGANCE_LIGHT,
    dark: WINTER_ELEGANCE_DARK,
    particles: {
      emoji: ["🍂", "🍁", "🎃", "🌰", "🦃"],
      count: 15,
    },
  },

  winter: {
    name: "winter",
    displayName: "Winter",
    light: WINTER_ELEGANCE_LIGHT,
    dark: WINTER_ELEGANCE_DARK,
    particles: {
      emoji: ["❄️", "⛄", "🌨️", "☃️", "🧊"],
      count: 18,
    },
  },
};

/**
 * Get theme configuration for current season
 */
export function getCurrentThemeConfig(): SeasonalThemeConfig {
  const theme = getCurrentSeasonalTheme();
  return SEASONAL_THEMES[theme];
}
