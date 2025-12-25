"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [seasonalName, setSeasonalName] = useState("Winter");

  useEffect(() => {
    setMounted(true);

    // Get theme from localStorage after mount
    const storedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    if (storedTheme) {
      setTheme(storedTheme);
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setTheme(prefersDark ? "dark" : "light");
    }

    // Get seasonal theme
    import("@/lib/seasonal-theme").then(({ getCurrentThemeConfig }) => {
      const config = getCurrentThemeConfig();
      setSeasonalName(config.displayName);
    });
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);

    // Trigger a custom event that the ThemeProvider can listen to
    window.dispatchEvent(new CustomEvent("theme-change", { detail: newTheme }));
  };

  if (!mounted) {
    // Return a placeholder during SSR
    return (
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" disabled>
          <Sun className="h-5 w-5" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground hidden sm:inline">
        {seasonalName}
      </span>
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleTheme}
        title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      >
        {theme === "light" ? (
          <Moon className="h-5 w-5" />
        ) : (
          <Sun className="h-5 w-5" />
        )}
        <span className="sr-only">Toggle theme</span>
      </Button>
    </div>
  );
}
