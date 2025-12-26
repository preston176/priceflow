"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export default function Hero() {
  return (
    <section className="py-24 bg-neutral-950 text-white">
      <div className="container max-w-5xl mx-auto px-4">
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-semibold text-center leading-tight text-white">
          Never Overpay{" "}
          <span className="text-teal-400">
            Ever Again
          </span>
        </h1>

        <p className="text-center text-lg md:text-xl text-white/70 mt-6 max-w-3xl mx-auto">
          Enterprise-grade price tracking across Amazon, Walmart, Target & Best Buy.
          Get instant alerts when deals are actually worth it.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
          <Link href="/dashboard">
            <Button
              size="lg"
              className="bg-teal-600 hover:bg-teal-500 text-white font-semibold border-none h-14 px-8 rounded-full cursor-pointer shadow-lg shadow-teal-900/40"
            >
              Start Tracking Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <a href="#how-it-works">
            <Button
              variant="outline"
              size="lg"
              className="bg-transparent hover:bg-white/5 text-white font-semibold border-slate-700 hover:border-teal-600 h-14 px-8 rounded-full cursor-pointer"
            >
              See How It Works
            </Button>
          </a>
        </div>

        <p className="text-center text-sm text-white/50 mt-6">
          No credit card needed. Start saving in under 2 minutes.
        </p>

        {/* Trust Indicators */}
        <div className="flex flex-wrap items-center justify-center gap-8 mt-12 pt-12 border-t border-slate-800">
          <div className="text-center">
            <div className="text-3xl font-bold text-teal-400">
              4 Markets
            </div>
            <div className="text-sm text-slate-400 mt-1">Supported</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-400">
              Real-time
            </div>
            <div className="text-sm text-slate-400 mt-1">Price Updates</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-emerald-400">
              Instant
            </div>
            <div className="text-sm text-slate-400 mt-1">Email Alerts</div>
          </div>
        </div>
      </div>
    </section>
  );
}
