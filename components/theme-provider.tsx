"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { getCurrentThemeConfig, type SeasonalTheme } from "@/lib/seasonal-theme";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  seasonalTheme: SeasonalTheme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [seasonalTheme, setSeasonalTheme] = useState<SeasonalTheme>("winter");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Get theme from localStorage or system preference
    const storedTheme = localStorage.getItem("theme") as Theme | null;
    if (storedTheme) {
      setTheme(storedTheme);
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setTheme(prefersDark ? "dark" : "light");
    }

    // Get current seasonal theme
    const currentTheme = getCurrentThemeConfig();
    setSeasonalTheme(currentTheme.name);

    // Listen for theme changes from ThemeToggle
    const handleThemeChange = (e: CustomEvent<Theme>) => {
      setTheme(e.detail);
    };

    window.addEventListener("theme-change", handleThemeChange as EventListener);

    return () => {
      window.removeEventListener("theme-change", handleThemeChange as EventListener);
    };
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;
    const themeConfig = getCurrentThemeConfig();
    const colors = theme === "dark" ? themeConfig.dark : themeConfig.light;

    // Apply theme colors as CSS variables
    root.style.setProperty("--primary", colors.primary);
    root.style.setProperty("--primary-foreground", colors.primaryForeground);
    root.style.setProperty("--secondary", colors.secondary);
    root.style.setProperty("--secondary-foreground", colors.secondaryForeground);
    root.style.setProperty("--accent", colors.accent);
    root.style.setProperty("--accent-foreground", colors.accentForeground);
    root.style.setProperty("--background", colors.background);
    root.style.setProperty("--foreground", colors.foreground);
    root.style.setProperty("--card", colors.card);
    root.style.setProperty("--card-foreground", colors.cardForeground);
    root.style.setProperty("--muted", colors.muted);
    root.style.setProperty("--muted-foreground", colors.mutedForeground);
    root.style.setProperty("--border", colors.border);

    // Additional derived colors
    root.style.setProperty("--popover", colors.card);
    root.style.setProperty("--popover-foreground", colors.cardForeground);
    root.style.setProperty("--input", colors.border);
    root.style.setProperty("--ring", colors.primary);

    // Set dark class for other dark mode styles
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    // Save to localStorage
    localStorage.setItem("theme", theme);
  }, [theme, mounted]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const value: ThemeContextType = {
    theme,
    seasonalTheme,
    setTheme,
    toggleTheme,
  };

  // Prevent flash of unstyled content
  if (!mounted) {
    return <div style={{ visibility: "hidden" }}>{children}</div>;
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
