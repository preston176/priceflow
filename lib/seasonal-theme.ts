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

/**
 * Theme configurations for each season/holiday
 */
export const SEASONAL_THEMES: Record<SeasonalTheme, SeasonalThemeConfig> = {
  christmas: {
    name: "christmas",
    displayName: "Christmas",
    light: {
      primary: "0 76% 50%", // Red
      primaryForeground: "0 0% 100%",
      secondary: "145 70% 45%", // Green
      secondaryForeground: "0 0% 100%",
      accent: "355 78% 56%", // Festive red
      accentForeground: "0 0% 100%",
      background: "0 0% 98%",
      foreground: "145 15% 15%",
      card: "0 0% 100%",
      cardForeground: "145 15% 15%",
      muted: "145 30% 96%",
      mutedForeground: "145 10% 45%",
      border: "145 25% 88%",
    },
    dark: {
      primary: "0 76% 55%",
      primaryForeground: "0 0% 100%",
      secondary: "145 65% 35%",
      secondaryForeground: "0 0% 100%",
      accent: "355 78% 60%",
      accentForeground: "0 0% 100%",
      background: "145 20% 8%",
      foreground: "0 0% 95%",
      card: "145 18% 12%",
      cardForeground: "0 0% 95%",
      muted: "145 15% 20%",
      mutedForeground: "145 8% 65%",
      border: "145 15% 25%",
    },
    particles: {
      emoji: ["❄️", "🎄", "⭐", "🎁", "☃️"],
      count: 20,
    },
  },

  "new-year": {
    name: "new-year",
    displayName: "New Year",
    light: {
      primary: "280 85% 60%", // Purple
      primaryForeground: "0 0% 100%",
      secondary: "45 100% 55%", // Gold
      secondaryForeground: "0 0% 10%",
      accent: "330 85% 60%", // Pink
      accentForeground: "0 0% 100%",
      background: "0 0% 98%",
      foreground: "280 15% 15%",
      card: "0 0% 100%",
      cardForeground: "280 15% 15%",
      muted: "280 30% 96%",
      mutedForeground: "280 10% 45%",
      border: "280 25% 88%",
    },
    dark: {
      primary: "280 85% 65%",
      primaryForeground: "0 0% 100%",
      secondary: "45 95% 60%",
      secondaryForeground: "0 0% 10%",
      accent: "330 85% 65%",
      accentForeground: "0 0% 100%",
      background: "280 20% 8%",
      foreground: "0 0% 95%",
      card: "280 18% 12%",
      cardForeground: "0 0% 95%",
      muted: "280 15% 20%",
      mutedForeground: "280 8% 65%",
      border: "280 15% 25%",
    },
    particles: {
      emoji: ["🎊", "🎉", "✨", "🎆", "🥳"],
      count: 25,
    },
  },

  halloween: {
    name: "halloween",
    displayName: "Halloween",
    light: {
      primary: "25 95% 53%", // Orange
      primaryForeground: "0 0% 10%",
      secondary: "280 65% 45%", // Purple
      secondaryForeground: "0 0% 100%",
      accent: "25 100% 60%",
      accentForeground: "0 0% 10%",
      background: "0 0% 98%",
      foreground: "280 15% 15%",
      card: "0 0% 100%",
      cardForeground: "280 15% 15%",
      muted: "25 30% 96%",
      mutedForeground: "25 10% 45%",
      border: "25 25% 88%",
    },
    dark: {
      primary: "25 95% 58%",
      primaryForeground: "0 0% 10%",
      secondary: "280 60% 40%",
      secondaryForeground: "0 0% 100%",
      accent: "25 100% 65%",
      accentForeground: "0 0% 10%",
      background: "280 25% 5%",
      foreground: "0 0% 95%",
      card: "280 20% 10%",
      cardForeground: "0 0% 95%",
      muted: "280 15% 18%",
      mutedForeground: "280 8% 65%",
      border: "280 15% 22%",
    },
    particles: {
      emoji: ["🎃", "👻", "🦇", "🕷️", "🕸️"],
      count: 15,
    },
  },

  valentines: {
    name: "valentines",
    displayName: "Valentine's Day",
    light: {
      primary: "350 85% 60%", // Pink/Red
      primaryForeground: "0 0% 100%",
      secondary: "330 75% 65%", // Light Pink
      secondaryForeground: "0 0% 100%",
      accent: "0 75% 55%", // Deep Red
      accentForeground: "0 0% 100%",
      background: "330 50% 98%",
      foreground: "350 15% 15%",
      card: "0 0% 100%",
      cardForeground: "350 15% 15%",
      muted: "330 40% 96%",
      mutedForeground: "330 10% 45%",
      border: "330 30% 88%",
    },
    dark: {
      primary: "350 85% 65%",
      primaryForeground: "0 0% 100%",
      secondary: "330 70% 55%",
      secondaryForeground: "0 0% 100%",
      accent: "0 75% 60%",
      accentForeground: "0 0% 100%",
      background: "350 20% 8%",
      foreground: "0 0% 95%",
      card: "350 18% 12%",
      cardForeground: "0 0% 95%",
      muted: "350 15% 20%",
      mutedForeground: "350 8% 65%",
      border: "350 15% 25%",
    },
    particles: {
      emoji: ["💕", "💖", "💝", "💗", "❤️"],
      count: 18,
    },
  },

  spring: {
    name: "spring",
    displayName: "Spring",
    light: {
      primary: "150 60% 50%", // Fresh Green
      primaryForeground: "0 0% 100%",
      secondary: "330 70% 65%", // Pink Blossoms
      secondaryForeground: "0 0% 100%",
      accent: "45 95% 60%", // Sunshine Yellow
      accentForeground: "0 0% 10%",
      background: "120 25% 98%",
      foreground: "150 15% 15%",
      card: "0 0% 100%",
      cardForeground: "150 15% 15%",
      muted: "120 30% 96%",
      mutedForeground: "120 10% 45%",
      border: "120 25% 88%",
    },
    dark: {
      primary: "150 55% 45%",
      primaryForeground: "0 0% 100%",
      secondary: "330 65% 55%",
      secondaryForeground: "0 0% 100%",
      accent: "45 90% 65%",
      accentForeground: "0 0% 10%",
      background: "150 15% 10%",
      foreground: "0 0% 95%",
      card: "150 12% 14%",
      cardForeground: "0 0% 95%",
      muted: "150 10% 22%",
      mutedForeground: "150 8% 65%",
      border: "150 10% 28%",
    },
    particles: {
      emoji: ["🌸", "🌺", "🌼", "🦋", "🌷"],
      count: 12,
    },
  },

  summer: {
    name: "summer",
    displayName: "Summer",
    light: {
      primary: "200 85% 50%", // Ocean Blue
      primaryForeground: "0 0% 100%",
      secondary: "45 100% 55%", // Sun Yellow
      secondaryForeground: "0 0% 10%",
      accent: "175 70% 50%", // Tropical Teal
      accentForeground: "0 0% 100%",
      background: "200 25% 98%",
      foreground: "200 15% 15%",
      card: "0 0% 100%",
      cardForeground: "200 15% 15%",
      muted: "200 30% 96%",
      mutedForeground: "200 10% 45%",
      border: "200 25% 88%",
    },
    dark: {
      primary: "200 80% 45%",
      primaryForeground: "0 0% 100%",
      secondary: "45 95% 60%",
      secondaryForeground: "0 0% 10%",
      accent: "175 65% 45%",
      accentForeground: "0 0% 100%",
      background: "200 25% 8%",
      foreground: "0 0% 95%",
      card: "200 20% 12%",
      cardForeground: "0 0% 95%",
      muted: "200 15% 20%",
      mutedForeground: "200 8% 65%",
      border: "200 15% 25%",
    },
    particles: {
      emoji: ["☀️", "🌊", "🏖️", "🌴", "🍹"],
      count: 10,
    },
  },

  fall: {
    name: "fall",
    displayName: "Fall",
    light: {
      primary: "25 85% 50%", // Orange
      primaryForeground: "0 0% 100%",
      secondary: "0 65% 45%", // Red
      secondaryForeground: "0 0% 100%",
      accent: "40 90% 50%", // Golden
      accentForeground: "0 0% 10%",
      background: "30 25% 98%",
      foreground: "25 15% 15%",
      card: "0 0% 100%",
      cardForeground: "25 15% 15%",
      muted: "30 30% 96%",
      mutedForeground: "30 10% 45%",
      border: "30 25% 88%",
    },
    dark: {
      primary: "25 80% 55%",
      primaryForeground: "0 0% 100%",
      secondary: "0 60% 50%",
      secondaryForeground: "0 0% 100%",
      accent: "40 85% 55%",
      accentForeground: "0 0% 10%",
      background: "25 20% 10%",
      foreground: "0 0% 95%",
      card: "25 18% 14%",
      cardForeground: "0 0% 95%",
      muted: "25 15% 22%",
      mutedForeground: "25 8% 65%",
      border: "25 15% 28%",
    },
    particles: {
      emoji: ["🍂", "🍁", "🎃", "🌰", "🦃"],
      count: 15,
    },
  },

  winter: {
    name: "winter",
    displayName: "Winter",
    light: {
      primary: "200 70% 55%", // Ice Blue
      primaryForeground: "0 0% 100%",
      secondary: "210 60% 50%", // Cool Blue
      secondaryForeground: "0 0% 100%",
      accent: "190 75% 60%", // Frost
      accentForeground: "0 0% 10%",
      background: "210 25% 98%",
      foreground: "210 15% 15%",
      card: "0 0% 100%",
      cardForeground: "210 15% 15%",
      muted: "210 30% 96%",
      mutedForeground: "210 10% 45%",
      border: "210 25% 88%",
    },
    dark: {
      primary: "200 65% 50%",
      primaryForeground: "0 0% 100%",
      secondary: "210 55% 45%",
      secondaryForeground: "0 0% 100%",
      accent: "190 70% 55%",
      accentForeground: "0 0% 10%",
      background: "210 20% 10%",
      foreground: "0 0% 95%",
      card: "210 18% 14%",
      cardForeground: "0 0% 95%",
      muted: "210 15% 22%",
      mutedForeground: "210 8% 65%",
      border: "210 15% 28%",
    },
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
