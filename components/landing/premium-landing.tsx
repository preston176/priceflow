"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, TrendingDown, Shield, Zap } from "lucide-react";

// Noise texture SVG component for premium feel
const NoiseTexture = () => (
  <svg className="absolute inset-0 w-full h-full opacity-[0.15] pointer-events-none">
    <filter id="noiseFilter">
      <feTurbulence
        type="fractalNoise"
        baseFrequency="0.9"
        numOctaves="4"
        stitchTiles="stitch"
      />
      <feColorMatrix type="saturate" values="0" />
    </filter>
    <rect width="100%" height="100%" filter="url(#noiseFilter)" />
  </svg>
);

// Aurora orb component
const AuroraOrb = ({ delay = 0, className = "" }: { delay?: number; className?: string }) => (
  <motion.div
    className={`absolute rounded-full blur-3xl ${className}`}
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{
      opacity: [0.3, 0.5, 0.3],
      scale: [0.8, 1, 0.8],
      x: [0, 50, 0],
      y: [0, 30, 0],
    }}
    transition={{
      duration: 15,
      delay,
      repeat: Infinity,
      ease: "easeInOut",
    }}
  />
);

export function PremiumLanding() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
      {/* Noise Texture Overlay */}
      <NoiseTexture />

      {/* Aurora Gradient Orbs */}
      <AuroraOrb
        delay={0}
        className="w-[800px] h-[800px] bg-gradient-to-br from-blue-600/30 to-cyan-500/20 top-[-200px] left-[-200px]"
      />
      <AuroraOrb
        delay={3}
        className="w-[600px] h-[600px] bg-gradient-to-br from-violet-600/25 to-blue-500/15 top-[20%] right-[-100px]"
      />
      <AuroraOrb
        delay={6}
        className="w-[700px] h-[700px] bg-gradient-to-br from-cyan-500/20 to-blue-600/25 bottom-[-150px] left-[30%]"
      />
      <AuroraOrb
        delay={9}
        className="w-[500px] h-[500px] bg-gradient-to-br from-blue-500/20 to-slate-600/15 bottom-[10%] right-[10%]"
      />

      {/* Sticky Glass Navbar */}
      <motion.nav
        className="sticky top-0 z-50 border-b border-white/10"
        style={{
          background: "rgba(15, 23, 42, 0.4)",
          backdropFilter: "blur(20px)",
          boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
        }}
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <div className="relative">
                <div
                  className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-lg blur-lg opacity-50"
                  aria-hidden="true"
                />
                <div className="relative bg-gradient-to-r from-blue-600 to-cyan-500 p-2 rounded-lg">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                PriceFlow
              </span>
            </Link>

            {/* Nav Links */}
            <div className="hidden md:flex items-center space-x-8">
              <Link
                href="#features"
                className="text-gray-300 hover:text-white transition-colors duration-300 text-sm font-medium"
              >
                Features
              </Link>
              <Link
                href="#pricing"
                className="text-gray-300 hover:text-white transition-colors duration-300 text-sm font-medium"
              >
                Pricing
              </Link>
              <Button
                asChild
                className="relative overflow-hidden group"
                style={{
                  background: "rgba(59, 130, 246, 0.2)",
                  backdropFilter: "blur(12px)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                }}
              >
                <Link href="/sign-up">
                  <span className="relative z-10 text-white">Get Started</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative z-10 container mx-auto px-6 py-20 md:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Hero Content - Left Side */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
            className="space-y-8"
          >
            {/* Glass Card Container */}
            <div
              className="relative p-12 rounded-3xl"
              style={{
                background:
                  "linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))",
                backdropFilter: "blur(40px)",
                border: "1px solid transparent",
                borderImage:
                  "linear-gradient(to bottom right, rgba(255, 255, 255, 0.4), rgba(255, 255, 255, 0.1)) 1",
                boxShadow:
                  "0 8px 32px 0 rgba(31, 38, 135, 0.37), inset 0 1px 0 0 rgba(255, 255, 255, 0.2)",
              }}
            >
              {/* Floating Badge */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="inline-flex items-center space-x-2 px-4 py-2 rounded-full mb-6"
                style={{
                  background: "rgba(59, 130, 246, 0.15)",
                  border: "1px solid rgba(59, 130, 246, 0.3)",
                  backdropFilter: "blur(12px)",
                }}
              >
                <Zap className="h-4 w-4 text-cyan-400" />
                <span className="text-sm font-medium text-cyan-100">
                  AI-Powered Price Intelligence
                </span>
              </motion.div>

              {/* Massive Editorial Headline */}
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
                <span className="bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">
                  Never Overpay
                </span>
                <br />
                <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-blue-500 bg-clip-text text-transparent">
                  Ever Again
                </span>
              </h1>

              {/* Subheadline */}
              <p className="text-xl text-gray-300 mb-8 leading-relaxed max-w-xl">
                Enterprise-grade price tracking across Amazon, Walmart, Target & Best Buy.
                Get instant alerts when deals are actually worth it.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Primary Glass Button with Glow */}
                <Button
                  asChild
                  size="lg"
                  className="relative group overflow-hidden"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(6, 182, 212, 0.3))",
                    backdropFilter: "blur(20px)",
                    border: "1px solid rgba(255, 255, 255, 0.3)",
                    boxShadow:
                      "0 0 40px rgba(59, 130, 246, 0.5), 0 8px 32px rgba(0, 0, 0, 0.3)",
                  }}
                >
                  <Link href="/sign-up" className="flex items-center">
                    <span className="relative z-10 text-white font-semibold">
                      Start Free Trial
                    </span>
                    <ArrowRight className="ml-2 h-5 w-5 relative z-10 group-hover:translate-x-1 transition-transform" />
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </Link>
                </Button>

                {/* Secondary Subtle Button */}
                <Button
                  asChild
                  variant="ghost"
                  size="lg"
                  className="text-gray-300 hover:text-white border border-white/20 hover:border-white/40 backdrop-blur-sm"
                >
                  <Link href="#features">
                    See How It Works
                  </Link>
                </Button>
              </div>

              {/* Trust Indicators */}
              <div className="flex items-center gap-6 mt-8 pt-8 border-t border-white/10">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-cyan-400" />
                  <span className="text-sm text-gray-400">Bank-level Security</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-cyan-400" />
                  <span className="text-sm text-gray-400">Real-time Tracking</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* 3D Glass Object Placeholder - Right Side */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
            className="hidden lg:flex items-center justify-center"
          >
            <div className="relative w-full h-[600px]">
              {/* Abstract Glass Sculpture */}
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                animate={{
                  rotateY: [0, 360],
                }}
                transition={{
                  duration: 30,
                  repeat: Infinity,
                  ease: "linear",
                }}
              >
                {/* Main Glass Sphere */}
                <div
                  className="w-80 h-80 rounded-full relative"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(6, 182, 212, 0.1))",
                    backdropFilter: "blur(40px)",
                    border: "2px solid rgba(255, 255, 255, 0.2)",
                    boxShadow:
                      "0 8px 64px rgba(59, 130, 246, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)",
                  }}
                >
                  {/* Inner Glow */}
                  <div className="absolute inset-8 rounded-full bg-gradient-to-br from-blue-400/30 to-cyan-500/20 blur-2xl" />

                  {/* Floating Elements */}
                  <motion.div
                    className="absolute top-10 right-10 w-20 h-20 rounded-2xl"
                    style={{
                      background: "rgba(6, 182, 212, 0.3)",
                      backdropFilter: "blur(20px)",
                      border: "1px solid rgba(255, 255, 255, 0.3)",
                      boxShadow: "0 4px 24px rgba(6, 182, 212, 0.4)",
                    }}
                    animate={{
                      y: [0, -20, 0],
                      rotate: [0, 10, 0],
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />

                  <motion.div
                    className="absolute bottom-16 left-12 w-16 h-16 rounded-full"
                    style={{
                      background: "rgba(59, 130, 246, 0.4)",
                      backdropFilter: "blur(20px)",
                      border: "1px solid rgba(255, 255, 255, 0.4)",
                      boxShadow: "0 4px 24px rgba(59, 130, 246, 0.5)",
                    }}
                    animate={{
                      y: [0, 20, 0],
                      x: [0, 10, 0],
                    }}
                    transition={{
                      duration: 5,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 1,
                    }}
                  />
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Trusted By Strip */}
      <motion.section
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.6 }}
        className="relative z-10 container mx-auto px-6 pb-20"
      >
        <div
          className="relative py-8 px-12 rounded-2xl"
          style={{
            background: "rgba(15, 23, 42, 0.3)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            boxShadow: "0 4px 24px rgba(0, 0, 0, 0.2)",
          }}
        >
          <p className="text-center text-sm text-gray-500 mb-6 uppercase tracking-wider">
            Trusted by Premium Shoppers
          </p>

          {/* Placeholder Logos */}
          <div className="flex items-center justify-center gap-12 flex-wrap opacity-40">
            {["Amazon", "Walmart", "Target", "Best Buy"].map((brand) => (
              <div key={brand} className="text-2xl font-bold text-white/60">
                {brand}
              </div>
            ))}
          </div>
        </div>
      </motion.section>
    </div>
  );
}
