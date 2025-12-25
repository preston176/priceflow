"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SeasonalParticles } from "../seasonal-particles";

export function HeroSection() {
  const scrollToFeatures = () => {
    const element = document.getElementById("features");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="relative py-20 md:py-32 bg-gradient-to-br from-background via-background to-secondary/20 overflow-hidden">
      <SeasonalParticles />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <Badge variant="secondary" className="mb-6 text-sm px-4 py-2">
            Smart Holiday Shopping 🎁
          </Badge>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Never Overspend on Gifts Again
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Track budgets, monitor prices, and find the perfect gifts for everyone on your list—all in one beautiful app.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" asChild className="w-full sm:w-auto">
              <Link href="/sign-up">Start Free</Link>
            </Button>
            <Button size="lg" variant="outline" onClick={scrollToFeatures} className="w-full sm:w-auto">
              See How It Works
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
