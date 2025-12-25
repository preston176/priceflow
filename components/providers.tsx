"use client";

import { ThemeProvider } from "@/components/theme-provider";
import { SeasonalParticles } from "@/components/seasonal-particles";
import { Toaster } from "@/components/ui/toaster";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <SeasonalParticles />
      {children}
      <Toaster />
    </ThemeProvider>
  );
}
