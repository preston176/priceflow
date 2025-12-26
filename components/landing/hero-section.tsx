"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function HeroSection() {
  const scrollToFeatures = () => {
    const element = document.getElementById("features");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
      {/* macOS Tahoe Glass Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-purple-50/30 to-pink-50/40 dark:from-blue-950/20 dark:via-purple-950/20 dark:to-pink-950/20" />

      {/* Animated Glass Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse delay-1000" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Glass Card Container */}
          <div className="backdrop-blur-xl bg-white/40 dark:bg-black/20 rounded-3xl border border-white/20 dark:border-white/10 shadow-2xl p-12 md:p-16">
            <div className="text-center">
              <Badge
                variant="secondary"
                className="mb-6 text-sm px-6 py-2 backdrop-blur-md bg-white/60 dark:bg-black/40 border border-white/20 dark:border-white/10 shadow-lg"
              >
                AI-Powered Price Tracking 💰
              </Badge>

              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent leading-tight">
                Stop Overpaying.
                <br />
                Start Tracking.
              </h1>

              <p className="text-lg md:text-xl text-gray-700 dark:text-gray-300 mb-8 max-w-2xl mx-auto font-medium">
                AI-powered price monitoring across Amazon, Walmart, Target & Best Buy.
                Get alerts when deals are actually deals.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button
                  size="lg"
                  asChild
                  className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg shadow-blue-500/50 dark:shadow-blue-500/30"
                >
                  <Link href="/dashboard">Start Free</Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={scrollToFeatures}
                  className="w-full sm:w-auto backdrop-blur-md bg-white/60 dark:bg-black/40 border-white/20 dark:border-white/10 hover:bg-white/80 dark:hover:bg-black/60"
                >
                  See How It Works
                </Button>
              </div>

              {/* Feature Pills */}
              <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
                <span className="px-4 py-2 rounded-full text-sm font-medium backdrop-blur-md bg-white/50 dark:bg-black/30 border border-white/20 dark:border-white/10">
                  🤖 AI-Powered
                </span>
                <span className="px-4 py-2 rounded-full text-sm font-medium backdrop-blur-md bg-white/50 dark:bg-black/30 border border-white/20 dark:border-white/10">
                  📧 Email Alerts
                </span>
                <span className="px-4 py-2 rounded-full text-sm font-medium backdrop-blur-md bg-white/50 dark:bg-black/30 border border-white/20 dark:border-white/10">
                  💯 100% Free
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
